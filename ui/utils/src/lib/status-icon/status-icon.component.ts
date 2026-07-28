import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "mxevolve-status-icon",
  standalone: true,
  imports: [CommonModule],
  template: `
    <i
      class="pi"
      [ngClass]="{
        'pi-times-circle text-red-500': !state,
        'pi-check-circle text-green-500': state
      }"
      aria-label="Status icon"
    ></i>
  `,
})
export class StatusIconComponent {
  @Input() state: boolean;
}
