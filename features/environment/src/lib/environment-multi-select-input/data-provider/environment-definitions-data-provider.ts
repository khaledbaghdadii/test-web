import { Observable } from "rxjs";
import { EnvironmentDefinition } from "../../environment-definition";
import { EnvironmentService } from "../../service/environment.service";
import {
  MxEvolveSingleSelectDataProvider,
  DropdownOption,
} from "@mxflow/ui/mxevolve-dropdown";

/**
 * Data provider for environment definitions multi-select dropdown
 * Fetches all environment definitions at once (non-paginated)
 * Frontend filtering is handled by the state provider
 */
export class EnvironmentDefinitionsDataProvider
  implements
    MxEvolveSingleSelectDataProvider<
      EnvironmentDefinition,
      { projectId: string; includeInactive: boolean }
    >
{
  constructor(private readonly environmentService: EnvironmentService) {}

  fetchData(params: {
    projectId: string;
    includeInactive: boolean;
  }): Observable<EnvironmentDefinition[]> {
    return this.environmentService.getEnvironmentDefinitions(
      params.projectId,
      params.includeInactive
    );
  }

  toDropdownOption(
    definition: EnvironmentDefinition
  ): DropdownOption<EnvironmentDefinition> {
    return {
      label: definition.name,
      value: definition,
    };
  }

  getItemId(definition: EnvironmentDefinition): string {
    return definition.id;
  }
}
