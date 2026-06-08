import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { Checkbox } from "primeng/checkbox";
import { FormsModule } from "@angular/forms";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";

@Component({
  selector: "mxevolve-keep-services-checkbox",
  imports: [Checkbox, FormsModule],
  templateUrl: "./keep-services-checkbox.component.html",
})
export class KeepServicesCheckboxComponent {
  @Input() keepServices?: boolean = false;
  @Output() keepServicesChange = new EventEmitter<boolean>();

  private readonly analyticsTrackerService = inject(
    TestManagementAnalyticsTrackerService
  );

  onKeepServicesChange(): void {
    if (this.keepServices) {
      this.analyticsTrackerService.trackKeepServicesCheckbox(true);
    }
    this.keepServicesChange.emit(this.keepServices);
  }
}
