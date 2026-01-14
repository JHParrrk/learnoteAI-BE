import { ActivityItem } from './activity-item.interface';

export interface DashboardSummary {
  userId: number;
  totalNotes: number;
  currentStreakDays: number;
  thisMonthNotes: number;
  activity: ActivityItem[];
}
