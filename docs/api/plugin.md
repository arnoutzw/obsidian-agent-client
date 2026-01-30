# Plugin Entry Point

The main plugin class that manages lifecycle, settings, adapters, and commands.

**File:** `src/plugin.ts`

## Class: AgentClientPlugin

```typescript
export default class AgentClientPlugin extends Plugin {
  settings: AgentClientPluginSettings;
  settingsStore: SettingsStore;
}
```

## Lifecycle Methods

### `async onload(): Promise<void>`

Called when the plugin is loaded.

**Initialization:**
1. Load settings from data.json
2. Create settings store
3. Register ChatView type
4. Add ribbon icon
5. Register commands
6. Add settings tab
7. Register quit handler for cleanup

```typescript
async onload() {
  await this.loadSettings();
  this.settingsStore = createSettingsStore(this.settings, this);

  this.registerView(VIEW_TYPE_CHAT, (leaf) => new ChatView(leaf, this));

  this.addRibbonIcon("bot-message-square", "Open agent client", () => {
    this.activateView();
  });

  this.addCommand({...});
  this.addSettingTab(new AgentClientSettingTab(this.app, this));

  this.registerEvent(
    this.app.workspace.on("quit", () => {
      // Cleanup adapters
    })
  );
}
```

### `onunload(): void`

Called when the plugin is unloaded. Currently empty as cleanup is handled by quit event.

---

## Adapter Management

Multi-session architecture with per-view adapters.

### `getOrCreateAdapter(viewId: string): AcpAdapter`

Gets or creates an adapter for a specific view.

```typescript
getOrCreateAdapter(viewId: string): AcpAdapter {
  let adapter = this._adapters.get(viewId);
  if (!adapter) {
    adapter = new AcpAdapter(this);
    this._adapters.set(viewId, adapter);
  }
  return adapter;
}
```

### `async removeAdapter(viewId: string): Promise<void>`

Removes and disconnects the adapter for a view.

```typescript
async removeAdapter(viewId: string): Promise<void> {
  const adapter = this._adapters.get(viewId);
  if (adapter) {
    await adapter.disconnect();
    this._adapters.delete(viewId);
  }
}
```

---

## View Management

### `async activateView(): Promise<void>`

Opens or focuses an existing chat view.

**Behavior:**
- If views exist, focus the last active one
- If no views, create a new one
- Focus the textarea after reveal

### `async openNewChatViewWithAgent(agentId: string): Promise<void>`

Opens a new chat view with a specific agent.

**Always creates new view** (doesn't reuse existing).

### `focusChatView(direction: "next" | "previous"): void`

Cycles through open chat views.

### `createNewChatLeaf(isAdditional: boolean): WorkspaceLeaf | null`

Creates a new leaf based on `chatViewLocation` setting:

| Setting | Behavior |
|---------|----------|
| `right-tab` | Right sidebar tab |
| `editor-tab` | Editor area tab |
| `editor-split` | Split in editor area |

---

## Commands

### View Commands

| ID | Name | Description |
|----|------|-------------|
| `open-chat-view` | Open agent chat | Opens/focuses chat view |
| `open-new-chat-view` | Open new chat view | Creates new view |
| `focus-next-chat-view` | Focus next chat view | Cycles forward |
| `focus-previous-chat-view` | Focus previous chat view | Cycles backward |

### Agent Commands

Dynamic commands for each configured agent:

| ID Pattern | Name Pattern |
|------------|--------------|
| `open-chat-with-{agentId}` | New chat with {displayName} |

### Permission Commands

| ID | Name | Description |
|----|------|-------------|
| `approve-active-permission` | Approve active permission | Approves current request |
| `reject-active-permission` | Reject active permission | Rejects current request |
| `toggle-auto-mention` | Toggle auto-mention | Toggles feature |
| `cancel-current-message` | Cancel current message | Cancels operation |

### Broadcast Commands

| ID | Name | Description |
|----|------|-------------|
| `broadcast-prompt` | Broadcast prompt | Copies prompt to all views |
| `broadcast-send` | Broadcast send | Sends in all views |
| `broadcast-cancel` | Broadcast cancel | Cancels in all views |

---

## Settings Management

### `async loadSettings(): Promise<void>`

Loads and validates settings from data.json.

**Features:**
- Merges with defaults
- Migrates old setting names
- Validates agent configurations
- Ensures unique custom agent IDs

### `async saveSettings(): Promise<void>`

Saves settings to data.json.

### `async saveSettingsAndNotify(settings): Promise<void>`

Saves settings and notifies subscribers via settings store.

### `ensureDefaultAgentId(): void`

Ensures `defaultAgentId` points to a valid agent.

---

## Agent Management

### `getAvailableAgents(): Array<{ id: string; displayName: string }>`

Returns list of all configured agents.

```typescript
getAvailableAgents() {
  return [
    { id: this.settings.claude.id, displayName: this.settings.claude.displayName },
    { id: this.settings.codex.id, displayName: this.settings.codex.displayName },
    { id: this.settings.gemini.id, displayName: this.settings.gemini.displayName },
    ...this.settings.customAgents.map(agent => ({
      id: agent.id,
      displayName: agent.displayName
    }))
  ];
}
```

---

## Update Checking

### `async checkForUpdates(): Promise<boolean>`

Checks for plugin updates from GitHub releases.

**Behavior:**
- Stable version users: Check stable releases only
- Prerelease users: Check both stable and prerelease

**Uses:** GitHub Releases API

---

## Settings Types

### `AgentClientPluginSettings`

Complete settings interface:

```typescript
interface AgentClientPluginSettings {
  // Agent configs
  claude: ClaudeAgentSettings;
  codex: CodexAgentSettings;
  gemini: GeminiAgentSettings;
  customAgents: CustomAgentSettings[];
  defaultAgentId: string;

  // Behavior
  autoAllowPermissions: boolean;
  autoMentionActiveNote: boolean;
  debugMode: boolean;
  nodePath: string;

  // Export
  exportSettings: {...};

  // Platform
  windowsWslMode: boolean;
  windowsWslDistribution?: string;

  // Input
  sendMessageShortcut: SendMessageShortcut;

  // View
  chatViewLocation: ChatViewLocation;

  // Display
  displaySettings: {...};

  // Experimental
  modelComplexitySwitching: ModelComplexitySwitchingSettings;

  // Session history
  savedSessions: SavedSessionInfo[];
}
```

### `SendMessageShortcut`

```typescript
type SendMessageShortcut = "enter" | "cmd-enter";
```

### `ChatViewLocation`

```typescript
type ChatViewLocation = "right-tab" | "editor-tab" | "editor-split";
```

---

## Event System

The plugin uses workspace events for cross-view communication:

| Event | Description |
|-------|-------------|
| `agent-client:new-chat-requested` | Request new chat with agent |
| `agent-client:approve-active-permission` | Approve permission in view |
| `agent-client:reject-active-permission` | Reject permission in view |
| `agent-client:toggle-auto-mention` | Toggle auto-mention in view |
| `agent-client:cancel-message` | Cancel message in view |
