# Smoke Test Suite

The Smoke Test Suite is designed to verify that the most critical functions of the CMS are operational after a deployment. This suite should run in under 3 minutes.

## 1. Authentication & Sessions
- `[ ]` User can sign in with valid credentials.
- `[ ]` Invalid credentials return a 401 Unauthorized with a generic message.
- `[ ]` Session token is issued and correctly attached as a secure HTTP-Only cookie.
- `[ ]` User can sign out and the session is destroyed.

## 2. Tenant Context
- `[ ]` User is routed to their default active workspace.
- `[ ]` `X-Organization-Id` header is automatically appended to API requests.
- `[ ]` Switching workspaces correctly reloads data without cross-contamination.

## 3. Core CMS (Posts)
- `[ ]` User can view the list of posts in their organization.
- `[ ]` User can create a new post draft.
- `[ ]` User can save content to the draft.
- `[ ]` User can delete the draft.

## 4. Health
- `[ ]` API `/health` endpoint returns 200 OK.
- `[ ]` Database connection is reported as `CONNECTED`.
- `[ ]` Redis cache connection is reported as `CONNECTED`.
