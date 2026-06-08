import { Component, inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { GlobalSelectors } from "@mxflow/core/global-store";
import {
  ConfigurationImpactDetailsComponent,
  EditConfigurationImpactModalComponent,
} from "@mxflow/features/failure-management";
import { Store } from "@ngrx/store";
import { Subject } from "rxjs";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { ButtonModule } from "primeng/button";
import { ProjectSpecificAnalysisObjectLinksTableComponent } from "@mxflow/features/failure-management-dashboard";
import { DividerModule } from "primeng/divider";
import { ToastMessageService } from "@mxflow/ui/alert";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";
import { StreamsService } from "@mxflow/features/streams";

@Component({
  selector: "mxevolve-configuration-impact-view",
  templateUrl: "./configuration-impact-view.component.html",
  imports: [
    CardContainerModule,
    HeaderTitleModule,
    ButtonModule,
    ConfigurationImpactDetailsComponent,
    ProjectSpecificAnalysisObjectLinksTableComponent,
    EditConfigurationImpactModalComponent,
    DividerModule,
  ],
  providers: [StreamsService],
})
export class ConfigurationImpactViewComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly toastMessageService = inject(ToastMessageService);

  configurationImpactId: string;
  projectId: string;
  projectName: string;
  isEditModalVisible = false;
  private readonly destroy$ = new Subject();
  protected readonly AnalysisObjectType = AnalysisObjectType;

  @ViewChild(ConfigurationImpactDetailsComponent)
  detailsComponent: ConfigurationImpactDetailsComponent;

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.getProjectDetails();
    this.getConfigurationImpactId();
  }

  handleError($event: string) {
    this.toastMessageService.showError($event);
  }

  private getConfigurationImpactId() {
    this.route.params.subscribe((params) => {
      this.configurationImpactId = params["configurationImpactId"];
    });
  }

  private getProjectDetails() {
    this.store.select(GlobalSelectors.getProject).subscribe((project) => {
      this.projectId = project.id;
      this.projectName = project.name;
    });
  }

  handleEdit() {
    this.isEditModalVisible = true;
  }

  handleCloseModalEvent() {
    this.isEditModalVisible = false;
  }

  handleConfigurationImpactEdited() {
    this.detailsComponent.ngOnInit();
  }
}
