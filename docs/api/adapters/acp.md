# ACP Adapter

Implementation of the Agent Client Protocol (ACP) for agent communication.

**File:** `src/adapters/acp/acp.adapter.ts`

## Overview

`AcpAdapter` implements both `IAgentClient` and `IAcpClient` interfaces, managing:
- Agent process lifecycle (spawn, communicate, terminate)
- JSON-RPC 2.0 protocol over stdin/stdout
- Permission request handling with promises
- Terminal session management
- Session updates via unified callback

## Class: AcpAdapter

```typescript
class AcpAdapter implements IAgentClient, IAcpClient {
  constructor(plugin: AgentClientPlugin)
}
```

### Lifecycle Methods

#### `async initialize(config: AgentConfig): Promise<InitializeResult>`

Spawns the agent process and establishes protocol handshake.

**Process:**
1. Build environment with API keys and custom env vars
2. Spawn process using `TerminalManager`
3. Set up JSON-RPC client over stdin/stdout via `ndJsonStream`
4. Register notification handlers
5. Send `initialize` request
6. Resolve or reject based on response

**Error Handling:**
- `spawn_failed` - Process spawn error (logged with error details)
- `command_not_found` - Exit code 127
- `process_crashed` - Abnormal termination

---

#### `async newSession(workingDirectory: string): Promise<NewSessionResult>`

Creates a new chat session with the agent.

**Request:**
```json
{
  "method": "newSession",
  "params": {
    "workingDirectory": "/path/to/vault"
  }
}
```

**Response:**
```json
{
  "sessionId": "session-uuid"
}
```

---

#### `async disconnect(): Promise<void>`

Gracefully terminates the agent connection.

**Process:**
1. Kill all running terminals via `TerminalManager`
2. Close JSON-RPC transport
3. Kill agent process with SIGTERM
4. Reset internal state

---

### Messaging Methods

#### `async sendPrompt(sessionId: string, content: PromptContent[]): Promise<void>`

Sends a message to the agent.

**Content Types:**
- `text` - Plain text message
- `image` - Base64 encoded image with MIME type
- `resource` - Embedded context for agents with `embeddedContext` capability

**ACP Request:**
```json
{
  "method": "prompt",
  "params": {
    "sessionId": "session-uuid",
    "content": [
      { "type": "text", "text": "Help me with this code" }
    ]
  }
}
```

---

#### `async cancel(sessionId: string): Promise<void>`

Cancels the current operation in a session.

---

### Session Update Handling

#### `onSessionUpdate(callback: (update: SessionUpdate) => void): void`

Registers a unified callback for all session updates.

**Internal:** Called when receiving `session/update` notifications from the agent.

**Update Types:**
| Type | Description |
|------|-------------|
| `agent_message_chunk` | Text chunk from agent response |
| `agent_thought_chunk` | Agent's internal reasoning |
| `user_message_chunk` | User message during session/load |
| `tool_call` | New tool execution started |
| `tool_call_update` | Update to existing tool call |
| `plan` | Agent's execution plan |
| `available_commands_update` | Slash commands changed |
| `current_mode_update` | Session mode changed |

---

### Permission Handling

#### Permission Flow

1. Agent sends `requestPermission` JSON-RPC request
2. Adapter creates a Promise and stores resolver in `Map<requestId, resolver>`
3. Adapter emits `tool_call_update` with `permissionRequest` data
4. UI displays permission options to user
5. User selects option, calls `respondToPermission()`
6. Adapter resolves the stored Promise
7. Agent receives permission response and continues

#### `async respondToPermission(requestId: string, optionId: string): Promise<void>`

Resolves a pending permission request.

**Parameters:**
- `requestId` - Permission request ID from tool call
- `optionId` - User's selected option ID

---

### Mode and Model Management

#### `async setSessionMode(sessionId: string, modeId: string): Promise<void>`

Changes the session's operating mode.

