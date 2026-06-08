import { ToastMessageService } from "@mxflow/ui/alert";
import { LinkConfigurationRegressionModalContentComponent } from "./link-configuration-regression-modal-content.component";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { signal } from "@angular/core";
import { fakeAsync, tick } from "@angular/core/testing";
import { of, Subject, throwError } from "rxjs";
import {
  AnalysisObjectSelectionType,
  ConfigurationRegressionLinkingStateService,
} from "@mxflow/features/analysis-objects";
import { LiteConfigurationRegression } from "../model/lite-configuration-regression.model";
import { CreateConfigurationRegressionButtonComponent } from "../create-configuration-regression-button/create-configuration-regression-button.component";
import { DomTestUtils } from "@mxevolve/testing";

const CONFIGURATION_REGRESSION_ID = "configurationRegressionId";
const CREATE_REGRESSION_RESPONSE = { id: CONFIGURATION_REGRESSION_ID };
describe("LinkConfigurationRegressionModalContentComponent", () => {
  let component: LinkConfigurationRegressionModalContentComponent;
  let fixture: MockedComponentFixture<LinkConfigurationRegressionModalContentComponent>;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let configurationRegressionLinkingStateService: jest.Mocked<ConfigurationRegressionLinkingStateService>;

  beforeEach(async () => {
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    configurationRegressionLinkingStateService = {
      isCreating: signal(false),
      isLinking: signal(false),
      setIsCreating: jest.fn(),
      setIsLinking: jest.fn(),
      reset: jest.fn(),
    } as unknown as jest.Mocked<ConfigurationRegressionLinkingStateService>;

    await MockBuilder(LinkConfigurationRegressionModalContentComponent)
      .mock(ToastMessageService, toastMessageService)
      .mock(
        ConfigurationRegressionLinkingStateService,
        configurationRegressionLinkingStateService
      );

    fixture = MockRender(LinkConfigurationRegressionModalContentComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
  it("refresh should be behavioural subject with false initial value", (done) => {
    component.refresh$.subscribe((refresh) => {
      expect(refresh).toBeFalsy();
      done();
    });
  });
  describe("on isLinking signal change", () => {
    it("should emit a refresh event when isLinking changes to true", fakeAsync(() => {
      const refreshSpy = jest.spyOn(component.refresh$, "next");
      configurationRegressionLinkingStateService.isLinking.set(true);
      tick();
      fixture.detectChanges();
      expect(refreshSpy).toHaveBeenCalledWith(true);
    }));

    it("should not emit a refresh event when isLinking changes to false", fakeAsync(() => {
      const refreshSpy = jest.spyOn(component.refresh$, "next");
      configurationRegressionLinkingStateService.isLinking.set(true);
      configurationRegressionLinkingStateService.isLinking.set(false);
      tick();
      fixture.detectChanges();
      expect(refreshSpy).not.toHaveBeenCalled();
    }));

    it("should not refresh when linking is true and the component is destroyed", fakeAsync(() => {
      const refreshSpy = jest.spyOn(component.refresh$, "next");
      component.ngOnDestroy();
      configurationRegressionLinkingStateService.isLinking.set(true);
      tick();
      fixture.detectChanges();
      expect(refreshSpy).not.toHaveBeenCalled();
    }));
  });

  describe("onConfigurationRegressionSelectionChange", () => {
    it("should emit the selected configuration regressions", () => {
      const emitSpy = jest.spyOn(
        component.selectedConfigurationRegressionsChange,
        "emit"
      );
      const selectedRegressions = [
        {
          analysisObject: {
            id: CONFIGURATION_REGRESSION_ID,
          } as LiteConfigurationRegression,
          selectionType: AnalysisObjectSelectionType.FULL,
        },
      ];
      component.onConfigurationRegressionSelectionChange(selectedRegressions);
      expect(emitSpy).toHaveBeenCalledWith(selectedRegressions);
    });

    it("should be called whenever configuration regressions change", () => {
      const selectedRegressions = [CONFIGURATION_REGRESSION_ID];
      const handlerSpy = jest.spyOn(
        component,
        "onConfigurationRegressionSelectionChange"
      );
      const outputEmitter = ngMocks.output(
        "mxevolve-configuration-regressions-selection-table",
        "selectedConfigurationRegressionsChange"
      );
      outputEmitter.emit(selectedRegressions);
      expect(handlerSpy).toHaveBeenCalledWith(selectedRegressions);
    });
  });

  describe("on configuration regression creation modal opened", () => {
    it("should set isCreating to true", fakeAsync(() => {
      emitConfigurationRegressionCreationModalOpenedEvent();
      tick();
      expect(
        configurationRegressionLinkingStateService.setIsCreating
      ).toHaveBeenCalledWith(true);
    }));

    it("should set isLinking to false", () => {
      emitConfigurationRegressionCreationModalOpenedEvent();
      expect(
        configurationRegressionLinkingStateService.setIsLinking
      ).toHaveBeenCalledWith(false);
    });
  });

  describe("on configuration regression modal closed", () => {
    it("should update the isLinking and isCreating signals if we are creating", () => {
      configurationRegressionLinkingStateService.isCreating.set(true);
      configurationRegressionLinkingStateService.isLinking.set(false);
      emitConfigurationRegressionCreationModalClosedEvent();
      expect(
        configurationRegressionLinkingStateService.setIsLinking
      ).toHaveBeenCalled();
      expect(
        configurationRegressionLinkingStateService.setIsCreating
      ).toHaveBeenCalled();
    });

    it("should update the isLinking and isCreating signals if we are linking", () => {
      configurationRegressionLinkingStateService.isCreating.set(false);
      configurationRegressionLinkingStateService.isLinking.set(true);
      emitConfigurationRegressionCreationModalClosedEvent();
      expect(
        configurationRegressionLinkingStateService.setIsLinking
      ).toHaveBeenCalled();
      expect(
        configurationRegressionLinkingStateService.setIsCreating
      ).toHaveBeenCalled();
    });

    it("should not update the isLinking and isCreating signals if we are not creating or linking", () => {
      configurationRegressionLinkingStateService.isCreating.set(false);
      configurationRegressionLinkingStateService.isLinking.set(false);
      emitConfigurationRegressionCreationModalClosedEvent();
      expect(
        configurationRegressionLinkingStateService.setIsLinking
      ).not.toHaveBeenCalled();
      expect(
        configurationRegressionLinkingStateService.setIsCreating
      ).not.toHaveBeenCalled();
    });

    it("should set isCreating to false", () => {
      configurationRegressionLinkingStateService.isCreating.set(true);
      configurationRegressionLinkingStateService.isLinking.set(true);
      emitConfigurationRegressionCreationModalClosedEvent();
      expect(
        configurationRegressionLinkingStateService.setIsCreating
      ).toHaveBeenCalledWith(false);
    });

    it("should set isLinking to true", () => {
      configurationRegressionLinkingStateService.isCreating.set(true);
      configurationRegressionLinkingStateService.isLinking.set(true);
      emitConfigurationRegressionCreationModalClosedEvent();
      expect(
        configurationRegressionLinkingStateService.setIsLinking
      ).toHaveBeenCalledWith(true);
    });
  });

  describe("on configuration regression created", () => {
    const createRegressionLink = new Subject<null>();
    const ERROR = "failed";

    it("should links the created regressions", () => {
      component.createRegressionLink = jest.fn(() => of(null));
      emitConfigurationRegressionCreatedEvent();
      expect(component.createRegressionLink).toHaveBeenCalledWith(
        CONFIGURATION_REGRESSION_ID
      );
    });

    it("should display success message on linking successfully", fakeAsync(() => {
      component.createRegressionLink = jest.fn(() => of(null));
      emitConfigurationRegressionCreatedEvent();
      createRegressionLink.next(null);
      createRegressionLink.complete();
      tick();
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "The Configuration Regression was linked successfully."
      );
    }));

    it("should reset the linking state on successful linking", fakeAsync(() => {
      component.createRegressionLink = jest.fn(() => of(null));
      emitConfigurationRegressionCreatedEvent();
      createRegressionLink.next(null);
      createRegressionLink.complete();
      tick();
      expect(
        configurationRegressionLinkingStateService.reset
      ).toHaveBeenCalled();
    }));

    it("should display an error message on failure to link the created regression", fakeAsync(() => {
      component.createRegressionLink = jest.fn(() =>
        throwError(() => new Error(ERROR))
      );
      emitConfigurationRegressionCreatedEvent();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith(
        "The Configuration Regression was created but failed to link. Please try linking it again."
      );
    }));

    it("should set isLinking to true on failure to link", fakeAsync(() => {
      component.createRegressionLink = jest.fn(() =>
        throwError(() => new Error(ERROR))
      );
      emitConfigurationRegressionCreatedEvent();
      tick();
      expect(
        configurationRegressionLinkingStateService.setIsLinking
      ).toHaveBeenCalledWith(true);
    }));

    it("should set isCreating to false on failure to link", fakeAsync(() => {
      component.createRegressionLink = jest.fn(() =>
        throwError(() => new Error(ERROR))
      );
      emitConfigurationRegressionCreatedEvent();
      tick();
      expect(
        configurationRegressionLinkingStateService.setIsCreating
      ).toHaveBeenCalledWith(false);
    }));
  });

  function emitConfigurationRegressionCreatedEvent() {
    getCreateConfigurationRegressionButtonComponent().configurationRegressionCreated.emit(
      CREATE_REGRESSION_RESPONSE
    );
  }

  function emitConfigurationRegressionCreationModalOpenedEvent() {
    getCreateConfigurationRegressionButtonComponent().configurationRegressionCreationModalOpened.emit();
  }

  function emitConfigurationRegressionCreationModalClosedEvent() {
    getCreateConfigurationRegressionButtonComponent().configurationRegressionCreationModalClosed.emit();
  }

  function getCreateConfigurationRegressionButtonComponent(): CreateConfigurationRegressionButtonComponent {
    return DomTestUtils.getElementByType(
      fixture,
      CreateConfigurationRegressionButtonComponent
    ).getInstance();
  }
});
