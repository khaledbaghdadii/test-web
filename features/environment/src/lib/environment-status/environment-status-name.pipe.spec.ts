import { EnvironmentStatusNamePipe } from "./environment-status-name.pipe";

describe("environment status pipe", function () {
  const environmentStatusNamePipe = new EnvironmentStatusNamePipe();

  it("should format the string correctly for display", function () {
    expect(environmentStatusNamePipe.transform("STATUS_NAME")).toEqual(
      "Status Name"
    );
  });

  it("should return empty string if the status was null", function () {
    expect(environmentStatusNamePipe.transform(null)).toEqual("");
  });

  it("should return empty string if the status was undefined", function () {
    expect(environmentStatusNamePipe.transform(undefined)).toEqual("");
  });

  it("should return empty string if it was an empty string", function () {
    expect(environmentStatusNamePipe.transform("")).toEqual("");
  });
});
