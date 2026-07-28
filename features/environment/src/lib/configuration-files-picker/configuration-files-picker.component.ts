import {
  booleanAttribute,
  Component,
  Input,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from "@angular/forms";
import { Subject } from "rxjs";
import {
  FeaturesScmModule,
  RepositoryDirectoryPickerComponent,
} from "@mxflow/features/scm";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { Tooltip } from "primeng/tooltip";

export const MXEVOLVE_CONFIGURATION_FILE_NAME = "mxevolve-configuration.yaml";

@Component({
  selector: "mxevolve-configuration-files-picker",
  templateUrl: "./configuration-files-picker.component.html",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: ConfigurationFilesPickerComponent,
    },
  ],
  imports: [
    FeaturesScmModule,
    IconField,
    InputIcon,
    InputText,
    ReactiveFormsModule,
    Tooltip,
    FormsModule,
  ],
})
export class ConfigurationFilesPickerComponent
  implements OnDestroy, ControlValueAccessor
{
  @ViewChild(RepositoryDirectoryPickerComponent)
  repoFilesBrowser: RepositoryDirectoryPickerComponent;

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) selectedFilePaths: string[] = [];
  @Input({ transform: booleanAttribute }) disabled: boolean;
  @Input({ required: true }) repositoryId: string;
  @Input({ required: true }) branchName: string;

  destroy$ = new Subject();

  onChange: (value: string[] | null) => void = () => {};

  onTouched = () => {};

  handleConfigurationFilesSelected(selectedFilePaths: string[]) {
    this.selectedFilePaths = selectedFilePaths ?? [];
    this.onChange(this.selectedFilePaths);
  }

  openConfigurationFilesBrowser() {
    this.onTouched();
    this.repoFilesBrowser.openMultiFileBrowser(
      this.repositoryId,
      this.branchName,
      MXEVOLVE_CONFIGURATION_FILE_NAME,
      this.selectedFilePaths
    );
  }

  writeValue(value: string[]): void {
    this.selectedFilePaths = value ?? [];
  }

  registerOnChange(fn: (value: string[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  clearSelectedFiles() {
    this.selectedFilePaths = [];
    this.onChange([]);
  }
}
