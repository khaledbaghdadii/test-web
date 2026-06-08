import { AnalysisObjectType } from "../analysis-object-type";
import { AnalysisObjectTypeDisplayPipe } from "./analysis-object-type-display.pipe";

describe("Analysis object type display pipe", () => {
  const pipe: AnalysisObjectTypeDisplayPipe =
    new AnalysisObjectTypeDisplayPipe();

  it("should return the binary regression display name correctly", () => {
    expect(pipe.transform(AnalysisObjectType.BINARY_REGRESSION)).toEqual(
      "Binary Regression"
    );
  });

  it("should return the binary impact display name correctly", () => {
    expect(pipe.transform(AnalysisObjectType.BINARY_IMPACT)).toEqual(
      "Binary Impact"
    );
  });

  it("should return the configuration regression display name correctly", () => {
    expect(pipe.transform(AnalysisObjectType.CONFIGURATION_REGRESSION)).toEqual(
      "Configuration Regression"
    );
  });

  it("should return the configuration impact display name correctly", () => {
    expect(pipe.transform(AnalysisObjectType.CONFIGURATION_IMPACT)).toEqual(
      "Configuration Impact"
    );
  });

  it("should return the failure reason display name correctly", () => {
    expect(pipe.transform(AnalysisObjectType.FAILURE_REASON)).toEqual(
      "Reason of Failure"
    );
  });

  it("should return the incident display name correctly", () => {
    expect(pipe.transform(AnalysisObjectType.INCIDENT)).toEqual("Incident");
  });

  it("should throw an error if the type is not supported", () => {
    expect(() => pipe.transform("unknown" as AnalysisObjectType)).toThrow(
      "Analysis object type not supported"
    );
  });
});
