import { NgModule } from "@angular/core";
import { StageStatusColorSelectorPipe } from "./stage-status-color-selector.pipe";

@NgModule({
  declarations: [StageStatusColorSelectorPipe],
  exports: [StageStatusColorSelectorPipe],
  providers: [StageStatusColorSelectorPipe],
})
export class StageStatusColorSelectorPipeModule {}
