import { Component, input, signal } from "@angular/core";
import { MxevolveIconComponent } from "../icons/mxevolve-icon/mxevolve-icon.component";

@Component({
  selector: "mxevolve-copy-to-clipboard",
  imports: [MxevolveIconComponent],
  host: { style: "display: contents;" },
  template: `
    <button type="button" class="cursor-pointer" (click)="copy()">
      @if (!copied()) {
      <mxevolve-icon
        name="content_copy"
        size="sm"
        [color]="'#007bff'"
        class="ml-4"
      />
      } @else {
      <mxevolve-icon name="check" size="sm" [color]="'#28a745'" class="ml-4" />
      }
    </button>
  `,
})
export class CopyToClipboardComponent {
  readonly value = input.required<string>();

  protected readonly copied = signal(false);

  private resetTimeout?: ReturnType<typeof setTimeout>;

  protected copy(): void {
    void navigator.clipboard?.writeText(this.value());

    this.copied.set(true);

    // reset timer (avoid stacking)
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }

    this.resetTimeout = setTimeout(() => {
      this.copied.set(false);
    }, 1500); // 1.5s
  }
}
