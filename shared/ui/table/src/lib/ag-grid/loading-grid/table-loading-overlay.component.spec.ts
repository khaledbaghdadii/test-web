import { TableLoadingOverlayComponent } from "./table-loading-overlay.component";

describe("TableLoadingOverlayComponent", () => {
  let component: TableLoadingOverlayComponent;

  beforeEach(() => {
    component = new TableLoadingOverlayComponent();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should implement agInit without error", () => {
    expect(() => component.agInit()).not.toThrow();
  });
});
