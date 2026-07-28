import { Component, computed, input } from "@angular/core";
import { SkeletonComponent } from "@mxevolve/shared/ui/primitive";
import { PrefilledSection } from "./prefilled-inputs.types";

const SKELETON_COLUMNS = 2;

/**
 * Generic read-only display of prefilled (non-editable) inputs, grouped into
 * titled sections whose blue/bold headings mirror the editable form's own
 * section headings. Each row shows a muted label above its bold value; array
 * values are rendered comma-separated. While the caller's labels are still
 * resolving, a generic skeleton is shown instead of raw IDs.
 */
@Component({
  selector: "mxevolve-prefilled-inputs",
  templateUrl: "./prefilled-inputs.component.html",
  imports: [SkeletonComponent],
})
export class PrefilledInputsComponent {
  readonly sections = input.required<PrefilledSection[]>();
  readonly loading = input<boolean>(false);

  protected readonly skeletonRows = computed(() =>
    Math.max(
      this.sections().reduce(
        (total, section) => total + section.rows.length,
        0
      ),
      1
    )
  );
  protected readonly skeletonColumns = SKELETON_COLUMNS;

  displayValue(value: unknown, resolvedValue?: string): string {
    if (resolvedValue != null) {
      return resolvedValue;
    }
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (value == null) {
      return "";
    }
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return `${value}`;
    }
    return JSON.stringify(value) ?? "";
  }
}
