import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
} from "@angular/core";
import {
  DescribeRootNotFoundError,
  FeaturesScmModule,
  RepositoryDirectoryPickerComponent,
} from "@mxflow/features/scm";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { RepositoryService } from "@mxflow/features/repository";
import { Store } from "@ngrx/store";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { concatMap, Subject, takeUntil } from "rxjs";
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import { InputTextModule } from "primeng/inputtext";

@Component({
  selector: "mxevolve-test-selection-directory-picker",
  templateUrl: "./test-selection-directory-picker.component.html",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: TestSelectionDirectoryPickerComponent,
    },
  ],
  imports: [
    InputIcon,
    IconField,
    FeaturesScmModule,
    FormsModule,
    InputTextModule,
  ],
})
export class TestSelectionDirectoryPickerComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  private repositoryService = inject(RepositoryService);
  private store = inject(Store);

  @ViewChild(RepositoryDirectoryPickerComponent)
  repoBrowser: RepositoryDirectoryPickerComponent;

  @Input()
  selectedPath: string;
  @Input()
  repositoryId: string;
  @Input()
  basePath: string;
  private branchName: string;
  projectId: string;
  private destroy$ = new Subject();

  @Output() dialogClosedEvent: EventEmitter<void> = new EventEmitter<void>();

  private failureMessageProvider = (error: unknown) => {
    if (error instanceof DescribeRootNotFoundError) {
      return `The path ${this.getTestSelectionsBasePath()} does not exist. Please make sure the package path is correct`;
    }
    return "";
  };

  onChange: (value: string) => void;

  onTouched: () => void;

  ngOnInit(): void {
    this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(
        concatMap((projectId) => {
          this.projectId = projectId;
          return this.repositoryService.getRepoById(
            this.projectId,
            this.repositoryId
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((repository) => {
        this.branchName = repository.defaultBranch;
      });
  }

  handleTestDirectorySelected($event: string) {
    this.selectedPath = $event.replace(
      `${this.getTestSelectionsBasePath()}/`,
      ""
    );
    this.onChange($event.replace(`${this.getTestSelectionsBasePath()}/`, ""));
  }

  testSelectionFieldClicked() {
    this.openRepositoryBrowser();
  }

  openRepositoryBrowser() {
    this.onTouched();
    if (this.selectedPath) {
      this.repoBrowser.openBrowserOnFilteredSelectedDirectory(
        this.repositoryId,
        this.branchName,
        this.getTestSelectionsBasePath(),
        this.resolveActualPath()
      );
    } else {
      this.repoBrowser.openBrowserOnFilteredDirectory(
        this.repositoryId,
        this.branchName,
        this.getTestSelectionsBasePath(),
        this.failureMessageProvider
      );
    }
  }

  private getTestSelectionsBasePath() {
    return `${this.basePath}/config/TestPackageConfig`;
  }

  private resolveActualPath() {
    return `${this.getTestSelectionsBasePath()}/${this.selectedPath}`;
  }

  writeValue(value: string): void {
    this.selectedPath = value;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onDialogClosed(): void {
    this.dialogClosedEvent.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
