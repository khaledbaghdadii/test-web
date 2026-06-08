import { ToastMessageService } from "@mxflow/ui/alert";
import { LinkBinaryImpactModalContentComponent } from "./link-binary-impact-modal-content.component";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { signal, Type } from "@angular/core";
import { fakeAsync, tick } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { of, Subject, throwError } from "rxjs";
import {
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
  BinaryImpactLinkingStateService,
} from "@mxflow/features/analysis-objects";
import {
  CreateBinaryImpactButtonComponent,
  LiteBinaryImpact,
} from "@mxflow/features/failure-management";
import { FormsModule } from "@angular/forms";
import {
  ShowDetectionWithNoDefectsToggleComponent,
  ValidationScope,
  ValidationScopeSetterComponent,
} from "@mxflow/features/validation-management";
import { DomTestUtils } from "@mxevolve/testing";

const WARNING_MESSAGE = "Warning message";
const PROJECT_ID = "projectId";
const BINARY_IMPACT_ID = "binaryImpactId";
const BINARY_IMPACT_TITLE = "title";
const BINARY_IMPACT_MX_VERSION = "mxVersion";
const UPGRADE_IMPACT_ID = "upgradeImpactId";
const UPGRADE_IMPACT_EXTERNAL_ISSUE_ID = "upgradeImpactExternalIssueId";
const UPGRADE_IMPACT_EXTERNAL_ISSUE_LINK = "upgradeImpactExternalIssueLink";
const BINARY_IMPACT_OWNER = "owner";

function getFullySelectedBinaryImpact(
  binaryImpact: LiteBinaryImpact
): AnalysisObjectSelectionState<LiteBinaryImpact> {
  return {
    analysisObject: binaryImpact,
    selectionType: AnalysisObjectSelectionType.FULL,
  };
}

function getLiteBinaryImpact(): LiteBinaryImpact {
  return {
    id: BINARY_IMPACT_ID,
    owner: BINARY_IMPACT_OWNER,
    title: BINARY_IMPACT_TITLE,
    projectId: PROJECT_ID,
    mxVersion: BINARY_IMPACT_MX_VERSION,
    upgradeImpact: {
      id: UPGRADE_IMPACT_ID,
      externalIssue: {
        id: UPGRADE_IMPACT_EXTERNAL_ISSUE_ID,
        link: UPGRADE_IMPACT_EXTERNAL_ISSUE_LINK,
      },
    },
  };
}

