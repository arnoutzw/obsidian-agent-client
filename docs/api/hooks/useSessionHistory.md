# useSessionHistory

Hook for session history management: listing, loading, resuming, forking, and deleting sessions.

**File:** `src/hooks/useSessionHistory.ts`

## Signature

```typescript
function useSessionHistory(
  options: UseSessionHistoryOptions
): UseSessionHistoryReturn
```

## Options

```typescript
interface UseSessionHistoryOptions {
  /** Agent client for session operations */
  agentClient: IAgentClient;

  /** Current session (for capabilities) */
  session: ChatSession;

  /** Settings access for local storage */
  settingsAccess: ISettingsAccess;

  /** Working directory */
  cwd: string;

  /** Called when session is loaded/resumed/forked */
  onSessionLoad: (sessionId: string, modes?: SessionModeState, models?: SessionModelState) => void;

  /** Called to restore messages from local storage */
  onMessagesRestore?: (messages: ChatMessage[]) => void;

  /** Called when load starts (to ignore history replay) */
  onLoadStart?: () => void;

  /** Called when load ends */
  onLoadEnd?: () => void;
}
```

## Return Value

```typescript
interface UseSessionHistoryReturn {
  /** List of sessions */
  sessions: SessionInfo[];

  /** Loading state */
  loading: boolean;

  /** Error message */
  error: string | null;

  /** Whether there are more sessions to load */
  hasMore: boolean;

  // Capability flags
  canShowSessionHistory: boolean;
  canRestore: boolean;
  canFork: boolean;
  canList: boolean;
  isUsingLocalSessions: boolean;

  /** Session IDs with local data */
  localSessionIds: Set<string>;

  // Methods
  fetchSessions: (cwd?: string) => Promise<void>;
  loadMoreSessions: () => Promise<void>;
  restoreSession: (sessionId: string, cwd: string) => Promise<void>;
  forkSession: (sessionId: string, cwd: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  saveSessionLocally: (sessionId: string, messageContent: string) => Promise<void>;
  saveSessionMessages: (sessionId: string, messages: ChatMessage[]) => void;
  invalidateCache: () => void;
}
```

## Capability Flags

Derived from `session.agentCapabilities.sessionCapabilities`:

| Flag | Description |
|------|-------------|
| `canShowSessionHistory` | Any session capability available |
| `canRestore` | `load` or `resume` supported |
| `canFork` | `fork` supported |
| `canList` | `list` supported |
| `isUsingLocalSessions` | Using local storage (no agent list) |

## Functions

### `fetchSessions(cwd?): Promise<void>`

Fetches sessions from agent or local storage.

**Behavior:**
- Uses agent's `session/list` if `canList` is true
- Falls back to local storage if not supported
- Merges local titles with agent session data
- Caches results for 5 minutes

---

### `loadMoreSessions(): Promise<void>`

Loads more sessions for pagination.

**Requires:** `canList` and `hasMore`

---

### `restoreSession(sessionId, cwd): Promise<void>`

Restores a previous session.

**Uses `load` if available:**
1. Calls `agentClient.loadSession()`
2. Agent replays history via session updates
3. Sets `isLoadingHistory` to ignore replayed messages
4. Restores messages from local storage instead

**Uses `resume` if load not available:**
1. Calls `agentClient.resumeSession()`
2. Agent doesn't replay history
3. Restores messages from local storage

---

### `forkSession(sessionId, cwd): Promise<void>`

Creates a new session branching from an existing one.

**Process:**
1. Calls `agentClient.forkSession()`
2. Receives new session ID
3. Copies messages from original session
4. Saves forked session to local storage

---

### `deleteSession(sessionId): Promise<void>`

Deletes session from local storage.

**Removes:**
- Session metadata from settings
- Message file from `.obsidian/plugins/agent-client/sessions/`

---

### `saveSessionLocally(sessionId, messageContent): Promise<void>`

Saves session metadata when first message is sent.

**Title Generation:**
- First 50 characters of first message
- Truncated with "..." if longer

---

### `saveSessionMessages(sessionId, messages): void`

Saves messages to local storage (fire-and-forget).

**Called:** When agent turn completes (response finished)

---

### `invalidateCache(): void`

Invalidates the session cache.

**Called:** When new session created, session forked, etc.

---

## Session Storage

### Metadata Storage

Session metadata is stored in plugin settings:

```typescript
settings.savedSessions = [
  {
    sessionId: "abc123",
    agentId: "claude-code-acp",
    cwd: "/path/to/vault",
    title: "Help me refactor...",
    createdAt: "2025-01-15T14:30:00Z",
    updatedAt: "2025-01-15T14:35:00Z"
  }
];
```

### Message Storage

Messages are stored as JSON files:

```
.obsidian/plugins/agent-client/sessions/
├── abc123.json
├── def456.json
└── ...
```

## Caching

Sessions are cached to avoid repeated API calls:

```typescript
interface SessionCache {
  sessions: SessionInfo[];
  nextCursor?: string;
  cwd?: string;
  timestamp: number;
}

// Cache expires after 5 minutes
const CACHE_EXPIRY_MS = 5 * 60 * 1000;
```

## Usage Example

```typescript
function SessionHistoryModal() {
  const sessionHistory = useSessionHistory({
    agentClient,
    session,
    settingsAccess,
    cwd: vaultPath,
    onSessionLoad: (sessionId, modes, models) => {
      updateSession({ sessionId, modes, models });
    },
    onMessagesRestore: (messages) => {
      setInitialMessages(messages);
    }
  });

  useEffect(() => {
    if (sessionHistory.canList) {
      sessionHistory.fetchSessions();
    }
  }, []);

  return (
    <div>
      {sessionHistory.sessions.map(session => (
        <SessionItem
          key={session.sessionId}
          session={session}
          onRestore={() => sessionHistory.restoreSession(session.sessionId, vaultPath)}
          onFork={sessionHistory.canFork
            ? () => sessionHistory.forkSession(session.sessionId, vaultPath)
            : undefined}
          onDelete={sessionHistory.localSessionIds.has(session.sessionId)
            ? () => sessionHistory.deleteSession(session.sessionId)
            : undefined}
        />
      ))}
      {sessionHistory.hasMore && (
        <button onClick={sessionHistory.loadMoreSessions}>
          Load More
        </button>
      )}
    </div>
  );
}
```
