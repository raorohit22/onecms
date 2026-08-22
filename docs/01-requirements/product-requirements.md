# oneCMS Product Requirements Document

**Status:** Draft / Foundation  
**Version:** 1.0  
**Owner:** oneCMS Engineering  
**Last Updated:** 2026-08-13

## 1. Product Overview

oneCMS is a focused, AI-assisted Content Management System for managing a blog website.

The product provides an administrative interface for creating, editing, organizing,
optimizing, reviewing and publishing blog content, together with a separate public
website that consumes the published content.

The product is intentionally a CMS, not a general publishing SaaS.

## 2. Problem Statement

Managing a modern technical/blog website requires more than a database CRUD interface.
Editors need reliable content workflows, media management, SEO metadata, revisions,
permissions and AI assistance while engineers need maintainable APIs, testing,
observability and deployment practices.

oneCMS provides these capabilities in a focused system while serving as a production-grade
MERN learning project.

## 3. Goals

### Product Goals
- Manage blog posts through a dedicated CMS.
- Support draft and published workflows.
- Provide categories, tags and author metadata.
- Provide media management.
- Provide SEO metadata.
- Provide revision history.
- Provide AI-assisted content workflows.
- Serve a fast public blog website.
- Provide secure authentication and authorization.

### Engineering Goals
- Learn advanced Node.js/Express engineering.
- Learn production MongoDB modeling and indexing.
- Learn React CMS architecture.
- Learn Next.js rendering and SEO.
- Learn testing at multiple levels.
- Learn caching and background processing.
- Learn AI integration safely.
- Learn CI/CD, observability and operational practices.
- Maintain enterprise-style engineering documentation.

## 4. Target Users

### Administrator
Full CMS access, user/permission management and configuration.

### Editor
Create, edit, review and publish content according to permissions.

### Author
Create and edit owned content where permitted.

### Public Reader
Consumes published blog content through the public website.

## 5. Core Modules

- Authentication
- Users
- Roles and permissions
- Posts
- Categories
- Tags
- Authors
- Media
- Revisions
- SEO
- Search
- AI assistance
- Audit/activity log
- Settings

## 6. Core Content Workflow

Draft:
Create → Save Draft → Edit → Review → Publish

AI-assisted:
Prompt/selection → Generate → Validate → Insert into editor → Human review → Save/Publish

Publishing must not occur automatically solely because AI generated content.

## 7. AI Capabilities

Initial AI capabilities:
- Generate outline
- Generate draft
- Rewrite selected content
- Improve readability
- Generate title options
- Generate excerpt
- Generate meta description
- Suggest tags
- Summarize content
- Suggest SEO improvements

AI is assistive. Human editorial control remains authoritative.

## 8. Public Website

Initial public pages:
- Home
- Blog listing
- Blog detail
- Category
- Tag
- Author
- Search
- Error/not-found pages

## 9. Out of Scope

- Multi-tenant SaaS
- Subscription billing
- Social network features
- Comments platform
- Full marketing automation
- Advanced newsletter platform
- General-purpose page builder
- Microservices
- Real-time collaborative editing
- Marketplace functionality
- Full WordPress compatibility

These may be considered later through explicit product decisions.

## 10. Success Criteria

- Editors can create and publish posts reliably.
- Public readers can discover published content.
- Critical workflows are automated-tested.
- API and database behavior are documented.
- Security controls are enforced server-side.
- Production deployment is repeatable.
- AI assistance reduces editorial effort without bypassing review.
- New engineers/agents can understand the system from repository documentation.
