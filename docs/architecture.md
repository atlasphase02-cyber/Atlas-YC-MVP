# Atlas Architecture

## Overview

Atlas is an AI-powered operating system for insurance restoration companies. The architecture follows a modern, server-side rendered approach with real-time capabilities and AI integration.

## Core Principles

- **UI-First Development**: Build from the Lovable-generated UI, not legacy backend
- **Modular Authentication**: Supabase Auth as the single source of truth
- **Real-Time Data**: Supabase subscriptions for live updates
- **AI Integration**: Server-side AI functions for intelligent features
- **Production Ready**: Security, performance, and maintainability from day one

## Technology Stack

### Frontend
- **Framework**: TanStack Start (React SSR)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Routing**: TanStack Router
- **UI Components**: Radix UI + shadcn/ui

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **AI**: OpenAI-compatible API via Lovable Cloud

### Deployment
- **Platform**: Vercel
- **CI/CD**: GitHub Actions
- **Environment**: Lovable Cloud for secrets

## Project Structure

```
atlas/
├── src/
│   ├── assets/          # Static assets (logos, images)
│   ├── components/      # React components
│   │   ├── ui/         # shadcn/ui components
│   │   ├── app-shell.tsx
│   │   ├── atlas-assistant.tsx
│   │   └── atlas-voice.tsx
│   ├── hooks/          # Custom React hooks
│   ├── integrations/   # External service integrations
│   │   ├── lovable/    # Lovable Cloud auth
│   │   └── supabase/   # Supabase client
│   ├── lib/            # Utility functions and helpers
│   ├── routes/         # TanStack Router routes
│   │   ├── _authenticated/  # Protected routes
│   │   ├── api/        # Server functions
│   │   └── index.tsx   # Landing page
│   ├── server.ts       # SSR entry point
│   └── styles.css      # Global styles
├── public/             # Public assets
├── supabase/           # Database migrations
├── docs/               # Project documentation
└── package.json        # Dependencies
```

## Data Flow

### Authentication Flow
1. User signs up/logs in via Supabase Auth
2. Session stored in Supabase and browser
3. Protected routes check session validity
4. Server functions use service role key for privileged operations

### AI Integration Flow
1. User triggers AI feature (chat, interview, etc.)
2. Client calls server function via TanStack Start
3. Server function validates environment and permissions
4. Server calls AI API with context from database
5. Response streamed back to client for real-time display

### Real-time Updates
1. User subscribes to database changes via Supabase Realtime
2. Database changes trigger webhook to subscribed clients
3. UI updates automatically without refresh
4. Optimistic UI updates for instant feedback

## Security Model

### Authentication
- Supabase Auth handles all authentication
- Row Level Security (RLS) on all user data tables
- Service role key only used in server functions
- Session tokens refreshed automatically

### Authorization
- Role-based access control via `user_roles` table
- Admin-only routes protected by role checks
- API routes validate user permissions
- File uploads restricted by storage policies

### Data Privacy
- All user data isolated by user_id
- Encrypted connections via HTTPS
- Sensitive data never exposed to client
- Audit logging for admin actions

## Performance Considerations

### Code Splitting
- Route-based code splitting via TanStack Router
- Lazy loading of heavy components (AI, voice)
- Dynamic imports for non-critical features

### Caching Strategy
- TanStack Query for API response caching
- Supabase query caching where appropriate
- Static asset caching via CDN
- Service worker for offline capability (future)

### Bundle Optimization
- Tree shaking for unused code
- Minification in production builds
- External libraries loaded from CDN
- Image optimization via Supabase Storage

## Scalability Plan

### Database
- Supabase handles horizontal scaling
- Connection pooling via Supabase
- Read replicas for heavy read workloads (future)
- Archive old data to cold storage (future)

### Application
- Vercel edge functions for global distribution
- CDN for static assets
- Rate limiting on API routes (future)
- Queue system for heavy AI tasks (future)

## Development Workflow

1. **Lovable**: Generate/refine UI components
2. **GitHub**: Source control and collaboration
3. **Cascade**: Implementation, testing, debugging
4. **Local Test**: Verify functionality locally
5. **Git Commit**: Document changes with clear messages
6. **Vercel**: Deploy to production

## Key Decisions

### Why Supabase?
- Built-in authentication and real-time
- PostgreSQL with RLS for security
- Generous free tier for development
- Easy migration path if needed

### Why TanStack Start?
- Modern React SSR framework
- Excellent TypeScript support
- Built-in file-based routing
- Strong ecosystem (Query, Router, Table)

### Why Lovable Cloud?
- Seamless AI integration
- Environment variable management
- Easy deployment pipeline
- Good free tier for development

## Future Considerations

### Potential Enhancements
- PWA capabilities for offline use
- Mobile app via React Native
- Advanced analytics dashboard
- Custom AI model fine-tuning
- Multi-tenant support

### Technical Debt Monitoring
- Regular dependency updates
- Performance audits
- Security vulnerability scanning
- Code quality metrics
- Test coverage improvements
