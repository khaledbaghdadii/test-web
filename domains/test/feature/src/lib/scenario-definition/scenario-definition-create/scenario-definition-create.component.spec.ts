import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { Store } from "@ngrx/store";
import { of, Subject, throwError } from "rxjs";
import { ScenarioDefinitionCreateComponent } from "./scenario-definition-create.component";
import { BusinessProcessChain, Test } from "@mxevolve/domains/test/model";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import { ConfirmationService } from "primeng/api";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { ToastMessageService } from "@mxflow/ui/alert";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { By } from "@angular/platform-browser";
import { ReactiveFormsModule } from "@angular/forms";
import { SelectModule } from "primeng/select";
import { RadioButtonModule } from "primeng/radiobutton";
import { SkeletonModule } from "primeng/skeleton";

const scenarioDefinitionId = "scenarioDefinitionId";
describe("ScenarioDefinitionCreateComponent", () => {
  let component: ScenarioDefinitionCreateComponent;
  let fixture: ComponentFixture<ScenarioDefinitionCreateComponent>;
  let scenarioService: jest.Mocked<ScenarioDefinitionService>;
  let store: Store;
  let router: Router;
  let route: ActivatedRoute;
  let confirmationService: ConfirmationService;
  let toastMessageService: jest.Mocked<ToastMessageService>;

  beforeEach(async () => {
    confirmationService = {
      confirm: jest.fn().mockReturnValue(confirmationService),
    } as unknown as ConfirmationService;

    scenarioService = {
      createScenarioDefinition: jest
        .fn()
        .mockReturnValue(of(scenarioDefinitionId)),
    } as unknown as jest.Mocked<ScenarioDefinitionService>;

    store = {
      select: jest.fn().mockReturnValue(of("")),
    } as unknown as Store;

    router = {
      navigate: jest.fn(),
    } as unknown as Router;

    route = {
      params: of({}),
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
        { provide: ToastMessageService, useValue: toastMessageService },
      ],
    })
      .overrideComponent(ScenarioDefinitionCreateComponent, {
        set: {
          imports: [
            ReactiveFormsModule,
            SelectModule,
            RadioButtonModule,
            SkeletonModule,
          ],
          schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
        },
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScenarioDefinitionCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("ngOnInit", () => {
    it("should initialize component", () => {
      const projectId = "TEST_PROJECT_ID";
      const projectSubject = new Subject<string>();
      const selectSpy = jest
        .spyOn(store, "select")
        .mockReturnValue(projectSubject.asObservable());

      component.ngOnInit();

      expect(selectSpy).toHaveBeenCalledWith(GlobalSelectors.getProjectId);
      projectSubject.next(projectId);
      expect(component.projectId).toEqual(projectId);
      expect(component.scenarioDefinitionCreationForm).toBeDefined();
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

  describe("onCreateTestScenario", () => {
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
    ];
    const environmentDefinitionId = "1";
    const bpcs: BusinessProcessChain[] = [{ id: "1", name: "Test BPC" }];
    const mockbuildTestScenarioCreateRequest = {
      name: "Test Scenario",
      bpcs: ["1"],
      heaviness: "LIGHT",
      idempotent: false,
      nonFunctionalTest: false,
      environmentDefinitionId,
      qualityLevel: "CQG",
      tests: [{ full: true, testSelectionIds: ["1"], testDefinitionId: "1" }],
    };

    it("should create test scenario", () => {
      component.tests = tests;
      component.scenarioDefinitionCreationForm.patchValue({
        name: "Test Scenario",
        environmentDefinitionId,
        bpcs,
        heaviness: "LIGHT",
        idempotent: false,
        qualityLevel: "CQG",
      });
      component.projectId = "TEST_PROJECT_ID";
      const navigateSpy = jest
        .spyOn(router, "navigate")
        .mockResolvedValue(true);

      component.createScenarioDefinition();

      expect(component.isLoading).toBeFalsy();
      expect(scenarioService.createScenarioDefinition).toHaveBeenCalledWith(
        "TEST_PROJECT_ID",
        mockbuildTestScenarioCreateRequest
      );
      expect(navigateSpy).toHaveBeenCalledWith(
        [`../details/${scenarioDefinitionId}`],
        expect.objectContaining({ relativeTo: { params: expect.any(Object) } })
      );
    });

    it("should set non-functional test to true if 'yes' radio button is selected", () => {
      const yesRadioButton = fixture.debugElement.query(
        By.css("#nonFunctionalTestYes input")
      );
      yesRadioButton.nativeElement.click();
      fixture.detectChanges();

      expect(
        component.scenarioDefinitionCreationForm.get("nonFunctionalTest")?.value
      ).toBe(true);
    });

    it("should create a scenario definition after the user confirms that no test packages are provided", () => {
      component.tests = [];
      const confirmSpy = jest
        .spyOn(confirmationService, "confirm")
        .mockImplementation((options) => {
          if (options.accept) {
            options.accept();
          }
          return confirmationService;
        });

      const createScenarioDefinitionSpy = jest.spyOn(
        component,
        "createScenarioDefinition"
      );

      const createScenarioDefinitionButton: HTMLElement =
        fixture.debugElement.nativeElement.querySelector(
          "#create-scenario-definition-button-id"
        );
      createScenarioDefinitionButton.dispatchEvent(new Event("click"));

      expect(confirmSpy).toHaveBeenCalledWith({
        target: expect.anything(),
        message:
          "Are you sure you want to create a Scenario\nDefinition without Test Packages?",
        icon: "pi pi-info-circle",
        acceptButtonStyleClass: "p-button-sm ml-2",
        accept: expect.any(Function),
      });
      expect(createScenarioDefinitionSpy).toHaveBeenCalled();
    });

    it("should not create a scenario definition without test packages if the user does not confirm", () => {
      component.tests = [];
      const confirmSpy = jest
        .spyOn(confirmationService, "confirm")
        .mockImplementation(() => {
          return confirmationService;
        });
      const createScenarioDefinitionSpy = jest.spyOn(
        component,
        "createScenarioDefinition"
      );

      const createScenarioDefinitionButton: HTMLElement =
        fixture.debugElement.nativeElement.querySelector(
          "#create-scenario-definition-button-id"
        );
      createScenarioDefinitionButton.dispatchEvent(new Event("click"));

      expect(confirmSpy).toHaveBeenCalled();
      expect(createScenarioDefinitionSpy).not.toHaveBeenCalled();
    });

    it("should directly create the scenario definition if test packages are provided without having to confirm", () => {
      component.tests = [{} as any];
      const confirmSpy = jest
        .spyOn(confirmationService, "confirm")
        .mockImplementation(() => {
          return confirmationService;
        });
      const createScenarioDefinitionSpy = jest.spyOn(
        component,
        "createScenarioDefinition"
      );

      const createScenarioDefinitionButton: HTMLElement =
        fixture.debugElement.nativeElement.querySelector(
          "#create-scenario-definition-button-id"
        );
      createScenarioDefinitionButton.dispatchEvent(new Event("click"));

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(createScenarioDefinitionSpy).toHaveBeenCalled();
    });

    it("should display success notification on successful creation", () => {
      component.tests = tests;
      component.scenarioDefinitionCreationForm.patchValue({
        name: "Test Scenario",
        environmentDefinitionId,
        bpcs,
        heaviness: "LIGHT",
        idempotent: false,
        qualityLevel: "CQG",
      });
      component.projectId = "TEST_PROJECT_ID";

      component.createScenarioDefinition();

      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "Scenario Definition Successfully Created!"
      );
    });

    it("should not submit when qualityLevel is null", () => {
      component.tests = tests;
      component.scenarioDefinitionCreationForm.patchValue({
        name: "Test Scenario",
        environmentDefinitionId,
        bpcs,
        heaviness: "LIGHT",
        idempotent: false,
        qualityLevel: null,
      });
      component.projectId = "TEST_PROJECT_ID";

      component.createScenarioDefinition();

      expect(scenarioService.createScenarioDefinition).not.toHaveBeenCalled();
    });

    it("should not submit if required form data are not filled", () => {
      component.tests = tests;
      component.scenarioDefinitionCreationForm.get("name")?.setValue(null);
      component.scenarioDefinitionCreationForm
        .get("environmentDefinitionId")
        ?.setValue(null);
      component.scenarioDefinitionCreationForm.get("bpcs")?.setValue(null);
      component.createScenarioDefinition();

      expect(scenarioService.createScenarioDefinition).not.toHaveBeenCalled();
    });

    it("should be able to submit if no tests were added", () => {
      component.tests = [];
      component.scenarioDefinitionCreationForm.get("name")?.setValue("name");
      component.scenarioDefinitionCreationForm
        .get("environmentDefinitionId")
        ?.setValue(environmentDefinitionId);
      component.scenarioDefinitionCreationForm.get("bpcs")?.setValue(bpcs);
      component.scenarioDefinitionCreationForm
        .get("qualityLevel")
        ?.setValue("CQG");

      component.createScenarioDefinition();

      expect(scenarioService.createScenarioDefinition).toHaveBeenCalled();
    });

    it("should handle scenario definition creation failure", () => {
      const errorMessage = "Failed to create scenario definition";
      scenarioService.createScenarioDefinition.mockReturnValue(
        throwError(() => errorMessage)
      );
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
      ];
      const environmentDefinitionId = "1";
      const bpcs: BusinessProcessChain[] = [{ id: "1", name: "Test BPC" }];
      component.tests = tests;
      component.scenarioDefinitionCreationForm.patchValue({
        name: "Test Scenario",
        environmentDefinitionId,
        bpcs,
        heaviness: "LIGHT",
        idempotent: false,
        qualityLevel: "CQG",
      });
      component.projectId = "TEST_PROJECT_ID";

      component.createScenarioDefinition();

      expect(component.isLoading).toBe(false);

      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe("onBpcSelect", () => {
    it("should update bpcIds with provided array of ids", () => {
      const newBpcIds = ["1", "2", "3"];

      component.onBpcSelect(newBpcIds);

      expect(component.bpcIds).toEqual(newBpcIds);
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
      const testToAdd = {
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
      };
      component.tests = [];

      component.onAddTestCandidate(testToAdd);

      expect(component.tests).toContain(testToAdd);
    });
  });

  describe("onOpenAddTestModal", () => {
    it("should open add test modal", () => {
      component.onOpenAddTestModal();

      expect(component.isAddTestModalOpen).toBeTruthy();
    });
  });

  describe("ngOnDestroy", () => {
    it("should unsubscribe and complete", () => {
      const nextSpy = jest.spyOn(component["destroy$"], "next");
      const completeSpy = jest.spyOn(component["destroy$"], "complete");

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe("non-functional test flag", () => {
    it("should be visible", () => {
      fixture = TestBed.createComponent(ScenarioDefinitionCreateComponent);
      fixture.detectChanges();
      const nonFunctionalTest = fixture.debugElement.query(
        By.css("#nonFunctionalTest")
      );
      expect(nonFunctionalTest).toBeTruthy();
    });
  });
});
