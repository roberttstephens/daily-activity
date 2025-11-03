#!/usr/bin/env node --experimental-strip-types
/**
 * Script to fetch Jira tickets using a JQL query.
 */

import "dotenv/config";

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    project: { name: string; key: string };
  };
}

interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
}

export async function fetchJiraActivity(dateStr: string): Promise<void> {
  const jiraUrl = "https://massgov.atlassian.net";
  const email = process.env.ATLASSIAN_1_ACCOUNT_EMAIL;
  const apiToken = process.env.ATLASSIAN_1_API_TOKEN;

  if (!email || !apiToken) {
    console.error(
      "Error: ATLASSIAN_1_ACCOUNT_EMAIL and ATLASSIAN_1_API_TOKEN must be set in .env",
    );
    process.exit(1);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.error("Invalid date format. Use YYYY-MM-DD");
    process.exit(1);
  }

  const nextDate = new Date(dateStr);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateStr = nextDate.toISOString().substring(0, 10);

  // Query for tickets where you were active on the specified date:
  // 1. Tickets assigned to you where you changed status OR added comments
  // 2. Tickets you created on that day
  // 3. Tickets you're watching that were updated (indicates active monitoring/engagement)
  const jql = `(assignee = currentUser() AND (status changed DURING ("${dateStr}") OR commenter = currentUser())) OR (reporter = currentUser() AND created >= "${dateStr}" AND created < "${nextDateStr}") OR (watcher = currentUser() AND updated >= "${dateStr}" AND updated < "${nextDateStr}")`;
  const auth = btoa(`${email}:${apiToken}`);
  const url = `${jiraUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=summary,status,project&maxResults=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Error: HTTP ${response.status} ${response.statusText}`);
    console.error(errorBody);
    process.exit(1);
  }

  const data = (await response.json()) as JiraSearchResponse;

  if (data.issues.length === 0) {
    return;
  }

  for (const issue of data.issues) {
    console.log(`${issue.key}: ${issue.fields.summary} | Jira`);
  }
}
