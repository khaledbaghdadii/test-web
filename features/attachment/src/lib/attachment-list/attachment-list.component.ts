import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ButtonModule } from "primeng/button";

import { SkeletonModule } from "primeng/skeleton";
import { Attachment } from "../attachment.model";
import { AttachmentService } from "../attachment.service";
import { ConfirmationService } from "primeng/api";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { ToastMessageService } from "@mxflow/ui/alert";

@Component({
  imports: [ButtonModule, SkeletonModule, ConfirmPopupModule],
  providers: [AttachmentService, ConfirmationService],
  selector: "mxevolve-attachments",
  templateUrl: "./attachment-list.component.html",
})
export class AttachmentListComponent {
  @Input({ required: true }) attachments: Attachment[];
  @Input() isLoading = false;
  @Input() showDelete = false;
  @Output() attachmentsChange = new EventEmitter<Attachment[]>();

  constructor(
    private attachmentService: AttachmentService,
    private toastMessageService: ToastMessageService,
    private confirmationService: ConfirmationService
  ) {}

  deleteAttachment(attachment: Attachment) {
    if (attachment.deleteLink) {
      this.deleteAttachmentPermanently(
        attachment.attachmentId,
        attachment.deleteLink
      );
    } else {
      this.unlinkAttachment(attachment.attachmentId);
    }
  }

  private unlinkAttachment(attachmentId: string) {
    this.removeAttachment(attachmentId);
  }

  private deleteAttachmentPermanently(
    attachmentId: string,
    deleteLink: string
  ) {
    this.attachmentService.deleteAttachment(deleteLink).subscribe({
      next: () => {
        this.removeAttachment(attachmentId);
      },
      error: (error) => this.pushErrorMessage(error.message),
    });
  }

  private removeAttachment(attachmentId: string) {
    this.pushDeletedSuccessfullyMessage();
    this.attachmentsChange.emit(
      this.attachments.filter(
        (attachment) => attachment.attachmentId != attachmentId
      )
    );
  }

  confirmDelete($event: MouseEvent, attachment: Attachment) {
    this.confirmationService.confirm({
      target: $event.target as EventTarget,
      message: `Are you sure you want to delete the attachment?`,
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        this.deleteAttachment(attachment);
      },
    });
  }

  pushErrorMessage(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }

  pushDeletedSuccessfullyMessage() {
    this.toastMessageService.showSuccess(
      "The attachment was deleted successfully"
    );
  }
}
