import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class FinalProductStatusResolverService {
  resolveStatus(state: string): {
    severity: "success" | "secondary" | "info" | "warn" | "danger" | "contrast";
    label: string;
    icon: string;
  } {
    switch (state.toLowerCase()) {
      case "available":
        return { severity: "success", label: "Available", icon: "pi pi-check" };
      case "failed":
        return { severity: "danger", label: "Failed", icon: "pi pi-times" };
      case "creating":
        return {
          severity: "info",
          label: "Creating",
          icon: "pi pi-info-circle",
        };
      case "purged":
        return {
          severity: "contrast",
          label: "Purged",
          icon: "pi pi-trash",
        };
      case "purging":
        return {
          severity: "warn",
          label: "Purging",
          icon: "pi pi-trash",
        };
      case "purge_failed":
        return {
          severity: "danger",
          label: "Purge Failed",
          icon: "pi pi-trash",
        };
      default:
        return {
          severity: "contrast",
          label: "Unknown Status",
          icon: "pi pi-question-circle",
        };
    }
  }
}
