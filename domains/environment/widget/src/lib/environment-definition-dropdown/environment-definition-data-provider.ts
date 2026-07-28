import { Observable } from "rxjs";
import {
  DropdownOption,
  MxEvolveSingleSelectDataProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import type { EnvironmentDefinition } from "@mxevolve/domains/environment/data-access";
import { EnvironmentDefinitionService } from "@mxevolve/domains/environment/data-access";

export interface EnvironmentDefinitionParams {
  projectId: string;
}

export class EnvironmentDefinitionDataProvider
  implements
    MxEvolveSingleSelectDataProvider<
      EnvironmentDefinition,
      EnvironmentDefinitionParams
    >
{
  constructor(private readonly service: EnvironmentDefinitionService) {}

  fetchData({
    projectId,
  }: EnvironmentDefinitionParams): Observable<EnvironmentDefinition[]> {
    return this.service.getEnvironmentDefinitions(projectId);
  }

  toDropdownOption(
    item: EnvironmentDefinition
  ): DropdownOption<EnvironmentDefinition> {
    return { label: item.name, value: item };
  }

  getItemId(item: EnvironmentDefinition): string {
    return item.id;
  }
}
