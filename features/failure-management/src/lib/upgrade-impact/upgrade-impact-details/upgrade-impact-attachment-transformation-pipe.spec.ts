import { UpgradeImpactAttachmentTransformationPipe } from "./upgrade-impact-attachment-transformation-pipe";
import { Attachment } from "@mxflow/features/attachment";
import { UpgradeImpactAttachment } from "../model/upgrade-impact.model";

describe("UpgradeImpactAttachmentTransformationPipe", () => {
  let pipe: UpgradeImpactAttachmentTransformationPipe;
  beforeEach(() => {
    pipe = new UpgradeImpactAttachmentTransformationPipe();
  });

  it("should transform upgrade impact attachments to attachment array", () => {
    expect(pipe.transform([getUpgradeImpactAttachment()])).toEqual([
      getAttachment(),
    ]);
  });

  function getAttachment(): Attachment {
    return {
      attachmentId: "attachmentId",
      name: "name",
      type: "type",
      downloadLink: "downloadLink",
    };
  }

  function getUpgradeImpactAttachment(): UpgradeImpactAttachment {
    return {
      attachmentId: "attachmentId",
      upgradeImpactId: "upgradeImpactId",
      name: "name",
      type: "type",
      downloadLink: "downloadLink",
      externalAttachment: {
        id: "id",
        origin: "origin",
      },
    };
  }
});
