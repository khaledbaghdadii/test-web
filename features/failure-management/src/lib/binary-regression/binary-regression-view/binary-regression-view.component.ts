import { Component, inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Store } from "@ngrx/store";
import { ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs";
import { GlobalSelectors } from "@mxflow/core/global-store";
import {
  BinaryRegressionDetailsComponent,
  EditBinaryRegressionModalComponent,
} from "@mxflow/features/failure-management";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { ButtonModule } from "primeng/button";
import { GlobalAnalysisObjectLinksTableComponent } from "@mxflow/features/failure-management-dashboard";
import { DividerModule } from "primeng/divider";
import { ToastMessageService } from "@mxflow/ui/alert";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { StreamsService } from "@mxflow/features/streams";

@Component({
  selector: "mxevolve-binary-regression-view",
  templateUrl: "./binary-regression-view.component.html",
  imports: [
    CardContainerModule,
    HeaderTitleModule,
    ButtonModule,
    BinaryRegressionDetailsComponent,
    GlobalAnalysisObjectLinksTableComponent,
    EditBinaryRegressionModalComponent,
    DividerModule,
  ],
  providers: [StreamsService],
})
export class BinaryRegressionViewComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly toastMessageService = inject(ToastMessageService);

  binaryRegressionId: string;
  projectId: string;
  projectName: string;
  errorMessage = "";
  isEditModalShown = false;
  @ViewChild(BinaryRegressionDetailsComponent)
  detailsComponent: BinaryRegressionDetailsComponent;

  protected readonly AnalysisObjectType = AnalysisObjectType;
  private readonly destroy$ = new Subject();

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.getProjectDetails();
    this.getBinaryRegressionId();
  }

  handleError($event: string) {
    this.errorMessage = $event;
    this.showError();
  }

  handleEdit() {
    this.isEditModalShown = true;
  }

  handleCloseEditModal() {
    this.isEditModalShown = false;
  }

  handleBinaryRegressionEdited() {
    this.detailsComponent.ngOnInit();
  }

  private getBinaryRegressionId() {
    this.route.params.subscribe((params) => {
      this.binaryRegressionId = params["binary-regression-id"];
    });
  }

  private getProjectDetails() {
    this.store.select(GlobalSelectors.getProject).subscribe((project) => {
      this.projectId = project.id;
      this.projectName = project.name;
    });
  }

  private showError() {
    this.toastMessageService.showError(this.errorMessage);
  }
}
