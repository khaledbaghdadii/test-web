import { Component, input, output } from "@angular/core";
import { Message } from "primeng/message";
import {
  Development,
  MergeRequestOverview,
} from "@mxevolve/domains/scm/data-access";
import {
  BranchDetailsCardComponent,
  MergeRequestCommitsComponent,
} from "@mxevolve/domains/scm/widget";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-development-details-widget",
  standalone: true,
  imports: [
    BranchDetailsCardComponent,
    MergeRequestCommitsComponent,
    Message,
    MxevolveIconComponent,
  ],
  templateUrl: "./development-details.component.html",
})
export class DevelopmentDetailsComponent {
  readonly development = input.required<Development>();
  readonly mergeRequest = input<MergeRequestOverview | undefined>();
  readonly commitsBehindCount = input<number>(0);
  readonly errorOccurred = output<string>();
}
