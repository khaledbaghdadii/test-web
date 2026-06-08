import {
  Component,
  computed,
  EventEmitter,
  input,
  Output,
} from "@angular/core";
import { PanelModule } from "primeng/panel";
import { Chip } from "primeng/chip";
import { Divider } from "primeng/divider";
import { AnalysisObjectSelectionType } from "../analysis-object-selection-state/analysis-object-selection-type.enum";
import { Tooltip } from "primeng/tooltip";

@Component({
  imports: [PanelModule, Chip, Divider, Tooltip],
  selector: "mxevolve-selected-analysis-objects-listing",
  templateUrl: "./selected-analysis-objects-listing.component.html",
})
export class SelectedAnalysisObjectsListingComponent {
  selectedAnalysisObjects = input<SelectedAnalysisObject[]>([]);
  fullySelectedAnalysisObjects = computed(() =>
    this.selectedAnalysisObjects().filter(
      (analysisObject: SelectedAnalysisObject) =>
        this.isFullySelected(analysisObject)
    )
  );
  partiallySelectedAnalysisObjects = computed(() =>
    this.selectedAnalysisObjects().filter(
      (analysisObject: SelectedAnalysisObject) =>
        this.isPartiallySelected(analysisObject)
    )
  );
  @Output() analysisObjectRemoved = new EventEmitter<string>();

  private isFullySelected(analysisObject: SelectedAnalysisObject): boolean {
    return analysisObject.selectionType === AnalysisObjectSelectionType.FULL;
  }

  private isPartiallySelected(analysisObject: SelectedAnalysisObject): boolean {
    return analysisObject.selectionType === AnalysisObjectSelectionType.PARTIAL;
  }
}

export interface SelectedAnalysisObject {
  id: string;
  title: string;
  selectionType: AnalysisObjectSelectionType;
  selectionMessage?: string;
}
