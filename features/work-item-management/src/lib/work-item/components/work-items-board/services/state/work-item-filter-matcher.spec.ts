import {
  WorkItem,
  WorkItemType,
  WorkItemStatus,
  WorkItemPriority,
} from "../../../../model/work-item";
import { WorkItemBoardFilter } from "../../model/work-item-board-filter.model";
import { workItemMatchesFilter } from "./work-item-filter-matcher";

const createWorkItem = (overrides: Partial<WorkItem> = {}): WorkItem => ({
  id: "wi-1",
  projectId: "project-1",
  name: "Test Work Item",
  description: "A description",
  workItemCategory: "TASK",
  domain: "TEST",
  workItemType: WorkItemType.UNITARY,
  workItemStatus: WorkItemStatus.OPEN,
  workItemPriority: WorkItemPriority.MEDIUM,
  metadata: {},
  businessProcesses: [{ id: "bp-1" }],
  createdOn: new Date(),
  projectName: "Test Project",
  ...overrides,
});

describe("workItemMatchesFilter", () => {
  describe("no filters applied", () => {
    it("Should_ReturnTrue_When_FilterIsEmpty", () => {
      const workItem = createWorkItem();
      const filter: WorkItemBoardFilter = {};

      expect(workItemMatchesFilter(workItem, filter)).toBe(true);
    });
  });

  describe("search filter", () => {
    it("Should_ReturnTrue_When_SearchMatchesName", () => {
      const workItem = createWorkItem({ name: "Fix login bug" });
      const filter: WorkItemBoardFilter = { search: "login" };

      expect(workItemMatchesFilter(workItem, filter)).toBe(true);
    });

    it("Should_ReturnTrue_When_SearchMatchesNameCaseInsensitive", () => {
      const workItem = createWorkItem({ name: "Fix Login Bug" });
      const filter: WorkItemBoardFilter = { search: "fix login" };

      expect(workItemMatchesFilter(workItem, filter)).toBe(true);
    });

    it("Should_ReturnTrue_When_SearchMatchesObjectId", () => {
      const workItem = createWorkItem({ objectId: "OBJ-123" });
      const filter: WorkItemBoardFilter = { search: "OBJ-123" };

      expect(workItemMatchesFilter(workItem, filter)).toBe(true);
    });

    it("Should_ReturnFalse_When_SearchDoesNotMatch", () => {
      const workItem = createWorkItem({
        name: "Fix login bug",
        objectId: "OBJ-1",
      });
      const filter: WorkItemBoardFilter = { search: "deploy" };

      expect(workItemMatchesFilter(workItem, filter)).toBe(false);
    });

    it("Should_ReturnFalse_When_NameAndObjectIdAreUndefined", () => {
      const workItem = createWorkItem({ name: undefined, objectId: undefined });
      const filter: WorkItemBoardFilter = { search: "anything" };

      expect(workItemMatchesFilter(workItem, filter)).toBe(false);
    });
  });

  describe("project IDs filter", () => {
    it("Should_ReturnTrue_When_ProjectIdInFilter", () => {
      const workItem = createWorkItem({ projectId: "project-1" });
      const filter: WorkItemBoardFilter = {
        projectIds: ["project-1", "project-2"],
      };

      expect(workItemMatchesFilter(workItem, filter)).toBe(true);
    });

    it("Should_ReturnFalse_When_ProjectIdNotInFilter", () => {
      const workItem = createWorkItem({ projectId: "project-3" });
      const filter: WorkItemBoardFilter = {
        projectIds: ["project-1", "project-2"],
      };

      expect(workItemMatchesFilter(workItem, filter)).toBe(false);
    });

    it("Should_ReturnTrue_When_ProjectIdsFilterIsEmpty", () => {
      const workItem = createWorkItem({ projectId: "project-1" });
      const filter: WorkItemBoardFilter = { projectIds: [] };

      expect(workItemMatchesFilter(workItem, filter)).toBe(true);
    });
  });

  describe("priority filter", () => {
    it("Should_ReturnTrue_When_PriorityMatches", () => {
      const workItem = createWorkItem({
        workItemPriority: WorkItemPriority.HIGH,
      });
      const filter: WorkItemBoardFilter = {
        workItemPriority: WorkItemPriority.HIGH,
      };

      expect(workItemMatchesFilter(workItem, filter)).toBe(true);
    });

    it("Should_ReturnFalse_When_PriorityDoesNotMatch", () => {
      const workItem = createWorkItem({
        workItemPriority: WorkItemPriority.LOW,
      });
      const filter: WorkItemBoardFilter = {
        workItemPriority: WorkItemPriority.HIGH,
      };

      expect(workItemMatchesFilter(workItem, filter)).toBe(false);
    });
  });

  describe("categories filter", () => {
    it("Should_ReturnTrue_When_CategoryInFilter", () => {
      const workItem = createWorkItem({ workItemCategory: "TASK" });
      const filter: WorkItemBoardFilter = {
        workItemCategories: ["TASK", "BUG"],
      };

      expect(workItemMatchesFilter(workItem, filter)).toBe(true);
    });

    it("Should_ReturnFalse_When_CategoryNotInFilter", () => {
      const workItem = createWorkItem({ workItemCategory: "FEATURE" });
      const filter: WorkItemBoardFilter = {
        workItemCategories: ["TASK", "BUG"],
      };

      expect(workItemMatchesFilter(workItem, filter)).toBe(false);
    });
  });

  describe("assignees filter", () => {
    it("Should_ReturnTrue_When_AssigneeInFilter", () => {
      const workItem = createWorkItem({ assignee: "user1" });
      const filter: WorkItemBoardFilter = { assignees: ["user1", "user2"] };

      expect(workItemMatchesFilter(workItem, filter)).toBe(true);
    });

    it("Should_ReturnFalse_When_AssigneeNotInFilter", () => {
      const workItem = createWorkItem({ assignee: "user3" });
      const filter: WorkItemBoardFilter = { assignees: ["user1", "user2"] };

      expect(workItemMatchesFilter(workItem, filter)).toBe(false);
    });

    it("Should_ReturnTrue_When_AssigneesFilterIsEmpty", () => {
      const workItem = createWorkItem({ assignee: "user1" });
      const filter: WorkItemBoardFilter = { assignees: [] };

      expect(workItemMatchesFilter(workItem, filter)).toBe(true);
    });
    it("Should_ReturnFalse_When_AssigneeIsUndefinedAndFilterHasAssignees", () => {
      const workItem = createWorkItem({ assignee: undefined });
      const filter: WorkItemBoardFilter = { assignees: ["user1", "user2"] };

      expect(workItemMatchesFilter(workItem, filter)).toBe(false);
    });
  });

  describe("object IDs filter", () => {
    it("Should_ReturnTrue_When_ObjectIdInFilter", () => {
      const workItem = createWorkItem({ objectId: "OBJ-1" });
      const filter: WorkItemBoardFilter = { objectIds: ["OBJ-1", "OBJ-2"] };

      expect(workItemMatchesFilter(workItem, filter)).toBe(true);
    });

    it("Should_ReturnFalse_When_ObjectIdNotInFilter", () => {
      const workItem = createWorkItem({ objectId: "OBJ-3" });
      const filter: WorkItemBoardFilter = { objectIds: ["OBJ-1", "OBJ-2"] };

      expect(workItemMatchesFilter(workItem, filter)).toBe(false);
    });
    it("Should_ReturnFalse_When_ObjectIdIsUndefinedAndFilterHasObjectIds", () => {
      const workItem = createWorkItem({ objectId: undefined });
      const filter: WorkItemBoardFilter = { objectIds: ["OBJ-1", "OBJ-2"] };

      expect(workItemMatchesFilter(workItem, filter)).toBe(false);
    });
  });

  describe("date range filter", () => {
    it("Should_ReturnTrue_When_DueDateWithinRange", () => {
      const workItem = createWorkItem({ dueDate: new Date("2026-06-15") });
      const filter: WorkItemBoardFilter = {
        dueDateFrom: "2026-06-01T00:00:00.000Z",
        dueDateTo: "2026-06-30T23:59:59.999Z",
      };

      expect(workItemMatchesFilter(workItem, filter)).toBe(true);
    });

    it("Should_ReturnFalse_When_DueDateBeforeRange", () => {
      const workItem = createWorkItem({ dueDate: new Date("2026-05-15") });
      const filter: WorkItemBoardFilter = {
        dueDateFrom: "2026-06-01T00:00:00.000Z",
        dueDateTo: "2026-06-30T23:59:59.999Z",
      };

      expect(workItemMatchesFilter(workItem, filter)).toBe(false);
    });

    it("Should_ReturnFalse_When_DueDateAfterRange", () => {
      const workItem = createWorkItem({ dueDate: new Date("2026-07-15") });
      const filter: WorkItemBoardFilter = {
        dueDateFrom: "2026-06-01T00:00:00.000Z",
        dueDateTo: "2026-06-30T23:59:59.999Z",
      };

      expect(workItemMatchesFilter(workItem, filter)).toBe(false);
    });

    it("Should_ReturnFalse_When_DueDateIsNullAndFilterHasDateRange", () => {
      const workItem = createWorkItem({ dueDate: undefined });
      const filter: WorkItemBoardFilter = {
        dueDateFrom: "2026-06-01T00:00:00.000Z",
      };

      expect(workItemMatchesFilter(workItem, filter)).toBe(false);
    });

    it("Should_ReturnTrue_When_NoDateRangeFilter", () => {
      const workItem = createWorkItem({ dueDate: undefined });
      const filter: WorkItemBoardFilter = {};

      expect(workItemMatchesFilter(workItem, filter)).toBe(true);
    });
  });

  describe("multiple filters", () => {
    it("Should_ReturnTrue_When_AllFiltersMatch", () => {
      const workItem = createWorkItem({
        projectId: "project-1",
        workItemPriority: WorkItemPriority.HIGH,
        assignee: "user1",
        workItemCategory: "TASK",
      });
      const filter: WorkItemBoardFilter = {
        projectIds: ["project-1"],
        workItemPriority: WorkItemPriority.HIGH,
        assignees: ["user1"],
        workItemCategories: ["TASK"],
      };

      expect(workItemMatchesFilter(workItem, filter)).toBe(true);
    });

    it("Should_ReturnFalse_When_OneFilterDoesNotMatch", () => {
      const workItem = createWorkItem({
        projectId: "project-1",
        workItemPriority: WorkItemPriority.LOW,
        assignee: "user1",
      });
      const filter: WorkItemBoardFilter = {
        projectIds: ["project-1"],
        workItemPriority: WorkItemPriority.HIGH,
        assignees: ["user1"],
      };

      expect(workItemMatchesFilter(workItem, filter)).toBe(false);
    });
  });
});
