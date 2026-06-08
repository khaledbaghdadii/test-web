import { Component, Input } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "mxevolve-view-environment-details-button",
  template: ` <p-button
    class="mr-2"
    (click)="viewEnvironmentDetails()"
    label="View Environment Details"
    [disabled]="disabled"
  ></p-button>`,
  standalone: false,
})
export class ViewEnvironmentDetailsButtonComponent {
  @Input() projectId: string;
  @Input() environmentId: string;
  @Input() disabled? = false;

  constructor(private router: Router) {}

  viewEnvironmentDetails() {
    this.router.navigate([
      `/app/${this.projectId}/environments/${this.environmentId}`,
    ]);
  }
}
