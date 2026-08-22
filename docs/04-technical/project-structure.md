# Project Structure

Target:

oneCMS/
├── apps/
│   ├── api/
│   ├── cms/
│   ├── web/
│   └── docs/
├── packages/
│   ├── ui/
│   ├── types/
│   ├── validation/
│   ├── config/
│   ├── eslint-config/
│   └── typescript-config/
├── docs/
├── tests/
├── scripts/
├── docker/
├── .agents/
└── .github/

Do not create packages simply because they are possible.
Shared packages must have real consumers and stable responsibility.
