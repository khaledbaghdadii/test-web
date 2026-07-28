import { BlankLoadingCellRendererComponent } from "./blank-loading-cell-renderer.component";

describe("BlankLoadingCellRendererComponent", () => {
  let component: BlankLoadingCellRendererComponent;

  beforeEach(() => {
    component = new BlankLoadingCellRendererComponent();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should implement agInit without error", () => {
    expect(() => component.agInit()).not.toThrow();
  });
});
