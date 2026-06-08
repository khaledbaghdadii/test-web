import { ExecutionGroupsState } from "./execution-group.state";
import {
  ExecutionGroup,
  ExecutionGroupStatus,
} from "../../technical-reseed/execution-group-models";
import { selectExecutionGroup } from "./execution-groups.selectors";

const PROJECT_ID = "project-id";
const EXECUTION_GROUP_ID = "execution-group-id";

const baseExecutionGroup: ExecutionGroup = {
  executionGroupId: EXECUTION_GROUP_ID,
  status: ExecutionGroupStatus.ENABLED,
  launchesAllowed: true,
  technicalReseedOperations: [],
};

describe("selectExecutionGroup", () => {
  it("should return execution group data if available", () => {
    const mockState: ExecutionGroupsState = {
      [EXECUTION_GROUP_ID]: {
        data: baseExecutionGroup,
      },
    };
    const selector = selectExecutionGroup({
      projectId: PROJECT_ID,
      executionGroupId: EXECUTION_GROUP_ID,
    });

    expect(selector.projector(mockState)).toEqual(baseExecutionGroup);
  });

  it("should throw an error if execution group has an error", () => {
    const mockState: ExecutionGroupsState = {
      [EXECUTION_GROUP_ID]: {
        error: "Something went wrong",
      },
    };

    const selector = selectExecutionGroup({
      projectId: PROJECT_ID,
      executionGroupId: EXECUTION_GROUP_ID,
    });
    expect(() => selector.projector(mockState)).toThrow("Something went wrong");
  });

  it("should return undefined if execution group is not found", () => {
    const mockState: ExecutionGroupsState = {};

    const selector = selectExecutionGroup({
      projectId: PROJECT_ID,
      executionGroupId: EXECUTION_GROUP_ID,
    });
    expect(selector.projector(mockState)).toBeUndefined();
  });
});
