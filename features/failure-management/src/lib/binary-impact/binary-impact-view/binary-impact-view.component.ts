import { Component, inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { Store } from "@ngrx/store";
import { finalize, Subject, takeUntil } from "rxjs";
import {
  BinaryImpactDetailsComponent,
  EditBinaryImpactModalComponent,
} from "@mxflow/features/failure-management";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ProjectSpecificAnalysisObjectLinksTableComponent } from "@mxflow/features/failure-management-dashboard";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { StreamsService } from "@mxflow/features/streams";
import { UpgradeImpactSelectionModalComponent } from "../../upgrade-impact";
import { BinaryImpactService } from "../binary-impact.service";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/data-access";

@Component({
  selector: "mxevolve-binary-impact-view",
  templateUrl: "./binary-impact-view.component.html",
  imports: [
    CardContainerModule,
    HeaderTitleModule,
    ButtonModule,
    BinaryImpactDetailsComponent,
    ProjectSpecificAnalysisObjectLinksTableComponent,
    EditBinaryImpactModalComponent,
    DividerModule,
    UpgradeImpactSelectionModalComponent,
  ],
  providers: [StreamsService, BinaryImpactService],
})
export class BinaryImpactViewComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly binaryImpactService = inject(BinaryImpactService);
  private readonly testManagementAnalyticsTrackerService = inject(
    TestManagementAnalyticsTrackerService
  );

  protected readonly AnalysisObjectType = AnalysisObjectType;
  projectId: string;
  projectName: string;
  binaryImpactId: string;
  isEditModalVisible: boolean;
  isUpgradeImpactSelectionModalVisible: boolean;
  warningMessage?: string;
  upgradeImpactId?: string;
  overrideBinaryImpactDescription?: boolean;
  private readonly destroy$ = new Subject();

  @ViewChild(BinaryImpactDetailsComponent)
  detailsComponent: BinaryImpactDetailsComponent;

  ngOnInit(): void {
    this.getProjectDetails();
    this.getBinaryImpactIdFromRoute();
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  handleError($event: string) {
    this.toastMessageService.showError($event);
  }

  handleEdit() {
    this.resetUpgradeImpact();
    this.isEditModalVisible = true;
  }

  handleEditUpgradeImpact() {
    this.testManagementAnalyticsTrackerService.trackEditUpgradeImpact();
    this.isUpgradeImpactSelectionModalVisible = true;
  }

  handleOverrideBinaryImpactDescriptionSelection(override: boolean) {
    this.overrideBinaryImpactDescription = override;
  }

  handleUpgradeImpactSelected(upgradeImpactId?: string) {
    this.isUpgradeImpactSelectionModalVisible = false;
    if (!upgradeImpactId) {
      this.resetUpgradeImpact();
      return;
    }
    this.upgradeImpactId = upgradeImpactId;
    if (this.overrideBinaryImpactDescription !== undefined) {
      this.testManagementAnalyticsTrackerService.trackSubmitSelectedUpgradeImpact();
      this.updateUpgradeImpact(
        upgradeImpactId,
        this.overrideBinaryImpactDescription
      );
    }
  }

  private updateUpgradeImpact(
    upgradeImpactId: string,
    overrideFromUpgradeImpact: boolean
  ) {
    this.binaryImpactService
      .updateUpgradeImpact({
        projectId: this.projectId,
        binaryImpactId: this.binaryImpactId,
        upgradeImpactId,
        overrideFromUpgradeImpact,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isEditModalVisible = false;
          this.resetUpgradeImpact();
        })
      )
      .subscribe({
        next: () => {
          this.detailsComponent.ngOnInit();
        },
        error: (error) => {
          this.toastMessageService.showError(error.message);
          this.isUpgradeImpactSelectionModalVisible = true;
        },
      });
  }

  handleCloseModalEvent() {
    this.isEditModalVisible = false;
    this.resetUpgradeImpact();
  }

  handleBinaryImpactEdited() {
    this.detailsComponent.ngOnInit();
  }

  private resetUpgradeImpact() {
    this.upgradeImpactId = undefined;
    this.overrideBinaryImpactDescription = undefined;
  }

  private getProjectDetails() {
    this.store
      .select(GlobalSelectors.getProject)
      .pipe(takeUntil(this.destroy$))
      .subscribe((project) => {
        this.projectId = project.id;
        this.projectName = project.name;
      });
  }

  private getBinaryImpactIdFromRoute() {
    return this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.binaryImpactId = params["binary-impact-id"];
      });
  }
}
