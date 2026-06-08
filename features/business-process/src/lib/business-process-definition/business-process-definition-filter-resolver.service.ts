import { Injectable } from "@angular/core";
import { BusinessProcessDefinition } from "@mxflow/features/business-process";

@Injectable()
export class BusinessProcessDefinitionFilterResolverService {
  resolveDefinitionIdsFrom(
    businessProcessDefinitions: BusinessProcessDefinition[] | undefined,
    definitionIdsFilters: string[] | undefined,
    processNameFilters: string[] | undefined
  ): string[] | undefined {
    if (!businessProcessDefinitions?.length) {
      return undefined;
    }

    if (this.noFiltersSpecified(definitionIdsFilters, processNameFilters)) {
      return undefined;
    }

    if (!definitionIdsFilters && processNameFilters) {
      return this.getDefinitionsMatchingProcessNameFilter(
        businessProcessDefinitions,
        processNameFilters
      ).map((definition) => definition.id);
    }

    if (!processNameFilters && definitionIdsFilters) {
      return this.getDefinitionsMatchingIdFilter(
        businessProcessDefinitions,
        definitionIdsFilters
      ).map((definition) => definition.id);
    }

    let filteredByDefinitionId: BusinessProcessDefinition[] = [];
    let filteredByProcessName: BusinessProcessDefinition[] = [];

    if (definitionIdsFilters)
      filteredByDefinitionId = this.getDefinitionsMatchingIdFilter(
        businessProcessDefinitions,
        definitionIdsFilters
      );

    if (processNameFilters) {
      filteredByProcessName = this.getDefinitionsMatchingProcessNameFilter(
        businessProcessDefinitions,
        processNameFilters
      );
    }

    if (
      this.foundDefinitionsMatchingBothFilters(
        filteredByDefinitionId,
        filteredByProcessName
      )
    ) {
      return this.computeFilterIntersection(
        filteredByDefinitionId,
        filteredByProcessName
      );
    } else if (
      this.foundDefinitionsMatchingDefinitionFilter(filteredByDefinitionId)
    ) {
      return filteredByDefinitionId.map((definition) => definition.id);
    } else if (
      this.foundDefinitionsMatchingProcessNameFilter(filteredByProcessName)
    ) {
      return filteredByProcessName.map((definition) => definition.id);
    }
    return [];
  }

  private noFiltersSpecified(
    definitionIdsFilters: string[] | undefined,
    processNameFilters: string[] | undefined
  ) {
    return (
      (!definitionIdsFilters || definitionIdsFilters.length === 0) &&
      (!processNameFilters || processNameFilters.length === 0)
    );
  }

  private definitionFilterIsSelected(definitionIdsFilters: string[]) {
    return definitionIdsFilters.length !== 0;
  }

  private processNameFilterIsSelected(processNameFilters: string[]) {
    return processNameFilters.length !== 0;
  }

  private getDefinitionsMatchingIdFilter(
    businessProcessDefinitions: BusinessProcessDefinition[],
    definitionIdsFilters: string[]
  ) {
    if (this.definitionFilterIsSelected(definitionIdsFilters)) {
      return businessProcessDefinitions.filter((definition) =>
        definitionIdsFilters.some(
          (definitionsFilter) => definition.id === definitionsFilter
        )
      );
    }
    return [];
  }

  private getDefinitionsMatchingProcessNameFilter(
    businessProcessDefinitions: BusinessProcessDefinition[],
    processNameFilters: string[]
  ) {
    if (this.processNameFilterIsSelected(processNameFilters)) {
      return businessProcessDefinitions.filter((definition) =>
        processNameFilters.some(
          (processNameFilter) => definition.processName === processNameFilter
        )
      );
    }
    return [];
  }

  private computeFilterIntersection(
    filteredByDefinitionId: BusinessProcessDefinition[],
    filteredByProcessName: BusinessProcessDefinition[]
  ) {
    let result: BusinessProcessDefinition[];
    result = filteredByDefinitionId.filter((filteredDefinition) =>
      filteredByProcessName.some(
        (filteredByProcessName) =>
          filteredByProcessName.id === filteredDefinition.id
      )
    );
    if (result.length) {
      return result.map((definition) => definition.id);
    } else {
      return ["noMatch"];
    }
  }

  private foundDefinitionsMatchingBothFilters(
    filteredByDefinitionId: BusinessProcessDefinition[],
    filteredByProcessName: BusinessProcessDefinition[]
  ) {
    return (
      this.foundDefinitionsMatchingDefinitionFilter(filteredByDefinitionId) &&
      this.foundDefinitionsMatchingProcessNameFilter(filteredByProcessName)
    );
  }

  private foundDefinitionsMatchingDefinitionFilter(
    filteredByDefinitionId: BusinessProcessDefinition[]
  ) {
    return filteredByDefinitionId.length !== 0;
  }

  private foundDefinitionsMatchingProcessNameFilter(
    filteredByProcessName: BusinessProcessDefinition[]
  ) {
    return filteredByProcessName.length !== 0;
  }
}
