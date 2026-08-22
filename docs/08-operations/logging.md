# Logging

Use structured logging.

Every request should be correlatable through a request ID.

Do not log:
- passwords
- tokens
- API keys
- secrets
- unnecessary sensitive user data

Logs should answer:
- what happened
- where
- when
- request/job ID
- relevant entity ID
- error classification
