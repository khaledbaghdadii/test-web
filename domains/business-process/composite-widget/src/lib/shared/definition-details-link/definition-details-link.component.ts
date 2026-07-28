import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { BusinessProcessDefinition } from "@mxevolve/domains/business-process/data-access";
import { buildDefinitionDetailsPath } from "@mxevolve/domains/business-process/util";

/**
 * Link to a business-process definition's details page, opened in a new tab.
 * Extracted from the Build & Test, Upgrade and Validation templates dialogs to
 * remove markup duplicated across their "Available Templates" tables.
 */
@Component({
  selector: "mxevolve-definition-details-link",
  imports: [RouterLink],
  template: `<a
    class="text-primary font-medium"
    [routerLink]="buildDefinitionDetailsPath(projectId(), definition().id)"
    target="_blank"
    rel="noopener noreferrer"
    >{{ definition().name }}</a
  >`,
})
export class DefinitionDetailsLinkComponent {
  readonly projectId = input.required<string>();
  readonly definition = input.required<BusinessProcessDefinition>();
  protected readonly buildDefinitionDetailsPath = buildDefinitionDetailsPath;
}
