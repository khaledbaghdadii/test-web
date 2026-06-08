import {
  Component,
  computed,
  EventEmitter,
  inject,
  input,
  Input,
  Output,
} from "@angular/core";

import { TestCaseExecutionSelectionTableComponent } from "../../test-case-execution/test-case-execution-selection-table/test-case-execution-selection-table.component";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution/scenario-execution-details/scenario-execution-state-management.service";
import { Dialog } from "primeng/dialog";
import { FormsModule } from "@angular/forms";
import {
  AnalysisObjectLink,
  TestCaseExecutionAnalysisObjectLinkModel,
} from "../analysis-object-link";
import { Button } from "primeng/button";
import { PrimeTemplate } from "primeng/api";
import { TestCaseExecution } from "../../test-case-execution/test-case-execution";
import { Checkbox } from "primeng/checkbox";
import { ToastMessageService } from "@mxflow/ui/alert";
import { finalize } from "rxjs";
import { AnalysisObjectLinkUtils } from "../analysis-object-link-utils";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";

@Component({
  selector: "mxevolve-analysis-object-unlink-modal",
  standalone: true,
  imports: [
    TestCaseExecutionSelectionTableComponent,
    Dialog,
    FormsModule,
    Button,
    PrimeTemplate,
    Checkbox,
  ],
  templateUrl: "./analysis-object-unlink-modal.component.html",
})
export class AnalysisObjectUnlinkModalComponent {
  private stateService = inject(ScenarioExecutionStateManagementService);
  private toastMessageService = inject(ToastMessageService);
  private analysisObjectLinkUtils = inject(AnalysisObjectLinkUtils);

  @Input({ required: true }) isVisible = false;
  analysisObjectId = input<string>("");
  analysisObjectType = input<AnalysisObjectType | undefined>(undefined);

  @Output() isVisibleChange = new EventEmitter<boolean>();

  scenarioExecutionLink = computed(() =>
    this.analysisObjectLinkUtils.getAnalysisObjectScenarioExecutionLink(
      this.stateService.analysisObjectLinks(),
      this.analysisObjectId(),
      this.analysisObjectType()
    )
  );

  testCaseExecutionLinks = computed(() =>
    this.analysisObjectLinkUtils.getAnalysisObjectTestCaseExecutionLinks(
      this.stateService.analysisObjectLinks(),
      this.analysisObjectId(),
      this.analysisObjectType()
    )
  );

  testCaseExecutionsLinkedToAnalysisObject = computed(() =>
    this.stateService
      .analyzableTestCaseExecutions()
      .filter((testCaseExecution) =>
        this.testCaseExecutionLinks().some(
          (link) => link.testCaseExecutionId === testCaseExecution.id
        )
      )
  );

  testCaseExecutionsLoading = this.stateService.testCaseExecutionsLoading;

  isLinkedToScenarioExecution = false;
  isScenarioExecutionSelected = true;
  testCaseExecutionLinksToUnlink: AnalysisObjectLink[] = [];
  isUpdatingLinksInProgress = false;

  onOpenModal() {
    this.isScenarioExecutionSelected = true;
    this.isLinkedToScenarioExecution =
      this.isAnalysisObjectLinkedToScenarioExecution();
  }

  onCloseModal() {
    this.resetModal();
  }

  updateAnalysisObjectLinks() {
    this.isUpdatingLinksInProgress = true;
    const linksToRemove: TestCaseExecutionAnalysisObjectLinkModel[] = [];
    const scenarioExecutionLink = this.scenarioExecutionLink();

    if (scenarioExecutionLink && !this.isScenarioExecutionSelected) {
      linksToRemove.push(
        this.toTestCaseExecutionAnalysisObjectLinkModel(scenarioExecutionLink)
      );
    }

    this.testCaseExecutionLinksToUnlink.forEach((link) => {
      linksToRemove.push(this.toTestCaseExecutionAnalysisObjectLinkModel(link));
    });

    if (linksToRemove.length > 0) {
      this.stateService
        .updateAnalysisObjectsLinks({
          linksToAdd: [],
          linksToRemove: linksToRemove,
        })
        .pipe(finalize(() => this.closeModal()))
        .subscribe({
          next: () => {
            this.toastMessageService.showSuccess("Unlinked successfully.");
          },
          error: (error) => {
            this.toastMessageService.showError(error.message);
          },
        });
    }
  }

  onTestCaseExecutionsSelectionChange(
    selectedTestCaseExecutions: TestCaseExecution[]
  ) {
    this.testCaseExecutionLinksToUnlink = this.testCaseExecutionLinks().filter(
      (link) =>
        !selectedTestCaseExecutions.some(
          (testCaseExecution) =>
            testCaseExecution.id === link.testCaseExecutionId
        )
    );
  }

  private closeModal() {
    this.isVisible = false;
    this.isVisibleChange.emit(this.isVisible);

    this.resetModal();
  }

  private resetModal() {
    this.isLinkedToScenarioExecution = false;
    this.isScenarioExecutionSelected = true;
    this.testCaseExecutionLinksToUnlink = [];
    this.isUpdatingLinksInProgress = false;
  }

  private isAnalysisObjectLinkedToScenarioExecution() {
    return !!this.scenarioExecutionLink();
  }

  private toTestCaseExecutionAnalysisObjectLinkModel(
    analysisObjectLink: AnalysisObjectLink
  ): TestCaseExecutionAnalysisObjectLinkModel {
    return {
      testCaseExecutionId: analysisObjectLink.testCaseExecutionId,
      analysisObjectId: analysisObjectLink.analysisObjectId,
      analysisObjectType: analysisObjectLink.analysisObjectType,
    };
  }
}
