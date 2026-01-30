# useAgentSession

Hook for managing agent session lifecycle, including initialization, agent switching, and cleanup.

**File:** `src/hooks/useAgentSession.ts`

## Signature

```typescript
function useAgentSession(
  agentClient: IAgentClient,
  settingsAccess: ISettingsAccess,
  initialAgentId: string,
  vaultPath: string
): UseAgentSessionReturn
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `agentClient` | `IAgentClient` | Agent client for communication |
| `settingsAccess` | `ISettingsAccess` | Settings access for agent configs |
| `initialAgentId` | `string` | Initial agent to activate |
| `vaultPath` | `string` | Vault path for working directory |

## Return Value

```typescript
interface UseAgentSessionReturn {
  /** Current session state */
  session: ChatSession;

  /** Error information if any */
  errorInfo: ErrorInfo | null;

  /** Create new session (or restart current) */
  createSession: (agentId?: string) => Promise<void>;

  /** Switch to a different agent */
  switchAgent: (agentId: string) => Promise<void>;

  /** Close current session */
  closeSession: () => Promise<void>;

  /** Update available slash commands */
  updateAvailableCommands: (commands: SlashCommand[]) => void;

  /** Update current mode */
  updateCurrentMode: (modeId: string) => void;

  /** Update session ID (for load/resume/fork) */
  updateSessionId: (
    sessionId: string,
    modes?: SessionModeState,
    models?: SessionModelState
  ) => void;

  /** Clear error state */
  clearError: () => void;
}
```

## Session State

The hook manages a `ChatSession` object:

```typescript
interface ChatSession {
  sessionId: string | null;
  state: SessionState;  // "initializing" | "ready" | "busy" | "error" | ...
  agentId: string;
  agentDisplayName: string;
  authMethods: AuthenticationMethod[];
  availableCommands?: SlashCommand[];
  modes?: SessionModeState;
  models?: SessionModelState;
  promptCapabilities?: { image?: boolean; audio?: boolean; embeddedContext?: boolean };
  agentCapabilities?: { loadSession?: boolean; sessionCapabilities?: {...} };
  agentInfo?: { name: string; title?: string; version?: string };
  createdAt: Date;
  lastActivityAt: Date;
  workingDirectory: string;
}
```

## Functions

### `createSession(agentId?: string): Promise<void>`

Creates a new session with the specified or current agent.

**Process:**
1. Set state to `"initializing"`
2. Load agent config from settings
3. Build `AgentConfig` with API keys and environment
4. Call `agentClient.initialize(config)`
5. Call `agentClient.newSession(vaultPath)`
6. Set state to `"ready"` with session info

**Error Handling:**
- Sets `errorInfo` with user-friendly error message
- Sets state to `"error"`

**Usage:**
```typescript
const { createSession } = useAgentSession(...);

// Create with current agent
await createSession();

// Create with specific agent
await createSession("gemini-cli");
```

---

### `switchAgent(agentId: string): Promise<void>`

Switches to a different agent, closing the current session.

**Process:**
1. Close current session if active
2. Update agent ID in session state
3. Create new session with new agent

**Usage:**
```typescript
await switchAgent("gemini-cli");
```

---

### `closeSession(): Promise<void>`

Closes the current session and disconnects.

**Process:**
1. Call `agentClient.cancel()` if session active
2. Call `agentClient.disconnect()`
3. Set state to `"disconnected"`

---

### `updateAvailableCommands(commands: SlashCommand[]): void`

Updates the available slash commands from `available_commands_update`.

**Called from:** `ChatView` when receiving `available_commands_update` session update

---

### `updateCurrentMode(modeId: string): void`

Updates the current mode from `current_mode_update`.

**Called from:** `ChatView` when receiving `current_mode_update` session update

---

### `updateSessionId(sessionId, modes?, models?): void`

Updates session ID and optional mode/model state after load/resume/fork.

**Called from:** `useSessionHistory` callbacks

---

## Agent Configuration

The hook builds agent configuration from settings:

```typescript
// Built from settings
const config: AgentConfig = {
  agentId: settings.claude.id,
  command: settings.claude.command || "npx",
  args: settings.claude.args || ["-y", "@anthropics/claude-code-acp"],
  env: [
    { key: "ANTHROPIC_API_KEY", value: settings.claude.apiKey },
    ...settings.claude.env
  ]
};
```

**Supported Agents:**
- Claude Code (`claude-code-acp`)
- Codex (`codex-acp`)
- Gemini CLI (`gemini-cli`)
- Custom agents (user-defined)

## Error Handling

Errors are converted to user-friendly `ErrorInfo`:

```typescript
interface ErrorInfo {
  title: string;       // "Connection Failed"
  message: string;     // Detailed error description
  suggestion?: string; // "Check that the agent command is correct"
}
```

**Common Errors:**
| Error | Title | Suggestion |
|-------|-------|------------|
| Spawn failed | Connection Failed | Check command path |
| Auth required | Authentication Required | Configure API key |
| Process crashed | Agent Crashed | Check agent logs |

## State Transitions

```
[initial]
    ↓
initializing → error
    ↓
ready ↔ busy
    ↓
disconnected
```

## Usage Example

```typescript
function ChatView() {
  const {
    session,
    errorInfo,
    createSession,
    switchAgent,
    closeSession
  } = useAgentSession(agentClient, settingsAccess, defaultAgentId, vaultPath);

  // Initialize on mount
  useEffect(() => {
    createSession();
    return () => { closeSession(); };
  }, []);

  // Handle agent switch
  const handleAgentChange = async (agentId: string) => {
    await switchAgent(agentId);
  };

  if (session.state === "error") {
    return <ErrorOverlay error={errorInfo} onRetry={createSession} />;
  }

  return <ChatUI session={session} />;
}
```
