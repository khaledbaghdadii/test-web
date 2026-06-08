import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of, throwError } from "rxjs";
import { ScenarioDefinitionDetailsComponent } from "./scenario-definition-details.component";
import {
  EnvironmentDefinitionStatus,
  ScenarioDefinition,
} from "@mxevolve/domains/test/model";
import {
  ScenarioDefinitionApiResponse,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { Store } from "@ngrx/store";
import { GlobalState } from "@mxflow/core/global-store";
import { DebugElement, NO_ERRORS_SCHEMA } from "@angular/core";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { MockDirectives, ngMocks } from "ng-mocks";
import { By } from "@angular/platform-browser";
import { ButtonModule } from "primeng/button";
import { StreamsService } from "@mxflow/features/streams";
import { EnvironmentService } from "@mxflow/features/environment";

describe("TestComponent", () => {
  let component: ScenarioDefinitionDetailsComponent;
  let fixture: ComponentFixture<ScenarioDefinitionDetailsComponent>;
  let mockScenariosService: jest.Mocked<ScenarioDefinitionService>;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let mockStore: jest.Mocked<Store<GlobalState>>;
  let mockStreamsService: jest.Mocked<StreamsService>;
  let mockEnvironmentService: jest.Mocked<EnvironmentService>;

  beforeEach(() => {
    mockStreamsService = {
      getListOfBpcsByProjectId: jest.fn().mockReturnValue(
        of([
          {
            id: "mockBusinessProcessChainId1",
            name: "mockBusinessProcessChainName1",
          },
          {
            id: "mockBusinessProcessChainId2",
            name: "mockBusinessProcessChainName2",
          },
        ])
      ),
    } as unknown as jest.Mocked<StreamsService>;

    mockEnvironmentService = {
      getEnvironmentDefinitionById: jest.fn().mockReturnValue(
        of({
          id: "mockEnvironmentDefinitionId",
          name: "mockEnvironmentDefinitionName",
          status: EnvironmentDefinitionStatus.ACTIVE,
        })
      ),
    } as unknown as jest.Mocked<EnvironmentService>;

    mockScenariosService = {
      getScenarioDefinitionById: jest
        .fn()
        .mockReturnValue(of(getScenarioDefinitionApiResponse())),
      getTestDefinitions: jest.fn().mockReturnValue(of([])),
    } as unknown as jest.Mocked<ScenarioDefinitionService>;
    mockStore = {
      select: jest.fn().mockReturnValue(of("mockedProjectId")),
    } as unknown as jest.Mocked<Store<GlobalState>>;
    toastMessageService = {
      showError: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ scenarioDefinitionId: "mockScenarioDefinitionId" }),
          },
        },
        { provide: ScenarioDefinitionService, useValue: mockScenariosService },
        { provide: ToastMessageService, useValue: toastMessageService },
        { provide: Store, useValue: mockStore },
        { provide: StreamsService, useValue: mockStreamsService },
        { provide: EnvironmentService, useValue: mockEnvironmentService },
      ],
    }).overrideComponent(ScenarioDefinitionDetailsComponent, {
      set: {
        imports: [
          ButtonModule,
          ...MockDirectives(ShowElementIfAuthorizedDirective),
        ],
        schemas: [NO_ERRORS_SCHEMA],
      },
    });

    fixture = TestBed.createComponent(ScenarioDefinitionDetailsComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const showElementIfAuthorizedDirectives = ngMocks.findInstances(
      ShowElementIfAuthorizedDirective
    );
    showElementIfAuthorizedDirectives.forEach((authDirective) =>
      ngMocks.render(authDirective, authDirective)
    );

    fixture.detectChanges();
  });

  describe("ngOnInit", () => {
    it("should initialize component and fetch data", () => {
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.isLoading).toBeFalsy();
      expect(component.projectId).toBe("mockedProjectId");
      expect(component.scenarioDefinition).toStrictEqual(
        getScenarioDefinition()
      );
      expect(component.bpcNames).toStrictEqual([
        "mockBusinessProcessChainName1",
        "mockBusinessProcessChainName2",
      ]);
      expect(component.scenarioDefinitionBpcIds).toStrictEqual([
        "mockBusinessProcessChainId1",
        "mockBusinessProcessChainId2",
      ]);
    });

    it("should handle error during data fetch", () => {
      mockScenariosService.getScenarioDefinitionById.mockReturnValue(
        throwError(() => "Test error")
      );

      fixture = TestBed.createComponent(ScenarioDefinitionDetailsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.isLoading).toBeFalsy();
      expect(toastMessageService.showError).toHaveBeenCalledWith("Test error");
    });
  });

  describe("ngOnDestroy", () => {
    it("should call next and complete on destroy$", () => {
      const nextSpy = jest.spyOn(component["destroy$"], "next");
      const completeSpy = jest.spyOn(component["destroy$"], "complete");
      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe("edit scenario definition button", () => {
    let editButton: DebugElement;

    beforeEach(() => {
      editButton = fixture.debugElement.query(
        By.css("#edit-scenario-definition")
      );
    });

    it("should exist when scenario definition is not archived", () => {
      expect(editButton).toBeTruthy();
    });

    it("edit button should not exist when scenario definition is archived", () => {
      component.scenarioDefinition.archived = true;
      fixture.detectChanges();
      const archivedEditButton = fixture.debugElement.query(
        By.css("#edit-scenario-definition")
      );
      expect(archivedEditButton).toBeFalsy();
    });

    it("should be authorized", () => {
      const showElementDirective = ngMocks.findInstance(
        editButton,
        ShowElementIfAuthorizedDirective
      );
      expect(showElementDirective.showElementIfAuthorized).toEqual({
        action: "edit",
        attributes: {},
        package: "test",
        resource: "scenario_definition",
      });
    });
  });

  describe("display non functional test options", () => {
    it("should be visible", () => {
      fixture = TestBed.createComponent(ScenarioDefinitionDetailsComponent);
      fixture.detectChanges();

      const nonFunctionalTestLabel = fixture.debugElement.query(
        By.css("[data-testid='nonFunctionalTestLabel']")
      );
      expect(nonFunctionalTestLabel).toBeTruthy();
    });

    it("should display non functional test label as No when nonFunctionalTest is false", () => {
      component.scenarioDefinition.nonFunctionalTest = false;
      fixture.detectChanges();
      const nonFunctionalTestLabel = fixture.debugElement.query(
        By.css("[data-testid='nonFunctionalTestLabel']")
      );
      expect(nonFunctionalTestLabel.nativeElement.textContent).toContain("No");
    });

    it("should display non functional test label as Yes when nonFunctionalTest is true", () => {
      component.scenarioDefinition.nonFunctionalTest = true;
      fixture.detectChanges();
      const nonFunctionalTestLabel = fixture.debugElement.query(
        By.css("[data-testid='nonFunctionalTestLabel']")
      );
      expect(nonFunctionalTestLabel.nativeElement.textContent).toContain("Yes");
    });

    it("should display non function test label as - when nonFunctionalTest is empty", () => {
      component.scenarioDefinition = null as unknown as ScenarioDefinition;
      fixture.detectChanges();
      const nonFunctionalTestLabel = fixture.debugElement.query(
        By.css("[data-testid='nonFunctionalTestLabel']")
      );
      expect(nonFunctionalTestLabel.nativeElement.textContent).toContain("-");
    });
  });

  describe("display quality level", () => {
    it("should be visible", () => {
      fixture = TestBed.createComponent(ScenarioDefinitionDetailsComponent);
      fixture.detectChanges();
      const qualityLevelLabel = fixture.debugElement.query(
        By.css("[data-testid='qualityLevelLabel']")
      );
      expect(qualityLevelLabel).toBeTruthy();
    });

    it("should display quality level when it is set", () => {
      component.scenarioDefinition.qualityLevel = "CQG";
      fixture.detectChanges();
      const qualityLevelLabel = fixture.debugElement.query(
        By.css("[data-testid='qualityLevelLabel']")
      );
      expect(qualityLevelLabel.nativeElement.textContent).toContain("CQG");
    });

    it("should display - when quality level is undefined", () => {
      component.scenarioDefinition.qualityLevel = undefined;
      fixture.detectChanges();
      const qualityLevelLabel = fixture.debugElement.query(
        By.css("[data-testid='qualityLevelLabel']")
      );
      expect(qualityLevelLabel.nativeElement.textContent.trim()).toContain("-");
    });

    it("should display - when scenarioDefinition is null", () => {
      component.scenarioDefinition = null as unknown as ScenarioDefinition;
      fixture.detectChanges();
      const qualityLevelLabel = fixture.debugElement.query(
        By.css("[data-testid='qualityLevelLabel']")
      );
      expect(qualityLevelLabel.nativeElement.textContent).toContain("-");
    });
  });
});

function getScenarioDefinitionApiResponse(): ScenarioDefinitionApiResponse {
  return {
    id: "mockScenarioDefinitionId",
    projectId: "mockedProjectId",
    name: "mockScenarioDefinitionName",
    archived: false,
    tests: [],
    bpcs: ["mockBusinessProcessChainId1", "mockBusinessProcessChainId2"],
    environmentDefinitionId: "mockEnvironmentDefinitionId",
    heaviness: "HEAVY",
    idempotent: true,
    qualityLevel: "CQG",
    nonFunctionalTest: true,
  };
}

function getScenarioDefinition(): ScenarioDefinition {
  return {
    id: "mockScenarioDefinitionId",
    name: "mockScenarioDefinitionName",
    archived: false,
    qualityLevel: "CQG",
    tests: [],
    bpcs: [
      {
        id: "mockBusinessProcessChainId1",
        name: "mockBusinessProcessChainName1",
      },
      {
        id: "mockBusinessProcessChainId2",
        name: "mockBusinessProcessChainName2",
      },
    ],
    environmentDefinition: {
      id: "mockEnvironmentDefinitionId",
      name: "mockEnvironmentDefinitionName",
      status: EnvironmentDefinitionStatus.ACTIVE,
    },
    heaviness: "HEAVY",
    idempotent: true,
    nonFunctionalTest: true,
  } as unknown as ScenarioDefinition;
}
