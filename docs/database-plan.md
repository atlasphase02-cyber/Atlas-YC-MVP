# Atlas Database Plan

## Overview

Atlas uses Supabase (PostgreSQL) as the primary database. The schema is designed around the UI requirements, not legacy backend assumptions. All user data is protected by Row Level Security (RLS) policies.

## Design Principles

- **UI-First Schema**: Design tables based on what the UI needs, not legacy structures
- **Security First**: RLS policies on all user data tables from day one
- **Minimal Viable Schema**: Start with essential tables, expand as needed
- **Type Safety**: Use Supabase types for TypeScript integration
- **Audit Trail**: Track important changes for compliance and debugging

## Core Tables

### Authentication Tables (Supabase Managed)

#### `auth.users`
- Managed by Supabase Auth
- Contains user authentication data
- Extended via `public.profiles` table

#### `public.profiles`
```sql
- id: uuid (references auth.users)
- email: text
- full_name: text
- company_name: text
- created_at: timestamp
- updated_at: timestamp
```
- Extends Supabase auth users
- Stores additional user profile information
- One-to-one with auth.users

### User Management

#### `public.user_roles`
```sql
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- role: text (enum: admin, user, adjuster)
- created_at: timestamp
```
- Role-based access control
- One user can have multiple roles
- Used for authorization checks

### Core Business Data

#### `public.customers`
```sql
- id: uuid (primary key)
- name: text (not null)
- email: text
- phone: text
- address: text
- created_at: timestamp
- updated_at: timestamp
- created_by: uuid (references auth.users)
```
- Customer/property owner information
- Linked to claims and supplements
- RLS: Users can only see customers they created or are assigned to

#### `public.carriers`
```sql
- id: uuid (primary key)
- name: text (not null)
- contact_email: text
- contact_phone: text
- created_at: timestamp
- updated_at: timestamp
```
- Insurance carrier information
- Linked to claims
- RLS: All authenticated users can read (shared reference data)

#### `public.claims`
```sql
- id: uuid (primary key)
- customer_id: uuid (references customers)
- carrier_id: uuid (references carriers)
- status: text (enum: new, inspection_scheduled, inspection_complete, waiting_on_carrier, supplement_pending, supplement_submitted, approved, denied, closed)
- amount_cents: integer
- loss_date: date
- created_at: timestamp
- updated_at: timestamp
- created_by: uuid (references auth.users)
- assigned_to: uuid (references auth.users)
```
- Main claim records
- Status workflow for claim lifecycle
- RLS: Users can only see claims they created or are assigned to

#### `public.supplements`
```sql
- id: uuid (primary key)
- claim_id: uuid (references claims)
- status: text (enum: draft, submitted, approved, denied)
- total_cents: integer
- description: text
- created_at: timestamp
- updated_at: timestamp
- created_by: uuid (references auth.users)
```
- Supplement requests for claims
- Linked to parent claim
- RLS: Users can only see supplements for claims they have access to

#### `public.documents`
```sql
- id: uuid (primary key)
- claim_id: uuid (references claims, nullable)
- customer_id: uuid (references customers, nullable)
- title: text (not null)
- file_path: text (not null) - Supabase Storage path
- file_type: text
- file_size: integer
- uploaded_at: timestamp
- uploaded_by: uuid (references auth.users)
- embedding_vector: vector (1536) - for semantic search
```
- Document storage and metadata
- Stored in Supabase Storage, metadata in database
- Embedding vector for AI-powered semantic search
- RLS: Users can only see documents they uploaded or have access to via claims/customers

### AI Features

#### `public.conversations`
```sql
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- title: text
- pinned: boolean (default: false)
- archived_at: timestamp (nullable)
- last_message_at: timestamp
- created_at: timestamp
```
- AI conversation history
- User-specific conversations
- Support for pinning and archiving
- RLS: Users can only see their own conversations

#### `public.chat_messages`
```sql
- id: uuid (primary key)
- conversation_id: uuid (references conversations)
- role: text (enum: system, user, assistant)
- content: text (not null)
- created_at: timestamp
```
- Individual chat messages
- Linked to conversations
- RLS: Users can only see messages in their conversations

#### `public.interviews`
```sql
- id: uuid (primary key)
- owner_id: uuid (references auth.users)
- title: text
- status: text (enum: in_progress, completed)
- transcript: jsonb - array of interview turns
- summary: text (nullable)
- action_items: jsonb - array of action items
- created_at: timestamp
- updated_at: timestamp
```
- AI interview sessions for claim intake
- Structured transcript data
- Generated summary and action items
- RLS: Users can only see their own interviews

### Scheduling

#### `public.appointments`
```sql
- id: uuid (primary key)
- title: text (not null)
- description: text
- starts_at: timestamp (not null)
- ends_at: timestamp (not null)
- who: text - who the appointment is with
- location: text
- claim_id: uuid (references claims, nullable)
- created_by: uuid (references auth.users)
- created_at: timestamp
```
- Calendar appointments
- Can be linked to claims
- RLS: Users can only see their own appointments

### Notifications

