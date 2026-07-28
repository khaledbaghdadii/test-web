import { Component, computed, input, output } from "@angular/core";
import { Divider } from "primeng/divider";
import { EnvironmentStatusDisplayComponent } from "@mxevolve/domains/environment/ui";
import { Environment } from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { EnvironmentCleanButtonComponent } from "../clean-button/clean-button.component";
import { EnvironmentAbortButtonComponent } from "../abort-button/abort-button.component";
import { ServiceActionsButtonComponent } from "../service-actions-button/service-actions-button.component";
import { OpenClientButtonComponent } from "../open-client-button/open-client-button.component";
import { ConnectToDatabaseButtonComponent } from "../connect-to-database-button/connect-to-database-button.component";
import { ConnectApplicativeButtonComponent } from "../connect-applicative-button/connect-applicative-button.component";
import { ConfigureMxTestButtonComponent } from "../configure-mxtest-button/configure-mxtest-button.component";
import { EnvironmentShutdownPolicyToggleComponent } from "../shutdown-policy-toggle/shutdown-policy-toggle.component";
import { Panel } from "primeng/panel";
import { OpenConfigEditorButtonComponent } from "../open-config-editor-button/open-config-editor-button.component";

@Component({
  selector: "mxevolve-environment-details-header",
  standalone: true,
  imports: [
    Divider,
    EnvironmentStatusDisplayComponent,
    EnvironmentCleanButtonComponent,
    EnvironmentAbortButtonComponent,
    ServiceActionsButtonComponent,
    OpenClientButtonComponent,
    ConnectToDatabaseButtonComponent,
    ConnectApplicativeButtonComponent,
    ConfigureMxTestButtonComponent,
    EnvironmentShutdownPolicyToggleComponent,
    Panel,
    OpenConfigEditorButtonComponent,
  ],
  templateUrl: "./environment-details-header.component.html",
})
export class EnvironmentDetailsHeaderComponent {
  readonly environment = input.required<Environment>();
  readonly projectId = input.required<string>();

  readonly changed = output<void>();
  readonly panelError = output<Error>();

  readonly environmentName = computed(
    () => this.environment().environmentDefinition?.name ?? "-"
  );

  readonly disableCompanion = computed(
    () => this.environment().status !== EnvironmentStatus.READY
  );

  handleDatabaseConnectionError(message: string): void {
    this.panelError.emit(new Error(message));
  }

  handleApplicationConnectionError(error: Error): void {
    this.panelError.emit(error);
  }
}
