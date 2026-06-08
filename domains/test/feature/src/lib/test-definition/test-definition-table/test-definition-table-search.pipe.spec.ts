import { TestDefinition } from "@mxevolve/domains/test/model";
import { TestDefinitionTableSearchPipe } from "./test-definition-table-search.pipe";

describe("Pipe: TestDefinitionTableSearch", () => {
  let pipe: TestDefinitionTableSearchPipe;
  let data: TestDefinition[] = [];

  beforeEach(() => {
    data = DataProvider.getData();
    pipe = new TestDefinitionTableSearchPipe();
  });
  it("create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("return all values if search value is empty", () => {
    expect(pipe.transform(data, "")).toStrictEqual(DataProvider.getData());
  });

  it("can search by id", () => {
    expect(pipe.transform(data, "id1")).toStrictEqual([
      {
        id: "id1",
        name: "name1",
        projectId: "projectId",
        repoId: "repoId1",
        path: "path1",
        description: "desc1",
        timeoutDuration: {
          days: 0,
          hours: 5,
          minutes: 0,
        },
        testSelections: [],
      },
    ]);
  });
  it("can search by name", () => {
    expect(pipe.transform(data, "name2")).toStrictEqual([
      {
        id: "id2",
        name: "name2",
        projectId: "projectId",
        repoId: "repoId2",
        path: "path2",
        description: "desc2",
        timeoutDuration: {
          days: 0,
          hours: 5,
          minutes: 0,
        },
        testSelections: [],
      },
    ]);
  });

  it("can search by path", () => {
    expect(pipe.transform(data, "path2")).toStrictEqual([
      {
        id: "id2",
        name: "name2",
        projectId: "projectId",
        repoId: "repoId2",
        path: "path2",
        description: "desc2",
        timeoutDuration: {
          days: 0,
          hours: 5,
          minutes: 0,
        },
        testSelections: [],
      },
    ]);
  });

  it("can search by description", () => {
    expect(pipe.transform(data, "desc1")).toStrictEqual([
      {
        id: "id1",
        name: "name1",
        projectId: "projectId",
        repoId: "repoId1",
        path: "path1",
        description: "desc1",
        timeoutDuration: {
          days: 0,
          hours: 5,
          minutes: 0,
        },
        testSelections: [],
      },
    ]);
  });
});
class DataProvider {
  static getData() {
    return [
      {
        id: "id1",
        name: "name1",
        projectId: "projectId",
        repoId: "repoId1",
        path: "path1",
        description: "desc1",
        timeoutDuration: {
          days: 0,
          hours: 5,
          minutes: 0,
        },
        testSelections: [],
      },
      {
        id: "id2",
        name: "name2",
        projectId: "projectId",
        repoId: "repoId2",
        path: "path2",
        description: "desc2",
        timeoutDuration: {
          days: 0,
          hours: 5,
          minutes: 0,
        },
        testSelections: [],
      },
      {
        id: "id3",
        name: "name3",
        projectId: "projectId",
        repoId: "repoId3",
        path: "path3",
        description: "desc3",
        timeoutDuration: {
          days: 0,
          hours: 5,
          minutes: 0,
        },
        testSelections: [],
      },
    ];
  }
}
