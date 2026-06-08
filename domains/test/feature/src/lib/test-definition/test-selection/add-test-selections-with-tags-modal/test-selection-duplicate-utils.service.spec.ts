import {
  TestSelection,
  PreconfiguredTestSelection,
} from "@mxevolve/domains/test/model";
import { TestSelectionDuplicateUtilsService } from "./test-selection-duplicate-utils.service";
import { TestSelectionsWithDuplicateNameTableData } from "./test-selections-with-duplicate-name-table-data.model";
import { FormControl } from "@angular/forms";

describe("Service: TestSelectionDuplicateUtils", () => {
  let service: TestSelectionDuplicateUtilsService;

  beforeEach(() => {
    service = new TestSelectionDuplicateUtilsService();
  });

  describe("Duplicate Test Selection Name Exists Tests", () => {
    it("should return false if there is no duplicate test selection name", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];

      const existingTestSelections: TestSelection[] = [
        {
          id: "id2",
          name: "name2",
          path: "path2",
          tags: ["tag2"],
        },
      ];
      expect(
        service.duplicateTestSelectionNameExists(
          testSelectionsToAdd,
          existingTestSelections
        )
      ).toBeFalsy();
    });

    it("should return true if there is 2 duplicate test selection name in test selections to add", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
        {
          id: "id2",
          name: "name1",
          path: "path2",
          tags: ["tag2"],
        },
      ];

      expect(
        service.duplicateTestSelectionNameExists(testSelectionsToAdd, [])
      ).toBeTruthy();
    });

    it("should return true if there is a duplicate test selection name in test selections to add and the other in existing tests", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];
      const existingTestSelections: TestSelection[] = [
        {
          id: "id2",
          name: "name1",
          path: "path2",
          tags: ["tag2"],
        },
      ];
      expect(
        service.duplicateTestSelectionNameExists(
          testSelectionsToAdd,
          existingTestSelections
        )
      ).toBeTruthy();
    });

    it("should exclude merged test selections from checking and return false if the duplicate is merged", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];
      const existingTestSelections: TestSelection[] = [
        {
          id: "id2",
          name: "name1",
          path: "path1",
          tags: ["tag2"],
        },
      ];
      expect(
        service.duplicateTestSelectionNameExists(
          testSelectionsToAdd,
          existingTestSelections
        )
      ).toBeFalsy();
    });

    it("should return false if the duplicates are in the existing test selections", () => {
      const existingTestSelections: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];
      expect(
        service.duplicateTestSelectionNameExists([], existingTestSelections)
      ).toBeFalsy();
    });
  });

  describe("Get Duplicated Name Test Selections Tests", () => {
    it("should return empty array if no duplicates exists", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];

      const existingTestSelections: TestSelection[] = [
        {
          id: "id2",
          name: "name2",
          path: "path2",
          tags: ["tag2"],
        },
      ];
      expect(
        service.getDuplicatedNameTestSelections(
          testSelectionsToAdd,
          existingTestSelections
        )
      ).toEqual([]);
    });

    it("should return the 2 duplicated tests cases in the test selections to add", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
        {
          id: "id2",
          name: "name1",
          path: "path2",
          tags: ["tag2"],
        },
      ];

      const expected: TestSelectionsWithDuplicateNameTableData[] = [
        {
          testSelection: {
            id: "id1",
            name: "name1",
            path: "path1",
            tags: ["tag1"],
          },
          isEditable: true,
        },
        {
          testSelection: {
            id: "id2",
            name: "name1",
            path: "path2",
            tags: ["tag2"],
          },
          isEditable: true,
        },
      ];

      expect(
        service.getDuplicatedNameTestSelections(testSelectionsToAdd, [])
      ).toEqual(expected);
    });

    it("should return the duplicates if there is a duplicate test selection name in test selections to add and the other in existing tests", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];
      const existingTestSelections: TestSelection[] = [
        {
          id: "id2",
          name: "name1",
          path: "path2",
          tags: ["tag2"],
        },
      ];

      const expected: TestSelectionsWithDuplicateNameTableData[] = [
        {
          testSelection: {
            id: "id1",
            name: "name1",
            path: "path1",
            tags: ["tag1"],
          },
          isEditable: true,
        },
        {
          testSelection: {
            id: "id2",
            name: "name1",
            path: "path2",
            tags: ["tag2"],
          },
          isEditable: false,
        },
      ];
      expect(
        service.getDuplicatedNameTestSelections(
          testSelectionsToAdd,
          existingTestSelections
        )
      ).toEqual(expected);
    });

    it("should exclude merged test selections from checking and return empty array if the duplicate is merged", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];
      const existingTestSelections: TestSelection[] = [
        {
          id: "id2",
          name: "name1",
          path: "path1",
          tags: ["tag2"],
        },
      ];
      expect(
        service.getDuplicatedNameTestSelections(
          testSelectionsToAdd,
          existingTestSelections
        )
      ).toEqual([]);
    });

    it("should return empty array if the duplicates are in the existing test selections", () => {
      const existingTestSelections: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];
      expect(
        service.getDuplicatedNameTestSelections([], existingTestSelections)
      ).toEqual([]);
    });
  });

  describe("No Duplicate Names Validator Tests", () => {
    it("should return true if the name exists in test selections to add", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];

      const existingTestSelections: TestSelection[] = [
        {
          id: "id2",
          name: "name2",
          path: "path2",
          tags: ["tag2"],
        },
      ];

      expect(
        service.noDuplicateNamesValidator(
          existingTestSelections,
          testSelectionsToAdd
        )(new FormControl("name1"))
      ).toEqual({ duplicateTestSelectionNameExists: true });
    });

    it("should return true if the name exists in test selections to add ignoring pre and post white spaces", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];

      const existingTestSelections: TestSelection[] = [
        {
          id: "id2",
          name: "name2",
          path: "path2",
          tags: ["tag2"],
        },
      ];

      expect(
        service.noDuplicateNamesValidator(
          existingTestSelections,
          testSelectionsToAdd
        )(new FormControl("  name1  "))
      ).toEqual({ duplicateTestSelectionNameExists: true });
    });

    it("should return null if the value of the form is null", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];

      const existingTestSelections: TestSelection[] = [
        {
          id: "id2",
          name: "name2",
          path: "path2",
          tags: ["tag2"],
        },
      ];

      expect(
        service.noDuplicateNamesValidator(
          existingTestSelections,
          testSelectionsToAdd
        )(new FormControl(null))
      ).toEqual(null);
    });

    it("should return true if the name exists in the existing test selections", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];

      const existingTestSelections: TestSelection[] = [
        {
          id: "id2",
          name: "name2",
          path: "path2",
          tags: ["tag2"],
        },
      ];

      expect(
        service.noDuplicateNamesValidator(
          existingTestSelections,
          testSelectionsToAdd
        )(new FormControl("name2"))
      ).toEqual({ duplicateTestSelectionNameExists: true });
    });

    it("should return null if the name exists in the existing test selections", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];

      const existingTestSelections: TestSelection[] = [
        {
          id: "id2",
          name: "name2",
          path: "path2",
          tags: ["tag2"],
        },
      ];

      expect(
        service.noDuplicateNamesValidator(
          existingTestSelections,
          testSelectionsToAdd
        )(new FormControl("name3"))
      ).toEqual(null);
    });
  });

  describe("Merge Test Selections With Duplicate Paths Tests", () => {
    it("should return the same test selections to add if there is no test to merge", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];

      const existingTestSelections: TestSelection[] = [
        {
          id: "id2",
          name: "name2",
          path: "path2",
          tags: ["tag2"],
        },
      ];

      expect(
        service.mergeTestSelectionsWithDuplicatePaths(
          existingTestSelections,
          testSelectionsToAdd
        )
      ).toEqual(testSelectionsToAdd);
    });

    it("should return merge the test selection with its duplicate test path correctly", () => {
      const testSelectionsToAdd: TestSelection[] = [
        {
          id: "id1",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
      ];

      const existingTestSelections: TestSelection[] = [
        {
          id: "id2",
          name: "name2",
          path: "path1",
          tags: ["tag2"],
        },
      ];

      expect(
        service.mergeTestSelectionsWithDuplicatePaths(
          existingTestSelections,
          testSelectionsToAdd
        )
      ).toEqual([
        {
          id: "id2",
          name: "name2",
          path: "path1",
          tags: ["tag1"],
        },
      ]);
    });
  });

  describe("Transform preconfigured test selection to test selection Tests", () => {
    it("should transform preconfigured test and append id correctly", () => {
      const testSelections: TestSelection[] = [
        {
          id: "temp_id_0",
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
        {
          id: "temp_id_1",
          name: "name2",
          path: "path2",
          tags: ["tag2"],
        },
      ];

      const preconfiguredTestSelections: PreconfiguredTestSelection[] = [
        {
          name: "name1",
          path: "path1",
          tags: ["tag1"],
        },
        {
          name: "name2",
          path: "path2",
          tags: ["tag2"],
        },
      ];

      expect(
        service.transformToTestSelections(preconfiguredTestSelections)
      ).toEqual(testSelections);
    });
  });
});
