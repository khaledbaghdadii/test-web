import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { MergeRequestViewComponent } from "./merge-request-component/merge-request-view.component";
import { CiProcessExecutionStateUpdaterService } from "../../../ci-process-execution-details/ci-process-state-updater.service";
import {
  BusinessProcessAnalyticsTrackerService,
  FinalProductPublishing,
} from "@mxflow/features/business-process";
import { MergeRequest } from "@mxflow/features/scm-management";

@Component({
  selector: "mxflow-integrate-changes",
  templateUrl: "integrate-changes.component.html",
  standalone: false,
})
export class IntegrateChangesComponent {
  processExecutionUpdater = inject(CiProcessExecutionStateUpdaterService);
  trackerService = inject(BusinessProcessAnalyticsTrackerService);

  @Input() ciProcessExecutionId: string;
  @Input() projectId: string;
  @Input() developmentId: string;
  @Input() mergeJobId: string;
  @Input() actionsDisabled = false;
  @Input() showDecision = false;
  @Input() requester: string;
  @Input() willPublishFinalProduct: boolean;
  @Input() finalProductPublishing: FinalProductPublishing;
  @Input() mergeRequestDetails: MergeRequest | undefined;

  @Output() fixIssuesEvent = new EventEmitter<void>();

  showModalEventEmitter = new EventEmitter<any>();
  hideModalEventEmitter = new EventEmitter<any>();

  @ViewChild(MergeRequestViewComponent)
  mergeRequestViewComponent: MergeRequestViewComponent;

  fixIssues() {
    this.trackerService.trackCiProcessFixIssues();
    this.fixIssuesEvent.emit();
  }

  mergeRequestCreated() {
    this.processExecutionUpdater.reloadProcessDetails(
      this.ciProcessExecutionId,
      this.projectId
    );
    setTimeout(() => {
      this.mergeRequestViewComponent.initializeMergeRequest(this.mergeJobId);
    }, 1000);
    this.hideModalEventEmitter.emit();
  }

  mergeRequestReopened() {
    this.processExecutionUpdater.reloadProcessDetails(
      this.ciProcessExecutionId,
      this.projectId
    );
  }

  shouldShowPublishing(): boolean {
    return !!this.finalProductPublishing && this.willPublishFinalProduct;
  }
}
