import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

@Component({
  selector: "mxevolve-summary-item",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="rounded-md border px-3 cursor-pointer text-sm flex items-center h-8"
      [class.bg-blue-50]="active()"
      [class.border-blue-400]="active()"
      [class.bg-white]="!active()"
      [class.dark:bg-surface-900]="!active()"
      [class.border-surface]="!active()"
      (click)="clicked.emit()"
    >
      <span class="text-blue-500 font-bold">{{ count() }}</span>
      <span
        class="ml-1"
        [class.text-blue-500]="active()"
        [class.font-bold]="active()"
        >{{ label() }}</span
      >
    </div>
  `,
})
export class SummaryItemComponent {
  readonly count = input.required<number>();
  readonly label = input.required<string>();
  readonly active = input(false);

  readonly clicked = output<void>();
}
