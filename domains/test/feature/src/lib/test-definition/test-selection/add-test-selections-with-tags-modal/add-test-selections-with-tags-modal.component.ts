import { Component, EventEmitter, Input, Output, inject } from "@angular/core";

import { ToastMessageService } from "@mxflow/ui/alert";
import { ConfirmationService } from "primeng/api";
import { TestSelectionDuplicateUtilsService } from "./test-selection-duplicate-utils.service";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import { finalize, forkJoin } from "rxjs";
import { Popover, PopoverModule } from "primeng/popover";
import { DialogModule } from "primeng/dialog";
import { MessageModule } from "primeng/message";
import { StepperModule } from "primeng/stepper";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { CommonModule } from "@angular/common";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { TestSelectionsWithDuplicateNamePipe } from "./test-selections-with-duplicate-name.pipe";
import { TestSelectionDuplicateExistsPipe } from "./test-selection-duplicate-exists.pipe";
import { SkeletonModule } from "primeng/skeleton";
import { InputTextModule } from "primeng/inputtext";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { TestSelection } from "@mxevolve/domains/test/model";

@Component({
  selector: "mxevolve-add-test-selections-with-tags-modal",
  templateUrl: "./add-test-selections-with-tags-modal.component.html",
  imports: [
    DialogModule,
    MessageModule,
    StepperModule,
    TableModule,
    ButtonModule,
    PopoverModule,
    ReactiveFormsModule,
    TableEmptyMessageComponent,
    CommonModule,
    TagModule,
    TooltipModule,
    TestSelectionDuplicateExistsPipe,
    TestSelectionsWithDuplicateNamePipe,
    SkeletonModule,
    InputTextModule,
  ],
})
export class AddTestSelectionWithTagsModalComponent {
  private testDefinitionService = inject(TestDefinitionService);
  private toastMessageService = inject(ToastMessageService);
  private confirmationService = inject(ConfirmationService);
  private utilsService = inject(TestSelectionDuplicateUtilsService);

  private _isModalVisible = false;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) testDefinitionId: string;
  @Input({ required: true }) defaultBranch: string;
  @Input({ required: true }) set isModalVisible(value: boolean) {
    this._isModalVisible = value;
    if (value) {
      this.loadData();
    }
  }
  get isModalVisible() {
    return this._isModalVisible;
  }

  @Output() isModalVisibleChange = new EventEmitter<boolean>();
  @Output() addedTestSelections = new EventEmitter<TestSelection[]>();

  isLoading = false;
  submitButtonLoading = false;

  testSelectionEditForm = new FormGroup({
    name: new FormControl<string>("", [
      Validators.required,
      WhitespaceValidators.notBlank(),
    ]),
    id: new FormControl<string>(""),
  });

  testSelectionsToAdd: TestSelection[] = [];
  existingTestSelections: TestSelection[] = [];

  protected readonly Array = Array;

  loadData() {
    this.isLoading = true;
    this.submitButtonLoading = true;
    forkJoin([
      this.testDefinitionService.fetch(this.testDefinitionId, this.projectId),
      this.testDefinitionService.fetchTestSelectionsFromContextConfig(
        this.testDefinitionId,
        this.projectId,
        this.defaultBranch
      ),
    ])
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.submitButtonLoading = false;
        })
      )
      .subscribe({
        next: (data) => {
          this.existingTestSelections = data[0].testSelections;
          const preconfiguredTestSelections =
            this.utilsService.transformToTestSelections(data[1]);
          this.testSelectionsToAdd =
            this.utilsService.mergeTestSelectionsWithDuplicatePaths(
              data[0].testSelections,
              preconfiguredTestSelections
            );
        },
        error: (errorMessage) => {
          this.toastMessageService.showError(errorMessage);
        },
      });
  }

  onSubmit() {
    this.submitButtonLoading = true;

    this.testDefinitionService
      .bulkAddTestSelections(
        this.projectId,
        this.testDefinitionId,
        this.testSelectionsToAdd
      )
      .pipe(
        finalize(() => {
          this.submitButtonLoading = false;
        })
      )
      .subscribe({
        next: (data) => {
          this.addedTestSelections.emit(data);
          this.toastMessageService.showSuccess(
            "Test selections successfully added"
          );
          this.closeModal();
        },
        error: (errorMessage) => {
          this.toastMessageService.showError(errorMessage);
        },
      });
  }

  deleteTestSelection($event: MouseEvent, id: string) {
    this.confirmationService.confirm({
      target: $event.target as EventTarget,
      message: "Are you sure you want to delete this test selection?",
      icon: "pi pi-info-circle",
      acceptButtonStyleClass: "p-button-info p-button-sm ml-2",
      accept: () => {
        this.testSelectionsToAdd = this.testSelectionsToAdd.filter(
          (testSelection) => testSelection.id !== id
        );
      },
    });
  }

  showEditFormPanel(event: Event, editForm: Popover, id: string) {
    const testSelectionToEdit = this.testSelectionsToAdd.find(
      (tc) => tc.id === id
    );
    if (testSelectionToEdit) {
      this.testSelectionEditForm.reset();
      this.testSelectionEditForm.controls.id.setValue(id);
      this.testSelectionEditForm.controls.name.setValue(
        testSelectionToEdit.name
      );
      this.testSelectionEditForm.controls.name.addValidators(
        this.utilsService.noDuplicateNamesValidator(
          this.existingTestSelections,
          this.testSelectionsToAdd
        )
      );
      editForm.toggle(event);
    }
  }

  submitEditTestSelection(editForm: Popover) {
    if (this.testSelectionEditForm.valid) {
      this.testSelectionsToAdd = this.testSelectionsToAdd.map((item) =>
        item.id === this.testSelectionEditForm.controls.id.value
          ? {
              ...item,
              name: this.testSelectionEditForm.controls.name.value ?? "",
            }
          : item
      );
      editForm.hide();
    }
  }

  closeModal(): void {
    this.testSelectionsToAdd = [];
    this.existingTestSelections = [];
    this.isModalVisibleChange.emit(false);
  }
}
