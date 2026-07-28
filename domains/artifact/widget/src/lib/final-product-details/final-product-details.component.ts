import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { EMPTY } from "rxjs";
import {
  CommitIdDisplayComponent,
  ExpandableMessageComponent,
} from "@mxevolve/shared/ui/primitive";
import {
  FinalProduct,
  FinalProductApiService,
} from "@mxevolve/domains/artifact/data-access";
import { Skeleton } from "primeng/skeleton";
import { Tag } from "primeng/tag";
import { Message } from "primeng/message";
import { FinalProductStatusBadgeComponent } from "./status-badge.component";
import { Divider } from "primeng/divider";

@Component({
  selector: "mxevolve-final-product-details",
  templateUrl: "./final-product-details.component.html",
  host: {
    style: "display: contents;",
  },
  imports: [
    CommitIdDisplayComponent,
    ExpandableMessageComponent,
    Skeleton,
    Tag,
    Message,
    FinalProductStatusBadgeComponent,
    Divider,
  ],
})
export class FinalProductDetailsComponent {
  readonly projectId = input.required<string>();
  readonly finalProductId = input<string>();
  readonly publishingFailed = input(false);

  readonly fetchError = output<string>();

  private readonly finalProductApiService = inject(FinalProductApiService);

  private readonly finalProductResource = rxResource({
    params: () => ({
      projectId: this.projectId(),
      finalProductId: this.finalProductId(),
    }),
    stream: ({ params }) =>
      params.finalProductId
        ? this.finalProductApiService.getFinalProductById(
            params.projectId,
            params.finalProductId
          )
        : EMPTY,
  });

  readonly finalProduct = computed<FinalProduct | undefined>(() =>
    this.finalProductResource.hasValue()
      ? this.finalProductResource.value()
      : undefined
  );

  readonly loadFailed = computed(
    () => !!this.finalProductId() && !!this.finalProductResource.error()
  );

  readonly showError = computed(
    () => this.publishingFailed() || this.loadFailed()
  );

  readonly isLoading = computed(
    () => !!this.finalProductId() && this.finalProductResource.isLoading()
  );

  readonly isPublishingInProgress = computed(
    () => !this.finalProductId() && !this.publishingFailed()
  );

  constructor() {
    effect(() => {
      const error = this.finalProductResource.error();
      if (error && this.finalProductId()) {
        this.fetchError.emit(
          error instanceof Error ? error.message : String(error)
        );
      }
    });
  }
}
