# useChat

Hook for message handling, session updates, and chat state management.

**File:** `src/hooks/useChat.ts`

## Signature

```typescript
function useChat(
  agentClient: IAgentClient,
  session: ChatSession,
  vaultAccess: IVaultAccess,
  mentionService: IMentionService,
  settingsAccess: ISettingsAccess
): UseChatReturn
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `agentClient` | `IAgentClient` | Agent client for messaging |
| `session` | `ChatSession` | Current session state |
| `vaultAccess` | `IVaultAccess` | Vault access for note reading |
| `mentionService` | `IMentionService` | Service for mention resolution |
| `settingsAccess` | `ISettingsAccess` | Settings for config options |

## Return Value

```typescript
interface UseChatReturn {
  /** Current chat messages */
  messages: ChatMessage[];

  /** Whether a message is being sent/processed */
  isLoading: boolean;

  /** Error information if any */
  errorInfo: ErrorInfo | null;

  /** Send a message to the agent */
  sendMessage: (
    text: string,
    images?: ImagePromptContent[],
    activeNote?: NoteMetadata | null,
    isAutoMentionDisabled?: boolean
  ) => Promise<void>;

  /** Handle session updates from agent */
  handleSessionUpdate: (update: SessionUpdate) => void;

  /** Clear all messages */
  clearMessages: () => void;

  /** Set initial messages (for session load) */
  setInitialMessages: (messages: ChatMessage[]) => void;

  /** Clear error state */
  clearError: () => void;

  /** Whether session is currently loading history */
  isLoadingHistory: boolean;

  /** Set loading history state */
  setIsLoadingHistory: (loading: boolean) => void;
}
```

## Functions

### `sendMessage(text, images?, activeNote?, isAutoMentionDisabled?): Promise<void>`

Sends a message to the agent.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | Message text (may contain @[[mentions]]) |
| `images` | `ImagePromptContent[]` | Optional attached images |
| `activeNote` | `NoteMetadata \| null` | Currently active note for auto-mention |
| `isAutoMentionDisabled` | `boolean` | Whether auto-mention is disabled |

**Process:**
1. Prepare prompt via `preparePrompt()` from message-service
   - Extract @[[mentions]] and read note contents
   - Add auto-mention context if enabled
   - Build display and agent content
2. Create user message with display content
3. Add user message to state
4. Send agent content via `agentClient.sendPrompt()`
5. Handle any errors

**Usage:**
```typescript
await sendMessage(
  "Help me with @[[my-note]]",
  attachedImages,
  activeNote,
  false  // auto-mention enabled
);
```

---

### `handleSessionUpdate(update: SessionUpdate): void`

Unified handler for all session update events from the agent.

**Update Types Handled:**

| Type | Handler |
|------|---------|
| `agent_message_chunk` | Appends text to last assistant message |
| `agent_thought_chunk` | Appends to thought block in last message |
| `tool_call` | Creates new tool call in last message |
| `tool_call_update` | Updates existing tool call (upsert pattern) |
| `plan` | Updates plan in last message |
| `user_message_chunk` | Adds user message (during session/load) |

**Upsert Pattern for Tool Calls:**

Tool calls use an upsert pattern to handle race conditions:

```typescript
const upsertToolCall = useCallback((toolCallId: string, updateFn) => {
  setMessages(prev => {
    const lastMsg = prev[prev.length - 1];
    const existingIndex = lastMsg.content.findIndex(
      c => c.type === "tool_call" && c.toolCallId === toolCallId
    );

    if (existingIndex >= 0) {
      // Update existing
      return updateExistingToolCall(prev, existingIndex, updateFn);
    } else {
      // Create new
      return createNewToolCall(prev, toolCallId, updateFn);
    }
  });
}, []);
```

---

### `clearMessages(): void`

Clears all messages from the chat.

**Usage:** Called when starting a new chat.

---

### `setInitialMessages(messages: ChatMessage[]): void`

Sets initial messages for session restore.

**Usage:** Called by `useSessionHistory` when loading/resuming a session.

---

## Message Structure

Messages contain multiple content blocks:

```typescript
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: MessageContent[];
  timestamp: Date;
}
```

**Content Block Types:**
- `text` - Plain text
- `text_with_context` - Text with auto-mention metadata
- `agent_thought` - Agent reasoning
- `tool_call` - Tool execution
- `plan` - Task plan
- `image` - Attached image
- `terminal` - Terminal session

## Update Flow

```
Agent sends session/update
        ↓
AcpAdapter converts to SessionUpdate
        ↓
ChatView calls handleSessionUpdate()
        ↓
useChat updates messages state
        ↓
React re-renders with new messages
```

## Tool Call State Management

Tool calls go through multiple updates:

```
1. tool_call (status: pending)
   → Creates new tool call in message

2. tool_call_update (status: in_progress)
   → Updates status, may add permission request

3. tool_call_update (permission response)
   → Clears permission request

4. tool_call_update (status: completed)
   → Final status with content (diff, terminal, etc.)
```

## Error Handling

Errors are stored in `errorInfo` and can be:
- Send failures (network, auth)
- Agent errors (from session updates)

```typescript
if (result.error) {
  setErrorInfo({
    title: "Send Failed",
    message: result.error.message,
    suggestion: result.error.suggestion
  });
}
```

## Usage Example

```typescript
function ChatView() {
  const { messages, isLoading, sendMessage, handleSessionUpdate, clearMessages } =
    useChat(agentClient, session, vaultAccess, mentionService, settingsAccess);

  // Register session update handler
  useEffect(() => {
    agentClient.onSessionUpdate(handleSessionUpdate);
  }, [handleSessionUpdate]);

  // Handle send
  const handleSend = async (text: string) => {
    await sendMessage(text, images, activeNote);
  };

  return (
    <div>
      <ChatMessages messages={messages} />
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
```
