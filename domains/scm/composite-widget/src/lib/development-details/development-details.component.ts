import { Component, input, output } from "@angular/core";
import {
  Development,
  MergeRequestOverview,
} from "@mxevolve/domains/scm/data-access";
import {
  BranchDetailsCardComponent,
  MergeRequestCommitsComponent,
} from "@mxevolve/domains/scm/widget";

@Component({
  selector: "mxevolve-development-details-widget",
  standalone: true,
  imports: [BranchDetailsCardComponent, MergeRequestCommitsComponent],
  templateUrl: "./development-details.component.html",
})
export class DevelopmentDetailsComponent {
  readonly development = input.required<Development>();
  readonly mergeRequest = input<MergeRequestOverview | undefined>();
  readonly errorOccurred = output<string>();
}
