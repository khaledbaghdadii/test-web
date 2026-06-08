import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import type { SummaryDropdownItem } from "./summary-dropdown-item";

@Component({
  selector: "mxevolve-summary-dropdown",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MxevolveIconComponent],
  template: `
    <div class="relative">
      <div
        class="rounded-md border px-3 cursor-pointer text-sm flex items-center justify-between h-8"
        [class.bg-blue-50]="parentActive()"
        [class.border-blue-400]="parentActive()"
        [class.bg-white]="!parentActive()"
        [class.dark:bg-surface-900]="!parentActive()"
        [class.border-surface]="!parentActive()"
        (click)="onToggleClick($event)"
        data-testid="dropdown-trigger"
      >
        <span>
          <span class="text-blue-500 font-bold">{{ count() }}</span>
          <span
            class="ml-1"
            [class.text-blue-500]="parentActive()"
            [class.font-bold]="parentActive()"
            >{{ label() }}</span
          >
        </span>
        <mxevolve-icon
          [name]="open() ? 'expand_less' : 'expand_more'"
          size="sm"
        />
      </div>
      @if (open()) {
      <div
        class="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-surface-900 rounded-md border border-surface shadow-md z-50"
        data-testid="dropdown-panel"
      >
        @if (items().length === 0) {
        <div class="px-3 py-1.5 text-sm text-surface-400 italic">
          {{ emptyMessage() }}
        </div>
        } @else { @for (item of items(); track item.value; let first = $first;
        let last = $last) {
        <div
          class="px-3 py-1.5 text-sm cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700"
          [class.rounded-t-md]="first"
          [class.rounded-b-md]="last"
          [class.bg-blue-50]="item.active"
          (click)="onItemClick(item.value, $event)"
        >
          <span class="text-blue-500 font-bold">{{ item.count }}</span>
          <span
            class="ml-1"
            [class.text-blue-500]="item.active"
            [class.font-bold]="item.active"
            >{{ item.label }}</span
          >
        </div>
        } }
      </div>
      }
    </div>
  `,
})
export class SummaryDropdownComponent {
  readonly count = input.required<number>();
  readonly label = input.required<string>();
  readonly parentActive = input(false);
  readonly open = input(false);
  readonly items = input.required<SummaryDropdownItem[]>();
  readonly emptyMessage = input("No items");

  readonly toggled = output<void>();
  readonly itemClicked = output<string>();

  onToggleClick(event: Event): void {
    event.stopPropagation();
    this.toggled.emit();
  }

  onItemClick(value: string, event: Event): void {
    event.stopPropagation();
    this.itemClicked.emit(value);
  }
}
