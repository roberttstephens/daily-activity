/**
 * Zod schemas for external API responses
 */

import { z } from "zod";

// GitHub Schemas
export const GitHubCommitSchema = z.object({
  commit: z.object({
    message: z.string(),
  }),
});

export const GitHubPRSchema = z.object({
  title: z.string(),
});

export const GitHubCommitsResponseSchema = z.array(GitHubCommitSchema);
export const GitHubPRsResponseSchema = z.array(GitHubPRSchema);

// GitHub Types (inferred from schemas)
export type GitHubCommit = z.infer<typeof GitHubCommitSchema>;
export type GitHubPR = z.infer<typeof GitHubPRSchema>;

// Jira Schemas
export const JiraIssueSchema = z.object({
  key: z.string(),
  fields: z.object({
    summary: z.string(),
    status: z.object({
      name: z.string(),
    }),
    project: z.object({
      name: z.string(),
      key: z.string(),
    }),
  }),
});

export const JiraSearchResponseSchema = z.object({
  issues: z.array(JiraIssueSchema),
});

// Jira Types (inferred from schemas)
export type JiraIssue = z.infer<typeof JiraIssueSchema>;
export type JiraSearchResponse = z.infer<typeof JiraSearchResponseSchema>;
