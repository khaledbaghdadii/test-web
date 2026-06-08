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
import { TestDefinition } from "@mxevolve/domains/test/model";
import { TestSelectionBrowserFormInputComponent } from "@mxevolve/domains/test/widget";
import { TestSelectionDirectoryPickerComponent } from "@mxevolve/domains/test/composite-widget";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";

const TEST_OBJECTS_FEATURE_FLAG = "test-objects";

@Component({
  selector: "mxevolve-add-test-selection-form",
  templateUrl: "./add-test-selection-form.component.html",
  imports: [
    DialogModule,
    MandatoryFieldModule,
    SkeletonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TestSelectionBrowserFormInputComponent,
    TestSelectionDirectoryPickerComponent,
  ],
})
export class AddTestSelectionFormComponent implements OnInit, OnDestroy {
  private testDefinitionService = inject(TestDefinitionService);
  private toastMessageService = inject(ToastMessageService);
  private readonly featureFlagResolver = inject(FeatureFlagResolver);
  private readonly projectIdResolver = inject(
    ProjectIdRouteParamsResolverService
  );

  private readonly destroy$ = new Subject();

  @Input() isAddTestSelectionOpen = false;
  @Output() isAddTestSelectionOpenChange = new EventEmitter<boolean>();
  form: FormGroup<AddTestSelectionForm> = new FormGroup<AddTestSelectionForm>({
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
  });

  @Input() testDefinition: TestDefinition;
  @Output() testDefinitionChange: EventEmitter<TestDefinition> =
    new EventEmitter<TestDefinition>();
  isLoading = false;
  formName = "";
  useTestSelectionBrowser = false;

  ngOnInit(): void {
    this.featureFlagResolver
      .isFeatureEnabled(
        this.projectIdResolver.resolve(),
        TEST_OBJECTS_FEATURE_FLAG
      )
      .then((enabled) => {
        this.useTestSelectionBrowser = enabled;
      })
      .catch(() => (this.useTestSelectionBrowser = false));
  }

  onSubmit() {
    if (this.form.valid && this.testDefinition) {
      this.isLoading = true;
      const formValue = this.form.value;
      const addTestSelectionRequest = {
        name: formValue.name as string,
        path: formValue.path as string,
      };
      this.testDefinitionService
        .addTestSelectionToTestDefinition(
          this.testDefinition.projectId,
          this.testDefinition.id,
          addTestSelectionRequest
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (testSelection) => {
            this.testDefinition.testSelections.push(testSelection);
            this.toastMessageService.showSuccess(
              "Test Selection added Successfully!"
            );
            this.testDefinitionChange.emit(this.testDefinition);
            this.isLoading = false;
            this.closeAddTestSelectionModal();
          },
          error: (error) => {
            this.toastMessageService.showError(error);
            this.isLoading = false;
          },
        });
    }
  }
  closeAddTestSelectionModal(): void {
    this.form.reset();
    this.isAddTestSelectionOpenChange.emit(false);
  }
  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  onOpenDirectoryPicker(): void {
    this.formName = this.form.value.name as string;
    this.isAddTestSelectionOpen = false;
  }

  onCloseDirectoryPicker(): void {
    this.form.patchValue({ name: this.formName });
    this.isAddTestSelectionOpenChange.emit(true);
  }

  onChangeVisibilityForDirectoryPicker($event: boolean): void {
    if (!$event) {
      this.form.patchValue({ name: this.formName });
      this.isAddTestSelectionOpenChange.emit(true);
    }
  }
}

export interface AddTestSelectionForm {
  name: AbstractControl<string | null>;
  path: AbstractControl<string | null>;
}
