# Atlas — AI Operating System for Insurance Restoration

Atlas is the AI operating system for insurance restoration companies. It sits above your existing stack — CRM, estimating, claims, photos, documents, emails, notes, supplements, team knowledge — and turns it into one connected intelligence layer.

## Features

- **AI-Powered Dashboard**: Real-time business insights with automated recommendations
- **Claims Management**: Track claims from intake to resolution with intelligent status tracking
- **Supplements**: Generate and manage supplement requests with AI assistance
- **Document Intelligence**: Semantic search across all uploaded documents
- **AI Interview**: Conversational intake system for capturing claim details
- **Voice Assistant**: Natural language interface for business operations
- **Analytics**: Comprehensive business analytics and reporting

## Tech Stack

- **Framework**: TanStack Start (React SSR)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI-compatible API via Lovable Cloud
- **Deployment**: Vercel

## Development

### Prerequisites

- Node.js 18+ and npm
- Supabase project with required environment variables

### Setup

```sh
git clone <repository-url>
cd atlas
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### Development Server

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

### Build

```sh
npm run build
npm run preview
```

### Linting & Formatting

```sh
npm run lint
npm run format
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Architecture

- **Server-Side Rendering**: TanStack Start for optimal performance
- **Database**: Supabase with Row Level Security (RLS)
- **AI Integration**: Server functions for AI-powered features
- **Real-time**: Supabase real-time subscriptions for live updates

## License

Private — All rights reserved
