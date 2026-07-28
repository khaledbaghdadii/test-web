import { Component, Input, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import {
  DropdownDefaultSelectionMode,
  FinalProduct,
  FinalProductDropdownInputComponent,
  FinalProductDropdownInputLabelMode,
} from "@mxflow/features/artifact-manager";
import { SkeletonModule } from "primeng/skeleton";
import { Select } from "primeng/select";

export interface BusinessProcessFinalProductInput {
  id?: string;
  configurationCommitId?: string;
  rtpCommitId?: string;
}

@Component({
  selector: "mxevolve-business-process-final-product-selector",
  templateUrl: "business-process-final-product-selector.component.html",
  imports: [FinalProductDropdownInputComponent, SkeletonModule, Select],
})
export class BusinessProcessFinalProductSelectorComponent implements OnInit {
  @Input({ required: true }) finalProductSelectionFormControl: FormControl<
    BusinessProcessFinalProductInput | undefined
  >;
  @Input({ required: true }) finalProductSelectionFormControlName: string;
  @Input({ required: true }) projectId: string;
  @Input() originBranchName: string;
  @Input() businessProcessQualityLevel: string;
  @Input() showAsTags: boolean;
  @Input() repositoryId: string;

  customFinalProductId: string;
  dataReady: boolean;
  finalProductDropdownLabelMode: FinalProductDropdownInputLabelMode;

  ngOnInit() {
    this.customFinalProductId =
      this.finalProductSelectionFormControl.defaultValue?.id ?? "";
    this.finalProductDropdownLabelMode = this.showAsTags
      ? FinalProductDropdownInputLabelMode.TAG_COMMIT_ID
      : FinalProductDropdownInputLabelMode.COMMIT_ID;
  }

  handleSelectedFinalProduct(selectedFinalProduct: FinalProduct | undefined) {
    if (selectedFinalProduct) {
      this.finalProductSelectionFormControl.setValue({
        id: selectedFinalProduct.id,
        configurationCommitId: selectedFinalProduct.configurationCommitId,
        rtpCommitId: selectedFinalProduct.rtpProduct
          ? selectedFinalProduct.rtpProduct.rtpCommitId
          : selectedFinalProduct.configurationCommitId,
      } as BusinessProcessFinalProductInput);
    } else {
      this.finalProductSelectionFormControl.setValue(undefined);
    }
  }

  handleDataReadinessChange(isDataReady: boolean) {
    this.dataReady = isDataReady;
  }

  protected readonly DropdownDefaultSelectionMode =
    DropdownDefaultSelectionMode;
}
