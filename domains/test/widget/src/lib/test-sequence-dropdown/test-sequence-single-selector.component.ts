import {
  Component,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  input,
  output,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import {
  MxevolveSingleSelectDropdownComponent,
  MxEvolveSingleSelectDropdownState,
  MxevolveSingleSelectFrontendStateProvider,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  TestSequenceDataProvider,
  TestSequenceParams,
} from "./test-sequence-data-provider";
import { ToastMessageService } from "@mxflow/ui/alert";
import { TestSequenceService } from "@mxevolve/domains/test/data-access";
import { TestSequenceSummaryModel } from "@mxevolve/domains/test/model";
import { RepositoryService } from "@mxflow/features/repository";

@Component({
  selector: "mxevolve-test-sequence-single-selector",
  templateUrl: "./test-sequence-single-selector.component.html",
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TestSequenceSingleSelectorComponent),
      multi: true,
    },
    TestSequenceService,
  ],
})
export class TestSequenceSingleSelectorComponent
  implements ControlValueAccessor
{
  projectId = input.required<string>();
  repositoryId = input.required<string | null>();
  disabled = input(false);

  failureEvent = output<string>();

  readonly stateProvider: MxEvolveSingleSelectDropdownState<
    TestSequenceSummaryModel,
    TestSequenceParams
  >;

  private readonly toastMessageService = inject(ToastMessageService);
  private readonly testSequenceService = inject(TestSequenceService);
  private prefilledPath: string | undefined = undefined;
  private onChange: (value: string | undefined) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const destroyRef = inject(DestroyRef);
    const repositoryService = inject(RepositoryService);
    const dataProvider = new TestSequenceDataProvider(
      this.testSequenceService,
      repositoryService
    );
    this.stateProvider = new MxevolveSingleSelectFrontendStateProvider(
      dataProvider,
      destroyRef
    );

    effect(() => {
      const sequences = this.stateProvider.items();
      if (sequences?.length && this.prefilledPath) {
        this.resolvePrefilledPath(sequences);
      }
    });
  }

  writeValue(value: string | undefined): void {
    this.prefilledPath = value;

    const sequences = this.stateProvider.items();
    if (sequences?.length) {
      this.resolvePrefilledPath(sequences);
    }
  }

  registerOnChange(fn: (value: string | undefined) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onSelectionChange(selectedSequence: TestSequenceSummaryModel | null): void {
    this.onChange(selectedSequence?.name);
    this.onTouched();
  }

  onError(errorMessage: string): void {
    this.failureEvent.emit(errorMessage);
  }

  private resolvePrefilledPath(
    fetchedSequences: TestSequenceSummaryModel[]
  ): void {
    const path = this.prefilledPath;
    this.prefilledPath = undefined;

    if (!path) {
      this.stateProvider.setSelectedItem(null);
      return;
    }

    const isValidPath = fetchedSequences.find((seq) => seq.name === path);

    if (isValidPath) {
      this.stateProvider.setSelectedItem(isValidPath);
    } else {
      this.stateProvider.setSelectedItem({ id: path, name: path });
      this.toastMessageService.showWarning(
        `The previously selected test sequence '${path}' is no longer available.`,
        "Test Sequence Unavailable"
      );
    }
  }
}
