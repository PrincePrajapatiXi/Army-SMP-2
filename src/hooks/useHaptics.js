/**
 * useHaptics - Custom hook for haptic feedback on mobile devices
 * Uses the Vibration API with graceful fallback
 */

// Check if device supports vibration
const supportsVibration = () => {
    return 'vibrate' in navigator;
};

// Haptic feedback patterns (in milliseconds)
const HAPTIC_PATTERNS = {
    light: [10],           // Very subtle tap
    medium: [20],          // Normal tap
    heavy: [30],           // Strong tap
    success: [10, 50, 20], // Double tap for success
    error: [50, 30, 50],   // Error pattern
    selection: [5]         // Ultra-light for selection changes
};

/**
 * Trigger haptic feedback
 * @param {string} type - Type of haptic feedback (light, medium, heavy, success, error, selection)
 */
export const triggerHaptic = (type = 'light') => {
    if (!supportsVibration()) return;

    const pattern = HAPTIC_PATTERNS[type] || HAPTIC_PATTERNS.light;

    try {
        navigator.vibrate(pattern);
    } catch (error) {
        // Silently fail - haptics are enhancement, not critical
        console.debug('[Haptics] Vibration failed:', error);
    }
};

/**
 * useHaptics Hook
 * Provides haptic feedback functions for React components
 */
const useHaptics = () => {
    const isSupported = supportsVibration();

    const haptic = {
        // Basic feedback types
        light: () => triggerHaptic('light'),
        medium: () => triggerHaptic('medium'),
        heavy: () => triggerHaptic('heavy'),

        // Contextual feedback
        success: () => triggerHaptic('success'),
        error: () => triggerHaptic('error'),
        selection: () => triggerHaptic('selection'),

        // Generic trigger with custom type
        trigger: (type) => triggerHaptic(type),

        // Check support
        isSupported
    };

    return haptic;
};

export default useHaptics;

