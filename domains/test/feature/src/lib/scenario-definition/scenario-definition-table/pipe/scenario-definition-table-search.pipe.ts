import { Pipe, PipeTransform } from "@angular/core";
import { ScenarioDefinition } from "@mxevolve/domains/test/model";
import { TableSearchPipe } from "./table-search.pipe";

@Pipe({
  name: "tableSearch",
  standalone: true,
})
export class ScenarioDefinitionTableSearchPipe
  extends TableSearchPipe
  implements PipeTransform
{
  search(value: ScenarioDefinition[], searchValue: string) {
    return value.filter((item: ScenarioDefinition) => {
      const id = item.id.toLowerCase().includes(searchValue);
      const name = item.name.toLowerCase().includes(searchValue);
      const env = item.environmentDefinition.name
        .toLocaleLowerCase()
        .includes(searchValue);
      const testDefinition = item.tests
        .map((test) => test.testDefinition.name)
        .join()
        .toLowerCase()
        .includes(searchValue);
      const testSelection = item.tests
        .map((test) => test.testSelections.map((tc) => tc.name).join())
        .join()
        .toLowerCase()
        .includes(searchValue);
      return id || name || testDefinition || testSelection || env;
    });
  }
}
