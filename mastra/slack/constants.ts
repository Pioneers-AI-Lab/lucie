/**
 * Animation and Timing Constants
 *
 * This module defines the constants used for animating status messages
 * and controlling timing throughout the Slack streaming system.
 *
 * Animation Icons:
 * - SPINNER: Braille pattern dots for smooth spinning effect
 * - TOOL_ICONS: Rotating icons for tool execution
 * - WORKFLOW_ICONS: Rotating icons for workflow steps
 *
 * Timing Configuration:
 * - ANIMATION_INTERVAL: How often to update the animation frame
 * - TOOL_DISPLAY_DELAY: Pause duration when showing tool execution
 * - STEP_DISPLAY_DELAY: Pause duration when showing workflow steps
 *
 * The frame counter cycles through these arrays using modulo arithmetic,
 * creating continuous animation without wrapping logic.
 */

// Animation frames
/** Braille pattern spinner for default "thinking" animation */
export const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/** Tool icons rotated during tool execution */
export const TOOL_ICONS = ['🔄', '⚙️', '🔧', '⚡'];

/** Workflow icons rotated during workflow step execution */
export const WORKFLOW_ICONS = ['📋', '⚡', '🔄', '✨'];

// Timing (milliseconds)
/** How often to update animation frame in Slack (300ms = ~3 FPS) */
export const ANIMATION_INTERVAL = 300;

/** Pause duration after showing tool call before continuing (300ms) */
export const TOOL_DISPLAY_DELAY = 300;

/** Pause duration after showing workflow step before continuing (300ms) */
export const STEP_DISPLAY_DELAY = 300;
