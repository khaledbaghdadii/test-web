import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { executionGroupsReducer } from "./execution-groups.reducer";
import { ExecutionGroupsEffects } from "./execution-groups.effects";
import { TechnicalReseedService } from "../../technical-reseed/service/technical-reseed.service";

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature("executionGroups", executionGroupsReducer),
    EffectsModule.forFeature([ExecutionGroupsEffects]),
  ],
  providers: [TechnicalReseedService],
})
export class ExecutionGroupsStoreModule {}
