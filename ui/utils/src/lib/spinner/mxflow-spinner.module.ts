import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MxflowSpinnerComponent } from "./mxflow-spinner.component";
import { BlockUIModule } from "primeng/blockui";
import { ProgressSpinnerModule } from "primeng/progressspinner";

@NgModule({
  imports: [CommonModule, BlockUIModule, ProgressSpinnerModule],
  exports: [MxflowSpinnerComponent],
  declarations: [MxflowSpinnerComponent],
})
export class MxflowSpinnerModule {}
