import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

import { WhitespaceValidators } from "@mxflow/validator";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { DialogModule } from "primeng/dialog";
import { SkeletonModule } from "primeng/skeleton";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { TestDefinition, TestSelection } from "@mxevolve/domains/test/model";
import { TestSelectionBrowserFormInputComponent } from "@mxevolve/domains/test/widget";
import { TestSelectionDirectoryPickerComponent } from "@mxevolve/domains/test/composite-widget";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

const TEST_OBJECTS_FEATURE_FLAG = "test-objects";

@Component({
  selector: "mxevolve-edit-test-selection-form",
  templateUrl: "./edit-test-selection-form.component.html",
  imports: [
    DialogModule,
    MandatoryFieldModule,
    SkeletonModule,
    ButtonModule,
    ReactiveFormsModule,
    InputTextModule,
    TestSelectionBrowserFormInputComponent,
    TestSelectionDirectoryPickerComponent,
  ],
})
export class EditTestSelectionFormComponent implements OnInit, OnDestroy {
  private testDefinitionService = inject(TestDefinitionService);
  private toastMessageService = inject(ToastMessageService);
  private readonly featureFlagResolver = inject(FeatureFlagResolver);
  private readonly projectIdResolver = inject(
    ProjectIdRouteParamsResolverService
  );

  private readonly destroy$ = new Subject();

  @Input() isEditTestSelectionOpen = false;
  @Output() isEditTestSelectionOpenChange = new EventEmitter<boolean>();
  form: FormGroup<EditTestSelectionForm> = new FormGroup<EditTestSelectionForm>(
    {
      name: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(255),
        WhitespaceValidators.notBlank(),
      ]),
      path: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(255),
        WhitespaceValidators.notBlank(),
      ]),
    }
  );

  @Input() testDefinition: TestDefinition;
  @Output() testDefinitionChange = new EventEmitter<TestDefinition>();
  isLoading = false;
  useTestSequenceSelector = false;
  private _testSelection: TestSelection;

  ngOnInit(): void {
    this.featureFlagResolver
      .isFeatureEnabled(
        this.projectIdResolver.resolve(),
        TEST_OBJECTS_FEATURE_FLAG
      )
      .then((enabled) => (this.useTestSequenceSelector = enabled))
      .catch(() => (this.useTestSequenceSelector = false));
  }

  @Input()
  set testSelection(value: TestSelection) {
    this._testSelection = value;
    if (this._testSelection?.name && this._testSelection?.path) {
      this.form.setValue({
        name: this._testSelection.name,
        path: this._testSelection.path,
      });
    }
  }

  get testSelection(): TestSelection {
    return this._testSelection;
  }

  onSubmit() {
    if (this.form.valid && this.testDefinition) {
      this.isLoading = true;
      const formValue = this.form.value;
      const editTestSelectionRequest = {
        name: formValue.name as string,
        path: formValue.path as string,
      };
      this.testDefinitionService
        .editTestSelectionInTestDefinition(
          this.testDefinition.projectId,
          this.testSelection.id,
          editTestSelectionRequest
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (testSelection) => {
            this.replaceEditedTestSelection(testSelection);
            this.toastMessageService.showSuccess(
              "Test Selection edited Succesfully!"
            );
            this.testDefinitionChange.emit(this.testDefinition);
            this.isLoading = false;
            this.closeEditTestSelectionModal();
          },
          error: (error) => {
            this.toastMessageService.showError(error);
            this.isLoading = false;
          },
        });
    }
  }

  private replaceEditedTestSelection(editedTestSelection: TestSelection): void {
    this.testDefinition.testSelections = this.testDefinition.testSelections.map(
      (testSelection) => {
        if (testSelection.id === editedTestSelection.id) {
          return editedTestSelection;
        }
        return testSelection;
      }
    );
  }

  closeEditTestSelectionModal(): void {
    this.isEditTestSelectionOpenChange.emit(false);
    this.form.reset({
      name: this.testSelection.name,
      path: this.testSelection.path,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
  onOpenDirectoryPicker(): void {
    this.isEditTestSelectionOpen = false;
  }

  onCloseDirectoryPicker(): void {
    this.isEditTestSelectionOpenChange.emit(true);
  }

  onChangeVisibilityForDirectoryPicker($event: boolean): void {
    if (!$event) {
      this.isEditTestSelectionOpenChange.emit(true);
    }
  }
}

export interface EditTestSelectionForm {
  name: AbstractControl<string | null>;
  path: AbstractControl<string | null>;
}
