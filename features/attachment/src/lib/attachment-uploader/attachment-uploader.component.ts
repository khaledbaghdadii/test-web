import { Component, EventEmitter, Input, Output } from "@angular/core";

import { FileSelectEvent, FileUploadModule } from "primeng/fileupload";
import { AttachmentListComponent } from "../attachment-list/attachment-list.component";
import { Attachment } from "../attachment.model";
import { SkeletonModule } from "primeng/skeleton";

@Component({
  selector: "mxevolve-attachment-uploader",
  imports: [FileUploadModule, AttachmentListComponent, SkeletonModule],
  templateUrl: "./attachment-uploader.component.html",
})
export class AttachmentUploaderComponent {
  @Input({ required: true }) attachments: Attachment[];
  @Input() isLoading: boolean;
  @Input() isUploadingAttachment: boolean;
  @Output() uploadFiles = new EventEmitter<File[]>();
  @Output() attachmentsChange = new EventEmitter<Attachment[]>();

  upload(event: FileSelectEvent) {
    this.uploadFiles.emit(Array.from(event.files));
  }
}
