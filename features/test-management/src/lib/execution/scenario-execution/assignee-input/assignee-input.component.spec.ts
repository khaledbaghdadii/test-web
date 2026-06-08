import { AssigneeInputComponent } from "./assignee-input.component";
import { ScenarioDefinition } from "../../../definition/scenario-definition/scenario-definition";
import { ScenarioDefinitionService } from "../../../definition/scenario-definition/scenario-definition.service";
import { ScenarioExecutionService } from "../scenario-execution.service";
import { UpdateAssigneeRequest } from "../request/update-assignee-request";
import { User, UsersApiModel, UserService } from "@mxflow/features/user";
import { EnvironmentDefinition } from "@mxflow/features/environment";
import { of, throwError } from "rxjs";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";

const displayName = "displayName";
const userMail = "userMail";
const userId = "userId";
const scenarioDefinitionName = "scenarioDefinitionName";
const projectId = "projectId";
const contextId = "contextId";
const subContextId = "subContextId";
const scenarioDefinitionId = "scenarioDefinitionId";
const bpcId = "bpcId";
const bpc = "bpc";
const anotherBpc = "anotherBpc";
const anotherBpcId = "anotherBpcId";
const anotherUserId = "anotherUserId";
const anotherUserMail = "anotherUserMail";
const anotherDisplayName = "anotherDisplayName";

