# Shared Utilities

Pure functions and utility services used across the application. These are non-React utilities that can be used anywhere.

## Overview

```
shared/
├── message-service.ts        # Prompt preparation and sending
├── terminal-manager.ts       # Terminal process management
├── chat-exporter.ts          # Export to markdown
├── logger.ts                 # Logging with debug mode
├── mention-utils.ts          # Mention detection and extraction
├── path-utils.ts             # Path resolution
├── shell-utils.ts            # Shell escaping
├── wsl-utils.ts              # WSL compatibility
├── windows-env.ts            # Windows environment
├── session-capability-utils.ts # Capability detection
├── settings-utils.ts         # Settings validation
├── acp-error-utils.ts        # Error handling
└── prompt-complexity-analyzer.ts # Complexity analysis
```

---

## Message Service (`message-service.ts`)

Pure functions for prompt preparation and sending.

### `preparePrompt(input, vaultAccess, mentionService): Promise<PreparePromptResult>`

Prepares a message for sending to the agent.

**Process:**
1. Extract @[[mentions]] from text
2. Read note contents for each mention
3. Build context blocks (Resource or XML based on capabilities)
4. Add auto-mention context if enabled
5. Return display content and agent content

**Input:**
```typescript
interface PreparePromptInput {
  message: string;
  images?: ImagePromptContent[];
  activeNote?: NoteMetadata | null;
  vaultBasePath: string;
  isAutoMentionDisabled?: boolean;
  convertToWsl?: boolean;
  supportsEmbeddedContext?: boolean;
  maxNoteLength?: number;
  maxSelectionLength?: number;
}
```

**Output:**
```typescript
interface PreparePromptResult {
  displayContent: PromptContent[];  // For UI
  agentContent: PromptContent[];    // For agent
  autoMentionContext?: {...};       // Auto-mention metadata
}
```

### `sendPreparedPrompt(input, agentClient): Promise<SendPromptResult>`

Sends prepared content to the agent with error handling.

**Features:**
- Authentication retry for -32000 errors
- Empty response error filtering
- Error conversion to `AcpError`

---

## Terminal Manager (`terminal-manager.ts`)

Manages terminal processes for agent tool execution.

### Class: TerminalManager

```typescript
class TerminalManager {
  constructor(plugin: AgentClientPlugin)

  createTerminal(params: CreateTerminalRequest): string
  getOutput(terminalId: string): TerminalOutputResult | null
  waitForExit(terminalId: string): Promise<ExitStatus>
  killTerminal(terminalId: string): boolean
  releaseTerminal(terminalId: string): boolean
  killAllTerminals(): void
}
```

### Platform Handling

**macOS/Linux:**
```typescript
// Wrap in login shell for environment
const shell = Platform.isMacOS ? "/bin/zsh" : "/bin/bash";
command = shell;
args = ["-l", "-c", commandString];
```

**Windows (non-WSL):**
```typescript
// Use shell mode for proper handling
spawn(command, args, { shell: true });
```

**Windows (WSL):**
```typescript
// Wrap command for WSL execution
const wslWrapped = wrapCommandForWsl(command, args, cwd, distribution);
spawn(wslWrapped.command, wslWrapped.args);
```

---

## Chat Exporter (`chat-exporter.ts`)

Exports chat sessions to markdown files.

### Class: ChatExporter

```typescript
class ChatExporter {
  constructor(plugin: AgentClientPlugin)

  exportToMarkdown(
    messages: ChatMessage[],
    agentLabel: string,
    agentId: string,
    sessionId: string,
    sessionCreatedAt: Date,
    openFile?: boolean
  ): Promise<string>
}
```

### Export Features

- Frontmatter with metadata
- Message formatting with timestamps
- Tool call rendering
- Diff code blocks
- Plan checkboxes
- Image attachments (multiple modes)
- Session ID conflict resolution

---

## Logger (`logger.ts`)

Logging utility that respects debug mode setting.

### Class: Logger

```typescript
class Logger {
  constructor(plugin: AgentClientPlugin)

  log(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
}
```

