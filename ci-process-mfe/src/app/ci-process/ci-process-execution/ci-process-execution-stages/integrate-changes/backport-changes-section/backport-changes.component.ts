import { Component, Input } from "@angular/core";
import {
  Backport,
  BusinessProcessExecutionStatus,
} from "@mxflow/features/business-process";

@Component({
  selector: "mxflow-backport-changes",
  templateUrl: "backport-changes.component.html",
  standalone: false,
})
export class BackportChangesComponent {
  @Input() backport: Backport;
  @Input() projectId: string;
  @Input() ciProcessExecutionId: string;
  @Input() repositoryId: string;
  @Input() ciProcessStatus: BusinessProcessExecutionStatus;

  shouldShowPublishing(): boolean {
    return (
      !!this.backport.finalProductPublishing &&
      this.backport.willPublishFinalProduct
    );
  }
}
