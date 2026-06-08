import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StoreModule } from "@ngrx/store";
import { EnvironmentsEffects } from "./environments.effects";
import { environmentsReducer } from "./environments.reducer";
import { EffectsModule } from "@ngrx/effects";
import { EnvironmentService } from "../../service/environment.service";

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature("environments", environmentsReducer),
    EffectsModule.forFeature([EnvironmentsEffects]),
  ],
  providers: [EnvironmentService],
})
export class EnvironmentsStoreModule {}
