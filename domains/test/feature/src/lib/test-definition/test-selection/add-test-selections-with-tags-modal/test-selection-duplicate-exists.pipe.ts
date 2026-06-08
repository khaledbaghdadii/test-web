import { Pipe, PipeTransform, inject } from "@angular/core";
import { TestSelectionDuplicateUtilsService } from "./test-selection-duplicate-utils.service";
import { TestSelection } from "@mxevolve/domains/test/model";

@Pipe({
  name: "testSelectionDuplicateExists",
})
export class TestSelectionDuplicateExistsPipe implements PipeTransform {
  private testSelectionDuplicateService = inject(
    TestSelectionDuplicateUtilsService
  );

  transform(
    testSelectionsToAdd: TestSelection[],
    existingTestSelections: TestSelection[]
  ): boolean {
    return this.testSelectionDuplicateService.duplicateTestSelectionNameExists(
      testSelectionsToAdd,
      existingTestSelections
    );
  }
}
