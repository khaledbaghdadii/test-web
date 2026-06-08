import { Injectable } from "@angular/core";
import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
  BusinessProcessFamily,
} from "@mxflow/features/business-process";
import { map, Observable } from "rxjs";

@Injectable()
export class SourceDefinitionsFetcherService {
  constructor(private definitionService: BusinessProcessDefinitionService) {}

  getSourceBusinessProcessDefinitionsMap(
    projectId: string
  ): Observable<Map<BusinessProcessFamily, BusinessProcessDefinition[]>> {
    return this.definitionService
      .getBusinessProcessDefinitions({
        projectId: projectId,
        extendable: true,
      })
      .pipe(map((definitions) => this.groupDefinitionsByFamily(definitions)));
  }

  private groupDefinitionsByFamily(definitions: BusinessProcessDefinition[]) {
    let familyIdMapper = this.getFamilyIdMapper(definitions);
    let result = new Map<BusinessProcessFamily, BusinessProcessDefinition[]>();
    definitions.forEach((definition) => {
      const family = familyIdMapper.get(definition.family.id)!;
      if (!result.has(family)) {
        result.set(family, []);
      }
      result.get(family)!.push(definition);
    });
    return result;
  }

  private getFamilyIdMapper(definitions: BusinessProcessDefinition[]) {
    return definitions.reduce((familyIdMapper, definition) => {
      const family = definition.family;
      if (!familyIdMapper.has(family.id)) {
        familyIdMapper.set(family.id, family);
      }
      return familyIdMapper;
    }, new Map<string, BusinessProcessFamily>());
  }
}