**ACP Request:**
```json
{
  "method": "setSessionMode",
  "params": {
    "sessionId": "session-uuid",
    "modeId": "plan"
  }
}
```

---

#### `async setSessionModel(sessionId: string, modelId: string): Promise<void>`

Changes the session's AI model.

---

### Session History Methods

#### `async listSessions(cwd?: string, cursor?: string): Promise<ListSessionsResult>`

Lists available sessions from the agent.

**Requires:** `sessionCapabilities.list`

---

#### `async loadSession(sessionId: string, cwd: string): Promise<LoadSessionResult>`

Loads a previous session with history replay.

**Requires:** `sessionCapabilities.load`

**Note:** History is replayed via `session/update` notifications.

---

#### `async resumeSession(sessionId: string, cwd: string): Promise<ResumeSessionResult>`

Resumes a previous session without history replay.

**Requires:** `sessionCapabilities.resume`

---

#### `async forkSession(sessionId: string, cwd: string): Promise<ForkSessionResult>`

Creates a new session branching from an existing one.

**Requires:** `sessionCapabilities.fork`

---

### Terminal Methods (IAcpClient)

#### `createTerminal(params: CreateTerminalRequest): string`

Creates a new terminal session for command execution.

**Implementation:** Delegates to `TerminalManager.createTerminal()`.

---

#### `terminalOutput(terminalId: string): TerminalOutputResult | null`

Gets current terminal output and status.

---

#### `killTerminal(terminalId: string): boolean`

Sends SIGTERM to the terminal process.

---

#### `releaseTerminal(terminalId: string): boolean`

Releases terminal with 30-second grace period for final output.

---

## Type Converter (`acp-type-converter.ts`)

Converts between ACP protocol types and domain models.

### Functions

#### `convertSessionUpdate(notification: SessionNotification): SessionUpdate[]`

Converts ACP session notifications to domain `SessionUpdate` types.

**Handles:**
- `agentMessage` / `agentMessageChunk` → `AgentMessageChunk`
- `agentThought` / `agentThoughtChunk` → `AgentThoughtChunk`
- `userMessage` / `userMessageChunk` → `UserMessageChunk`
- `toolCall` → `ToolCall`
- `toolCallUpdate` → `ToolCallUpdate`
- `plan` → `Plan`
- `availableCommandsUpdate` → `AvailableCommandsUpdate`
- `currentModeUpdate` → `CurrentModeUpdate`

---

#### `convertToolCallContent(content: AcpToolCallContent[]): ToolCallContent[]`

Converts ACP tool call content to domain format.

**Content Types:**
- `text` - Plain text output
- `diff` - File modification with before/after
- `terminal` - Terminal session reference

---

#### `convertPermissionRequest(request: AcpPermissionRequest): PermissionRequest`

Converts ACP permission request to domain format.

---

## Protocol Details

### JSON-RPC 2.0

Communication uses newline-delimited JSON (ndjson) over stdin/stdout:

```
→ {"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}\n
← {"jsonrpc":"2.0","id":1,"result":{...}}\n
← {"jsonrpc":"2.0","method":"session/update","params":{...}}\n
```

### Message Types

| Direction | Type | Description |
|-----------|------|-------------|
| Request | Client → Agent | Methods: initialize, newSession, prompt, cancel, etc. |
| Response | Agent → Client | Success results or errors |
| Notification | Agent → Client | session/update events |
| Request | Agent → Client | requestPermission (client must respond) |

### Error Codes

| Code | Name | Description |
|------|------|-------------|
| -32700 | Parse Error | Invalid JSON |
| -32600 | Invalid Request | Invalid JSON-RPC |
| -32601 | Method Not Found | Unknown method |
| -32602 | Invalid Params | Invalid parameters |
| -32603 | Internal Error | Agent internal error |
| -32000 | Auth Required | Authentication needed |
| -32002 | Resource Not Found | Session/resource not found |
