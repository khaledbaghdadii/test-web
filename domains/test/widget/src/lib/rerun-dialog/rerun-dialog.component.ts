import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from "@angular/core";
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { Message } from "primeng/message";
import { InputText } from "primeng/inputtext";
import { Checkbox } from "primeng/checkbox";
import { RadioButton } from "primeng/radiobutton";
import { WhitespaceValidators } from "@mxevolve/shared/ui/form";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { FactoryProductInputComponent } from "../rerun-scenario-button/factory-product-input/factory-product-input.component";
import { FinalProductDropdownInputComponent } from "@mxevolve/domains/artifact/widget";
import type { FinalProduct } from "@mxevolve/domains/artifact/data-access";
import { FinalProductApiService } from "@mxevolve/domains/artifact/data-access";
import { RepositoryService } from "@mxevolve/domains/scm/data-access";
import { Skeleton } from "primeng/skeleton";
import { catchError, of } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { APP_CONFIG } from "@mxflow/config";
import { RerunModeAnalyticsTrackerService } from "./rerun-mode-analytics-tracker.service";

export type RerunMode = "unofficial" | "official";

export interface UnofficialRerunEvent {
  mode: "unofficial";
  factoryProductId: string;
  commitId?: string;
  stopServices: boolean;
}

export interface OfficialRerunEvent {
  mode: "official";
  finalProductId: string;
  rtpCommitId: string;
  stopServices: boolean;
}

export type RerunRequestedEvent = UnofficialRerunEvent | OfficialRerunEvent;

@Component({
  selector: "mxevolve-rerun-dialog",
  imports: [
    Button,
    Dialog,
    Message,
    InputText,
    ReactiveFormsModule,
    FormsModule,
    Checkbox,
    RadioButton,
    MxevolveIconComponent,
    FactoryProductInputComponent,
    FinalProductDropdownInputComponent,
    Skeleton,
  ],
  providers: [
    FinalProductApiService,
    RepositoryService,
    ToastMessageService,
    {
      provide: GATEWAY_CONFIG,
      useFactory: () => ({ gatewayUrl: inject(APP_CONFIG).gatewayUrl }),
    },
  ],
  templateUrl: "./rerun-dialog.component.html",
})
export class RerunDialogComponent {
  readonly visible = model(false);
  readonly projectId = input.required<string>();
  readonly factoryProductId = input<string>();
  readonly warningMessage = input<string>();
  readonly loading = input(false);

  /** When true, shows Official / Unofficial mode toggle */
  readonly allowOfficialRerun = input(false);
  /** Pre-select this final product ID in official mode */
  readonly initialFinalProductId = input<string>();
  /** Filter final products to this branch */
  readonly branch = input<string>();
  /** Show keep-services checkbox (only needed for CI flows) */
  readonly enableKeepServices = input(false);
  /** Mode selected by default when the dialog opens */
  readonly defaultRerunMode = input<RerunMode>("unofficial");

  readonly rerunRequested = output<RerunRequestedEvent>();

  // Unofficial mode state
  readonly selectedFactoryProductId = signal<string | undefined>(undefined);
  readonly commitIdControl = new FormControl("", [
    Validators.maxLength(255),
    WhitespaceValidators.noWhitespaces(),
  ]);

  // Official mode state
  readonly rerunMode = signal<RerunMode>("unofficial");
  readonly selectedFinalProduct = signal<FinalProduct | undefined>(undefined);
  readonly rtpCommitIdControl = new FormControl("", [
    Validators.required,
    WhitespaceValidators.noWhitespaces(),
  ]);
  readonly keepServices = signal(false);

  /**
   * Repository owning the branch the products live on. Legacy resolved it the
   * same way (first repository of the project) and passed it to the dropdown;
   * without it the dropdown cannot load commit messages or flag the HEAD commit.
   */
  readonly repositoryId = signal<string | undefined>(undefined);
  /** True until the product list has loaded once, so a skeleton stands in. */
  readonly finalProductsLoading = signal(false);
  /** Expiry note emitted by the dropdown for the selected product. */
  readonly finalProductWarningMessage = signal("");

