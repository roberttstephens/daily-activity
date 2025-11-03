/**
 * Common types and interfaces for activity tracking
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
