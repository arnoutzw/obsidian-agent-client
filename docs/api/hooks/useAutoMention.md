# useAutoMention

Hook for managing auto-mention of the active note.

**File:** `src/hooks/useAutoMention.ts`

## Signature

```typescript
function useAutoMention(
  vaultAccess: IVaultAccess
): UseAutoMentionReturn
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `vaultAccess` | `IVaultAccess` | Vault access for getting active note |

## Return Value

```typescript
interface UseAutoMentionReturn {
  /** Currently active note for auto-mention */
  activeNote: NoteMetadata | null;

  /** Whether auto-mention is temporarily disabled */
  isDisabled: boolean;

  /** Toggle auto-mention state */
  toggle: (disabled?: boolean) => void;

  /** Update active note from vault */
  updateActiveNote: () => Promise<void>;
}
```

## Functions

### `toggle(disabled?: boolean): void`

Toggles auto-mention enabled/disabled state.

**Parameters:**
- `disabled` - If provided, set to this value. If omitted, toggle current state.

**Usage:**
```typescript
// Toggle
toggle();

// Disable for slash commands
toggle(true);

// Re-enable
toggle(false);
```

---

### `updateActiveNote(): Promise<void>`

Updates the active note from the vault.

**Implementation:**
```typescript
const updateActiveNote = useCallback(async () => {
  const note = await vaultAccess.getActiveNote();
  setActiveNote(note);
}, [vaultAccess]);
```

**Called When:**
- Component mounts
- Active file changes in Obsidian
- User switches tabs

---

## Auto-Mention Feature

When auto-mention is enabled and an active note exists:
1. The active note context is prepended to messages
2. If text is selected, only the selection is included
3. Agent receives context about what the user is looking at

### Without Selection

```xml
<obsidian_opened_note>
The user opened the note /path/to/note.md in Obsidian.
This may or may not be related to the current conversation.
If it seems relevant, consider using the Read tool to examine the content.
</obsidian_opened_note>

User's message here...
```

### With Selection

```xml
<obsidian_opened_note selection="lines 15-20">
The user opened the note /path/to/note.md and selected:

Selected text content here...

This is what the user is currently focusing on.
</obsidian_opened_note>

User's message here...
```

## Integration with Message Sending

The active note is passed to `sendMessage` in `useChat`:

```typescript
const { activeNote, isDisabled } = useAutoMention(vaultAccess);

const handleSend = async (text: string) => {
  await sendMessage(
    text,
    images,
    isDisabled ? null : activeNote,  // Pass if enabled
    isDisabled
  );
};
```

## Slash Command Coordination

Slash commands disable auto-mention to keep `/` at input start:

```typescript
const slashCommands = useSlashCommands(
  availableCommands,
  (disabled) => autoMention.toggle(disabled)
);
```

## Usage Example

```typescript
function ChatView() {
  const { activeNote, isDisabled, toggle, updateActiveNote } =
    useAutoMention(vaultAccess);

  // Update active note when file changes
  useEffect(() => {
    const handler = () => updateActiveNote();
    plugin.app.workspace.on("active-leaf-change", handler);
    return () => plugin.app.workspace.off("active-leaf-change", handler);
  }, [updateActiveNote]);

  // Toggle command
  useEffect(() => {
    const unsubscribe = plugin.app.workspace.on(
      "agent-client:toggle-auto-mention",
      () => toggle()
    );
    return unsubscribe;
  }, [toggle]);

  return (
    <ChatInput
      activeNote={isDisabled ? null : activeNote}
      showActiveNoteIndicator={!isDisabled && !!activeNote}
    />
  );
}
```

## Settings Integration

Auto-mention is controlled by settings:

```typescript
// In settings
autoMentionActiveNote: boolean

// Usage
const { settings } = useSettings(plugin);

// Only use auto-mention if setting enabled
const effectiveActiveNote =
  settings.autoMentionActiveNote && !isDisabled ? activeNote : null;
```
