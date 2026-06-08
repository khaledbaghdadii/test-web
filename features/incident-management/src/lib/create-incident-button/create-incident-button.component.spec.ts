import { JIRA_CONFIG, JiraConfig } from "@mxflow/config";
import { CreateIncidentButtonComponent } from "./create-incident-button.component";
import {
  Environment,
  EnvironmentService,
  EnvironmentStatus,
} from "@mxflow/features/environment";
import { Store } from "@ngrx/store";
import { of, throwError } from "rxjs";
import { JumpType } from "../model/jump-type.model";
import { QualityLevel } from "../model/quality-level";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  BusinessProcessExecution,
  BusinessProcessExecutionService,
  BusinessProcessResource,
  BusinessProcessResourcesService,
  ResourceType,
  ResourceUsageTags,
} from "@mxflow/features/business-process";

const jiraIncidentCreationUrl = "jira-url/create";
const projectName = "pro 222";
const projectId = "pro-222";
const scenarioExecutionId = "id-444";
const contextName = "context name";
const correlationId = "correlation-id-123";
const firstReferenceEnvironment = "linkedEnvironment-1";
const secondReferenceEnvironment = "linkedEnvironment-2";
const firstBusinessProcessResource: BusinessProcessResource = {
  resourceId: firstReferenceEnvironment,
  projectId: projectId,
  resourceType: ResourceType.ENVIRONMENT,
  usageTags: [ResourceUsageTags.REFERENCE_ENVIRONMENT],
};
const secondBusinessProcessResource: BusinessProcessResource = {
  resourceId: secondReferenceEnvironment,
  projectId: projectId,
  resourceType: ResourceType.ENVIRONMENT,
  usageTags: [ResourceUsageTags.REFERENCE_ENVIRONMENT],
};
const businessProcessExecution = {
  name: contextName,
} as unknown as BusinessProcessExecution;
const scenarioName = "scenario_name";
const mxVersion = "mx_version";
const environmentId = "environment_id";
const CONTEXT_ID = "CONTEXT_ID";

