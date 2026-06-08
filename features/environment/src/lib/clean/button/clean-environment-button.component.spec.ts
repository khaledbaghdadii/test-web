import { TestBed } from "@angular/core/testing";
import { ConfirmationService } from "primeng/api";
import { of, throwError } from "rxjs";
import { CleanEnvironmentButtonComponent } from "./clean-environment-button.component";
import { EnvironmentCleanService } from "../environment-clean.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ComponentRef } from "@angular/core";

describe("CleanEnvironmentButtonComponent", () => {
  let component: CleanEnvironmentButtonComponent;
  let componentRef: ComponentRef<CleanEnvironmentButtonComponent>;

  let environmentCleanService: Partial<EnvironmentCleanService>;
  let confirmationService: Partial<ConfirmationService>;
  let toastMessageService: Partial<ToastMessageService>;

  beforeEach(() => {
    environmentCleanService = {
      cleanEnvironment: jest.fn().mockReturnValue(of(undefined)),
    };

    confirmationService = {
      confirm: jest.fn(),
      close: jest.fn(),
    };

    toastMessageService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: EnvironmentCleanService,
          useValue: environmentCleanService,
        },
        { provide: ToastMessageService, useValue: toastMessageService },
      ],
    }).overrideComponent(CleanEnvironmentButtonComponent, {
      set: {
        imports: [],
        providers: [
          { provide: ConfirmationService, useValue: confirmationService },
          {
            provide: EnvironmentCleanService,
            useValue: environmentCleanService,
          },
        ],
      },
    });

    componentRef = TestBed.createComponent(
      CleanEnvironmentButtonComponent
    ).componentRef;
    componentRef.setInput("projectId", "projectId");
    componentRef.setInput("environmentId", "environmentId");
    component = componentRef.instance;
  });

  it("should open a confirmation dialog when the clean button is clicked", () => {
    component.handleCleanClicked();

    expect(confirmationService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        header: "Confirmation",
        icon: "pi pi-exclamation-triangle",
        message: `Are you sure you want to clean environment <b>environmentId</b>?`,
      })
    );
  });

  it("should close the confirmation dialog when the clean is rejected", () => {
    component.rejectClean();

    expect(confirmationService.close).toHaveBeenCalled();
  });

  it("should close the confirmation dialog and call the clean service when confirmed", () => {
    component.confirmClean();

    expect(confirmationService.close).toHaveBeenCalled();
    expect(environmentCleanService.cleanEnvironment).toHaveBeenCalledWith(
      "projectId",
      "environmentId"
    );
  });

  it("should show a success toast when the clean succeeds", () => {
    component.confirmClean();

    expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
      "Environment environmentId clean requested successfully."
    );
  });

  it("should show an error toast when the clean fails", () => {
    jest
      .spyOn(environmentCleanService, "cleanEnvironment")
      .mockReturnValue(throwError(() => new Error("Clean failed")));

    component.confirmClean();

    expect(toastMessageService.showError).toHaveBeenCalledWith("Clean failed");
  });
});
