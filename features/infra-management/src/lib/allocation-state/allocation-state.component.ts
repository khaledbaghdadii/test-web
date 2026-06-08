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
  selector: "app-allocation-state",
  templateUrl: "./allocation-state.component.html",
})
export class AllocationStateComponent {
  @Input() state: string;

  allocationStates: {
    [key: string]: {
      text: string;
      severity: Severity;
      icon: string;
    };
  } = {
    active: {
      text: "Active",
      severity: "success",
      icon: "pi pi-check-circle",
    },
    failed: {
      text: "Failed",
      severity: "danger",
      icon: "pi pi-times-circle",
    },
    allocating: {
      text: "Allocating",
      severity: "info",
      icon: "pi pi-spin pi-spinner",
    },
    provisioning: {
      text: "Provisioning",
      severity: "info",
      icon: "pi pi-spin pi-spinner",
    },
    deallocated: {
      text: "Deallocated",
      severity: "contrast",
      icon: "pi pi-ban",
    },
    queued: {
      text: "Queued",
      severity: "warn",
      icon: "pi pi-clock",
    },
    idle: {
      text: "Idle",
      severity: "info",
      icon: "pi pi-pause",
    },
    deallocating: {
      text: "Deallocating",
      severity: "contrast",
      icon: "pi pi-spin pi-spinner",
    },
    deallocation_failed: {
      text: "Deallocation Failed",
      severity: "danger",
      icon: "pi pi-times-circle",
    },
  };
}
