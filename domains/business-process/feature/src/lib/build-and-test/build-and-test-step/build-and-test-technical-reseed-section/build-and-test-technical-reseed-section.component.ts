import { Component, input, output } from "@angular/core";
import { BusinessProcessContentContainerComponent } from "@mxevolve/domains/business-process/ui";
import { TechnicalReseedSectionComponent } from "@mxevolve/domains/environment/widget";

@Component({
  selector: "mxevolve-build-and-test-technical-reseed-section",
  templateUrl: "./build-and-test-technical-reseed-section.component.html",
  imports: [
    BusinessProcessContentContainerComponent,
    TechnicalReseedSectionComponent,
  ],
  host: {
    style: "display: contents;",
  },
})
export class BuildAndTestTechnicalReseedSectionComponent {
  readonly projectId = input.required<string>();
  readonly executionGroupId = input.required<string>();
  readonly infraGroup = input.required<string>();
  readonly targetBranch = input.required<string>();

  readonly reloadRequested = output<void>();
}
