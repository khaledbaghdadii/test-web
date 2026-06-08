import { TestSelection } from "@mxevolve/domains/test/model";
import { TestSelectionDuplicateExistsPipe } from "./test-selection-duplicate-exists.pipe";
import { TestSelectionDuplicateUtilsService } from "./test-selection-duplicate-utils.service";
import { TestBed } from "@angular/core/testing";

describe("Pipe: TestSelectionDuplicateExists", () => {
  let service: TestSelectionDuplicateUtilsService;
  let pipe: TestSelectionDuplicateExistsPipe;

  beforeEach(async () => {
    service = {
      duplicateTestSelectionNameExists: jest.fn(() => true),
    } as unknown as TestSelectionDuplicateUtilsService;

    TestBed.configureTestingModule({
      providers: [
        { provide: TestSelectionDuplicateUtilsService, useValue: service },
        TestSelectionDuplicateExistsPipe,
      ],
    });
    pipe = TestBed.inject(TestSelectionDuplicateExistsPipe);
  });

  it("should delegate to service when transforming data", () => {
    pipe.transform(testSelectionsToAdd, existingTestSelections);
    expect(service.duplicateTestSelectionNameExists).toHaveBeenCalledWith(
      testSelectionsToAdd,
      existingTestSelections
    );
  });

  it("should return true when duplicate exists correctly", () => {
    expect(pipe.transform(testSelectionsToAdd, existingTestSelections)).toEqual(
      true
    );
  });
});

const testSelectionsToAdd: TestSelection[] = [
  {
    id: "id1",
    name: "name1",
    path: "path1",
    tags: ["tag1"],
  },
  {
    id: "id2",
    name: "name2",
    path: "path2",
    tags: ["tag2"],
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
