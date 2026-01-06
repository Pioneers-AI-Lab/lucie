/**
 * Slack Request Verification - Security Layer
 *
 * This module implements Slack's request signature verification to ensure
 * that incoming webhook requests actually come from Slack and not from
 * malicious actors attempting to impersonate Slack.
 *
 * How It Works:
 * 1. Slack signs each request using HMAC SHA256
 * 2. Signature is based on: timestamp + raw request body + signing secret
 * 3. We compute the expected signature and compare with the received one
 * 4. Comparison uses timing-safe algorithm to prevent timing attacks
 *
 * Security Measures:
 * - Rejects requests older than 5 minutes (replay attack prevention)
 * - Uses crypto.timingSafeEqual to prevent timing attacks
 * - Validates signature format and length before comparison
 *
 * Signature Format:
 * - Base string: "v0:{timestamp}:{raw_body}"
 * - Algorithm: HMAC SHA256
 * - Format: "v0={hex_digest}"
 *
 * Important:
 * - Body must be raw string (not parsed JSON)
 * - Timestamp must be the original x-slack-request-timestamp header
 * - Signing secret is unique per Slack app
 *
 * References:
 * - https://api.slack.com/authentication/verifying-requests-from-slack
 */

import * as crypto from 'crypto';

/**
 * Verify that a request came from Slack
 *
 * @param signingSecret - App's signing secret from Slack app settings
 * @param requestSignature - x-slack-signature header from request
 * @param timestamp - x-slack-request-timestamp header from request
 * @param body - Raw request body as string (not parsed)
 * @returns true if request is valid, false otherwise
 */
export function verifySlackRequest(
  signingSecret: string,
  requestSignature: string,
  timestamp: string,
  body: string,
): boolean {
  // Reject old requests (more than 5 minutes old)
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (parseInt(timestamp) < fiveMinutesAgo) {
    return false;
  }

  // Compute the expected signature
  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + crypto.createHmac('sha256', signingSecret).update(sigBasestring, 'utf8').digest('hex');

  // Guard: ensure requestSignature is valid and lengths match before timingSafeEqual
  if (
    typeof requestSignature !== 'string' ||
    Buffer.byteLength(requestSignature, 'utf8') !== Buffer.byteLength(mySignature, 'utf8')
  ) {
    return false;
  }

  // Compare signatures
  return crypto.timingSafeEqual(Buffer.from(mySignature, 'utf8'), Buffer.from(requestSignature, 'utf8'));
}
