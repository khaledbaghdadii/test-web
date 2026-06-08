import { WorkItemTimeUtilitiesService } from "./work-item-time-utilities.service";
import { WorkItem } from "../model/work-item";

describe("WorkItemTimeUtilitiesService", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-08-26T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getElapsedTimePercentage", () => {
    it("returns 0 if dueDate is undefined", () => {
      const workItem: WorkItem = {
        createdOn: "2025-08-20T12:00:00Z",
        dueDate: undefined,
      } as unknown as WorkItem;

      expect(
        WorkItemTimeUtilitiesService.getElapsedTimePercentage(workItem)
      ).toBe(0);
    });

    it("returns 0 if dueDate is empty string", () => {
      const workItem: WorkItem = {
        createdOn: "2025-08-20T12:00:00Z",
        dueDate: "",
      } as unknown as WorkItem;

      expect(
        WorkItemTimeUtilitiesService.getElapsedTimePercentage(workItem)
      ).toBe(0);
    });

    it("returns 0 if dueDate is null", () => {
      const workItem: WorkItem = {
        createdOn: "2025-08-20T12:00:00Z",
        dueDate: null,
      } as unknown as WorkItem;

      expect(
        WorkItemTimeUtilitiesService.getElapsedTimePercentage(workItem)
      ).toBe(0);
    });

    it("returns 100 if createdOn > dueDate", () => {
      const workItem: WorkItem = {
        createdOn: "2025-08-27T12:00:00Z",
        dueDate: "2025-08-26T12:00:00Z",
      } as unknown as WorkItem;

      expect(
        WorkItemTimeUtilitiesService.getElapsedTimePercentage(workItem)
      ).toBe(100);
    });

    it("returns 100 if now > dueDate", () => {
      const workItem: WorkItem = {
        createdOn: "2025-08-20T12:00:00Z",
        dueDate: "2025-08-25T12:00:00Z",
      } as unknown as WorkItem;

      expect(
        WorkItemTimeUtilitiesService.getElapsedTimePercentage(workItem)
      ).toBe(100);
    });

    it("returns 0 if createdOn == dueDate", () => {
      const workItem: WorkItem = {
        createdOn: "2025-08-26T12:00:00Z",
        dueDate: "2025-08-26T12:00:00Z",
      } as unknown as WorkItem;

      expect(
        WorkItemTimeUtilitiesService.getElapsedTimePercentage(workItem)
      ).toBe(0);
    });

    it("returns correct percentage for normal case", () => {
      const workItem: WorkItem = {
        createdOn: "2025-08-20T12:00:00Z",
        dueDate: "2025-08-30T12:00:00Z",
      } as unknown as WorkItem;

      expect(
        WorkItemTimeUtilitiesService.getElapsedTimePercentage(workItem)
      ).toBe(60);
    });

    it("returns 0 if now < createdOn", () => {
      const workItem: WorkItem = {
        createdOn: "2025-08-27T12:00:00Z",
        dueDate: "2025-08-30T12:00:00Z",
      } as unknown as WorkItem;

      expect(
        WorkItemTimeUtilitiesService.getElapsedTimePercentage(workItem)
      ).toBe(0);
    });

    it("works with Date objects", () => {
      const workItem: WorkItem = {
        createdOn: new Date("2025-08-20T12:00:00Z"),
        dueDate: new Date("2025-08-30T12:00:00Z"),
      } as WorkItem;

      expect(
        WorkItemTimeUtilitiesService.getElapsedTimePercentage(workItem)
      ).toBe(60);
    });

    it("works with current time", () => {
      jest.useRealTimers();
      const now = new Date();
      const past = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const future = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

      const workItem: WorkItem = {
        createdOn: past,
        dueDate: future,
      } as WorkItem;

      const result =
        WorkItemTimeUtilitiesService.getElapsedTimePercentage(workItem);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });
  });
});
