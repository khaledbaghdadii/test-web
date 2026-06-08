import { LinkConfigurationImpactModalContentComponent } from "./link-configuration-impact-modal-content.component";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
  ConfigurationImpactLinkingStateService,
} from "@mxflow/features/analysis-objects";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { signal } from "@angular/core";
import { fakeAsync, tick } from "@angular/core/testing";
import { LiteConfigurationImpact } from "../model/lite-configuration-impact.model";
import { of, Subject, throwError } from "rxjs";
import { CreateConfigurationImpactButtonComponent } from "../create-configuration-impact-button/create-configuration-impact-button.component";
import { DomTestUtils } from "@mxevolve/testing";

describe("LinkConfigurationImpactModalContentComponent", () => {
  let component: LinkConfigurationImpactModalContentComponent;
  let fixture: MockedComponentFixture<LinkConfigurationImpactModalContentComponent>;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let configurationImpactLinkingStateService: jest.Mocked<ConfigurationImpactLinkingStateService>;

  beforeEach(async () => {
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    configurationImpactLinkingStateService = {
      isCreating: signal(false),
      isLinking: signal(false),
      setIsCreating: jest.fn(),
      setIsLinking: jest.fn(),
      reset: jest.fn(),
    } as unknown as jest.Mocked<ConfigurationImpactLinkingStateService>;

    await MockBuilder(LinkConfigurationImpactModalContentComponent)
      .mock(ToastMessageService, toastMessageService)
      .mock(
        ConfigurationImpactLinkingStateService,
        configurationImpactLinkingStateService
      );

    fixture = MockRender(LinkConfigurationImpactModalContentComponent);
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
      configurationImpactLinkingStateService.isLinking.set(true);
      tick();
      fixture.detectChanges();
      expect(refreshSpy).toHaveBeenCalledWith(true);
    }));

    it("should not emit a refresh event when isLinking changes to false", fakeAsync(() => {
      const refreshSpy = jest.spyOn(component.refresh$, "next");
      configurationImpactLinkingStateService.isLinking.set(true);
      configurationImpactLinkingStateService.isLinking.set(false);
      tick();
      fixture.detectChanges();
      expect(refreshSpy).not.toHaveBeenCalled();
    }));

    it("should not refresh when linking is true and the component is destroyed", fakeAsync(() => {
      const refreshSpy = jest.spyOn(component.refresh$, "next");
      component.ngOnDestroy();
      configurationImpactLinkingStateService.isLinking.set(true);
      tick();
      fixture.detectChanges();
      expect(refreshSpy).not.toHaveBeenCalled();
    }));
  });

  describe("onConfigurationImpactSelectionChange", () => {
    it("should emit the selected configuration impacts", () => {
      const emitSpy = jest.spyOn(
        component.selectedConfigurationImpactsChange,
        "emit"
      );
      const selectedImpacts = [getFullySelectedConfigurationImpact()];
      component.onConfigurationImpactSelectionChange(selectedImpacts);
      expect(emitSpy).toHaveBeenCalledWith(selectedImpacts);
    });

    it("should be called whenever configuration impacts change", () => {
      const selectedImpacts = [CONFIGURATION_IMPACT_ID];
      const handlerSpy = jest.spyOn(
        component,
        "onConfigurationImpactSelectionChange"
      );
      const outputEmitter = ngMocks.output(
        "mxevolve-configuration-impacts-selection-table",
        "selectedConfigurationImpactsChange"
      );
      outputEmitter.emit(selectedImpacts);
      expect(handlerSpy).toHaveBeenCalledWith(selectedImpacts);
    });
  });

  describe("on configuration impact creation modal opened", () => {
    it("should set isCreating to true", fakeAsync(() => {
      emitConfigurationImpactCreationModalOpenedEvent();
      tick();
      expect(
        configurationImpactLinkingStateService.setIsCreating
      ).toHaveBeenCalledWith(true);
    }));

    it("should set isLinking to false", () => {
      emitConfigurationImpactCreationModalOpenedEvent();
      expect(
        configurationImpactLinkingStateService.setIsLinking
      ).toHaveBeenCalledWith(false);
    });
  });

  describe("on configuration impact creation modal closed", () => {
    it("should update the isLinking and isCreating signals if we are creating", () => {
      configurationImpactLinkingStateService.isCreating.set(true);
      configurationImpactLinkingStateService.isLinking.set(false);
      emitConfigurationImpactCreationModalClosedEvent();
      expect(
        configurationImpactLinkingStateService.setIsLinking
      ).toHaveBeenCalled();
      expect(
        configurationImpactLinkingStateService.setIsCreating
      ).toHaveBeenCalled();
    });

    it("should update the isLinking and isCreating signals if we are linking", () => {
      configurationImpactLinkingStateService.isCreating.set(false);
      configurationImpactLinkingStateService.isLinking.set(true);
      emitConfigurationImpactCreationModalClosedEvent();
      expect(
        configurationImpactLinkingStateService.setIsLinking
      ).toHaveBeenCalled();
      expect(
        configurationImpactLinkingStateService.setIsCreating
      ).toHaveBeenCalled();
    });

    it("should not update the isLinking and isCreating signals if we are not creating or linking", () => {
      configurationImpactLinkingStateService.isCreating.set(false);
      configurationImpactLinkingStateService.isLinking.set(false);
      emitConfigurationImpactCreationModalClosedEvent();
      expect(
        configurationImpactLinkingStateService.setIsLinking
      ).not.toHaveBeenCalled();
      expect(
        configurationImpactLinkingStateService.setIsCreating
      ).not.toHaveBeenCalled();
    });

    it("should set isCreating to false", () => {
      configurationImpactLinkingStateService.isCreating.set(true);
      configurationImpactLinkingStateService.isLinking.set(true);
      emitConfigurationImpactCreationModalClosedEvent();
      expect(
        configurationImpactLinkingStateService.setIsCreating
      ).toHaveBeenCalledWith(false);
    });

    it("should set isLinking to true", () => {
      configurationImpactLinkingStateService.isCreating.set(true);
      configurationImpactLinkingStateService.isLinking.set(true);
      emitConfigurationImpactCreationModalClosedEvent();
      expect(
        configurationImpactLinkingStateService.setIsLinking
      ).toHaveBeenCalledWith(true);
    });
  });

  describe("on configuration impact created", () => {
    const createImpactLink = new Subject<null>();
    const ERROR = "failed";

    it("should links the created impacts", () => {
      component.createImpactLink = jest.fn(() => of(null));
      emitConfigurationImpactCreatedEvent();
      expect(component.createImpactLink).toHaveBeenCalledWith(
        CONFIGURATION_IMPACT_ID
      );
    });

    it("should display success message on linking successfully", fakeAsync(() => {
      component.createImpactLink = jest.fn(() => of(null));
      emitConfigurationImpactCreatedEvent();
      createImpactLink.next(null);
      createImpactLink.complete();
      tick();
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "The Configuration Impact was linked successfully."
      );
    }));

    it("should reset the linking state on successful linking", fakeAsync(() => {
      component.createImpactLink = jest.fn(() => of(null));
      emitConfigurationImpactCreatedEvent();
      createImpactLink.next(null);
      createImpactLink.complete();
      tick();
      expect(configurationImpactLinkingStateService.reset).toHaveBeenCalled();
    }));

    it("should display an error message on failure to link the created impact", fakeAsync(() => {
      component.createImpactLink = jest.fn(() =>
        throwError(() => new Error(ERROR))
      );
      emitConfigurationImpactCreatedEvent();
      tick();
      expect(toastMessageService.showError).toHaveBeenCalledWith(
        "The Configuration Impact was created but failed to link. Please try linking it again."
      );
    }));

    it("should set isLinking to true on failure to link", fakeAsync(() => {
      component.createImpactLink = jest.fn(() =>
        throwError(() => new Error(ERROR))
      );
      emitConfigurationImpactCreatedEvent();
      tick();
      expect(
        configurationImpactLinkingStateService.setIsLinking
      ).toHaveBeenCalledWith(true);
    }));

    it("should set isCreating to false on failure to link", fakeAsync(() => {
      component.createImpactLink = jest.fn(() =>
        throwError(() => new Error(ERROR))
      );
      emitConfigurationImpactCreatedEvent();
      tick();
      expect(
        configurationImpactLinkingStateService.setIsCreating
      ).toHaveBeenCalledWith(false);
    }));
  });

  function emitConfigurationImpactCreatedEvent() {
    getCreateConfigurationImpactButtonComponent().configurationImpactCreated.emit(
      CREATE_CONFIGURATION_IMPACT_RESPONSE
    );
  }

  function emitConfigurationImpactCreationModalOpenedEvent() {
    getCreateConfigurationImpactButtonComponent().configurationImpactCreationModalOpened.emit();
  }

  function emitConfigurationImpactCreationModalClosedEvent() {
    getCreateConfigurationImpactButtonComponent().configurationImpactCreationModalClosed.emit();
  }

  function getCreateConfigurationImpactButtonComponent(): CreateConfigurationImpactButtonComponent {
    return DomTestUtils.getElementByType(
      fixture,
      CreateConfigurationImpactButtonComponent
    ).getInstance();
  }
});

const CONFIGURATION_IMPACT_ID = "configuration impact id";
const CREATE_CONFIGURATION_IMPACT_RESPONSE = {
  id: CONFIGURATION_IMPACT_ID,
};

const CONFIGURATION_IMPACT: LiteConfigurationImpact = {
  id: CONFIGURATION_IMPACT_ID,
  title: "Configuration Impact",
} as LiteConfigurationImpact;

function getFullySelectedConfigurationImpact(): AnalysisObjectSelectionState<LiteConfigurationImpact> {
  return {
    analysisObject: CONFIGURATION_IMPACT,
    selectionType: AnalysisObjectSelectionType.FULL,
  };
}
