/**
 * Prompt Complexity Analyzer
 *
 * Analyzes the complexity of a user prompt to determine which AI model
 * would be most appropriate. Uses heuristics based on:
 * - Prompt length
 * - Technical keywords and concepts
 * - Code blocks and programming constructs
 * - Question complexity indicators
 * - Multi-step reasoning indicators
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Complexity level classification.
 */
export type ComplexityLevel = "simple" | "moderate" | "complex";

/**
 * Result of complexity analysis.
 */
export interface ComplexityAnalysisResult {
	/** Overall complexity level */
	level: ComplexityLevel;
	/** Numeric score (0-100) */
	score: number;
	/** Breakdown of contributing factors */
	factors: ComplexityFactors;
}

/**
 * Individual factors contributing to complexity score.
 */
export interface ComplexityFactors {
	/** Score from prompt length (0-25) */
	length: number;
	/** Score from technical keywords (0-25) */
	technicalTerms: number;
	/** Score from code content (0-25) */
	codeContent: number;
	/** Score from reasoning complexity indicators (0-25) */
	reasoningIndicators: number;
}

/**
 * Thresholds for complexity classification.
 */
export interface ComplexityThresholds {
	/** Score at or below this is "simple" */
	simpleMax: number;
	/** Score above simpleMax and at or below this is "moderate" */
	moderateMax: number;
	/** Score above moderateMax is "complex" */
}

// ============================================================================
// Constants
// ============================================================================

/** Default thresholds for complexity classification */
export const DEFAULT_COMPLEXITY_THRESHOLDS: ComplexityThresholds = {
	simpleMax: 30,
	moderateMax: 60,
};

/** Technical keywords that indicate higher complexity */
const TECHNICAL_KEYWORDS = [
	// Programming concepts
	"algorithm",
	"architecture",
	"async",
	"authentication",
	"authorization",
	"cache",
	"concurrency",
	"database",
	"dependency",
	"deployment",
	"encryption",
	"framework",
	"implementation",
	"infrastructure",
	"integration",
	"microservice",
	"middleware",
	"optimization",
	"performance",
	"refactor",
	"scalability",
	"security",
	"serialization",
	"synchronization",
	"threading",
	"transaction",
	"validation",
	// Data structures
	"array",
	"binary tree",
	"graph",
	"hash",
	"heap",
	"linked list",
	"queue",
	"stack",
	"tree",
	// Design patterns
	"factory",
	"singleton",
	"observer",
	"decorator",
	"adapter",
	"facade",
	"strategy",
	"template",
	// Languages and technologies
	"typescript",
	"javascript",
	"python",
	"rust",
	"react",
	"node",
	"docker",
	"kubernetes",
	"aws",
	"api",
	"graphql",
	"rest",
	"sql",
	"nosql",
	"mongodb",
	"postgresql",
	"redis",
];

/** Reasoning complexity indicators */
const REASONING_INDICATORS = [
	// Multi-step reasoning
	"step by step",
	"first.*then",
	"analyze",
	"compare",
	"contrast",
	"evaluate",
	"explain why",
	"explain how",
	"trade-off",
	"tradeoff",
	"pros and cons",
	"advantages and disadvantages",
	// Problem solving
	"debug",
	"troubleshoot",
	"diagnose",
	"investigate",
	"root cause",
	"best practice",
	"best approach",
	"optimal",
	"efficient",
	// Architecture and design
	"design",
	"architect",
	"plan",
	"strategy",
	"approach",
	"structure",
	"organize",
	// Complex questions
	"how would you",
	"what is the best way",
	"how should i",
	"what approach",
	"how can i improve",
	"what are the implications",
];

/** Simple task indicators that reduce complexity score */
const SIMPLE_INDICATORS = [
	"hello",
	"hi",
	"thanks",
	"thank you",
	"yes",
	"no",
	"ok",
	"okay",
	"sure",
	"got it",
	"what is",
	"what's",
	"define",
	"meaning of",
	"translate",
	"summarize this",
	"format this",
	"fix typo",
	"correct spelling",
];

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Calculate length-based complexity score.
 * Longer prompts tend to indicate more complex requests.
 *
 * @param text - The prompt text
 * @returns Score from 0-25
 */
function calculateLengthScore(text: string): number {
	const charCount = text.length;
	const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

	// Base score on character count
	let score = 0;
	if (charCount > 1000) {
		score = 25;
	} else if (charCount > 500) {
		score = 20;
	} else if (charCount > 200) {
		score = 15;
	} else if (charCount > 100) {
		score = 10;
	} else if (charCount > 50) {
		score = 5;
	}

	// Bonus for high word count
	if (wordCount > 100) {
		score = Math.min(25, score + 5);
	}

	return score;
}

/**
 * Calculate technical terms complexity score.
 * More technical keywords indicate higher complexity.
 *
 * @param text - The prompt text (lowercase)
 * @returns Score from 0-25
 */
function calculateTechnicalScore(text: string): number {
	const lowerText = text.toLowerCase();
	let matchCount = 0;

	for (const keyword of TECHNICAL_KEYWORDS) {
		// Use word boundary check for short keywords
		const pattern =
			keyword.length <= 4
				? new RegExp(`\\b${keyword}\\b`, "i")
				: new RegExp(keyword, "i");
		if (pattern.test(lowerText)) {
			matchCount++;
		}
	}

	// Scale: 0 matches = 0, 1-2 = 5, 3-4 = 10, 5-7 = 15, 8-10 = 20, 11+ = 25
	if (matchCount === 0) return 0;
	if (matchCount <= 2) return 5;
	if (matchCount <= 4) return 10;
	if (matchCount <= 7) return 15;
	if (matchCount <= 10) return 20;
	return 25;
}

