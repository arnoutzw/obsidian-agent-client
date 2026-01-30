import { useCallback, useMemo } from "react";
import type { ISettingsAccess } from "../domain/ports/settings-access.port";
import type { SessionModelState } from "../domain/models/chat-session";
import {
	analyzePromptComplexity,
	getRecommendedModel,
	type ComplexityAnalysisResult,
	type ComplexityThresholds,
} from "../shared/prompt-complexity-analyzer";

// ============================================================================
// Types
// ============================================================================

/**
 * Return type for useModelComplexitySwitching hook.
 */
export interface UseModelComplexitySwitchingReturn {
	/** Whether the feature is enabled and can be used */
	isEnabled: boolean;

	/**
	 * Analyze prompt complexity and return the recommended model ID if a switch is needed.
	 *
	 * @param prompt - The user's prompt text
	 * @param currentModelId - Currently selected model ID
	 * @param availableModels - Available models in the session
	 * @returns Object with analysis result and recommended model (null if no switch needed)
	 */
	analyzeAndRecommend: (
		prompt: string,
		currentModelId: string,
		availableModels: SessionModelState | undefined,
	) => {
		analysis: ComplexityAnalysisResult;
		recommendedModelId: string | null;
	};
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for automatic model switching based on prompt complexity.
 *
 * This hook analyzes user prompts and recommends model switches based on
 * complexity analysis. It respects user settings and available models.
 *
 * @param settingsAccess - Settings access for reading configuration
 */
export function useModelComplexitySwitching(
	settingsAccess: ISettingsAccess,
): UseModelComplexitySwitchingReturn {
	/**
	 * Check if the feature is enabled in settings.
	 */
	const isEnabled = useMemo(() => {
		const settings = settingsAccess.getSnapshot();
		return settings.modelComplexitySwitching.enabled;
	}, [settingsAccess]);

	/**
	 * Analyze prompt complexity and recommend model switch if needed.
	 */
	const analyzeAndRecommend = useCallback(
		(
			prompt: string,
			currentModelId: string,
			availableModels: SessionModelState | undefined,
		): {
			analysis: ComplexityAnalysisResult;
			recommendedModelId: string | null;
		} => {
			const settings = settingsAccess.getSnapshot();
			const mcsSettings = settings.modelComplexitySwitching;

			// Build thresholds from settings
			const thresholds: ComplexityThresholds = {
				simpleMax: mcsSettings.thresholds.simpleMax,
				moderateMax: mcsSettings.thresholds.moderateMax,
			};

			// Analyze the prompt
			const analysis = analyzePromptComplexity(prompt, thresholds);

			// If feature is disabled, return analysis only
			if (!mcsSettings.enabled) {
				return { analysis, recommendedModelId: null };
			}

			// Check if we have configured model IDs
			if (!mcsSettings.simpleModelId || !mcsSettings.complexModelId) {
				return { analysis, recommendedModelId: null };
			}

			// Check if the configured models are available
			if (!availableModels) {
				return { analysis, recommendedModelId: null };
			}

			const availableModelIds = availableModels.availableModels.map(
				(m) => m.modelId,
			);

			const simpleModelAvailable = availableModelIds.includes(
				mcsSettings.simpleModelId,
			);
			const complexModelAvailable = availableModelIds.includes(
				mcsSettings.complexModelId,
			);

			// If neither configured model is available, can't switch
			if (!simpleModelAvailable && !complexModelAvailable) {
				return { analysis, recommendedModelId: null };
			}

			// Get the recommended model based on complexity
			const recommendedModelId = getRecommendedModel(
				currentModelId,
				analysis,
				// Fall back to current model if configured model not available
				simpleModelAvailable
					? mcsSettings.simpleModelId
					: currentModelId,
				complexModelAvailable
					? mcsSettings.complexModelId
					: currentModelId,
			);

			return { analysis, recommendedModelId };
		},
		[settingsAccess],
	);

	return {
		isEnabled,
		analyzeAndRecommend,
	};
}
