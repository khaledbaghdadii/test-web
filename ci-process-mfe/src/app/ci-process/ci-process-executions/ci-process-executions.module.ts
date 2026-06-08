import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CiProcessExecutionsComponent } from "./ci-process-executions.component";
import { RouterModule } from "@angular/router";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { CardContainerModule } from "@mxflow/ui/container";
import { CiProcessExecutionsTableModule } from "./ci-process-executions-table/ci-process-executions-table.module";
import { CiProcessExecutionsService } from "./ci-process-executions.service";
import {
  BusinessProcessDefinitionFilterResolverService,
  BusinessProcessDefinitionService,
  SourceDefinitionsFetcherService,
} from "@mxflow/features/business-process";
import { TableModule } from "primeng/table";

@NgModule({
  imports: [
    CommonModule,
    CardContainerModule,
    HeaderTitleModule,
    CiProcessExecutionsTableModule,
    RouterModule.forChild([
      { path: "", component: CiProcessExecutionsComponent },
    ]),
    TableModule,
  ],
  declarations: [CiProcessExecutionsComponent],
  providers: [
    CiProcessExecutionsService,
    BusinessProcessDefinitionService,
    SourceDefinitionsFetcherService,
    BusinessProcessDefinitionFilterResolverService,
  ],
})
export class CiProcessExecutionsModule {}
