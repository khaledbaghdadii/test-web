import { Pipe, PipeTransform } from "@angular/core";
import { TestDefinition } from "@mxevolve/domains/test/model";
import { TableSearchPipe } from "@mxflow/pipe";

@Pipe({
  name: "tableSearch",
})
export class TestDefinitionTableSearchPipe
  extends TableSearchPipe
  implements PipeTransform
{
  search(value: any, searchValue: string) {
    return value.filter((item: TestDefinition) => {
      const id = item.id.toLowerCase().includes(searchValue);
      const name = item.name.toLowerCase().includes(searchValue);
      const path = item.path.toLowerCase().includes(searchValue);
      const description = item.description.toLowerCase().includes(searchValue);

      return id || name || path || description;
    });
  }
}
