import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { CiProcessExecutionsTableComponent } from "./ci-process-executions-table.component";
import {
  BusinessProcessDefinitionToFilterListModule,
  BusinessProcessExecutionStatusComponent,
  BusinessProcessNameToFilterListPipe,
  BusinessProcessUriFactoryPipeModule,
  MyExecutionsToggleComponent,
} from "@mxflow/features/business-process";
import { DaysCountPipe, DurationPipeModule } from "@mxflow/pipe";
import { TableDateFilterComponent } from "@mxflow/ui/inputs";
import { RouterModule } from "@angular/router";
import { TableModule } from "primeng/table";
import { PaginatorModule } from "primeng/paginator";
import { MultiSelectModule } from "primeng/multiselect";
import { DatePicker } from "primeng/datepicker";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import {
  TableCheckboxFilterComponent,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { CheckboxModule } from "primeng/checkbox";
import { DividerModule } from "primeng/divider";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { JiraUserStories } from "../../common/jira-user-stories.component";
import { IssueTrackingService } from "@mxflow/features/project";

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    DurationPipeModule,
    BusinessProcessUriFactoryPipeModule,
    BusinessProcessDefinitionToFilterListModule,
    TableModule,
    PaginatorModule,
    MultiSelectModule,
    DatePicker,
    TableDateFilterComponent,
    SkeletonModule,
    TooltipModule,
    BusinessProcessExecutionStatusComponent,
    TableEmptyMessageComponent,
    CheckboxModule,
    DividerModule,
    TableCheckboxFilterComponent,
    BusinessProcessNameToFilterListPipe,
    DatePipe,
    DaysCountPipe,
    MyExecutionsToggleComponent,
    HeaderTitleModule,
    JiraUserStories,
  ],
  declarations: [CiProcessExecutionsTableComponent],
  exports: [CiProcessExecutionsTableComponent],
  providers: [IssueTrackingService],
})
export class CiProcessExecutionsTableModule {}
