import { ModuleWithProviders, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ScenarioDefinitionService } from "./scenario-definition.service";
import { StreamsService } from "@mxflow/features/streams";

@NgModule({
  imports: [CommonModule],
})
export class ScenarioDefinitionModule {
  static forFeature(): ModuleWithProviders<ScenarioDefinitionModule> {
    return {
      ngModule: ScenarioDefinitionModule,
      providers: [ScenarioDefinitionService, StreamsService],
    };
  }
}
