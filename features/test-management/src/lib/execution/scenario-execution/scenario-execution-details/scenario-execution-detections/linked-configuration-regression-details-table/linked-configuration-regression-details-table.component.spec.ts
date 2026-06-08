import { LinkedConfigurationRegressionDetailsTableComponent } from "./linked-configuration-regression-details-table.component";

describe("LinkedConfigurationRegressionDetailsTableComponent", () => {
  let component: LinkedConfigurationRegressionDetailsTableComponent;

  beforeEach(() => {
    component = new LinkedConfigurationRegressionDetailsTableComponent();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit unlink request on unlink a configuration regression", () => {
    const id = "1";
    jest.spyOn(component.unlinkRegressionRequestEvent, "emit");
    component.onUnlink(id);
    expect(component.unlinkRegressionRequestEvent.emit).toHaveBeenCalledWith(
      id
    );
  });
});
