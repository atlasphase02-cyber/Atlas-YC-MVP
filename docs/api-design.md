# Atlas API Design

## Overview

Atlas uses a hybrid API approach combining Supabase client-side queries for data access and TanStack Start server functions for AI and sensitive operations. This design prioritizes security, performance, and developer experience.

## API Architecture

### Client-Side Data Access (Supabase)
- Direct Supabase client for database queries
- Protected by Row Level Security (RLS)
- Real-time subscriptions for live updates
- Type-safe queries with TypeScript

### Server Functions (TanStack Start)
- AI-powered features (chat, interview, semantic search)
- Sensitive operations requiring service role key
- Complex business logic
- Environment variable access

### External APIs
- Lovable Cloud AI Gateway
- Supabase Auth (OAuth providers)
- Future: Third-party integrations

## API Endpoints

### Server Functions

#### AI Chat
**Endpoint**: `/api/chat`
**Method**: POST
**Auth**: Required
**Description**: Stream AI chat responses

```typescript
POST /api/chat
{
  "conversation_id": "uuid",
  "message": "string"
}

Response: Server-Sent Events (SSE) stream
```

#### AI Executive Summary
**Endpoint**: `/api/ai/executive-summary`
**Method**: POST
**Auth**: Required
**Description**: Generate executive summary for business data

```typescript
POST /api/ai/executive-summary
{
  "date_range": {
    "start": "ISO date",
    "end": "ISO date"
  }
}

Response: {
  "summary": "string",
  "key_insights": ["string"],
  "recommendations": ["string"]
}
```

#### AI Interview Summary
**Endpoint**: `/api/ai/interview-summary`
**Method**: POST
**Auth**: Required
**Description**: Generate summary and action items from interview transcript

```typescript
POST /api/ai/interview-summary
{
  "transcript": [
    {
      "role": "user|assistant",
      "content": "string",
      "at": "ISO timestamp"
    }
  ]
}

Response: {
  "summary": "string",
  "action_items": [
    {
      "title": "string",
      "priority": "high|medium|low",
      "due_date": "ISO date"
    }
  ]
}
```

#### AI Supplement Generation
**Endpoint**: `/api/ai/supplement-generate`
**Method**: POST
**Auth**: Required
**Description**: Generate supplement request content

```typescript
POST /api/ai/supplement-generate
{
  "claim_id": "uuid",
  "context": "string"
}

Response: {
  "content": "string",
  "amount_estimate": "number"
}
```

### Client-Side Queries (Supabase)

#### Claims
```typescript
// Get all claims
db.from('claims').select('*')

// Get claims with relationships
db.from('claims')
  .select('*, customers(*), carriers(*)')

// Filter by status
db.from('claims')
  .select('*')
  .eq('status', 'new')

// Real-time subscription
db.from('claims')
  .on('INSERT', payload => {
    // Handle new claim
  })
  .subscribe()
```

#### Documents
```typescript
// Get documents for a claim
db.from('documents')
  .select('*')
  .eq('claim_id', claimId)

// Semantic search
// Uses server function with vector similarity
```

#### Dashboard Metrics
```typescript
// Revenue at risk
db.from('claims')
  .select('amount_cents')
  .in('status', ['new', 'inspection_scheduled', 'waiting_on_carrier'])

// Open claims count
db.from('claims')
  .select('id', { count: 'exact' })
  .in('status', ['new', 'inspection_scheduled'])
```

## Authentication & Authorization

### Authentication Flow
1. User signs up/logs in via Supabase Auth
2. Session token stored in browser
3. All API requests include session token
4. Server functions validate session
5. RLS policies enforce data access

### Authorization Patterns
```typescript
// Client-side: RLS handles authorization
const { data } = await supabase
  .from('claims')
  .select('*')
  // RLS automatically filters to user's data

// Server-side: Check roles
const user = await supabase.auth.getUser();
const { data: roles } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.data.user.id);

if (!roles?.some(r => r.role === 'admin')) {
  throw new Error('Unauthorized');
}
```

## Error Handling

### Standard Error Response
```typescript
{
  "error": {
    "message": "User-friendly error message",
    "code": "ERROR_CODE",
    "details": "Additional context (development only)"
  }
}
```

### Error Codes
- `AUTH_REQUIRED`: User not authenticated
- `PERMISSION_DENIED`: User lacks required permissions
- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `AI_ERROR`: AI service error
- `DATABASE_ERROR`: Database operation failed

### Client-Side Error Handling
```typescript
try {
  const { data, error } = await supabase
    .from('claims')
    .insert(newClaim);
  
  if (error) throw error;
} catch (error) {
  // Handle error based on error.code
  toast.error(error.message);
}
```

## Rate Limiting

### Current Strategy
- No explicit rate limiting (Supabase handles basic limits)
- Monitor usage via Supabase dashboard
- Implement rate limiting for AI endpoints (future)

