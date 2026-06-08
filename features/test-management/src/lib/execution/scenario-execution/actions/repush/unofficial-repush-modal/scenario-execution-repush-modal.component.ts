import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import {
  RepushScenarioExecutionRequest,
  ScenarioExecutionService,
} from "@mxflow/test-management";
import { WhitespaceValidators } from "@mxflow/validator";
import { Store } from "@ngrx/store";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { ToastMessageService } from "@mxflow/ui/alert";

@Component({
  selector: "mxevolve-scenario-execution-repush-modal",
  templateUrl: "./scenario-execution-repush-modal.component.html",
  standalone: false,
})
export class ScenarioExecutionRepushModalComponent implements OnInit {
  private formBuilder = inject(UntypedFormBuilder);
  private store = inject(Store);
  private scenarioExecutionService = inject(ScenarioExecutionService);
  private toastMessageService = inject(ToastMessageService);

  private destroy$ = new Subject();

  @Input() enableKeepServices?: boolean = false;
  @Input() disableKeepExecution = false;
  @Input() warningMessage?: string;

  @Output() scenarioRepushed = new EventEmitter();

  showModal: boolean;
  loading = false;
  projectId: string;
  scenarioExecutionRepushForm: UntypedFormGroup;
  input: ScenarioExecutionRepushModalInput;
  isKeptExecution = false;
  keepServices?: boolean;

  ngOnInit(): void {
    this.scenarioExecutionRepushForm = this.formBuilder.group({
      commitId: [null, WhitespaceValidators.noWhitespaces()],
      factoryProductId: [
        null,
        [Validators.required, WhitespaceValidators.notBlank()],
      ],
    });
  }

  openModal(input: ScenarioExecutionRepushModalInput) {
    this.store
      .select(GlobalSelectors.getProjectId)
      .subscribe((value) => (this.projectId = value));
    this.showModal = true;
    this.input = input;
    this.isKeptExecution = input.keptExecution;
    this.initializeForm();
  }

  closeModal() {
    this.loading = false;
    this.showModal = false;
  }

  private initializeForm() {
    this.scenarioExecutionRepushForm
      .get("factoryProductId")
      ?.setValue(this.input.factoryProductId);
  }

  factoryProductIdChanged(id: string | undefined) {
    this.scenarioExecutionRepushForm.get("factoryProductId")?.setValue(id);
  }

  submitRepush() {
    this.loading = true;
    this.scenarioExecutionService
      .repushScenarioExecution(
        this.projectId,
        this.input.scenarioExecutionId,
        this.buildRequest()
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeModal();
          this.notifyRepushSuccessful();
          this.scenarioRepushed.emit();
        },
        error: () => {
          this.loading = false;
          this.notifyRepushFailure();
        },
      });
  }

  onKeepServicesChanged(checked: boolean) {
    this.keepServices = checked;
  }

  private buildRequest() {
    return {
      commitId: this.scenarioExecutionRepushForm.controls["commitId"].value
        ? this.scenarioExecutionRepushForm.controls["commitId"].value
        : null,
      factoryProductId: this.scenarioExecutionRepushForm.controls[
        "factoryProductId"
      ].value
        ? this.scenarioExecutionRepushForm.controls["factoryProductId"].value
        : null,
      executionGroupId: this.input.executionGroupId,
      stopServices: !this.keepServices,
    } as RepushScenarioExecutionRequest;
  }

  private notifyRepushSuccessful() {
    this.toastMessageService.showSuccess(
      "Scenario execution successfully repushed."
    );
  }

  private notifyRepushFailure() {
    this.toastMessageService.showError("Failed to repush scenario execution.");
  }
}

export class ScenarioExecutionRepushModalInput {
  scenarioExecutionId: string;
  factoryProductId: string;
  executionGroupId?: string;
  keptExecution: boolean;
}
