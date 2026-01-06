/**
 * General Questions Query Tool - General Accelerator Information Retrieval
 *
 * This tool searches the general-questions.json knowledge base to answer general questions
 * about the Pioneer.vc accelerator that don't fit into specific categories. Used by
 * general-questions-agent.
 *
 * Purpose:
 * - Loads and searches general-questions.json data file
 * - Performs text-based search across Q&A pairs
 * - Returns matching answers from the knowledge base
 * - Indicates whether results were found
 *
 * Data Source:
 * File: data/general-questions.json
 * Content: Q&A pairs about the accelerator program, policies, benefits, etc.
 * Structure: Likely array of {question, answer} objects
 *
 * Search Strategy:
 * - Uses searchInText helper for text-based searching
 * - Searches questions and answers for matching content
 * - Returns answers that best match the query
 * - Provides found flag for empty result handling
 *
 * Pipeline Position:
 * General Questions Agent → Query Receiver → [General Questions Query] → Data Formatter → Response Sender
 *
 * Output Format:
 * {
 *   answers: Array of matching answer objects/strings,
 *   found: boolean (true if answers.length > 0)
 * }
 *
 * Important Notes:
 * - Returns COMPLETE object with both answers array and found flag
 * - Data formatter expects this complete structure
 * - Handles catch-all queries that don't fit other categories
 * - Different search strategy (searchInText vs searchInObject)
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { loadJsonData, searchInText } from "./data-helpers";
import { message, log } from "../../lib/print-helpers";
export const generalQuestionsQuery = createTool({
  id: "general-questions-query",
  description:
    'Queries the general questions knowledge base to find answers to questions about the Pioneers accelerator program. Use simple keywords (e.g., "program", "equity", "application") or "all" to get all Q&As. The tool returns matching Q&A pairs that you can then analyze.',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'Simple search keyword(s) or "all" to get all questions. Examples: "problem", "equity", "timeline", "all"',
      ),
  }),
  outputSchema: z.object({
    answers: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
          category: z.string(),
        }),
      )
      .describe("Matching questions and answers from the knowledge base"),
    found: z.boolean().describe("Whether matching answers were found"),
  }),
  execute: async ({ query }) => {
    const data = loadJsonData("general-questions.json");
    const results: Array<{
      question: string;
      answer: string;
      category: string;
    }> = [];

    // If query is empty or very broad ("all", "questions", etc.), return all Q&As
    const isAllQuery =
      !query ||
      query.trim() === "" ||
      ["all", "all questions", "everything", "questions"].includes(
        query.toLowerCase().trim(),
      );

    // Search through all categories in knowledge_base
    if (
      data &&
      typeof data === "object" &&
      "knowledge_base" in data &&
      data.knowledge_base
    ) {
      for (const [category, items] of Object.entries(
        data.knowledge_base as Record<string, any[]>,
      )) {
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item.question && item.answer) {
              // If broad query, include all items
              if (isAllQuery) {
                results.push({
                  question: item.question,
                  answer: item.answer,
                  category: category.replace(/_/g, " "),
                });
              }
              // Otherwise, search for matches
              else if (
                searchInText(item.question, query) ||
                searchInText(item.answer, query)
              ) {
                results.push({
                  question: item.question,
                  answer: item.answer,
                  category: category.replace(/_/g, " "),
                });
              }
            }
          }
        }
      }
    }

    // Limit results - more for "all" queries, fewer for specific searches
    const limit = isAllQuery ? 50 : 5;
    const finalResults = results.slice(0, limit);

    if (isAllQuery) {
      log("Query type: All questions (broad query)", query);
    }

    return {
      answers: finalResults,
      found: results.length > 0,
    };
  },
});
