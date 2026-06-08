import { LinkedBinaryRegressionDetailsTableComponent } from "./linked-binary-regression-details-table.component";

describe("linked binary regression details table", () => {
  let component: LinkedBinaryRegressionDetailsTableComponent;

  beforeEach(() => {
    component = new LinkedBinaryRegressionDetailsTableComponent();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit unlink request on unlinkBinaryRegression", () => {
    const id = "1";
    jest.spyOn(component.unlinkRegressionRequestEvent, "emit");
    component.onUnlink(id);
    expect(component.unlinkRegressionRequestEvent.emit).toHaveBeenCalledWith(
      id
    );
  });
});
