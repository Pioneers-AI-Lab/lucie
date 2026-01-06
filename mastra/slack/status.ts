/**
 * Status Text Formatting - Animated Status Messages
 *
 * This module generates the status text displayed in Slack while the agent
 * is processing a request. It creates animated messages with contextual
 * spinners and icons based on what the agent is currently doing.
 *
 * Animation System:
 * - Frame counter cycles through icon arrays
 * - Different icons for different activities (thinking, tools, workflows)
 * - Updates every 300ms via animation timer
 *
 * Status Types:
 * - Default: Spinning dots (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏)
 * - Tool execution: Rotating tool icons (🔄⚙️🔧⚡)
 * - Workflow execution: Rotating workflow icons (📋⚡🔄✨)
 *
 * Message Format:
 * - Simple: "{spinner} Text Delta..."
 * - Tool: "{tool_icon} Tool Call: Reverse Text..."
 * - Workflow: "{workflow_icon} Workflow Step Start: Analyze Text..."
 * - Agent: "{spinner} Agent Execution Event: agentName..."
 *
 * The status text is continuously updated in the same Slack message,
 * creating a smooth animation effect without spamming the channel.
 */

import { SPINNER, TOOL_ICONS, WORKFLOW_ICONS } from './constants';
import type { StreamState } from './types';

/**
 * Format chunk type for display
 *
 * Converts kebab-case chunk types to Title Case for user-friendly display.
 * Example: "tool-call" → "Tool Call"
 *
 * @param type - Chunk type from stream (e.g., "text-delta", "tool-call")
 * @returns Formatted title case string
 */
function formatChunkType(type: string): string {
  return type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get animated status text for Slack message
 *
 * Generates the status text shown in Slack while agent is processing.
 * Uses frame counter to cycle through animation icons and shows contextual
 * information based on current execution state.
 *
 * @param state - Current stream state with chunk type and contextual info
 * @param frame - Animation frame counter (increments on each update)
 * @returns Formatted status string with animated icon
 */
export function getStatusText(state: StreamState, frame: number): string {
  const spinner = SPINNER[frame % SPINNER.length];
  const toolIcon = TOOL_ICONS[frame % TOOL_ICONS.length];
  const workflowIcon = WORKFLOW_ICONS[frame % WORKFLOW_ICONS.length];

  const type = state.chunkType;
  const label = formatChunkType(type);

  // Add context for specific chunk types
  if (type.startsWith('tool-') && state.toolName) {
    return `${toolIcon} ${label}: ${state.toolName}...`;
  }
  if (type.startsWith('workflow-') && state.stepName) {
    return `${workflowIcon} ${label}: ${state.stepName}...`;
  }
  if (type.includes('agent') && state.agentName) {
    return `${spinner} ${label}: ${state.agentName}...`;
  }

  return `${spinner} ${label}...`;
}
