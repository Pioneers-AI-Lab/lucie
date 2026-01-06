import { registerApiRoute } from '@mastra/core/server';
import { WebClient } from '@slack/web-api';
import { verifySlackRequest } from './verify';
import { streamToSlack } from './streaming';

/**
 * Configuration for a single Slack app
 *
 * Each Slack app gets its own:
 * - Webhook route at /slack/{name}/events
 * - Bot token for API calls
 * - Signing secret for request verification
 * - Connected agent for message processing
 */
interface SlackAppConfig {
	name: string; // Route path: /slack/{name}/events
	botToken: string;
	signingSecret: string;
	agentName: string; // Must match key in mastra.agents
}

/**
 * Factory function to create a Slack events route for a specific app
 *
 * This function creates a POST endpoint that:
 * 1. Handles Slack's URL verification challenge (required for setup)
 * 2. Verifies request authenticity using HMAC signatures
 * 3. Processes app_mention and message.im events
 * 4. Ignores bot messages and message edits
 * 5. Strips bot mentions from message text
 * 6. Initiates asynchronous agent processing
 *
 * The route handler returns immediately (200 OK) to stay within Slack's
 * 3-second timeout requirement. Actual message processing happens async.
 */
function createSlackEventsRoute(config: SlackAppConfig) {
	return registerApiRoute(`/slack/${config.name}/events`, {
		method: 'POST',
		handler: async (c) => {
			try {
				const body = await c.req.text();
				const payload = JSON.parse(body);

				// Handle URL verification challenge
				if (payload.type === 'url_verification') {
					console.log(
						`✅ [${config.name}] URL verification challenge received`,
					);
					return c.json({ challenge: payload.challenge });
				}

				if (!config.botToken || !config.signingSecret) {
					console.error(
						`❌ [${config.name}] Missing bot token or signing secret`,
					);
					return c.json({ error: 'Server misconfigured' }, 500);
				}

				// Get Slack signature headers
				const slackSignature = c.req.header('x-slack-signature');
				const slackTimestamp = c.req.header(
					'x-slack-request-timestamp',
				);

				if (!slackSignature || !slackTimestamp) {
					return c.json(
						{ error: 'Missing Slack signature headers' },
						401,
					);
				}

				// Verify the request signature
				const isValid = verifySlackRequest(
					config.signingSecret,
					slackSignature,
					slackTimestamp,
					body,
				);

				if (!isValid) {
					console.error(
						`❌ [${config.name}] Invalid Slack signature`,
					);
					return c.json({ error: 'Invalid signature' }, 401);
				}

				// Handle event
				if (payload.event) {
					const event = payload.event;

					// Ignore bot messages and message edits
					if (event.bot_id || event.subtype) {
						return c.json({ ok: true });
					}

					// Handle app mentions and direct messages
					if (
						event.type === 'app_mention' ||
						event.type === 'message'
					) {
						let messageText = event.text || '';
						const userId = event.user;
						const channelId = event.channel;
						const threadTs = event.thread_ts || event.ts;
						const teamId = payload.team_id;

						console.log(`📨 [${config.name}] Message received:`, {
							agent: config.agentName,
							text: messageText,
							user: userId,
						});

						// Strip out bot mention from message
						messageText = messageText
							.replace(/<@[A-Z0-9]+>/g, '')
							.trim();

						// Process message asynchronously (don't block Slack's 3s timeout)
						const mastra = c.get('mastra');
						const slackClient = new WebClient(config.botToken);

						(async () => {
							try {
								await streamToSlack({
									mastra,
									slackClient,
									channel: channelId,
									threadTs,
									agentName: config.agentName,
									message: messageText,
									resourceId: `slack-${teamId}-${userId}`,
									threadId: `slack-${channelId}-${threadTs}`,
								});
							} catch (error) {
								console.error(
									`❌ [${config.name}] Error processing message:`,
									error,
								);
								// streamToSlack already posts errors to Slack, so we just log here
							}
						})();
					}
				}

				return c.json({ ok: true });
			} catch (error) {
				console.error(
					`Error handling Slack event [${config.name}]:`,
					error,
				);
				return c.json({ error: 'Failed to handle event' }, 500);
			}
		},
	});
}

/**
 * Slack App Configuration
 *
 * Define all Slack apps here. Each entry creates:
 * - A webhook endpoint at /slack/{name}/events
 * - A connection to the specified Mastra agent
 *
 * To add a new Slack app:
 * 1. Create the agent in src/mastra/agents/
 * 2. Register it in src/mastra/index.ts
 * 3. Add configuration here
 * 4. Create Slack app at api.slack.com/apps
 * 5. Add credentials to .env
 * 6. Configure webhook URL in Slack app settings
 *
 * Environment Variables Required:
 * - SLACK_{APP_NAME}_BOT_TOKEN (uppercase, snake_case)
 * - SLACK_{APP_NAME}_SIGNING_SECRET
 */
const slackApps: SlackAppConfig[] = [
	{
		name: 'lucie',
		botToken: process.env.SLACK_BOT_TOKEN!,
		signingSecret: process.env.SLACK_SIGNING_SECRET!,
		agentName: 'lucie',
	},
];

/**
 * Generate routes for all configured apps
 *
 * Maps each SlackAppConfig to a registered API route.
 * The resulting array is passed to Mastra's server.apiRoutes config.
 */
export const slackRoutes = slackApps.map(createSlackEventsRoute);
