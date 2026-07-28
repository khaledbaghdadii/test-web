import { NgModule } from "@angular/core";
import { StageStatusIconSelectorPipe } from "./stage-status-icon-selector.pipe";

@NgModule({
  declarations: [StageStatusIconSelectorPipe],
  exports: [StageStatusIconSelectorPipe],
  providers: [StageStatusIconSelectorPipe],
})
export class StageStatusIconSelectorPipeModule {}
