import { DetectionsSummaryPipe } from "./detections-summary.pipe";

const binaryRegression1 = "binary regression 1";
const binaryRegression2 = "binary regression 2";
const configurationRegression1 = "configuration Regression 1";
const configurationRegression2 = "configuration Regression 2";
const configurationImpact1 = "configuration Impact 1";
const configurationImpact2 = "configuration Impact 2";
const binaryImpact1 = "binary Impact 1";
const binaryImpact2 = "binary Impact 2";
const failureReason1 = "failure reason 1";
const failureReason2 = "failure reason 2";
const detections = {
  binaryRegressionIds: [binaryRegression1, binaryRegression2],
  configurationRegressionIds: [
    configurationRegression1,
    configurationRegression2,
  ],
  binaryImpactIds: [binaryImpact1, binaryImpact2],
  configurationImpactIds: [configurationImpact1, configurationImpact2],
  failureReasonIds: [failureReason1, failureReason2],
};

describe("DetectionsSummaryPipe", () => {
  let detectionsSummaryPipe: DetectionsSummaryPipe;
  beforeEach(() => {
    detectionsSummaryPipe = new DetectionsSummaryPipe();
  });

  it("count of impacts should be the sum of binary and config impact counts", () => {
    expect(detectionsSummaryPipe.transform({ ...detections })).toHaveProperty(
      "impactCount",
      4
    );
  });

  it("should count impacts correctly if binary impacts is empty list", () => {
    expect(
      detectionsSummaryPipe.transform({ ...detections, binaryImpactIds: [] })
    ).toHaveProperty("impactCount", 2);
  });

  it("should count impacts correctly if config impacts is empty list", () => {
    expect(
      detectionsSummaryPipe.transform({
        ...detections,
        configurationImpactIds: [],
      })
    ).toHaveProperty("impactCount", 2);
  });

  it("count of regressions should be the sum of binary and config regression counts", () => {
    expect(detectionsSummaryPipe.transform({ ...detections })).toHaveProperty(
      "regressionCount",
      4
    );
  });

  it("should count regressions correctly if binary regressions is empty list", () => {
    expect(
      detectionsSummaryPipe.transform({
        ...detections,
        binaryRegressionIds: [],
      })
    ).toHaveProperty("regressionCount", 2);
  });

  it("should count regressions correctly if config regressions is empty list", () => {
    expect(
      detectionsSummaryPipe.transform({
        ...detections,
        binaryRegressionIds: [],
      })
    ).toHaveProperty("regressionCount", 2);
  });

  it("should count failure reasons correctly", () => {
    expect(detectionsSummaryPipe.transform({ ...detections })).toHaveProperty(
      "failureReasonCount",
      2
    );
  });

  it("should count number of detections correctly", () => {
    expect(detectionsSummaryPipe.transform(detections)).toEqual({
      impactCount: 4,
      regressionCount: 4,
      failureReasonCount: 2,
    });
  });
});
