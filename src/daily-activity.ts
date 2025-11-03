#!/usr/bin/env node --experimental-strip-types

/**
 * Script to fetch daily activity from both Jira and GitHub.
 *
 * Usage:
 * node --experimental-strip-types src/daily-activity.ts [YYYY-MM-DD]
 */

import { fetchGitHubActivity } from "./github-activity.ts";
import { fetchJiraActivity } from "./jira-activity.ts";

async function main() {
  const dateStr = process.argv[2] || new Date().toISOString().substring(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.error("Invalid date format. Use YYYY-MM-DD");
    process.exit(1);
  }

  console.log(`Activity for ${dateStr}:\n`);

  try {
    await fetchJiraActivity(dateStr);
  } catch (error) {
    console.error("Error fetching Jira activity:", error);
  }

  try {
    await fetchGitHubActivity(dateStr);
  } catch (error) {
    console.error("Error fetching GitHub activity:", error);
  }
}

await main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
