import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TooltipOptions } from "primeng/api";
import { ToggleSwitch } from "primeng/toggleswitch";
import { KeptExecutionDisabledPipe } from "../scenario-execution-details/kept-execution-disabled/kept-execution-disabled.pipe";
import { Tooltip } from "primeng/tooltip";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";

@Component({
  selector: "mxevolve-kept-execution-toggle",
  templateUrl: "./kept-execution-toggle.component.html",
  imports: [FormsModule, ToggleSwitch, KeptExecutionDisabledPipe, Tooltip],
})
export class KeptExecutionToggleComponent {
  private readonly analyticsService = inject(
    TestManagementAnalyticsTrackerService
  );
  @Input({ required: true }) keptExecution: boolean;
  @Input({ required: true }) cleaningStatus: string;
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

  @Output() keptExecutionToggled = new EventEmitter<void>();

  onToggle() {
    this.keptExecutionToggled.emit();
    this.analyticsService.trackKeepExecutionToggle(!this.keptExecution);
  }
}
