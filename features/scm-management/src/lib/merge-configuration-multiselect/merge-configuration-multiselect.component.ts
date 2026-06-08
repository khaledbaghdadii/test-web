import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  Signal,
} from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MergeConfigurationMultiSelectStateService } from "./state-service/merge-configuration-multiselect-state.service";
import { MultiSelectModule } from "primeng/multiselect";

import { toObservable, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LazyLoadEvent } from "primeng/api";
import { InputTextModule } from "primeng/inputtext";
import { AutoFocus } from "primeng/autofocus";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";

@Component({
  selector: "mxevolve-merge-configuration-multiselect",
  templateUrl: "./merge-configuration-multiselect.component.html",
  standalone: true,
  imports: [
    MultiSelectModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    AutoFocus,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [MergeConfigurationMultiSelectStateService],
})
export class MergeConfigurationMultiSelectComponent {
  private readonly stateService = inject(
    MergeConfigurationMultiSelectStateService
  );

  @Input() selectedMergeConfigurations: FormControl = new FormControl();
  @Input() set projectId(value: string) {
    if (value) {
      this.stateService.setProjectIdSubject(value);
    }
  }
  @Input() set repositoryId(value: string) {
    if (value) {
      this.stateService.setRepositoryIdSubject(value);
    }
  }

  @Output() errorEventEmitter = new EventEmitter<string>();
  @Output() loadingFinishedEventEmitter = new EventEmitter<void>();

  readonly itemsStep = 5;
  readonly virtualScrollItemSize = 40;

  readonly errorMessageSignal = this.stateService.errorMessageSignal;
  readonly mergeConfigurationsSignal =
    this.stateService.mergeConfigurationsSignal;
  readonly isLastPageSignal = this.stateService.isLastPageSignal;
  readonly isLoadingDataSignal = this.stateService.isLoadingDataSignal;
  readonly pageIndexSignal = this.stateService.pageIndexSignal;
  readonly searchKeySignal = this.stateService.searchKeySignal;

  constructor() {
    this.subscribeToSignals();
  }

  handleScroll = (event: LazyLoadEvent): void => {
    if (this.shouldLoadMoreData(event.last ?? 0)) {
      this.stateService.setPageIndexSubject(this.pageIndexSignal() + 1);
    }
  };

  handleSearchKeyChange(filter: string): void {
    this.stateService.setPageIndexSubject(0);
    this.stateService.setSearchKeySubject(filter);
  }

  handleClearSearchKey(event: { stopPropagation: () => void }) {
    if (this.searchKeySignal()) {
      event.stopPropagation();
      this.stateService.setPageIndexSubject(0);
      this.stateService.setSearchKeySubject("");
    }
  }

  private shouldLoadMoreData(last: number): boolean {
    return (
      !this.isLastPageSignal() &&
      this.mergeConfigurationsSignal().length <= last &&
      !this.isLoadingDataSignal()
    );
  }

  private subscribeToSignals(): void {
    this.handleSignal(this.errorMessageSignal, (error: string) => {
      if (error) this.errorEventEmitter.emit(error);
    });

    this.handleSignal(this.isLoadingDataSignal, (isLoading: boolean) => {
      if (!isLoading) this.loadingFinishedEventEmitter.emit();
    });
  }

  private handleSignal<T>(signal: Signal<T>, action: (value: T) => void): void {
    toObservable(signal).pipe(takeUntilDestroyed()).subscribe(action);
  }
}
