import { execSync } from "node:child_process";
import { ZodError } from "zod";
import {
  GitHubCommitsResponseSchema,
  GitHubPRsResponseSchema,
} from "./schemas.ts";
import type { ActivityItem, ActivityProvider } from "./types.ts";
import { isValidDateFormat } from "./utils.ts";

export const githubActivityProvider: ActivityProvider = {
  name: "GitHub",

  async fetchActivity(dateStr: string): Promise<ActivityItem[]> {
    if (!isValidDateFormat(dateStr)) {
      throw new Error("Invalid date format. Use YYYY-MM-DD");
    }

    const activities: ActivityItem[] = [];

    // Fetch commits
    try {
      const commitsOutput = execSync(
        `gh search commits --author=@me --author-date=${dateStr} --json commit --limit 100`,
        { encoding: "utf-8" },
      );

      const parsedOutput = JSON.parse(commitsOutput);
      const result = GitHubCommitsResponseSchema.safeParse(parsedOutput);

      if (!result.success) {
        console.error(
          `GitHub commits validation error for ${dateStr}:`,
          JSON.stringify(result.error.issues, null, 2),
        );
        console.warn("Skipping GitHub commits due to validation error");
      } else {
        const commits = result.data;
        for (const commit of commits) {
          const message = commit.commit.message.split("\n")[0]; // First line only
          activities.push({
            title: message || "",
            source: "GitHub",
            metadata: { type: "commit" },
          });
        }
      }
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(
          `GitHub commits validation error for ${dateStr}:`,
          JSON.stringify(error.issues, null, 2),
        );
      } else {
        console.warn(
          `Failed to fetch GitHub commits for ${dateStr}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    // Fetch PRs reviewed
    try {
      const prsOutput = execSync(
        `gh search prs --reviewed-by=@me --updated=${dateStr} --json title --limit 100`,
        { encoding: "utf-8" },
      );

      const parsedOutput = JSON.parse(prsOutput);
      const result = GitHubPRsResponseSchema.safeParse(parsedOutput);

      if (!result.success) {
        console.error(
          `GitHub PRs validation error for ${dateStr}:`,
          JSON.stringify(result.error.issues, null, 2),
        );
        console.warn("Skipping GitHub PRs due to validation error");
      } else {
        const prs = result.data;
        for (const pr of prs) {
          activities.push({
            title: pr.title,
            source: "GitHub",
            metadata: { type: "pr-review" },
          });
        }
      }
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(
          `GitHub PRs validation error for ${dateStr}:`,
          JSON.stringify(error.issues, null, 2),
        );
      } else {
        console.warn(
          `Failed to fetch GitHub PRs for ${dateStr}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return activities;
  },
};
