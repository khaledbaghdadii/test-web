import { Pipe, PipeTransform } from "@angular/core";
import { FilterList } from "./filter-list";
import { BusinessProcessDefinition } from "../business-process-definition/business-process-definition";

@Pipe({
  name: "businessProcessNameToFilterList",
  standalone: true,
})
export class BusinessProcessNameToFilterListPipe implements PipeTransform {
  transform(
    definitions: BusinessProcessDefinition[] | null,
    familyId: string
  ): FilterList[] {
    if (definitions) {
      return definitions
        .filter((definition) => definition.family.id === familyId)
        .map((definition) => definition.processName)
        .filter(this.uniqueValuesPredicate())
        .map((processName) => {
          return { text: processName, value: processName };
        });
    }
    return [];
  }

  private uniqueValuesPredicate() {
    return (name: string, index: number, processNames: string[]) =>
      processNames.indexOf(name) === index;
  }
}
