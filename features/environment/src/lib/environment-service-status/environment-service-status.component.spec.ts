import { EnvironmentServiceStatusComponent } from "./environment-service-status.component";
describe("run environment service status component tests", () => {
  let environmentServiceStatusComponent: EnvironmentServiceStatusComponent;
  beforeEach(() => {
    environmentServiceStatusComponent = new EnvironmentServiceStatusComponent();
  });

  it("should return Environment service is running when status is running", function () {
    environmentServiceStatusComponent.serviceStatus = "Running";
    expect(environmentServiceStatusComponent.isServiceRunning()).toStrictEqual(
      true
    );
  });

  it("should return Environment service is undefined when status is N/A", function () {
    environmentServiceStatusComponent.serviceStatus = "N/A";
    expect(environmentServiceStatusComponent.isNotValidStatus()).toStrictEqual(
      true
    );
  });
});
