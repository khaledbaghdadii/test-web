import { Component, inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { Store } from "@ngrx/store";
import { Subject, takeUntil } from "rxjs";
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
  ],
  providers: [StreamsService],
})
export class BinaryImpactViewComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly toastMessageService = inject(ToastMessageService);

  protected readonly AnalysisObjectType = AnalysisObjectType;
  projectId: string;
  projectName: string;
  binaryImpactId: string;
  isEditModalVisible: boolean;
  warningMessage?: string;
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
    this.isEditModalVisible = true;
  }

  handleCloseModalEvent() {
    this.isEditModalVisible = false;
  }

  handleBinaryImpactEdited() {
    this.detailsComponent.ngOnInit();
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