  private readonly rerunModeAnalyticsTracker = inject(
    RerunModeAnalyticsTrackerService
  );
  private readonly repositoryService = inject(RepositoryService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.commitIdControl.reset();
        this.rtpCommitIdControl.reset();
        this.keepServices.set(false);
        this.rerunMode.set(this.defaultRerunMode());
        this.finalProductWarningMessage.set("");
        this.finalProductsLoading.set(true);
        this.resolveRepositoryId();
      }
    });
  }

  /**
   * Legacy `setRepositoryId`: the first repository of the project, looked up
   * once. Guarded by a plain field rather than the signal so writing the result
   * cannot re-trigger the effect that opens the dialog.
   */
  private repositoryLookupStarted = false;

  private resolveRepositoryId(): void {
    if (this.repositoryLookupStarted) {
      return;
    }
    this.repositoryLookupStarted = true;
    this.repositoryService
      .getAllRepositories(this.projectId())
      .pipe(
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((repositories) =>
        this.repositoryId.set(repositories[0]?.id ?? undefined)
      );
  }

  /** Legacy `handleDataReadyChange`: drops the loading skeleton once. */
  onFinalProductsDataReady(isDataReady: boolean): void {
    if (isDataReady && this.finalProductsLoading()) {
      this.finalProductsLoading.set(false);
    }
  }

  /** Legacy `handleErrorMessageChange`: surfaces a fetch failure. */
  onFinalProductsError(errorMessage: string): void {
    this.toastMessageService.showError(errorMessage);
  }

  /** Legacy `updateFinalProductWarningMessage`: the expiry note. */
  onFinalProductExpiryNotification(message: string): void {
    this.finalProductWarningMessage.set(message);
  }

  onModeChange(mode: RerunMode): void {
    this.rerunMode.set(mode);
  }

  readonly isRerunDisabled = computed(() => {
    if (this.rerunMode() === "official") {
      return !this.selectedFinalProduct() || this.rtpCommitIdControl.invalid;
    }
    return !this.selectedFactoryProductId() || this.commitIdControl.invalid;
  });

  onFinalProductChange(finalProduct: FinalProduct | undefined): void {
    if (!finalProduct) {
      // Legacy `resetFinalProductWarningMessage`: the expiry note belongs to the
      // product that was cleared, so it must not outlive the selection.
      this.finalProductWarningMessage.set("");
    }
    this.selectedFinalProduct.set(finalProduct);
    // Mirror the legacy behaviour: prefill the RTP commit ID from the selected
    // final product so an official rerun for the same run is pre-populated.
    this.rtpCommitIdControl.setValue(
      finalProduct?.rtpProduct?.rtpCommitId ?? ""
    );
  }

  submitRerun(): void {
    if (this.rerunMode() === "official") {
      this.rerunModeAnalyticsTracker.trackOfficialModeSelected();
      const fp = this.selectedFinalProduct();
      if (!fp || this.rtpCommitIdControl.invalid) return;
      const stopServices = this.enableKeepServices()
        ? !this.keepServices()
        : true;
      this.rerunRequested.emit({
        mode: "official",
        finalProductId: fp.id,
        rtpCommitId: this.rtpCommitIdControl.value!.trim(),
        stopServices,
      });
    } else {
      this.rerunModeAnalyticsTracker.trackUnofficialModeSelected();
      const factoryProductId = this.selectedFactoryProductId();
      if (!factoryProductId) return;
      const stopServices = this.enableKeepServices()
        ? !this.keepServices()
        : true;
      this.rerunRequested.emit({
        mode: "unofficial",
        factoryProductId,
        commitId: this.commitIdControl.value || undefined,
        stopServices,
      });
    }
  }

  resetForm(): void {
    this.selectedFactoryProductId.set(undefined);
    this.commitIdControl.reset();
    this.rtpCommitIdControl.reset();
    this.selectedFinalProduct.set(undefined);
    this.keepServices.set(false);
    this.rerunMode.set(this.defaultRerunMode());
  }
}
