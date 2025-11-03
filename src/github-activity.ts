import { execSync } from "node:child_process";
import type { ActivityItem, ActivityProvider } from "./types.ts";
import { isValidDateFormat } from "./utils.ts";

interface GitHubCommit {
  commit: {
    message: string;
  };
}

interface GitHubPR {
  title: string;
}

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

      const commits = JSON.parse(commitsOutput) as GitHubCommit[];

      for (const commit of commits) {
        const message = commit.commit.message.split("\n")[0]; // First line only
        activities.push({
          title: message || "",
          source: "GitHub",
          metadata: { type: "commit" },
        });
      }
    } catch (error) {
      console.warn(
        `Failed to fetch GitHub commits for ${dateStr}:`,
        error instanceof Error ? error.message : String(error),
      );
    }

    // Fetch PRs reviewed
    try {
      const prsOutput = execSync(
        `gh search prs --reviewed-by=@me --updated=${dateStr} --json title --limit 100`,
        { encoding: "utf-8" },
      );

      const prs = JSON.parse(prsOutput) as GitHubPR[];

      for (const pr of prs) {
        activities.push({
          title: pr.title,
          source: "GitHub",
          metadata: { type: "pr-review" },
        });
      }
    } catch (error) {
      console.warn(
        `Failed to fetch GitHub PRs for ${dateStr}:`,
        error instanceof Error ? error.message : String(error),
      );
    }

    return activities;
  },
};
