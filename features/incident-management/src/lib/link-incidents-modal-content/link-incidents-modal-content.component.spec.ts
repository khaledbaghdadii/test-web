import {
  DefaultRenderComponent,
  MockBuilder,
  MockedComponentFixture,
  MockRender,
} from "ng-mocks";
import { LinkIncidentsModalContentComponent } from "./link-incidents-modal-content.component";
import { IncidentLinkingStateService } from "@mxflow/features/analysis-objects";
import { signal } from "@angular/core";
import { fakeAsync, tick } from "@angular/core/testing";
import { ToastMessageService } from "@mxflow/ui/alert";
import { of, Subject } from "rxjs";
import { CreateIncidentButtonComponent } from "@mxflow/features/incident-management";
import { DomTestUtils } from "@mxevolve/testing";

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

  function getCreateButtonComponent() {
    return DomTestUtils.getElementByType(
      fixture,
      CreateIncidentButtonComponent
    ).getInstance();
  }
});
