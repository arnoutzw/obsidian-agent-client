# Agent Client Plugin - Documentation

Comprehensive API documentation for the Obsidian Agent Client Plugin.

## Overview

The Agent Client Plugin enables AI agent interaction within Obsidian, supporting Claude Code, Gemini CLI, and custom ACP-compatible agents. Built with React 19, TypeScript, and the Agent Client Protocol (ACP).

## Architecture

The plugin follows a clean architecture pattern with clear separation of concerns:

```
src/
├── domain/           # Pure domain models + ports (interfaces)
├── adapters/         # Interface implementations (ACP, Obsidian)
├── hooks/            # React custom hooks (state + logic)
├── components/       # UI components (React)
├── shared/           # Pure functions and utilities
├── plugin.ts         # Obsidian plugin lifecycle
└── main.ts           # Entry point
```

## Documentation Structure

### Core Layers

- **[Domain Layer](./api/domain/README.md)** - Pure domain models and port interfaces
  - [Models](./api/domain/models.md) - Data structures for messages, sessions, agents, errors
  - [Ports](./api/domain/ports.md) - Interface definitions for adapters

- **[Adapters Layer](./api/adapters/README.md)** - Implementation of domain ports
  - [ACP Adapter](./api/adapters/acp.md) - Agent Client Protocol implementation
  - [Obsidian Adapters](./api/adapters/obsidian.md) - Vault, settings, and mention services

- **[Hooks Layer](./api/hooks/README.md)** - React custom hooks for state management
  - Session management, messaging, permissions, mentions, and more

- **[Components Layer](./api/components/README.md)** - React UI components
  - Chat interface, settings, and supporting UI elements

- **[Shared Utilities](./api/shared/README.md)** - Pure functions and services
  - Message processing, terminal management, export, and helpers

- **[Plugin Entry](./api/plugin.md)** - Main plugin class and lifecycle

## Key Concepts

### Multi-Session Architecture

Each ChatView has its own independent AcpAdapter instance, enabling multiple concurrent agent sessions:

```
ChatView1 → AcpAdapter1 → Claude Code
ChatView2 → AcpAdapter2 → Gemini CLI
ChatView3 → AcpAdapter3 → Custom Agent
```

### React Hooks Architecture

State management is handled through custom React hooks instead of ViewModel or UseCase classes:

- `useAgentSession` - Session lifecycle management
- `useChat` - Message handling and session updates
- `usePermission` - Permission request handling
- `useMentions` / `useSlashCommands` - Input suggestions

### ACP Protocol Flow

```
1. initialize()     → Spawn process, protocol handshake
2. newSession()     → Create chat session
3. sendPrompt()     → Send message to agent
4. onSessionUpdate → Receive streamed responses
5. disconnect()     → Clean up and terminate
```

## Development Guidelines

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Ports | `*.port.ts` | `agent-client.port.ts` |
| Adapters | `*.adapter.ts` | `acp.adapter.ts` |
| Hooks | `use*.ts` | `useChat.ts` |
| Components | `PascalCase.tsx` | `ChatView.tsx` |
| Utilities | `kebab-case.ts` | `message-service.ts` |

### Architecture Rules

1. **Domain has zero dependencies** - No `obsidian`, `@agentclientprotocol/sdk` imports
2. **Ports isolate protocol changes** - ACP changes only affect adapters
3. **Hooks own state** - All React state management in hooks
4. **Pure functions in shared/** - Non-React business logic

### Obsidian Plugin Guidelines

1. No `innerHTML`/`outerHTML` - Use `createEl`/`createDiv`/`createSpan`
2. No detaching leaves in `onunload`
3. Styles in CSS only - No JS style manipulation
4. Use `Platform` interface instead of `process.platform`
5. Minimize `any` - Use proper TypeScript types

## Technology Stack

- **React 19** - UI framework
- **TypeScript 5.9** - Language
- **Obsidian API** - Desktop plugin integration
- **Agent Client Protocol 0.12.0** - Agent communication
- **esbuild** - Bundler

## Quick Links

- [Getting Started](./getting-started.md)
- [API Reference](./api/README.md)
- [Contributing](./contributing.md)
