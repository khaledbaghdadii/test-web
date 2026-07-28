import { Component, Input, Output, EventEmitter } from "@angular/core";

import { ButtonModule } from "primeng/button";

@Component({
  selector: "mxevolve-toggle-history-button",
  standalone: true,
  imports: [ButtonModule],
  template: `
    <p-button
      variant="outlined"
      [label]="label"
      [icon]="icon"
      iconPos="right"
      (click)="toggle()"
    ></p-button>
  `,
})
export class ToggleHistoryButtonComponent {
  @Input() showHistory = false;
  @Output() showHistoryChange = new EventEmitter<boolean>();

  get label(): string {
    return this.showHistory ? "Hide History" : "Show History";
  }

  get icon(): string {
    return this.showHistory ? "pi pi-arrow-up" : "pi pi-arrow-down";
  }

  toggle() {
    this.showHistory = !this.showHistory;
    this.showHistoryChange.emit(this.showHistory);
  }
}
