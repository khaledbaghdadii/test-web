import { Component, computed, inject, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { DrawerModule } from "primeng/drawer";
import { TestCaseExecution } from "../test-case-execution";
import { TableModule } from "primeng/table";
import { SkeletonModule } from "primeng/skeleton";
import { TestUnitAnalysisObjectLink } from "../..";
import {
  AnalysisObjectType,
  AnalysisObjectTypeDisplayPipe,
} from "@mxflow/features/analysis-objects";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution/scenario-execution-details/scenario-execution-state-management.service";
import { ScenarioExecutionNameComponent } from "../../scenario-execution/properties-display/name/scenario-execution-name.component";
import {
  DetectionCategory,
  DetectionType,
  DetectionUriBuilderPipe,
} from "@mxflow/features/failure-management";
import { TooltipModule } from "primeng/tooltip";

interface TestCaseTestUnitLinkTableData {
  projectId: string;
  analysisObjectId: string;
  analysisObjectType: string;
  analysisObjectTitle: string;
  analysisObjectLink: string;
  scenarioExecutionId: string;
}

@Component({
  selector: "mxevolve-test-case-test-unit-links-drawer",
  imports: [
    DrawerModule,
    FormsModule,
    RouterLink,
    TableModule,
    SkeletonModule,
    AnalysisObjectTypeDisplayPipe,
    ScenarioExecutionNameComponent,
    TooltipModule,
  ],
  providers: [DetectionUriBuilderPipe],
  templateUrl: "./test-case-test-unit-links-drawer.component.html",
})
export class TestCaseTestUnitLinksDrawerComponent {
  protected readonly AnalysisObjectType = AnalysisObjectType;
  protected readonly Array = Array;

  private readonly stateService = inject(
    ScenarioExecutionStateManagementService
  );
  private readonly detectionUriBuilder = inject(DetectionUriBuilderPipe);
  private readonly testUnitAnalysisObjectLinksMap =
    this.stateService.testCaseTestUnitAnalysisObjectLinksMap;

  readonly testUnitAnalysisObjectLinksLoading =
    this.stateService.testUnitAnalysisObjectLinksLoading;

  visible = model(false);
  testCaseExecution = input.required<TestCaseExecution | undefined>();

  drawerHeader = computed(() => {
    const testCaseExecution = this.testCaseExecution();
    if (!testCaseExecution) {
      return "Links";
    }
    return (
      testCaseExecution.title +
      " - " +
      testCaseExecution.functionalTestCaseId +
      " Links"
    );
  });

  private readonly testCaseTestUnitLinks = computed<
    TestUnitAnalysisObjectLink[]
  >(() => {
    const testCaseExecution = this.testCaseExecution();
    if (!testCaseExecution) {
      return [];
    }
    return (
      this.testUnitAnalysisObjectLinksMap().get(testCaseExecution.externalId) ||
      []
    );
  });

  testCaseTestUnitLinksTableData = computed<TestCaseTestUnitLinkTableData[]>(
    () => {
      const links = this.testCaseTestUnitLinks();
      return links.map(
        (link) =>
          ({
            projectId: link.projectId,
            analysisObjectId: link.analysisObject.id,
            analysisObjectType: link.analysisObject.type,
            analysisObjectTitle: this.resolveTestUnitAnalysisObjectTitle(link),
            analysisObjectLink: this.resolveTestUnitAnalysisObjectLink(link),
            scenarioExecutionId: link.scenarioExecutionId,
          } as TestCaseTestUnitLinkTableData)
      );
    }
  );

  private resolveTestUnitAnalysisObjectLink(
    link: TestUnitAnalysisObjectLink
  ): string {
    if (link.analysisObject.type === AnalysisObjectType.BINARY_REGRESSION) {
      return this.detectionUriBuilder.transform({
        category: DetectionCategory.Regression,
        type: DetectionType.Binary,
        id: link.analysisObject.id,
      });
    }
    if (link.analysisObject.type === AnalysisObjectType.BINARY_IMPACT) {
      return this.detectionUriBuilder.transform({
        category: DetectionCategory.Impact,
        type: DetectionType.Binary,
        id: link.analysisObject.id,
        projectId: link.projectId,
      });
    }
    if (link.analysisObject.type === AnalysisObjectType.CONFIGURATION_IMPACT) {
      return this.detectionUriBuilder.transform({
        category: DetectionCategory.Impact,
        type: DetectionType.Configuration,
        id: link.analysisObject.id,
        projectId: link.projectId,
      });
    }
    if (
      link.analysisObject.type === AnalysisObjectType.CONFIGURATION_REGRESSION
    ) {
      return this.detectionUriBuilder.transform({
        category: DetectionCategory.Regression,
        type: DetectionType.Configuration,
        id: link.analysisObject.id,
        projectId: link.projectId,
      });
    }
    if (link.analysisObject.type === AnalysisObjectType.INCIDENT) {
      return link.analysisObject.externalLink || "";
    }
    return "";
  }

  private resolveTestUnitAnalysisObjectTitle(
    link: TestUnitAnalysisObjectLink
  ): string {
    const analysisObjectType = link.analysisObject.type;
    return analysisObjectType === AnalysisObjectType.INCIDENT
      ? link.analysisObject.readableId + " - " + link.analysisObject.title
      : link.analysisObject.title;
  }
}
