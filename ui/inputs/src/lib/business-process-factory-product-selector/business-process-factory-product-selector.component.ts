import { Component, Input } from "@angular/core";
import { FeaturesArtifactManagerModule } from "@mxflow/features/artifact-manager";
import { FormControl } from "@angular/forms";

export interface BusinessProcessFactoryProductInput {
  id?: string;
  mxVersion?: string;
  mxBuildId?: string;
  bipVersion?: string;
  bipBuildId?: string;
}

@Component({
  selector: "mxevolve-business-process-factory-product-selector",
  templateUrl: "./business-process-factory-product-selector.component.html",
  imports: [FeaturesArtifactManagerModule],
})
export class BusinessProcessFactoryProductSelectorComponent {
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) factoryProductFormControlName: string;
  @Input({ required: true }) factoryProductFormControl: FormControl<
    BusinessProcessFactoryProductInput | undefined
  >;
  @Input({ required: true }) isRequired: boolean;

  onFactoryProductIdChange(newFactoryProductId: string | undefined) {
    this.factoryProductFormControl.setValue({
      ...this.factoryProductFormControl.value,
      id: newFactoryProductId,
    });
    this.factoryProductFormControl.markAsDirty();
  }

  onMxVersionChange(newMxVersion: string | undefined) {
    this.factoryProductFormControl.setValue({
      ...this.factoryProductFormControl.value,
      mxVersion: newMxVersion,
    });
    this.factoryProductFormControl.markAsDirty();
  }

  onMxBuildIdChange(newMxBuildId: string | undefined) {
    this.factoryProductFormControl.setValue({
      ...this.factoryProductFormControl.value,
      mxBuildId: newMxBuildId,
    });
    this.factoryProductFormControl.markAsDirty();
  }

  onBipVersionChange(newBipVersion: string | undefined) {
    this.factoryProductFormControl.setValue({
      ...this.factoryProductFormControl.value,
      bipVersion: newBipVersion,
    });
    this.factoryProductFormControl.markAsDirty();
  }

  onBipBuildIdChange(newBipBuildId: string | undefined) {
    this.factoryProductFormControl.setValue({
      ...this.factoryProductFormControl.value,
      bipBuildId: newBipBuildId,
    });
    this.factoryProductFormControl.markAsDirty();
  }
}
