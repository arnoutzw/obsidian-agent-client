# useMentions

Hook for managing @[[note]] mention suggestions dropdown.

**File:** `src/hooks/useMentions.ts`

## Signature

```typescript
function useMentions(
  vaultAccess: IVaultAccess,
  plugin: AgentClientPlugin
): UseMentionsReturn
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `vaultAccess` | `IVaultAccess` | Vault access for note searching |
| `plugin` | `AgentClientPlugin` | Plugin instance for config |

## Return Value

```typescript
interface UseMentionsReturn {
  /** Note suggestions matching current query */
  suggestions: NoteMetadata[];

  /** Currently selected index in dropdown */
  selectedIndex: number;

  /** Whether dropdown is open */
  isOpen: boolean;

  /** Current mention context (query, position) */
  context: MentionContext | null;

  /** Update suggestions based on input */
  updateSuggestions: (input: string, cursorPosition: number) => Promise<void>;

  /** Select a suggestion and get updated text */
  selectSuggestion: (input: string, suggestion: NoteMetadata) => string;

  /** Navigate dropdown selection */
  navigate: (direction: "up" | "down") => void;

  /** Close the dropdown */
  close: () => void;
}
```

## Types

### `MentionContext`

```typescript
interface MentionContext {
  start: number;   // Start index of @ symbol
  end: number;     // Current cursor position
  query: string;   // Text after @ (search query)
}
```

## Functions

### `updateSuggestions(input, cursorPosition): Promise<void>`

Updates mention suggestions based on current input and cursor position.

**Parameters:**
- `input` - Current input text
- `cursorPosition` - Cursor position in input

**Detection Logic:**
1. Find last `@` before cursor
2. Check if followed by `[[` (bracket format)
3. Extract query text
4. Search notes via `vaultAccess.searchNotes()`

**Mention Formats:**
- `@query` - Simple format (ends at whitespace)
- `@[[query]]` - Bracket format (allows spaces)

**Usage:**
```typescript
// In input onChange handler
const handleChange = (e) => {
  const text = e.target.value;
  const cursor = e.target.selectionStart;
  updateSuggestions(text, cursor);
};
```

---

### `selectSuggestion(input, suggestion): string`

Selects a note and returns the updated input text.

**Parameters:**
- `input` - Current input text
- `suggestion` - Selected note metadata

**Returns:** Updated input with mention replaced

**Replacement Format:** ` @[[Note Name]] `

**Example:**
```
Input:  "Help with @my"
Select: NoteMetadata { name: "My Project" }
Output: "Help with @[[My Project]] "
```

---

### `navigate(direction: "up" | "down"): void`

Navigates the dropdown selection.

**Parameters:**
- `direction` - Navigation direction

**Behavior:**
- Cycles within bounds (0 to suggestions.length - 1)
- Does nothing if dropdown is closed

---

### `close(): void`

Closes the dropdown and clears state.

---

## Mention Detection Algorithm

```typescript
function detectMention(text: string, cursorPosition: number): MentionContext | null {
  // Get text up to cursor
  const textUpToCursor = text.slice(0, cursorPosition);

  // Find last @ symbol
  const atIndex = textUpToCursor.lastIndexOf("@");
  if (atIndex === -1) return null;

  const afterAt = textUpToCursor.slice(atIndex + 1);

  // Handle @[[...]] format
  if (afterAt.startsWith("[[")) {
    const closingBrackets = afterAt.indexOf("]]");
    if (closingBrackets === -1) {
      // Still typing inside brackets
      return { start: atIndex, end: cursorPosition, query: afterAt.slice(2) };
    }
    // Cursor after closing - no longer a mention
    if (cursorPosition > atIndex + 1 + closingBrackets + 1) {
      return null;
    }
    // Complete bracket format
    return {
      start: atIndex,
      end: atIndex + 1 + closingBrackets + 1,
      query: afterAt.slice(2, closingBrackets)
    };
  }

  // Handle simple @query format
  if (afterAt.includes(" ") || afterAt.includes("\n")) {
    return null; // Ended by whitespace
  }

  return { start: atIndex, end: cursorPosition, query: afterAt };
}
```

## Usage Example

```typescript
function ChatInput() {
  const [input, setInput] = useState("");
  const {
    suggestions,
    selectedIndex,
    isOpen,
    updateSuggestions,
    selectSuggestion,
    navigate,
    close
  } = useMentions(vaultAccess, plugin);

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
      case "Escape":
        close();
        break;
    }
  };

  return (
    <div className="chat-input-container">
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
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          onSelect={(note) => {
            const newText = selectSuggestion(input, note);
            setInput(newText);
          }}
        />
      )}
    </div>
  );
}
```
