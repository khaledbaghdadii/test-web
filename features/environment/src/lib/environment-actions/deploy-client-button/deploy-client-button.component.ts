import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { skipWhile, Subject, takeUntil } from "rxjs";
import { MenuItem } from "primeng/api";
import { EnvironmentClientLauncherService } from "../../service/environment-client-launcher-service";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  Environment,
  EnvironmentAction,
} from "../../service/models/environment.model";
import { Store } from "@ngrx/store";
import { EnvironmentsState } from "../../store/environment/environments.state";
import { selectEnvironment } from "../../store/environment/environments.selectors";

@Component({
  selector: "mxevolve-deploy-client-button",
  templateUrl: "deploy-client-button.component.html",
  standalone: false,
})
export class DeployClientButtonComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();

  @Input() environmentId: string;
  @Input() projectId: string;
  @Input() disabled: boolean;

  private environment: Environment;

  defaultClient: string;
  launchDefaultClient: () => void;
  defaultClientIsDisabled = false;
  launchers: MenuItem[];
  tooltipMessage: string | undefined;

  constructor(
    private messageService: ToastMessageService,
    private clientLauncherService: EnvironmentClientLauncherService,
    private store: Store<EnvironmentsState>
  ) {
    this.disabled = true;
  }

  ngOnInit() {
    this.store
      .select(
        selectEnvironment({
          projectId: this.projectId,
          environmentId: this.environmentId,
        })
      )
      .pipe(
        skipWhile((env) => env === undefined),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (env) => {
          this.environment = {
            ...env,
            environmentActions: [
              ...(env?.environmentActions ?? []),
              EnvironmentAction.CLIENT,
            ],
          } as Environment;

          this.configureDefaultButton();
          this.configureDropdownItems();
          this.configureDropdownTooltip();
        },
      });
  }

  private configureDropdownItems() {
    if (this.secureClientIsSupported()) {
      if (this.environment.secureClientArtifactUri) {
        this.constructSecureClientDropdownItems();
      } else {
        this.launchers = [];
      }
    } else if (this.clientIsSupported() || this.noClientIsSupported()) {
      this.constructRegularClientDropdownItems();
    }
  }

  private constructRegularClientDropdownItems() {
    this.launchers = [
      {
        label: "MX.3 Client",
        tooltipOptions: {
          tooltipLabel: "client.cmd",
          tooltipPosition: "left",
        },
        command: () => this.deployClient("client"),
      },
      {
        label: "Monitor Services",
        tooltipOptions: {
          tooltipLabel: "monit.cmd",
          tooltipPosition: "left",
        },
        command: () => this.deployClient("monit"),
      },
      {
        label: "Rich Client",
        tooltipOptions: {
          tooltipLabel: "richclient.cmd",
          tooltipPosition: "left",
        },
        command: () => this.deployClient("richclient"),
      },
      {
        label: "Browse Client Repo",
        tooltipOptions: {
          tooltipLabel: "Opens client directory",
          tooltipPosition: "left",
        },
        command: () => this.deployClient(""),
      },
    ];
  }

  private constructSecureClientDropdownItems() {
    this.launchers = [
      {
        label: "MX.3 Client TLS",
        tooltipOptions: {
          tooltipLabel: "client_TLS.cmd",
          tooltipPosition: "left",
        },
        command: () => this.deploySecureClient("client_tls"),
      },
      {
        label: "Monitor Services TLS",
        tooltipOptions: {
          tooltipLabel: "monit_TLS.cmd",
          tooltipPosition: "left",
        },
        command: () => this.deploySecureClient("monit_tls"),
      },
      {
        label: "Rich Client TLS",
        tooltipOptions: {
          tooltipLabel: "richclient_TLS.cmd",
          tooltipPosition: "left",
        },
        command: () => this.deploySecureClient("richclient_tls"),
      },
      {
        label: "Browse TLS Client Repo",
        tooltipOptions: {
          tooltipLabel: "Opens client directory",
          tooltipPosition: "left",
        },
        command: () => this.deploySecureClient(""),
      },
    ];
  }

  private configureDefaultButton() {
    if (this.webClientIsSupported()) {
      this.defaultClient = "Open Web Client";
      if (this.environment.webClientUrl) {
        this.launchDefaultClient = () =>
          this.clientLauncherService.launchWebClient(
            this.environment.webClientUrl as string
          );
      } else {
        this.defaultClientIsDisabled = true;
      }
    } else if (this.secureClientIsSupported()) {
      this.defaultClient = "Open MX.3 Client TLS";
      if (this.environment.secureClientArtifactUri) {
        this.launchDefaultClient = () => this.deploySecureClient("client_tls");
      }
    } else {
      this.defaultClient = "Open MX.3 Client";
      this.launchDefaultClient = () => this.deployClient("client");
    }
  }

  private configureDropdownTooltip() {
    if (this.webClientIsSupported()) {
      this.configureDropdownTooltipWhenWebClientIsSupported();
    } else if (
      this.secureClientIsSupported() &&
      !this.environment.secureClientArtifactUri
    ) {
      this.disabled = true;
      this.tooltipMessage = "TLS client is not available";
    }
  }

  private configureDropdownTooltipWhenWebClientIsSupported() {
    if (this.environment.webClientUrl) {
      if (
        this.secureClientIsSupported() &&
        !this.environment.secureClientArtifactUri
      ) {
        this.tooltipMessage = "TLS client is not available";
      }
    } else if (this.secureClientIsSupported()) {
      if (this.environment.secureClientArtifactUri) {
        this.tooltipMessage = "Web client is not available";
      } else {
        this.disabled = true;
        this.tooltipMessage = "Web client and TLS clients are not available";
      }
    } else {
      this.tooltipMessage = "Web client is not available";
      if (!this.clientIsSupported()) {
        this.disabled = true;
      }
    }
  }

  deployClient(launcher: string) {
    this.clientLauncherService
      .launchClient(this.projectId, this.environmentId, launcher)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          if (error.status === 400) {
            const message =
              "The build ID is purged, please make sure to generate new MX.3 setups and to deploy a new environment";
            this.showFailureAlert(message);
            this.disabled = true;
            this.tooltipMessage = message;
          } else {
            this.showFailureAlert(error.error?.message ?? error.message);
          }
        },
      });
  }

  deploySecureClient(launcher: string) {
    this.clientLauncherService.launchSecureClient(
      this.environmentId,
      launcher,
      this.environment.secureClientArtifactUri as string
    );
  }

  private clientIsSupported() {
    return this.environment.environmentActions?.includes(
      EnvironmentAction.CLIENT
    );
  }

  private webClientIsSupported() {
    return this.environment.environmentActions?.includes(
      EnvironmentAction.WEB_CLIENT
    );
  }

  private secureClientIsSupported() {
    return this.environment.environmentActions?.includes(
      EnvironmentAction.SECURE_CLIENT
    );
  }

  private noClientIsSupported() {
    return !(this.clientIsSupported() || this.webClientIsSupported());
  }

  private showFailureAlert(detail: string) {
    this.messageService.showError(detail, "Error while opening client");
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
