import { Component, signal } from "@angular/core";
import type { ICellRendererAngularComp } from "ag-grid-angular";
import type { ICellRendererParams } from "ag-grid-community";
import { ButtonModule } from "primeng/button";
import { Popover } from "primeng/popover";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { Environment } from "@mxevolve/domains/environment/data-access";
import { EnvironmentDetailsLinkComponent } from "@mxevolve/domains/environment/ui";
import { OpenClientButtonComponent } from "../../open-client-button/open-client-button.component";
import { ServiceActionsButtonComponent } from "../../service-actions-button/service-actions-button.component";
import { ConnectApplicativeButtonComponent } from "../../connect-applicative-button/connect-applicative-button.component";
import { ConnectToDatabaseButtonComponent } from "../../connect-to-database-button/connect-to-database-button.component";
import { ConfigureMxTestButtonComponent } from "../../configure-mxtest-button/configure-mxtest-button.component";
import { Tooltip } from "primeng/tooltip";

export interface ActionsCellRendererParams extends ICellRendererParams {
  projectId: string;
}

@Component({
  selector: "mxevolve-actions-cell-renderer",
  standalone: true,
  imports: [
    ButtonModule,
    Popover,
    MxevolveIconComponent,
    OpenClientButtonComponent,
    ServiceActionsButtonComponent,
    ConnectApplicativeButtonComponent,
    ConnectToDatabaseButtonComponent,
    ConfigureMxTestButtonComponent,
    EnvironmentDetailsLinkComponent,
    Tooltip,
  ],
  templateUrl: "./actions-cell-renderer.component.html",
})
export class ActionsCellRendererComponent implements ICellRendererAngularComp {
  readonly environment = signal<Environment>(undefined!);
  readonly projectId = signal("");

  agInit(params: ActionsCellRendererParams): void {
    this.environment.set(params.data);
    this.projectId.set(params.projectId);
  }

  refresh(): boolean {
    return false;
  }
}
