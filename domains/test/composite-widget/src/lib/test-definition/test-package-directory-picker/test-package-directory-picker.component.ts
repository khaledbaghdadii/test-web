import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  inject,
} from "@angular/core";
import {
  FeaturesScmModule,
  RepositoryDirectoryPickerComponent,
} from "@mxflow/features/scm";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { Subject, takeUntil } from "rxjs";
import { RepositoryService } from "@mxflow/features/repository";
import { Store } from "@ngrx/store";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { TooltipModule } from "primeng/tooltip";
import { InputTextModule } from "primeng/inputtext";

@Component({
  selector: "mxevolve-test-package-directory-picker",
  templateUrl: "./test-package-directory-picker.component.html",
  styleUrls: ["./test-package-directory-picker.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: TestPackageDirectoryPickerComponent,
    },
  ],
  imports: [
    FeaturesScmModule,
    IconField,
    InputIcon,
    FormsModule,
    TooltipModule,
    InputTextModule,
  ],
})
export class TestPackageDirectoryPickerComponent
  implements OnInit, OnChanges, OnDestroy, ControlValueAccessor
{
  private repositoryService = inject(RepositoryService);
  private store = inject(Store);

  @ViewChild(RepositoryDirectoryPickerComponent)
  repoBrowser: RepositoryDirectoryPickerComponent;

  @Input()
  selectedPath: string;
  @Input()
  repositorySelected: boolean;
  @Input()
  repositoryId: string;

  projectId: string;
  branchName: string;
  destroy$ = new Subject();

  ngOnInit(): void {
    this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((projectId) => {
        this.projectId = projectId;
      });
  }

  onChange = (value: string) => {};

  onTouched = () => {};

  handleTestDirectorySelected($event: string) {
    this.selectedPath = $event;
    this.onChange($event);
  }

  openDirectoryBrowser() {
    this.onTouched();
    if (this.selectedPath) {
      this.repoBrowser.openBrowserOnSelectedDirectory(
        this.repositoryId,
        this.branchName,
        this.selectedPath
      );
    } else {
      this.repoBrowser.openBrowser(this.repositoryId, this.branchName);
    }
  }

  writeValue(value: string): void {
    this.selectedPath = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["repositoryId"]?.currentValue) {
      this.repositoryId = changes["repositoryId"].currentValue;
      this.repositoryService
        .getRepoById(this.projectId, this.repositoryId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (repository) => (this.branchName = repository.defaultBranch)
        );
    }
  }
}
