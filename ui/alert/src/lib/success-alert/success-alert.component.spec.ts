import { SuccessAlertComponent } from "@mxflow/ui/alert";
import { EventEmitter } from "@angular/core";

describe("success alert component test", () => {
  let component: SuccessAlertComponent;
  beforeEach(() => {
    component = new SuccessAlertComponent();
  });

  it("should emit an event upon closing the message", () => {
    component.closeSuccessAlert = {
      emit: jest.fn(),
    } as unknown as EventEmitter<any>;

    component.afterClose();

    expect(component.closeSuccessAlert.emit).toHaveBeenCalled();
  });
});
