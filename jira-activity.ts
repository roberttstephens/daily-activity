#!/usr/bin/env node --experimental-strip-types
/**
 * Script to fetch Jira tickets you worked on for a given day.
 *
 * Usage:
 * node --experimental-strip-types jira-activity.ts [YYYY-MM-DD]
 */

import "dotenv/config";

interface JiraInstance {
  url: string;
  email: string;
  apiToken: string;
}

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    project: {
      name: string;
      key: string;
    };
  };
}

interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
}

// Configuration
const JIRA_INSTANCES: JiraInstance[] = [
  {
    url: "https://massgov.atlassian.net",
    email: process.env.ATLASSIAN_1_ACCOUNT_EMAIL ?? "",
    apiToken: process.env.ATLASSIAN_1_API_TOKEN ?? "",
  },
];

async function getDailyActivity(
  jiraUrl: string,
  email: string,
  apiToken: string,
  dateStr: string,
): Promise<JiraIssue[]> {
  // Create auth header
  const auth = btoa(`${email}:${apiToken}`);

  // Calculate next day for date range using Temporal-style date arithmetic
  const date = new Date(dateStr);
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateStr = nextDate.toISOString().split("T")[0];
  console.log(nextDateStr);

  // JQL queries
  const queries = [
    //`assignee = currentUser() AND updated >= "${dateStr}" AND updated < "${nextDateStr}"`,
    `updated >= "${dateStr}" AND updated < "${nextDateStr}" AND assignee = 642ad2aa22330bdf97ab3039 ORDER BY updated DESC`,
    `comment ~ currentUser() AND commented >= "${dateStr}" AND commented < "${nextDateStr}"`,
  ];

  console.log(queries);
  try {
    // Use Promise.allSettled to handle partial failures gracefully
    const results = await Promise.allSettled(
      queries.map((jql) =>
        fetch(
          `${jiraUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=100`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              Accept: "application/json",
            },
          },
        ).then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json() as Promise<JiraSearchResponse>;
        }),
      ),
    );
    console.log(results);

    // Collect all successful results
    const allIssues = results
      .filter(
        (result): result is PromiseFulfilledResult<JiraSearchResponse> =>
          result.status === "fulfilled",
      )
      .flatMap((result) => result.value.issues);

    // Deduplicate by key using Map
    const uniqueIssues = new Map(allIssues.map((issue) => [issue.key, issue]));

    return Array.from(uniqueIssues.values());
  } catch (error) {
    console.error(
      `Error querying ${jiraUrl}:`,
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

function groupByProject(issues: JiraIssue[]): Map<string, JiraIssue[]> {
  return issues.reduce((acc, issue) => {
    const projectKey = issue.fields.project.key;
    const existing = acc.get(projectKey) ?? [];
    acc.set(projectKey, [...existing, issue]);
    return acc;
  }, new Map<string, JiraIssue[]>());
}

async function main() {
  // Get date from command line or use today
  const dateStr = process.argv[2] ?? new Date().toISOString().split("T")[0];

  // Validate date format
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.error("Invalid date format. Use YYYY-MM-DD");
    process.exit(1);
  }

  console.log(`\n=== Jira Activity for ${dateStr} ===\n`);

  // Query all instances in parallel
  const results = await Promise.allSettled(
    JIRA_INSTANCES.map(async (instance) => {
      console.log(instance);
      if (!instance.apiToken) {
        return { instance, issues: [], skipped: true };
      }

      const issues = await getDailyActivity(
        instance.url,
        instance.email,
        instance.apiToken,
        dateStr,
      );

      return { instance, issues, skipped: false };
    }),
  );

  // Display results
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Failed to query instance:", result.reason);
      continue;
    }

    const { instance, issues, skipped } = result.value;

    console.log(`\n📋 ${instance.url}`);
    console.log("─".repeat(60));

    if (skipped) {
      console.log("Skipped - no API token set\n");
      continue;
    }

    if (issues.length === 0) {
      console.log("No activity found\n");
      continue;
    }

    // Group by project for better organization
    const byProject = groupByProject(issues);

    for (const [projectKey, projectIssues] of byProject) {
      console.log(
        `\n  Project: ${projectIssues[0].fields.project.name} (${projectKey})`,
      );

      for (const issue of projectIssues) {
        console.log(`    • ${issue.key}: ${issue.fields.summary}`);
        console.log(`      Status: ${issue.fields.status.name}`);
        console.log(`      ${instance.url}/browse/${issue.key}`);
      }
    }

    console.log(
      `\n  Total: ${issues.length} ticket${issues.length !== 1 ? "s" : ""}`,
    );
  }

  console.log(); // Final newline
}

await main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
