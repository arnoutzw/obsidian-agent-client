# Domain Models

Complete reference for all domain model types.

## Chat Message (`chat-message.ts`)

Core types for representing chat messages and their content.

### Types

#### `Role`
```typescript
type Role = "assistant" | "user";
```
Message role in a conversation.

#### `ToolCallStatus`
```typescript
type ToolCallStatus = "pending" | "in_progress" | "completed" | "failed";
```
Status of a tool call execution.

#### `ToolKind`
```typescript
type ToolKind =
  | "read"      // Reading files or data
  | "edit"      // Modifying existing content
  | "delete"    // Removing files or data
  | "move"      // Moving or renaming
  | "search"    // Searching through content
  | "execute"   // Running commands or scripts
  | "think"     // Agent reasoning/planning
  | "fetch"     // Fetching external resources
  | "switch_mode" // Changing operation mode
  | "other";    // Other operations
```
Categories of tool operations.

### Interfaces

#### `ChatMessage`
```typescript
interface ChatMessage {
  id: string;
  role: Role;
  content: MessageContent[];
  timestamp: Date;
}
```
A single message in the chat history. Messages can contain multiple content blocks of different types.

#### `MessageContent`
```typescript
type MessageContent =
  | { type: "text"; text: string }
  | { type: "text_with_context"; text: string; autoMentionContext?: {...} }
  | { type: "agent_thought"; text: string }
  | { type: "image"; data: string; mimeType: string; uri?: string }
  | { type: "tool_call"; toolCallId: string; ... }
  | { type: "plan"; entries: PlanEntry[] }
  | { type: "permission_request"; toolCall: ToolCallInfo; ... }
  | { type: "terminal"; terminalId: string };
```
Union type representing all possible content blocks in a message.

#### `DiffContent`
```typescript
interface DiffContent {
  type: "diff";
  path: string;
  newText: string;
  oldText?: string | null;
}
```
Represents a file modification with before/after content.

#### `TerminalContent`
```typescript
interface TerminalContent {
  type: "terminal";
  terminalId: string;
}
```
Reference to a terminal session created by a tool call.

#### `ToolCallLocation`
```typescript
interface ToolCallLocation {
  path: string;
  line?: number | null;
}
```
Location information for tool operations.

#### `PermissionOption`
```typescript
interface PermissionOption {
  optionId: string;
  name: string;
  kind: "allow_once" | "allow_always" | "reject_once" | "reject_always";
}
```
User's choice for permission requests.

#### `PlanEntry`
```typescript
interface PlanEntry {
  content: string;
  status: "pending" | "in_progress" | "completed";
  priority: "high" | "medium" | "low";
}
```
Entry in an agent's plan/task list.

#### `ToolCallInfo`
```typescript
interface ToolCallInfo {
  toolCallId: string;
  title?: string | null;
  status?: ToolCallStatus | null;
  kind?: ToolKind | null;
  content?: ToolCallContent[] | null;
  locations?: ToolCallLocation[] | null;
  rawInput?: { [k: string]: unknown };
  rawOutput?: { [k: string]: unknown };
}
```
Tool call information for permission requests.

---

## Session Update (`session-update.ts`)

Types representing session update events from the agent.

### Base Interface

#### `SessionUpdateBase`
```typescript
interface SessionUpdateBase {
  sessionId: string;
}
```
Base interface containing the session ID.

### Update Types

#### `AgentMessageChunk`
```typescript
interface AgentMessageChunk extends SessionUpdateBase {
  type: "agent_message_chunk";
  text: string;
}
```
Text chunk from agent's message stream.

#### `AgentThoughtChunk`
```typescript
interface AgentThoughtChunk extends SessionUpdateBase {
  type: "agent_thought_chunk";
  text: string;
}
```
Text chunk from agent's internal reasoning.

#### `UserMessageChunk`
```typescript
interface UserMessageChunk extends SessionUpdateBase {
  type: "user_message_chunk";
  text: string;
}
```
Text chunk from user's message during session/load.

