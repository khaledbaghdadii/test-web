import { Component, Input } from "@angular/core";
import { Backport, CherryPickStatus } from "@mxflow/features/business-process";
import { InfoAlertComponent, WarningAlertModule } from "@mxflow/ui/alert";
import { BackportMergeRequestViewComponent } from "./backport-merge-request/backport-merge-request-view.component";
import { CommonModule } from "@angular/common";
import { ConfirmPopup } from "primeng/confirmpopup";
import { BackportManualCherryPickComponent } from "./backport-manual-chery-pick/backport-manual-cherry-pick.component";

@Component({
  selector: "mxevolve-backport-cherry-pick-and-merge-request-component",
  templateUrl: "backport-cherry-pick-and-merge-request.component.html",
  imports: [
    CommonModule,
    InfoAlertComponent,
    WarningAlertModule,
    BackportMergeRequestViewComponent,
    ConfirmPopup,
    BackportManualCherryPickComponent,
  ],
})
export class BackportCherryPickAndMergeRequestComponent {
  @Input() projectId: string;
  @Input() repositoryId: string;
  @Input() ciProcessExecutionId: string;
  @Input() backport: Backport;

  protected readonly CherryPickStatus = CherryPickStatus;
}
