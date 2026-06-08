import { Observable } from "rxjs";
import {
  DropdownOption,
  MxEvolveSingleSelectDataProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import { ScenarioDefinition } from "./scenario-definition";
import { ScenarioDefinitionService } from "./scenario-definition.service";

export interface ScenarioDefinitionParams {
  projectId: string;
}

export class ScenarioDefinitionDataProvider
  implements
    MxEvolveSingleSelectDataProvider<
      ScenarioDefinition,
      ScenarioDefinitionParams
    >
{
  constructor(private readonly service: ScenarioDefinitionService) {}

  fetchData(
    params: ScenarioDefinitionParams
  ): Observable<ScenarioDefinition[]> {
    return this.service.getScenarioDefinitions(params.projectId);
  }

  toDropdownOption(
    item: ScenarioDefinition
  ): DropdownOption<ScenarioDefinition> {
    return { label: item.name, value: item };
  }

  getItemId(item: ScenarioDefinition): string {
    return item.id;
  }
}