describe("JiraRedirectionButtonComponent", () => {
  let store: Store;
  let environmentService: EnvironmentService;
  let businessProcessExecutionService: BusinessProcessExecutionService;
  let businessProcessResourcesService: BusinessProcessResourcesService;
  let component: CreateIncidentButtonComponent;
  let fixture: ComponentFixture<CreateIncidentButtonComponent>;
  const windowSpy = jest.spyOn(window, "open").mockImplementation();
  let jiraConfig: JiraConfig;

  beforeEach(() => {
    jiraConfig = {
      incident: {
        createIncidentUrl: jiraIncidentCreationUrl,
        incidentProjectId: "1234",
        projectIdJiraCustomField: "projectIdJiraCustomField",
        correlationIdJiraCustomField: "correlationIdJiraCustomField",
        contextNameCustomField: "contextNameCustomField",
        clientNameCustomField: "clientNameCustomField",
        mxVersionCustomField: "mxVersionCustomField",
        scenarioNameCustomField: "scenarioNameCustomField",
        environmentInfoCustomField: "environmentInfoCustomField",
        referenceEnvironmentInfoCustomField:
          "referenceEnvironmentInfoCustomField",
        mainstreamActivationIncidentIssueTypeValue: "45",
        continuousGreeningIncidentIssueTypeValue: "44",
        detectionLevelQualityGateIdCustomField:
          "detectionLevelQualityGateIdCustomField",
        detectionLevelQualityGateMqgValue: "MQG",
        detectionLevelQualityGateDqgValue: "DQG",
        detectionLevelQualityGateCqgValue: "CQG",
      },
    } as unknown as JiraConfig;

    store = {
      select: jest.fn(() => of(projectName)),
    } as unknown as Store;

    environmentService = {
      getEnvironmentExecutionById: jest.fn((_, id: string) =>
        of(getEnvironment(id))
      ),
    } as unknown as EnvironmentService;

    businessProcessExecutionService = {
      getBusinessProcessExecution: jest.fn(() => of(businessProcessExecution)),
    } as unknown as BusinessProcessExecutionService;

    businessProcessResourcesService = {
      getBusinessProcessResources: jest.fn(() =>
        of([firstBusinessProcessResource, secondBusinessProcessResource])
      ),
    } as unknown as BusinessProcessResourcesService;

    const providers = [
      { provide: Store, useValue: store },
      { provide: EnvironmentService, useValue: environmentService },
      {
        provide: BusinessProcessExecutionService,
        useValue: businessProcessExecutionService,
      },
      {
        provide: BusinessProcessResourcesService,
        useValue: businessProcessResourcesService,
      },
      { provide: JIRA_CONFIG, useValue: jiraConfig },
    ];

    TestBed.configureTestingModule({
      imports: [CreateIncidentButtonComponent],
    }).overrideComponent(CreateIncidentButtonComponent, {
      set: {
        providers: providers,
      },
    });

    fixture = TestBed.createComponent(CreateIncidentButtonComponent);
    component = fixture.componentInstance;

    component.projectId = projectId;
    component.scenarioExecutionId = scenarioExecutionId;
    component.scenarioName = scenarioName;
    component.mxVersion = mxVersion;
    component.environmentId = environmentId;
    component.correlationId$ = of(correlationId);
    component.businessProcessExecutionId = CONTEXT_ID;
    windowSpy.mockClear();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should navigate with the correct base url", () => {
    component.onNavigate();
    expect(windowSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^jira-url\/create\?/),
      "_blank"
    );
  });

  it("should add pid to navigation URL", () => {
    component.onNavigate();
    expect(windowSpy).toHaveBeenCalledWith(
      expect.stringContaining("pid=1234"),
      "_blank"
    );
  });

  it("should add client name to navigation URL", () => {
    component.onNavigate();
    expect(windowSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `clientNameCustomField=${encodeURI(projectName)}`
      ),
      "_blank"
    );
  });

  it("should add mxversion to navigation URL", () => {
    component.onNavigate();
    expect(windowSpy).toHaveBeenCalledWith(
      expect.stringContaining(`mxVersionCustomField=${encodeURI(mxVersion)}`),
      "_blank"
    );
  });

  it("should not include mxversion in the navigation URL if is missing", () => {
    component.mxVersion = undefined;
    component.onNavigate();
    expect(windowSpy).toHaveBeenCalledWith(
      expect.not.stringContaining(
        `mxVersionCustomField=${encodeURI(mxVersion)}`
      ),
      "_blank"
    );
  });

  it("should add project id to navigation URL", () => {
    component.onNavigate();
    expect(windowSpy).toHaveBeenCalledWith(
      expect.stringContaining(`projectIdJiraCustomField=${projectId}`),
      "_blank"
    );
  });

  it("should add correlation id to navigation URL", () => {
    component.onNavigate();
    expect(windowSpy).toHaveBeenCalledWith(
      expect.stringContaining(`correlationIdJiraCustomField=${correlationId}`),
      "_blank"
    );
  });

  describe("issue type", () => {
    it("should set issue type value to mainstream activation incident when issue type is defined and set to mainstream activation", () => {
      component.jumpType = JumpType.MAINSTREAM_ACTIVATION;
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.stringContaining("issuetype=45"),
        "_blank"
      );
    });
    it("should set issue type value to continuous greening incident when issue type is undefined", () => {
      component.jumpType = undefined;
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.stringContaining("issuetype=44"),
        "_blank"
      );
    });
    it("should set issue type value to continuous greening incident when issue type is not set to mainstream activation", () => {
      component.jumpType = "bombardino";
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.stringContaining("issuetype=44"),
        "_blank"
      );
    });
  });

  describe("priority", () => {
    it("should be set to '2-High' when jump type is 'continuous greening' and quality level is 'MQG'", () => {
      component.jumpType = JumpType.CONTINUOUS_GREENING;
      component.qualityLevel = QualityLevel.MQG;

      component.onNavigate();

      expect(windowSpy).toHaveBeenCalledWith(
        expect.stringContaining("priority=2"),
        "_blank"
      );
    });

    it.each([
      [JumpType.MAINSTREAM_ACTIVATION, QualityLevel.CQG],
      [JumpType.MAINSTREAM_ACTIVATION, QualityLevel.DQG],
      [JumpType.MAINSTREAM_ACTIVATION, QualityLevel.MQG],
      [JumpType.CONTINUOUS_GREENING, QualityLevel.CQG],
      [JumpType.CONTINUOUS_GREENING, QualityLevel.DQG],
    ])(
      "should be set to '3-Medium' except when jump type is 'continuous greening' and quality level is 'MQG",
      (jumpType, qualityLevel) => {
        component.jumpType = jumpType;
        component.qualityLevel = qualityLevel;

        component.onNavigate();

        expect(windowSpy).toHaveBeenCalledWith(
          expect.stringContaining("priority=3"),
          "_blank"
        );
      }
    );
  });

  describe("quality level", () => {
    it.each([
      [QualityLevel.MQG, "MQG"],
      [QualityLevel.DQG, "DQG"],
      [QualityLevel.CQG, "CQG"],
      ["anything", "anything"],
    ])(
      "should add quality level %s with value %s to navigation URL",
      (qualityLevel, expectedValue) => {
        component.qualityLevel = qualityLevel;
        component.onNavigate();
        expect(windowSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            `detectionLevelQualityGateIdCustomField=${expectedValue}`
          ),
          "_blank"
        );
      }
    );

    it("should not add quality level to navigation URL when quality level is undefined", () => {
      component.qualityLevel = undefined;
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.not.stringContaining("detectionLevelQualityGateIdCustomField="),
        "_blank"
      );
    });
  });

  describe("environment info", () => {
    it("should add environment info to navigation URL", () => {
      const envInfo = getEnvironmentDetails(environmentId);
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `environmentInfoCustomField=${encodeURI(envInfo)}`
        ),
        "_blank"
      );
    });

    it("should not add environment info if environment id input is not provided", () => {
      component.environmentId = undefined;
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.not.stringContaining("environmentInfoCustomField="),
        "_blank"
      );
    });

    it("should not add environment info to navigation URL if env details are missing", () => {
      const envInfo = [
        "Environment Id: environment_id",
        "MX Hostname: -",
        "MX Client Directory: -",
        "Port Range: - to -",
        "Appdir: -",
        "MX version: -",
        "BuildId: -",
        "Database(s):",
      ].join("\n");

      jest
        .spyOn(environmentService, "getEnvironmentExecutionById")
        .mockReturnValue(
          of({
            id: environmentId,
            applications: undefined,
            databases: undefined,
            clients: undefined,
            bundles: undefined,
          } as unknown as Environment)
        );
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `environmentInfoCustomField=${encodeURI(envInfo)}`
        ),
        "_blank"
      );
    });
  });

  describe("reference environments info", () => {
    it("should fetched reference environments", () => {
      component.onNavigate();
      expect(
        environmentService.getEnvironmentExecutionById
      ).toHaveBeenCalledWith(projectId, firstReferenceEnvironment);
      expect(
        environmentService.getEnvironmentExecutionById
      ).toHaveBeenCalledWith(projectId, secondReferenceEnvironment);
    });

    it("should add reference environment info to navigation URL", () => {
      const envInfo =
        getEnvironmentDetails(firstReferenceEnvironment) +
        "\n\n" +
        getEnvironmentDetails(secondReferenceEnvironment);
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `referenceEnvironmentInfoCustomField=${encodeURI(envInfo)}`
        ),
        "_blank"
      );
    });

    it("should not add the reference environment info if context id is not provided", () => {
      component.businessProcessExecutionId = undefined;
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.not.stringContaining("referenceEnvironmentInfoCustomField="),
        "_blank"
      );
    });

    it("should not add reference environment info to navigation URL if env details are missing", () => {
      const envInfo = [
        `Environment Id: ${firstReferenceEnvironment}`,
        "MX Hostname: -",
        "MX Client Directory: -",
        "Port Range: - to -",
        "Appdir: -",
        "MX version: -",
        "BuildId: -",
        "Database(s):",
      ].join("\n");

      jest
        .spyOn(environmentService, "getEnvironmentExecutionById")
        .mockReturnValue(
          of({
            ...getEnvironment(firstReferenceEnvironment),
            primaryApplicative: undefined,
            databases: undefined,
            clients: undefined,
            bundles: undefined,
          } as unknown as Environment)
        );
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `referenceEnvironmentInfoCustomField=${encodeURI(envInfo)}`
        ),
        "_blank"
      );
    });

    it("should include active reference environments only in the URL", () => {
      jest
        .spyOn(environmentService, "getEnvironmentExecutionById")
        .mockImplementation((_, id: string) => {
          if (id === secondReferenceEnvironment) {
            return of({
              ...getEnvironment(id),
              status: EnvironmentStatus.CLEANED,
            });
          }
          return of(getEnvironment(id));
        });
      const envInfo = getEnvironmentDetails(firstReferenceEnvironment);
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `referenceEnvironmentInfoCustomField=${encodeURI(envInfo)}`
        ),
        "_blank"
      );
    });
  });

  describe("business process name", () => {
    it("should add context name to navigation URL", () => {
      component.onNavigate();
      expect(
        businessProcessExecutionService.getBusinessProcessExecution
      ).toHaveBeenCalledWith(projectId, CONTEXT_ID);
      expect(windowSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `contextNameCustomField=${encodeURI(contextName)}`
        ),
        "_blank"
      );
    });

    it("should not add context name to navigation URL if context id is not provided", () => {
      component.businessProcessExecutionId = undefined;
      component.onNavigate();
      expect(
        businessProcessExecutionService.getBusinessProcessExecution
      ).not.toHaveBeenCalled();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.not.stringContaining("contextNameCustomField="),
        "_blank"
      );
    });
  });

  describe("scenario name", () => {
    it("should add scenario name to navigation URL", () => {
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `scenarioNameCustomField=${encodeURI(scenarioName)}`
        ),
        "_blank"
      );
    });

    it("should not add scenario name to navigation URL if scenario name input is not provided", () => {
      component.scenarioName = undefined;
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.not.stringContaining("scenarioNameCustomField="),
        "_blank"
      );
    });
  });

  describe("handling errors", () => {
    it("should still navigate to the URL even on failure to get the project name", () => {
      jest
        .spyOn(store, "select")
        .mockReturnValue(throwError(() => new Error()));
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.not.stringContaining("clientNameCustomField="),
        "_blank"
      );
    });

    it("should still navigate to the URL even on failure to get environment details", () => {
      jest
        .spyOn(environmentService, "getEnvironmentExecutionById")
        .mockReturnValue(throwError(() => new Error()));
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.not.stringContaining("environmentInfoCustomField="),
        "_blank"
      );
    });

    it("should still navigate to the URL even on failure to get context name", () => {
      jest
        .spyOn(businessProcessExecutionService, "getBusinessProcessExecution")
        .mockReturnValue(throwError(() => new Error()));
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.not.stringContaining("contextNameCustomField="),
        "_blank"
      );
    });

    it("should still navigate to the URL even on failure to get reference environments", () => {
      jest
        .spyOn(businessProcessResourcesService, "getBusinessProcessResources")
        .mockReturnValue(throwError(() => new Error()));
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.not.stringContaining("referenceEnvironmentInfoCustomField="),
        "_blank"
      );
    });

    it("should still navigate to the URL even on failure to get reference environment details", () => {
      jest
        .spyOn(environmentService, "getEnvironmentExecutionById")
        .mockReturnValue(throwError(() => new Error()));
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.not.stringContaining("referenceEnvironmentInfoCustomField="),
        "_blank"
      );
    });

    it("should still navigate to the URL even on failure to create incident link", () => {
      component.correlationId$ = throwError(() => new Error("error"));
      component.onNavigate();
      expect(windowSpy).toHaveBeenCalledWith(
        expect.not.stringContaining("correlationIdJiraCustomField="),
        "_blank"
      );
    });

    it("should set loading to false", () => {
      jest
        .spyOn(store, "select")
        .mockReturnValue(throwError(() => new Error()));
      component.onNavigate();
      expect(component.isButtonLoading).toBeFalsy();
    });
  });

  it("should call next and complete on destroy$", () => {
    const destroyNext = jest.spyOn(component["destroy$"], "next");
    const destroyComplete = jest.spyOn(component["destroy$"], "complete");

    component.ngOnDestroy();

    expect(destroyNext).toHaveBeenCalledWith({});
    expect(destroyComplete).toHaveBeenCalled();
  });
});

