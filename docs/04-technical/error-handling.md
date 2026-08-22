# Error Handling

We use a centralized error handling strategy.

## AppError
All known application errors should throw an instance of `AppError`.
`AppError` encapsulates:
- `statusCode`: HTTP status code (e.g., 400, 404, 500)
- `code`: Stable string identifier (e.g., `VALIDATION_FAILED`)
- `message`: Human readable message
- `details`: Optional validation or context details

## Middleware
The centralized error middleware catches all thrown errors and passes them to the client in a consistent JSON format. In development, stack traces are included. In production, stack traces are stripped.
