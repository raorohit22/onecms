# Application Architecture

## apps/api

Node.js + Express backend.

Suggested internal structure:

src/
  config/
  core/
  modules/
    auth/
    users/
    posts/
    categories/
    tags/
    media/
    revisions/
    seo/
    search/
    ai/
    audit/
  jobs/
  routes/
  app.ts
  server.ts

## apps/cms

React administrative application.

Responsibilities:
- authentication UI
- content management
- media
- taxonomy
- AI tools
- settings
- audit views

## apps/web

Next.js public website.

Responsibilities:
- public content
- SEO
- rendering
- caching/revalidation
- search UX

## packages

Shared contracts should be placed in packages only when multiple apps truly consume them.
Avoid turning packages into a dumping ground.
