import { Component, input, output } from "@angular/core";
import { Development } from "@mxevolve/domains/scm/data-access";
import { DateFormatPipe } from "@mxevolve/shared/pipe";
import { CommitIdDisplayComponent } from "@mxevolve/shared/ui/primitive";
import { buildBranchUrl } from "./build-branch-url";

@Component({
  selector: "mxevolve-branch-details-card-widget",
  standalone: true,
  imports: [CommitIdDisplayComponent, DateFormatPipe],
  templateUrl: "./branch-details-card.component.html",
})
export class BranchDetailsCardComponent {
  readonly development = input.required<Development>();
  readonly errorOccurred = output<string>();

  protected readonly buildBranchUrl = buildBranchUrl;
}
