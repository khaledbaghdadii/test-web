import {
  EnvironmentStatus,
  EnvironmentStatusComponent,
} from "@mxflow/features/environment";

describe("run environment status component tests", () => {
  let environmentStatusComponent: EnvironmentStatusComponent;
  beforeEach(() => {
    environmentStatusComponent = new EnvironmentStatusComponent();
  });

  it("should return Environment is passed when status is ready", function () {
    environmentStatusComponent.environmentStatus = EnvironmentStatus.READY;
    expect(environmentStatusComponent.isEnvironmentPassed()).toStrictEqual(
      true
    );
  });

  it("should not return Environment is failed when status is null", function () {
    environmentStatusComponent.environmentStatus = null;
    expect(environmentStatusComponent.isEnvironmentFailed()).toStrictEqual(
      false
    );
  });

  it("should return Environment is failed when status is PREPARATION_FAILED", function () {
    environmentStatusComponent.environmentStatus =
      EnvironmentStatus.PREPARATION_FAILED;
    expect(environmentStatusComponent.isEnvironmentFailed()).toStrictEqual(
      true
    );
  });
  it("should return Environment is failed when status is BROKEN", function () {
    environmentStatusComponent.environmentStatus = EnvironmentStatus.BROKEN;
    expect(environmentStatusComponent.isEnvironmentFailed()).toStrictEqual(
      true
    );
  });
  it("should return Environment is failed when status is CONFIG_INVALID", function () {
    environmentStatusComponent.environmentStatus =
      EnvironmentStatus.CONFIG_INVALID;
    expect(environmentStatusComponent.isEnvironmentFailed()).toStrictEqual(
      true
    );
  });
  it("should return Environment is Underway when status is CREATED", function () {
    environmentStatusComponent.environmentStatus = EnvironmentStatus.CREATED;
    expect(environmentStatusComponent.isEnvironmentUnderway()).toStrictEqual(
      true
    );
  });
  it("should return Environment is Underway when status is CONFIG_VALID", function () {
    environmentStatusComponent.environmentStatus =
      EnvironmentStatus.CONFIG_VALID;
    expect(environmentStatusComponent.isEnvironmentUnderway()).toStrictEqual(
      true
    );
  });
  it("should return Environment is Underway when status is PREPARING", function () {
    environmentStatusComponent.environmentStatus = EnvironmentStatus.PREPARING;
    expect(environmentStatusComponent.isEnvironmentUnderway()).toStrictEqual(
      true
    );
  });
  it("should return Environment is Underway when status is EXECUTING", function () {
    environmentStatusComponent.environmentStatus = EnvironmentStatus.EXECUTING;
    expect(environmentStatusComponent.isEnvironmentUnderway()).toStrictEqual(
      true
    );
  });
  it("should return Environment is Neutral when status is CLEANED", function () {
    environmentStatusComponent.environmentStatus = EnvironmentStatus.CLEANED;
    expect(environmentStatusComponent.isEnvironmentNeutral()).toStrictEqual(
      true
    );
  });
  it("should return Environment is Neutral when status is CLEANING", function () {
    environmentStatusComponent.environmentStatus = EnvironmentStatus.CLEANING;
    expect(environmentStatusComponent.isEnvironmentNeutral()).toStrictEqual(
      true
    );
  });
  it("should return Environment is Neutral when status is CLEAN_FAILED", function () {
    environmentStatusComponent.environmentStatus =
      EnvironmentStatus.CLEAN_FAILED;
    expect(environmentStatusComponent.isEnvironmentNeutral()).toStrictEqual(
      true
    );
  });
  it("should return Environment Not Valid Status when environment is none of passed, failed, neutral or underway", function () {
    environmentStatusComponent.isEnvironmentPassed = jest.fn(() => false);
    environmentStatusComponent.isEnvironmentFailed = jest.fn(() => false);
    environmentStatusComponent.isEnvironmentNeutral = jest.fn(() => false);
    environmentStatusComponent.isEnvironmentUnderway = jest.fn(() => false);
    expect(environmentStatusComponent.isNotValidStatus()).toStrictEqual(true);
  });
});
