import {
  Component,
  DestroyRef,
  forwardRef,
  inject,
  input,
  signal,
} from "@angular/core";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { InputText } from "primeng/inputtext";
import { RadioButton } from "primeng/radiobutton";
import {
  MxevolveSingleSelectDropdownComponent,
  MxEvolveSingleSelectDropdownState,
  MxevolveSingleSelectFrontendStateProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  ValidationProcessExecutionMapperService,
  ValidationProcessListingService,
} from "@mxevolve/domains/business-process/data-access";
import {
  ScopeStartCommitDataProvider,
  ScopeStartCommitParams,
} from "./scope-start-commit-data-provider";

type ScopeStartCommitMode = "SUGGESTED" | "CUSTOM";

/**
 * Dual-mode validation scope-start-commit picker (legacy
 * `ValidationScopeStartCommitIdInputComponent`): a radio toggle between a
 * suggested-commit dropdown (distinct RTP commit ids of the MQG validation
 * executions on the parent branch) and a free-text custom commit id. Implements
 * `ControlValueAccessor` binding to the executor's `validationScopeStartCommitId`
 * control; the active mode drives the emitted value.
 */
@Component({
  selector: "mxevolve-scope-start-commit-input",
  templateUrl: "./scope-start-commit-input.component.html",
  imports: [
    FormsModule,
    InputText,
    RadioButton,
    MxevolveSingleSelectDropdownComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScopeStartCommitInputComponent),
      multi: true,
    },
    ValidationProcessListingService,
    ValidationProcessExecutionMapperService,
  ],
})
export class ScopeStartCommitInputComponent implements ControlValueAccessor {
  readonly projectId = input.required<string>();
  readonly parentBranch = input<string | undefined>(undefined);

  protected readonly mode = signal<ScopeStartCommitMode>("SUGGESTED");
  protected readonly customCommitId = signal<string>("");

  readonly stateProvider: MxEvolveSingleSelectDropdownState<
    string,
    ScopeStartCommitParams
  >;

  private readonly listingService = inject(ValidationProcessListingService);
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const destroyRef = inject(DestroyRef);
    const dataProvider = new ScopeStartCommitDataProvider(this.listingService);
    this.stateProvider = new MxevolveSingleSelectFrontendStateProvider(
      dataProvider,
      destroyRef
    );
  }

  writeValue(value: string | null): void {
    this.customCommitId.set(value ?? "");
    this.stateProvider.setSelectedItem(value ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  protected selectMode(mode: ScopeStartCommitMode): void {
    this.mode.set(mode);
    this.emitActiveValue();
  }

  protected onSuggestedSelected(commitId: string | null): void {
    this.stateProvider.setSelectedItem(commitId);
    if (this.mode() === "SUGGESTED") {
      this.emit(commitId);
    }
  }

  protected onCustomChanged(value: string): void {
    this.customCommitId.set(value);
    if (this.mode() === "CUSTOM") {
      this.emit(value || null);
    }
  }

  private emitActiveValue(): void {
    if (this.mode() === "SUGGESTED") {
      this.emit(this.stateProvider.selectedItem() ?? null);
    } else {
      this.emit(this.customCommitId() || null);
    }
  }

  private emit(value: string | null): void {
    this.onChange(value);
    this.onTouched();
  }
}
