import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DescribeRepositoryRequest, ScmService } from "@mxflow/features/scm";
import { DialogService } from "primeng/dynamicdialog";
import { RepositoryDirectoryTreeComponent } from "./repository-directory-tree/repository-directory-tree.component";
import { RepositoryDirectoryTreeInput } from "./repository-directory-tree/repository-directory-tree-input";

@Component({
  selector: "mxflow-repo-browser-component",
  templateUrl: "./repository-directory-picker.component.html",
  styleUrls: ["./repository-directory-picker.component.scss"],
  standalone: false,
})
export class RepositoryDirectoryPickerComponent {
  @Input({ required: true }) projectId: string;
  repositoryId: string;
  branchName: string;

  selectedDirectory: string | undefined;
  selectedPaths: string[] = [];
  basePath: string | undefined;
  multiSelection = false;
  fileNameFilter: string | undefined;

  private failureMessageProvider = (error: any) => "";

  @Output() pathSelected: EventEmitter<string> = new EventEmitter<string>();
  @Output() pathsSelected: EventEmitter<string[]> = new EventEmitter<
    string[]
  >();
  @Output() dialogClosed: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private scmService: ScmService,
    public dialogService: DialogService
  ) {}

  openBrowser(
    repositoryId: string,
    branchName: string,
    failureMessageProvider = this.failureMessageProvider
  ) {
    this.repositoryId = repositoryId;
    this.branchName = branchName;
    this.failureMessageProvider = failureMessageProvider;
    this.openModal();
  }

  openFileBrowser(
    repositoryId: string,
    branchName: string,
    failureMessageProvider = this.failureMessageProvider
  ) {
    this.repositoryId = repositoryId;
    this.branchName = branchName;
    this.failureMessageProvider = failureMessageProvider;
    this.openModal(true);
  }

  openBrowserOnSelectedDirectory(
    repositoryId: string,
    branchName: string,
    selectedPath: string,
    failureMessageProvider = this.failureMessageProvider
  ) {
    this.repositoryId = repositoryId;
    this.branchName = branchName;
    this.selectedDirectory = selectedPath;
    this.failureMessageProvider = failureMessageProvider;
    this.openModal();
  }

  openFileBrowserOnSelectedDirectory(
    repositoryId: string,
    branchName: string,
    selectedPath: string,
    failureMessageProvider = this.failureMessageProvider
  ) {
    this.repositoryId = repositoryId;
    this.branchName = branchName;
    this.selectedDirectory = selectedPath;
    this.failureMessageProvider = failureMessageProvider;
    this.openModal(true);
  }

  openMultiFileBrowser(
    repositoryId: string,
    branchName: string,
    fileNameFilter?: string,
    preSelectedPaths: string[] = [],
    failureMessageProvider = this.failureMessageProvider
  ) {
    this.repositoryId = repositoryId;
    this.branchName = branchName;
    this.fileNameFilter = fileNameFilter;
    this.failureMessageProvider = failureMessageProvider;
    this.selectedPaths = preSelectedPaths;
    this.openModal(true, true);
  }

  openBrowserOnFilteredDirectory(
    repositoryId: string,
    branchName: string,
    basePath: string,
    failureMessageProvider = this.failureMessageProvider
  ) {
    this.repositoryId = repositoryId;
    this.branchName = branchName;
    this.basePath = basePath;
    this.failureMessageProvider = failureMessageProvider;
    this.openModal();
  }

  openBrowserOnFilteredSelectedDirectory(
    repositoryId: string,
    branchName: string,
    basePath: string,
    selectedPath: string,
    failureMessageProvider = this.failureMessageProvider
  ) {
    this.repositoryId = repositoryId;
    this.branchName = branchName;
    this.selectedDirectory = selectedPath;
    this.basePath = basePath;
    this.failureMessageProvider = failureMessageProvider;
    this.openModal();
  }

  private openModal(
    withFiles: boolean = false,
    multiSelection: boolean = false
  ) {
    this.multiSelection = multiSelection;
    const observableDirectories = this.scmService.describeRepository(
      this.getRequest()
    );
    const componentRef = this.dialogService.open(
      RepositoryDirectoryTreeComponent,
      {
        data: {
          directories: observableDirectories,
          failureMessageProvider: this.failureMessageProvider,
          preSelectedDirectory: this.selectedDirectory,
          shouldReadFiles: withFiles,
          multiSelection: this.multiSelection,
          fileNameFilter: this.fileNameFilter,
          ...(this.multiSelection && { preSelectedFiles: this.selectedPaths }),
        } as RepositoryDirectoryTreeInput,
        header: this.getModalHeader(withFiles),
        width: "35%",
        closable: true,
      }
    );

    componentRef!.onClose.subscribe((selection: string | string[]) => {
      if (this.multiSelection) {
        this.pathsSelected.emit((selection as string[]) ?? []);
      } else {
        this.pathSelected.emit(selection as string);
      }
      this.dialogClosed.emit();
    });
    componentRef!.onDestroy.subscribe(() => {
      this.dialogClosed.emit();
    });
  }

  private getModalHeader(withFiles: boolean): string {
    if (this.multiSelection) {
      return "Select files";
    }
    return withFiles ? "Select a file" : "Select a directory";
  }

  private getRequest(): DescribeRepositoryRequest {
    if (this.basePath) {
      return {
        projectId: this.projectId,
        repositoryId: this.repositoryId,
        branchName: this.branchName,
        root: this.basePath,
      };
    } else {
      return {
        projectId: this.projectId,
        repositoryId: this.repositoryId,
        branchName: this.branchName,
      } as DescribeRepositoryRequest;
    }
  }
}
