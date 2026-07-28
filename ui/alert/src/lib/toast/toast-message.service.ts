import { inject, Injectable } from "@angular/core";
import { MessageService } from "primeng/api";
import { ToastMessageData } from "./toast-message-data";

@Injectable({ providedIn: "root" })
export class ToastMessageService {
  private readonly messageService = inject(MessageService);

  showSuccess(detail: string, summary?: string, data?: ToastMessageData) {
    this.messageService.add({
      severity: "success",
      summary: summary || "Success",
      detail: detail,
      life: 10000,
      icon: "pi pi-check",
      data: data,
    });
  }

  showError(detail: string, summary?: string, data?: ToastMessageData) {
    this.messageService.add({
      severity: "error",
      summary: summary || "Error",
      sticky: true,
      detail: detail,
      data: data,
      icon: "pi pi-times-circle",
      life: 10000,
    });
  }

  showWarning(detail: string, summary?: string, data?: ToastMessageData) {
    this.messageService.add({
      severity: "warn",
      summary: summary || "Warning",
      detail: detail,
      life: 10000,
      data: data,
      icon: "pi pi-exclamation-triangle",
    });
  }

  showInfo(detail: string, summary?: string, data?: ToastMessageData) {
    this.messageService.add({
      severity: "info",
      summary: summary || "Info",
      detail: detail,
      life: 10000,
      icon: "pi pi-info-circle",
      data: data,
    });
  }

  clearErrors() {
    this.messageService.clear();
  }
}
