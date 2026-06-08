import { LinkBinaryRegressionModalContentComponent } from "./link-binary-regression-modal-content.component";
import { ToastMessageService } from "@mxflow/ui/alert";
import { signal, Type } from "@angular/core";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { fakeAsync, tick } from "@angular/core/testing";
import { LiteBinaryRegression } from "@mxflow/features/failure-management";
import { By } from "@angular/platform-browser";
import { of, Subject, throwError } from "rxjs";
import { BinaryRegressionLinkingStateService } from "@mxflow/features/analysis-objects";
import { BinaryRegressionTestUtils } from "../binary-regression-test-utils";
import { CreateBinaryRegressionButtonComponent } from "../create-binary-regression-button/create-binary-regression-button.component";
import {
  ShowDetectionWithNoDefectsToggleComponent,
  ValidationScope,
  ValidationScopeSetterComponent,
} from "@mxflow/features/validation-management";
import { FormsModule } from "@angular/forms";
import { DomTestUtils } from "@mxevolve/testing";

const BINARY_REGRESSION_ID = "binaryRegressionId";

const WARNING_MESSAGE = "Warning message";
describe("LinkBinaryRegressionModalContentComponent", () => {
  let component: LinkBinaryRegressionModalContentComponent;
  let fixture: MockedComponentFixture<LinkBinaryRegressionModalContentComponent>;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let binaryRegressionLinkingStateService: jest.Mocked<BinaryRegressionLinkingStateService>;

  beforeEach(async () => {
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    binaryRegressionLinkingStateService = {
      isCreating: signal(false),
      isLinking: signal(false),
      setIsCreating: jest.fn(),
      setIsLinking: jest.fn(),
      reset: jest.fn(),
    } as unknown as jest.Mocked<BinaryRegressionLinkingStateService>;

    await MockBuilder(LinkBinaryRegressionModalContentComponent)
      .mock(ShowDetectionWithNoDefectsToggleComponent)
      .keep(FormsModule)
      .mock(ToastMessageService, toastMessageService)
      .mock(
        BinaryRegressionLinkingStateService,
        binaryRegressionLinkingStateService
      );

    fixture = MockRender(LinkBinaryRegressionModalContentComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("handle warning message", () => {
    it("should set the warning value correctly when it exists", () => {
      component.handleWarningMessage(WARNING_MESSAGE);
      fixture.detectChanges();
      expect(component.warningMessage).toBe(WARNING_MESSAGE);
    });
  });

  describe("display warning message template test", () => {
    it("should not display the warning message template when warningMessage is undefined", () => {
      component.warningMessage = undefined;
      fixture.detectChanges();
      const warningMessageElement = fixture.debugElement.query(
        By.css('[data-testid="warning-message"]')
      );
      expect(warningMessageElement).toBeNull();
    });

    it("should display the warning message template when warningMessage has a value", () => {
      component.warningMessage = WARNING_MESSAGE;
      fixture.detectChanges();
      const warningMessageElement = fixture.debugElement.query(
        By.css('[data-testid="warning-message"]')
      );
      expect(warningMessageElement).not.toBeNull();
      expect(warningMessageElement.nativeElement.textContent).toContain(
        WARNING_MESSAGE
      );
    });

    it("should call handleWarningMessage when warningMessage changes from the selection table", () => {
      const handleWarningMessageSpy = jest.spyOn(
        component,
        "handleWarningMessage"
      );

      const selectionTableElement = fixture.debugElement.query(
        By.css('[data-testid="binary-regression-selection-table"]')
      );
      selectionTableElement.triggerEventHandler(
        "warningMessageChange",
        WARNING_MESSAGE
      );
      fixture.detectChanges();
      expect(handleWarningMessageSpy).toHaveBeenCalledWith(WARNING_MESSAGE);
    });
  });

  describe("refresh$", () => {
    it("refresh should be behavioural subject with false initial value", (done) => {
      component.refresh$.subscribe((refresh) => {
        expect(refresh).toBeFalsy();
        done();
      });
    });

    it("should emit a refresh event when isLinking changes to true", fakeAsync(() => {
      const refreshSpy = jest.spyOn(component.refresh$, "next");
      binaryRegressionLinkingStateService.isLinking.set(true);
      tick();
      fixture.detectChanges();
      expect(refreshSpy).toHaveBeenCalledWith(true);
    }));

    it("should not emit a refresh event when isLinking changes to false", fakeAsync(() => {
      const refreshSpy = jest.spyOn(component.refresh$, "next");
      binaryRegressionLinkingStateService.isLinking.set(true);
      binaryRegressionLinkingStateService.isLinking.set(false);
      tick();
      fixture.detectChanges();
      expect(refreshSpy).not.toHaveBeenCalled();
      expect(component.refresh$.closed).toBe(false);
    }));

    it("should not refresh after component is destroyed", () => {
      const refreshSpy = jest.spyOn(component.refresh$, "next");
      component.ngOnDestroy();
      binaryRegressionLinkingStateService.isLinking.set(true);
      fixture.detectChanges();
      expect(refreshSpy).not.toHaveBeenCalled();
    });
  });

  describe("onBinaryRegressionSelectionChange", () => {
    it("should emit the selected binary regressions", () => {
      const selectedRegressions = [
        BinaryRegressionTestUtils.getFullySelectedBinaryRegression(
          BinaryRegressionTestUtils.getLiteBinaryRegression()
        ),
      ];
      const emitSpy = jest.spyOn(
        component.selectedBinaryRegressionsChange,
        "emit"
      );
      component.onBinaryRegressionSelectionChange(selectedRegressions);
      expect(emitSpy).toHaveBeenCalledWith(selectedRegressions);
    });

    it("should be called on selectedBinaryRegressionsChange event", () => {
      const selectedRegressions = getBinaryRegressions();
      const handlerSpy = jest.spyOn(
        component,
        "onBinaryRegressionSelectionChange"
      );
      const outputEmitter = ngMocks.output(
        "mxevolve-binary-regression-selection-table",
        "selectedBinaryRegressionsChange"
      );
      outputEmitter.emit(selectedRegressions);
      expect(handlerSpy).toHaveBeenCalledWith(selectedRegressions);
    });
  });

  describe("on binary regression creation modal opened", () => {
    it("should set isCreating to true", () => {
      emitBinaryRegressionCreationModalOpenedEvent();
      expect(
        binaryRegressionLinkingStateService.setIsCreating
      ).toHaveBeenCalledWith(true);
    });

    it("should set isLinking to false", () => {
      emitBinaryRegressionCreationModalOpenedEvent();
      expect(
        binaryRegressionLinkingStateService.setIsLinking
      ).toHaveBeenCalledWith(false);
    });
  });

  describe("on binary regression creation modal closed", () => {
    it("should update the isLinking and isCreating signals if we are creating", () => {
      binaryRegressionLinkingStateService.isCreating.set(true);
      binaryRegressionLinkingStateService.isLinking.set(false);
      emitBinaryRegressionCreationModalClosedEvent();
      expect(
        binaryRegressionLinkingStateService.setIsLinking
      ).toHaveBeenCalled();
      expect(
        binaryRegressionLinkingStateService.setIsCreating
      ).toHaveBeenCalled();
    });

    it("should update the isLinking and isCreating signals if we are linking", () => {
      binaryRegressionLinkingStateService.isCreating.set(false);
      binaryRegressionLinkingStateService.isLinking.set(true);
      emitBinaryRegressionCreationModalClosedEvent();
      expect(
        binaryRegressionLinkingStateService.setIsLinking
      ).toHaveBeenCalled();
      expect(
        binaryRegressionLinkingStateService.setIsCreating
      ).toHaveBeenCalled();
    });

    it("should not update the isLinking and isCreating signals if we are not creating or linking", () => {
      binaryRegressionLinkingStateService.isCreating.set(false);
      binaryRegressionLinkingStateService.isLinking.set(false);
      emitBinaryRegressionCreationModalClosedEvent();
      expect(
        binaryRegressionLinkingStateService.setIsLinking
      ).not.toHaveBeenCalled();
      expect(
        binaryRegressionLinkingStateService.setIsCreating
      ).not.toHaveBeenCalled();
    });

    it("should set isCreating to false", () => {
      binaryRegressionLinkingStateService.isCreating.set(true);
      binaryRegressionLinkingStateService.isLinking.set(true);
      emitBinaryRegressionCreationModalClosedEvent();
      expect(
        binaryRegressionLinkingStateService.setIsCreating
      ).toHaveBeenCalledWith(false);
    });

    it("should set isLinking to true", () => {
      binaryRegressionLinkingStateService.isCreating.set(true);
      binaryRegressionLinkingStateService.isLinking.set(true);
      emitBinaryRegressionCreationModalClosedEvent();
      expect(
        binaryRegressionLinkingStateService.setIsLinking
      ).toHaveBeenCalledWith(true);
    });
  });

  describe("on binary regression created", () => {
    const createRegressionLink = new Subject<null>();
    const ERROR = "failed";

    it("should link the created regression", () => {
      component.createRegressionLink = jest.fn(() => of(null));
      emitBinaryRegressionCreatedEvent();
      expect(component.createRegressionLink).toHaveBeenCalledWith(
        BINARY_REGRESSION_ID
      );
    });

    it("should display success message on linking successfully", fakeAsync(() => {
      component.createRegressionLink = jest.fn(() => of(null));
      emitBinaryRegressionCreatedEvent();
      createRegressionLink.next(null);
      createRegressionLink.complete();
      tick();
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "The Binary Regression was linked successfully."
      );
    }));

    it("should reset binary regression linking state service on successful linking", fakeAsync(() => {
      component.createRegressionLink = jest.fn(() => of(null));
      emitBinaryRegressionCreatedEvent();
      createRegressionLink.next(null);
      createRegressionLink.complete();
      tick();
      expect(binaryRegressionLinkingStateService.reset).toHaveBeenCalled();
    }));

    it("should display an error message on failure to link the created regression", fakeAsync(() => {
      component.createRegressionLink = jest.fn(() =>
        throwError(() => new Error(ERROR))
      );
      emitBinaryRegressionCreatedEvent();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith(
        "The Binary Regression was created but failed to link. Please try linking it again."
      );
    }));

    it("should set isLinking to true on failure to link", fakeAsync(() => {
      component.createRegressionLink = jest.fn(() =>
        throwError(() => new Error(ERROR))
      );
      emitBinaryRegressionCreatedEvent();
      tick();
      expect(
        binaryRegressionLinkingStateService.setIsLinking
      ).toHaveBeenCalledWith(true);
    }));

    it("should set isCreating to false on failure to link", fakeAsync(() => {
      component.createRegressionLink = jest.fn(() =>
        throwError(() => new Error(ERROR))
      );
      emitBinaryRegressionCreatedEvent();
      tick();
      expect(
        binaryRegressionLinkingStateService.setIsCreating
      ).toHaveBeenCalledWith(false);
    }));
  });

  describe("show binary regressions with no defects", () => {
    it("should default show regressions with no defects signal to false", () => {
      expect(component.showBinaryRegressionsWithoutDefects()).toBeFalsy();
    });
  });

  describe("handle validation scope setter changes", () => {
    it("should update validation scope when the setter changes it", () => {
      expect(component.validationScope()).toBeFalsy();

      getComponent(ValidationScopeSetterComponent).validationScopeChange.emit(
        getValidationScope()
      );
      expect(component.validationScope()).toEqual(getValidationScope());
    });

    it("should show the validation scope setter", () => {
      expect(getComponent(ValidationScopeSetterComponent)).toBeTruthy();
    });
  });

  function getValidationScope(): ValidationScope {
    return {
      currentVersion: "currentVersion",
      referenceVersion: "referenceVersion",
    } as ValidationScope;
  }

  function getBinaryRegressions(): LiteBinaryRegression[] {
    return [getFirstBinaryRegression(), getSecondBinaryRegression()];
  }

  function getFirstBinaryRegression(): LiteBinaryRegression {
    return {
      id: "1",
      title: "title1",
      defect: {
        id: "id",
        link: "link",
      },
      owner: "owner1",
      mxVersion: "mxVersion1",
      fix: "fix1",
    };
  }

  function getSecondBinaryRegression(): LiteBinaryRegression {
    return {
      id: "2",
      title: "title2",
      defect: {
        id: "id",
        link: "link",
      },
      owner: "owner2",
      mxVersion: "mxVersion2",
      fix: "fix2",
    };
  }

  function emitBinaryRegressionCreatedEvent() {
    getCreateBinaryRegressionButtonComponent().binaryRegressionCreated.emit(
      BINARY_REGRESSION_ID
    );
  }

  function emitBinaryRegressionCreationModalOpenedEvent() {
    getCreateBinaryRegressionButtonComponent().binaryRegressionCreationModalOpened.emit();
  }

  function emitBinaryRegressionCreationModalClosedEvent() {
    getCreateBinaryRegressionButtonComponent().binaryRegressionCreationModalClosed.emit();
  }

  function getCreateBinaryRegressionButtonComponent(): CreateBinaryRegressionButtonComponent {
    return getComponent(CreateBinaryRegressionButtonComponent);
  }

  function getComponent<S>(type: Type<S>) {
    return DomTestUtils.getElementByType(fixture, type).getInstance();
  }
});
