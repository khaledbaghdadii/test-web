import {
  Component,
  DestroyRef,
  inject,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { RadioButton } from "primeng/radiobutton";
import { InputTextModule } from "primeng/inputtext";
import { ValidationProcessExecutionFetcherService } from "../validation-process-execution-fetcher/validation-process-execution-fetcher.service";
import {
  MxevolveSingleSelectDropdownComponent,
  MxevolveSingleSelectBackendStateProvider,
  MxEvolveSingleSelectDropdownState,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  RtpCommitIdDataProvider,
  RtpCommitIdDataParams,
} from "./rtp-commit-id-data-provider";
import { ValidationScopeStartCommitIdInputSelectionMode } from "./validation-scope-start-commit-id-input-selection-mode";

@Component({
  selector: "mxevolve-validation-scope-start-commit-id-input",
  templateUrl: "validation-scope-start-commit-id-input.component.html",
  imports: [
    RadioButton,
    InputTextModule,
    ReactiveFormsModule,
    MxevolveSingleSelectDropdownComponent,
  ],
})
export class ValidationScopeStartCommitIdInputComponent
  implements OnInit, OnDestroy
{
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) parentBranch: string;
  @Input({ required: true }) startCommitIdFormControl: FormControl;

  private readonly destroy$ = new Subject<void>();

  selectionModeControl =
    new FormControl<ValidationScopeStartCommitIdInputSelectionMode>(
      ValidationScopeStartCommitIdInputSelectionMode.SUGGESTED_LIST,
      { nonNullable: true }
    );
  customCommitIdControl = new FormControl<string | null>(null);

  commitIdStateProvider: MxEvolveSingleSelectDropdownState<
    string,
    RtpCommitIdDataParams
  >;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const fetcherService = inject(ValidationProcessExecutionFetcherService);
    const dataProvider = new RtpCommitIdDataProvider(fetcherService);

    this.commitIdStateProvider = new MxevolveSingleSelectBackendStateProvider<
      string,
      RtpCommitIdDataParams
    >(dataProvider, destroyRef, 100);
  }

  ngOnInit(): void {
    this.selectionModeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.startCommitIdFormControl.setValue(null);
        this.customCommitIdControl.setValue(null);
      });

    this.customCommitIdControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (
          this.selectionModeControl.value ===
          ValidationScopeStartCommitIdInputSelectionMode.CUSTOMIZED
        ) {
          this.startCommitIdFormControl.setValue(value);
        }
      });
  }

  onCommitIdSelected(commitId: string | null): void {
    this.startCommitIdFormControl.setValue(commitId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected readonly CommitIdSelectionMode =
    ValidationScopeStartCommitIdInputSelectionMode;
}
