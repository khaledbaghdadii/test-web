import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution-state-management.service";
import { FeatureFlagResolver } from "@mxflow/feature-flags";

@Component({
  selector: "app-test-execution-report",
  templateUrl: "./test-execution-report.component.html",
  styleUrls: [],
  standalone: false,
})
export class TestExecutionReportComponent implements OnInit {
  private router = inject(Router);
  private toastMessageService = inject(ToastMessageService);
  private readonly featureFlagResolver = inject(FeatureFlagResolver);

  stateService = inject(ScenarioExecutionStateManagementService);

  projectId: string;
  scenarioExecutionId: string;
  testExecutionId: string;
  transferToReconEnabled: WritableSignal<boolean> = signal(false);

  constructor() {
    const route = inject(ActivatedRoute);

    this.projectId = route.snapshot.paramMap.get("projectId") ?? "";
    this.scenarioExecutionId =
      route.snapshot.paramMap.get("scenario-execution-id") ?? "";
    this.testExecutionId =
      route.snapshot.paramMap.get("test-execution-id") ?? "";
  }

  ngOnInit(): void {
    this.featureFlagResolver
      .isFeatureEnabled(this.projectId, "transfer-to-recon")
      .then((enabled) => this.transferToReconEnabled.set(enabled));
  }

  handleError($event: string) {
    this.toastMessageService.showError($event);
  }

  back() {
    this.navigateWithoutAffectingRouteHistory(
      `/app/${this.projectId}/test/execution/details/${this.scenarioExecutionId}`
    );
  }

  private navigateWithoutAffectingRouteHistory(url: string) {
    this.router.navigate([url], { replaceUrl: true });
  }

  onStatusUpdated(): void {
    this.stateService.getTestCaseExecutions$().subscribe();
    this.stateService.refreshAnalysisObjectLinks$().subscribe();
  }
}
