import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from "@angular/core";

import { Environment } from "../../service/models/environment.model";
import { EnvironmentStatus } from "../../environment-status/environment-status";
import { ClipboardService } from "../../service/clipboard/clipboard.service";
import { MessageService } from "primeng/api";
import { skipWhile, Subject, takeUntil } from "rxjs";
import { AuthorizationService } from "@mxflow/core/auth";
import { Store } from "@ngrx/store";
import { EnvironmentsState } from "../../store/environment/environments.state";
import { selectEnvironment } from "../../store/environment/environments.selectors";

@Component({
  selector: "mxevolve-copy-package-details-button",
  template: `
    @if (outputsDirectoryUri !== null) {
    <p-button
      [pTooltip]="getCopyTooltipTitle()"
      [disabled]="disabled || !userHasAccessToCopyDetails"
      (click)="copyMxtestDetails()"
      [icon]="copied ? 'pi pi-check-circle' : 'pi pi-copy'"
      iconPos="right"
      label="Copy"
      class="mr-2"
    ></p-button>
    }
  `,
  standalone: false,
})
export class CopyPackageDetailsButtonComponent implements OnChanges, OnDestroy {
  private readonly destroy$ = new Subject();

  @Input() projectId: string;
  @Input() environmentId: string;

  private timeout: any;
  copied: boolean = false;
  disabled: boolean = true;
  outputsDirectoryUri: string;

  userHasAccessToCopyDetails = false;
  pathToBeCopied: string;

  constructor(
    private messageService: MessageService,
    private clipboardService: ClipboardService,
    private authService: AuthorizationService,
    private store: Store<EnvironmentsState>
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.projectId && this.environmentId) {
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
        .subscribe((environment) => {
          if (environment?.status === EnvironmentStatus.READY) {
            this.outputsDirectoryUri = environment.outputsDirectoryUri;
            this.disabled = false;
            this.pathToBeCopied = this.getPathToBeCopied(environment);
          } else {
            this.disabled = true;
          }
        });

      this.authService
        .isAuthorized(
          {
            action: "copy_mxtest_details",
            attributes: {},
            package: "web",
            resource: "environment_page",
          },
          this.projectId
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe((userHasAccessToCopyDetails) => {
          this.userHasAccessToCopyDetails = userHasAccessToCopyDetails;
        });
    }
  }

  getCopyTooltipTitle() {
    return this.copied ? "Copied!" : "Copy Details for MXtest";
  }

  private getPathToBeCopied(environment: Environment): string {
    const mxtestWebBundle = environment.bundles?.find(
      (bundle) => bundle.type === "mxtestweb"
    );
    const mxtestWebIsTool = environment.isTools?.find(
      (tool) => tool.name === "mxtestweb"
    );
    return mxtestWebBundle || mxtestWebIsTool
      ? `${environment.outputsDirectoryUri}/mxtest_web`
      : `${environment.outputsDirectoryUri}/mxtest`;
  }

  copyMxtestDetails() {
    this.clipboardService
      .copyToClipboard(this.pathToBeCopied)
      .then(() => {
        this.copied = true;
        if (this.timeout) {
          clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(() => {
          this.copied = false;
        }, 700);
      })
      .catch((error) =>
        this.messageService.add({
          severity: "error",
          summary: "Failed to copy MxTest Package Details",
          detail: error,
        })
      );
  }
}
