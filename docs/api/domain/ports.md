# Domain Ports

Port interfaces define contracts between the application layer and external systems. Adapters implement these interfaces to provide concrete functionality.

## IAgentClient (`agent-client.port.ts`)

Main interface for agent communication. Implemented by `AcpAdapter`.

### Methods

#### `initialize(config: AgentConfig): Promise<InitializeResult>`

Initialize the agent client with configuration.

**Parameters:**
- `config` - Agent configuration with command, args, env, and API key

**Returns:**
```typescript
interface InitializeResult {
  success: boolean;
  sessionModes?: SessionModeState;
  sessionModels?: SessionModelState;
  agentCapabilities?: {
    loadSession?: boolean;
    sessionCapabilities?: {
      load?: boolean;
      resume?: boolean;
      fork?: boolean;
      list?: boolean;
    };
    mcpCapabilities?: {
      sampling?: boolean;
    };
  };
  promptCapabilities?: {
    image?: boolean;
    audio?: boolean;
    embeddedContext?: boolean;
  };
  authMethods?: AuthenticationMethod[];
  agentInfo?: {
    name: string;
    title?: string;
    version?: string;
  };
}
```

**Usage:**
```typescript
const result = await agentClient.initialize({
  agentId: "claude-code-acp",
  command: "npx",
  args: ["-y", "@anthropics/claude-code-acp"],
  env: [{ key: "ANTHROPIC_API_KEY", value: "..." }]
});
```

---

#### `newSession(workingDirectory: string): Promise<NewSessionResult>`

Create a new chat session.

**Parameters:**
- `workingDirectory` - Working directory for the session (vault path)

**Returns:**
```typescript
interface NewSessionResult {
  success: boolean;
  sessionId: string;
}
```

---

#### `sendPrompt(sessionId: string, content: PromptContent[]): Promise<void>`

Send a message to the agent.

**Parameters:**
- `sessionId` - Active session ID
- `content` - Array of content blocks (text, image, resource)

**Usage:**
```typescript
await agentClient.sendPrompt(sessionId, [
  { type: "text", text: "Help me refactor this code" },
  { type: "image", data: base64Data, mimeType: "image/png" }
]);
```

---

#### `authenticate(methodId: string): Promise<boolean>`

Authenticate with the specified method.

**Parameters:**
- `methodId` - Authentication method ID from `InitializeResult.authMethods`

**Returns:** Whether authentication succeeded

---

#### `cancel(sessionId: string): Promise<void>`

Cancel the current operation in a session.

---

#### `disconnect(): Promise<void>`

Disconnect and clean up all resources.

---

#### `onSessionUpdate(callback: (update: SessionUpdate) => void): void`

Register callback for session updates.

**Parameters:**
- `callback` - Function called with session updates

**Update Types:**
- `agent_message_chunk` - Text from agent response
- `agent_thought_chunk` - Agent reasoning/thinking
- `tool_call` - New tool execution
- `tool_call_update` - Update to existing tool call
- `plan` - Agent's task plan
- `available_commands_update` - Slash commands changed
- `current_mode_update` - Mode changed

---

#### `respondToPermission(requestId: string, optionId: string): Promise<void>`

Respond to a permission request.

**Parameters:**
- `requestId` - Permission request ID from tool call
- `optionId` - Selected option ID

---

#### `setSessionMode(sessionId: string, modeId: string): Promise<void>`

Change the session's operating mode.

---

#### `setSessionModel(sessionId: string, modelId: string): Promise<void>`

Change the session's AI model.

---

#### `listSessions(cwd?: string, cursor?: string): Promise<ListSessionsResult>`

List available sessions (requires `sessionCapabilities.list`).

---

#### `loadSession(sessionId: string, cwd: string): Promise<LoadSessionResult>`

Load a previous session (requires `sessionCapabilities.load`).

---

#### `resumeSession(sessionId: string, cwd: string): Promise<ResumeSessionResult>`

Resume a previous session (requires `sessionCapabilities.resume`).

---

