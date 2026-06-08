import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Observable } from "rxjs";
import { DialogModule } from "primeng/dialog";
import { MandatoryFieldModule } from "@mxflow/ui/alert";
import { MultiSelectModule } from "primeng/multiselect";
import { ButtonModule } from "primeng/button";
import { MandatoryModule, ShowIfFeatureToggledModule } from "@mxflow/directive";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { SelectChangeEvent, SelectModule } from "primeng/select";
import {
  Test,
  TestDefinition,
  TestSelection,
} from "@mxevolve/domains/test/model";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";

@Component({
  selector: "mxevolve-scenario-add-test",
  templateUrl: "./scenario-add-test.component.html",
  imports: [
    CommonModule,
    DialogModule,
    MandatoryFieldModule,
    MultiSelectModule,
    ButtonModule,
    MandatoryModule,
    ShowIfFeatureToggledModule,
    ReactiveFormsModule,
    SelectModule,
  ],
})
export class ScenarioAddTestComponent {
  private testDefinitionService = inject(TestDefinitionService);

  @Input({ required: true }) isOpen = false;
  @Input({ required: true }) projectId: string;
  @Output() addTestCandidate = new EventEmitter<Test>();
  @Output() closeAddTestModal = new EventEmitter();

  testDefinitions$: Observable<TestDefinition[]>;

  testSelectionOptions: TestSelection[] = [];
  tagOptions: string[] = [];

  form = new FormGroup({
    testPackageDefinition: new FormControl<TestDefinition | null>(null, [
      Validators.required,
    ]),
    testPackageSelections: new FormControl<TestSelection[]>({
      value: [],
      disabled: true,
    }),
    tags: new FormControl<string[]>({ value: [], disabled: true }),
  });

  onOpenAddTestModal(): void {
    this.form.controls.testPackageSelections.disable();
    this.form.controls.tags.disable();
    this.testDefinitions$ = this.testDefinitionService.fetchAll(this.projectId);
  }

  onTestDefinitionSelect(event: SelectChangeEvent): void {
    const testDefinition: TestDefinition | undefined = event.value;
    if (testDefinition) {
      this.form.controls.testPackageSelections.enable();
      this.form.controls.tags.enable();
      this.testSelectionOptions = testDefinition.testSelections;
      const allTags = testDefinition.testSelections
        .map((testSelection) => testSelection.tags)
        .flat();
      this.tagOptions = Array.from(new Set(allTags));
    } else {
      this.form.controls.testPackageSelections.setValue([]);
      this.form.controls.testPackageSelections.disable();
      this.form.controls.tags.setValue([]);
      this.form.controls.tags.disable();
    }
  }

  onTagSelect(event: SelectChangeEvent) {
    const testDefinition = this.form.controls.testPackageDefinition.value;
    if (testDefinition) {
      const selectedTags: string[] = event.value ?? [];
      this.testSelectionOptions =
        selectedTags.length === 0
          ? testDefinition.testSelections
          : testDefinition.testSelections.filter((testSelection) =>
              testSelection.tags.some((tag) => selectedTags.includes(tag))
            );

      const selectedTestSelections =
        this.form.controls.testPackageSelections.value;
      if (selectedTestSelections) {
        const availableSelectedTestSelections = selectedTestSelections.filter(
          (testSelection) => this.testSelectionOptions.includes(testSelection)
        );
        this.form.controls.testPackageSelections.setValue(
          availableSelectedTestSelections
        );
      }
    }
  }

  onSubmit(): void {
    const selectedTestDefinition =
      this.form.controls.testPackageDefinition.value;
    const selectedTestSelections =
      this.form.controls.testPackageSelections.value ?? [];

    if (selectedTestDefinition) {
      const testCandidate: Test = {
        full: selectedTestSelections.length === 0 || false,
        testSelections: selectedTestSelections,
        testDefinition: selectedTestDefinition,
      };
      this.addTestCandidate.emit(testCandidate);
      this.onCloseAddTestModal();
    }
  }

  onCloseAddTestModal(): void {
    this.form.reset();
    this.closeAddTestModal.emit();
  }
}
