import { ModuleWithProviders, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ArtifactManagerService } from "./artifact-manager.service";
import { FactoryProductInputComponent } from "./factory-product-input/factory-product-input-component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { SoftwareProductSelectorComponent } from "./software-product-selector/software-product-selector.component";
import { ConfigurationComponentSelectorComponent } from "./configuration-component-selector/configuration-component-selector.component";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { Select, SelectModule } from "primeng/select";

@NgModule({
  imports: [
    CommonModule,
    SelectModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    IconField,
    InputIcon,
    Select,
  ],
  exports: [FactoryProductInputComponent],
  declarations: [
    FactoryProductInputComponent,
    SoftwareProductSelectorComponent,
    ConfigurationComponentSelectorComponent,
  ],
  providers: [ArtifactManagerService],
})
export class FeaturesArtifactManagerModule {
  static forFeature(): ModuleWithProviders<FeaturesArtifactManagerModule> {
    return {
      ngModule: FeaturesArtifactManagerModule,
      providers: [ArtifactManagerService],
    };
  }
}
