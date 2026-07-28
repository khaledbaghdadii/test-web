import {
  DefaultRenderComponent,
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { LinkIncidentsModalContentComponent } from "./link-incidents-modal-content.component";
import {
  AnalysisObjectType,
  IncidentLinkingStateService,
} from "@mxflow/features/analysis-objects";
import { signal } from "@angular/core";
import { fakeAsync, tick } from "@angular/core/testing";
import { ToastMessageService } from "@mxflow/ui/alert";
import { of, Subject } from "rxjs";
import { CreateIncidentButtonComponent } from "@mxflow/features/incident-management";
import { DomTestUtils } from "@mxevolve/testing";
import { IncidentsSelectionTableComponent } from "../incidents-selection-table/incidents-selection-table.component";
import { PreviouslyLinkedDetectionToggleComponent } from "@mxevolve/domains/test/widget";

const BUSINESS_PROCESS_ID = "BUSINESS_PROCESS_ID";
describe("LinkIncidentsModalContentComponent", () => {
  let component: LinkIncidentsModalContentComponent;
  let fixture: MockedComponentFixture<LinkIncidentsModalContentComponent>;
  let analysisObjectLinkingStateService: jest.Mocked<IncidentLinkingStateService>;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  const createIncidentSubject = new Subject<string | undefined>();

  beforeEach(async () => {
    analysisObjectLinkingStateService = {
      isLinking: signal(false),
    } as unknown as jest.Mocked<IncidentLinkingStateService>;

    toastMessageService = {
      showError: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    await MockBuilder(LinkIncidentsModalContentComponent)
      .mock(IncidentLinkingStateService, analysisObjectLinkingStateService)
      .mock(ToastMessageService, toastMessageService);

    fixture = MockRender(LinkIncidentsModalContentComponent, {
      createIncidentLink: () => createIncidentSubject.asObservable(),
    } as unknown as DefaultRenderComponent<LinkIncidentsModalContentComponent>);

    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize refresh$ as a BehaviourSubject with false initial value", (done) => {
    component.refresh$.subscribe((refresh) => {
      expect(refresh).toBeFalsy();
      done();
    });
  });

  it("should pass input businessProcessId to create incident button component as businessProcessExecutionId", () => {
    component.businessProcessId = BUSINESS_PROCESS_ID;
    expect(getCreateButtonComponent().businessProcessExecutionId).toBe(
      BUSINESS_PROCESS_ID
    );
  });

  describe("ngOnInit", () => {
    it("should have correlationId$ emit the same values as the createIncidentLink observable", (done) => {
      component.correlationId$.subscribe((id) => {
        expect(id).toBe("correlationId");
        done();
      });
      createIncidentSubject.next("correlationId");
    });

    it("should have correlationId display error message on failure to create the incident link", (done) => {
      const errorMessage = "Incident will be created but not linked.";
      component.correlationId$.subscribe({
        error: () => {
          expect(toastMessageService.showError).toHaveBeenCalledWith(
            errorMessage
          );
          done();
        },
      });
      createIncidentSubject.error(new Error("Test error"));
    });

    it("should throw an error on failure to create the incident link", (done) => {
      component.correlationId$.subscribe({
        error: (err) => {
          expect(err.message).toEqual("Test error");
          done();
        },
      });
      createIncidentSubject.error(new Error("Test error"));
    });

    it("should emit the correlation id resolved when attempting to create a new issue incident", fakeAsync(() => {
      let isReady = false;

      const fixture = MockRender(LinkIncidentsModalContentComponent, {
        createIncidentLink: () =>
          isReady ? of("correlationId") : of(undefined),
      } as unknown as DefaultRenderComponent<LinkIncidentsModalContentComponent>);
      fixture.detectChanges();

      isReady = true;

      let emittedId: string | undefined;
      fixture.point.componentInstance.correlationId$.subscribe((id) => {
        emittedId = id;
      });

      expect(emittedId).toBe("correlationId");
    }));
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

  describe("on incident selection change", () => {
    it("should emit selectedIncidentsChange with the selected incidents", () => {
      const emitSpy = jest.spyOn(component.selectedIncidentsChange, "emit");
      component.onIncidentsSelectionChange([]);
      expect(emitSpy).toHaveBeenCalledWith([]);
    });
  });

  describe("show previously linked incidents", () => {
    const getSelectionTable = () =>
      ngMocks.findInstance<IncidentsSelectionTableComponent>(
        fixture,
        IncidentsSelectionTableComponent
      );

    const emitPreviouslyLinkedToggleChange = (value: boolean) =>
      ngMocks
        .output(
          "mxevolve-previously-linked-detection-toggle",
          "showPreviouslyLinkedChange"
        )
        .emit(value);

    it("should default show previously linked incidents signal to false", () => {
      expect(component.showPreviouslyLinkedIncidents()).toBeFalsy();
    });

    it("should pass the incident type to the previously linked toggle", () => {
      const toggle = ngMocks.find(
        fixture,
        PreviouslyLinkedDetectionToggleComponent
      );

      expect(ngMocks.input(toggle, "analysisObjectType")).toBe(
        AnalysisObjectType.INCIDENT
      );
    });

    it("should not use previously linked criteria when the toggle is off", () => {
      component.previouslyLinkedFilter = {
        testCaseExternalIds: ["ext1"],
        scenarioDefinitionId: "scenarioDefinitionId",
      };
      emitPreviouslyLinkedToggleChange(false);
      fixture.detectChanges();

      expect(getSelectionTable().previouslyLinkedFilter).toBeUndefined();
    });

    it("should apply the previously linked criteria to the selection table when the toggle is on", () => {
      component.previouslyLinkedFilter = {
        testCaseExternalIds: ["ext1"],
        scenarioDefinitionId: "scenarioDefinitionId",
      };
      emitPreviouslyLinkedToggleChange(true);
      fixture.detectChanges();

      expect(getSelectionTable().previouslyLinkedFilter).toEqual({
        testCaseExternalIds: ["ext1"],
        scenarioDefinitionId: "scenarioDefinitionId",
      });
    });
  });

  function getCreateButtonComponent() {
    return DomTestUtils.getElementByType(
      fixture,
      CreateIncidentButtonComponent
    ).getInstance();
  }
});