#### `ToolCall`
```typescript
interface ToolCall extends SessionUpdateBase {
  type: "tool_call";
  toolCallId: string;
  title?: string;
  status: ToolCallStatus;
  kind?: ToolKind;
  content?: ToolCallContent[];
  locations?: ToolCallLocation[];
  permissionRequest?: { requestId: string; options: PermissionOption[]; ... };
}
```
New tool call event.

#### `ToolCallUpdate`
```typescript
interface ToolCallUpdate extends SessionUpdateBase {
  type: "tool_call_update";
  toolCallId: string;
  title?: string;
  status?: ToolCallStatus;
  // ... same fields as ToolCall, all optional
}
```
Update to existing tool call.

#### `Plan`
```typescript
interface Plan extends SessionUpdateBase {
  type: "plan";
  entries: PlanEntry[];
}
```
Agent's execution plan.

#### `AvailableCommandsUpdate`
```typescript
interface AvailableCommandsUpdate extends SessionUpdateBase {
  type: "available_commands_update";
  commands: SlashCommand[];
}
```
Update to available slash commands.

#### `CurrentModeUpdate`
```typescript
interface CurrentModeUpdate extends SessionUpdateBase {
  type: "current_mode_update";
  currentModeId: string;
}
```
Update to current session mode.

### Union Type

#### `SessionUpdate`
```typescript
type SessionUpdate =
  | AgentMessageChunk
  | AgentThoughtChunk
  | UserMessageChunk
  | ToolCall
  | ToolCallUpdate
  | Plan
  | AvailableCommandsUpdate
  | CurrentModeUpdate;
```
Union of all session update types.

---

## Agent Configuration (`agent-config.ts`)

Types for agent settings and configuration.

### Interfaces

#### `AgentEnvVar`
```typescript
interface AgentEnvVar {
  key: string;   // Environment variable name
  value: string; // Environment variable value
}
```
Environment variable for agent process.

#### `BaseAgentSettings`
```typescript
interface BaseAgentSettings {
  id: string;           // Unique identifier
  displayName: string;  // Human-readable name
  command: string;      // Command to execute
  args: string[];       // Command-line arguments
  env: AgentEnvVar[];   // Environment variables
}
```
Base configuration shared by all agent types.

#### `ClaudeAgentSettings`
```typescript
interface ClaudeAgentSettings extends BaseAgentSettings {
  apiKey: string; // ANTHROPIC_API_KEY
}
```
Configuration for Claude Code agent.

#### `GeminiAgentSettings`
```typescript
interface GeminiAgentSettings extends BaseAgentSettings {
  apiKey: string; // GEMINI_API_KEY
}
```
Configuration for Gemini CLI agent.

#### `CodexAgentSettings`
```typescript
interface CodexAgentSettings extends BaseAgentSettings {
  apiKey: string; // OPENAI_API_KEY
}
```
Configuration for Codex CLI agent.

#### `CustomAgentSettings`
```typescript
type CustomAgentSettings = BaseAgentSettings;
```
Configuration for custom ACP-compatible agents.

---

## Chat Session (`chat-session.ts`)

Types for chat session state and lifecycle.

### Types

#### `SessionState`
```typescript
type SessionState =
  | "initializing"   // Connection being established
  | "authenticating" // Authentication in progress
  | "ready"          // Ready for messages
  | "busy"           // Processing request
  | "error"          // Error occurred
  | "disconnected";  // Session closed
```

### Interfaces

#### `AuthenticationMethod`
```typescript
interface AuthenticationMethod {
  id: string;
  name: string;
  description?: string | null;
}
```
Authentication method available for the session.

#### `SlashCommand`
```typescript
interface SlashCommand {
  name: string;        // Command name (e.g., "web")
  description: string; // What the command does
  hint?: string | null; // Input hint text
}
```
Slash command available in the session.

#### `SessionMode`
```typescript
interface SessionMode {
  id: string;           // Mode identifier (e.g., "build")
  name: string;         // Display name
  description?: string; // Mode description
}
```
Agent operating mode.

#### `SessionModeState`
```typescript
interface SessionModeState {
  availableModes: SessionMode[];
  currentModeId: string;
}
```
State of available modes in a session.

#### `SessionModel`
```typescript
interface SessionModel {
  modelId: string;      // Model identifier
  name: string;         // Display name
  description?: string; // Model description
}
```
AI model available in a session.

