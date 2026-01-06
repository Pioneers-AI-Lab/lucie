/**
 * Utility Functions for Slack Integration
 *
 * This module provides common utility functions used throughout the
 * Slack integration for timing control and text formatting.
 */

/**
 * Async delay utility
 *
 * Creates a promise that resolves after the specified number of milliseconds.
 * Used for adding delays between status updates and for retry backoff.
 *
 * @param ms - Number of milliseconds to wait
 * @returns Promise that resolves after delay
 *
 * @example
 * await sleep(300); // Wait 300ms before next action
 */
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Convert various naming conventions to Title Case
 *
 * Handles multiple naming conventions and converts them to human-readable
 * Title Case format for display in Slack.
 *
 * Supported formats:
 * - kebab-case: "reverse-text" → "Reverse Text"
 * - snake_case: "reverse_text" → "Reverse Text"
 * - camelCase: "reverseText" → "Reverse Text"
 * - PascalCase: "ReverseText" → "Reverse Text"
 *
 * @param id - String in any common naming convention
 * @returns Title Case formatted string
 *
 * @example
 * formatName('reverse-text') // "Reverse Text"
 * formatName('analyze_text') // "Analyze Text"
 * formatName('reverseText') // "Reverse Text"
 */
export const formatName = (id: string) =>
  id
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → camel Case
    .split(/[-_]/) // Split on hyphens and underscores
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)) // Capitalize each word
    .join(' '); // Join with spaces
