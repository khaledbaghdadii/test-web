import { Injectable } from "@angular/core";
import { MessageService } from "primeng/api";

@Injectable()
export class NotificationService {
  constructor(private messageService: MessageService) {}

  showSuccess(message: string, link?: string) {
    this.messageService.add({
      key: "success-notification",
      severity: "success",
      summary: message,
      detail: link,
      life: 5000,
    });
  }

  showError(message: string, detail?: string) {
    this.messageService.add({
      key: "error-notification",
      severity: "error",
      summary: message,
      sticky: true,
      detail,
    });
  }

  clearErrors() {
    this.messageService.clear("error-notification");
  }
}
