import { Injectable } from "@angular/core";
import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { TestSelectionsWithDuplicateNameTableData } from "./test-selections-with-duplicate-name-table-data.model";
import {
  PreconfiguredTestSelection,
  TestSelection,
} from "@mxevolve/domains/test/model";

@Injectable({ providedIn: "root" })
export class TestSelectionDuplicateUtilsService {
  duplicateTestSelectionNameExists(
    testSelectionsToAdd: TestSelection[],
    existingTestSelections: TestSelection[]
  ): boolean {
    const existingTestSelectionsWithoutAlreadyMergedTests =
      this.removeAlreadyMergedTestSelectionsFromExistingTestSelections(
        testSelectionsToAdd,
        existingTestSelections
      );

    const uniqueNamesOfTestSelectionsToAdd = new Set(
      testSelectionsToAdd.map((tc) => tc.name)
    );
    const existingUniqueNames = new Set(
      existingTestSelectionsWithoutAlreadyMergedTests.map((tc) => tc.name)
    );

    let existingTestSelectionNamesContainANameFromTestSelectionsToAdd = false;
    uniqueNamesOfTestSelectionsToAdd.forEach((name) => {
      if (existingUniqueNames.has(name)) {
        existingTestSelectionNamesContainANameFromTestSelectionsToAdd = true;
      }
    });

    return existingTestSelectionNamesContainANameFromTestSelectionsToAdd
      ? true
      : this.testSelectionsToAddContainsDuplicateNames(
          uniqueNamesOfTestSelectionsToAdd,
          testSelectionsToAdd
        );
  }

  private testSelectionsToAddContainsDuplicateNames(
    uniqueNamesOfTestSelectionsToAdd: Set<string>,
    testSelectionsToAdd: TestSelection[]
  ): boolean {
    return uniqueNamesOfTestSelectionsToAdd.size < testSelectionsToAdd.length;
  }

  getDuplicatedNameTestSelections(
    testSelectionsToAdd: TestSelection[],
    existingTestSelections: TestSelection[]
  ): TestSelectionsWithDuplicateNameTableData[] {
    const AllTestsGroupedByName = new Map<
      string,
      TestSelectionsWithDuplicateNameTableData[]
    >();
    const existingTestSelectionsWithoutAlreadyMergedTests =
      this.removeAlreadyMergedTestSelectionsFromExistingTestSelections(
        testSelectionsToAdd,
        existingTestSelections
      );

    this.groupTestSelectionsToAddByName(
      testSelectionsToAdd,
      AllTestsGroupedByName
    );
    this.groupExisitngTestSelectionsByName(
      existingTestSelectionsWithoutAlreadyMergedTests,
      AllTestsGroupedByName
    );

    const duplicatedTestsGroupedByName =
      this.getTestsWithDuplicatedNamesGroupedByName(AllTestsGroupedByName);
    const duplicatedTests: TestSelectionsWithDuplicateNameTableData[] = [];
    duplicatedTestsGroupedByName.forEach((value) => {
      duplicatedTests.push(...value);
    });

    return duplicatedTests.sort((a, b) =>
      a.testSelection.name.localeCompare(b.testSelection.name)
    );
  }

  private getTestsWithDuplicatedNamesGroupedByName(
    AllTestsGroupedByName: Map<
      string,
      TestSelectionsWithDuplicateNameTableData[]
    >
  ) {
    const duplicatedTestsGroupedByName = new Map<
      string,
      TestSelectionsWithDuplicateNameTableData[]
    >();
    for (const [key, value] of AllTestsGroupedByName.entries()) {
      if (value.length > 1) {
        duplicatedTestsGroupedByName.set(key, value);
      }
    }
    return duplicatedTestsGroupedByName;
  }

  private groupExisitngTestSelectionsByName(
    existingTestSelectionsWithoutAlreadyMergedTests: TestSelection[],
    AllTestsGroupedByName: Map<
      string,
      TestSelectionsWithDuplicateNameTableData[]
    >
  ) {
    existingTestSelectionsWithoutAlreadyMergedTests.forEach((testSelection) => {
      if (AllTestsGroupedByName.has(testSelection.name)) {
        AllTestsGroupedByName.set(testSelection.name, [
          ...(AllTestsGroupedByName.get(testSelection.name) ?? []),
          { testSelection, isEditable: false },
        ]);
      }
    });
  }

  private groupTestSelectionsToAddByName(
    testSelectionsToAdd: TestSelection[],
    AllTestsGroupedByName: Map<
      string,
      TestSelectionsWithDuplicateNameTableData[]
    >
  ) {
    testSelectionsToAdd.forEach((testSelection) => {
      AllTestsGroupedByName.set(testSelection.name, [
        ...(AllTestsGroupedByName.get(testSelection.name) ?? []),
        { testSelection, isEditable: true },
      ]);
    });
  }

  noDuplicateNamesValidator(
    existingTestSelections: TestSelection[],
    testSelectionsToAdd: TestSelection[]
  ): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.trim() || "";
      const testSelectionsName = new Set([
        ...testSelectionsToAdd.map((tc) => tc.name),
        ...existingTestSelections.map((tc) => tc.name),
      ]);

      return testSelectionsName.has(value)
        ? { duplicateTestSelectionNameExists: true }
        : null;
    };
  }

  mergeTestSelectionsWithDuplicatePaths(
    existingTestSelections: TestSelection[],
    testSelectionsToAdd: TestSelection[]
  ): TestSelection[] {
    return testSelectionsToAdd.map((testSelection) => {
      const duplicatedTest = existingTestSelections.find(
        (tc) => tc.path === testSelection.path
      );
      return duplicatedTest
        ? {
            ...duplicatedTest,
            tags: testSelection.tags,
          }
        : testSelection;
    });
  }

  transformToTestSelections(
    preConfiguredTestSelections: PreconfiguredTestSelection[]
  ): TestSelection[] {
    return preConfiguredTestSelections.map(
      (preConfiguredTestSelection, index) => ({
        ...preConfiguredTestSelection,
        id: `temp_id_${index}`,
      })
    );
  }

  private removeAlreadyMergedTestSelectionsFromExistingTestSelections(
    testSelectionsToAdd: TestSelection[],
    existingTestSelections: TestSelection[]
  ) {
    return existingTestSelections.filter((existingTestSelection) =>
      this.doesNotContainTestSelectionWithSameNameAndPath(
        testSelectionsToAdd,
        existingTestSelection
      )
    );
  }

  private doesNotContainTestSelectionWithSameNameAndPath(
    testSelectionsToAdd: TestSelection[],
    existingTestSelection: TestSelection
  ): boolean {
    return (
      testSelectionsToAdd.findIndex(
        (testSelectionToAdd) =>
          testSelectionToAdd.name === existingTestSelection.name &&
          testSelectionToAdd.path === existingTestSelection.path
      ) === -1
    );
  }
}
