/* tslint:disable:no-unused-variable */

import { FailureReasonsPageComponent } from "./failure-reasons-page.component";
import { of, throwError } from "rxjs";
import { CreateFailureReasonRequest } from "../create-failure-reason-modal/create-failure-reason-request";
import { FailureReasonTableData } from "../failure-reasons-table/failure-reasons-table.component";
import { FailureReasonsDataService } from "../failure-reasons-data.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ComponentFixture, TestBed } from "@angular/core/testing";

describe("FailureReasonsPageComponent", () => {
  let component: FailureReasonsPageComponent;
  let fixture: ComponentFixture<FailureReasonsPageComponent>;
  let dataServiceMock: FailureReasonsDataService;
  let toastMessageService: ToastMessageService;

  beforeEach(() => {
    dataServiceMock = {
      getFailureReasons: jest.fn(() => of({})),
      createFailureReason: jest.fn(() => of({})),
      toggleFailureReasonActivation: jest.fn(() => of({})),
    } as unknown as FailureReasonsDataService;
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as ToastMessageService;
    TestBed.configureTestingModule({
      imports: [FailureReasonsPageComponent],
    }).overrideComponent(FailureReasonsPageComponent, {
      set: {
        providers: [
          {
            provide: FailureReasonsDataService,
            useValue: dataServiceMock,
          },
          {
            provide: ToastMessageService,
            useValue: toastMessageService,
          },
        ],
      },
    });
    fixture = TestBed.createComponent(FailureReasonsPageComponent);
    component = fixture.componentInstance;
  });

  it("should initialize data correctly on init", () => {
    const getFailureReasonsSpy = jest.spyOn(
      dataServiceMock,
      "getFailureReasons"
    );
    getFailureReasonsSpy.mockReturnValue(of(TestHelper.getFailureReasons()));

    component.ngOnInit();

    expect(getFailureReasonsSpy).toHaveBeenCalledTimes(1);
    expect(component.failureReasonsTableData).toEqual(
      TestHelper.getFailureReasons()
    );
  });

  it("should handle error correctly on init", () => {
    const getFailureReasonsSpy = jest.spyOn(
      dataServiceMock,
      "getFailureReasons"
    );
    getFailureReasonsSpy.mockReturnValue(throwError(() => "FAILED"));

    component.ngOnInit();

    expect(getFailureReasonsSpy).toHaveBeenCalledTimes(1);
    expect(toastMessageService.showError).toHaveBeenCalledWith("FAILED");
  });

  it("should close the modal when receiving a failure reason creation cancelled event", () => {
    component.ngOnInit();
    component.handleFailureReasonCreationCancelled();

    expect(component.isCreateFailureReasonModalShown).toEqual(false);
  });

  it("should close the modal when receiving a failure reason creation submitted event", () => {
    component.ngOnInit();
    component.handleFailureReasonCreationSubmitted(
      TestHelper.buildCreateFailureReasonRequest()
    );

    expect(component.isCreateFailureReasonModalShown).toEqual(false);
  });

  it("should display message when failure reason is created successfully", () => {
    component.ngOnInit();
    component.handleFailureReasonCreationSubmitted(
      TestHelper.buildCreateFailureReasonRequest()
    );

    expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
      "Failure reason added successfully!"
    );
  });

  it("should handle the failure creation correctly", () => {
    component.ngOnInit();
    component.handleFailureReasonCreationSubmitted(
      TestHelper.buildCreateFailureReasonRequest()
    );

    expect(dataServiceMock.createFailureReason).toHaveBeenCalledTimes(1);
    expect(dataServiceMock.createFailureReason).toHaveBeenCalledWith(
      TestHelper.buildCreateFailureReasonRequest()
    );
  });

  it("should call the service to edit failure reason correctly", () => {
    component.failureReasonsTableData = TestHelper.getFailureReasons();

    component.switchEnabledValue({ reasonId: "ID", newValue: true });

    expect(dataServiceMock.toggleFailureReasonActivation).toHaveBeenCalledWith(
      "ID",
      true
    );
  });

  it("should handle error when edit failure reason correctly", () => {
    component.failureReasonsTableData = TestHelper.getFailureReasons();

    const toggleFailureReasonActivationSpy = jest.spyOn(
      dataServiceMock,
      "toggleFailureReasonActivation"
    );
    toggleFailureReasonActivationSpy.mockReturnValue(
      throwError(() => "FAILED")
    );

    component.switchEnabledValue({ reasonId: "ID", newValue: true });

    expect(toggleFailureReasonActivationSpy).toHaveBeenCalledWith("ID", true);
    expect(toastMessageService.showError).toHaveBeenCalledWith("FAILED");
  });

  it("should open the create failure reason modal correctly when button is clicked", () => {
    component.ngOnInit();
    component.openCreateFailureReasonModal();

    expect(component.isCreateFailureReasonModalShown).toEqual(true);
  });
});

class TestHelper {
  static getFailureReasons(): FailureReasonTableData[] {
    return [
      {
        id: "ID",
        title: "title",
        description: "DESCRIPTION",
        isEnabled: true,
        isDisabled: false,
        isLoading: false,
      },
    ];
  }

  static buildCreateFailureReasonRequest(): CreateFailureReasonRequest {
    return {
      title: "title",
      description: "description",
      isEnabled: true,
    };
  }
}