function getEnvironment(id: string): Environment {
  return {
    id: id,
    status: EnvironmentStatus.READY,
    primaryApplicative: {
      directory: "directory1",
      allocation: {
        ports: {
          start: 1000,
          end: 2000,
        },
        machine: {
          name: "name1",
        },
      },
    },
    databases: [
      {
        name: "db1",
        allocation: {
          port: 400,
          machine: {
            name: "machine1",
          },
        },
      },
      {
        name: "db2",
        allocation: {
          port: 600,
          machine: {
            name: "machine2",
          },
        },
      },
    ],
    clients: [
      {
        directory: "directory2",
      },
    ],
    bundles: [
      {
        version: "buildId",
        branch: "branch",
      },
    ],
  } as unknown as Environment;
}

function getEnvironmentDetails(environmentId: string): string {
  return [
    `Environment Id: ${environmentId}`,
    "MX Hostname: name1",
    "MX Client Directory: directory2",
    "Port Range: 1000 to 2000",
    "Appdir: directory1",
    "MX version: branch",
    "BuildId: buildId",
    "Database(s):",
    "DB Name: db1",
    "DB Host: machine1",
    "DB Port: 400",
    "",
    "DB Name: db2",
    "DB Host: machine2",
    "DB Port: 600",
    "",
  ].join("\n");
}
