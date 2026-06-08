import { BinaryImpact } from "./binary-impact";
import { v5 as uuidv5 } from "uuid";
import { BinaryImpactApiResponse } from "./binary-impact-api-response.model";

export class BinaryImpactTestUtils {
  public static readonly PROJECT_ID = "projectId";
  public static readonly ERROR_MESSAGE = "failed";
  public static readonly BINARY_IMPACT_ID = "binaryImpactId";
  public static readonly ATTACHMENT_LINK = "link";
  public static readonly ATTACHMENT_ID = "attachmentId";

  public static readonly CORRELATION_ID = "CORRELATION_ID";

  public static readonly FILE_1 = new File(
    [new Blob(["content1"], {})],
    "attachmentName1",
    { type: "image/png" }
  );
  public static readonly ATTACHMENT_1 = {
    attachmentId: "attachment1",
    downloadLink: "attachment1_link",
    name: BinaryImpactTestUtils.FILE_1.name,
    type: BinaryImpactTestUtils.FILE_1.type,
  };
  public static readonly FILE_2 = new File(
    [new Blob(["content2"], {})],
    "attachmentName2",
    { type: "image/jpeg" }
  );
  public static readonly ATTACHMENT_2 = {
    attachmentId: "attachment2",
    downloadLink: "attachment2_link",
    name: BinaryImpactTestUtils.FILE_2.name,
    type: BinaryImpactTestUtils.FILE_2.type,
  };
  public static readonly UPLOAD_RESULT_1 = {
    attachmentId: BinaryImpactTestUtils.ATTACHMENT_1.attachmentId,
    downloadLink: BinaryImpactTestUtils.ATTACHMENT_1.downloadLink,
  };
  public static readonly SERVICE_UPLOAD_RESULT_1 = {
    id: BinaryImpactTestUtils.ATTACHMENT_1.attachmentId,
    downloadLink: BinaryImpactTestUtils.ATTACHMENT_1.downloadLink,
  };

  public static readonly UPLOAD_RESULT_2 = {
    attachmentId: BinaryImpactTestUtils.ATTACHMENT_2.attachmentId,
    downloadLink: BinaryImpactTestUtils.ATTACHMENT_2.downloadLink,
  };

  public static readonly SERVICE_UPLOAD_RESULT_2 = {
    id: BinaryImpactTestUtils.ATTACHMENT_2.attachmentId,
    downloadLink: BinaryImpactTestUtils.ATTACHMENT_2.downloadLink,
  };

  public static getBinaryImpact(
    seed: string,
    overrides?: Partial<BinaryImpact>
  ): BinaryImpact {
    return this.generateBaseBinaryImpact(seed, overrides);
  }

  public static getBinaryImpactApiModel(
    seed: string,
    overrides?: Partial<BinaryImpactApiResponse>
  ): BinaryImpactApiResponse {
    return this.generateBaseBinaryImpact(seed, overrides);
  }

  private static generateBaseBinaryImpact(
    seed: string,
    overrides: Partial<BinaryImpactApiResponse> | undefined
  ) {
    return {
      configurationDesign: uuidv5("configurationDesign", seed),
      identificationPattern: uuidv5("identificationPattern", seed),
      magnitude: uuidv5("magnitude", seed),
      propagationPattern: uuidv5("propagationPattern", seed),
      propagationQuery: uuidv5("propagationQuery", seed),
      id: uuidv5("id", seed),
      owner: uuidv5("owner", seed),
      title: uuidv5("title", seed),
      projectId: uuidv5("projectId", seed),
      mxVersion: uuidv5("mxVersion", seed),
      description: uuidv5("description", seed),
      creationDate: new Date("2000-01-11T07:14:02.300Z"),
      upgradeImpactId: uuidv5("upgradeImpactId", seed),
      correlationId: uuidv5("correlationId", seed),
      impactedOutputs: {
        id: uuidv5("impactedOutputsId", seed),
        name: uuidv5("impactOutputsName", seed),
      },
      region: {
        id: uuidv5("regionId", seed),
        name: uuidv5("regionName", seed),
      },
      resolutionType: {
        id: uuidv5("resolutionTypeId", seed),
        name: uuidv5("resolutionTypeName", seed),
      },
      sourceType: {
        id: uuidv5("sourceTypeId", seed),
        name: uuidv5("sourceTypeName", seed),
      },
      stream: {
        id: uuidv5("streamId", seed),
        name: uuidv5("streamName", seed),
      },
      attachments: [
        {
          attachmentId: uuidv5("attachmentId", seed),
          name: uuidv5("attachmentName", seed),
          type: uuidv5("attachmentType", seed),
          downloadLink: uuidv5("domwloadLink", seed),
        },
      ],
      cbpmL1L2L3: [
        {
          id: uuidv5("cbpmL1L2L3Id", seed),
          name: uuidv5("cbpmL1L2L3Name", seed),
        },
      ],
      cbpmL2Scope: [
        {
          id: uuidv5("cbpmL2ScopeId", seed),
          name: uuidv5("cbpmL2ScopeName", seed),
        },
      ],
      cbpmL3L4: [
        {
          id: uuidv5("cbpmL3L4Id", seed),
          name: uuidv5("cbpmL3L4Name", seed),
        },
      ],
      ...overrides,
    };
  }

  public static getDeleteLink(
    projectId: string,
    binaryImpactId: string,
    attachmentId: string
  ) {
    return `projects/${projectId}/failure-management/impacts/binary/${binaryImpactId}/attachment/${attachmentId}`;
  }
}
