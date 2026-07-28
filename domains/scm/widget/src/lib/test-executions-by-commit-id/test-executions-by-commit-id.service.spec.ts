import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of } from "rxjs";
import {
  ScenarioExecution,
  ScenarioExecutionService,
} from "@mxflow/test-management/execution";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import { TestExecutionsByCommitIdService } from "@mxevolve/domains/scm/widget";

describe("TestExecutionsByCommitIdService", () => {
  const projectId = "project-id";
  const commitIds = ["commit-a", "commit-b"];

  const mockScenarioExecutionService = {
    getScenarioExecutions: jest.fn(),
  };

  let service: TestExecutionsByCommitIdService;

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        TestExecutionsByCommitIdService,
        {
          provide: ScenarioExecutionService,
          useValue: mockScenarioExecutionService,
        },
      ],
    });

    service = TestBed.inject(TestExecutionsByCommitIdService);
  });

  it("returns grouped executions by commit id sorted by endDate desc and defaults status to NA", async () => {
    mockScenarioExecutionService.getScenarioExecutions.mockReturnValue(
      of([
        {
          id: "exec-1",
          commitId: "commit-a",
          name: "Scenario A",
          status: ScenarioRunStatus.PASSED,
          startDate: "2024-01-15T10:00:00Z",
          endDate: "2024-01-15T12:00:00Z",
        },
        {
          id: "exec-2",
          commitId: "commit-a",
          name: "Scenario B",
          status: undefined,
          startDate: "2024-01-15T09:00:00Z",
          endDate: "2024-01-15T11:00:00Z",
        },
        {
          id: "exec-3",
          commitId: "commit-b",
          name: "Scenario C",
          status: ScenarioRunStatus.FAILED,
          startDate: "2024-01-15T08:00:00Z",
          endDate: "2024-01-15T10:00:00Z",
        },
      ] as Pick<ScenarioExecution, "id" | "commitId" | "name" | "status" | "startDate" | "endDate">[])
    );

    await expect(
      firstValueFrom(
        service.getExecutionsGroupedByCommitId(projectId, commitIds)
      )
    ).resolves.toEqual({
      "commit-a": [
        {
          id: "exec-1",
          projectId,
          name: "Scenario A",
          status: ScenarioRunStatus.PASSED,
          startDate: "2024-01-15T10:00:00Z",
          endDate: "2024-01-15T12:00:00Z",
        },
        {
          id: "exec-2",
          projectId,
          name: "Scenario B",
          status: ScenarioRunStatus.NA,
          startDate: "2024-01-15T09:00:00Z",
          endDate: "2024-01-15T11:00:00Z",
        },
      ],
      "commit-b": [
        {
          id: "exec-3",
          projectId,
          name: "Scenario C",
          status: ScenarioRunStatus.FAILED,
          startDate: "2024-01-15T08:00:00Z",
          endDate: "2024-01-15T10:00:00Z",
        },
      ],
    });

    expect(
      mockScenarioExecutionService.getScenarioExecutions
    ).toHaveBeenCalledWith(
      projectId,
      undefined,
      undefined,
      undefined,
      undefined,
      commitIds
    );
  });

  it("returns an empty map and skips API call when commitIds is empty", async () => {
    await expect(
      firstValueFrom(service.getExecutionsGroupedByCommitId(projectId, []))
    ).resolves.toEqual({});

    expect(
      mockScenarioExecutionService.getScenarioExecutions
    ).not.toHaveBeenCalled();
  });
});
