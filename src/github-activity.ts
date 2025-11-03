#!/usr/bin/env node --experimental-strip-types
/**
 * Script to fetch GitHub activity (commits and PR reviews) using GitHub CLI.
 */

import { execSync } from "node:child_process";

interface GitHubCommit {
  commit: {
    message: string;
  };
}

interface GitHubPR {
  title: string;
}

export async function fetchGitHubActivity(dateStr: string): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.error("Invalid date format. Use YYYY-MM-DD");
    process.exit(1);
  }

  // Fetch commits
  try {
    const commitsOutput = execSync(
      `gh search commits --author=@me --author-date=${dateStr} --json commit --limit 100`,
      { encoding: "utf-8" },
    );

    const commits = JSON.parse(commitsOutput) as GitHubCommit[];

    for (const commit of commits) {
      const message = commit.commit.message.split("\n")[0]; // First line only

      console.log(`${message} | GitHub`);
    }
  } catch (_error) {
    // Silently continue if no commits found or gh command fails
  }

  // Fetch PRs reviewed
  try {
    const prsOutput = execSync(
      `gh search prs --reviewed-by=@me --updated=${dateStr} --json title --limit 100`,
      { encoding: "utf-8" },
    );

    const prs = JSON.parse(prsOutput) as GitHubPR[];

    for (const pr of prs) {
      console.log(`${pr.title} | GitHub`);
    }
  } catch (_error) {
    // Silently continue if no PRs found or gh command fails
  }
}
