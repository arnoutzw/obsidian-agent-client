# API Reference

Complete API documentation for the Agent Client Plugin.

## Quick Links

### Core Layers

| Layer | Description | Documentation |
|-------|-------------|---------------|
| **Domain** | Pure models and interfaces | [Domain](./domain/README.md) |
| **Adapters** | Protocol implementations | [Adapters](./adapters/README.md) |
| **Hooks** | React state management | [Hooks](./hooks/README.md) |
| **Components** | React UI components | [Components](./components/README.md) |
| **Shared** | Pure utility functions | [Shared](./shared/README.md) |
| **Plugin** | Obsidian plugin class | [Plugin](./plugin.md) |

---

## Domain Layer

Pure domain models independent of frameworks.

### Models

| Model | File | Description |
|-------|------|-------------|
| [ChatMessage](./domain/models.md#chat-message) | `chat-message.ts` | Message and content types |
| [SessionUpdate](./domain/models.md#session-update) | `session-update.ts` | Session event types |
| [AgentConfig](./domain/models.md#agent-configuration) | `agent-config.ts` | Agent settings |
| [ChatSession](./domain/models.md#chat-session) | `chat-session.ts` | Session state |
| [AgentError](./domain/models.md#agent-error) | `agent-error.ts` | Error types |
| [PromptContent](./domain/models.md#prompt-content) | `prompt-content.ts` | Prompt content types |
| [SessionInfo](./domain/models.md#session-info) | `session-info.ts` | Session metadata |

### Ports (Interfaces)

| Port | File | Description |
|------|------|-------------|
| [IAgentClient](./domain/ports.md#iagentclient) | `agent-client.port.ts` | Agent communication |
| [IVaultAccess](./domain/ports.md#ivaultaccess) | `vault-access.port.ts` | Vault operations |
| [ISettingsAccess](./domain/ports.md#isettingsaccess) | `settings-access.port.ts` | Settings management |

---

## Adapters Layer

Implementation of domain ports.

| Adapter | File | Description |
|---------|------|-------------|
| [AcpAdapter](./adapters/acp.md) | `acp.adapter.ts` | ACP protocol implementation |
| [VaultAdapter](./adapters/obsidian.md#vaultadapter) | `vault.adapter.ts` | Obsidian vault access |
| [SettingsStore](./adapters/obsidian.md#settingsstore) | `settings-store.adapter.ts` | Settings persistence |
| [MentionService](./adapters/obsidian.md#mentionservice) | `mention-service.ts` | Note search service |

---

## Hooks Layer

React custom hooks for state management.

### Session & Messaging

| Hook | File | Description |
|------|------|-------------|
| [useAgentSession](./hooks/useAgentSession.md) | `useAgentSession.ts` | Session lifecycle |
| [useChat](./hooks/useChat.md) | `useChat.ts` | Messaging and updates |
| [usePermission](./hooks/usePermission.md) | `usePermission.ts` | Permission handling |
| [useSessionHistory](./hooks/useSessionHistory.md) | `useSessionHistory.ts` | Session list/load |

### Input Features

| Hook | File | Description |
|------|------|-------------|
| [useMentions](./hooks/useMentions.md) | `useMentions.ts` | @[[note]] suggestions |
| [useSlashCommands](./hooks/useSlashCommands.md) | `useSlashCommands.ts` | /command suggestions |
| [useAutoMention](./hooks/useAutoMention.md) | `useAutoMention.ts` | Active note mention |

### Utilities

| Hook | File | Description |
|------|------|-------------|
| [useSettings](./hooks/useSettings.md) | `useSettings.ts` | Settings subscription |
| [useAutoExport](./hooks/useAutoExport.md) | `useAutoExport.ts` | Auto-export |
| [useModelComplexitySwitching](./hooks/useModelComplexitySwitching.md) | `useModelComplexitySwitching.ts` | Model switching |

---

## Components Layer

React UI components.

### Chat Components

| Component | Description |
|-----------|-------------|
| ChatView | Main view with hook composition |
| ChatHeader | Agent/mode/model selectors |
| ChatMessages | Scrollable message list |
| ChatInput | Input with dropdowns |
| MessageContentRenderer | Content block rendering |
| ToolCallRenderer | Tool call display |

See [Components README](./components/README.md) for full list.

---

## Shared Utilities

Pure functions and services.

| Utility | File | Description |
|---------|------|-------------|
| Message Service | `message-service.ts` | Prompt preparation |
| Terminal Manager | `terminal-manager.ts` | Process management |
| Chat Exporter | `chat-exporter.ts` | Markdown export |
| Logger | `logger.ts` | Debug logging |
| Mention Utils | `mention-utils.ts` | Mention parsing |
| Path Utils | `path-utils.ts` | Path operations |
| Shell Utils | `shell-utils.ts` | Shell escaping |
| WSL Utils | `wsl-utils.ts` | WSL compatibility |

See [Shared README](./shared/README.md) for full list.

---

## Plugin Entry

| Class | File | Description |
|-------|------|-------------|
| [AgentClientPlugin](./plugin.md) | `plugin.ts` | Main plugin class |

---

## Type Index

### Message Types

- `ChatMessage` - Chat message with content
- `MessageContent` - Union of content block types
- `ToolCallInfo` - Tool call information
- `PermissionOption` - Permission choice
- `PlanEntry` - Plan task entry

### Session Types

- `ChatSession` - Complete session state
- `SessionState` - Session lifecycle state
- `SessionUpdate` - Session event union
- `SessionInfo` - Session metadata

### Agent Types

- `AgentConfig` - Agent configuration
- `ClaudeAgentSettings` / `GeminiAgentSettings` / etc.
- `CustomAgentSettings` - Custom agent config

### Error Types

- `AcpError` - Protocol error
- `ProcessError` - Process error
- `ErrorInfo` - User-facing error

### Prompt Types

- `PromptContent` - Content block union
- `TextPromptContent` / `ImagePromptContent` / `ResourcePromptContent`