#### `SessionModelState`
```typescript
interface SessionModelState {
  availableModels: SessionModel[];
  currentModelId: string;
}
```
State of available models in a session.

#### `ChatSession`
```typescript
interface ChatSession {
  sessionId: string | null;
  state: SessionState;
  agentId: string;
  agentDisplayName: string;
  authMethods: AuthenticationMethod[];
  availableCommands?: SlashCommand[];
  modes?: SessionModeState;
  models?: SessionModelState;
  promptCapabilities?: { image?: boolean; audio?: boolean; embeddedContext?: boolean };
  agentCapabilities?: { loadSession?: boolean; sessionCapabilities?: {...}; mcpCapabilities?: {...}; ... };
  agentInfo?: { name: string; title?: string; version?: string };
  createdAt: Date;
  lastActivityAt: Date;
  workingDirectory: string;
}
```
Complete chat session state.

---

## Agent Error (`agent-error.ts`)

Error types for agent operations.

### Constants

#### `AcpErrorCode`
```typescript
const AcpErrorCode = {
  // JSON-RPC 2.0 standard errors
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // ACP protocol-specific errors
  AUTHENTICATION_REQUIRED: -32000,
  RESOURCE_NOT_FOUND: -32002,
} as const;
```

### Types

#### `ProcessErrorType`
```typescript
type ProcessErrorType =
  | "spawn_failed"      // Process spawn failed
  | "command_not_found" // Exit code 127
  | "process_crashed"   // Abnormal termination
  | "process_timeout";  // Timeout
```

### Interfaces

#### `ErrorInfo`
```typescript
interface ErrorInfo {
  title: string;       // User-friendly error title
  message: string;     // Detailed error message
  suggestion?: string; // How to resolve the error
}
```
User-facing error information.

#### `AcpError`
```typescript
interface AcpError extends ErrorInfo {
  code: number;                  // ACP/JSON-RPC error code
  data?: unknown;                // Additional error data
  sessionId?: string | null;     // Session where error occurred
  originalError?: unknown;       // Original error for debugging
}
```
ACP protocol error.

#### `ProcessError`
```typescript
interface ProcessError extends ErrorInfo {
  type: ProcessErrorType;
  agentId: string;
  exitCode?: number;
  errorCode?: string;     // Node.js error code (e.g., "ENOENT")
  originalError?: unknown;
}
```
Process-level error from agent management.

---

## Prompt Content (`prompt-content.ts`)

Types for prompt content sent to agents.

### Types

#### `PromptContent`
```typescript
type PromptContent = TextPromptContent | ImagePromptContent | ResourcePromptContent;
```

#### `TextPromptContent`
```typescript
interface TextPromptContent {
  type: "text";
  text: string;
}
```

#### `ImagePromptContent`
```typescript
interface ImagePromptContent {
  type: "image";
  data: string;      // Base64 encoded
  mimeType: string;  // e.g., "image/png"
}
```

#### `ResourcePromptContent`
```typescript
interface ResourcePromptContent {
  type: "resource";
  resource: {
    uri: string;
    mimeType: string;
    text: string;
  };
  annotations?: {
    audience?: string[];
    priority?: number;
    lastModified?: string;
  };
}
```
Embedded context resource for agents with `embeddedContext` capability.

---

## Session Info (`session-info.ts`)

Types for session management operations.

### Interfaces

#### `SessionInfo`
```typescript
interface SessionInfo {
  sessionId: string;
  cwd: string;
  title?: string;
  updatedAt?: string;
}
```
Basic session metadata.

#### `SavedSessionInfo`
```typescript
interface SavedSessionInfo {
  sessionId: string;
  agentId: string;
  cwd: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
```
Locally saved session metadata.

#### `ListSessionsResult`
```typescript
interface ListSessionsResult {
  sessions: SessionInfo[];
  nextCursor?: string;
}
```
Result from listing sessions.

#### `LoadSessionResult` / `ResumeSessionResult` / `ForkSessionResult`
```typescript
interface LoadSessionResult {
  sessionId: string;
  modes?: SessionModeState;
  models?: SessionModelState;
}
```
Result from session load/resume/fork operations.
