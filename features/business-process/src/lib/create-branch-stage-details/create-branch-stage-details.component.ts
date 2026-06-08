import { Component, Input, OnInit } from "@angular/core";
import { Development, ScmManagementService } from "@mxflow/features/scm";
import { catchError, Observable, of } from "rxjs";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "mxflow-create-branch-stage-details",
  templateUrl: "./create-branch-stage-details.component.html",
  styleUrls: ["./create-branch-stage-details.component.scss"],
  standalone: false,
})
export class CreateBranchStageDetailsComponent implements OnInit {
  @Input()
  developmentId: string;
  @Input()
  createBranch: boolean;
  @Input()
  commitIdUponExecution?: string;

  development$: Observable<Development | undefined>;

  constructor(
    private scmService: ScmManagementService,
    private messageService: ToastMessageService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.developmentId) {
      this.development$ = this.scmService
        .getDevelopment(
          this.activatedRoute.snapshot.params["projectId"],
          this.developmentId,
          true
        )
        .pipe(
          catchError((errorMessage) => {
            this.messageService.showError(errorMessage);
            return of(undefined);
          })
        );
    }
  }
}
