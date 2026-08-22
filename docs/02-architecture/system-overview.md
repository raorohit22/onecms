# System Overview

oneCMS is a modular monolith with three primary application surfaces:

1. CMS — React administrative application.
2. API — Node.js/Express backend.
3. Website — Next.js public website.

Shared packages provide types, validation and UI where appropriate.

High-level flow:

CMS → REST API → Application Services → MongoDB/Infrastructure

Website → REST API → Published content

AI:
CMS → API → AI service/provider adapter → validated output → draft/editor

Async:
API → Redis/BullMQ → Worker → external/infrastructure operation

The initial architecture intentionally avoids microservices.
