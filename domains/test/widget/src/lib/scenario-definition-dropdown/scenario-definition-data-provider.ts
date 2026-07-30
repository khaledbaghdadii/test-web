import { Observable } from "rxjs";
import {
  DropdownOption,
  MxEvolveSingleSelectDataProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  ScenarioDefinitionApiResponse,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { ScenarioDefinitionActivityStatus } from "@mxevolve/domains/test/model";

export interface ScenarioDefinitionParams {
  projectId: string;
}

export class ScenarioDefinitionDataProvider
  implements
    MxEvolveSingleSelectDataProvider<
      ScenarioDefinitionApiResponse,
      ScenarioDefinitionParams
    >
{
  constructor(
    private readonly scenarioDefinitionService: ScenarioDefinitionService
  ) {}

  fetchData(
    params: ScenarioDefinitionParams
  ): Observable<ScenarioDefinitionApiResponse[]> {
    return this.scenarioDefinitionService.getScenarioDefinitions(
      params.projectId,
      ScenarioDefinitionActivityStatus.ACTIVE
    );
  }

  toDropdownOption(
    item: ScenarioDefinitionApiResponse
  ): DropdownOption<ScenarioDefinitionApiResponse> {
    return { label: item.name, value: item };
  }

  getItemId(item: ScenarioDefinitionApiResponse): string {
    return item.id;
  }
}
