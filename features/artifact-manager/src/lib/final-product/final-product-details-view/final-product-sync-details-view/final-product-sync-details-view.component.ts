import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  Signal,
} from "@angular/core";
import {
  FinalProduct,
  SyncFinalProductRequest,
} from "../../model/final-product";
import { FinalProductSyncDetails } from "../model/final-product-sync-details";
import { FinalProductSyncDetailsComponent } from "../final-product-sync-details/final-product-sync-details.component";

import { AuthorizationUtilsModule } from "@mxflow/core/auth";
import { ToggleHistoryButtonComponent } from "@mxflow/ui/utils";
import { FinalProductSyncDetailsStateService } from "../final-product-sync-details/final-product-sync-details-state.service";
import { EnvironmentDefinition } from "@mxflow/features/environment";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ToastMessageService } from "@mxflow/ui/alert";

@Component({
  selector: "mxevolve-final-product-sync-details-view",
  standalone: true,
  imports: [
    FinalProductSyncDetailsComponent,
    ToggleHistoryButtonComponent,
    AuthorizationUtilsModule,
  ],
  providers: [FinalProductSyncDetailsStateService],
  templateUrl: "./final-product-sync-details-view.component.html",
})
export class FinalProductSyncDetailsViewComponent {
  finalProduct = input.required<FinalProduct>();
  showHistory = signal(false);

  finalProductWithSortedSyncRequests = computed(() => {
    const product = this.finalProduct();
    if (!product?.syncRequests?.length) return product;

    const sortedSyncRequests = [...product.syncRequests].sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    return {
      ...product,
      syncRequests: sortedSyncRequests,
    };
  });

  latestFinalProductSyncDetails = computed(() => {
    const product = this.finalProductWithSortedSyncRequests();
    if (!product?.syncRequests?.length) return null;

    return this.getFinalProductSyncDetails(product, product.syncRequests[0]);
  });

  environmentDefinitions: Signal<EnvironmentDefinition[]>;
  fetchEnvironmentsLoading: Signal<boolean>;
  showEnvironmentDefinitionNames = signal(true);

  private readonly toastMessageService = inject(ToastMessageService);
  private readonly stateService = inject(FinalProductSyncDetailsStateService);

  constructor() {
    this.environmentDefinitions = this.stateService.environmentDefinitions;
    this.fetchEnvironmentsLoading = this.stateService.fetchEnvironmentsLoading;

    this.stateService.errorMessage$
      .pipe(takeUntilDestroyed())
      .subscribe((errorMsg) => {
        this.showEnvironmentDefinitionNames.set(false);
        this.toastMessageService.showError(errorMsg);
      });

    effect(() => {
      const product = this.finalProduct();
      if (product) {
        this.stateService.setProjectId(product.projectId);
      }
    });
  }

  getFinalProductSyncDetails(
    finalProduct: FinalProduct,
    syncRequest: SyncFinalProductRequest
  ): FinalProductSyncDetails {
    return {
      finalProductId: finalProduct.id,
      projectId: finalProduct.projectId,
      syncRequestDetails: syncRequest,
    };
  }
}
