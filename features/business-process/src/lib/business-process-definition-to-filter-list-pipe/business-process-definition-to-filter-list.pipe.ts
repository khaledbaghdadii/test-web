import { Pipe, PipeTransform } from "@angular/core";
import {
  BusinessProcessDefinition,
  BusinessProcessType,
} from "@mxflow/features/business-process";
import { FilterList } from "./filter-list";

@Pipe({
  name: "businessProcessDefinitionToFilterList",
  standalone: false,
})
export class BusinessProcessDefinitionToFilterListPipe
  implements PipeTransform
{
  transform(
    definitions: BusinessProcessDefinition[] | null,
    businessProcessType: BusinessProcessType
  ): FilterList[] {
    if (definitions) {
      return definitions
        .filter((definition) => definition.family.id === businessProcessType)
        .filter((definition) => definition.executable)
        .map((definition) => {
          return { text: definition.name, value: definition.id } as FilterList;
        });
    }
    return [];
  }
}
