import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { Store } from "@ngrx/store";
import { of, throwError } from "rxjs";
import { ScenarioDefinitionEditComponent } from "./scenario-definition-edit.component";
import { ScenarioEditTestComponent } from "../scenario-edit-test/scenario-edit-test.component";
import {
  BusinessProcessChain,
  EnvironmentDefinition,
  EnvironmentDefinitionStatus,
  ScenarioDefinition,
  Test,
} from "@mxevolve/domains/test/model";
import {
  ScenarioDefinitionApiResponse,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { ConfirmationService } from "primeng/api";
import { Location } from "@angular/common";
import { ToastMessageService } from "@mxflow/ui/alert";
import { By } from "@angular/platform-browser";
import { ReactiveFormsModule } from "@angular/forms";
import { RadioButtonModule } from "primeng/radiobutton";
import { CUSTOM_ELEMENTS_SCHEMA, DebugElement } from "@angular/core";
import { TableModule } from "primeng/table";
import { MockComponent, MockPipe } from "ng-mocks";
import { OrdinalNumberPipe } from "@mxevolve/shared/pipe";
import { ButtonModule } from "primeng/button";
import { DomTestUtils } from "@mxevolve/testing";
import { StreamsService } from "@mxflow/features/streams";
import { EnvironmentService } from "@mxflow/features/environment";

const scenarioDefinitionId = "scenarioDefinitionId";
const scenarioDefinitionApiResponse: ScenarioDefinitionApiResponse = {
  id: scenarioDefinitionId,
  projectId: "",
  name: "Test Scenario",
  tests: [],
  bpcs: ["1", "2"],
  archived: false,
  environmentDefinitionId: "1",
  heaviness: "LIGHT",
  idempotent: false,
  nonFunctionalTest: false,
  qualityLevel: "CQG",
};
const scenarioDefinition = {
  id: scenarioDefinitionId,
  name: "Test Scenario",
  tests: [],
  bpcs: [
    {
      id: "1",
      name: "BPC 1",
    },
    {
      id: "2",
      name: "BPC 2",
    },
  ],
  heaviness: "LIGHT",
  environmentDefinition: {
    id: "1",
    name: "Test Environment",
    status: EnvironmentDefinitionStatus.ACTIVE,
  },
  idempotent: false,
  nonFunctionalTest: false,
  archived: false,
  qualityLevel: "CQG",
} as unknown as ScenarioDefinition;

describe("ScenarioDefinitionEditComponent", () => {
  let component: ScenarioDefinitionEditComponent;
  let fixture: ComponentFixture<ScenarioDefinitionEditComponent>;
  let scenarioService: jest.Mocked<ScenarioDefinitionService>;
  let store: Store;
  let router: Router;
  let location: Location;
  let route: ActivatedRoute;
  let confirmationService: ConfirmationService;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let mockStreamsService: jest.Mocked<StreamsService>;
  let mockEnvironmentService: jest.Mocked<EnvironmentService>;

  const tests: Test[] = [
    {
      full: true,
      testDefinition: {
        id: "1",
        name: "",
        projectId: "",
        repoId: "",
        path: "",
        timeoutDuration: { days: 0, hours: 0, minutes: 0 },
        testSelections: [],
        description: "",
      },
      testSelections: [{ id: "1", name: "", path: "", tags: ["tag1"] }],
    },
    {
      full: false,
      testDefinition: {
        id: "2",
        name: "",
        projectId: "",
        repoId: "",
        path: "",
        timeoutDuration: { days: 0, hours: 0, minutes: 0 },
        testSelections: [
          { id: "1", name: "", path: "", tags: ["tag1"] },
          { id: "2", name: "", path: "", tags: ["tag2"] },
        ],
        description: "",
      },
      testSelections: [{ id: "1", name: "", path: "", tags: ["tag1"] }],
    },
  ];

  beforeEach(async () => {
    confirmationService = {
      confirm: jest.fn().mockReturnValue(confirmationService),
    } as unknown as ConfirmationService;

    scenarioService = {
      getScenarioDefinitionById: jest
        .fn()
        .mockReturnValue(of(scenarioDefinitionApiResponse)),
      editScenarioDefinition: jest
        .fn()
        .mockReturnValue(of(scenarioDefinitionId)),
      getTestDefinitions: jest.fn().mockReturnValue(of([])),
    } as unknown as jest.Mocked<ScenarioDefinitionService>;

    mockStreamsService = {
      getListOfBpcsByProjectId: jest.fn().mockReturnValue(
        of([
          { id: "1", name: "BPC 1" },
          { id: "2", name: "BPC 2" },
        ])
      ),
    } as unknown as jest.Mocked<StreamsService>;

    mockEnvironmentService = {
      getEnvironmentDefinitionById: jest.fn().mockReturnValue(
        of({
          id: "1",
          name: "Test Environment",
          status: EnvironmentDefinitionStatus.ACTIVE,
        })
      ),
    } as unknown as jest.Mocked<EnvironmentService>;

    store = {
      select: jest.fn().mockReturnValue(of("")),
    } as unknown as Store;

    router = {
      navigate: jest.fn(),
    } as unknown as Router;

    location = {
      back: jest.fn(),
    } as unknown as Location;

    route = {
      params: of({ scenarioDefinitionId: "123" }),
    } as unknown as ActivatedRoute;

    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    await TestBed.configureTestingModule({
      providers: [
        { provide: ConfirmationService, useValue: confirmationService },
        { provide: ScenarioDefinitionService, useValue: scenarioService },
        { provide: Store, useValue: store },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: Location, useValue: location },
        { provide: ToastMessageService, useValue: toastMessageService },
        { provide: StreamsService, useValue: mockStreamsService },
        { provide: EnvironmentService, useValue: mockEnvironmentService },
      ],
    })
      .overrideComponent(ScenarioDefinitionEditComponent, {
        set: {
          imports: [
            ReactiveFormsModule,
            RadioButtonModule,
            TableModule,
            ButtonModule,
            MockComponent(ScenarioEditTestComponent),
            MockPipe(OrdinalNumberPipe),
          ],
          schemas: [CUSTOM_ELEMENTS_SCHEMA],
        },
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScenarioDefinitionEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("ngOnInit", () => {
    it("should initialize component", () => {
      scenarioService.getScenarioDefinitionById.mockReturnValue(
        of(scenarioDefinitionApiResponse)
      );
      const projectId = "TEST_PROJECT_ID";
      jest.spyOn(store, "select").mockReturnValue(of(projectId));

      component.ngOnInit();

      expect(component.scenarioDefinitionEditForm.value).toEqual({
        name: "Test Scenario",
        environmentDefinitionId: null,
        bpcs: [
          {
            id: "1",
            name: "BPC 1",
          },
          {
            id: "2",
            name: "BPC 2",
          },
        ],
        heaviness: "LIGHT",
        idempotent: false,
        nonFunctionalTest: false,
        qualityLevel: "CQG",
      });
      expect(scenarioService.getScenarioDefinitionById).toHaveBeenCalledWith(
        "123",
        projectId
      );
      expect(component.isLoading).toBe(false);
      expect(component.scenarioDefinitionToEdit).toEqual(scenarioDefinition);
      expect(component.tests).toEqual(scenarioDefinition.tests);
      expect(component.bpcIds).toEqual(["1", "2"]);
      expect(component.scenarioDefinitionEditForm).toBeDefined();
    });

    it("should handle error if scenario definition fetch fails", () => {
      const errorMessage = "Failed to fetch scenario definition";
      scenarioService.getScenarioDefinitionById.mockReturnValue(
        throwError(() => errorMessage)
      );

      component.ngOnInit();

      expect(component.isLoading).toBe(false);
      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe("onDeleteTest", () => {
    it("should call deleteTest when confirmation is accepted", () => {
      component.tests = [];
      const testIndex = 0;
      const mockMouseEvent = {} as MouseEvent;
      const confirmSpy = jest
        .spyOn(confirmationService, "confirm")
        .mockImplementation((options) => {
          if (options.accept) {
            options.accept();
          }
          return confirmationService;
        });

      const deleteTestSpy = jest.spyOn(component, "deleteTest");

      component.onDeleteTest(mockMouseEvent, testIndex);

      expect(confirmSpy).toHaveBeenCalled();
      expect(deleteTestSpy).toHaveBeenCalledWith(testIndex);
    });

    it("should not call deleteTest when confirmation is not accepted", () => {
      const testIndex = 0;
      const mockMouseEvent = {} as MouseEvent;
      const confirmSpy = jest
        .spyOn(confirmationService, "confirm")
        .mockImplementation(() => {
          return confirmationService;
        });
      const deleteTestSpy = jest.spyOn(component, "deleteTest");

      component.onDeleteTest(mockMouseEvent, testIndex);

      expect(confirmSpy).toHaveBeenCalled();
      expect(deleteTestSpy).not.toHaveBeenCalled();
    });

    it("should call delete method when delete test button is clicked", () => {
      component.tests = tests;
      component.isEditTestModalOpen = false;
      fixture.detectChanges();

      const handlerSpy = jest.spyOn(component, "onDeleteTest");
      getButtonHarness("delete-test-button").click();

      expect(handlerSpy).toHaveBeenCalled();
    });
  });

  describe("deleteTest", () => {
    it("should delete test at specified index", () => {
      component.tests = [
        {
          full: true,
          testDefinition: {
            id: "1",
            name: "",
            projectId: "",
            repoId: "",
            path: "",
            timeoutDuration: {
              days: 0,
              hours: 0,
              minutes: 0,
            },
            testSelections: [],
            description: "",
          },
          testSelections: [
            {
              id: "1",
              name: "",
              path: "",
              tags: ["tag1"],
            },
          ],
        },
      ];

      component.deleteTest(0);

      expect(component.tests).toEqual([]);
    });
  });

  describe("onEditTestScenario", () => {
    const environmentDefinition: EnvironmentDefinition = {
      id: "1",
      name: "Test Environment",
      status: EnvironmentDefinitionStatus.ACTIVE,
    };
    const bpcs: BusinessProcessChain[] = [{ id: "1", name: "Test BPC" }];
    const scenarioDefinitionToEdit = {
      id: "1",
      name: "Test Scenario",
      tests,
      bpcs,
      heaviness: "LIGHT",
      environmentDefinition,
      idempotent: false,
      nonFunctionalTest: false,
    } as unknown as ScenarioDefinition;

    it("should edit test scenario", () => {
      component.tests = tests;
      component.scenarioDefinitionEditForm.patchValue({
        name: scenarioDefinitionToEdit.name,
        environmentDefinitionId:
          scenarioDefinitionToEdit.environmentDefinition.id,
        bpcs: scenarioDefinitionToEdit.bpcs,
        heaviness: scenarioDefinitionToEdit.heaviness,
        idempotent: scenarioDefinitionToEdit.idempotent,
        nonFunctionalTest: scenarioDefinitionToEdit.nonFunctionalTest,
        qualityLevel: "CQG",
      });
      component.scenarioDefinitionToEdit = scenarioDefinitionToEdit;
      const navigateSpy = jest
        .spyOn(router, "navigate")
        .mockResolvedValue(true);
      component.projectId = "TEST PROJECT ID";
      const mockbuildTestScenarioUpdateRequest = {
        bpcs: ["1"],
        environmentDefinitionId: "1",
        heaviness: "LIGHT",
        idempotent: false,
        nonFunctionalTest: false,
        name: "Test Scenario",
        qualityLevel: "CQG",
        tests: [
          { full: true, testSelectionIds: ["1"], testDefinitionId: "1" },
          { full: false, testSelectionIds: ["1"], testDefinitionId: "2" },
        ],
      };

      component.editScenarioDefinition();

      expect(component.isLoading).toBeFalsy();
      expect(scenarioService.editScenarioDefinition).toHaveBeenCalledWith(
        component.projectId,
        mockbuildTestScenarioUpdateRequest,
        scenarioDefinitionToEdit.id
      );
      expect(navigateSpy).toHaveBeenCalledWith(
        [`../../details/${scenarioDefinitionId}`],
        expect.objectContaining({ relativeTo: { params: expect.any(Object) } })
      );
    });

    it("should not submit when qualityLevel is null", () => {
      component.tests = tests;
      component.scenarioDefinitionEditForm.patchValue({
        name: scenarioDefinitionToEdit.name,
        environmentDefinitionId:
          scenarioDefinitionToEdit.environmentDefinition.id,
        bpcs: scenarioDefinitionToEdit.bpcs,
        heaviness: scenarioDefinitionToEdit.heaviness,
        idempotent: scenarioDefinitionToEdit.idempotent,
        nonFunctionalTest: scenarioDefinitionToEdit.nonFunctionalTest,
        qualityLevel: null,
      });
      component.scenarioDefinitionToEdit = scenarioDefinitionToEdit;
      component.projectId = "TEST PROJECT ID";

      component.editScenarioDefinition();

      expect(scenarioService.editScenarioDefinition).not.toHaveBeenCalled();
    });

    it("should edit a scenario definition after the user confirms that no test packages are provided", () => {
      component.tests = [];
      const confirmSpy = jest
        .spyOn(confirmationService, "confirm")
        .mockImplementation((options) => {
          if (options.accept) {
            options.accept();
          }
          return confirmationService;
        });

      const editScenarioDefinitionSpy = jest.spyOn(
        component,
        "editScenarioDefinition"
      );

      const editScenarioDefinitionButton: HTMLElement =
        fixture.debugElement.nativeElement.querySelector(
          "#edit-scenario-definition-button-id"
        );
      editScenarioDefinitionButton.dispatchEvent(new Event("click"));

      expect(confirmSpy).toHaveBeenCalledWith({
        target: expect.anything(),
        message:
          "Are you sure you want to submit the edited\nScenario Definition without Test Packages?",
        icon: "pi pi-info-circle",
        acceptButtonStyleClass: "p-button-sm ml-2",
        accept: expect.any(Function),
      });
      expect(editScenarioDefinitionSpy).toHaveBeenCalled();
    });

    it("should not edit a scenario definition without test packages if the user does not confirm", () => {
      component.tests = [];
      const confirmSpy = jest
        .spyOn(confirmationService, "confirm")
        .mockImplementation(() => {
          return confirmationService;
        });
      const editScenarioDefinitionSpy = jest.spyOn(
        component,
        "editScenarioDefinition"
      );

      const editScenarioDefinitionButton: HTMLElement =
        fixture.debugElement.nativeElement.querySelector(
          "#edit-scenario-definition-button-id"
        );
      editScenarioDefinitionButton.dispatchEvent(new Event("click"));

      expect(confirmSpy).toHaveBeenCalled();
      expect(editScenarioDefinitionSpy).not.toHaveBeenCalled();
    });

    it("should directly edit the scenario definition if test packages are provided without having to confirm", () => {
      component.tests = [{} as any];
      const confirmSpy = jest
        .spyOn(confirmationService, "confirm")
        .mockImplementation(() => {
          return confirmationService;
        });
      const editScenarioDefinitionSpy = jest.spyOn(
        component,
        "editScenarioDefinition"
      );

      const editScenarioDefinitionButton: HTMLElement =
        fixture.debugElement.nativeElement.querySelector(
          "#edit-scenario-definition-button-id"
        );
      editScenarioDefinitionButton.dispatchEvent(new Event("click"));

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(editScenarioDefinitionSpy).toHaveBeenCalled();
    });

    it("should display success notification on successful edit", () => {
      component.tests = tests;
      component.scenarioDefinitionEditForm.patchValue({
        name: scenarioDefinitionToEdit.name,
        environmentDefinitionId:
          scenarioDefinitionToEdit.environmentDefinition.id,
        bpcs: scenarioDefinitionToEdit.bpcs,
        heaviness: scenarioDefinitionToEdit.heaviness,
        idempotent: scenarioDefinitionToEdit.idempotent,
        nonFunctionalTest: scenarioDefinitionToEdit.nonFunctionalTest,
        qualityLevel: "CQG",
      });
      component.scenarioDefinitionToEdit = scenarioDefinitionToEdit;

      component.editScenarioDefinition();

      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "Scenario Definition Successfully Edited!"
      );
    });

    it("should handle scenario definition edit failure", () => {
      const errorMessage = "Failed to edit scenario definition";
      scenarioService.editScenarioDefinition.mockReturnValue(
        throwError(() => errorMessage)
      );
      const environmentDefinition: EnvironmentDefinition = {
        id: "1",
        name: "Test Environment",
        status: EnvironmentDefinitionStatus.ACTIVE,
      };
      const bpcs: BusinessProcessChain[] = [{ id: "1", name: "Test BPC" }];
      const scenarioDefinitionToEdit = {
        id: "1",
        name: "Test Scenario",
        tests,
        bpcs,
        heaviness: "LIGHT",
        environmentDefinition,
        idempotent: false,
      } as unknown as ScenarioDefinition;
      component.tests = tests;
      component.scenarioDefinitionEditForm.patchValue({
        name: scenarioDefinitionToEdit.name,
        environmentDefinitionId:
          scenarioDefinitionToEdit.environmentDefinition.id,
        bpcs: scenarioDefinitionToEdit.bpcs,
        heaviness: scenarioDefinitionToEdit.heaviness,
        idempotent: scenarioDefinitionToEdit.idempotent,
        nonFunctionalTest: scenarioDefinitionToEdit.nonFunctionalTest,
        qualityLevel: "CQG",
      });
      component.scenarioDefinitionToEdit = scenarioDefinitionToEdit;
      component.projectId = "TEST PROJECT ID";

      component.editScenarioDefinition();

      expect(component.isLoading).toBe(false);
      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
    });

    it("should not submit if required form data are not filled", () => {
      component.tests = tests;
      component.scenarioDefinitionEditForm.get("name")?.setValue(null);
      component.scenarioDefinitionEditForm
        .get("environmentDefinitionId")
        ?.setValue(null);
      component.scenarioDefinitionEditForm.get("bpcs")?.setValue(null);

      component.editScenarioDefinition();

      expect(scenarioService.editScenarioDefinition).not.toHaveBeenCalled();
    });

    it("should be able to submit if no tests are added", () => {
      component.tests = [];
      component.scenarioDefinitionEditForm
        .get("environmentDefinitionId")
        ?.setValue("1");
      component.editScenarioDefinition();

      expect(scenarioService.editScenarioDefinition).toHaveBeenCalled();
    });
  });

  describe("onBpcSelect", () => {
    it("should update bpcIds with provided array of ids", () => {
      const newBpcIds = ["1", "2", "3"];

      component.onBpcSelect(newBpcIds);

      expect(component.bpcIds).toEqual(newBpcIds);
    });
  });

  describe("ngOnDestroy", () => {
    it("should unsubscribe", () => {
      const nextSpy = jest.spyOn(component["destroy$"], "next");
      const completeSpy = jest.spyOn(component["destroy$"], "complete");

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe("onCancelEditTestScenario", () => {
    it("should navigate to previous route", () => {
      component.onCancelEditTestScenario();

      expect(location.back).toHaveBeenCalled();
    });
  });

  describe("onOpenAddTestModal", () => {
    it("should open add test modal", () => {
      component.onOpenAddTestModal();

      expect(component.isAddTestModalOpen).toBeTruthy();
    });
  });

  describe("onCloseAddTestModal", () => {
    it("should close add test modal", () => {
      component.onCloseAddTestModal();

      expect(component.isAddTestModalOpen).toBeFalsy();
    });
  });

  describe("onAddTestCandidate", () => {
    it("should add selected test to tests array", () => {
      const testToAdd = tests[0];
      component.tests = [];

      component.onAddTestCandidate(testToAdd);

      expect(component.tests).toContain(testToAdd);
    });
  });

  describe("edit test modal", () => {
    beforeEach(() => {
      component.tests = tests;
      fixture.detectChanges();
    });

    it("should open when edit test modal button is clicked", () => {
      component.isEditTestModalOpen = false;
      getButtonHarness("edit-test-button").click();

      const editTestModal: DebugElement = fixture.debugElement.query(
        By.css("mxevolve-scenario-edit-test")
      );
      expect(editTestModal.componentInstance.isVisible).toBe(true);
    });

    it("should update test when update test event is emitted from the edit test modal", () => {
      const updateTestSpy = jest.spyOn(component, "updateTest");
      const editTestModal: DebugElement = fixture.debugElement.query(
        By.css("mxevolve-scenario-edit-test")
      );

      editTestModal.componentInstance.updateTest.emit(tests[0]);
      fixture.detectChanges();

      expect(updateTestSpy).toHaveBeenCalledWith(tests[0]);
    });

    it("should pass the selected test to edit test modal when edit button is clicked", () => {
      getButtonHarness("edit-test-button").click();

      expect(component.selectedRowIndex).toEqual(0);
      expect(component.selectedRowTest).toEqual(tests[0]);
    });

    it("should close edit test modal when it is closed", () => {
      component.isEditTestModalOpen = true;
      const editTestModal: DebugElement = fixture.debugElement.query(
        By.css("mxevolve-scenario-edit-test")
      );
      editTestModal.triggerEventHandler("closeModal", null);
      fixture.detectChanges();

      expect(editTestModal.componentInstance.isVisible).toBe(false);
    });

    it("should pass project Id to edit test modal", () => {
      component.projectId = "f365491a-9ef5-4529-b261-d7e309651251";
      fixture.detectChanges();

      const editTestModal: DebugElement = fixture.debugElement.query(
        By.css("mxevolve-scenario-edit-test")
      );
      expect(editTestModal.componentInstance.projectId).toEqual(
        "f365491a-9ef5-4529-b261-d7e309651251"
      );
    });

    it("should pass selected test to edit test modal", () => {
      component.selectedRowTest = tests[1];
      fixture.detectChanges();

      const editTestModal: DebugElement = fixture.debugElement.query(
        By.css("mxevolve-scenario-edit-test")
      );
      expect(editTestModal.componentInstance.test).toEqual(tests[1]);
    });

    it("should update the selected test when update test event is emitted", () => {
      component.tests = tests;
      component.selectedRowIndex = 1;
      const updatedTest: Test = {
        ...tests[1],
        testSelections: [{ id: "2", name: "", path: "", tags: ["tag2"] }],
      };

      const editTestModal: DebugElement = fixture.debugElement.query(
        By.css("mxevolve-scenario-edit-test")
      );
      editTestModal.triggerEventHandler("updateTest", updatedTest);

      expect(component.tests[0]).toEqual(tests[0]);
      expect(component.tests[1]).toEqual(updatedTest);
    });
  });

  describe("non-functional test flag", () => {
    it("should be visible", () => {
      fixture = TestBed.createComponent(ScenarioDefinitionEditComponent);
      fixture.detectChanges();

      const nonFunctionalTestLabel = fixture.debugElement.query(
        By.css("#nonFunctionalTest")
      );
      expect(nonFunctionalTestLabel).toBeTruthy();
    });

    describe("display non functional test options", () => {
      it("should set non-functional test to true if 'yes' radio button is selected", () => {
        const yesRadioButton = fixture.debugElement.query(
          By.css("#nonFunctionalTestYes input")
        );
        yesRadioButton.nativeElement.click();
        fixture.detectChanges();

        expect(
          component.scenarioDefinitionEditForm.get("nonFunctionalTest")?.value
        ).toBe(true);
      });

      it("should set non-functional test to false if 'no' radio button is selected", () => {
        const noRadioButton = fixture.debugElement.query(
          By.css("#nonFunctionalTestNo input")
        );
        noRadioButton.nativeElement.click();
        fixture.detectChanges();

        expect(
          component.scenarioDefinitionEditForm.get("nonFunctionalTest")?.value
        ).toBe(false);
      });
    });
  });

  function getButtonHarness(testId: string) {
    return DomTestUtils.getButtonByTestId(fixture, testId);
  }
});
