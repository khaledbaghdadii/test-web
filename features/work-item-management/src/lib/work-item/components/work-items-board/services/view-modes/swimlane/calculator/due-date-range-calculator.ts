import { WorkItemDueDateRange } from "../../../../model/work-item-due-date-range.enum";

export interface DateRangeFilter {
  from?: string;
  to?: string;
}

export class DueDateRangeCalculator {
  private static readonly THIS_WEEK_START_OFFSET = 1;
  private static readonly THIS_WEEK_DURATION = 7;
  private static readonly THIS_MONTH_START_OFFSET = 8;
  private static readonly THIS_MONTH_DURATION = 23;

  static getDateRangeFilter(range: WorkItemDueDateRange): DateRangeFilter {
    const today = this.getTodayAtMidnight();
    switch (range) {
      case WorkItemDueDateRange.TODAY:
        return this.getDueTodayRange(today);
      case WorkItemDueDateRange.THIS_WEEK:
        return this.getDueInWeekRange(today);
      case WorkItemDueDateRange.THIS_MONTH:
        return this.getDueThisMonthRange(today);
      case WorkItemDueDateRange.LATER:
        return this.getDueLaterRange(today);
      default:
        return {};
    }
  }

  private static getDueTodayRange(today: Date): DateRangeFilter {
    const startOfDay = this.getStartOfDay(today);
    const endOfDay = this.getEndOfDay(today);
    return {
      from: this.formatDate(startOfDay),
      to: this.formatDate(endOfDay),
    };
  }

  private static getDueInWeekRange(today: Date): DateRangeFilter {
    const startDate = this.addDays(today, this.THIS_WEEK_START_OFFSET);
    const endDate = this.addDays(startDate, this.THIS_WEEK_DURATION - 1);
    return {
      from: this.formatDate(this.getStartOfDay(startDate)),
      to: this.formatDate(this.getEndOfDay(endDate)),
    };
  }

  private static getDueThisMonthRange(today: Date): DateRangeFilter {
    const startDate = this.addDays(today, this.THIS_MONTH_START_OFFSET);
    const endDate = this.addDays(startDate, this.THIS_MONTH_DURATION - 1);
    return {
      from: this.formatDate(this.getStartOfDay(startDate)),
      to: this.formatDate(this.getEndOfDay(endDate)),
    };
  }

  private static getDueLaterRange(today: Date): DateRangeFilter {
    const startDate = this.addDays(
      today,
      this.THIS_MONTH_START_OFFSET + this.THIS_MONTH_DURATION
    );
    return {
      from: this.formatDate(this.getStartOfDay(startDate)),
    };
  }

  private static getTodayAtMidnight(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private static formatDate(date: Date): string {
    return date.toISOString();
  }

  private static getStartOfDay(date: Date): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0
    );
  }

  private static getEndOfDay(date: Date): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999
    );
  }
}
