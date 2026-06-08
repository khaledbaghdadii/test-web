import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { DialogModule } from "primeng/dialog";
import {
  DateDisplayComponent,
  DurationDisplayComponent,
} from "@mxevolve/shared/ui/primitive";
import {
  EnvironmentStatusDisplayComponent,
  EnvironmentDetailsLinkComponent,
} from "@mxevolve/domains/environment/ui";
import { EnvironmentStatusPanelData } from "./environment-status-panel-data";
import { ConfigureMxTestButtonComponent } from "../configure-mxtest-button/configure-mxtest-button.component";
import { ConnectToDatabaseButtonComponent } from "../connect-to-database-button/connect-to-database-button.component";
import { ServiceActionsButtonComponent } from "../service-actions-button/service-actions-button.component";
import { ConnectApplicativeButtonComponent } from "../connect-applicative-button/connect-applicative-button.component";
import { OpenClientButtonComponent } from "../open-client-button/open-client-button.component";
import { OpenConfigEditorButtonComponent } from "../open-config-editor-button/open-config-editor-button.component";
import {
  EnvironmentService,
  ManagementRequestService,
} from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatusPanelFacade } from "./environment-status-panel-facade";
import { Divider } from "primeng/divider";

@Component({
  selector: "mxevolve-environment-status-panel",
  standalone: true,
  imports: [
    Divider,
    DialogModule,
    DateDisplayComponent,
    DurationDisplayComponent,
    EnvironmentStatusDisplayComponent,
    EnvironmentDetailsLinkComponent,
    ConfigureMxTestButtonComponent,
    ConnectToDatabaseButtonComponent,
    ServiceActionsButtonComponent,
    ConnectApplicativeButtonComponent,
    OpenClientButtonComponent,
    OpenConfigEditorButtonComponent,
  ],
  providers: [
    EnvironmentStatusPanelFacade,
    EnvironmentService,
    ManagementRequestService,
  ],
  templateUrl: "./environment-status-panel.component.html",
})
export class EnvironmentStatusPanelComponent {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();
  readonly showOpenConfigEditorAction = input(false);

  private readonly facade = inject(EnvironmentStatusPanelFacade);

  readonly environmentPanelError = output<Error>();

  readonly TERMINATION_MESSAGE_TRUNCATION_LENGTH = 80;

  readonly terminationMessageDialogVisible = signal(false);

  readonly panelData = rxResource<
    EnvironmentStatusPanelData,
    { projectId: string; environmentId: string }
  >({
    params: () => ({
      projectId: this.projectId(),
      environmentId: this.environmentId(),
    }),
    stream: ({ params }) =>
      this.facade.fetchPanelData(params.projectId, params.environmentId),
  });

  readonly truncatedTerminationMessage = computed(() => {
    if (this.panelData.hasValue()) {
      const message = this.panelData.value().terminationMessage;
      if (!message) return null;
      if (message.length <= this.TERMINATION_MESSAGE_TRUNCATION_LENGTH)
        return message;
      return (
        message.substring(0, this.TERMINATION_MESSAGE_TRUNCATION_LENGTH) + "..."
      );
    }
    return undefined;
  });

  readonly isTerminationMessageTruncated = computed(() => {
    if (this.panelData.hasValue()) {
      const message = this.panelData.value().terminationMessage;
      return (
        !!message && message.length > this.TERMINATION_MESSAGE_TRUNCATION_LENGTH
      );
    }
    return false;
  });

  constructor() {
    effect(() => {
      if (this.panelData.status() === "error") {
        this.environmentPanelError.emit(this.panelData.error() as Error);
      }
    });
  }

  showTerminationMessageDialog(): void {
    this.terminationMessageDialogVisible.set(true);
  }

  reloadPanelData(): void {
    this.panelData.reload();
  }

  handleDatabaseConnectionError(message: string): void {
    this.environmentPanelError.emit(new Error(message));
  }

  handleApplicationConnectionError(error: Error): void {
    this.environmentPanelError.emit(error);
  }
}
