import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { Dialog } from "primeng/dialog";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Select } from "primeng/select";
import { MandatoryFieldModule } from "@mxflow/ui/alert";
import { MandatoryModule, ShowIfFeatureToggledModule } from "@mxflow/directive";
import { MultiSelect } from "primeng/multiselect";
import { ButtonDirective, ButtonLabel } from "primeng/button";
import { PrimeTemplate } from "primeng/api";
import { Skeleton } from "primeng/skeleton";
import {
  Test,
  TestDefinition,
  TestSelection,
} from "@mxevolve/domains/test/model";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";

@Component({
  selector: "mxevolve-scenario-edit-test",
  standalone: true,
  templateUrl: "./scenario-edit-test.component.html",
  imports: [
    Dialog,
    ReactiveFormsModule,
    Select,
    MandatoryFieldModule,
    MandatoryModule,
    MultiSelect,
    ShowIfFeatureToggledModule,
    ButtonDirective,
    PrimeTemplate,
    ButtonLabel,
    Skeleton,
  ],
})
export class ScenarioEditTestComponent {
  @Input({ required: true }) isVisible = false;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) test: Test;
  @Output() closeModal = new EventEmitter();
  @Output() updateTest = new EventEmitter<Test>();

  private readonly testDefinitionService = inject(TestDefinitionService);

  isLoading = true;

  editTestForm: FormGroup = new FormGroup({
    testPackageDefinition: new FormControl<TestDefinition | null>(null, [
      Validators.required,
    ]),
    testPackageSelections: new FormControl<TestSelection[]>({
      value: [],
      disabled: false,
    }),
    tags: new FormControl<string[]>({ value: [], disabled: false }),
  });

  testDefinitionOptions: TestDefinition[];
  testPackageSelectionOptions: TestSelection[] = [];
  tagOptions: string[] = [];

  onOpenModal(): void {
    this.isLoading = true;

    this.testDefinitionService
      .fetchAll(this.projectId)
      .subscribe((testDefinitions) => {
        const testToEditTestDefinition = this.findTestDefinitionBeingEdited(
          testDefinitions,
          this.test
        );

        this.testDefinitionOptions = testDefinitions;
        this.testPackageSelectionOptions =
          testToEditTestDefinition.testSelections;
        this.tagOptions = this.getTagOptions(
          testToEditTestDefinition.testSelections
        );

        const selectedTags = this.getTagOptions(this.test.testSelections);

        this.editTestForm.setValue({
          testPackageDefinition: testToEditTestDefinition,
          testPackageSelections: this.test.testSelections,
          tags: selectedTags,
        });

        this.isLoading = false;
      });
  }

  onTestDefinitionSelect(event: { value: TestDefinition }): void {
    const testDefinition: TestDefinition | undefined = event.value;
    if (testDefinition) {
      this.editTestForm.controls["testPackageSelections"].enable();
      this.editTestForm.controls["tags"].enable();
      this.testPackageSelectionOptions = testDefinition.testSelections;
      const allTags = testDefinition.testSelections
        .map((testSelection) => testSelection.tags)
        .flat();
      this.tagOptions = Array.from(new Set(allTags));
    } else {
      this.emptyAndDisableTestPackageSelection();
      this.emptyAndDisableTagSelection();
    }
  }

  onTagsSelect(event: { value: string[] }): void {
    const testDefinition =
      this.editTestForm.controls["testPackageDefinition"].value;
    if (testDefinition) {
      const selectedTags: string[] = event.value ?? [];
      this.testPackageSelectionOptions =
        selectedTags.length === 0
          ? testDefinition.testSelections
          : testDefinition.testSelections.filter(
              (testSelection: TestSelection) =>
                testSelection.tags.some((tag) => selectedTags.includes(tag))
            );

      const selectedTestSelections =
        this.editTestForm.controls["testPackageSelections"].value;
      if (selectedTestSelections) {
        const availableSelectedTestSelections = selectedTestSelections.filter(
          (testSelection: TestSelection) =>
            this.testPackageSelectionOptions.some(
              (option) => option.id === testSelection.id
            )
        );
        this.editTestForm.controls["testPackageSelections"].setValue(
          availableSelectedTestSelections
        );
      }
    }
  }

  onSubmit(): void {
    const testDefinition: TestDefinition =
      this.editTestForm.controls["testPackageDefinition"].value;
    const testSelections: TestSelection[] =
      this.editTestForm.controls["testPackageSelections"].value;

    const updatedTest: Test = {
      full: testSelections.length === 0,
      testDefinition: testDefinition,
      testSelections: testSelections,
    };

    this.updateTest.emit(updatedTest);
    this.onCloseModal();
  }

  onCloseModal(): void {
    this.editTestForm.reset();
    this.isLoading = true;
    this.closeModal.emit();
  }

  private findTestDefinitionBeingEdited(
    testDefinitions: TestDefinition[],
    test: Test
  ) {
    return testDefinitions.filter((td) => td.id === test.testDefinition.id)[0];
  }

  private getTagOptions(testSelections: TestSelection[]) {
    const allTags = testSelections
      .map((testSelection) => testSelection.tags)
      .flat();
    return this.getDistinctValues(allTags);
  }

  private emptyAndDisableTagSelection() {
    this.editTestForm.controls["tags"].setValue([]);
    this.editTestForm.controls["tags"].disable();
  }

  private emptyAndDisableTestPackageSelection() {
    this.editTestForm.controls["testPackageSelections"].setValue([]);
    this.editTestForm.controls["testPackageSelections"].disable();
  }

  private getDistinctValues(array: string[]): string[] {
    return [...new Set(array)];
  }
}
