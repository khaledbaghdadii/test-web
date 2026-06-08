import { IncidentInputSelectorModalComponent } from "./incident-input-selector-modal.component";
import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { Bind } from "primeng/bind";
import { Dialog, DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { CommonModule } from "@angular/common";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { SingleSelectIncidentTableComponent } from "../../single-select-incident/single-select-incident-table.component";
import { Incident } from "../../model/incident.model";
import { Type } from "@angular/core";
import { DomTestUtils } from "@mxevolve/testing";

function createIncident(id: string, title: string): Incident {
  return {
    id,
    title,
    status: "open",
    externalIssue: {
      id: `ext-${id}`,
      origin: "jira",
      link: `https://jira.example.com/browse/${id}`,
    },
  } as Incident;
}

describe("IncidentInputSelectorModalComponent", () => {
  let fixture: MockedComponentFixture<
    IncidentInputSelectorModalComponent,
    { initialSelection?: Incident }
  >;
  let component: IncidentInputSelectorModalComponent;

  beforeEach(async () => {
    await MockBuilder(IncidentInputSelectorModalComponent)
      .keep(Bind)
      .keep(DialogModule)
      .keep(ButtonModule)
      .keep(CommonModule)
      .provide(provideNoopAnimations())
      .mock(SingleSelectIncidentTableComponent);

    fixture = MockRender(IncidentInputSelectorModalComponent, {
      initialSelection: undefined,
    });
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  describe("opening the modal", () => {
    it("given the modal is opened, then the incidents list should be displayed", () => {
      openModal();

      expect(getComponent(Dialog).visible).toBeTruthy();
      expect(getComponent(SingleSelectIncidentTableComponent)).toBeTruthy();
    });

    it("given the modal is opened, then the incidents list should be refreshed", () => {
      const refreshSpy = jest.spyOn(component.triggerRefresh$, "next");

      openModal();

      expect(refreshSpy).toHaveBeenCalled();
    });

    it("given no incident was previously selected, when the modal is opened, then no incident should be pre-selected", () => {
      openModal();

      expect(component.selection()).toBeUndefined();
    });

    it("given an incident was previously selected, when the modal is opened, then that incident should be pre-selected in the table", () => {
      const previousIncident = createIncident("INC-001", "Previous Incident");
      fixture.componentInstance.initialSelection = previousIncident;
      fixture.detectChanges();

      openModal();
      expect(component.selection()).toEqual(previousIncident);
    });
  });

  describe("selecting an incident", () => {
    it("given the user selected an incident, when they click submit, then the incident chosen should be emitted", () => {
      const incident = createIncident("INC-001", "Server Outage");
      const selectionSpy = jest.spyOn(component.selectedIncidentChange, "emit");
      openModal();
      userSelectsIncidentInTable(incident);

      getButton("submit-button").click();

      expect(selectionSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: "INC-001", title: "Server Outage" })
      );
    });

    it("given the user selected an incident, when they click submit, then the modal should close", () => {
      const incident = createIncident("INC-001", "Server Outage");
      const visibilityChangeSpy = jest.spyOn(component.isVisibleChange, "emit");
      openModal();
      userSelectsIncidentInTable(incident);

      getButton("submit-button").click();

      expect(visibilityChangeSpy).toHaveBeenCalledWith(false);
      expect(component.isVisible).toBe(false);
    });

    it("given no incident is selected, when the user selects an incident, then the submit button should be enabled", () => {
      const incident = createIncident("INC-001", "Server Outage");
      openModal();

      userSelectsIncidentInTable(incident);

      expect(getButton("submit-button").isDisabled()).toBe(false);
    });

    it("given an incident is selected, when the user clears their selection, then the submit button should remain enabled", () => {
      const incident = createIncident("INC-001", "Server Outage");
      const selectionSpy = jest.spyOn(component.selectedIncidentChange, "emit");
      openModal();
      userSelectsIncidentInTable(incident);

      userClearsSelection();

      getButton("submit-button").click();

      expect(selectionSpy).toHaveBeenCalledWith(undefined);
      expect(getButton("submit-button").isDisabled()).toBe(false);
    });

    it("given the user changed their selection multiple times, when they click submit, then only the final selection should be used", () => {
      const firstIncident = createIncident(
        "INC-001",
        "Database Connection Timeout"
      );
      const secondIncident = createIncident("INC-002", "API Gateway Failure");
      const thirdIncident = createIncident("INC-003", "Memory Leak Detected");
      const selectionSpy = jest.spyOn(component.selectedIncidentChange, "emit");
      openModal();
      userSelectsIncidentInTable(firstIncident);
      userSelectsIncidentInTable(secondIncident);
      userSelectsIncidentInTable(thirdIncident);

      getButton("submit-button").click();

      expect(selectionSpy).toHaveBeenCalledTimes(1);
      expect(selectionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "INC-003",
          title: "Memory Leak Detected",
        })
      );
    });
  });

  describe("cancelling incident selection", () => {
    it("given the modal is open, when the user clicks cancel, then the modal should close", () => {
      const visibilityChangeSpy = jest.spyOn(component.isVisibleChange, "emit");
      openModal();

      getButton("cancel-button").click();

      expect(visibilityChangeSpy).toHaveBeenCalledWith(false);
      expect(component.isVisible).toBe(false);
    });

    it("given no incident was previously selected, when the user selects an incident and cancels, then no incident should be emitted", () => {
      const selectionSpy = jest.spyOn(component.selectedIncidentChange, "emit");
      const newIncident = createIncident("INC-001", "New Incident");
      openModal();
      userSelectsIncidentInTable(newIncident);

      getButton("cancel-button").click();

      expect(selectionSpy).not.toHaveBeenCalled();
    });

    it("given an incident was previously selected, when the user selects a different incident and cancels, then no incident should be emitted", () => {
      const originalIncident = createIncident("INC-001", "Original Incident");
      const newIncident = createIncident("INC-002", "New Incident");
      const selectionSpy = jest.spyOn(component.selectedIncidentChange, "emit");
      fixture.componentInstance.initialSelection = originalIncident;
      fixture.detectChanges();
      openModal();
      userSelectsIncidentInTable(newIncident);

      getButton("cancel-button").click();

      expect(selectionSpy).not.toHaveBeenCalled();
    });
  });

  describe("reopening the modal after submission", () => {
    it("given the user submitted a new selection, when the modal is reopened, then the submitted incident should be pre-selected", () => {
      const originalIncident = createIncident("INC-001", "Original Incident");
      const submittedIncident = createIncident("INC-002", "Submitted Incident");
      fixture.componentInstance.initialSelection = originalIncident;
      fixture.detectChanges();
      openModal();
      userSelectsIncidentInTable(submittedIncident);
      getButton("submit-button").click();

      component.isVisible = false;
      fixture.detectChanges();

      fixture.componentInstance.initialSelection = submittedIncident;
      fixture.detectChanges();

      openModal();

      expect(component.selection()).toEqual(submittedIncident);
    });
  });

  function openModal() {
    component.isVisible = true;
    fixture.detectChanges();
  }

  function userSelectsIncidentInTable(incident: Incident) {
    component.selection.set(incident);
    fixture.detectChanges();
  }

  function userClearsSelection() {
    component.selection.set(undefined);
    fixture.detectChanges();
  }

  function getButton(testId: string) {
    return DomTestUtils.getButtonByTestId(fixture, testId);
  }

  function getComponent<S>(type: Type<S>) {
    return DomTestUtils.getElementByType(fixture, type).getInstance();
  }
});
