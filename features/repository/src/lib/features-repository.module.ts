import { ModuleWithProviders, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RepositoryService } from "./repository.service";

@NgModule({
  imports: [CommonModule],
})
export class FeaturesRepositoryModule {
  static forFeature(): ModuleWithProviders<FeaturesRepositoryModule> {
    return {
      ngModule: FeaturesRepositoryModule,
      providers: [RepositoryService],
    };
  }
}
