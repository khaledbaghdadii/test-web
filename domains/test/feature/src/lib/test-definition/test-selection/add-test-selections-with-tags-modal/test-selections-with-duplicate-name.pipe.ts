import { Pipe, PipeTransform, inject } from "@angular/core";
import { TestSelectionDuplicateUtilsService } from "./test-selection-duplicate-utils.service";
import { TestSelectionsWithDuplicateNameTableData } from "./test-selections-with-duplicate-name-table-data.model";
import { TestSelection } from "@mxevolve/domains/test/model";

@Pipe({
  name: "testSelectionsWithDuplicateName",
})
export class TestSelectionsWithDuplicateNamePipe implements PipeTransform {
  private testSelectionDuplicateService = inject(
    TestSelectionDuplicateUtilsService
  );

  transform(
    testSelectionsToAdd: TestSelection[],
    existingTestSelections: TestSelection[]
  ): TestSelectionsWithDuplicateNameTableData[] {
    return this.testSelectionDuplicateService.getDuplicatedNameTestSelections(
      testSelectionsToAdd,
      existingTestSelections
    );
  }
}
