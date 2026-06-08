import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
  WritableSignal,
} from "@angular/core";
import {
  catchError,
  combineLatest,
  concatMap,
  forkJoin,
  from,
  map,
  Observable,
  of,
  Subject,
  take,
  tap,
  throwError,
} from "rxjs";
import { ScenarioExecutionService } from "../../scenario-execution/scenario-execution.service";
import {
  ScenarioExecution,
  TestExecution,
} from "../../scenario-execution/scenario-execution";

import { ReportingModule } from "@mxtest/reporting";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { SkeletonModule } from "primeng/skeleton";
import {
  RunCsvAssertionSummary,
  RunCsvTableAssertionSummary,
  RunDetails,
  RunExcelAssertionSummary,
  RunJsonAssertionSummary,
  RunNodeType,
  RunTableAssertionSummary,
  RunTextAssertionSummary,
  RunXmlAssertionSummary,
} from "@mxtest/reporting-data-models";
import {
  AssertionRunNodeTypes,
  DetailsActionItemMetadata,
  NodeDetails,
  OnNodeSelectionChange,
  ReportingTreeNodeData,
  RunNodeTypeDetails,
  RunTreeNodeModel,
  TestCase,
  TreeItemMetadata,
} from "@mxtest/ui-tree";
import {
  AuthorizationService,
  ShowElementIfAuthorizedDirective,
} from "@mxflow/core/auth";
import { UpdateReferenceRepositoryPathMapper } from "../update-reference/update-reference-repository-path-mapper/update-reference-repository-path-mapper/update-reference-repository-path-mapper.service";
import { EnvironmentService } from "@mxflow/features/environment";
import { UpdateReferenceModalComponent } from "../update-reference/update-reference-modal/update-reference-modal.component";
import { RepositoryService } from "@mxflow/features/repository";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution/scenario-execution-details/scenario-execution-state-management.service";
import { TestCaseExecution } from "../../test-case-execution/test-case-execution";
import { TransferToReconModalComponent } from "@mxevolve/domains/test/composite-widget";
import { ReconService } from "@mxevolve/domains/test/data-access";
import { FeatureFlagResolver } from "@mxflow/feature-flags";