/**
 * Calculate code content complexity score.
 * Code blocks and programming constructs indicate higher complexity.
 *
 * @param text - The prompt text
 * @returns Score from 0-25
 */
function calculateCodeScore(text: string): number {
	let score = 0;

	// Check for code blocks (markdown)
	const codeBlockMatches = text.match(/```[\s\S]*?```/g);
	if (codeBlockMatches) {
		const totalCodeLength = codeBlockMatches.reduce(
			(sum, block) => sum + block.length,
			0,
		);
		if (totalCodeLength > 500) {
			score += 15;
		} else if (totalCodeLength > 200) {
			score += 10;
		} else {
			score += 5;
		}
	}

	// Check for inline code
	const inlineCodeMatches = text.match(/`[^`]+`/g);
	if (inlineCodeMatches && inlineCodeMatches.length > 0) {
		score += Math.min(5, inlineCodeMatches.length);
	}

	// Check for programming patterns (functions, classes, etc.)
	const programmingPatterns = [
		/function\s+\w+/i,
		/class\s+\w+/i,
		/const\s+\w+\s*=/,
		/let\s+\w+\s*=/,
		/var\s+\w+\s*=/,
		/import\s+.*from/,
		/export\s+(default\s+)?/,
		/=>\s*[{(]/,
		/async\s+(function|const|let)/,
		/await\s+/,
		/\.\w+\([^)]*\)/,
	];

	for (const pattern of programmingPatterns) {
		if (pattern.test(text)) {
			score += 2;
		}
	}

	return Math.min(25, score);
}

/**
 * Calculate reasoning complexity score.
 * Indicators of multi-step reasoning or analysis increase complexity.
 *
 * @param text - The prompt text
 * @returns Score from 0-25
 */
function calculateReasoningScore(text: string): number {
	const lowerText = text.toLowerCase();
	let score = 0;

	// Check for reasoning indicators
	for (const indicator of REASONING_INDICATORS) {
		const pattern = new RegExp(indicator, "i");
		if (pattern.test(lowerText)) {
			score += 3;
		}
	}

	// Check for question complexity
	const questionCount = (text.match(/\?/g) || []).length;
	if (questionCount > 3) {
		score += 5;
	} else if (questionCount > 1) {
		score += 2;
	}

	// Check for numbered lists (indicates multi-step request)
	const numberedListPattern = /^\s*\d+[.)]\s+/gm;
	const numberedItems = (text.match(numberedListPattern) || []).length;
	if (numberedItems > 3) {
		score += 5;
	} else if (numberedItems > 1) {
		score += 3;
	}

	// Check for bullet points
	const bulletPattern = /^\s*[-*]\s+/gm;
	const bulletItems = (text.match(bulletPattern) || []).length;
	if (bulletItems > 5) {
		score += 3;
	}

	// Reduce score for simple indicators
	for (const indicator of SIMPLE_INDICATORS) {
		if (lowerText.includes(indicator)) {
			score -= 5;
		}
	}

	return Math.max(0, Math.min(25, score));
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Analyze the complexity of a prompt.
 *
 * @param prompt - The user's prompt text
 * @param thresholds - Optional custom thresholds for classification
 * @returns ComplexityAnalysisResult with level, score, and factor breakdown
 */
export function analyzePromptComplexity(
	prompt: string,
	thresholds: ComplexityThresholds = DEFAULT_COMPLEXITY_THRESHOLDS,
): ComplexityAnalysisResult {
	// Handle empty or very short prompts
	if (!prompt || prompt.trim().length < 3) {
		return {
			level: "simple",
			score: 0,
			factors: {
				length: 0,
				technicalTerms: 0,
				codeContent: 0,
				reasoningIndicators: 0,
			},
		};
	}

	// Calculate individual factor scores
	const factors: ComplexityFactors = {
		length: calculateLengthScore(prompt),
		technicalTerms: calculateTechnicalScore(prompt),
		codeContent: calculateCodeScore(prompt),
		reasoningIndicators: calculateReasoningScore(prompt),
	};

	// Calculate total score (0-100)
	const score =
		factors.length +
		factors.technicalTerms +
		factors.codeContent +
		factors.reasoningIndicators;

	// Determine complexity level based on thresholds
	let level: ComplexityLevel;
	if (score <= thresholds.simpleMax) {
		level = "simple";
	} else if (score <= thresholds.moderateMax) {
		level = "moderate";
	} else {
		level = "complex";
	}

	return { level, score, factors };
}

/**
 * Determine if model switching should occur based on complexity.
 *
 * @param currentModelId - Currently selected model ID
 * @param complexityResult - Result from analyzePromptComplexity
 * @param simpleModelId - Model ID to use for simple prompts
 * @param complexModelId - Model ID to use for complex prompts
 * @returns The model ID to use, or null if no switch is needed
 */
export function getRecommendedModel(
	currentModelId: string,
	complexityResult: ComplexityAnalysisResult,
	simpleModelId: string,
	complexModelId: string,
): string | null {
	// Determine target model based on complexity
	let targetModelId: string;
	if (complexityResult.level === "simple") {
		targetModelId = simpleModelId;
	} else if (complexityResult.level === "complex") {
		targetModelId = complexModelId;
	} else {
		// For moderate complexity, keep current model
		return null;
	}

	// Only return if different from current
	if (targetModelId !== currentModelId) {
		return targetModelId;
	}

	return null;
}
