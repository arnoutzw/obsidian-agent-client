# useModelComplexitySwitching

Hook for automatic model switching based on prompt complexity analysis.

**File:** `src/hooks/useModelComplexitySwitching.ts`

## Signature

```typescript
function useModelComplexitySwitching(
  settingsAccess: ISettingsAccess
): UseModelComplexitySwitchingReturn
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `settingsAccess` | `ISettingsAccess` | Settings access for configuration |

## Return Value

```typescript
interface UseModelComplexitySwitchingReturn {
  /** Whether the feature is enabled */
  isEnabled: boolean;

  /** Analyze prompt and get recommended model */
  analyzeAndRecommend: (
    prompt: string,
    currentModelId: string,
    availableModels: SessionModelState | undefined
  ) => {
    analysis: ComplexityAnalysisResult;
    recommendedModelId: string | null;
  };
}
```

## Types

### `ComplexityAnalysisResult`

```typescript
interface ComplexityAnalysisResult {
  score: number;                           // 0-100
  level: "simple" | "moderate" | "complex";
  factors: {
    length: number;      // Character count factor
    codeBlocks: number;  // Code block count
    questions: number;   // Question count
    keywords: number;    // Complexity keyword count
    mentions: number;    // @[[note]] mention count
  };
}
```

### Settings

```typescript
interface ModelComplexitySwitchingSettings {
  enabled: boolean;
  simpleModelId: string;   // Model for simple prompts
  complexModelId: string;  // Model for complex prompts
  thresholds: {
    simpleMax: number;     // Score <= this = simple (0-100)
    moderateMax: number;   // Score <= this = moderate, > = complex (0-100)
  };
}
```

## Functions

### `analyzeAndRecommend(prompt, currentModelId, availableModels)`

Analyzes prompt complexity and recommends model switch if needed.

**Parameters:**
- `prompt` - User's prompt text
- `currentModelId` - Currently selected model ID
- `availableModels` - Available models in the session

**Returns:**
- `analysis` - Complexity analysis result
- `recommendedModelId` - Model to switch to, or null if no switch needed

**Logic:**
1. Analyze prompt complexity
2. Check if feature is enabled
3. Check if configured models are available
4. Return recommended model based on complexity level

---

## Complexity Analysis

The analyzer scores prompts based on multiple factors:

### Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Length | 30% | Character count (longer = more complex) |
| Code Blocks | 25% | Number of code blocks |
| Questions | 15% | Number of question marks |
| Keywords | 20% | Complexity keywords found |
| Mentions | 10% | @[[note]] mentions |

### Complexity Keywords

```typescript
const COMPLEXITY_KEYWORDS = [
  "refactor", "architecture", "design",
  "implement", "analyze", "debug",
  "optimize", "review", "explain",
  "complex", "comprehensive", "detailed"
];
```

### Score Calculation

```typescript
function analyzePromptComplexity(prompt: string, thresholds: ComplexityThresholds) {
  const factors = {
    length: Math.min(prompt.length / 500, 1) * 30,
    codeBlocks: Math.min(countCodeBlocks(prompt) * 10, 25),
    questions: Math.min(countQuestions(prompt) * 5, 15),
    keywords: Math.min(countKeywords(prompt) * 5, 20),
    mentions: Math.min(countMentions(prompt) * 5, 10)
  };

  const score = Object.values(factors).reduce((a, b) => a + b, 0);

  const level = score <= thresholds.simpleMax
    ? "simple"
    : score <= thresholds.moderateMax
      ? "moderate"
      : "complex";

  return { score, level, factors };
}
```

## Model Selection

```typescript
function getRecommendedModel(
  currentModelId: string,
  analysis: ComplexityAnalysisResult,
  simpleModelId: string,
  complexModelId: string
): string | null {
  // Simple prompts use simpler/faster model
  if (analysis.level === "simple" && currentModelId !== simpleModelId) {
    return simpleModelId;
  }

  // Complex prompts use more capable model
  if (analysis.level === "complex" && currentModelId !== complexModelId) {
    return complexModelId;
  }

  // No change needed
  return null;
}
```

## Usage Example

```typescript
function ChatInput() {
  const { analyzeAndRecommend, isEnabled } = useModelComplexitySwitching(settingsAccess);

  const handleSend = async (text: string) => {
    // Auto-switch model if enabled
    if (isEnabled && session.models) {
      const { recommendedModelId } = analyzeAndRecommend(
        text,
        session.models.currentModelId,
        session.models
      );

      if (recommendedModelId) {
        await agentClient.setSessionModel(session.sessionId, recommendedModelId);
      }
    }

    await sendMessage(text);
  };
}
```

## Configuration

In plugin settings:

```typescript
modelComplexitySwitching: {
  enabled: true,
  simpleModelId: "claude-3-haiku",    // Fast, cheap
  complexModelId: "claude-3-opus",     // Capable, thorough
  thresholds: {
    simpleMax: 30,    // Score 0-30 = simple
    moderateMax: 60   // Score 31-60 = moderate, 61+ = complex
  }
}
```

## Experimental Feature

This feature is marked as experimental in settings UI because:
- Complexity analysis is heuristic-based
- May not always choose optimal model
- User should monitor and adjust thresholds
