# Components Layer

React UI components for the chat interface and settings.

## Overview

```
components/
├── chat/                    # Chat UI components
│   ├── ChatView.tsx         # Main view (hook composition)
│   ├── ChatHeader.tsx       # Header with controls
│   ├── ChatMessages.tsx     # Message list
│   ├── ChatInput.tsx        # Input with dropdowns
│   ├── MessageRenderer.tsx  # Message routing
│   ├── MessageContentRenderer.tsx  # Content block rendering
│   ├── ToolCallRenderer.tsx       # Tool call UI
│   ├── MarkdownTextRenderer.tsx   # Markdown rendering
│   ├── TerminalRenderer.tsx       # Terminal output
│   ├── PermissionRequestSection.tsx # Permission UI
│   ├── TextWithMentions.tsx       # Mention highlights
│   ├── CollapsibleThought.tsx     # Collapsible thoughts
│   ├── SuggestionDropdown.tsx     # Dropdown for suggestions
│   ├── ImagePreviewStrip.tsx      # Image previews
│   ├── HeaderMenu.tsx             # Dropdown menu
│   ├── HeaderButton.tsx           # Button component
│   ├── SessionHistoryModal.ts     # Session history UI
│   ├── ConfirmDeleteModal.ts      # Delete confirmation
│   └── ErrorOverlay.tsx           # Error display
└── settings/
    └── AgentClientSettingTab.ts   # Settings page
```

## Component Hierarchy

```
ChatView (main container, hook composition)
├── ChatHeader
│   ├── HeaderButton (agent selector)
│   ├── HeaderButton (mode dropdown)
│   ├── HeaderButton (model dropdown)
│   └── HeaderMenu (actions menu)
├── ChatMessages
│   └── MessageRenderer (per message)
│       └── MessageContentRenderer (per content block)
│           ├── MarkdownTextRenderer
│           ├── ToolCallRenderer
│           │   ├── DiffRenderer
│           │   ├── TerminalRenderer
│           │   └── PermissionRequestSection
│           ├── CollapsibleThought
│           ├── ImagePreviewStrip
│           └── TextWithMentions
├── ChatInput
│   ├── SuggestionDropdown (mentions)
│   ├── SuggestionDropdown (slash commands)
│   └── ImagePreviewStrip (attachments)
└── ErrorOverlay (when error state)
```

## ChatView (`ChatView.tsx`)

Main view component that orchestrates hooks and adapters.

### View Registration

```typescript
export const VIEW_TYPE_CHAT = "agent-client-chat-view";

class ChatView extends ItemView {
  getViewType() { return VIEW_TYPE_CHAT; }
  getDisplayText() { return "Agent Client"; }
  getIcon() { return "bot-message-square"; }
}
```

### Hook Composition

```typescript
function ChatViewContent({ plugin, viewId }) {
  // Adapters
  const agentClient = useMemo(() => plugin.getOrCreateAdapter(viewId), []);
  const vaultAccess = useMemo(() => new VaultAdapter(plugin), []);
  const mentionService = useMemo(() => new NoteMentionService(plugin), []);

  // Core hooks
  const session = useAgentSession(agentClient, settingsAccess, defaultAgentId, vaultPath);
  const chat = useChat(agentClient, session, vaultAccess, mentionService, settingsAccess);
  const permission = usePermission(agentClient, chat.messages);

  // Feature hooks
  const mentions = useMentions(vaultAccess, plugin);
  const slashCommands = useSlashCommands(session.availableCommands);
  const autoMention = useAutoMention(vaultAccess);
  const autoExport = useAutoExport(plugin);
  const sessionHistory = useSessionHistory({...});

  // Register session update handler
  useEffect(() => {
    agentClient.onSessionUpdate(handleSessionUpdate);
  }, []);

  // ...render
}
```

### Session Update Routing

```typescript
const handleSessionUpdate = useCallback((update: SessionUpdate) => {
  // Route to appropriate handler
  switch (update.type) {
    case "available_commands_update":
      session.updateAvailableCommands(update.commands);
      break;
    case "current_mode_update":
      session.updateCurrentMode(update.currentModeId);
      break;
    default:
      // Message-level updates go to useChat
      chat.handleSessionUpdate(update);
  }
}, [session, chat]);
```

---

## ChatHeader (`ChatHeader.tsx`)

Header with agent selector, mode/model dropdowns, and actions menu.

### Props

```typescript
interface ChatHeaderProps {
  session: ChatSession;
  agents: Array<{ id: string; displayName: string }>;
  onAgentChange: (agentId: string) => void;
  onModeChange: (modeId: string) => void;
  onModelChange: (modelId: string) => void;
  onNewChat: () => void;
  onExport: () => void;
  onSessionHistory: () => void;
  isLoading: boolean;
}
```

### Features

