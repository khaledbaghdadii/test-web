import { Component, inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { Store } from "@ngrx/store";
import { Subject } from "rxjs";
import {
  ConfigurationRegressionDetailsComponent,
  ConfigurationRegressionService,
  EditConfigurationRegressionModalComponent,
} from "@mxflow/features/failure-management";
import { ProjectSpecificAnalysisObjectLinksTableComponent } from "@mxflow/features/failure-management-dashboard";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { ToastMessageService } from "@mxflow/ui/alert";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { StreamsService } from "@mxflow/features/streams";

@Component({
  selector: "mxevolve-configuration-regression-view",
  templateUrl: "./configuration-regression-view.component.html",
  imports: [
    CardContainerModule,
    HeaderTitleModule,
    ButtonModule,
    ConfigurationRegressionDetailsComponent,
    ProjectSpecificAnalysisObjectLinksTableComponent,
    EditConfigurationRegressionModalComponent,
    DividerModule,
  ],
  providers: [StreamsService, ConfigurationRegressionService],
})
export class ConfigurationRegressionViewComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly toastMessageService = inject(ToastMessageService);

  protected readonly AnalysisObjectType = AnalysisObjectType;
  configurationRegressionId: string;
  projectId: string;
  projectName: string;
  errorMessage = "";
  showEditConfigurationRegressionModal = false;
  @ViewChild("configurationRegressionDetailsComponent")
  configurationRegressionDetailsComponent: ConfigurationRegressionDetailsComponent;

  destroy$ = new Subject();

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.getProjectDetails();
    this.getConfigurationRegressionId();
  }

  handleError($event: string) {
    this.errorMessage = $event;
    this.showError();
  }

  private getConfigurationRegressionId() {
    this.route.params.subscribe((params) => {
      this.configurationRegressionId = params["configuration-regression-id"];
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

  handleEdit() {
    this.showEditConfigurationRegressionModal = true;
  }

  handleCloseModalEvent() {
    this.showEditConfigurationRegressionModal = false;
  }

  handleConfigurationRegressionEdited() {
    this.configurationRegressionDetailsComponent.ngOnInit();
  }
}
