import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TooltipOptions } from "primeng/api";
import { ToggleSwitch } from "primeng/toggleswitch";
import { KeepExecutionDisabledPipe } from "../scenario-execution-details/keep-execution-disabled/keep-execution-disabled.pipe";
import { Tooltip } from "primeng/tooltip";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/data-access";
import { ScenarioExecutionHousekeepingStatus } from "@mxevolve/domains/test/model";

@Component({
  selector: "mxevolve-keep-execution-toggle",
  templateUrl: "./keep-execution-toggle.component.html",
  imports: [FormsModule, ToggleSwitch, KeepExecutionDisabledPipe, Tooltip],
})
export class KeepExecutionToggleComponent {
  private readonly analyticsService = inject(
    TestManagementAnalyticsTrackerService
  );
  @Input({ required: true }) keepExecution: boolean;
  @Input({ required: true })
  cleaningStatus: ScenarioExecutionHousekeepingStatus;
  @Input({ required: true }) isTestUnitHead: boolean;
  @Input({ required: true }) isFailed: boolean;
  @Input() disableKeepExecution = false;
  @Input() showTooltip: boolean;
  tooltipOptions: TooltipOptions = {
    showDelay: 210,
    positionTop: -9,
    tooltipPosition: "right",
    tooltipLabel: "Toggle on to keep execution",
    tooltipStyleClass: "min-w-max",
  };

  @Output() keepExecutionToggled = new EventEmitter<void>();

  onToggle() {
    this.keepExecutionToggled.emit();
    this.analyticsService.trackKeepExecutionToggle(!this.keepExecution);
  }
}
