# Adapters Layer

Adapters implement domain ports to provide concrete functionality. They bridge between the domain layer and external systems (ACP protocol, Obsidian API).

## Overview

```
adapters/
├── acp/                      # Agent Client Protocol
│   ├── acp.adapter.ts        # Main ACP adapter
│   └── acp-type-converter.ts # Type conversions
└── obsidian/                 # Obsidian integrations
    ├── vault.adapter.ts      # Vault operations
    ├── settings-store.adapter.ts # Settings management
    └── mention-service.ts    # Note mention service
```

## Documentation

- **[ACP Adapter](./acp.md)** - Agent Client Protocol implementation
- **[Obsidian Adapters](./obsidian.md)** - Vault, settings, and mention services

## Design Principles

### Single Responsibility

Each adapter has a focused purpose:
- `AcpAdapter` - Agent process management and ACP protocol
- `VaultAdapter` - Obsidian vault file operations
- `SettingsStore` - Plugin settings persistence
- `MentionService` - Note search and indexing

### Protocol Isolation

Adapters isolate external protocol changes:
- ACP protocol changes only affect `acp.adapter.ts` and `acp-type-converter.ts`
- Obsidian API changes only affect `obsidian/` adapters
- Domain models remain stable

### Multi-Session Support

Each `ChatView` gets its own `AcpAdapter` instance:
- Independent agent processes
- Isolated session state
- Concurrent operations
