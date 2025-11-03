#!/usr/bin/env node --experimental-strip-types
/**
 * Script to fetch Jira tickets using a JQL query.
 */

import "dotenv/config";
import type { ActivityItem, ActivityProvider } from "./types.ts";
import { isValidDateFormat } from "./utils.ts";

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

interface AtlassianInstance {
  domain: string;
  email: string;
  apiToken: string;
}

async function fetchJiraFromInstance(
  instance: AtlassianInstance,
  dateStr: string,
): Promise<JiraIssue[]> {
  const jiraUrl = `https://${instance.domain}.atlassian.net`;

  const nextDate = new Date(dateStr);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateStr = nextDate.toISOString().substring(0, 10);

  // Query for tickets where you were active on the specified date:
  // 1. Tickets assigned to you where you changed status OR added comments
  // 2. Tickets you created on that day
  // 3. Tickets you're watching that were updated (indicates active monitoring/engagement)
  const jql = `(assignee = currentUser() AND (status changed DURING ("${dateStr}") OR commenter = currentUser())) OR (reporter = currentUser() AND created >= "${dateStr}" AND created < "${nextDateStr}") OR (watcher = currentUser() AND updated >= "${dateStr}" AND updated < "${nextDateStr}")`;
  const auth = btoa(`${instance.email}:${instance.apiToken}`);
  const url = `${jiraUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=summary,status,project&maxResults=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `Error fetching from ${instance.domain}: HTTP ${response.status} ${response.statusText}`,
    );
    console.error(errorBody);
    return [];
  }

  const data = (await response.json()) as JiraSearchResponse;
  return data.issues;
}

function loadAtlassianInstances(): AtlassianInstance[] {
  const instances: AtlassianInstance[] = [];

  // Look for ATLASSIAN_N_* environment variables
  let index = 1;
  while (true) {
    const domain = process.env[`ATLASSIAN_${index}_DOMAIN`];
    const email = process.env[`ATLASSIAN_${index}_ACCOUNT_EMAIL`];
    const apiToken = process.env[`ATLASSIAN_${index}_API_TOKEN`];

    // If all three are present, add the instance
    if (domain && email && apiToken) {
      instances.push({ domain, email, apiToken });
      index++;
    } else if (domain || email || apiToken) {
      // If only some are present, warn about incomplete configuration
      console.warn(
        `Warning: Incomplete configuration for ATLASSIAN_${index}_*. Skipping.`,
      );
      index++;
    } else {
      // No more instances found
      break;
    }
  }

  return instances;
}

export const jiraActivityProvider: ActivityProvider = {
  name: "Jira",

  async fetchActivity(dateStr: string): Promise<ActivityItem[]> {
    if (!isValidDateFormat(dateStr)) {
      throw new Error("Invalid date format. Use YYYY-MM-DD");
    }

    const instances = loadAtlassianInstances();

    if (instances.length === 0) {
      throw new Error(
        "At least one Atlassian instance must be configured with ATLASSIAN_N_DOMAIN, ATLASSIAN_N_ACCOUNT_EMAIL and ATLASSIAN_N_API_TOKEN in .env",
      );
    }

    // Fetch from all instances in parallel
    const allIssuesArrays = await Promise.all(
      instances.map((instance) => fetchJiraFromInstance(instance, dateStr)),
    );

    // Flatten and combine all issues
    const allIssues = allIssuesArrays.flat();

    return allIssues.map((issue) => ({
      title: `${issue.key}: ${issue.fields.summary}`,
      source: "Jira",
      metadata: {
        key: issue.key,
        status: issue.fields.status.name,
        project: issue.fields.project.name,
      },
    }));
  },
};
