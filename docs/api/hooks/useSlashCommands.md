# useSlashCommands

Hook for managing /command suggestions dropdown.

**File:** `src/hooks/useSlashCommands.ts`

## Signature

```typescript
function useSlashCommands(
  availableCommands: SlashCommand[],
  onAutoMentionToggle?: (disabled: boolean) => void
): UseSlashCommandsReturn
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `availableCommands` | `SlashCommand[]` | Available commands from session |
| `onAutoMentionToggle` | `(disabled: boolean) => void` | Callback to disable/enable auto-mention |

## Return Value

```typescript
interface UseSlashCommandsReturn {
  /** Filtered command suggestions */
  suggestions: SlashCommand[];

  /** Currently selected index in dropdown */
  selectedIndex: number;

  /** Whether dropdown is open */
  isOpen: boolean;

  /** Update suggestions based on input */
  updateSuggestions: (input: string, cursorPosition: number) => void;

  /** Select a command and get updated text */
  selectSuggestion: (input: string, command: SlashCommand) => string;

  /** Navigate dropdown selection */
  navigate: (direction: "up" | "down") => void;

  /** Close the dropdown */
  close: () => void;
}
```

## Types

### `SlashCommand`

```typescript
interface SlashCommand {
  name: string;         // Command name (e.g., "web")
  description: string;  // What the command does
  hint?: string | null; // Input hint text
}
```

## Functions

### `updateSuggestions(input, cursorPosition): void`

Updates command suggestions based on current input.

**Detection Logic:**
- Slash commands only trigger at the **beginning** of input
- Must start with `/`
- Closes when space is typed (command complete)

**Auto-Mention Interaction:**
- Disables auto-mention when slash command detected
- Re-enables when slash command cleared

**Usage:**
```typescript
const handleChange = (e) => {
  const text = e.target.value;
  updateSuggestions(text, e.target.selectionStart);
};
```

---

### `selectSuggestion(input, command): string`

Selects a command and returns the updated input.

**Parameters:**
- `input` - Current input text
- `command` - Selected command

**Returns:** Command text with trailing space (e.g., `/web `)

---

### `navigate(direction: "up" | "down"): void`

Navigates the dropdown selection.

---

### `close(): void`

Closes the dropdown and clears state.

---

## Detection Algorithm

```typescript
function detectSlashCommand(input: string, cursorPosition: number) {
  // Must start with /
  if (!input.startsWith("/")) {
    return null;
  }

  const textUpToCursor = input.slice(0, cursorPosition);
  const afterSlash = textUpToCursor.slice(1); // Remove leading /

  // Space means command is complete
  if (afterSlash.includes(" ")) {
    return { complete: true, query: afterSlash.split(" ")[0] };
  }

  // Still typing command name
  return { complete: false, query: afterSlash.toLowerCase() };
}
```

## Auto-Mention Coordination

Slash commands require the `/` to be at the start of input. When a slash command is detected, auto-mention must be disabled to prevent prepending the active note mention.

```typescript
updateSuggestions = (input, cursorPosition) => {
  if (!input.startsWith("/")) {
    if (wasOpen) {
      onAutoMentionToggle?.(false); // Re-enable auto-mention
    }
    close();
    return;
  }

  // Disable auto-mention for slash commands
  onAutoMentionToggle?.(true);

  // Filter and show suggestions
  const query = input.slice(1).toLowerCase();
  const filtered = availableCommands.filter(cmd =>
    cmd.name.toLowerCase().includes(query)
  );
  setSuggestions(filtered);
};
```

## Usage Example

```typescript
function ChatInput() {
  const [input, setInput] = useState("");
  const { toggle: toggleAutoMention } = useAutoMention(vaultAccess);

  const {
    suggestions,
    selectedIndex,
    isOpen,
    updateSuggestions,
    selectSuggestion,
    navigate
  } = useSlashCommands(session.availableCommands, toggleAutoMention);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        navigate("up");
        break;
      case "ArrowDown":
        e.preventDefault();
        navigate("down");
        break;
      case "Enter":
      case "Tab":
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          const newText = selectSuggestion(input, suggestions[selectedIndex]);
          setInput(newText);
        }
        break;
    }
  };

  return (
    <div>
      <textarea
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          updateSuggestions(e.target.value, e.target.selectionStart);
        }}
        onKeyDown={handleKeyDown}
      />
      {isOpen && (
        <SuggestionDropdown
          suggestions={suggestions.map(cmd => ({
            label: `/${cmd.name}`,
            description: cmd.description
          }))}
          selectedIndex={selectedIndex}
          onSelect={(_, index) => {
            const newText = selectSuggestion(input, suggestions[index]);
            setInput(newText);
          }}
        />
      )}
    </div>
  );
}
```

## Common Commands

| Command | Description |
|---------|-------------|
| `/web` | Search the web |
| `/plan` | Create execution plan |
| `/compact` | Condense conversation |
| `/clear` | Clear conversation |
| `/model` | Switch AI model |
