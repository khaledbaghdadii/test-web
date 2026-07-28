import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StepResultComponent } from "./step-result.component";
import { Panel } from "primeng/panel";

@NgModule({
  imports: [CommonModule, Panel],
  exports: [StepResultComponent],
  declarations: [StepResultComponent],
})
export class StepResultModule {}
