/**
 * Common types excluding external API schemas/interfaces
 */

export interface ActivityItem {
  title: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityProvider {
  name: string;
  fetchActivity(dateStr: string): Promise<ActivityItem[]>;
}

// Atlassian configuration
export interface AtlassianInstance {
  domain: string;
  email: string;
  apiToken: string;
}
