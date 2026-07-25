# Atlas — Deployment Checklist

## Environment

Required server secrets (Lovable Cloud → Secrets):
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (privileged server work only)
- `LOVABLE_API_KEY` (AI Gateway; auto-provisioned)

Required client vars (baked at build):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Import `assertServerEnv()` from `@/lib/env.server` inside server-fn handlers
that need hard-fail behavior on missing secrets.

## Supabase

- 8 migrations applied (see `supabase/migrations`).
- RLS enabled on every user-data table; role checks via `user_roles` +
  `has_role()` SECURITY DEFINER function.
- Storage buckets used by document upload flow exist and have correct
  policies.
- Auth providers enabled (email/password + Google via
  `lovable.auth.signInWithOAuth`).

## Routing

- Public: `/`, `/auth`, `/sitemap.xml`, `/robots.txt`.
- Authenticated (gated by `_authenticated/route.tsx`, ssr: false):
  `/app`, `/app/claims`, `/app/claims/$claimId`, `/app/customers`,
  `/app/documents`, `/app/supplements`, `/app/supplements/$supplementId`,
  `/app/adjusters`, `/app/calendar`, `/app/interview`, `/app/analytics`,
  `/app/notifications`, `/app/admin`, `/app/settings`.

## Pre-publish verification

- [ ] `bunx tsgo --noEmit` passes.
- [ ] `bun run build` succeeds.
- [ ] `curl <preview>/sitemap.xml` returns valid XML.
- [ ] `curl <preview>/robots.txt` returns expected rules.
- [ ] Sign in with email + Google works from the preview.
- [ ] AI Assistant streams a response.
- [ ] Document upload round-trips through Storage.
- [ ] Semantic search returns results.
- [ ] Admin page enforces role.

## Post-publish

- [ ] Set project slug / connect custom domain (Project settings → Domains).
- [ ] Update `BASE_URL` in `src/routes/sitemap[.]xml.ts` to the live host.
- [ ] Refresh social preview via link debugger (Facebook / X) if og:image
      changed.

## Known limitations

- `BASE_URL` in the sitemap is intentionally empty until a domain is set.
- Atlas Voice + Assistant bundles are large; C2 will lazy-load them.
- No end-to-end tests yet; C3 will add Playwright specs.