#### `forkSession(sessionId: string, cwd: string): Promise<ForkSessionResult>`

Fork a session to create a new branch (requires `sessionCapabilities.fork`).

---

#### `isInitialized(): boolean`

Check if the client is initialized.

---

#### `getCurrentAgentId(): string | null`

Get the currently active agent ID.

---

## IVaultAccess (`vault-access.port.ts`)

Interface for Obsidian vault operations. Implemented by `VaultAdapter`.

### Types

#### `NoteMetadata`
```typescript
interface NoteMetadata {
  path: string;           // Full path in vault
  name: string;           // File name without extension
  basename: string;       // File basename
  modified: number;       // Last modified timestamp
  selection?: {           // Current text selection
    from: EditorPosition;
    to: EditorPosition;
  };
}
```

#### `EditorPosition`
```typescript
interface EditorPosition {
  line: number;  // 0-indexed line number
  ch: number;    // Character position in line
}
```

### Methods

#### `readNote(path: string): Promise<string>`

Read the content of a note.

**Parameters:**
- `path` - Vault-relative path to the note

**Returns:** Note content as string

**Throws:** Error if file doesn't exist or can't be read

---

#### `searchNotes(query: string): Promise<NoteMetadata[]>`

Search for notes matching the query.

**Parameters:**
- `query` - Search string (fuzzy matching on basename, path, and aliases)

**Returns:** Array of matching notes, sorted by relevance

---

#### `getActiveNote(): Promise<NoteMetadata | null>`

Get the currently active note in the editor.

**Returns:** Note metadata or null if no note is active

---

#### `listNotes(): Promise<NoteMetadata[]>`

List all notes in the vault.

**Returns:** Array of all note metadata

---

## ISettingsAccess (`settings-access.port.ts`)

Interface for plugin settings access. Implemented by `SettingsStore`.

### Methods

#### `getSnapshot(): AgentClientPluginSettings`

Get current settings snapshot.

**Returns:** Current settings object

---

#### `updateSettings(updates: Partial<AgentClientPluginSettings>): Promise<void>`

Update settings with partial object.

**Parameters:**
- `updates` - Partial settings to merge

---

#### `subscribe(listener: () => void): () => void`

Subscribe to settings changes.

**Parameters:**
- `listener` - Callback invoked when settings change

**Returns:** Unsubscribe function

**Usage:**
```typescript
const unsubscribe = settingsAccess.subscribe(() => {
  const settings = settingsAccess.getSnapshot();
  // React to settings changes
});

// Later: cleanup
unsubscribe();
```

---

#### `saveSession(session: SavedSessionInfo): Promise<void>`

Save session metadata locally.

---

#### `getSavedSessions(agentId: string, cwd?: string): SavedSessionInfo[]`

Get locally saved sessions for an agent.

---

#### `deleteSession(sessionId: string): Promise<void>`

Delete local session metadata and messages.

---

#### `saveSessionMessages(sessionId: string, agentId: string, messages: ChatMessage[]): Promise<void>`

Save session messages to local file.

---

#### `loadSessionMessages(sessionId: string): Promise<ChatMessage[] | null>`

Load session messages from local file.

---

## IAcpClient

Extended interface for ACP-specific operations. Also implemented by `AcpAdapter`.

### Methods

#### `createTerminal(params: CreateTerminalRequest): string`

Create a new terminal session.

**Parameters:**
- `params.command` - Command to execute
- `params.args` - Command arguments
- `params.cwd` - Working directory
- `params.env` - Environment variables
- `params.outputByteLimit` - Max output buffer size

**Returns:** Terminal ID

---

#### `terminalOutput(terminalId: string): TerminalOutputResult | null`

Get terminal output and status.

**Returns:**
```typescript
interface TerminalOutputResult {
  output: string;
  truncated: boolean;
  exitStatus: { exitCode: number | null; signal: string | null } | null;
}
```

---

#### `killTerminal(terminalId: string): boolean`

Kill a running terminal.

---

#### `releaseTerminal(terminalId: string): boolean`

Release terminal resources (with grace period for final output).
