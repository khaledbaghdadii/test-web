import { Component, inject, Input, OnInit, ViewChild } from "@angular/core";
import { ButtonModule } from "primeng/button";
import {
  ScenarioExecutionGroupActionPermissionApiModel,
  ScenarioExecutionRepushFromFinalProductModalComponent,
  ScenarioExecutionService,
  TestUnitModel,
} from "@mxflow/test-management/execution";
import { Tooltip } from "primeng/tooltip";
import { Menu, MenuModule } from "primeng/menu";
import { MenuItem } from "primeng/api";
import { ScenarioExecutionRepushModalModule } from "../unofficial-repush-modal/scenario-execution-repush-modal.module";
import { ScenarioExecutionRepushModalComponent } from "../unofficial-repush-modal/scenario-execution-repush-modal.component";
import { RepushTooltipEvaluatorPipe } from "../repush-evaluator-pipe/repush-tooltip-evaluator.pipe";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";

@Component({
  selector: "mxevolve-repush-scenario-execution-button",
  templateUrl: "./repush-scenario-execution-button.component.html",
  imports: [
    ButtonModule,
    ScenarioExecutionRepushFromFinalProductModalComponent,
    ScenarioExecutionRepushModalModule,
    Tooltip,
    MenuModule,
    RepushTooltipEvaluatorPipe,
  ],
  providers: [ScenarioExecutionService],
})
export class RepushScenarioExecutionButtonComponent implements OnInit {
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) testUnit: TestUnitModel;
  @Input() warningMessageMap?: { [key: string]: string };
  @Input() allowOfficialRepush: boolean;
  @Input() initialFinalProductId: string;
  @Input() enableKeepServices?: boolean;
  scenarioExecutionService: ScenarioExecutionService = inject(
    ScenarioExecutionService
  );
  private readonly analyticsTrackerService = inject(
    TestManagementAnalyticsTrackerService
  );
  @ViewChild(ScenarioExecutionRepushModalComponent)
  repushFromFactoryProductModal: ScenarioExecutionRepushModalComponent;
  @ViewChild(ScenarioExecutionRepushFromFinalProductModalComponent)
  repushFromFinalProductModalComponent: ScenarioExecutionRepushFromFinalProductModalComponent;
  executionGroupScenarioRepushEligibility: Map<
    string,
    ScenarioExecutionGroupActionPermissionApiModel
  > = new Map();
  warningMessage: string;
  repushOptions: MenuItem[] = [];

  ngOnInit(): void {
    if (this.testUnit.executionGroupId) {
      this.scenarioExecutionService
        .isRepushAllowed(
          this.projectId,
          this.testUnit.executionGroupId,
          this.testUnit.headScenarioExecution.id
        )
        .subscribe({
          next: (isRepushableVerdict) => {
            this.executionGroupScenarioRepushEligibility.set(
              this.testUnit.headScenarioExecution.id,
              isRepushableVerdict
            );
            if (isRepushableVerdict.warnings[0] && this.warningMessageMap) {
              this.warningMessage =
                this.warningMessageMap[isRepushableVerdict.warnings[0]] ?? "";
            }
          },
        });
    }
  }

  handleRepushClicked($event: Event, menu: Menu) {
    if (this.allowOfficialRepush) {
      this.showRepushOptions($event, menu);
    } else {
      this.repushFromFactoryProduct();
      this.analyticsTrackerService.trackStandardRepush();
    }
  }

  private showRepushOptions($event: Event, menu: Menu) {
    this.setRepushOptions();
    menu.toggle($event);
  }

  private setRepushOptions() {
    this.repushOptions = [
      {
        label: "Official Repush",
        command: () => {
          this.repushFromFinalProduct();
          this.analyticsTrackerService.trackOfficialRepush();
        },
      },
      {
        label: "Unofficial Repush",
        command: () => {
          this.repushFromFactoryProduct();
          this.analyticsTrackerService.trackUnofficialRepush();
        },
      },
    ];
  }

  private repushFromFactoryProduct() {
    const headScenarioExecution = this.testUnit.headScenarioExecution;
    this.repushFromFactoryProductModal.openModal({
      scenarioExecutionId: headScenarioExecution.id,
      factoryProductId: headScenarioExecution.factoryProductId,
      keptExecution: headScenarioExecution.keptExecution,
      executionGroupId: this.testUnit.executionGroupId,
    });
  }

  private repushFromFinalProduct() {
    const headScenarioExecution = this.testUnit.headScenarioExecution;
    this.repushFromFinalProductModalComponent.openModal({
      branch: this.testUnit.branch,
      initialFinalProductId: this.initialFinalProductId,
      keptExecution: headScenarioExecution.keptExecution,
      scenarioExecutionId: headScenarioExecution.id,
      executionGroupId: this.testUnit.executionGroupId,
    });
  }
}
