import { TestSelectionDuplicateUtilsService } from "./test-selection-duplicate-utils.service";
import { TestSelectionsWithDuplicateNamePipe } from "./test-selections-with-duplicate-name.pipe";
import { TestSelectionsWithDuplicateNameTableData } from "./test-selections-with-duplicate-name-table-data.model";
import { TestBed } from "@angular/core/testing";
import { TestSelection } from "@mxevolve/domains/test/model";

describe("Pipe: TestSelectionsWithDuplicateName", () => {
  let service: TestSelectionDuplicateUtilsService;
  let pipe: TestSelectionsWithDuplicateNamePipe;

  beforeEach(() => {
    service = {
      getDuplicatedNameTestSelections: jest.fn(
        () => testSelectionsWithDuplicateNames
      ),
    } as unknown as TestSelectionDuplicateUtilsService;
    TestBed.configureTestingModule({
      providers: [
        { provide: TestSelectionDuplicateUtilsService, useValue: service },
        TestSelectionsWithDuplicateNamePipe,
      ],
    });
    pipe = TestBed.inject(TestSelectionsWithDuplicateNamePipe);
  });

  it("should delegate to service when transforming data", () => {
    pipe.transform(testSelectionsToAdd, existingTestSelections);
    expect(service.getDuplicatedNameTestSelections).toHaveBeenCalledWith(
      testSelectionsToAdd,
      existingTestSelections
    );
  });

  it("should return the duplicate tests correctly", () => {
    const result = pipe.transform(testSelectionsToAdd, existingTestSelections);
    expect(result).toEqual(testSelectionsWithDuplicateNames);
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

const testSelectionsWithDuplicateNames: TestSelectionsWithDuplicateNameTableData[] =
  [
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
        name: "name2",
        path: "path2",
        tags: ["tag2"],
      },
      isEditable: false,
    },
  ];
