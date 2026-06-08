import { IncidentInputComponent } from "./incident-input.component";
import { Incident } from "../model/incident.model";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { IncidentService } from "../incident.service";
import { of, Subject } from "rxjs";
import { DomTestUtils } from "@mxevolve/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { ButtonModule } from "primeng/button";
import { InputGroup } from "primeng/inputgroup";
import { InputGroupAddon } from "primeng/inputgroupaddon";
import { InputText } from "primeng/inputtext";
import { IncidentInputSelectorModalComponent } from "./modal/incident-input-selector-modal.component";
import { Component, Type } from "@angular/core";
import { Bind } from "primeng/bind";

function createIncident(
  id: string,
  title: string,
  externalIssueId: string
): Incident {
  return {
    id,
    title,
    status: "Open",
    assignee: "jane.doe",
    reporter: "john.smith",
    externalIssue: {
      id: externalIssueId,
      origin: "Jira",
      link: `http://jira.example.com/browse/${externalIssueId}`,
    },
  };
}

describe("IncidentInputComponent - Integration Tests", () => {
  let fixture: MockedComponentFixture<FormWrapperComponent>;
  let component: IncidentInputComponent;
  let incidentService: IncidentService;

  const mockIncident = createIncident(
    "incident-456",
    "Database Connection Failed",
    "EXT-456"
  );
  const anotherMockIncident = createIncident(
    "incident-789",
    "API Gateway Timeout",
    "EXT-789"
  );

  beforeEach(async () => {
    await MockBuilder(FormWrapperComponent)
      .keep(IncidentInputComponent)
      .keep(ReactiveFormsModule)
      .keep(ButtonModule)
      .keep(InputGroup)
      .keep(Bind)
      .keep(InputGroupAddon)
      .keep(InputText)
      .provide(provideNoopAnimations())
      .mock(IncidentInputSelectorModalComponent)
      .mock(IncidentService, {
        fetchIncidentsByIds: jest.fn(() => of([mockIncident])),
      });

    fixture = MockRender(FormWrapperComponent);
    component = getComponent(IncidentInputComponent);
    incidentService = ngMocks.get(IncidentService);
    fixture.detectChanges();
  });

  describe("Initial State", () => {
    it("should create", () => {
      expect(component).toBeTruthy();
    });

    it("given the component is rendered, then no incident should be selected", () => {
      expect(component.initialSelection()).toBeUndefined();
      expect(getInputValue()).toBe("");
    });

    it("given the component is rendered, then the modal should be hidden", () => {
      expect(component.incidentModalVisibility).toBe(false);
    });

    it("given the component is rendered, then browse and clear buttons should be enabled", () => {
      expect(getButton("browse-incidents-button").isDisabled()).toBe(false);
      expect(getButton("clear-incident-button").isDisabled()).toBe(false);
    });
  });

  describe("Opening the Incident Selection Modal", () => {
    it("given the modal is hidden, when user clicks the browse button, then the modal should be visible", () => {
      clickBrowseButton();

      expect(component.incidentModalVisibility).toBe(true);
    });

    it("given the browse button is clicked, when the modal opens, then the modal should receive the current selection", () => {
      component.initialSelection.set(mockIncident);
      fixture.detectChanges();

      clickBrowseButton();

      const modal = getComponent(IncidentInputSelectorModalComponent);
      expect(modal.initialSelection).toEqual(mockIncident);
    });
  });

  describe("Selecting an Incident", () => {
    it("given no incident is selected, when user selects an incident from the modal, then the incident should be displayed", () => {
      const formWrapper = fixture.componentInstance;
      clickBrowseButton();
      userSelectsIncidentInModal(mockIncident);

      expect(component.initialSelection()).toEqual(mockIncident);
      expect(getInputValue()).toBe(
        `${mockIncident.externalIssue.id || ""} - ${mockIncident.title || ""}`
      );
      expect(formWrapper.form.value.incident).toBe(mockIncident.id);
    });

    it("given an incident is already selected, when user selects a different incident, then the new incident should replace the old one", () => {
      const formWrapper = fixture.componentInstance;
      clickBrowseButton();
      userSelectsIncidentInModal(mockIncident);

      clickBrowseButton();
      userSelectsIncidentInModal(anotherMockIncident);

      expect(component.initialSelection()).toEqual(anotherMockIncident);
      expect(getInputValue()).toBe(
        `${anotherMockIncident.externalIssue.id || ""} - ${
          anotherMockIncident.title || ""
        }`
      );
      expect(formWrapper.form.value.incident).toBe(anotherMockIncident.id);
    });

    it("given an incident is selected, when user clicks the clear button, then the incident should be cleared", () => {
      const formWrapper = fixture.componentInstance;
      clickBrowseButton();
      userSelectsIncidentInModal(mockIncident);

      clickClearButton();

      expect(component.initialSelection()).toBeUndefined();
      expect(getInputValue()).toBe("");
      expect(formWrapper.form.value.incident).toBeUndefined();
    });

    it("given the form sets an incident id, when the service fetches the incident, then the incident should be displayed", () => {
      const formWrapper = fixture.componentInstance;
      jest
        .spyOn(incidentService, "fetchIncidentsByIds")
        .mockReturnValue(of([mockIncident]));

      formWrapper.form.patchValue({ incident: mockIncident.id });
      fixture.detectChanges();

      expect(incidentService.fetchIncidentsByIds).toHaveBeenCalledWith([
        mockIncident.id,
      ]);
      expect(component.initialSelection()).toEqual(mockIncident);
      expect(getInputValue()).toBe(
        `${mockIncident.externalIssue.id || ""} - ${mockIncident.title || ""}`
      );
    });

    it("given the form does not have a valid predefined incident id, then the system should not fetch the incident and display an empty title", () => {
      const formWrapper = fixture.componentInstance;
      jest
        .spyOn(incidentService, "fetchIncidentsByIds")
        .mockReturnValue(of([mockIncident]));

      formWrapper.form.patchValue({ incident: undefined });
      fixture.detectChanges();

      expect(incidentService.fetchIncidentsByIds).not.toHaveBeenCalled();
      expect(component.initialSelection()).toEqual(undefined);
      expect(getInputValue()).toBe("");
    });
  });

  describe("Disabled State", () => {
    it("given the component is disabled, when user tries to click browse button, then the modal should not open", () => {
      const formWrapper = fixture.componentInstance;
      formWrapper.form.get("incident")?.disable();
      fixture.detectChanges();

      expect(() => clickBrowseButton()).not.toThrow();
      expect(component.incidentModalVisibility).toBe(false);
    });
  });

  describe("Input Display", () => {
    it("given the input field is rendered, then it should be read-only", () => {
      const inputElement =
        fixture.nativeElement.querySelector('input[type="text"]');

      expect(inputElement.hasAttribute("readonly")).toBe(true);
    });
  });

  describe("Cleanup on destroy", () => {
    it("given the component is destroyed, when a new incident id is selected, then the latest incident should be disgarded", () => {
      const fetchSubject = new Subject<Incident[]>();
      jest
        .spyOn(incidentService, "fetchIncidentsByIds")
        .mockReturnValue(fetchSubject.asObservable());

      fixture.destroy();
      component.writeValue("incident-999");

      expect(incidentService.fetchIncidentsByIds).not.toHaveBeenCalled();
    });
  });

  function getComponent<S>(type: Type<S>): S {
    return DomTestUtils.getElementByType(fixture, type).getInstance();
  }

  function getButton(testId: string) {
    return DomTestUtils.getButtonByTestId(fixture, testId);
  }

  function getInputValue(): string {
    const inputElement =
      fixture.nativeElement.querySelector('input[type="text"]');
    return inputElement?.value || "";
  }

  function clickBrowseButton() {
    getButton("browse-incidents-button").click();
    fixture.detectChanges();
  }

  function clickClearButton() {
    getButton("clear-incident-button").click();
    fixture.detectChanges();
  }

  function userSelectsIncidentInModal(incident: Incident) {
    const modal = getComponent(IncidentInputSelectorModalComponent);
    modal.selectedIncidentChange.emit(incident);
    fixture.detectChanges();
  }
});

@Component({
  template: `
    <form [formGroup]="form">
      <mxevolve-incident-input
        formControlName="incident"
      ></mxevolve-incident-input>
    </form>
  `,
  imports: [ReactiveFormsModule, IncidentInputComponent],
})
class FormWrapperComponent {
  form = new FormGroup({
    incident: new FormControl<string | undefined>(undefined),
  });
}
