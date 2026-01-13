import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

type ActivityItem = {
  date: string;
  count: number;
  level: number;
};

@Injectable()
export class DashboardService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async getDashboardSummary(userId: number) {
    const totalNotes = await this.countNotes(userId);
    const thisMonthNotes = await this.countNotesForMonth(userId, new Date());
    const currentStreakDays = await this.getCurrentStreakDays(userId);
    const activity = await this.getActivity(userId);

    return {
      userId,
      totalNotes,
      currentStreakDays,
      thisMonthNotes,
      activity,
    };
  }

  private async countNotes(userId: number) {
    const response = await this.supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (response.error) {
      throw new Error(`Failed to count notes: ${response.error.message}`);
    }

    return response.count ?? 0;
  }

  private async countNotesForMonth(userId: number, referenceDate: Date) {
    const start = new Date(
      Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1),
    );
    const end = this.addMonthsUtc(start, 1);

    const response = await this.supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());

    if (response.error) {
      throw new Error(
        `Failed to count notes for month: ${response.error.message}`,
      );
    }

    return response.count ?? 0;
  }

  private async getCurrentStreakDays(userId: number) {
    const response = await this.supabase
      .from('notes')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (response.error) {
      throw new Error(`Failed to load notes: ${response.error.message}`);
    }

    const rows = response.data ?? [];
    if (rows.length === 0) {
      return 0;
    }

    const uniqueDates = new Set<string>();
    for (const row of rows) {
      const date = this.formatDateUtc(new Date(row.created_at));
      uniqueDates.add(date);
    }

    const sortedDates = Array.from(uniqueDates).sort();
    let streak = 1;
    let current = new Date(sortedDates[sortedDates.length - 1]);

    for (let i = sortedDates.length - 2; i >= 0; i -= 1) {
      const prev = new Date(sortedDates[i]);
      const diffDays = this.diffDaysUtc(prev, current);
      if (diffDays === 1) {
        streak += 1;
        current = prev;
      } else if (diffDays > 1) {
        break;
      }
    }

    return streak;
  }

  private async getActivity(userId: number) {
    const { fromDate, toDate } = this.resolveRange();
    const response = await this.supabase
      .from('notes')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', fromDate.toISOString())
      .lt('created_at', this.addDaysUtc(toDate, 1).toISOString());

    if (response.error) {
      throw new Error(`Failed to load activity: ${response.error.message}`);
    }

    const countsByDate = new Map<string, number>();
    for (const row of response.data ?? []) {
      const dateKey = this.formatDateUtc(new Date(row.created_at));
      countsByDate.set(dateKey, (countsByDate.get(dateKey) ?? 0) + 1);
    }

    const activity: ActivityItem[] = [];
    for (
      let cursor = new Date(fromDate);
      cursor <= toDate;
      cursor = this.addDaysUtc(cursor, 1)
    ) {
      const dateKey = this.formatDateUtc(cursor);
      const count = countsByDate.get(dateKey) ?? 0;
      activity.push({
        date: dateKey,
        count,
        level: this.getLevel(count),
      });
    }

    return activity;
  }

  private resolveRange() {
    const fromDate = this.startOfDayUtc(new Date('2026-01-01'));
    const toDate = this.addDaysUtc(this.addMonthsUtc(fromDate, 12), -1);
    return { fromDate, toDate };
  }

  private getLevel(count: number) {
    if (count >= 10) return 4;
    if (count >= 5) return 3;
    if (count >= 3) return 2;
    if (count >= 1) return 1;
    return 0;
  }

  private addMonthsUtc(date: Date, months: number) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
    );
  }

  private startOfDayUtc(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private addDaysUtc(date: Date, days: number) {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate() + days,
      ),
    );
  }

  private diffDaysUtc(a: Date, b: Date) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const aStart = this.startOfDayUtc(a).getTime();
    const bStart = this.startOfDayUtc(b).getTime();
    return Math.round((bStart - aStart) / msPerDay);
  }

  private formatDateUtc(date: Date) {
    return date.toISOString().slice(0, 10);
  }
}