function getValidationScope(): ValidationScope {
  return {
    currentVersion: "currentVersion",
    referenceVersion: "referenceVersion",
  } as ValidationScope;
}
describe("LinkBinaryImpactModalContentComponent", () => {
  let component: LinkBinaryImpactModalContentComponent;
  let fixture: MockedComponentFixture<LinkBinaryImpactModalContentComponent>;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let analysisObjectLinkingStateService: jest.Mocked<BinaryImpactLinkingStateService>;

  beforeEach(async () => {
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    analysisObjectLinkingStateService = {
      isCreating: signal(false),
      isLinking: signal(false),
      setIsCreating: jest.fn(),
      setIsLinking: jest.fn(),
      reset: jest.fn(),
    } as unknown as jest.Mocked<BinaryImpactLinkingStateService>;

    await MockBuilder(LinkBinaryImpactModalContentComponent)
      .mock(ToastMessageService, toastMessageService)
      .mock(BinaryImpactLinkingStateService, analysisObjectLinkingStateService)
      .mock(ShowDetectionWithNoDefectsToggleComponent)
      .keep(FormsModule);
    fixture = MockRender(LinkBinaryImpactModalContentComponent);
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
    it("should not display the warning message template when warning message is undefined", () => {
      component.warningMessage = undefined;
      fixture.detectChanges();
      const warningMessageElement = fixture.debugElement.query(
        By.css('[data-testid="warning-message"]')
      );
      expect(warningMessageElement).toBeNull();
    });

    it("should display the warning message template when warning message has a value", () => {
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
        By.css('[data-testid="binary-impact-selection-table"]')
      );
      selectionTableElement.triggerEventHandler(
        "warningMessageChange",
        WARNING_MESSAGE
      );
      fixture.detectChanges();
      expect(handleWarningMessageSpy).toHaveBeenCalledWith(WARNING_MESSAGE);
    });
  });

  it("refresh should be behavioural subject with false initial value", (done) => {
    component.refresh$.subscribe((refresh) => {
      expect(refresh).toBeFalsy();
      done();
    });
  });

  describe("show impacts with no defects", () => {
    it("should default show impacts with no defects signal to false", () => {
      expect(component.showImpactsWithoutDefects()).toBeFalsy();
    });
  });

  describe("handle validation scope setter changes", () => {
    it("should show the validation scope setter", () => {
      expect(getComponent(ValidationScopeSetterComponent)).toBeTruthy();
    });

    it("should update validation scope when changed by setter component", () => {
      expect(component.validationScope()).toBeFalsy();
      getComponent(ValidationScopeSetterComponent).validationScopeChange.emit(
        getValidationScope()
      );
      expect(component.validationScope()).toEqual(getValidationScope());
    });
  });

  describe("on isLinking signal change", () => {
    it("should emit a refresh event when isLinking changes to true", fakeAsync(() => {
      const refreshSpy = jest.spyOn(component.refresh$, "next");
      analysisObjectLinkingStateService.isLinking.set(true);
      tick();
      fixture.detectChanges();
      expect(refreshSpy).toHaveBeenCalledWith(true);
    }));

    it("should not emit a refresh event when isLinking changes to false", fakeAsync(() => {
      const refreshSpy = jest.spyOn(component.refresh$, "next");
      analysisObjectLinkingStateService.isLinking.set(true);
      analysisObjectLinkingStateService.isLinking.set(false);
      tick();
      fixture.detectChanges();
      expect(refreshSpy).not.toHaveBeenCalled();
    }));

    it("should not refresh when linking is true and the component is destroyed", fakeAsync(() => {
      const refreshSpy = jest.spyOn(component.refresh$, "next");
      component.ngOnDestroy();
      analysisObjectLinkingStateService.isLinking.set(true);
      tick();
      fixture.detectChanges();
      expect(refreshSpy).not.toHaveBeenCalled();
    }));
  });

  describe("onBinaryImpactSelectionChange", () => {
    it("should emit the selected binary impacts", () => {
      const emitSpy = jest.spyOn(component.selectedBinaryImpactsChange, "emit");
      const selectedImpacts = [
        getFullySelectedBinaryImpact(getLiteBinaryImpact()),
      ];
      component.onBinaryImpactSelectionChange(selectedImpacts);
      expect(emitSpy).toHaveBeenCalledWith(selectedImpacts);
    });

    it("should be called on selectedBinaryImpactsChange event", () => {
      const selectedImpacts = [getLiteBinaryImpact()];
      const handlerSpy = jest.spyOn(component, "onBinaryImpactSelectionChange");
      const outputEmitter = ngMocks.output(
        "mxevolve-binary-impacts-selection-table",
        "selectedBinaryImpactsChange"
      );
      outputEmitter.emit(selectedImpacts);
      expect(handlerSpy).toHaveBeenCalledWith(selectedImpacts);
    });
  });

  describe("on binary impact creation modal opened", () => {
    it("should set isCreating to true", () => {
      emitBinaryImpactCreationModalOpenedEvent();
      expect(
        analysisObjectLinkingStateService.setIsCreating
      ).toHaveBeenCalledWith(true);
    });

    it("should set isLinking to false", () => {
      emitBinaryImpactCreationModalOpenedEvent();
      expect(
        analysisObjectLinkingStateService.setIsLinking
      ).toHaveBeenCalledWith(false);
    });
  });

  describe("on create binary impact modal closed", () => {
    it("should update the isLinking and isCreating signals if we are creating", () => {
      analysisObjectLinkingStateService.isCreating.set(true);
      analysisObjectLinkingStateService.isLinking.set(false);
      emitBinaryImpactCreationModalClosedEvent();
      expect(analysisObjectLinkingStateService.setIsLinking).toHaveBeenCalled();
      expect(
        analysisObjectLinkingStateService.setIsCreating
      ).toHaveBeenCalled();
    });

    it("should update the isLinking and isCreating signals if we are linking", () => {
      analysisObjectLinkingStateService.isCreating.set(false);
      analysisObjectLinkingStateService.isLinking.set(true);
      emitBinaryImpactCreationModalClosedEvent();
      expect(analysisObjectLinkingStateService.setIsLinking).toHaveBeenCalled();
      expect(
        analysisObjectLinkingStateService.setIsCreating
      ).toHaveBeenCalled();
    });

    it("should not update the isLinking and isCreating signals if we are not creating or linking", () => {
      analysisObjectLinkingStateService.isCreating.set(false);
      analysisObjectLinkingStateService.isLinking.set(false);
      emitBinaryImpactCreationModalClosedEvent();
      expect(
        analysisObjectLinkingStateService.setIsLinking
      ).not.toHaveBeenCalled();
      expect(
        analysisObjectLinkingStateService.setIsCreating
      ).not.toHaveBeenCalled();
    });

    it("should set isCreating to false", () => {
      analysisObjectLinkingStateService.isCreating.set(true);
      analysisObjectLinkingStateService.isLinking.set(true);
      emitBinaryImpactCreationModalClosedEvent();
      expect(
        analysisObjectLinkingStateService.setIsCreating
      ).toHaveBeenCalledWith(false);
    });

    it("should set isLinking to true", () => {
      analysisObjectLinkingStateService.isCreating.set(true);
      analysisObjectLinkingStateService.isLinking.set(true);
      emitBinaryImpactCreationModalClosedEvent();
      expect(
        analysisObjectLinkingStateService.setIsLinking
      ).toHaveBeenCalledWith(true);
    });
  });

  describe("on binary impact created", () => {
    const createImpactLink = new Subject<null>();
    const ERROR = "failed";

    const throwErrorImplementation = () => throwError(() => new Error(ERROR));

    it("should links the created impact", () => {
      component.createImpactLink = jest.fn(() => of(null));
      emitBinaryImpactCreatedEvent();

      expect(component.createImpactLink).toHaveBeenCalledWith(BINARY_IMPACT_ID);
    });

    it("should display success message on linking successfully", fakeAsync(() => {
      component.createImpactLink = jest.fn(() => of(null));
      emitBinaryImpactCreatedEvent();

      createImpactLink.next(null);
      createImpactLink.complete();
      tick();
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "The Binary Impact was linked successfully."
      );
    }));

    it("should reset the linking state on successful linking", fakeAsync(() => {
      component.createImpactLink = jest.fn(() => of(null));
      emitBinaryImpactCreatedEvent();

      createImpactLink.next(null);
      createImpactLink.complete();
      tick();
      expect(analysisObjectLinkingStateService.reset).toHaveBeenCalled();
    }));

    it("should display an error message on failure to link the created impact", fakeAsync(() => {
      component.createImpactLink = jest.fn(throwErrorImplementation);
      emitBinaryImpactCreatedEvent();

      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith(
        "The Binary Impact was created but failed to link. Please try linking it again."
      );
    }));

    it("should set isLinking to true on failure to link", fakeAsync(() => {
      component.createImpactLink = jest.fn(throwErrorImplementation);
      emitBinaryImpactCreatedEvent();

      tick();
      expect(
        analysisObjectLinkingStateService.setIsLinking
      ).toHaveBeenCalledWith(true);
    }));

    it("should set isCreating to false on failure to link", fakeAsync(() => {
      component.createImpactLink = jest.fn(throwErrorImplementation);
      emitBinaryImpactCreatedEvent();
      tick();
      expect(
        analysisObjectLinkingStateService.setIsCreating
      ).toHaveBeenCalledWith(false);
    }));
  });

  function emitBinaryImpactCreatedEvent() {
    getCreateBinaryImpactButtonComponent().binaryImpactCreated.emit({
      id: BINARY_IMPACT_ID,
    });
  }

  function emitBinaryImpactCreationModalOpenedEvent() {
    getCreateBinaryImpactButtonComponent().binaryImpactCreationModalOpened.emit();
  }

  function emitBinaryImpactCreationModalClosedEvent() {
    getCreateBinaryImpactButtonComponent().binaryImpactCreationModalClosed.emit();
  }

  function getCreateBinaryImpactButtonComponent(): CreateBinaryImpactButtonComponent {
    return getComponent(CreateBinaryImpactButtonComponent);
  }

  function getComponent<S>(type: Type<S>) {
    return DomTestUtils.getElementByType(fixture, type).getInstance();
  }
});
