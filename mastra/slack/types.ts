/**
 * Type Definitions for Slack Streaming
 *
 * This file defines the TypeScript interfaces used throughout the Slack
 * integration for type safety and documentation.
 */

import type { WebClient } from '@slack/web-api';
import type { Mastra } from '@mastra/core/mastra';

/**
 * Options for streaming agent responses to Slack
 *
 * Contains all the configuration needed to process a message and
 * stream the agent's response back to Slack.
 *
 * @property mastra - Mastra instance to get agents
 * @property slackClient - Slack Web API client for posting messages
 * @property channel - Slack channel ID where message was sent
 * @property threadTs - Thread timestamp for maintaining conversation context
 * @property agentName - Name of agent to invoke (must match key in mastra.agents)
 * @property message - User's message text (bot mentions already stripped)
 * @property resourceId - Unique ID for user context (format: slack-{teamId}-{userId})
 * @property threadId - Unique ID for thread context (format: slack-{channelId}-{threadTs})
 */
export interface StreamingOptions {
  mastra: Mastra;
  slackClient: WebClient;
  channel: string;
  threadTs: string;
  agentName: string;
  message: string;
  resourceId: string;
  threadId: string;
}

/**
 * Internal state tracking for streaming
 *
 * Tracks the current state of the agent execution for display purposes.
 * Updated as stream chunks are processed.
 *
 * @property text - Accumulated response text from text-delta chunks
 * @property chunkType - Current chunk type being processed (affects status display)
 * @property toolName - Name of currently executing tool (if any)
 * @property workflowName - Name of currently executing workflow (if any)
 * @property stepName - Name of current workflow step (if any)
 * @property agentName - Name of agent being executed (if nested)
 */
export interface StreamState {
  text: string;
  chunkType: string;
  toolName?: string;
  workflowName?: string;
  stepName?: string;
  agentName?: string;
}
