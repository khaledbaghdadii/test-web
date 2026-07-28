import { Component, computed, input } from "@angular/core";
import { Skeleton } from "primeng/skeleton";

/**
 * Generic loading placeholder: renders a `rows` x `columns` grid of skeleton
 * cells. Intentionally does not try to mirror the shape of the final content
 * — it is a reusable stand-in for "something is loading" wherever a caller
 * needs one, not a per-page bespoke placeholder.
 */
@Component({
  selector: "mxevolve-skeleton",
  imports: [Skeleton],
  template: `
    <div class="flex flex-col gap-3" role="status" aria-label="Loading">
      @for (row of rowIndexes(); track row) {
      <div
        class="grid gap-3"
        [style.grid-template-columns]="'repeat(' + columns() + ', 1fr)'"
      >
        @for (column of columnIndexes(); track column) {
        <p-skeleton height="1.25rem" />
        }
      </div>
      }
    </div>
  `,
})
export class SkeletonComponent {
  readonly rows = input<number>(1);
  readonly columns = input<number>(1);

  protected readonly rowIndexes = computed(() =>
    Array.from({ length: Math.max(this.rows(), 0) }, (_, index) => index)
  );
  protected readonly columnIndexes = computed(() =>
    Array.from({ length: Math.max(this.columns(), 0) }, (_, index) => index)
  );
}
