import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BusinessProcessExecutionService } from "./business-process-execution.service";

@NgModule({
  imports: [CommonModule],
  providers: [BusinessProcessExecutionService],
})
export class BusinessProcessExecutionServiceModule {}
