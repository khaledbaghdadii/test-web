import { Component, computed, inject, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  AnalysisObjectType,
  AnalysisObjectTypeDisplayPipe,
} from "@mxflow/features/analysis-objects";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/data-access";
import { SelectButtonModule } from "primeng/selectbutton";

@Component({
  selector: "mxevolve-previously-linked-detection-toggle",
  templateUrl: "./previously-linked-detection-toggle.component.html",
  imports: [SelectButtonModule, FormsModule],
  providers: [AnalysisObjectTypeDisplayPipe],
})
export class PreviouslyLinkedDetectionToggleComponent {
  analysisObjectType = input.required<AnalysisObjectType>();

  showPreviouslyLinked = model<boolean>(false);
  private readonly analyticsTrackerService = inject(
    TestManagementAnalyticsTrackerService
  );
  private readonly analysisObjectTypeDisplayPipe = inject(
    AnalysisObjectTypeDisplayPipe
  );

  options = computed(() => [
    { label: `All ${this.displayName()}s`, value: false },
    { label: `Previously linked ${this.displayName()}s`, value: true },
  ]);

  onShowPreviouslyLinkedChange(showPreviouslyLinked: boolean) {
    this.showPreviouslyLinked.set(showPreviouslyLinked);
    if (showPreviouslyLinked) {
      this.analyticsTrackerService.trackPreviouslyLinkedAnalysisObjectToggle(
        this.analysisObjectType()
      );
    }
  }

  private displayName(): string {
    return this.analysisObjectTypeDisplayPipe.transform(
      this.analysisObjectType()
    );
  }
}
