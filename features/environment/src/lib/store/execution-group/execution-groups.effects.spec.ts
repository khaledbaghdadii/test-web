import { firstValueFrom, Observable, of, throwError } from "rxjs";
import {
  ExecutionGroup,
  ExecutionGroupStatus,
} from "../../technical-reseed/execution-group-models";
import { ExecutionGroupsEffects } from "./execution-groups.effects";
import { TechnicalReseedService } from "../../technical-reseed/service/technical-reseed.service";
import { TestBed } from "@angular/core/testing";
import { provideMockActions } from "@ngrx/effects/testing";
import {
  executionGroupRetrieved,
  failedToRetrieveExecutionGroup,
  retrieveExecutionGroup,
} from "./execution-groups.action";
import { Action } from "@ngrx/store";

const PROJECT_ID = "project-id";
const EXECUTION_GROUP_ID = "execution-group-id";

const executionGroup: ExecutionGroup = {
  executionGroupId: EXECUTION_GROUP_ID,
  status: ExecutionGroupStatus.ENABLED,
  launchesAllowed: true,
  technicalReseedOperations: [],
};

describe("Execution Groups Effects", () => {
  let actions$: Observable<Action>;
  let effects: ExecutionGroupsEffects;
  let technicalReseedService: jest.Mocked<TechnicalReseedService>;

  beforeEach(() => {
    technicalReseedService = {
      getTechnicalReseedExecutionGroupDetails: jest.fn(),
    } as unknown as jest.Mocked<TechnicalReseedService>;

    TestBed.configureTestingModule({
      providers: [
        ExecutionGroupsEffects,
        provideMockActions(() => actions$),
        { provide: TechnicalReseedService, useValue: technicalReseedService },
      ],
    });

    effects = TestBed.inject(ExecutionGroupsEffects);
  });

  it("should dispatch execution Group Retrieved on success", async () => {
    technicalReseedService.getTechnicalReseedExecutionGroupDetails.mockReturnValue(
      of(executionGroup)
    );
    actions$ = of(
      retrieveExecutionGroup({
        projectId: PROJECT_ID,
        executionGroupId: EXECUTION_GROUP_ID,
      })
    );
    const result = await firstValueFrom(effects.retrieveExecutionGroup$);
    expect(result).toEqual(
      executionGroupRetrieved({ executionGroup: executionGroup })
    );
    expect(
      technicalReseedService.getTechnicalReseedExecutionGroupDetails
    ).toHaveBeenCalledWith(PROJECT_ID, EXECUTION_GROUP_ID);
  });

  it("should dispatch failed To Retrieve Execution Group on error", async () => {
    const errorMessage = "API error";
    technicalReseedService.getTechnicalReseedExecutionGroupDetails.mockReturnValue(
      throwError(() => new Error(errorMessage))
    );
    actions$ = of(
      retrieveExecutionGroup({
        projectId: PROJECT_ID,
        executionGroupId: EXECUTION_GROUP_ID,
      })
    );
    const result = await firstValueFrom(effects.retrieveExecutionGroup$);
    expect(result).toEqual(
      failedToRetrieveExecutionGroup({
        executionGroupId: EXECUTION_GROUP_ID,
        error: errorMessage,
      })
    );
    expect(
      technicalReseedService.getTechnicalReseedExecutionGroupDetails
    ).toHaveBeenCalledWith(PROJECT_ID, EXECUTION_GROUP_ID);
  });
});
