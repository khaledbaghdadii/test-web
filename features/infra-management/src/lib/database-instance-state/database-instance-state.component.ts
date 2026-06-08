import { Component, input } from "@angular/core";

import { TagModule } from "primeng/tag";

type Severity =
  | "success"
  | "secondary"
  | "info"
  | "warn"
  | "danger"
  | "contrast";

@Component({
  imports: [TagModule],
  selector: "mxevolve-database-instance-state",
  templateUrl: "./database-instance-state.component.html",
})
export class DatabaseInstanceStateComponent {
  state = input.required<string>();

  databaseInstanceStates: {
    [key: string]: {
      text: string;
      severity: Severity;
      icon: string;
    };
  } = {
    available: {
      text: "Available",
      severity: "success",
      icon: "pi pi-check-circle",
    },
    failed: {
      text: "Failed",
      severity: "danger",
      icon: "pi pi-times-circle",
    },
    creating: {
      text: "Creating",
      severity: "info",
      icon: "pi pi-spin pi-spinner",
    },
    deallocated: {
      text: "Deallocated",
      severity: "contrast",
      icon: "pi pi-ban",
    },
  };
}
