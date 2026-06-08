import { BusinessProcessAlertDisplayComponent } from "@mxflow/features/business-process";

describe("BusinessProcessAlertDisplayComponent", () => {
  let businessProcessAlertDisplayComponent: BusinessProcessAlertDisplayComponent;

  beforeEach(() => {
    businessProcessAlertDisplayComponent =
      new BusinessProcessAlertDisplayComponent();
  });

  it("given that the process exceeds its expiry date, and that it is still active, then the system should display a banner indicating that the process has reached its expiry date", () => {
    businessProcessAlertDisplayComponent.expiryDate = "2020-06-10T00:00:00Z";

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2030-10-01T10:00:00Z"));

    const result = businessProcessAlertDisplayComponent.getExpiryResult();

    expect(result).toEqual(true);
  });

  it("given that the process is active and has not yet reached its expiry date, then the system should not display a banner indicating that the process has reached its expiry date", () => {
    businessProcessAlertDisplayComponent.expiryDate = "2031-06-10T00:00:00Z";

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2030-10-01T10:00:00Z"));

    const result = businessProcessAlertDisplayComponent.getExpiryResult();

    expect(result).toEqual(false);
  });

  test.each([
    {
      expiryDate: "2021-06-10T00:00:00.000Z",
      endDate: "2021-06-10T00:00:00.001Z",
      testName:
        "given that the process finished execution and it exceeded its expiry date in milliseconds, then the system should display a banner indicating that the process has reached its expiry date",
    },
    {
      expiryDate: "2020-06-10T00:00:00.000Z",
      endDate: "2021-06-10T00:00:00.001Z",
      testName:
        "given that the process finished execution and it exceeded its expiry date, then the system should display a banner indicating that the process has reached its expiry date",
    },
  ])("$testName", ({ expiryDate, endDate }) => {
    businessProcessAlertDisplayComponent.expiryDate = expiryDate;
    businessProcessAlertDisplayComponent.endDate = endDate;

    const result = businessProcessAlertDisplayComponent.getExpiryResult();

    expect(result).toEqual(true);
  });

  it("given that the process finished before reaching its expiry date, then the system should not display a banner indicating that the process has reached its expiry date", () => {
    businessProcessAlertDisplayComponent.expiryDate = "2022-06-10T00:00:00Z";
    businessProcessAlertDisplayComponent.endDate = "2021-06-10T00:00:00Z";

    const result = businessProcessAlertDisplayComponent.getExpiryResult();

    expect(result).toEqual(false);
  });

  it("given that the process does not have an expiry date, then the system should not display a banner indicating that the process has reached its expiry date", () => {
    businessProcessAlertDisplayComponent.endDate = "2021-06-10T00:00:00Z";

    const result = businessProcessAlertDisplayComponent.getExpiryResult();

    expect(result).toEqual(false);
  });
});
