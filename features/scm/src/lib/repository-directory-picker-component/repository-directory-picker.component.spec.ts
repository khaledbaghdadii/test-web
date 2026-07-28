import { EventEmitter } from "@angular/core";
import {
  DescribeRepositoryRequest,
  DescribeRepositoryResponse,
  RepositoryDirectoryPickerComponent,
  ScmService,
} from "@mxflow/features/scm";
import { DialogService } from "primeng/dynamicdialog";
import { Observable, of } from "rxjs";
import { RepositoryDirectoryTreeComponent } from "./repository-directory-tree/repository-directory-tree.component";
import { RepositoryDirectoryTreeInput } from "./repository-directory-tree/repository-directory-tree-input";

type MockScmService = Pick<ScmService, "describeRepository">;
type MockDialogService = Pick<DialogService, "open">;
type MockDynamicDialogRef = {
  onClose: Observable<string | string[] | undefined>;
  onDestroy: Observable<void>;
};

const projectId = "projectId";

const repositoryId = "repositoryId";
const branchName = "branchName";
const failuresMessage = "failuresMessage";
const failureMessageProvider = () => failuresMessage;
const describeRepositoryRequest = getDescribeRepositoryRequest();
const directoriesObservable: Observable<DescribeRepositoryResponse> = of();

const selectDirectory = "selectDirectory";
const basePath = "basePath";
const describeRepositoryRequestWithBasePath =
  getDescribeRepositoryRequestWithBasePath();

describe("Repository Directory Picker Component Test", () => {
  let scmService: jest.Mocked<MockScmService>;
  let dialogService: jest.Mocked<MockDialogService>;
  let componentRef: MockDynamicDialogRef;
  let pathSelectEmitter: jest.Mocked<Pick<EventEmitter<string>, "emit">>;
  let pathsSelectEmitter: jest.Mocked<Pick<EventEmitter<string[]>, "emit">>;

  let repositoryDirectoryPickerComponent: RepositoryDirectoryPickerComponent;

  beforeEach(() => {
    scmService = {
      describeRepository: jest.fn(() => directoriesObservable),
    } as unknown as jest.Mocked<MockScmService>;
    componentRef = {
      onClose: of(selectDirectory),
      onDestroy: of(),
    };
    dialogService = {
      open: jest.fn(() => componentRef),
    } as unknown as jest.Mocked<MockDialogService>;
    pathSelectEmitter = {
      emit: jest.fn(),
    };
    pathsSelectEmitter = {
      emit: jest.fn(),
    };

    repositoryDirectoryPickerComponent = new RepositoryDirectoryPickerComponent(
      scmService as unknown as ScmService,
      dialogService as unknown as DialogService
    );
    repositoryDirectoryPickerComponent.projectId = projectId;
    repositoryDirectoryPickerComponent.pathSelected =
      pathSelectEmitter as unknown as EventEmitter<string>;
    repositoryDirectoryPickerComponent.pathsSelected =
      pathsSelectEmitter as unknown as EventEmitter<string[]>;
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
            multiSelection: false,
            fileNameFilter: undefined,
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
            multiSelection: false,
            fileNameFilter: undefined,
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
            multiSelection: false,
            fileNameFilter: undefined,
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
            multiSelection: false,
            fileNameFilter: undefined,
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
            multiSelection: false,
            fileNameFilter: undefined,
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
            multiSelection: false,
            fileNameFilter: undefined,
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

  describe("Open Multi File Browser", () => {
    const fileNameFilter = "settings.json";
    const selectedFiles = ["dir1/settings.json", "dir2/settings.json"];

    it("should fetch the repository directories and files using the correct request", () => {
      repositoryDirectoryPickerComponent.openMultiFileBrowser(
        repositoryId,
        branchName,
        fileNameFilter,
        [],
        failureMessageProvider
      );

      expect(scmService.describeRepository).toHaveBeenCalledWith(
        describeRepositoryRequest
      );
    });

    it("should open a dialog in multi selection mode using the file name filter", () => {
      repositoryDirectoryPickerComponent.openMultiFileBrowser(
        repositoryId,
        branchName,
        fileNameFilter,
        [],
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
            multiSelection: true,
            fileNameFilter: fileNameFilter,
            preSelectedFiles: [],
          } as RepositoryDirectoryTreeInput,
          header: "Select files",
          width: "35%",
          closable: true,
        }
      );
    });

    it("should open a dialog without a file name filter when none is provided", () => {
      repositoryDirectoryPickerComponent.openMultiFileBrowser(
        repositoryId,
        branchName
      );

      expect(dialogService.open).toHaveBeenCalledWith(
        RepositoryDirectoryTreeComponent,
        {
          data: {
            directories: directoriesObservable,
            failureMessageProvider: expect.any(Function),
            preSelectedDirectory: undefined,
            shouldReadFiles: true,
            multiSelection: true,
            fileNameFilter: undefined,
            preSelectedFiles: [],
          } as RepositoryDirectoryTreeInput,
          header: "Select files",
          width: "35%",
          closable: true,
        }
      );
    });

    it("should emit the selected paths on close in multi selection mode", () => {
      componentRef.onClose = of(selectedFiles);

      repositoryDirectoryPickerComponent.openMultiFileBrowser(
        repositoryId,
        branchName,
        fileNameFilter,
        [],
        failureMessageProvider
      );

      expect(pathsSelectEmitter.emit).toHaveBeenCalledWith(selectedFiles);
      expect(pathSelectEmitter.emit).not.toHaveBeenCalled();
    });

    it("should emit an empty array when the close selection is undefined", () => {
      componentRef.onClose = of(undefined);

      repositoryDirectoryPickerComponent.openMultiFileBrowser(
        repositoryId,
        branchName,
        fileNameFilter,
        [],
        failureMessageProvider
      );

      expect(pathsSelectEmitter.emit).toHaveBeenCalledWith([]);
    });

    it("should emit the dialog closed event on close", () => {
      const dialogClosedEmitter = { emit: jest.fn() };
      repositoryDirectoryPickerComponent.dialogClosed =
        dialogClosedEmitter as unknown as EventEmitter<void>;

      repositoryDirectoryPickerComponent.openMultiFileBrowser(
        repositoryId,
        branchName,
        fileNameFilter,
        [],
        failureMessageProvider
      );

      expect(dialogClosedEmitter.emit).toHaveBeenCalled();
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
