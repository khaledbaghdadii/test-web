import { Component, Input } from "@angular/core";
import { BusinessProcessUriFactoryPipeModule } from "@mxflow/features/business-process";
import { RouterLink } from "@angular/router";

@Component({
  selector: "mxevolve-business-process-execution-list",
  templateUrl: "business-process-execution-list.component.html",
  imports: [BusinessProcessUriFactoryPipeModule, RouterLink],
})
export class BusinessProcessExecutionListComponent {
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) businessProcessExecutions: {
    id: string;
    name: string;
  }[];
}