describe("Assignee Input Component Test", () => {
  let scenarioExecutionService: jest.Mocked<ScenarioExecutionService>;
  let userService: jest.Mocked<UserService>;
  let scenarioService: jest.Mocked<ScenarioDefinitionService>;
  let assigneeInputComponent: AssigneeInputComponent;
  let componentFixture: ComponentFixture<AssigneeInputComponent>;
  const mockElementRef = {
    nativeElement: {
      focus: jest.fn(),
    },
  };
  beforeEach(() => {
    scenarioExecutionService = {
      updateAssignee: jest.fn(() => of()),
    } as unknown as jest.Mocked<ScenarioExecutionService>;
    userService = {
      getUsersByBpcIds: jest.fn().mockReturnValue(of(getUsersApiResponse())),
    } as unknown as jest.Mocked<UserService>;
    scenarioService = {
      getScenarioDefinitionById: jest.fn(() => of(getScenarioDefinition())),
    } as unknown as jest.Mocked<ScenarioDefinitionService>;
    TestBed.configureTestingModule({
      imports: [AssigneeInputComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    }).overrideComponent(AssigneeInputComponent, {
      set: {
        schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        providers: [
          { provide: UserService, useValue: userService },
          { provide: ScenarioDefinitionService, useValue: scenarioService },
          {
            provide: ScenarioExecutionService,
            useValue: scenarioExecutionService,
          },
        ],
      },
    });
    componentFixture = TestBed.createComponent(AssigneeInputComponent);
    assigneeInputComponent = componentFixture.componentInstance;

    assigneeInputComponent.projectId = projectId;
    assigneeInputComponent.contextId = contextId;
    assigneeInputComponent.subContextId = subContextId;
    assigneeInputComponent.scenarioDefinitionId = scenarioDefinitionId;
    assigneeInputComponent.selectedAssigneeId = getUser().id;
  });

  describe("On Init", () => {
    it("should get scenario definition by ID and get users by bpc ids", () => {
      const doneLoadingUsersEmitter = jest.spyOn(
        assigneeInputComponent.doneLoadingUsers,
        "emit"
      );

      assigneeInputComponent.ngOnInit();

      expect(scenarioService.getScenarioDefinitionById).toHaveBeenCalledWith(
        scenarioDefinitionId,
        projectId
      );
      expect(userService.getUsersByBpcIds).toHaveBeenCalledWith(
        getBpcsId(),
        projectId,
        1000,
        0,
        ""
      );
      expect(assigneeInputComponent.users).toStrictEqual([getUser()]);
      expect(assigneeInputComponent.isLoadingUsers).toBeFalsy();
      expect(doneLoadingUsersEmitter).toHaveBeenCalled();
    });

    it("should update error message when getUsersByBpcIds throws error", () => {
      const doneLoadingUsersEmitter = jest.spyOn(
        assigneeInputComponent.doneLoadingUsers,
        "emit"
      );
      const ERROR_MESSAGE = "ERROR_MESSAGE";
      userService.getUsersByBpcIds.mockReturnValueOnce(
        throwError(() => new Error(ERROR_MESSAGE))
      );
      let receivedError: string | undefined;
      assigneeInputComponent.errorMessageEmitter.subscribe(
        (message) => (receivedError = message)
      );

      assigneeInputComponent.ngOnInit();
      expect(receivedError).toBe(ERROR_MESSAGE);
      expect(assigneeInputComponent.isLoadingUsers).toBeFalsy();
      expect(doneLoadingUsersEmitter).toHaveBeenCalled();
    });
  });

  describe("onOpenDropdown", () => {
    it("should focus", () => {
      assigneeInputComponent.filterInput = mockElementRef;
      assigneeInputComponent.onOpenDropdown();
      expect(mockElementRef.nativeElement.focus).toHaveBeenCalled();
    });
  });
  describe("Change assignee", () => {
    it("should update the scenario assignee", () => {
      assigneeInputComponent.changeAssignee(getAnotherUser().id);

      expect(scenarioExecutionService.updateAssignee).toHaveBeenCalledWith(
        getUpdateAssigneeRequest()
      );
    });

    it("should set the previous assignee to the newly fetched user", () => {
      assigneeInputComponent.changeAssignee(getAnotherUser().id);

      expect(assigneeInputComponent.previousSelectedAssignee).toStrictEqual(
        getAnotherUser().id
      );
    });

    it("should not set the assignee if it did not change", () => {
      assigneeInputComponent.previousSelectedAssignee = getUser().id;
      assigneeInputComponent.changeAssignee(getUser().id);

      expect(scenarioExecutionService.updateAssignee).not.toHaveBeenCalled();
    });

    it("should update error message when updateAssignee throws error", () => {
      const ERROR_MESSAGE = "ERROR_MESSAGE";
      scenarioExecutionService.updateAssignee.mockReturnValueOnce(
        throwError(() => new Error(ERROR_MESSAGE))
      );
      let receivedError: string | undefined;
      assigneeInputComponent.errorMessageEmitter.subscribe(
        (message) => (receivedError = message)
      );

      assigneeInputComponent.changeAssignee(getUser().id);
      expect(receivedError).toBe(ERROR_MESSAGE);
    });
  });
});

function getUser(): User {
  return {
    id: userId,
    mail: userMail,
    displayName: displayName,
  };
}

function getAnotherUser(): User {
  return {
    id: anotherUserId,
    mail: anotherUserMail,
    displayName: anotherDisplayName,
  };
}

function getScenarioDefinition(): ScenarioDefinition {
  return {
    id: scenarioDefinitionId,
    name: scenarioDefinitionName,
    tests: [],
    idempotent: false,
    environmentDefinition: {} as EnvironmentDefinition,
    bpcs: [
      {
        name: bpc,
        id: bpcId,
      },
      {
        name: anotherBpc,
        id: anotherBpcId,
      },
    ],
    heaviness: "HEAVY",
  } as unknown as ScenarioDefinition;
}

function getBpcsId(): string[] {
  return [bpcId, anotherBpcId];
}

function getUpdateAssigneeRequest(): UpdateAssigneeRequest {
  return {
    projectId: projectId,
    contextId: contextId,
    subContextId: subContextId,
    scenarioDefinitionId: scenarioDefinitionId,
    assignee: anotherUserId,
  };
}

function getUsersApiResponse(): UsersApiModel {
  return {
    users: [
      {
        id: userId,
        displayName: displayName,
        mail: userMail,
      },
    ],
    lastPage: true,
  };
}
