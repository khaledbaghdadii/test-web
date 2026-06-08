import {
  Component,
  EventEmitter,
  Input,
  NgModule,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Observable, Subject, takeUntil } from "rxjs";
import { BusinessProcessChain } from "../business-process-chain";
import { StreamsService } from "../streams.service";
import { Store } from "@ngrx/store";
import { GlobalSelectors } from "@mxflow/core/global-store";
import {
  MultiSelect,
  MultiSelectChangeEvent,
  MultiSelectModule,
} from "primeng/multiselect";
import { MandatoryModule } from "@mxflow/directive";
import { SkeletonModule } from "primeng/skeleton";
import { ChipModule } from "primeng/chip";

@Component({
  selector: "mxevolve-business-process-chain-select-input",
  templateUrl: "./business-process-chain-select-input.component.html",
  standalone: false,
})
export class BusinessProcessChainSelectInputComponent
  implements OnInit, OnDestroy
{
  private readonly destroy$ = new Subject();
  @Input() form: FormGroup;
  @Input() errorTipTemplate: TemplateRef<any>;
  @Input() isFormLoading = false;

  @Output() selectBpcEvent = new EventEmitter<string[]>();

  listOfBpcs$: Observable<BusinessProcessChain[]>;
  constructor(private streamService: StreamsService, private store: Store) {}

  ngOnInit() {
    this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((projectId) => {
        this.listOfBpcs$ =
          this.streamService.getListOfBpcsByProjectId(projectId);
      });
  }

  onBpcSelect(event: MultiSelectChangeEvent) {
    const bpcs: BusinessProcessChain[] = event.value;
    this.selectBpcEvent.emit(bpcs.map((bpc) => bpc.id));
  }

  onBpcRemove(
    multiSelect: MultiSelect,
    option: BusinessProcessChain,
    event: MouseEvent
  ) {
    multiSelect.removeOption(option, event);
    this.selectBpcEvent.emit(multiSelect.value.map((bpc) => bpc.id));
  }

  onClear() {
    this.selectBpcEvent.emit([]);
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MultiSelectModule,
    MandatoryModule,
    SkeletonModule,
    ChipModule,
  ],
  declarations: [BusinessProcessChainSelectInputComponent],
  exports: [BusinessProcessChainSelectInputComponent],
  providers: [StreamsService],
})
export class BusinessProcessChainSelectInputModule {}
