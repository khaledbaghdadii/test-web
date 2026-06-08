import {
  DescribeRepositoryRequest,
  RepositoryDirectoryPickerComponent,
} from "@mxflow/features/scm";
import { of } from "rxjs";
import { RepositoryDirectoryTreeComponent } from "./repository-directory-tree/repository-directory-tree.component";
import { RepositoryDirectoryTreeInput } from "./repository-directory-tree/repository-directory-tree-input";

const projectId = "projectId";

const repositoryId = "repositoryId";
const branchName = "branchName";
const failuresMessage = "failuresMessage";
const failureMessageProvider = (error: any) => failuresMessage;
const describeRepositoryRequest = getDescribeRepositoryRequest();
const directoriesObservable = of();

const selectDirectory = "selectDirectory";
const basePath = "basePath";
const describeRepositoryRequestWithBasePath =
  getDescribeRepositoryRequestWithBasePath();

describe("Repository Directory Picker Component Test", () => {
  let scmService: any;
  let dialogService: any;
  let componentRef: any;
  let pathSelectEmitter: any;

  let repositoryDirectoryPickerComponent: RepositoryDirectoryPickerComponent;

  beforeEach(() => {
    scmService = {
      describeRepository: jest.fn(() => directoriesObservable),
    };
    componentRef = {
      onClose: of(selectDirectory),
      onDestroy: of(),
    };
    dialogService = {
      open: jest.fn(() => componentRef),
    };
    pathSelectEmitter = {
      emit: jest.fn(),
    };

    repositoryDirectoryPickerComponent = new RepositoryDirectoryPickerComponent(
      scmService,
      dialogService
    );
    repositoryDirectoryPickerComponent.projectId = projectId;
    repositoryDirectoryPickerComponent.pathSelected = pathSelectEmitter;
  });

  describe("Open Browser", () => {
    it("should fetch the repository directory using the correct request", () => {
      repositoryDirectoryPickerComponent.openBrowser(
        repositoryId,
        branchName,
        failureMessageProvider
      );

      expect(scmService.describeRepository).toHaveBeenCalledWith(
        describeRepositoryRequest
      );
    });

    it("should open a dialog using the correct request", () => {
      repositoryDirectoryPickerComponent.openBrowser(
        repositoryId,
        branchName,
        failureMessageProvider
      );

      expect(dialogService.open).toHaveBeenCalledWith(
        RepositoryDirectoryTreeComponent,
        {
          data: {
            directories: directoriesObservable,
            failureMessageProvider: failureMessageProvider,
            preSelectedDirectory: undefined,
            shouldReadFiles: false,
          } as RepositoryDirectoryTreeInput,
          header: "Select a directory",
          width: "35%",
          closable: true,
        }
      );
    });

    it("should subscribe to the component ref close event and emit an event", () => {
      repositoryDirectoryPickerComponent.openBrowser(
        repositoryId,
        branchName,
        failureMessageProvider
      );

      expect(pathSelectEmitter.emit).toHaveBeenCalledWith(selectDirectory);
    });
  });

  describe("Open File Browser", () => {
    it("should fetch the repository directories and files using the correct request", () => {
      jest.spyOn(repositoryDirectoryPickerComponent, "openBrowser");

      repositoryDirectoryPickerComponent.openFileBrowser(
        repositoryId,
        branchName,
        failureMessageProvider
      );

      expect(scmService.describeRepository).toHaveBeenCalledWith(
        describeRepositoryRequest
      );
    });

    it("should open a dialog using the correct request and should read files set to true", () => {
      repositoryDirectoryPickerComponent.openFileBrowser(
        repositoryId,
        branchName,
        failureMessageProvider
      );

      expect(dialogService.open).toHaveBeenCalledWith(
        RepositoryDirectoryTreeComponent,
        {
          data: {
            directories: directoriesObservable,
            failureMessageProvider: failureMessageProvider,
            preSelectedDirectory: undefined,
            shouldReadFiles: true,
          } as RepositoryDirectoryTreeInput,
          header: "Select a file",
          width: "35%",
          closable: true,
        }
      );
    });

    it("should subscribe to the component ref close event and emit an event", () => {
      repositoryDirectoryPickerComponent.openFileBrowser(
        repositoryId,
        branchName,
        failureMessageProvider
      );

      expect(pathSelectEmitter.emit).toHaveBeenCalledWith(selectDirectory);
    });
  });

  describe("Open Browser On Selected Directory", () => {
    it("should fetch the repository directory using the correct request", () => {
      repositoryDirectoryPickerComponent.openBrowserOnSelectedDirectory(
        repositoryId,
        branchName,
        selectDirectory,
        failureMessageProvider
      );

      expect(scmService.describeRepository).toHaveBeenCalledWith(
        describeRepositoryRequest
      );
    });

    it("should open a dialog using the correct request", () => {
      repositoryDirectoryPickerComponent.openBrowserOnSelectedDirectory(
        repositoryId,
        branchName,
        selectDirectory,
        failureMessageProvider
      );

      expect(dialogService.open).toHaveBeenCalledWith(
        RepositoryDirectoryTreeComponent,
        {
          data: {
            directories: directoriesObservable,
            failureMessageProvider: failureMessageProvider,
            preSelectedDirectory: selectDirectory,
            shouldReadFiles: false,
          } as RepositoryDirectoryTreeInput,
          header: "Select a directory",
          width: "35%",
          closable: true,
        }
      );
    });

    it("should subscribe to the component ref close event and emit an event", () => {
      repositoryDirectoryPickerComponent.openBrowserOnSelectedDirectory(
        repositoryId,
        branchName,
        selectDirectory,
        failureMessageProvider
      );

      expect(pathSelectEmitter.emit).toHaveBeenCalledWith(selectDirectory);
    });
  });

  describe("Open File Browser On Selected Directory", () => {
    it("should fetch the repository directories and files using the correct request", () => {
      jest.spyOn(
        repositoryDirectoryPickerComponent,
        "openBrowserOnSelectedDirectory"
      );

      repositoryDirectoryPickerComponent.openFileBrowserOnSelectedDirectory(
        repositoryId,
        branchName,
        selectDirectory,
        failureMessageProvider
      );

      expect(scmService.describeRepository).toHaveBeenCalledWith(
        describeRepositoryRequest
      );
    });

    it("should open a dialog using the correct request and should read files set to true", () => {
      repositoryDirectoryPickerComponent.openFileBrowserOnSelectedDirectory(
        repositoryId,
        branchName,
        selectDirectory,
        failureMessageProvider
      );

      expect(dialogService.open).toHaveBeenCalledWith(
        RepositoryDirectoryTreeComponent,
        {
          data: {
            directories: directoriesObservable,
            failureMessageProvider: failureMessageProvider,
            preSelectedDirectory: selectDirectory,
            shouldReadFiles: true,
          } as RepositoryDirectoryTreeInput,
          header: "Select a file",
          width: "35%",
          closable: true,
        }
      );
    });

    it("should subscribe to the component ref close event and emit an event", () => {
      repositoryDirectoryPickerComponent.openBrowserOnSelectedDirectory(
        repositoryId,
        branchName,
        selectDirectory,
        failureMessageProvider
      );

      expect(pathSelectEmitter.emit).toHaveBeenCalledWith(selectDirectory);
    });
  });

  describe("Open Browser On Filtered Directory", () => {
    it("should fetch the repository directory using the correct request", () => {
      repositoryDirectoryPickerComponent.openBrowserOnFilteredDirectory(
        repositoryId,
        branchName,
        basePath,
        failureMessageProvider
      );

      expect(scmService.describeRepository).toHaveBeenCalledWith(
        describeRepositoryRequestWithBasePath
      );
    });

    it("should open a dialog using the correct request", () => {
      repositoryDirectoryPickerComponent.openBrowserOnFilteredDirectory(
        repositoryId,
        branchName,
        basePath,
        failureMessageProvider
      );

      expect(dialogService.open).toHaveBeenCalledWith(
        RepositoryDirectoryTreeComponent,
        {
          data: {
            directories: directoriesObservable,
            failureMessageProvider: failureMessageProvider,
            preSelectedDirectory: undefined,
            shouldReadFiles: false,
          } as RepositoryDirectoryTreeInput,
          header: "Select a directory",
          width: "35%",
          closable: true,
        }
      );
    });

    it("should subscribe to the component ref close event and emit an event", () => {
      repositoryDirectoryPickerComponent.openBrowserOnFilteredDirectory(
        repositoryId,
        branchName,
        basePath,
        failureMessageProvider
      );

      expect(pathSelectEmitter.emit).toHaveBeenCalledWith(selectDirectory);
    });
  });

  describe("Open Browser On Filtered Selected Directory", () => {
    it("should fetch the repository directory using the correct request", () => {
      repositoryDirectoryPickerComponent.openBrowserOnFilteredSelectedDirectory(
        repositoryId,
        branchName,
        basePath,
        selectDirectory,
        failureMessageProvider
      );

      expect(scmService.describeRepository).toHaveBeenCalledWith(
        describeRepositoryRequestWithBasePath
      );
    });

    it("should open a dialog using the correct request", () => {
      repositoryDirectoryPickerComponent.openBrowserOnFilteredSelectedDirectory(
        repositoryId,
        branchName,
        basePath,
        selectDirectory,
        failureMessageProvider
      );

      expect(dialogService.open).toHaveBeenCalledWith(
        RepositoryDirectoryTreeComponent,
        {
          data: {
            directories: directoriesObservable,
            failureMessageProvider: failureMessageProvider,
            preSelectedDirectory: selectDirectory,
            shouldReadFiles: false,
          } as RepositoryDirectoryTreeInput,
          header: "Select a directory",
          width: "35%",
          closable: true,
        }
      );
    });

    it("should subscribe to the component ref close event and emit an event", () => {
      repositoryDirectoryPickerComponent.openBrowserOnFilteredSelectedDirectory(
        repositoryId,
        branchName,
        basePath,
        selectDirectory,
        failureMessageProvider
      );

      expect(pathSelectEmitter.emit).toHaveBeenCalledWith(selectDirectory);
    });
  });
});

function getDescribeRepositoryRequest(): DescribeRepositoryRequest {
  return {
    projectId: projectId,
    repositoryId: repositoryId,
    branchName: branchName,
  } as DescribeRepositoryRequest;
}

function getDescribeRepositoryRequestWithBasePath(): DescribeRepositoryRequest {
  return {
    projectId: projectId,
    repositoryId: repositoryId,
    branchName: branchName,
    root: basePath,
  };
}
