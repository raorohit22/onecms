# API Design

oneCMS backend API is designed around a clean Express architecture.

## App Bootstrap
- `app.ts` handles Express application construction and middleware ordering.
- `server.ts` handles server binding and process lifecycle.

## Middleware Pipeline
1. **Request ID**: Generated or extracted and injected as `x-request-id` header.
2. **Security**: Helmet for HTTP headers.
3. **CORS**: Cross-origin requests support.
4. **Parsing**: JSON and URL-encoded body parsing.
5. **Logging**: Pino HTTP logger (redacts secrets).
6. **Routes**: Feature modules mounted.
7. **404 Handler**: Catches unhandled routes.
8. **Centralized Error Handler**: Formats errors into standard API responses.

## Response Format
- Success: Standard JSON data.
- Errors:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```
