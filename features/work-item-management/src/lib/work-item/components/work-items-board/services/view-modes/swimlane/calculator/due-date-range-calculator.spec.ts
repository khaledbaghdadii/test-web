import {
  DueDateRangeCalculator,
  DateRangeFilter,
} from "./due-date-range-calculator";
import { WorkItemDueDateRange } from "../../../../model/work-item-due-date-range.enum";

describe("DueDateRangeCalculator", () => {
  const mockDate = new Date(2025, 10, 5);

  const toISOString = (
    year: number,
    month: number,
    day: number,
    hours = 0,
    minutes = 0,
    seconds = 0,
    ms = 0
  ): string => {
    return new Date(
      year,
      month,
      day,
      hours,
      minutes,
      seconds,
      ms
    ).toISOString();
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getDateRangeFilter", () => {
    it("should return TODAY range", () => {
      const result: DateRangeFilter = DueDateRangeCalculator.getDateRangeFilter(
        WorkItemDueDateRange.TODAY
      );

      expect(result.from).toBe(toISOString(2025, 10, 5, 0, 0, 0, 0));
      expect(result.to).toBe(toISOString(2025, 10, 5, 23, 59, 59, 999));
    });

    it("should return THIS_WEEK range", () => {
      const result: DateRangeFilter = DueDateRangeCalculator.getDateRangeFilter(
        WorkItemDueDateRange.THIS_WEEK
      );

      expect(result.from).toBe(toISOString(2025, 10, 6, 0, 0, 0, 0));
      expect(result.to).toBe(toISOString(2025, 10, 12, 23, 59, 59, 999));
    });

    it("should return THIS_MONTH range", () => {
      const result: DateRangeFilter = DueDateRangeCalculator.getDateRangeFilter(
        WorkItemDueDateRange.THIS_MONTH
      );

      expect(result.from).toBe(toISOString(2025, 10, 13, 0, 0, 0, 0));
      expect(result.to).toBe(toISOString(2025, 11, 5, 23, 59, 59, 999));
    });

    it("should return LATER range", () => {
      const result: DateRangeFilter = DueDateRangeCalculator.getDateRangeFilter(
        WorkItemDueDateRange.LATER
      );

      expect(result.from).toBe(toISOString(2025, 11, 6, 0, 0, 0, 0));
      expect(result.to).toBeUndefined();
    });

    it("should return empty object for unknown range", () => {
      const result: DateRangeFilter = DueDateRangeCalculator.getDateRangeFilter(
        "UNKNOWN" as WorkItemDueDateRange
      );

      expect(result).toEqual({});
    });
  });

  describe("boundaries", () => {
    it("should not have overlapping ranges", () => {
      const today = DueDateRangeCalculator.getDateRangeFilter(
        WorkItemDueDateRange.TODAY
      );
      const thisWeek = DueDateRangeCalculator.getDateRangeFilter(
        WorkItemDueDateRange.THIS_WEEK
      );
      const thisMonth = DueDateRangeCalculator.getDateRangeFilter(
        WorkItemDueDateRange.THIS_MONTH
      );
      const later = DueDateRangeCalculator.getDateRangeFilter(
        WorkItemDueDateRange.LATER
      );

      const todayEnd = new Date(today.to!);
      const weekStart = new Date(thisWeek.from!);
      expect(todayEnd.getDate()).toBe(5);
      expect(weekStart.getDate()).toBe(6);

      const weekEnd = new Date(thisWeek.to!);
      const monthStart = new Date(thisMonth.from!);
      expect(weekEnd.getDate()).toBe(12);
      expect(monthStart.getDate()).toBe(13);

      const monthEnd = new Date(thisMonth.to!);
      const laterStart = new Date(later.from!);
      expect(monthEnd.getDate()).toBe(5);
      expect(laterStart.getDate()).toBe(6);
    });

    it("should cover 7 days for THIS_WEEK", () => {
      const result = DueDateRangeCalculator.getDateRangeFilter(
        WorkItemDueDateRange.THIS_WEEK
      );

      const fromDate = new Date(result.from!);
      const toDate = new Date(result.to!);
      const daysDiff = Math.floor(
        (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBe(6);
    });

    it("should cover 23 days for THIS_MONTH", () => {
      const result = DueDateRangeCalculator.getDateRangeFilter(
        WorkItemDueDateRange.THIS_MONTH
      );

      const fromDate = new Date(result.from!);
      const toDate = new Date(result.to!);
      const daysDiff = Math.floor(
        (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBe(22);
    });
  });

  describe("edge cases", () => {
    it("should handle year boundary", () => {
      jest.setSystemTime(new Date(2025, 11, 30));

      const thisWeek = DueDateRangeCalculator.getDateRangeFilter(
        WorkItemDueDateRange.THIS_WEEK
      );

      expect(thisWeek.from).toBe(toISOString(2025, 11, 31, 0, 0, 0, 0));
      expect(thisWeek.to).toBe(toISOString(2026, 0, 6, 23, 59, 59, 999));
    });

    it("should handle month boundary", () => {
      jest.setSystemTime(new Date(2025, 10, 30));

      const thisMonth = DueDateRangeCalculator.getDateRangeFilter(
        WorkItemDueDateRange.THIS_MONTH
      );

      expect(thisMonth.from).toBe(toISOString(2025, 11, 8, 0, 0, 0, 0));
      expect(thisMonth.to).toBe(toISOString(2025, 11, 30, 23, 59, 59, 999));
    });
  });
});
