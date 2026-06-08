import { inject, Injectable } from "@angular/core";
import { ToastMessageData } from "./toast-message-data";
import { MessageService } from "primeng/api";

@Injectable({ providedIn: "root" })
export class ToastMessageService {
  private readonly messageService: MessageService = inject(MessageService);

  showSuccess(detail: string, summary?: string, data?: ToastMessageData): void {
    this.messageService.add({
      severity: "success",
      summary: summary ?? "Success",
      detail: detail,
      life: 10000,
      icon: "pi pi-check",
      data: data,
    });
  }

  showError(detail: string, summary?: string, data?: ToastMessageData): void {
    this.messageService.add({
      severity: "error",
      summary: summary ?? "Error",
      sticky: true,
      detail: detail,
      data: data,
      icon: "pi pi-times-circle",
      life: 10000,
    });
  }

  clearErrors(): void {
    this.messageService.clear();
  }
}
