import { Attachment } from './attachment.model';
import { UploadProjectSpecificTemporaryAttachmentResponse } from './attachment.service';

export class AttachmentTestUtils {
  public static readonly DELETE_LINK = 'delete/file';
  public static readonly ERROR_MESSAGE = 'failed to delete file';
  public static readonly ATTACHMENT: Attachment = {
    attachmentId: 'attachmentId',
    name: 'attachmentName',
    type: 'attachmentType',
    downloadLink: 'downloadLink',
    deleteLink: AttachmentTestUtils.DELETE_LINK,
  };
  public static readonly UPLOAD_PROJECT_SPECIFIC_ATTACHMENT_RESPONSE: UploadProjectSpecificTemporaryAttachmentResponse =
    { id: 'attachmentId', downloadLink: 'attachmentLink' };
  public static FILE = new File([new Blob(['content'], {})], 'attachmentName', { type: 'image/png' });
  public static FILE_2 = new File([new Blob(['content2'], {})], 'attachmentName2', { type: 'image/jpeg' });
  public static getAttachmentFormData() {
    const formData = new FormData();
    formData.append('file', this.FILE);
    return formData;
  }
}