#### `public.notifications`
```sql
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- type: text (enum: claim_update, supplement_update, appointment_reminder, system)
- title: text (not null)
- message: text
- read: boolean (default: false)
- action_url: text (nullable)
- created_at: timestamp
```
- User notifications
- Multiple notification types
- Read/unread tracking
- RLS: Users can only see their own notifications

### Audit Trail

#### `public.audit_log`
```sql
- id: uuid (primary key)
- actor_email: text (nullable)
- action: text (not null)
- entity_type: text (nullable)
- entity_id: uuid (nullable)
- detail: jsonb (nullable)
- created_at: timestamp
```
- Audit trail for important actions
- Tracks who did what to which entities
- Admin-only access via RLS
- Used for compliance and debugging

### Settings

#### `public.settings`
```sql
- id: uuid (primary key, single row)
- name: text
- logo_url: text (nullable)
- primary_color: text (nullable)
- contact_email: text (nullable)
- contact_phone: text (nullable)
- timezone: text
- integrations: jsonb (nullable)
```
- Application-wide settings
- Single row table
- Admin-only access via RLS
- Used for branding and configuration

## Row Level Security Policies

### General Principles
- All user data tables have RLS enabled
- Policies check `auth.uid()` for user identity
- Admin users bypass RLS via service role
- Policies are tested thoroughly before deployment

### Example Policy Patterns

#### User-Own Data
```sql
CREATE POLICY "Users can see own data"
ON table_name FOR SELECT
USING (auth.uid() = created_by OR auth.uid() = assigned_to);
```

#### Role-Based Access
```sql
CREATE POLICY "Admins can see all data"
ON table_name FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

#### Shared Reference Data
```sql
CREATE POLICY "Authenticated users can read reference data"
ON carriers FOR SELECT
TO activated
USING (auth.role() = 'authenticated');
```

## Indexes

### Performance Indexes
- Foreign key indexes on all relationships
- Composite indexes for common query patterns
- GIN indexes for JSONB columns
- Vector indexes for semantic search

### Example Indexes
```sql
-- Claims by status and user
CREATE INDEX idx_claims_status_user ON claims(status, created_by);

-- Documents by claim
CREATE INDEX idx_documents_claim ON documents(claim_id);

-- Semantic search vector
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding_vector vector_cosine_ops);
```

## Migrations

### Migration Strategy
- Each schema change in a separate migration file
- Migrations are numbered and timestamped
- Never modify existing migrations
- Test migrations in development first

### Migration Files
- Located in `supabase/migrations/`
- Naming convention: `YYYYMMDDHHMMSS_description.sql`
- Use Supabase CLI for migration management

## Data Relationships

### Key Relationships
- `profiles` → `user_roles` (one-to-many)
- `customers` → `claims` (one-to-many)
- `carriers` → `claims` (one-to-many)
- `claims` → `supplements` (one-to-many)
- `claims` → `documents` (one-to-many)
- `conversations` → `chat_messages` (one-to-many)
- `users` → `appointments` (one-to-many)
- `users` → `notifications` (one-to-many)

### Cascade Rules
- Soft deletes where possible (archived_at timestamp)
- Hard deletes only for truly temporary data
- Consider impact on related records before deletion

## TypeScript Integration

### Type Generation
- Use Supabase CLI to generate TypeScript types
- Generate types after each schema change
- Import types in application code
- Use types for database queries

### Example Usage
```typescript
import { Database } from '@/types/supabase';

type Claim = Database['public']['Tables']['claims']['Row'];
type ClaimInsert = Database['public']['Tables']['claims']['Insert'];
```

## Backup and Recovery

### Backup Strategy
- Supabase automatic daily backups
- Point-in-time recovery (PITR) enabled
- Regular export of critical data
- Document backup restoration process

### Recovery Plan
- Test backup restoration quarterly
- Document recovery procedures
- Have contact for Supabase support
- Plan for data migration if needed

## Security Considerations

### Data Encryption
- Supabase handles encryption at rest
- TLS for data in transit
- Never store passwords in custom tables
- Use Supabase Auth for authentication

### API Security
- Use service role key only in server functions
- Never expose service role key to client
- Validate all user inputs
- Use parameterized queries

### Compliance
- Audit trail for sensitive operations
- Data retention policies
- User data export capabilities
- Right to be forgotten implementation

## Performance Optimization

### Query Optimization
- Use indexes effectively
- Avoid N+1 queries
- Use Supabase query builder
- Implement pagination for large datasets

### Caching Strategy
- Use Supabase query caching
- Cache reference data (carriers, settings)
- Implement client-side caching via TanStack Query
- Consider Redis for advanced caching (future)

## Monitoring

### Database Metrics
- Query performance monitoring
- Connection pool monitoring
- Storage usage tracking
- Slow query logging

### Alerts
- High CPU usage alerts
- Connection limit warnings
- Storage capacity alerts
- Error rate monitoring

## Future Enhancements

### Potential Additions
- Full-text search implementation
- Advanced analytics tables
- Reporting and aggregation tables
- Webhook delivery tracking
- Multi-tenant schema (if needed)

### Scalability Considerations
- Read replicas for heavy read workloads
- Partitioning for large tables
- Archive old data to cold storage
- Connection pooling optimization
