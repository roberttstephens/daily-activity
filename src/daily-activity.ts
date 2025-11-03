#!/usr/bin/env node --experimental-strip-types

/**
 * Script to fetch daily activity from both Jira and GitHub.
 *
 * Usage:
 * node --experimental-strip-types src/daily-activity.ts [YYYY-MM-DD]
 */

import { githubActivityProvider } from "./github-activity.ts";
import { jiraActivityProvider } from "./jira-activity.ts";
import type { ActivityItem, ActivityProvider } from "./types.ts";
import { isValidDateFormat } from "./utils.ts";

async function main() {
  const dateStr = process.argv[2] || new Date().toISOString().substring(0, 10);

  if (!isValidDateFormat(dateStr)) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  console.log(`Activity for ${dateStr}:\n`);

  const allActivities: ActivityItem[] = [];

  // Configure providers
  const providers: ActivityProvider[] = [
    jiraActivityProvider,
    githubActivityProvider,
  ];

  // Fetch from all providers
  for (const provider of providers) {
    try {
      const activities = await provider.fetchActivity(dateStr);
      allActivities.push(...activities);
    } catch (error) {
      console.error(
        `Error fetching ${provider.name} activity:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  // Sort activities alphabetically by title
  allActivities.sort((a, b) => a.title.localeCompare(b.title));

  // Output results
  for (const activity of allActivities) {
    console.log(`${activity.title} | ${activity.source}`);
  }

  console.log(`\nTotal: ${allActivities.length} activities`);
}

await main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
