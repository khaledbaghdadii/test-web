import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BusinessProcessDefinitionToFilterListPipe } from "./business-process-definition-to-filter-list.pipe";

@NgModule({
  declarations: [BusinessProcessDefinitionToFilterListPipe],
  imports: [CommonModule],
  exports: [BusinessProcessDefinitionToFilterListPipe],
})
export class BusinessProcessDefinitionToFilterListModule {}
