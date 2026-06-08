import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { HttpErrorResponse } from "@angular/common/http";
import { MenuItem } from "primeng/api";
import { TooltipModule } from "primeng/tooltip";
import { ButtonModule } from "primeng/button";
import { TieredMenu } from "primeng/tieredmenu";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  EnvironmentAction,
  EnvironmentStatus,
} from "@mxevolve/domains/environment/util";
import { EnvironmentService } from "@mxevolve/domains/environment/data-access";
import { MxenvCompanionService } from "./mxenv-companion.service";

@Component({
  selector: "mxevolve-open-client-button",
  standalone: true,
  imports: [ButtonModule, TieredMenu, MxevolveIconComponent, TooltipModule],
  providers: [MxenvCompanionService],
  templateUrl: "./open-client-button.component.html",
})
export class OpenClientButtonComponent {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();
  readonly status = input.required<EnvironmentStatus>();
  readonly environmentActions = input<string[]>([]);
  readonly webClientUrl = input<string | undefined>(undefined);
  readonly secureClientArtifactUri = input<string | undefined>(undefined);
  readonly iconOnly = input(false);

  private readonly companionService = inject(MxenvCompanionService);
  private readonly environmentService = inject(EnvironmentService);
  private readonly toastService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isPurgedBuild = signal(false);
  readonly purgedBuildTooltip = signal("");

  readonly effectiveActions = computed(() => [
    ...(this.environmentActions() ?? []),
    EnvironmentAction.CLIENT,
  ]);

  readonly hasWebClient = computed(() =>
    this.effectiveActions().includes(EnvironmentAction.WEB_CLIENT)
  );

  readonly hasSecureClient = computed(() =>
    this.effectiveActions().includes(EnvironmentAction.SECURE_CLIENT)
  );

  readonly defaultClientType = computed<"web" | "secure" | "regular">(() => {
    if (this.hasWebClient()) return "web";
    if (this.hasSecureClient()) return "secure";
    return "regular";
  });

  readonly label = computed(() => {
    switch (this.defaultClientType()) {
      case "web":
        return "Open Web Client";
      case "secure":
        return "Open MX.3 Client TLS";
      case "regular":
        return "Open MX.3 Client";
    }
  });

  readonly disabled = computed(() => {
    if (this.status() !== EnvironmentStatus.READY) return true;
    if (this.isPurgedBuild()) return true;
    if (
      this.hasSecureClient() &&
      !this.secureClientArtifactUri() &&
      (!this.hasWebClient() || !this.webClientUrl())
    )
      return true;
    return false;
  });

  readonly tooltip = computed(() => {
    if (this.isPurgedBuild()) return this.purgedBuildTooltip();
    const webMissing = this.hasWebClient() && !this.webClientUrl();
    const tlsMissing =
      this.hasSecureClient() && !this.secureClientArtifactUri();
    if (webMissing && tlsMissing)
      return "Web client and TLS clients are not available";
    if (webMissing) return "Web client is not available";
    if (tlsMissing) return "TLS client is not available";
    return "";
  });

  readonly defaultActionDisabled = computed(() => {
    switch (this.defaultClientType()) {
      case "web":
        return !this.webClientUrl();
      case "secure":
        return !this.secureClientArtifactUri();
      case "regular":
        return false;
    }
  });

  readonly defaultActionFn = computed<() => void>(() => {
    switch (this.defaultClientType()) {
      case "web":
        return this.webClientUrl() ? () => this.launchWebClient() : () => {};
      case "secure":
        return this.secureClientArtifactUri()
          ? () => this.launchSecureClient("client_tls")
          : () => {};
      case "regular":
        return () => this.launchRegularClient("client");
    }
  });

  readonly allMenuItems = computed<MenuItem[]>(() => {
    const defaultItem: MenuItem = {
      id: "default",
      label: this.label(),
      disabled: this.defaultActionDisabled(),
      command: () => this.defaultActionFn()(),
    };
    return [defaultItem, ...this.menuItems()];
  });

  readonly menuItems = computed<MenuItem[]>(() => {
    if (this.hasSecureClient()) {
      return this.secureClientArtifactUri()
        ? this.buildSecureClientItems()
        : [];
    }
    return this.buildRegularClientItems();
  });

  private buildSecureClientItems(): MenuItem[] {
    return [
      {
        id: "client-tls",
        label: "MX.3 Client TLS",
        tooltip: "client_TLS.cmd",
        command: () => this.launchSecureClient("client_tls"),
      },
      {
        id: "monit-tls",
        label: "Monitor Services TLS",
        tooltip: "monit_TLS.cmd",
        command: () => this.launchSecureClient("monit_tls"),
      },
      {
        id: "richclient-tls",
        label: "Rich Client TLS",
        tooltip: "richclient_TLS.cmd",
        command: () => this.launchSecureClient("richclient_tls"),
      },
      {
        id: "browse-tls",
        label: "Browse TLS Client Repo",
        tooltip: "Opens client directory",
        command: () => this.launchSecureClient(""),
      },
    ];
  }

  private buildRegularClientItems(): MenuItem[] {
    return [
      {
        id: "client",
        label: "MX.3 Client",
        tooltip: "client.cmd",
        command: () => this.launchRegularClient("client"),
      },
      {
        id: "monit",
        label: "Monitor Services",
        tooltip: "monit.cmd",
        command: () => this.launchRegularClient("monit"),
      },
      {
        id: "richclient",
        label: "Rich Client",
        tooltip: "richclient.cmd",
        command: () => this.launchRegularClient("richclient"),
      },
      {
        id: "browse",
        label: "Browse Client Repo",
        tooltip: "Opens client directory",
        command: () => this.launchRegularClient(""),
      },
    ];
  }

  private launchWebClient(): void {
    this.companionService.launchWebClient(this.webClientUrl()!);
  }

  private launchSecureClient(launcher: string): void {
    this.companionService.callSecureCompanionUrl({
      environmentId: this.environmentId(),
      launcher,
      secureClientArtifactUri: this.secureClientArtifactUri()!,
    });
  }

  private launchRegularClient(launcher: string): void {
    this.environmentService
      .getMXClientDetails(this.projectId(), this.environmentId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (details) => {
          this.companionService.callCompanionUrl({
            environmentId: this.environmentId(),
            launcher,
            host: details.host,
            port: details.port,
            clientPackageName: details.clientPackage.name,
            clientPackageUri: details.clientPackage.uri,
            clientJarName: details.clientJar.name,
            clientJarUri: details.clientJar.uri,
          });
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 400) {
            const msg =
              "The build ID is purged, please make sure to generate new MX.3 setups and to deploy a new environment";
            this.isPurgedBuild.set(true);
            this.purgedBuildTooltip.set(msg);
            this.toastService.showError(msg, "Error while opening client");
          } else {
            this.toastService.showError(
              error.error?.message ?? error.message,
              "Error while opening client"
            );
          }
        },
      });
  }
}
