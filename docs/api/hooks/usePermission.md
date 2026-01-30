# usePermission

Hook for handling permission request responses from the agent.

**File:** `src/hooks/usePermission.ts`

## Signature

```typescript
function usePermission(
  agentClient: IAgentClient,
  messages: ChatMessage[]
): UsePermissionReturn
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `agentClient` | `IAgentClient` | Agent client for permission responses |
| `messages` | `ChatMessage[]` | Current chat messages (from useChat) |

## Return Value

```typescript
interface UsePermissionReturn {
  /** Currently active permission request (if any) */
  activePermission: ActivePermission | null;

  /** Error information from permission operations */
  errorInfo: ErrorInfo | null;

  /** Approve a specific permission request */
  approvePermission: (requestId: string, optionId: string) => Promise<void>;

  /** Approve the active permission (for hotkey) */
  approveActivePermission: () => Promise<boolean>;

  /** Reject the active permission (for hotkey) */
  rejectActivePermission: () => Promise<boolean>;

  /** Clear error state */
  clearError: () => void;
}
```

## Types

### `ActivePermission`

```typescript
interface ActivePermission {
  /** Permission request ID */
  requestId: string;
  /** Tool call ID that triggered the request */
  toolCallId: string;
  /** Available permission options */
  options: PermissionOption[];
}
```

### `PermissionOption`

```typescript
interface PermissionOption {
  optionId: string;
  name: string;
  kind: "allow_once" | "allow_always" | "reject_once" | "reject_always";
}
```

## Functions

### `approvePermission(requestId, optionId): Promise<void>`

Approves a specific permission request with the given option.

**Parameters:**
- `requestId` - Permission request ID from the tool call
- `optionId` - Selected option ID

**Usage:**
```typescript
// In UI when user clicks an option
await approvePermission(
  permission.requestId,
  selectedOption.optionId
);
```

---

### `approveActivePermission(): Promise<boolean>`

Approves the currently active permission using the best "allow" option.

**Selection Logic:**
1. Try `allow_once` first
2. Fall back to `allow_always`
3. If neither found, use first option

**Returns:** `true` if permission was approved, `false` if no active permission

**Usage:** Bound to keyboard shortcut (e.g., `Cmd+Y`)

---

### `rejectActivePermission(): Promise<boolean>`

Rejects the currently active permission using the best "reject" option.

**Selection Logic:**
1. Try `reject_once` first
2. Fall back to `reject_always`
3. Try options containing "reject" or "deny" in name
4. If none found, use first option

**Returns:** `true` if permission was rejected, `false` if no active permission

**Usage:** Bound to keyboard shortcut (e.g., `Cmd+N`)

---

## Permission Detection

The hook scans messages to find active permissions:

```typescript
function findActivePermission(messages: ChatMessage[]): ActivePermission | null {
  for (const message of messages) {
    for (const content of message.content) {
      if (content.type === "tool_call") {
        const permission = content.permissionRequest;
        if (permission?.isActive) {
          return {
            requestId: permission.requestId,
            toolCallId: content.toolCallId,
            options: permission.options
          };
        }
      }
    }
  }
  return null;
}
```

**Derived State:** Uses `useMemo` to avoid scanning on every render:

```typescript
const activePermission = useMemo(
  () => findActivePermission(messages),
  [messages]
);
```

## Permission Flow

```
1. Agent executes tool requiring permission
   ↓
2. tool_call_update with permissionRequest.isActive = true
   ↓
3. usePermission detects active permission via useMemo
   ↓
4. UI shows permission options to user
   ↓
5. User selects option (or presses hotkey)
   ↓
6. approvePermission() calls agentClient.respondToPermission()
   ↓
7. Agent receives response, continues execution
   ↓
8. tool_call_update with permissionRequest.isActive = false
```

## Auto-Approval

When `settings.autoAllowPermissions` is enabled, ChatView auto-approves:

```typescript
useEffect(() => {
  if (settings.autoAllowPermissions && activePermission) {
    approveActivePermission();
  }
}, [activePermission, settings.autoAllowPermissions]);
```

## Usage Example

```typescript
function ChatView() {
  const { messages } = useChat(...);
  const {
    activePermission,
    approvePermission,
    approveActivePermission,
    rejectActivePermission
  } = usePermission(agentClient, messages);

  // Register keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "y" && (e.metaKey || e.ctrlKey)) {
        approveActivePermission();
      }
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        rejectActivePermission();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [approveActivePermission, rejectActivePermission]);

  return (
    <ChatMessages
      messages={messages}
      onPermissionSelect={(requestId, optionId) =>
        approvePermission(requestId, optionId)
      }
    />
  );
}
```
