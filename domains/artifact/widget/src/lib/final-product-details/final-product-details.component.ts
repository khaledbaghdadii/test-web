import { Component, computed, input, output } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import {
  FinalProduct,
  FinalProductService,
  FinalProductState,
} from "@mxevolve/domains/artifact/data-access";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { Message } from "primeng/message";
import { Skeleton } from "primeng/skeleton";
import { Tag } from "primeng/tag";
import { catchError, of } from "rxjs";

interface StatusConfiguration {
  readonly severity: "success" | "secondary" | "info" | "warn" | "danger";
  readonly label: string;
  readonly icon: string;
  readonly spin?: boolean;
}

const STATUS_CONFIGURATIONS: Record<string, StatusConfiguration> = {
  [FinalProductState.AVAILABLE]: {
    severity: "success",
    label: "Available",
    icon: "check_circle",
  },
  [FinalProductState.CREATING]: {
    severity: "info",
    label: "In Progress",
    icon: "progress_activity",
    spin: true,
  },
  [FinalProductState.FAILED]: {
    severity: "danger",
    label: "Failed",
    icon: "cancel",
  },
  [FinalProductState.PURGED]: {
    severity: "secondary",
    label: "Purged",
    icon: "archive",
  },
  [FinalProductState.PURGING]: {
    severity: "info",
    label: "Purging",
    icon: "progress_activity",
    spin: true,
  },
  [FinalProductState.PURGE_FAILED]: {
    severity: "danger",
    label: "Purge Failed",
    icon: "cancel",
  },
};

const IN_PROGRESS_STATUS: StatusConfiguration = {
  severity: "info",
  label: "In Progress",
  icon: "progress_activity",
  spin: true,
};

const FAILURE_PRE_PUBLISHING_REQUESTED = "FAILURE_PRE_PUBLISHING_REQUESTED";

@Component({
  selector: "mxevolve-final-product-details",
  imports: [Message, MxevolveIconComponent, Skeleton, Tag],
  providers: [FinalProductService],
  templateUrl: "./final-product-details.component.html",
  host: {
    style: "display: contents;",
  },
})
export class FinalProductDetailsComponent {
  readonly projectId = input.required<string>();
  readonly finalProductId = input<string | undefined>();
  readonly publishingStartDate = input<string | undefined>();
  readonly finalProductFailure = input<string | undefined>();
  readonly errorOccurred = output<string>();

  readonly finalProductResource = rxResource({
    params: () => {
      const finalProductId = this.finalProductId();
      if (!finalProductId || this.didFailToRequestPublishingFinalProduct()) {
        return undefined;
      }
      return { projectId: this.projectId(), finalProductId };
    },
    stream: ({ params }) =>
      this.finalProductService
        .getFinalProductById(params.projectId, params.finalProductId)
        .pipe(
          catchError((error) => {
            this.errorOccurred.emit(error.message);
            return of(undefined);
          })
        ),
  });

  readonly finalProduct = computed<FinalProduct | undefined>(() =>
    this.finalProductResource.hasValue()
      ? this.finalProductResource.value()
      : undefined
  );

  readonly loading = computed(() => this.finalProductResource.isLoading());

  readonly statusConfiguration = computed<StatusConfiguration>(() => {
    const finalProduct = this.finalProduct();
    if (!finalProduct) return IN_PROGRESS_STATUS;
    return (
      STATUS_CONFIGURATIONS[finalProduct.state?.toUpperCase()] ?? {
        severity: "secondary",
        label: finalProduct.state ?? "NA",
        icon: "remove_circle",
      }
    );
  });

  constructor(private readonly finalProductService: FinalProductService) {}

  readonly publishingNotStarted = computed(
    () => !this.publishingStartDate() && !this.finalProductId()
  );

  readonly awaitingPublishingRequest = computed(
    () =>
      !!this.publishingStartDate() &&
      !this.finalProductId() &&
      !this.didFailToRequestPublishingFinalProduct()
  );

  readonly shouldShowFailure = computed(() =>
    this.didFailToRequestPublishingFinalProduct()
  );

  private didFailToRequestPublishingFinalProduct(): boolean {
    return (
      this.finalProductFailure() === FAILURE_PRE_PUBLISHING_REQUESTED
    );
  }
}