@Component({
  selector: "mxevolve-test-execution-web-engine-report",
  templateUrl: "./test-execution-web-engine-report.component.html",
  styleUrls: [],
  imports: [
    ReportingModule,
    CardContainerModule,
    HeaderTitleModule,
    SkeletonModule,
    UpdateReferenceModalComponent,
    ShowElementIfAuthorizedDirective,
    TransferToReconModalComponent,
  ],
  providers: [EnvironmentService, ReconService],
})
export class TestExecutionWebEngineReportComponent
  implements OnInit, OnDestroy
{
  private readonly scenarioExecutionService = inject(ScenarioExecutionService);
  private readonly repositoryService = inject(RepositoryService);
  private readonly reconService = inject(ReconService);
  private readonly featureFlagResolver = inject(FeatureFlagResolver);

  stateService = inject(ScenarioExecutionStateManagementService);
  testCaseExecutions = this.stateService.analyzableTestCaseExecutions;
  validationScope = this.stateService.validationScope;
  validationScopeWarningMessage =
    this.stateService.validationScopeWarningMessage;

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) scenarioExecutionId: string;
  @Input({ required: true }) testExecutionId: string;
  @Output() errorMessage = new EventEmitter<string>();
  private readonly destroy$ = new Subject();

  authorizationService = inject(AuthorizationService);
  environmentService = inject(EnvironmentService);
  toastMessageService = inject(ToastMessageService);
  updateReferenceRepositoryPathMapper = inject(
    UpdateReferenceRepositoryPathMapper
  );

  testDirectory: string;
  testExecution: TestExecution;
  testExecutionEnded = false;
  isLoading: boolean;
  packageId?: string = undefined;
  primaryUrl?: string;
  secondaryUrl?: string;
  archivedReport: RunDetails;
  assertionsThatSupportUpdateReference = [
    RunNodeType.CSV_ASSERTION,
    RunNodeType.CSV_TABLE_ASSERTION,
    RunNodeType.JSON_ASSERTION,
    RunNodeType.XML_ASSERTION,
    RunNodeType.TEXT_ASSERTION,
    RunNodeType.EXCEL_ASSERTION,
  ] as const satisfies RunNodeType[];

  updateReferenceMenuItems: DetailsActionItemMetadata<
    keyof AssertionRunNodeTypes
  >[] = [];

  tableBasedAssertions = [
    RunNodeType.TABLE_ASSERTION,
    RunNodeType.CSV_TABLE_ASSERTION,
    RunNodeType.CSV_ASSERTION,
    RunNodeType.EXCEL_ASSERTION,
  ] as const satisfies RunNodeType[];
  tableBasedAssertionMenuItems: TreeItemMetadata<keyof RunNodeTypeDetails>[] =
    [];
  pathsToBeTransferredToRecon: string[] = [];

  updateReferenceFilePathOnRepo: string;
  updatedReferenceFilePath: string;
  isUpdateReferenceModalVisible = false;
  commitId: string;
  repoId: string;
  testCaseExecution: TestCaseExecution | undefined;
  protected isTransferToReconModalVisible: WritableSignal<boolean> =
    signal(false);

  ngOnInit(): void {
    this.isLoading = true;
    this.stateService.setCurrentlyViewedTestExecutionId(this.testExecutionId);
    this.scenarioExecutionService
      .getScenarioExecution(this.projectId, this.scenarioExecutionId)
      .pipe(
        concatMap((scenarioExecution) => {
          return forkJoin([
            of(scenarioExecution),
            this.environmentService.getEnvironmentExecutionById(
              this.projectId,
              scenarioExecution.environmentId
            ),
            this.repositoryService.getAllRepositories(this.projectId),
          ]);
        }),
        concatMap(([scenarioExecution, environment, repositories]) => {
          this.testDirectory = environment.tests[0].directory;
          this.repoId = repositories[0].id;
          return this.resolveReportParamsForRequestedTestExecution(
            scenarioExecution
          );
        })
      )
      .subscribe({
        next: (archivedReport) => {
          this.setArchivedReport(archivedReport);
        },
        error: (err) => {
          this.errorMessage.emit(err.message);
        },
      })
      .add(() => {
        this.isLoading = false;
      });
    this.stateService.setWebReportCurrentlyViewedTestCaseExecution(undefined);
  }

  addMenuItems(scenarioExecution: ScenarioExecution): Observable<void> {
    const updateReferenceMenuItems$ =
      this.initializeUpdateReferenceMenuItems(scenarioExecution);
    const transferToReconMenuItems$ =
      this.initializeTransferToReconMenuItems(scenarioExecution);

    return combineLatest([
      updateReferenceMenuItems$,
      transferToReconMenuItems$,
    ]).pipe(
      take(1),
      map(() => undefined as void)
    );
  }

  private initializeTransferToReconMenuItems(
    scenarioExecution: ScenarioExecution
  ) {
    if (scenarioExecution.supportReconActivities) {
      return from(
        this.featureFlagResolver.isFeatureEnabled(
          this.projectId,
          "transfer-to-recon"
        )
      ).pipe(
        concatMap((enabled) => {
          if (enabled) {
            return this.authorizationService
              .isAuthorized({
                action: "transfer_to_recon",
                attributes: {},
                package: "test",
                resource: "scenario_execution",
              })
              .pipe(
                tap((isAuthorized) => {
                  if (isAuthorized) {
                    this.addTableAssertionMenuItems(scenarioExecution);
                  }
                })
              );
          }
          return of(undefined);
        }),
        catchError(() => of(undefined))
      );
    }
    return of(undefined);
  }

  private initializeUpdateReferenceMenuItems(
    scenarioExecution: ScenarioExecution
  ) {
    return this.authorizationService
      .isAuthorized({
        action: "trigger",
        attributes: {},
        package: "test",
        resource: "update_reference",
      })
      .pipe(
        tap((isAuthorized) => {
          if (isAuthorized) {
            this.updateReferenceMenuItems =
              this.constructUpdateReferenceMenuItems(scenarioExecution);
          }
        }),
        catchError(() => of(undefined))
      );
  }

  private addTableAssertionMenuItems(scenarioExecution: ScenarioExecution) {
    this.tableBasedAssertionMenuItems = [
      {
        label: "Transfer To Recon",
        nodeTypes: this.tableBasedAssertions,
        enabled: () => !this.launchedHousekeeping(scenarioExecution),
        onClick: (nodes: NodeDetails[]) => {
          this.onTransferToReconClick(nodes);
        },
      },
    ];
  }

  private onTransferToReconClick(nodes: NodeDetails[]) {
    this.pathsToBeTransferredToRecon = nodes
      .flatMap((node) => this.extractComparisonReportPath(node))
      .filter((path): path is string => !!path)
      .map((path) => this.toRelativePath(path));
    if (this.pathsToBeTransferredToRecon.length > 0) {
      this.isTransferToReconModalVisible.set(true);
    } else {
      this.toastMessageService.showWarning(
        "The current node selection does not contain any valid reports. Missing reports may be due to an unsupported MXtest version, an invalid node, or an incomplete configuration."
      );
    }
  }

  private toRelativePath(path: string): string {
    return path.replace(this.testDirectory, "");
  }

  private extractComparisonReportPath(node: NodeDetails) {
    return (
      node.details as
        | RunCsvAssertionSummary
        | RunCsvTableAssertionSummary
        | RunTableAssertionSummary
        | RunExcelAssertionSummary
    ).metadata.exportPath;
  }

  private constructUpdateReferenceMenuItems(
    scenarioExecution: ScenarioExecution
  ) {
    return this.assertionsThatSupportUpdateReference.map((assertionType) => {
      return {
        label: "Update reference",
        nodeType: RunNodeType[assertionType],
        enabled: this.launchedHousekeeping(scenarioExecution)
          ? () => false
          : this.updateReferenceEnabledCallback(),
        onClick: (
          nodeId: string,
          details?: RunNodeTypeDetails[typeof assertionType]
        ) => this.handleClickingUpdateReference(details),
      };
    }) as unknown as DetailsActionItemMetadata<keyof AssertionRunNodeTypes>[];
  }

  private handleClickingUpdateReference(
    details?:
      | RunCsvAssertionSummary
      | RunCsvTableAssertionSummary
      | RunJsonAssertionSummary
      | RunXmlAssertionSummary
      | RunTextAssertionSummary
      | RunExcelAssertionSummary
      | undefined
  ) {
    const expectedFilePath = details?.metadata.expectedFilePath ?? "";
    const reachedFilePath = details?.metadata.reachedFilePath;
    try {
      this.updateReferenceFilePathOnRepo =
        this.updateReferenceRepositoryPathMapper.map({
          pathOnApplicative: expectedFilePath,
          testName: this.testExecution.nameUponExecution,
          testDirectory: this.testDirectory + "/testRunner",
        });
      this.updatedReferenceFilePath = reachedFilePath ?? "";
      if (this.updatedReferenceFilePath) {
        this.isUpdateReferenceModalVisible = true;
      } else {
        this.errorMessage.emit(
          "Cannot update reference if the reached file does not exist."
        );
      }
    } catch (error) {
      this.errorMessage.emit((error as Error).message);
    }
  }

  private updateReferenceEnabledCallback() {
    return (runTreeNode: RunTreeNodeModel) => {
      return runTreeNode.status === "FAILED";
    };
  }

  private setArchivedReport(archivedReport?: RunDetails) {
    if (archivedReport) {
      this.archivedReport = archivedReport;
    }
  }

  private resolveReportParamsForRequestedTestExecution(
    scenarioExecution: ScenarioExecution
  ) {
    this.commitId = scenarioExecution.rtpCommitId ?? "";
    const testExecution = scenarioExecution.testExecutions
      .filter((testExecution) => testExecution.id === this.testExecutionId)
      .pop();
    if (testExecution) {
      this.testExecution = testExecution;
      return this.addMenuItems(scenarioExecution).pipe(
        concatMap(() =>
          this.resolveReportParameters(testExecution, scenarioExecution)
        )
      );
    }
    return throwError(
      () =>
        new Error(
          "The requested test execution does not exist on the provided scenario execution"
        )
    );
  }

  private resolveReportParameters(
    testExecution: TestExecution,
    scenarioExecution: ScenarioExecution
  ) {
    this.packageId = testExecution.nameUponExecution;
    this.testExecutionEnded = testExecution.isExecutionEnded;
    if (testExecution.isExecutionEnded) {
      return this.resolveTestExecutionEndedReportParams(
        scenarioExecution,
        testExecution
      );
    } else {
      return this.resolveInProgressTestExecutionReportParams(testExecution);
    }
  }

  private resolveInProgressTestExecutionReportParams(
    testExecution: TestExecution
  ) {
    this.primaryUrl = testExecution.report.url;

    this.secondaryUrl = undefined;

    if (testExecution.report.completeReportUrl) {
      this.secondaryUrl = testExecution.report.completeReportUrl;
    }

    return this.emptyArchivedReport();
  }

  private emptyArchivedReport() {
    return of(undefined);
  }

  private resolveTestExecutionEndedReportParams(
    scenarioExecution: ScenarioExecution,
    testExecution: TestExecution
  ) {
    if (
      !this.launchedHousekeeping(scenarioExecution) &&
      testExecution.report.completeReportUrl
    ) {
      this.primaryUrl = testExecution.report.completeReportUrl;
    }
    return this.fetchArchivedReport();
  }

  private fetchArchivedReport() {
    return this.scenarioExecutionService.fetchArchivedReport(
      this.projectId,
      this.scenarioExecutionId,
      this.testExecutionId
    );
  }

  private launchedHousekeeping(scenario: ScenarioExecution) {
    return scenario.cleaningStatus !== "NOT_LAUNCHED";
  }

  ngOnDestroy() {
    this.stateService.setWebReportSelectedTestCaseExecutions([]);
    this.stateService.setWebReportCurrentlyViewedTestCaseExecution(undefined);
    this.stateService.setCurrentlyViewedTestExecutionId(undefined);
    this.destroy$.next({});
    this.destroy$.complete();
  }

  onSelectTreeNodeChange(): OnNodeSelectionChange {
    return {
      action: (nodeData: ReportingTreeNodeData) => {
        this.testCaseExecution = undefined;
        if (nodeData.testCases.length > 0) {
          this.testCaseExecution = this.toTestCaseExecution(
            nodeData.testCases[nodeData.testCases.length - 1].uuid
          );
        }
        this.stateService.setWebReportCurrentlyViewedTestCaseExecution(
          this.testCaseExecution
        );
        this.stateService.setWebReportSelectedTestCaseExecutions(
          nodeData.testCases
            .map((testCase: TestCase) => {
              return this.toTestCaseExecution(testCase.uuid);
            })
            .filter(
              (testCaseExecution): testCaseExecution is TestCaseExecution =>
                testCaseExecution !== undefined
            )
        );
      },
    };
  }

  private toTestCaseExecution(externalUuid: string) {
    return this.testCaseExecutions().find(
      (testCaseExecution) =>
        testCaseExecution.externalId === externalUuid &&
        testCaseExecution.testExecutionId === this.testExecutionId
    );
  }

  protected transferToRecon(cycleId: string) {
    this.reconService
      .transferToRecon({
        projectId: this.projectId,
        scenarioExecutionId: this.scenarioExecutionId,
        testExecutionId: this.testExecutionId,
        cycleId,
        folderPaths: this.pathsToBeTransferredToRecon,
      })
      .subscribe({
        next: () =>
          this.toastMessageService.showSuccess(
            "Transfer triggered successfully"
          ),
        error: (err: Error) => this.toastMessageService.showError(err.message),
      });
  }
}
