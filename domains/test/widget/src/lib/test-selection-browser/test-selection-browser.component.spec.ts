import { TestSelectionBrowserComponent } from "./test-selection-browser.component";
import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { delay, of, throwError } from "rxjs";
import { By } from "@angular/platform-browser";
import { Tree, UITreeNode } from "primeng/tree";
import { Skeleton } from "primeng/skeleton";
import { TestSelectionTreeNode } from "@mxevolve/domains/test/model";
import { TestSequenceService } from "@mxevolve/domains/test/data-access";
import { PrimeTemplate, TreeNode } from "primeng/api";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { ToastMessageService } from "@mxflow/ui/alert";
import { Repository, RepositoryService } from "@mxflow/features/repository";

const PROJECT_ID = "project-1";
const TEST_SEQUENCE_NAME = "sequence-a";
const REPOSITORY_ID = "repo-1";
const DEFAULT_BRANCH = "main";

const repository: Repository = {
  id: REPOSITORY_ID,
  defaultBranch: DEFAULT_BRANCH,
} as unknown as Repository;

const leafNode1: TestSelectionTreeNode = {
  id: "leaf-id1",
  name: "Leaf Node 1",
  type: "TEST",
  parentId: "child-id",
  children: [],
};

const leafNode2: TestSelectionTreeNode = {
  id: "leaf-id2",
  name: "Leaf Node 2",
  parentId: "child-id",
  type: "TEST",
  children: [],
};

const childNode: TestSelectionTreeNode = {
  id: "child-id",
  name: "Child Node",
  type: "SUITE",
  parentId: "root-id",
  children: [leafNode1, leafNode2],
};

const rootNode: TestSelectionTreeNode = {
  id: "root-id",
  name: "Root Node",
  type: "SUITE",
  parentId: null,
  children: [childNode],
};

const defaultInputs = {
  projectId: PROJECT_ID,
  testSequenceName: TEST_SEQUENCE_NAME,
  repositoryId: REPOSITORY_ID,
};

