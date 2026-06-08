import { firstValueFrom, Observable, of, throwError } from "rxjs";
import { EnvironmentDefinitionStatus } from "../../environment-definition-status";
import { EnvironmentService } from "../../service/environment.service";
import { EnvironmentDefinitionsEffects } from "./environment-definitions.effects";
import { EnvironmentDefinition } from "@mxflow/features/environment";
import { TestBed } from "@angular/core/testing";
import {
  environmentDefinitionsRetrieved,
  failedToRetrieveEnvironmentDefinitions,
  retrieveEnvironmentDefinitions,
} from "./environment-definitions.action";
import { provideMockActions } from "@ngrx/effects/testing";
import { Action } from "@ngrx/store";

const PROJECT_ID = "project-id";

const mockDefinitions: EnvironmentDefinition[] = [
  {
    id: "env-1",
    name: "Dev",
    status: EnvironmentDefinitionStatus.ACTIVE,
  },
];

describe("Environment Definitions Effects", () => {
  let actions$: Observable<Action>;
  let effects: EnvironmentDefinitionsEffects;
  let environmentService: jest.Mocked<EnvironmentService>;

  beforeEach(() => {
    environmentService = {
      getEnvironmentDefinitions: jest.fn(),
    } as unknown as jest.Mocked<EnvironmentService>;

    TestBed.configureTestingModule({
      providers: [
        EnvironmentDefinitionsEffects,
        provideMockActions(() => actions$),
        { provide: EnvironmentService, useValue: environmentService },
      ],
    });

    effects = TestBed.inject(EnvironmentDefinitionsEffects);
  });

  it("should dispatch environment Definitions Retrieved on success", async () => {
    environmentService.getEnvironmentDefinitions.mockReturnValue(
      of(mockDefinitions)
    );
    actions$ = of(retrieveEnvironmentDefinitions({ projectId: PROJECT_ID }));

    const result = await firstValueFrom(
      effects.retrieveEnvironmentDefinitions$
    );
    expect(result).toEqual(
      environmentDefinitionsRetrieved({
        projectId: PROJECT_ID,
        environmentDefinitions: mockDefinitions,
      })
    );
    expect(environmentService.getEnvironmentDefinitions).toHaveBeenCalledWith(
      PROJECT_ID
    );
  });

  it("should dispatch failed To Retrieve Environment Definitions on error", async () => {
    const errorMessage = "API error";
    environmentService.getEnvironmentDefinitions.mockReturnValue(
      throwError(() => new Error(errorMessage))
    );
    actions$ = of(retrieveEnvironmentDefinitions({ projectId: PROJECT_ID }));

    const result = await firstValueFrom(
      effects.retrieveEnvironmentDefinitions$
    );
    expect(result).toEqual(
      failedToRetrieveEnvironmentDefinitions({
        projectId: PROJECT_ID,
        error: errorMessage,
      })
    );
    expect(environmentService.getEnvironmentDefinitions).toHaveBeenCalledWith(
      PROJECT_ID
    );
  });
});
