# Hooks Layer

React custom hooks for state management and business logic. The plugin uses hooks instead of ViewModel or UseCase classes.

## Overview

```
hooks/
├── useAgentSession.ts        # Session lifecycle
├── useChat.ts                # Messaging and updates
├── usePermission.ts          # Permission handling
├── useMentions.ts            # @[[note]] suggestions
├── useSlashCommands.ts       # /command suggestions
├── useAutoMention.ts         # Auto-mention active note
├── useAutoExport.ts          # Auto-export on events
├── useSettings.ts            # Settings subscription
├── useSessionHistory.ts      # Session list/load/resume
└── useModelComplexitySwitching.ts # Auto model switching
```

## Hook Composition

Hooks are composed in `ChatView.tsx`:

```typescript
function ChatView() {
  // Core session and chat hooks
  const session = useAgentSession(agentClient, settingsAccess, ...);
  const chat = useChat(agentClient, session, ...);
  const permission = usePermission(agentClient, chat.messages);

  // Input suggestion hooks
  const mentions = useMentions(vaultAccess, plugin);
  const slashCommands = useSlashCommands(session.availableCommands);

  // Feature hooks
  const autoMention = useAutoMention(vaultAccess);
  const autoExport = useAutoExport(plugin);
  const sessionHistory = useSessionHistory({...});

  // Register session update handler
  useEffect(() => {
    agentClient.onSessionUpdate(chat.handleSessionUpdate);
  }, []);

  // ...
}
```

## Design Principles

### Single Responsibility

Each hook has a focused purpose:
- `useAgentSession` - Only session lifecycle
- `useChat` - Only messaging
- `usePermission` - Only permissions

### Derived State

Use `useMemo` for derived state to avoid unnecessary recalculations:

```typescript
const activePermission = useMemo(
  () => findActivePermission(messages),
  [messages]
);
```

### Stable Callbacks

Use `useCallback` for callbacks passed to children:

```typescript
const sendMessage = useCallback(async (content) => {
  // ...
}, [dependencies]);
```

### Cleanup with useRef

Use `useRef` for cleanup functions to avoid stale closures:

```typescript
const cleanupRef = useRef<(() => void) | null>(null);

useEffect(() => {
  cleanupRef.current = () => { /* cleanup */ };
  return () => cleanupRef.current?.();
}, []);
```

## Hook Reference

### Session Management

- **[useAgentSession](./useAgentSession.md)** - Session lifecycle, agent switching
- **[useSessionHistory](./useSessionHistory.md)** - List, load, resume, fork sessions

### Messaging

- **[useChat](./useChat.md)** - Message sending, session update handling
- **[usePermission](./usePermission.md)** - Permission request handling

### Input Features

- **[useMentions](./useMentions.md)** - @[[note]] suggestions
- **[useSlashCommands](./useSlashCommands.md)** - /command suggestions
- **[useAutoMention](./useAutoMention.md)** - Auto-mention active note

### Utilities

- **[useSettings](./useSettings.md)** - Settings subscription
- **[useAutoExport](./useAutoExport.md)** - Auto-export on new/close
- **[useModelComplexitySwitching](./useModelComplexitySwitching.md)** - Automatic model switching
