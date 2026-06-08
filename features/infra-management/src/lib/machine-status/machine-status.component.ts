import { Component, Input } from "@angular/core";

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
  selector: "mxevolve-machine-status",
  templateUrl: "./machine-status.component.html",
})
export class MachineStatusComponent {
  @Input() state: string;

  machineStates: {
    [key: string]: {
      text: string;
      severity: Severity;
      icon: string;
    };
  } = {
    powered_on: {
      text: "Powered On",
      severity: "success",
      icon: "pi pi-check-circle",
    },
    powered_off: {
      text: "Powered Off",
      severity: "danger",
      icon: "pi pi-power-off",
    },
    powering_on: {
      text: "Powering On",
      severity: "info",
      icon: "pi pi-spin pi-spinner",
    },
    decommissioning: {
      text: "Decommissioning",
      severity: "contrast",
      icon: "pi pi-spin pi-spinner",
    },
    decommissioned: {
      text: "Decommissioned",
      severity: "contrast",
      icon: "pi pi-ban",
    },
    under_maintenance: {
      text: "Under Maintenance",
      severity: "warn",
      icon: "pi pi-wrench",
    },
    expired: {
      text: "Expired",
      severity: "contrast",
      icon: "pi pi-ban",
    },
  };
}
