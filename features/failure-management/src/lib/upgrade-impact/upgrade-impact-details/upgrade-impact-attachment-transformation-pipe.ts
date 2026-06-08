import { Pipe, PipeTransform } from "@angular/core";
import { UpgradeImpactAttachment } from "../model/upgrade-impact.model";
import { Attachment } from "@mxflow/features/attachment";

@Pipe({
  name: "upgradeImpactAttachmentTransformationPipe",
  standalone: true,
})
export class UpgradeImpactAttachmentTransformationPipe
  implements PipeTransform
{
  transform(attachments: UpgradeImpactAttachment[]): Attachment[] {
    return attachments.map((attachment: UpgradeImpactAttachment) => {
      return this.map(attachment);
    });
  }

  private map(attachment: UpgradeImpactAttachment): Attachment {
    return {
      attachmentId: attachment.attachmentId,
      name: attachment.name,
      type: attachment.type,
      downloadLink: attachment.downloadLink,
    };
  }
}
