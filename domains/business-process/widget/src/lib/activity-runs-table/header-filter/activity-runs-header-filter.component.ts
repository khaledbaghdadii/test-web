import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { IHeaderAngularComp } from "ag-grid-angular";
import type { Column, IHeaderParams } from "ag-grid-enterprise";
import { Button } from "primeng/button";
import { DatePicker } from "primeng/datepicker";
import { InputText } from "primeng/inputtext";
import { MultiSelect } from "primeng/multiselect";
import { Popover } from "primeng/popover";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import type {
  ActivityRunsHeaderFilterOption,
  ActivityRunsHeaderFilterParams,
  ActivityRunsHeaderFilterType,
  ActivityRunsTableContext,
} from "../activity-runs-table.types";

type HeaderFilterParams = IHeaderParams &
  ActivityRunsHeaderFilterParams & { context: ActivityRunsTableContext };

/**
 * Reusable custom AG Grid header that renders a column-scoped filter control
 * (text / multiselect / date-range) behind a funnel icon, plus an optional
 * sort affordance on the header label. It is intentionally activity-agnostic:
 * the consumer declares each column's `filterKey`, `filterType` and `options`
 * via `headerComponentParams`, and filter changes are published to the parent
 * {@link ActivityRunsTableComponent} through the grid `context` (no AG Grid
 * built-in filter UI is used — decision PR #11556).
 */
@Component({
  selector: "mxevolve-activity-runs-header-filter",
  imports: [
    FormsModule,
    Popover,
    Button,
    InputText,
    MultiSelect,
    DatePicker,
    MxevolveIconComponent,
  ],
  templateUrl: "./activity-runs-header-filter.component.html",
})
export class ActivityRunsHeaderFilterComponent implements IHeaderAngularComp {
  protected readonly displayName = signal("");
  protected readonly filterType = signal<ActivityRunsHeaderFilterType>("text");
  protected readonly options = signal<ActivityRunsHeaderFilterOption[]>([]);
  protected readonly placeholder = signal("");
  protected readonly sortable = signal(false);
  protected readonly sortDirection = signal<"asc" | "desc" | null>(null);
  protected readonly active = signal(false);

  protected readonly textValue = signal("");
  protected readonly multiselectValue = signal<string[]>([]);
  protected readonly dateRangeValue = signal<Date[] | null>(null);

  private params!: HeaderFilterParams;
  private filterKey = "";
  private column?: Column;
  private readonly onSortChanged = (): void => this.syncSort();

  agInit(params: HeaderFilterParams): void {
    this.params = params;
    this.filterKey = params.filterKey;
    this.displayName.set(params.displayName);
    this.filterType.set(params.filterType);
    this.options.set(params.options ?? []);
    this.placeholder.set(params.placeholder ?? "");
    this.sortable.set(!!params.enableSorting);

    this.column?.removeEventListener("sortChanged", this.onSortChanged);
    this.column = params.column;
    this.column.addEventListener("sortChanged", this.onSortChanged);

    this.restoreValue();
    this.syncSort();
  }

  refresh(params: HeaderFilterParams): boolean {
    this.agInit(params);
    return true;
  }

  onSortClicked(event: MouseEvent): void {
    if (!this.sortable()) {
      return;
    }
    this.params.progressSort(event.shiftKey);
  }

  apply(): void {
    const value = this.currentControlValue();
    this.params.context.setFilterValue(this.filterKey, value);
    this.active.set(this.hasValue(value));
  }

  clear(): void {
    this.textValue.set("");
    this.multiselectValue.set([]);
    this.dateRangeValue.set(null);
    this.params.context.setFilterValue(this.filterKey, undefined);
    this.active.set(false);
  }

  private currentControlValue(): unknown {
    switch (this.filterType()) {
      case "text": {
        const text = this.textValue().trim();
        return text.length > 0 ? text : undefined;
      }
      case "multiselect": {
        const selected = this.multiselectValue();
        return selected.length > 0 ? selected : undefined;
      }
      case "dateRange": {
        const range = this.dateRangeValue();
        return range?.[0] && range?.[1] ? range : undefined;
      }
    }
  }

  private restoreValue(): void {
    const value = this.params.context.getFilterValue(this.filterKey);
    switch (this.filterType()) {
      case "text":
        this.textValue.set(typeof value === "string" ? value : "");
        break;
      case "multiselect":
        this.multiselectValue.set(
          Array.isArray(value) ? (value as string[]) : []
        );
        break;
      case "dateRange":
        this.dateRangeValue.set(
          Array.isArray(value) ? (value as Date[]) : null
        );
        break;
    }
    this.active.set(this.hasValue(value));
  }

  private hasValue(value: unknown): boolean {
    if (value == null) {
      return false;
    }
    if (typeof value === "string") {
      return value.trim().length > 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return true;
  }

  private syncSort(): void {
    const sort = this.column?.getSort();
    this.sortDirection.set(sort === "asc" || sort === "desc" ? sort : null);
  }
}
