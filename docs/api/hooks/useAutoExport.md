# useAutoExport

Hook for automatic and manual chat export to markdown.

**File:** `src/hooks/useAutoExport.ts`

## Signature

```typescript
function useAutoExport(
  plugin: AgentClientPlugin
): UseAutoExportReturn
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `plugin` | `AgentClientPlugin` | Plugin instance for settings and exporter |

## Return Value

```typescript
interface UseAutoExportReturn {
  /** Export chat if auto-export enabled for trigger */
  autoExportIfEnabled: (
    trigger: "newChat" | "closeChat",
    messages: ChatMessage[],
    session: ChatSession
  ) => Promise<void>;

  /** Manual export (always exports) */
  exportChat: (
    messages: ChatMessage[],
    session: ChatSession
  ) => Promise<string | null>;
}
```

## Functions

### `autoExportIfEnabled(trigger, messages, session): Promise<void>`

Exports chat if auto-export is enabled for the specified trigger.

**Parameters:**
- `trigger` - What triggered the export
  - `"newChat"` - User starting a new chat
  - `"closeChat"` - User closing the chat view
- `messages` - Current messages to export
- `session` - Current session info

**Conditions:**
- Checks corresponding setting (`autoExportOnNewChat` or `autoExportOnCloseChat`)
- Skips if no messages to export
- Skips if no session ID

**Usage:**
```typescript
// In handleNewChat
await autoExportIfEnabled("newChat", messages, session);
clearMessages();
await createSession();

// In onClose
await autoExportIfEnabled("closeChat", messages, session);
```

---

### `exportChat(messages, session): Promise<string | null>`

Manually exports chat to markdown file.

**Parameters:**
- `messages` - Messages to export
- `session` - Session info (agent name, session ID, timestamps)

**Returns:** File path or null if no messages

**Process:**
1. Generate filename from timestamp
2. Create folder if needed
3. Generate frontmatter with metadata
4. Convert messages to markdown
5. Create or update file
6. Optionally open file

---

## Export Format

### Frontmatter

```yaml
---
created: 2025-01-15T14:30:45
agentDisplayName: Claude Code
agentId: claude-code-acp
session_id: abc123-...
tags: [agent-client]
---
```

### Message Format

```markdown
# Claude Code

## 14:30:45 - User

Help me refactor this function.

---

## 14:30:48 - Assistant

I'll help you refactor that function.

> [!info]- Thinking
> Analyzing the function structure...

### 🔧 Edit File

**Locations**: `src/utils.ts:15`

**Status**: completed

**File**: `src/utils.ts`

```diff
- function oldCode() {}
+ function newCode() {}
```

---
```

## Export Settings

```typescript
interface ExportSettings {
  defaultFolder: string;          // "Agent Client"
  filenameTemplate: string;       // "agent_client_{date}_{time}"
  autoExportOnNewChat: boolean;   // Export before clearing
  autoExportOnCloseChat: boolean; // Export before closing
  openFileAfterExport: boolean;   // Open exported file
  includeImages: boolean;         // Include image attachments
  imageLocation: "obsidian" | "custom" | "base64";
  imageCustomFolder: string;      // Custom folder for images
  frontmatterTag: string;         // Tag to add to frontmatter
}
```

## Image Handling

Images can be exported in three ways:

### Obsidian Attachments
```typescript
imageLocation: "obsidian"
// Uses Obsidian's attachment folder settings
// Result: ![[image_001.png]]
```

### Custom Folder
```typescript
imageLocation: "custom"
imageCustomFolder: "Agent Client/Images"
// Saves to specified folder
// Result: ![[image_001.png]]
```

### Base64 Inline
```typescript
imageLocation: "base64"
// Embeds directly in markdown
// Result: ![Image](data:image/png;base64,...)
```

## Session ID Conflict Resolution

When exporting to a file with the same timestamp:

1. Check if existing file has same `session_id`
2. If same → overwrite (same session)
3. If different → use suffix (`_2`, `_3`, etc.)

```typescript
// Existing: agent_client_20250115_143045.md (session: abc)
// New export for session xyz → agent_client_20250115_143045_2.md
// New export for session abc → overwrites original
```

## Usage Example

```typescript
function ChatView() {
  const { autoExportIfEnabled, exportChat } = useAutoExport(plugin);
  const { messages, clearMessages } = useChat(...);
  const { session, createSession, closeSession } = useAgentSession(...);

  const handleNewChat = async () => {
    await autoExportIfEnabled("newChat", messages, session);
    clearMessages();
    await createSession();
  };

  const handleExport = async () => {
    const filePath = await exportChat(messages, session);
    if (filePath) {
      new Notice(`Exported to ${filePath}`);
    }
  };

  const handleClose = async () => {
    await autoExportIfEnabled("closeChat", messages, session);
    await closeSession();
  };

  return (
    <ChatHeader
      onNewChat={handleNewChat}
      onExport={handleExport}
    />
  );
}
```
