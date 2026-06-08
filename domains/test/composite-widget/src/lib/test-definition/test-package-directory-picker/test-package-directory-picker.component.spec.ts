import { TestPackageDirectoryPickerComponent } from "./test-package-directory-picker.component";
import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { SimpleChange } from "@angular/core";
import { of } from "rxjs";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { Repository, RepositoryService } from "@mxflow/features/repository";
import { Store } from "@ngrx/store";
import { RepositoryDirectoryPickerComponent } from "@mxflow/features/scm";

const repositoryId = "repositoryId";
const repositoryName = "repositoryName";
const repositoryLabel = "repositoryLabel";
const repositoryUrl = "repositoryUrl";
const repositoryCredentialsId = "repositoryCredentialsId";
const repositoryDefaultBranch = "repositoryDefaultBranch";
const repository = getRepositories();
const projectId = "projectId";
const selectedPath = "selectedPath";

describe("Test Package Directory Picker Component Test", () => {
  let repositoryService: RepositoryService;
  let store: Store;
  let repositoryBrowser: RepositoryDirectoryPickerComponent;

  let testPackageDirectoryPickerComponent: TestPackageDirectoryPickerComponent;
  let fixture: MockedComponentFixture<TestPackageDirectoryPickerComponent>;

  beforeEach(async () => {
    repositoryService = {
      getRepoById: jest.fn(() => of(repository)),
    } as unknown as RepositoryService;
    store = {
      select: jest.fn(() => of(projectId)),
    } as unknown as Store;
    repositoryBrowser = {
      openBrowserOnSelectedDirectory: jest.fn(),
      openBrowser: jest.fn(),
    } as unknown as RepositoryDirectoryPickerComponent;

    await MockBuilder(TestPackageDirectoryPickerComponent)
      .mock(RepositoryDirectoryPickerComponent, repositoryBrowser)
      .mock(Store, store)
      .mock(RepositoryService, repositoryService);

    fixture = MockRender(TestPackageDirectoryPickerComponent);
    testPackageDirectoryPickerComponent = fixture.point.componentInstance;

    testPackageDirectoryPickerComponent.repoBrowser = repositoryBrowser;
  });

  it("should fetch the project id on init", () => {
    testPackageDirectoryPickerComponent.ngOnInit();

    expect(store.select).toHaveBeenCalledWith(GlobalSelectors.getProjectId);
    expect(testPackageDirectoryPickerComponent.projectId).toStrictEqual(
      projectId
    );
  });

  it("should fetch the repository if the repository id changed", () => {
    const simpleChange = new SimpleChange(undefined, repositoryId, true);
    testPackageDirectoryPickerComponent.ngOnChanges({
      repositoryId: simpleChange,
    });

    expect(repositoryService.getRepoById).toHaveBeenCalledWith(
      projectId,
      repositoryId
    );
    expect(testPackageDirectoryPickerComponent.branchName).toStrictEqual(
      repositoryDefaultBranch
    );
  });

  it("should open browser with a selected path if one exists", () => {
    testPackageDirectoryPickerComponent.selectedPath = selectedPath;
    testPackageDirectoryPickerComponent.branchName = repositoryDefaultBranch;
    testPackageDirectoryPickerComponent.repositoryId = repositoryId;
    testPackageDirectoryPickerComponent.openDirectoryBrowser();

    expect(
      repositoryBrowser.openBrowserOnSelectedDirectory
    ).toHaveBeenCalledWith(repositoryId, repositoryDefaultBranch, selectedPath);
  });

  it("should open browser without a selected repository if not selected", () => {
    testPackageDirectoryPickerComponent.branchName = repositoryDefaultBranch;
    testPackageDirectoryPickerComponent.repositoryId = repositoryId;
    testPackageDirectoryPickerComponent.openDirectoryBrowser();

    expect(repositoryBrowser.openBrowser).toHaveBeenCalledWith(
      repositoryId,
      repositoryDefaultBranch
    );
  });
});

function getRepositories(): Repository {
  return {
    id: repositoryId,
    name: repositoryName,
    label: repositoryLabel,
    url: repositoryUrl,
    credentialsId: repositoryCredentialsId,
    defaultBranch: repositoryDefaultBranch,
  };
}
