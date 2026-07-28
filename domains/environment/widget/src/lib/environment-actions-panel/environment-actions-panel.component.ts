import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { ManagementRequest } from "@mxevolve/domains/environment/data-access";
import { EnvironmentActionsTableComponent } from "../environment-actions-table/environment-actions-table.component";
import { Panel } from "primeng/panel";
import { Divider } from "primeng/divider";

@Component({
  selector: "mxevolve-environment-actions-panel",
  standalone: true,
  imports: [EnvironmentActionsTableComponent, Panel, Divider],
  templateUrl: "./environment-actions-panel.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnvironmentActionsPanelComponent {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();
  readonly requests = input.required<ManagementRequest[]>();
}
