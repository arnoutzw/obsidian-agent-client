# Domain Layer

The domain layer contains pure domain models and port interfaces, independent of external frameworks and protocols.

## Overview

```
domain/
├── models/           # Data structures
│   ├── chat-message.ts
│   ├── session-update.ts
│   ├── agent-config.ts
│   ├── chat-session.ts
│   ├── agent-error.ts
│   ├── prompt-content.ts
│   └── session-info.ts
└── ports/            # Interface definitions
    ├── agent-client.port.ts
    ├── vault-access.port.ts
    └── settings-access.port.ts
```

## Design Principles

### Zero Dependencies

The domain layer has no dependencies on:
- `obsidian` - Obsidian's API
- `@agentclientprotocol/sdk` - ACP library
- Any React or UI-related packages

This ensures domain models remain stable even when external APIs change.

### Protocol Isolation

Domain models abstract away ACP protocol specifics:
- `SessionUpdate` types map to ACP's `SessionNotification.update.sessionUpdate`
- `ChatMessage` is independent of ACP's content block format
- Adapters handle conversion between domain and protocol types

## Documentation

- **[Models](./models.md)** - Complete reference for all domain models
- **[Ports](./ports.md)** - Interface definitions and contracts
