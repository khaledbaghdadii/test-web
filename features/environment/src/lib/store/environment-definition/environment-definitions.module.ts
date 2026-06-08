import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { EnvironmentService } from "@mxflow/features/environment";
import { EnvironmentDefinitionsEffects } from "./environment-definitions.effects";
import { environmentDefinitionsReducer } from "./environment-definitions.reducer";

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(
      "environmentDefinitions",
      environmentDefinitionsReducer
    ),
    EffectsModule.forFeature([EnvironmentDefinitionsEffects]),
  ],
  providers: [EnvironmentService],
})
export class EnvironmentDefinitionsModule {}
