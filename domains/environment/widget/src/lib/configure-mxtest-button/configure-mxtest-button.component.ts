import { Component, computed, inject, input, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { ClipboardService } from "./clipboard.service";
import { AuthorizationService } from "@mxflow/core/auth";
import {
  EnvironmentBundle,
  EnvironmentIsTool,
} from "@mxevolve/domains/environment/data-access";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-configure-mxtest-button",
  standalone: true,
  imports: [ButtonModule, TooltipModule, MxevolveIconComponent],
  template: `
    @if (iconOnly()) {
    <p-button
      [text]="true"
      [rounded]="true"
      severity="primary"
      (onClick)="onCopy()"
      [disabled]="disabled() || !userHasAccessToCopyDetails()"
      [pTooltip]="tooltip()"
      data-testid="configure-mxtest-button"
    >
      <ng-template #icon>
        <mxevolve-icon name="content_copy" size="md" />
      </ng-template>
    </p-button>
    } @else {
    <p-button
      [text]="true"
      severity="primary"
      label="Copy"
      (onClick)="onCopy()"
      [disabled]="disabled() || !userHasAccessToCopyDetails()"
      [pTooltip]="tooltip()"
      data-testid="configure-mxtest-button"
    />
    }
  `,
})
export class ConfigureMxTestButtonComponent {
  readonly projectId = input.required<string>();
  readonly outputsDirectoryUri = input<string | undefined>(undefined);
  readonly bundles = input<EnvironmentBundle[] | undefined>(undefined);
  readonly isTools = input<EnvironmentIsTool[] | undefined>(undefined);
  readonly status = input.required<EnvironmentStatus>();
  readonly iconOnly = input(false);

  private readonly clipboardService = inject(ClipboardService);
  private readonly authorizationService = inject(AuthorizationService);
  private readonly toastService = inject(ToastMessageService);

  readonly copied = signal(false);

  private readonly COPY_MXTEST_AUTHORIZATION = {
    action: "copy_mxtest_details",
    attributes: {},
    package: "web",
    resource: "environment_page",
  } as const;

  private readonly MXTESTWEB_BUNDLE_TYPE = "mxtestweb";

  readonly copyDetailsAuthorization = rxResource<
    boolean,
    { projectId: string }
  >({
    params: () => ({ projectId: this.projectId() }),
    stream: ({ params }) =>
      this.authorizationService.isAuthorized(
        this.COPY_MXTEST_AUTHORIZATION,
        params.projectId
      ),
    defaultValue: false,
  });

  readonly userHasAccessToCopyDetails = computed(() =>
    this.copyDetailsAuthorization.hasValue()
      ? this.copyDetailsAuthorization.value()
      : false
  );

  readonly disabled = computed(
    () =>
      this.status() !== EnvironmentStatus.READY || !this.outputsDirectoryUri()
  );

  readonly tooltip = computed(() =>
    this.copied() ? "Copied!" : "Copy Details for MXtest"
  );

  readonly pathToBeCopied = computed(() => {
    const uri = this.outputsDirectoryUri();

    if (!uri) {
      return undefined;
    }

    const hasMxtestWebBundle = (this.bundles() ?? []).some((bundle) => {
      const bundleType = bundle.type?.toLowerCase();
      return (
        bundleType === this.MXTESTWEB_BUNDLE_TYPE ||
        bundle.id.toLowerCase() === this.MXTESTWEB_BUNDLE_TYPE
      );
    });

    const hasMxtestWebIsTool = (this.isTools() ?? []).some(
      (tool) => tool.name === this.MXTESTWEB_BUNDLE_TYPE
    );

    return hasMxtestWebBundle || hasMxtestWebIsTool
      ? `${uri}/mxtest_web`
      : `${uri}/mxtest`;
  });

  async onCopy(): Promise<void> {
    const path = this.pathToBeCopied();

    if (!path || this.disabled() || !this.userHasAccessToCopyDetails()) {
      return;
    }

    try {
      await this.clipboardService.copyToClipboard(path);
      this.copied.set(true);
    } catch (error) {
      this.toastService.showError(
        error instanceof Error ? error.message : String(error),
        "Failed to copy MxTest Package Details"
      );
    }
  }
}
