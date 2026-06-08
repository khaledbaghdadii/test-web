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
import { ConfirmationService } from "primeng/api";
import { ToastMessageService } from "@mxflow/ui/alert";
import { ProjectService } from "@mxflow/features/project";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { SplitButtonModule } from "primeng/splitbutton";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { SkeletonModule } from "primeng/skeleton";
import {
  MXEvolveShowMoreLessModule,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { AddTestSelectionFormComponent } from "../add-test-selection-form/add-test-selection-form.component";
import { EditTestSelectionFormComponent } from "../edit-test-selection-form/edit-test-selection-form.component";
import { AddTestSelectionWithTagsModalComponent } from "../add-test-selections-with-tags-modal/add-test-selections-with-tags-modal.component";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { TestDefinition, TestSelection } from "@mxevolve/domains/test/model";

@Component({
  selector: "mxevolve-test-selection-table",
  templateUrl: "./test-selection-table.component.html",
  imports: [
    ConfirmPopupModule,
    HeaderTitleModule,
    SplitButtonModule,
    ShowElementIfAuthorizedDirective,
    ButtonModule,
    TableModule,
    SkeletonModule,
    MXEvolveShowMoreLessModule,
    AddTestSelectionFormComponent,
    EditTestSelectionFormComponent,
    AddTestSelectionWithTagsModalComponent,
    TableEmptyMessageComponent,
  ],
})
export class TestSelectionTableComponent implements OnInit, OnDestroy {
  private testDefinitionService = inject(TestDefinitionService);
  private confirmationService = inject(ConfirmationService);
  private toastMessageService = inject(ToastMessageService);
  private projectService = inject(ProjectService);

  private readonly destroy$ = new Subject();

  @Input() isLoading = false;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) testDefinition: TestDefinition;
  @Input({ required: true }) defaultBranch: string;
  @Output() reloadTestDefinition = new EventEmitter<void>();

  testSelectiontoEdit: TestSelection;
  isAddTestSelectionOpen = false;
  isEditTestSelectionOpen = false;
  isAddTestSelectionsWithTagsOpen = false;
  isTestSelectionTagsFeatureEnabled = false;

  addTestSelectionButtonOptions = [
    {
      label: "Add Test Selection with Tags",
      command: () => {
        this.openAddTestSelectionWithTagsModal();
      },
    },
  ];

  ngOnInit(): void {
    this.projectService
      .getFeatureToggle(this.projectId, "test-tags")
      .subscribe({
        next: (data) => {
          this.isTestSelectionTagsFeatureEnabled = data.toggledOn;
        },
      });
  }

  deleteTestSelection(testSelectionId: string) {
    this.isLoading = true;
    this.testDefinitionService
      .removeTestSelectionFromTestDefinition(
        this.testDefinition.projectId,
        testSelectionId
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.testDefinition.testSelections =
            this.testDefinition.testSelections.filter(
              (testSelection) => testSelection.id != testSelectionId
            );
          this.toastMessageService.showSuccess(
            "Test Selection deleted Successfully!"
          );
          this.isLoading = false;
        },
        error: (error) => {
          this.toastMessageService.showError(error);
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  onRemoveTestSelection($event: Event, testSelectionId: string) {
    this.confirmationService.confirm({
      target: $event.target as EventTarget,
      message: "Are you sure you want to delete this test selection?",
      icon: "pi pi-info-circle",
      acceptButtonStyleClass: "p-button-info p-button-sm ml-2",
      accept: () => {
        this.deleteTestSelection(testSelectionId);
      },
    });
  }

  openAddTestSelectionModal() {
    this.isAddTestSelectionOpen = true;
  }

  openAddTestSelectionWithTagsModal() {
    this.isAddTestSelectionsWithTagsOpen = true;
  }

  handleAddedTestSelections() {
    this.reloadTestDefinition.emit();
  }

  openEditTestSelectionModal(testSelection: TestSelection) {
    this.testSelectiontoEdit = testSelection;
    this.isEditTestSelectionOpen = true;
  }

  confirmDeleteAll($event: MouseEvent) {
    this.confirmationService.confirm({
      target: $event.target as EventTarget,
      message:
        "Are you sure you want to delete all test selections under this test definition?",
      icon: "pi pi-info-circle",
      accept: () => {
        this.isLoading = true;
        this.deleteAllTestSelections();
      },
    });
  }

  deleteAllTestSelections() {
    this.testDefinitionService
      .deleteAllTestSelections(this.projectId, this.testDefinition.id)
      .subscribe({
        next: () => {
          this.toastMessageService.showSuccess(
            "All test selections under this test definition were deleted successfully"
          );
          this.testDefinition.testSelections = [];
        },
        error: (err) => {
          this.toastMessageService.showError(err);
        },
      })
      .add(() => {
        this.isLoading = false;
      });
  }

  protected readonly Array = Array;
}
