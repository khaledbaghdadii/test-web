import { ScenarioDefinition, Test } from "./scenario-definition";
import {
  ScenarioDefinitionApiResponse,
  TestDefinitionApiResponse,
} from "./response/scenario-definition-api-response.model";
import { BusinessProcessChain } from "@mxflow/features/streams";
import { EnvironmentDefinition } from "@mxflow/features/environment";
import { TestDefinition, TestSelection } from "@mxevolve/domains/test/model";

export class ScenarioDefinitionMapper {
  static toScenarioDefinition(
    scenarioDefinitionApiResponse: ScenarioDefinitionApiResponse,
    testDefinitions: TestDefinition[],
    allBpcs: BusinessProcessChain[],
    environmentDefinitions: EnvironmentDefinition[]
  ): ScenarioDefinition {
    return {
      id: scenarioDefinitionApiResponse.id,
      name: scenarioDefinitionApiResponse.name,
      active: scenarioDefinitionApiResponse.active,
      archived: scenarioDefinitionApiResponse.archived,
      bpcs: allBpcs.filter((bpc) =>
        scenarioDefinitionApiResponse.bpcs.some((bpcId) => bpcId == bpc.id)
      ),
      heaviness: scenarioDefinitionApiResponse.heaviness,
      idempotent: scenarioDefinitionApiResponse.idempotent,
      nonFunctionalTest: scenarioDefinitionApiResponse.nonFunctionalTest,
      environmentDefinition: environmentDefinitions.find(
        (env) => env.id == scenarioDefinitionApiResponse.environmentDefinitionId
      ) as EnvironmentDefinition,
      tests: scenarioDefinitionApiResponse.tests.map((testResponse) => {
        return ScenarioDefinitionMapper.toTestDefinition(
          testDefinitions,
          testResponse
        );
      }),
    };
  }

  static toTestDefinition(
    testDefinitions: TestDefinition[],
    test: TestDefinitionApiResponse
  ): Test {
    const testDefinition = ScenarioDefinitionMapper.getTestDefinition(
      testDefinitions,
      test.testDefinitionId
    );
    return {
      full: test.testSelectionIds.length === 0,
      testDefinition: testDefinition,
      testSelections: test.testSelectionIds
        .filter((testSelectionId) =>
          testDefinition.testSelections.some((tc) => tc.id === testSelectionId)
        )
        .map((id) =>
          ScenarioDefinitionMapper.getTestSelection(
            testDefinition.testSelections,
            id
          )
        ),
    };
  }

  static getTestSelection(
    testSelections: TestSelection[],
    targetId: string
  ): TestSelection {
    const testSelection = testSelections.find((tc) => tc.id === targetId);
    if (testSelection) {
      return testSelection;
    }
    return {} as TestSelection;
  }

  static getTestDefinition(
    testDefinitions: TestDefinition[],
    targetId: string
  ) {
    const testDefinition = testDefinitions.find((td) => td.id === targetId);
    if (testDefinition) {
      return testDefinition;
    }

    throw new Error("Test Definition was not found");
  }
}