### Future Implementation
```typescript
// Rate limiting middleware for server functions
const rateLimit = new Map<string, number[]>();

function checkRateLimit(userId: string, limit: number, window: number) {
  const now = Date.now();
  const requests = rateLimit.get(userId) || [];
  
  // Remove old requests outside window
  const recent = requests.filter(t => now - t < window);
  
  if (recent.length >= limit) {
    throw new Error('Rate limit exceeded');
  }
  
  recent.push(now);
  rateLimit.set(userId, recent);
}
```

## Caching Strategy

### Client-Side Caching (TanStack Query)
```typescript
const { data } = useQuery({
  queryKey: ['claims', status],
  queryFn: () => getClaims(status),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

### Server-Side Caching
- Supabase query caching (automatic)
- AI response caching (future)
- Reference data caching (carriers, settings)

### Cache Invalidation
- Manual invalidation after mutations
- Automatic invalidation via real-time subscriptions
- Time-based expiration for static data

## Real-Time Updates

### Subscription Patterns
```typescript
// Subscribe to claim changes
const subscription = supabase
  .channel('claims-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'claims',
      filter: `created_by=eq.${userId}`
    },
    (payload) => {
      // Handle change
      queryClient.invalidateQueries(['claims']);
    }
  )
  .subscribe();
```

### Use Cases
- Live dashboard updates
- Real-time claim status changes
- New notifications
- Collaborative editing (future)

## API Versioning

### Current Strategy
- No explicit versioning (v1 implied)
- Breaking changes require migration
- Document breaking changes in changelog

### Future Versioning
```typescript
// URL-based versioning
/api/v2/chat

// Header-based versioning
Headers: {
  'API-Version': 'v2'
}
```

## Security

### Headers
```typescript
// Client requests
Headers: {
  'Authorization': `Bearer ${sessionToken}`,
  'Content-Type': 'application/json'
}

// Server responses
Headers: {
  'Content-Type': 'application/json',
  'Cache-Control': 'private, max-age=300'
}
```

### Input Validation
```typescript
// Server-side validation
import { z } from 'zod';

const chatSchema = z.object({
  conversation_id: z.uuid().optional(),
  message: z.string().min(1).max(5000),
});

function validateChatInput(input: unknown) {
  return chatSchema.parse(input);
}
```

### SQL Injection Prevention
- Use Supabase query builder (parameterized queries)
- Never concatenate user input into SQL
- Validate all inputs before database operations

## Monitoring & Logging

### Server Function Logging
```typescript
// Log important events
console.log('[AI Chat]', {
  userId,
  conversationId,
  messageLength: message.length,
  timestamp: new Date().toISOString()
});

// Log errors
console.error('[AI Chat Error]', {
  error: error.message,
  userId,
  stack: error.stack
});
```

### Performance Monitoring
- Track server function execution time
- Monitor database query performance
- Log AI API response times
- Set up alerts for slow operations

## Testing

### Unit Testing
```typescript
// Test server functions
describe('AI Chat', () => {
  it('should generate response', async () => {
    const result = await aiChatFunction({
      message: 'Test message'
    });
    expect(result).toBeDefined();
  });
});
```

### Integration Testing
```typescript
// Test API endpoints
describe('Claims API', () => {
  it('should create claim', async () => {
    const claim = await createClaim(testData);
    expect(claim).toHaveProperty('id');
  });
});
```

## Documentation

### API Documentation
- Inline code comments
- TypeScript types as documentation
- Separate API docs (this file)
- Example usage in code

### OpenAPI/Swagger (Future)
- Generate OpenAPI spec from server functions
- Interactive API documentation
- Client SDK generation

## Best Practices

### Client-Side
- Use TanStack Query for data fetching
- Implement optimistic updates
- Handle loading and error states
- Use real-time subscriptions for live data

### Server-Side
- Validate all inputs
- Use environment variables for secrets
- Implement proper error handling
- Log important events
- Keep functions focused and small

### Performance
- Minimize data transfer (select specific columns)
- Use pagination for large datasets
- Implement caching where appropriate
- Optimize database queries with indexes

### Security
- Never expose service role key to client
- Validate user permissions on server
- Use HTTPS in production
- Implement rate limiting for public endpoints

## Future Enhancements

### Planned Additions
- GraphQL API (optional)
- Webhook system for integrations
- Batch operations for efficiency
- Advanced filtering and sorting
- Export APIs (CSV, PDF)

### Scalability
- API gateway for routing
- Load balancing for server functions
- CDN for static API responses
- Caching layer (Redis)

## External Dependencies

### Lovable Cloud AI Gateway
- Base URL: Provided by Lovable
- Authentication: API key in environment
- Rate limits: Check Lovable documentation
- Fallback: Graceful degradation

### Supabase
- REST API: Automatic via client
- Real-time: WebSocket connections
- Storage: Separate API for file operations
- Auth: OAuth providers

## Migration Strategy

### Legacy API Migration
- Identify legacy endpoints
- Create new Supabase-based equivalents
- Migrate data if needed
- Update client code
- Deprecate legacy endpoints

### Breaking Changes
- Document in changelog
- Provide migration guide
- Maintain backward compatibility temporarily
- Communicate with users
