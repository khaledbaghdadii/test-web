import { LinkedDetectionPipe } from "./linked-detection.pipe";
import {
  binaryImpactId,
  configurationImpactId,
  LITE_BINARY_IMPACT_1,
} from "../../analysis-object-link/analysis-object-link-test-utils";
import { DetectionType } from "@mxflow/features/failure-management";
import { LinkedDetectionData } from "../test-case-execution-with-linked-analysis-objects";

describe("LinkedDetectionPipe", () => {
  let pipe: LinkedDetectionPipe;

  beforeEach(() => {
    pipe = new LinkedDetectionPipe();
  });

  it("create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("should transform linked detection data into a comma separated string of linked detection titles", () => {
    const linkedDetectionData = getLinkedDetectionData();
    const expectedTransformedData = `${BINARY_IMPACT_TITLE}, ${CONFIGURATION_IMPACT_TITLE}`;
    const actualTransformedData = pipe.transform(linkedDetectionData);
    expect(actualTransformedData).toEqual(expectedTransformedData);
  });

  it("should return an empty string when linked detection data is empty", () => {
    const linkedDetectionData: any[] = [];
    const actualTransformedData = pipe.transform(linkedDetectionData);
    expect(actualTransformedData).toEqual("");
  });
});

const BINARY_IMPACT_TITLE = "binary impact title";
const CONFIGURATION_IMPACT_TITLE = "configuration impact title";

function getLinkedDetectionData() {
  return [
    {
      ...LITE_BINARY_IMPACT_1,
      id: binaryImpactId,
      title: BINARY_IMPACT_TITLE,
      analysisObjectType: DetectionType.Binary,
    },
    {
      ...getConfigurationImpact(),
      id: configurationImpactId,
      analysisObjectType: DetectionType.Configuration,
    },
  ] as unknown as LinkedDetectionData[];
}

function getConfigurationImpact() {
  return {
    id: configurationImpactId,
    title: CONFIGURATION_IMPACT_TITLE,
    description: "description1",
    guiltyChange: "guiltyChange1",
    owner: "owner1",
    creationDate: new Date("2024-03-22T07:42:18.196Z"),
  };
}
