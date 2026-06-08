import {
  FinalProductFailure,
  FinalProductPublishing,
  FinalProductPublishingComponent,
} from "@mxflow/features/business-process";
import { ToastMessageService } from "@mxflow/ui/alert";

const finalProductPublishing: FinalProductPublishing = {
  id: "id",
  publishingEndDate: "endDate",
  publishingStartDate: "startDate",
};

describe("Final Product Detail Component Test", () => {
  let toastMessageService: ToastMessageService;
  let component: FinalProductPublishingComponent;

  beforeEach(() => {
    toastMessageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    component = new FinalProductPublishingComponent(toastMessageService);

    component.finalProductPublishing = finalProductPublishing;
  });

  it("should return true when failing to request publishing a final product", () => {
    component.finalProductPublishing = {
      id: "id",
      finalProductFailure: FinalProductFailure.FAILURE_PRE_PUBLISHING_REQUESTED,
      publishingEndDate: "end",
      publishingStartDate: "start",
    };

    expect(component.didFailToRequestPublishingFinalProduct()).toEqual(true);
  });

  it("should return when the publishing process has started but the requesting to publish final product has not been requested", () => {
    component.finalProductPublishing = {
      id: "",
      publishingEndDate: "end",
      publishingStartDate: "start",
    };

    expect(component.awaitingToRequestPublishing()).toEqual(true);
  });

  it("should call message service on error", () => {
    component.onError("error");

    expect(toastMessageService.showError).toHaveBeenCalledWith("error");
  });
});
