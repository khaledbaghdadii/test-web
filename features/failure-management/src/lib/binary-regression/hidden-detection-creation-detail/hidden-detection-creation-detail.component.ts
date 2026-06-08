import { Component, Input } from "@angular/core";

@Component({
  selector: "mxevolve-hidden-detection-creation-detail",
  imports: [],
  template: `
    @if (field) {
    <span>{{ field }}</span>
    } @else {
    <em class="text-gray-500">you don't have rights to see this info</em>
    }
  `,
})
export class HiddenDetectionCreationDetailComponent {
  @Input({ required: true }) field?: string;
}
