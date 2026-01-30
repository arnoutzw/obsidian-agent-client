# Obsidian Adapters

Adapters for integrating with Obsidian's vault, settings, and file indexing.

## VaultAdapter (`vault.adapter.ts`)

Implements `IVaultAccess` for Obsidian vault operations.

### Constructor

```typescript
constructor(plugin: AgentClientPlugin)
```

### Methods

#### `async readNote(path: string): Promise<string>`

Reads the content of a note from the vault.

**Parameters:**
- `path` - Vault-relative path (e.g., `"folder/note.md"`)

**Returns:** Note content as string

**Implementation:**
```typescript
const file = this.plugin.app.vault.getAbstractFileByPath(path);
if (file instanceof TFile) {
  return await this.plugin.app.vault.read(file);
}
throw new Error(`File not found: ${path}`);
```

---

#### `async searchNotes(query: string): Promise<NoteMetadata[]>`

Searches for notes matching the query using fuzzy matching.

**Parameters:**
- `query` - Search string

**Returns:** Array of matching notes sorted by relevance

**Implementation:**
- Uses Obsidian's `FuzzySuggestModal` matching algorithm
- Searches across:
  - File basename (e.g., `"My Note"`)
  - Full path (e.g., `"folder/My Note.md"`)
  - Aliases from frontmatter
- Results limited to 10 items
- Sorted by fuzzy match score

---

#### `async getActiveNote(): Promise<NoteMetadata | null>`

Gets the currently active note in the editor.

**Returns:** Note metadata with selection info, or null

**Implementation:**
```typescript
const activeFile = this.plugin.app.workspace.getActiveFile();
if (!activeFile) return null;

const editor = this.plugin.app.workspace.activeEditor?.editor;
const selection = editor?.somethingSelected()
  ? { from: editor.getCursor("from"), to: editor.getCursor("to") }
  : undefined;

return {
  path: activeFile.path,
  name: activeFile.basename,
  basename: activeFile.basename,
  modified: activeFile.stat.mtime,
  selection
};
```

---

#### `async listNotes(): Promise<NoteMetadata[]>`

Lists all markdown notes in the vault.

**Returns:** Array of all note metadata

**Implementation:**
```typescript
return this.plugin.app.vault.getMarkdownFiles().map(file => ({
  path: file.path,
  name: file.basename,
  basename: file.basename,
  modified: file.stat.mtime
}));
```

---

## SettingsStore (`settings-store.adapter.ts`)

Implements `ISettingsAccess` for plugin settings management using the observer pattern.

### Factory Function

```typescript
function createSettingsStore(
  initialSettings: AgentClientPluginSettings,
  plugin: AgentClientPlugin
): SettingsStore
```

### Interface

```typescript
interface SettingsStore {
  getSnapshot: () => AgentClientPluginSettings;
  subscribe: (listener: () => void) => () => void;
  set: (settings: AgentClientPluginSettings) => void;

  // Session management
  saveSession: (session: SavedSessionInfo) => Promise<void>;
  getSavedSessions: (agentId: string, cwd?: string) => SavedSessionInfo[];
  deleteSession: (sessionId: string) => Promise<void>;
  saveSessionMessages: (sessionId: string, agentId: string, messages: ChatMessage[]) => Promise<void>;
  loadSessionMessages: (sessionId: string) => Promise<ChatMessage[] | null>;
}
```

### Methods

#### `getSnapshot(): AgentClientPluginSettings`

Returns the current settings object.

**Usage with React:**
```typescript
// In React component
const settings = useSyncExternalStore(
  settingsStore.subscribe,
  settingsStore.getSnapshot
);
```

---

#### `subscribe(listener: () => void): () => void`

Subscribes to settings changes.

**Parameters:**
- `listener` - Function called when settings change

**Returns:** Unsubscribe function

**Implementation:**
```typescript
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function set(settings: AgentClientPluginSettings): void {
  currentSettings = settings;
  listeners.forEach(listener => listener());
}
```

---

#### `set(settings: AgentClientPluginSettings): void`

Updates settings and notifies all subscribers.

**Note:** This also triggers `plugin.saveData()` for persistence.

---

### Session Storage Methods

#### `async saveSession(session: SavedSessionInfo): Promise<void>`

Saves session metadata to settings.

**Parameters:**
- `session` - Session metadata including ID, agent, title, timestamps

**Storage:** Added to `settings.savedSessions` array

---

#### `getSavedSessions(agentId: string, cwd?: string): SavedSessionInfo[]`

Gets locally saved sessions for an agent.

**Parameters:**
- `agentId` - Agent identifier
- `cwd` - Optional working directory filter

**Returns:** Sessions sorted by `updatedAt` descending

---

#### `async deleteSession(sessionId: string): Promise<void>`

Deletes session metadata and associated message file.

**Process:**
1. Remove from `settings.savedSessions`
2. Delete message file from `.obsidian/plugins/agent-client/sessions/`

---

#### `async saveSessionMessages(sessionId: string, agentId: string, messages: ChatMessage[]): Promise<void>`

Saves session messages to a JSON file.

**Storage Path:** `.obsidian/plugins/agent-client/sessions/{sessionId}.json`

**Format:**
```json
{
  "sessionId": "...",
  "agentId": "...",
  "messages": [...]
}
```

---

#### `async loadSessionMessages(sessionId: string): Promise<ChatMessage[] | null>`

Loads session messages from storage.

**Returns:** Messages array or null if file doesn't exist

---

## MentionService (`mention-service.ts`)

Service for @[[note]] mention suggestions with fuzzy search.

### Class: NoteMentionService

```typescript
class NoteMentionService implements IMentionService {
  constructor(plugin: AgentClientPlugin)
}
```

### Methods

#### `buildIndex(): void`

Builds the file index from vault contents.

**Called:** On initialization and when vault changes

**Index Contents:**
- File path
- File basename
- Aliases from frontmatter

---

#### `search(query: string): NoteMetadata[]`

Searches for notes matching the query.

**Parameters:**
- `query` - Search string for fuzzy matching

**Returns:** Array of matching notes (max 10)

**Algorithm:**
1. Split query into terms
2. Fuzzy match each term against:
   - Basename (highest weight)
   - Path (medium weight)
   - Aliases (medium weight)
3. Score and sort by relevance
4. Return top 10 results

---

#### `getAllFiles(): TFile[]`

Gets all markdown files in the vault.

**Usage:** Used by `extractMentionedNotes()` in message processing.

---

### Index Structure

```typescript
interface FileIndexEntry {
  file: TFile;
  basename: string;          // Lowercase for matching
  path: string;              // Lowercase for matching
  aliases: string[];         // From frontmatter
  basenameChars: string[];   // For fuzzy matching
}
```

### Cache Invalidation

The index is rebuilt when:
- Plugin loads
- Files are created/deleted/renamed
- Frontmatter changes (aliases)

**Implementation:** Uses Obsidian's `metadataCache.on("resolved")` event.
