import {
  ConfigurationFilesPickerComponent,
  MXEVOLVE_CONFIGURATION_FILE_NAME,
} from "./configuration-files-picker.component";
import { TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { RepositoryDirectoryPickerComponent } from "@mxflow/features/scm";

const projectId = "projectId";
const repositoryDefaultBranch = "repositoryDefaultBranch";
const repositoryId = "id";

describe("Configuration Files Picker Component Test", () => {
  let repositoryBrowser: RepositoryDirectoryPickerComponent;
  let component: ConfigurationFilesPickerComponent;

  beforeEach(() => {
    repositoryBrowser = {
      openMultiFileBrowser: jest.fn(),
    } as unknown as RepositoryDirectoryPickerComponent;

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [ConfigurationFilesPickerComponent],
    });

    component = TestBed.inject(ConfigurationFilesPickerComponent);

    component.repoFilesBrowser = repositoryBrowser;
    component.projectId = projectId;
    component.disabled = false;
  });

  it("should open the multi file browser filtered by the configuration file name", () => {
    component.branchName = repositoryDefaultBranch;
    component.repositoryId = repositoryId;
    component.selectedFilePaths = ["dir1/mxevolve-configuration.yaml"];
    component.openConfigurationFilesBrowser();

    expect(repositoryBrowser.openMultiFileBrowser).toHaveBeenCalledWith(
      repositoryId,
      repositoryDefaultBranch,
      MXEVOLVE_CONFIGURATION_FILE_NAME,
      ["dir1/mxevolve-configuration.yaml"]
    );
  });

  it("should update the selected files and propagate the change", () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);
    const selectedFilePaths = [
      "dir1/mxevolve-configuration.yaml",
      "dir2/mxevolve-configuration.yaml",
    ];

    component.handleConfigurationFilesSelected(selectedFilePaths);

    expect(component.selectedFilePaths).toEqual(selectedFilePaths);
    expect(onChange).toHaveBeenCalledWith(selectedFilePaths);
  });

  it("should write the value into the selected file paths", () => {
    const selectedFilePaths = ["dir1/mxevolve-configuration.yaml"];

    component.writeValue(selectedFilePaths);

    expect(component.selectedFilePaths).toEqual(selectedFilePaths);
  });

  it("should default the selected file paths to an empty array on a null value", () => {
    component.writeValue(null as unknown as string[]);

    expect(component.selectedFilePaths).toEqual([]);
  });

  it("should clear the selected configuration files if the close icon is clicked", () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);
    component.selectedFilePaths = ["dir1/mxevolve-configuration.yaml"];

    component.clearSelectedFiles();

    expect(component.selectedFilePaths).toEqual([]);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
