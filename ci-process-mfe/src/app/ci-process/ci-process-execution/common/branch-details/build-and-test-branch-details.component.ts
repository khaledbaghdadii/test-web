import { Component, inject, Input, OnDestroy, OnInit } from "@angular/core";
import { Observable, Subject, takeUntil } from "rxjs";
import { Store } from "@ngrx/store";
import { getCiProcessExecution } from "../../state/ci-process-execution.selector";
import { CiProcessActions } from "../../../state";
import {
  IssueTrackingService,
  JiraDetailsResponse,
} from "@mxflow/features/project";

@Component({
  selector: "mxevolve-build-and-test-branch-details",
  templateUrl: "build-and-test-branch-details.component.html",
  standalone: false,
})
export class BuildAndTestBranchDetailsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) developmentId: string | undefined;
  ciProcessExecutionId: string;
  userStoryIds: string[];
  repositoryId: string;
  fallbackDevelopmentId: string;
  jiraBaseUrl$: Observable<JiraDetailsResponse>;

  private readonly store = inject(Store);
  private readonly issueTrackingService: IssueTrackingService =
    inject(IssueTrackingService);

  ngOnInit(): void {
    this.store
      .pipe(getCiProcessExecution)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (process) => {
          this.jiraBaseUrl$ = this.issueTrackingService.getJiraDetails(
            this.projectId
          );
          this.ciProcessExecutionId = process.id;
          this.fallbackDevelopmentId = process.createBranchStage.developmentId;
          this.userStoryIds = process.input.userStoryIds;
          this.repositoryId = process.createBranchStage.repositoryId;
        },
        error: (error) => {
          this.store.dispatch(
            CiProcessActions.updateErrorMessage({ message: error })
          );
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
