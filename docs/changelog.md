# Atlas Changelog

All notable changes to the Atlas project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project documentation structure in `docs/` directory
- Architecture documentation (`docs/architecture.md`)
- Development roadmap (`docs/roadmap.md`)
- UI guidelines (`docs/ui-guidelines.md`)
- Database plan (`docs/database-plan.md`)
- API design documentation (`docs/api-design.md`)
- Changelog (`docs/changelog.md`)

### Changed
- Renamed project from `tanstack_start_ts` to `atlas` in package.json
- Updated lint/format scripts to use local `src` directory
- Completely rewrote README.md with professional Atlas branding
- Converted relative imports to use `@` alias for consistency
- Updated `src/routes/__root.tsx` imports
- Updated `src/integrations/lovable/index.ts` imports

### Removed
- No files removed (all Lovable integration files are functional dependencies)

### Fixed
- Fixed hardcoded paths in package.json scripts
- Standardized import structure across codebase

## [0.1.0] - 2026-07-24

### Added
- Initial Atlas canonical repository
- Selected lovable-ui-4 as canonical codebase
- Archived previous Lovable iterations (ui-1, ui-2, ui-3, ui-5)
- Standardized project identity
- Updated documentation
- Standardized imports
- Prepared repository for Supabase authentication

### Changed
- Repository structure from Lovable export to professional project
- Package naming and configuration
- Documentation from Lovable-generated to Atlas-specific

### Security
- Established Row Level Security (RLS) policies in database plan
- Documented authentication and authorization patterns
- Planned security-first architecture

## [Future Versions]

### Planned
- Phase 2: Supabase authentication implementation
- Phase 3: Database integration and RLS policies
- Phase 4: AI integration and server functions
- Phase 5: Production readiness and optimization
- Phase 6: Launch and monitoring

---

## Version Guidelines

### Major Version (X.0.0)
- Breaking changes that require user action
- Major architectural changes
- Removal of deprecated features

### Minor Version (0.X.0)
- New features (backward compatible)
- Enhancements to existing features
- New documentation

### Patch Version (0.0.X)
- Bug fixes
- Performance improvements
- Documentation updates
- Small enhancements

## Change Categories

### Added
- New features
- New components
- New documentation
- New dependencies

### Changed
- Changes to existing functionality
- Updates to dependencies
- Refactoring
- Performance improvements

### Deprecated
- Features marked for future removal
- Deprecated APIs or components

### Removed
- Removed features
- Removed dependencies
- Removed files or components

### Fixed
- Bug fixes
- Security fixes
- Error handling improvements

### Security
- Security improvements
- Vulnerability fixes
- Access control changes

## Commit Message Guidelines

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `security`: Security improvements

### Examples
```
feat(auth): add Supabase authentication

Implement Supabase Auth for user sign up, login, and logout.
Includes session management and protected routes.

Closes #123
```

```
fix(database): resolve RLS policy issue

Fixed Row Level Security policy that was preventing users
from accessing their own claims data.

Security issue
```

## Release Process

1. Update changelog with all changes
2. Update version in package.json
3. Commit changes with version bump
4. Create git tag for release
5. Deploy to production
6. Announce release (if significant)

## Documentation Updates

This changelog is maintained alongside the following documentation:
- `docs/architecture.md` - System architecture
- `docs/roadmap.md` - Development roadmap
- `docs/ui-guidelines.md` - UI/UX guidelines
- `docs/database-plan.md` - Database schema and design
- `docs/api-design.md` - API endpoints and design

## Questions or Issues?

For questions about changes or to report issues, please refer to the project repository or contact the development team.
