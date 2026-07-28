import { inject, Injectable } from "@angular/core";
import {
  ScenarioExecution,
  ScenarioExecutionService,
} from "@mxflow/test-management/execution";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import { map, Observable, of } from "rxjs";
import { CommitTestExecutionRow } from "../commit-test-executions-dialog/commit-test-executions-dialog.component";

@Injectable()
export class TestExecutionsByCommitIdService {
  private readonly scenarioExecutionService = inject(ScenarioExecutionService);

  getExecutionsGroupedByCommitId(
    projectId: string,
    commitIds: string[]
  ): Observable<Record<string, CommitTestExecutionRow[]>> {
    if (commitIds.length === 0) {
      return of({});
    }

    return this.scenarioExecutionService
      .getScenarioExecutions(
        projectId,
        undefined,
        undefined,
        undefined,
        undefined,
        commitIds
      )
      .pipe(
        map((scenarioExecutions) =>
          this.mapExecutionsByCommitId(projectId, scenarioExecutions)
        )
      );
  }

  private mapExecutionsByCommitId(
    projectId: string,
    scenarioExecutions: Pick<
      ScenarioExecution,
      "id" | "commitId" | "name" | "status" | "startDate" | "endDate"
    >[]
  ): Record<string, CommitTestExecutionRow[]> {
    return scenarioExecutions.reduce((acc, execution) => {
      const commitId = execution.commitId;
      if (!commitId) {
        return acc;
      }

      if (!acc[commitId]) {
        acc[commitId] = [];
      }

      acc[commitId].push({
        id: execution.id,
        projectId,
        name: execution.name,
        status: (execution.status as ScenarioRunStatus) ?? ScenarioRunStatus.NA,
        startDate: execution.startDate,
        endDate: execution.endDate,
      });

      acc[commitId].sort((a, b) => {
        if (!a.endDate) return -1;
        if (!b.endDate) return 1;
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      });

      return acc;
    }, {} as Record<string, CommitTestExecutionRow[]>);
  }
}
