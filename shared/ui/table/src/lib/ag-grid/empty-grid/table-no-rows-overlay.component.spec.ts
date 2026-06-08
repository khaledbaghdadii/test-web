import { TableNoRowsOverlayComponent } from "./table-no-rows-overlay.component";
import { INoRowsOverlayParams } from "ag-grid-enterprise";

describe("TableNoRowsOverlayComponent", () => {
  let component: TableNoRowsOverlayComponent;

  beforeEach(() => {
    component = new TableNoRowsOverlayComponent();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have default message", () => {
    expect(component.message).toBe("No rows to display");
  });

  it("should set message from agInit params", () => {
    component.agInit({
      message: "No commits on this branch",
    } as INoRowsOverlayParams & { message?: string });

    expect(component.message).toBe("No commits on this branch");
  });

  it("should keep default message when agInit has no message", () => {
    component.agInit({} as INoRowsOverlayParams);

    expect(component.message).toBe("No rows to display");
  });
});