describe("TestSelectionBrowserComponent", () => {
  let testSequenceService: jest.Mocked<TestSequenceService>;
  let toastMessageService: jest.Mocked<ToastMessageService>;
  let repositoryService: jest.Mocked<RepositoryService>;

  beforeEach(async () => {
    testSequenceService = {
      fetchTestSelections: jest.fn().mockReturnValue(of(rootNode)),
    } as unknown as jest.Mocked<TestSequenceService>;

    toastMessageService = {
      showError: jest.fn(),
    } as unknown as jest.Mocked<ToastMessageService>;

    repositoryService = {
      getRepoById: jest.fn().mockReturnValue(of(repository)),
    } as unknown as jest.Mocked<RepositoryService>;

    await MockBuilder(TestSelectionBrowserComponent)
      .mock(
        TestSequenceService,
        testSequenceService as unknown as TestSequenceService
      )
      .mock(
        ToastMessageService,
        toastMessageService as unknown as ToastMessageService
      )
      .mock(
        RepositoryService,
        repositoryService as unknown as RepositoryService
      )
      .keep(Tree)
      .keep(PrimeTemplate)
      .keep(Skeleton);
  });

  function render(inputs = defaultInputs) {
    const fixture = MockRender(TestSelectionBrowserComponent, inputs);
    fixture.detectChanges();
    return fixture;
  }

  function expectNoLoadingSkeletons(fixture: MockedComponentFixture) {
    const loadingSkeletons = fixture.debugElement.queryAll(
      By.directive(Skeleton)
    );
    expect(loadingSkeletons.length).toBe(0);
  }

  it("should create the component", () => {
    const fixture = render();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it("should fetch the browsable test selections on init", () => {
    render();
    expect(testSequenceService.fetchTestSelections).toHaveBeenCalledWith({
      projectId: PROJECT_ID,
      testSequenceName: TEST_SEQUENCE_NAME,
      repositoryId: REPOSITORY_ID,
      source: DEFAULT_BRANCH,
    });
  });

  it("should fetch the repository by project id and repository id on init", () => {
    render();
    expect(repositoryService.getRepoById).toHaveBeenCalledWith(
      PROJECT_ID,
      REPOSITORY_ID
    );
  });

  it("should show a toast error and stop loading when getting repo fails", () => {
    const error = new Error("repo fetch failed");
    repositoryService.getRepoById.mockReturnValue(throwError(() => error));
    const fixture = render();
    expect(toastMessageService.showError).toHaveBeenCalledWith(error.message);
    expect(fixture.point.componentInstance.isLoading()).toBe(false);
  });

  it("should not fetch test selections when getting the repo fails", () => {
    repositoryService.getRepoById.mockReturnValue(
      throwError(() => new Error("repo fetch failed"))
    );
    render();
    expect(testSequenceService.fetchTestSelections).not.toHaveBeenCalled();
  });

  it("should render the tree after data is loaded", () => {
    const fixture = render();
    const tree = fixture.debugElement.query(By.directive(Tree));
    expect(tree).toBeTruthy();
    expectNoLoadingSkeletons(fixture);
  });

  it("should show skeletons while loading", () => {
    const fixture = render();
    fixture.point.componentInstance.isLoading.set(true);
    fixture.detectChanges();
    const skeletons = fixture.debugElement.queryAll(By.directive(Skeleton));
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should start loading before fetch", () => {
    testSequenceService.fetchTestSelections.mockReturnValue(
      of(rootNode).pipe(delay(1000))
    );
    const fixture = render();
    expect(fixture.point.componentInstance.isLoading()).toBe(true);
  });

  it("should stop loading after successful fetch", () => {
    const fixture = render();
    expect(fixture.point.componentInstance.isLoading()).toBe(false);
  });

  it("should stop loading after fetch error", () => {
    testSequenceService.fetchTestSelections.mockReturnValue(
      throwError(() => new Error("fetch failed"))
    );
    const fixture = render();
    expect(fixture.point.componentInstance.isLoading()).toBe(false);
  });

  it("should show a toast error when the fetch fails", () => {
    const error = new Error("fetch failed");
    testSequenceService.fetchTestSelections.mockReturnValue(
      throwError(() => error)
    );
    render();
    expect(toastMessageService.showError).toHaveBeenCalledWith(error.message);
  });

  describe("clicking a tree node emits the correct path", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => jest.useRealTimers());

    it("should emit the root node label when the root node is clicked", () => {
      const fixture = render();
      const testSelectionPathEmitter = jest.spyOn(
        fixture.point.componentInstance.testSelectionPathEmitter,
        "emit"
      );

      expandTreeNodes(fixture);
      clickTreeNode(fixture, rootNode.name);
      jest.runAllTimers();

      expect(testSelectionPathEmitter).toHaveBeenCalledWith(`${rootNode.name}`);
    });

    it("should emit the full path when a child node is clicked", () => {
      const fixture = render();
      const testSelectionPathEmitter = jest.spyOn(
        fixture.point.componentInstance.testSelectionPathEmitter,
        "emit"
      );

      expandTreeNodes(fixture);
      clickTreeNode(fixture, childNode.name);
      jest.runAllTimers();

      expect(testSelectionPathEmitter).toHaveBeenCalledWith(
        `${rootNode.name}/${childNode.name}`
      );
    });

    it("should emit the full path when first leaf node is clicked", () => {
      const fixture = render();
      const testSelectionPathEmitter = jest.spyOn(
        fixture.point.componentInstance.testSelectionPathEmitter,
        "emit"
      );

      expandTreeNodes(fixture);
      clickTreeNode(fixture, leafNode1.name);
      jest.runAllTimers();

      expect(testSelectionPathEmitter).toHaveBeenCalledWith(
        `${rootNode.name}/${childNode.name}/${leafNode1.name}`
      );
    });

    it("should emit the full path when second leaf node is clicked", () => {
      const fixture = render();
      const testSelectionPathEmitter = jest.spyOn(
        fixture.point.componentInstance.testSelectionPathEmitter,
        "emit"
      );

      expandTreeNodes(fixture);
      clickTreeNode(fixture, leafNode2.name);
      jest.runAllTimers();

      expect(testSelectionPathEmitter).toHaveBeenCalledWith(
        `${rootNode.name}/${childNode.name}/${leafNode2.name}`
      );
    });

    it("should emit the full path of the newly clicked node in case multiple nodes where clicked", () => {
      const fixture = render();
      const testSelectionPathEmitter = jest.spyOn(
        fixture.point.componentInstance.testSelectionPathEmitter,
        "emit"
      );

      expandTreeNodes(fixture);
      clickTreeNode(fixture, leafNode2.name);
      jest.runAllTimers();
      clickTreeNode(fixture, childNode.name);
      jest.runAllTimers();

      expect(testSelectionPathEmitter.mock.calls).toEqual([
        [`${rootNode.name}/${childNode.name}/${leafNode2.name}`],
        [`${rootNode.name}/${childNode.name}`],
      ]);
    });

    it("should emit undefined when a selected node is unselected", () => {
      const fixture = render();
      const testSelectionPathEmitter = jest.spyOn(
        fixture.point.componentInstance.testSelectionPathEmitter,
        "emit"
      );

      expandTreeNodes(fixture);
      clickTreeNode(fixture, leafNode1.name);
      jest.runAllTimers();
      clickTreeNode(fixture, leafNode1.name);
      jest.runAllTimers();

      expect(testSelectionPathEmitter.mock.calls).toEqual([
        [`${rootNode.name}/${childNode.name}/${leafNode1.name}`],
        [undefined],
      ]);
    });
  });

  describe("tree node icons", () => {
    function getIconForNode(
      fixture: MockedComponentFixture,
      label: string
    ): MxevolveIconComponent {
      return findTreeNode(fixture, label).query(
        By.directive(MxevolveIconComponent)
      ).componentInstance;
    }

    it("should show a folder icon for suite", () => {
      const fixture = render();
      const icon = getIconForNode(fixture, rootNode.name);
      expect(icon.name).toBe("folder");
    });

    it("should show file icon for any node other than suite", () => {
      const fixture = render();
      expandTreeNodes(fixture);
      const icon = getIconForNode(fixture, leafNode1.name);
      expect(icon.name).toBe("description");
    });
  });

  function findTreeNode(fixture: MockedComponentFixture, label: string) {
    const treeNodes = fixture.debugElement.queryAll(By.directive(UITreeNode));
    return treeNodes.find(
      (node) => node.componentInstance.node.label === label
    )!;
  }

  function clickTreeNode(fixture: MockedComponentFixture, label: string): void {
    const node = findTreeNode(fixture, label);
    node.query(By.css("div")).nativeElement.click();
    fixture.detectChanges();
  }

  function expandTreeNodes(fixture: MockedComponentFixture): void {
    fixture.point.componentInstance.testSelectionTree.update(
      (nodes: TreeNode[]) => setExpanded(nodes)
    );
    fixture.detectChanges();
  }

  function setExpanded(nodes: TreeNode[]): TreeNode[] {
    return nodes.map((node) => ({
      ...node,
      expanded: true,
      children: node.children ? setExpanded(node.children) : [],
    }));
  }
});