- Agent selector dropdown
- Mode selector (if modes available)
- Model selector (if models available)
- Actions menu (New Chat, Export, Session History)
- Loading indicator

---

## ChatMessages (`ChatMessages.tsx`)

Scrollable message list with auto-scroll on new messages.

### Props

```typescript
interface ChatMessagesProps {
  messages: ChatMessage[];
  onPermissionSelect: (requestId: string, optionId: string) => void;
  showEmojis: boolean;
  autoCollapseDiffs: boolean;
  diffCollapseThreshold: number;
}
```

### Auto-Scroll

```typescript
// Scroll to bottom when new messages arrive
useEffect(() => {
  if (containerRef.current) {
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }
}, [messages]);
```

---

## ChatInput (`ChatInput.tsx`)

Text input with mention/command dropdowns and image attachments.

### Props

```typescript
interface ChatInputProps {
  onSend: (text: string, images: ImagePromptContent[]) => void;
  disabled: boolean;
  sendShortcut: "enter" | "cmd-enter";
  activeNote: NoteMetadata | null;

  // Mention props
  mentionSuggestions: NoteMetadata[];
  mentionSelectedIndex: number;
  onMentionSelect: (note: NoteMetadata) => void;
  onMentionNavigate: (direction: "up" | "down") => void;

  // Slash command props
  commandSuggestions: SlashCommand[];
  commandSelectedIndex: number;
  onCommandSelect: (command: SlashCommand) => void;

  // Input state (for broadcast)
  onInputChange: (state: ChatInputState) => void;
  inputState?: ChatInputState;
}
```

### Keyboard Handling

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  // Dropdown navigation
  if (mentionsOpen || commandsOpen) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      // Navigate dropdown
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      // Select item
    }
    if (e.key === "Escape") {
      // Close dropdown
    }
    return;
  }

  // Send handling
  if (e.key === "Enter") {
    if (sendShortcut === "enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (sendShortcut === "cmd-enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }
};
```

---

## MessageContentRenderer (`MessageContentRenderer.tsx`)

Renders individual content blocks based on type.

### Content Type Routing

```typescript
function MessageContentRenderer({ content }) {
  switch (content.type) {
    case "text":
      return <MarkdownTextRenderer text={content.text} />;

    case "text_with_context":
      return (
        <>
          {content.autoMentionContext && (
            <AutoMentionBadge context={content.autoMentionContext} />
          )}
          <MarkdownTextRenderer text={content.text} />
        </>
      );

    case "agent_thought":
      return <CollapsibleThought text={content.text} />;

    case "tool_call":
      return <ToolCallRenderer toolCall={content} />;

    case "plan":
      return <PlanRenderer entries={content.entries} />;

    case "image":
      return <ImageRenderer image={content} />;

    case "permission_request":
      return <PermissionRequestSection request={content} />;

    case "terminal":
      return <TerminalRenderer terminalId={content.terminalId} />;
  }
}
```

---

## ToolCallRenderer (`ToolCallRenderer.tsx`)

Renders tool call with status, locations, and content.

### Features

- Status indicator (pending, in_progress, completed, failed)
- Kind icon (read, edit, execute, etc.)
- Location links (clickable file paths)
- Content rendering (diff, terminal, text)
- Permission request section (if pending)

### Diff Rendering

```typescript
function DiffRenderer({ diff, autoCollapse, threshold }) {
  const lineCount = diff.newText.split("\n").length;
  const [collapsed, setCollapsed] = useState(
    autoCollapse && lineCount > threshold
  );

  return (
    <div className="diff-container">
      <div className="diff-header" onClick={() => setCollapsed(!collapsed)}>
        <span>{diff.path}</span>
        {lineCount > threshold && <span>({lineCount} lines)</span>}
      </div>
      {!collapsed && <pre className="diff-content">{formatDiff(diff)}</pre>}
    </div>
  );
}
```

---

## TerminalRenderer (`TerminalRenderer.tsx`)

Renders terminal session output with polling.

### Features

- Polls for output updates
- Shows exit status when complete
- Scrollable output area
- Copy button

---

## Settings (`AgentClientSettingTab.ts`)

Plugin settings page using Obsidian's settings API.

### Sections

1. **Agent Configuration**
   - Claude Code, Codex, Gemini CLI settings
   - Custom agents management
   - API keys, commands, arguments

2. **Export Settings**
   - Folder and filename template
   - Auto-export triggers
   - Image handling

3. **Display Settings**
   - Diff collapse options
   - Note length limits
   - Emoji toggle

4. **Input Behavior**
   - Send shortcut configuration
   - Auto-mention toggle

5. **View Settings**
   - Chat view location

6. **Experimental**
   - Model complexity switching

7. **Developer Settings**
   - Debug mode
   - Node path
   - WSL mode (Windows)
