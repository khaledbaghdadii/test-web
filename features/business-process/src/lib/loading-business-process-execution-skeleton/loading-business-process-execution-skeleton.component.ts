import { Component, Input } from "@angular/core";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { Skeleton } from "primeng/skeleton";
import { StatusBarComponent } from "@mxflow/ui/horizontal-timeline";

@Component({
  selector: "mxevolve-loading-business-process-execution-skeleton",
  imports: [
    CardContainerModule,
    HeaderTitleModule,
    Skeleton,
    StatusBarComponent,
  ],
  templateUrl: "loading-business-process-execution-skeleton.component.html",
})
export class LoadingBusinessProcessExecutionSkeletonComponent {
  @Input() numberOfStages: number;
}
