# useSettings

Hook for subscribing to plugin settings changes.

**File:** `src/hooks/useSettings.ts`

## Signature

```typescript
function useSettings(
  plugin: AgentClientPlugin
): AgentClientPluginSettings
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `plugin` | `AgentClientPlugin` | Plugin instance with settings store |

## Return Value

Returns the current `AgentClientPluginSettings` object.

## Implementation

Uses React's `useSyncExternalStore` for safe external state subscription:

```typescript
export function useSettings(plugin: AgentClientPlugin) {
  return useSyncExternalStore(
    plugin.settingsStore.subscribe,
    plugin.settingsStore.getSnapshot,
    plugin.settingsStore.getSnapshot  // Server snapshot (same for Obsidian)
  );
}
```

## Settings Structure

```typescript
interface AgentClientPluginSettings {
  // Agent configurations
  claude: ClaudeAgentSettings;
  codex: CodexAgentSettings;
  gemini: GeminiAgentSettings;
  customAgents: CustomAgentSettings[];

  // Default agent
  defaultAgentId: string;

  // Permissions
  autoAllowPermissions: boolean;

  // Auto-mention
  autoMentionActiveNote: boolean;

  // Debug
  debugMode: boolean;

  // Node path
  nodePath: string;

  // Export settings
  exportSettings: {
    defaultFolder: string;
    filenameTemplate: string;
    autoExportOnNewChat: boolean;
    autoExportOnCloseChat: boolean;
    openFileAfterExport: boolean;
    includeImages: boolean;
    imageLocation: "obsidian" | "custom" | "base64";
    imageCustomFolder: string;
    frontmatterTag: string;
  };

  // WSL settings (Windows)
  windowsWslMode: boolean;
  windowsWslDistribution?: string;

  // Input behavior
  sendMessageShortcut: "enter" | "cmd-enter";

  // View settings
  chatViewLocation: "right-tab" | "editor-tab" | "editor-split";

  // Display settings
  displaySettings: {
    autoCollapseDiffs: boolean;
    diffCollapseThreshold: number;
    maxNoteLength: number;
    maxSelectionLength: number;
    showEmojis: boolean;
  };

  // Model complexity switching
  modelComplexitySwitching: {
    enabled: boolean;
    simpleModelId: string;
    complexModelId: string;
    thresholds: {
      simpleMax: number;
      moderateMax: number;
    };
  };

  // Session history
  savedSessions: SavedSessionInfo[];
}
```

## Reactive Updates

The hook triggers re-renders when settings change:

```typescript
function ChatView() {
  const settings = useSettings(plugin);

  // Automatically re-renders when settings change
  const showEmojis = settings.displaySettings.showEmojis;

  return <ChatMessages showEmojis={showEmojis} />;
}
```

## Settings Store Pattern

The settings store uses the observer pattern:

```typescript
// In settings-store.adapter.ts
function createSettingsStore(initialSettings, plugin) {
  let settings = initialSettings;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => settings,

    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    set: (newSettings) => {
      settings = newSettings;
      plugin.saveData(settings);
      listeners.forEach(l => l());
    }
  };
}
```

## Usage Examples

### Reading Settings

```typescript
function ChatInput() {
  const settings = useSettings(plugin);

  const handleKeyDown = (e) => {
    const isEnterSend = settings.sendMessageShortcut === "enter";

    if (e.key === "Enter") {
      if (isEnterSend && !e.shiftKey) {
        handleSend();
      } else if (!isEnterSend && (e.metaKey || e.ctrlKey)) {
        handleSend();
      }
    }
  };
}
```

### Conditional Features

```typescript
function ChatMessages() {
  const settings = useSettings(plugin);

  return (
    <div>
      {messages.map(msg => (
        <Message
          key={msg.id}
          message={msg}
          showEmojis={settings.displaySettings.showEmojis}
          autoCollapseDiffs={settings.displaySettings.autoCollapseDiffs}
        />
      ))}
    </div>
  );
}
```

### Auto-Features

```typescript
function ChatView() {
  const settings = useSettings(plugin);
  const { activePermission, approveActivePermission } = usePermission(...);

  // Auto-approve permissions if enabled
  useEffect(() => {
    if (settings.autoAllowPermissions && activePermission) {
      approveActivePermission();
    }
  }, [activePermission, settings.autoAllowPermissions]);
}
```