**Behavior:**
- `log()` and `warn()` only output when `debugMode` is enabled
- `error()` always outputs

---

## Mention Utils (`mention-utils.ts`)

Utilities for mention detection and extraction.

### `detectMention(text, cursorPosition, plugin): MentionContext | null`

Detects @-mention at cursor position.

**Formats:**
- `@query` - Simple format (no spaces)
- `@[[query]]` - Bracket format (allows spaces)

### `replaceMention(text, context, noteTitle): { newText, newCursorPos }`

Replaces mention with selected note.

**Output format:** ` @[[Note Name]] `

### `extractMentionedNotes(text, mentionService): Array<{noteTitle, file}>`

Extracts all @[[note]] mentions from text.

---

## Path Utils (`path-utils.ts`)

Path resolution and manipulation utilities.

### `buildFileUri(absolutePath: string): string`

Converts absolute path to `file://` URI.

### `resolveCommandDirectory(commandPath: string): string | null`

Extracts directory from command path.

---

## Shell Utils (`shell-utils.ts`)

Shell escaping utilities.

### `escapeShellArgWindows(arg: string): string`

Escapes argument for Windows shell.

**Handles:**
- Spaces
- Special characters
- Quotes

---

## WSL Utils (`wsl-utils.ts`)

Windows Subsystem for Linux utilities.

### `convertWindowsPathToWsl(windowsPath: string): string`

Converts Windows path to WSL path.

```typescript
// C:\Users\name\file.txt → /mnt/c/Users/name/file.txt
```

### `wrapCommandForWsl(command, args, cwd, distribution, nodeDir): WrappedCommand`

Wraps command for WSL execution.

**Output:**
```typescript
{
  command: "wsl",
  args: ["-d", "Ubuntu", "--", "bash", "-lc", "cd /mnt/c/... && command args"]
}
```

---

## Windows Env (`windows-env.ts`)

Windows environment enhancement.

### `getEnhancedWindowsEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv`

Enhances PATH with full system PATH from registry.

**Problem:** Electron apps launched from shortcuts don't inherit full PATH.

**Solution:** Read PATH from registry and merge.

---

## Session Capability Utils (`session-capability-utils.ts`)

Capability detection utilities.

### `getSessionCapabilityFlags(capabilities): SessionCapabilityFlags`

Extracts capability flags from agent capabilities.

```typescript
interface SessionCapabilityFlags {
  canList: boolean;   // session/list supported
  canLoad: boolean;   // session/load supported
  canResume: boolean; // session/resume supported
  canFork: boolean;   // session/fork supported
}
```

---

## Settings Utils (`settings-utils.ts`)

Settings validation and sanitization.

### `sanitizeArgs(args: unknown): string[]`

Sanitizes command-line arguments array.

### `normalizeEnvVars(env: unknown): AgentEnvVar[]`

Normalizes environment variables array.

### `normalizeCustomAgent(agent: unknown): CustomAgentSettings`

Normalizes custom agent settings.

### `ensureUniqueCustomAgentIds(agents: CustomAgentSettings[]): CustomAgentSettings[]`

Ensures all custom agents have unique IDs.

---

## ACP Error Utils (`acp-error-utils.ts`)

Error handling utilities.

### `extractErrorCode(error: unknown): number | null`

Extracts ACP error code from error object.

### `toAcpError(error: unknown, sessionId?: string): AcpError`

Converts any error to AcpError format.

### `isEmptyResponseError(error: unknown): boolean`

Checks if error is ignorable empty response error.

---

## Prompt Complexity Analyzer (`prompt-complexity-analyzer.ts`)

Analyzes prompt complexity for model switching.

### `analyzePromptComplexity(prompt, thresholds): ComplexityAnalysisResult`

Analyzes prompt and returns complexity score.

**Factors:**
- Character count
- Code blocks
- Questions
- Complexity keywords
- @[[note]] mentions

### `getRecommendedModel(currentModelId, analysis, simpleModelId, complexModelId): string | null`

Returns recommended model based on analysis, or null if no switch needed.
