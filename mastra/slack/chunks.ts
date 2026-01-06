/**
 * Nested Chunk Event Handler
 *
 * This module handles special chunk types that use TypeScript template literal
 * types and cannot be matched directly in switch statements.
 *
 * Problem:
 * Mastra emits chunk types like:
 * - `agent-execution-event-${string}` (e.g., "agent-execution-event-text-delta")
 * - `workflow-execution-event-${string}` (e.g., "workflow-execution-event-workflow-step-start")
 *
 * These dynamic types can't be matched in switch statements because they're
 * generated at runtime. We need to check the prefix and extract the inner event.
 *
 * Structure:
 * These nested events have a payload that contains the actual event:
 * {
 *   type: "agent-execution-event-text-delta",
 *   payload: {
 *     type: "text-delta",
 *     payload: { text: "hello" }
 *   }
 * }
 *
 * This function:
 * 1. Detects chunk types with these prefixes
 * 2. Extracts the inner event from the payload
 * 3. Updates the stream state appropriately
 *
 * Why This Matters:
 * Without this handler, nested events would be ignored and text wouldn't
 * accumulate properly, workflow steps wouldn't be displayed, etc.
 */

import type { ChunkType } from '@mastra/core/stream';
import type { StreamState } from './types';
import { formatName } from './utils';

/**
 * Handle nested events that use template literal types
 *
 * Processes chunk types that can't be matched in switch statements due to
 * dynamic type generation. Extracts inner events from nested payloads.
 *
 * Supported prefixes:
 * - "agent-execution-event-": Nested agent events
 * - "workflow-execution-event-": Nested workflow events
 *
 * @param chunk - Stream chunk that may contain nested events
 * @param state - Current stream state to update
 */
export function handleNestedChunkEvents(
	chunk: ChunkType,
	state: StreamState,
): void {
	// Guard: some chunk types (like "object") don't have payload
	if (!('payload' in chunk)) return;

	// Agent execution nested events (e.g., "agent-execution-event-text-delta")
	if (chunk.type.startsWith('agent-execution-event-')) {
		const innerChunk = chunk.payload;
		if (
			innerChunk &&
			typeof innerChunk === 'object' &&
			'type' in innerChunk &&
			innerChunk.type === 'text-delta'
		) {
			const payload = (innerChunk as { payload?: { text?: string } })
				.payload;
			if (payload?.text) {
				state.text += payload.text;
				state.chunkType = 'text-delta';
			}
		}
		return;
	}

	// Workflow execution nested events (e.g., "workflow-execution-event-workflow-step-start")
	if (chunk.type.startsWith('workflow-execution-event-')) {
		const innerChunk = chunk.payload;
		if (
			innerChunk &&
			typeof innerChunk === 'object' &&
			'type' in innerChunk &&
			innerChunk.type === 'workflow-step-start'
		) {
			const payload = (innerChunk as { payload?: { id?: string } })
				.payload;
			state.chunkType = 'workflow-step-start';
			state.stepName = formatName(payload?.id ?? 'step');
		}
	}
}
