# Media Management Design

Files are stored in object storage, not as large binary payloads in MongoDB.

MongoDB stores metadata and references.

Upload controls:
- MIME allowlist
- extension checks
- size limits
- image dimension validation
- filename sanitization
- storage key generation
- optional malware scanning when production requirements justify it

Image processing uses Sharp where applicable.
