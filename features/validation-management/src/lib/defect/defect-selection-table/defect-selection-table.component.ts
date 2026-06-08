import { CommonModule, DatePipe } from "@angular/common";
import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  Output,
} from "@angular/core";
import { HeaderTitleModule } from "@mxflow/ui/header";
import {
  FilterTranslatorService,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { SkeletonModule } from "primeng/skeleton";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { DefectTableStateService } from "./defect-table-state.service";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { DefectService } from "../defect.service";
import { DefectTableQuery } from "./defect-table-query.model";
import { ValidationScope } from "../../validation-scope/model/validation-scope.model";
import { Defect } from "../model/defect.model";

@Component({
  selector: "mxevolve-defect-selection-table",
  imports: [
    CommonModule,
    HeaderTitleModule,
    SkeletonModule,
    TableEmptyMessageComponent,
    TableModule,
    TooltipModule,
  ],
  providers: [
    DefectTableStateService,
    DefectService,
    DatePipe,
    FilterTranslatorService,
  ],
  templateUrl: "./defect-selection-table.component.html",
  styleUrls: ["./defect-selection-table.component.scss"],
})
export class DefectSelectionTableComponent {
  stateService = inject(DefectTableStateService);
  filterTranslator = inject(FilterTranslatorService);

  defects = this.stateService.defects;
  totalRecords = this.stateService.totalElements;
  errorMessage = this.stateService.errorMessage;
  isLoading = this.stateService.isLoading;
  warningMessage = this.stateService.warningMessage;
  firstRowIndex = computed(
    () => this.stateService.page() * this.stateService.pageSize()
  );
  selectedDefect: Defect;

  @Input() set validationScope(value: ValidationScope | undefined) {
    this.stateService.setValidationScope(value);
  }

  @Input() set isVisible(value: boolean) {
    this.stateService.setIsVisible(value);
  }
  @Input() hideSelection = false;
  @Output() selectedDefectChange = new EventEmitter<Defect>();
  @Output() errorMessageChange = new EventEmitter<string>();
  @Output() warningMessageChange = new EventEmitter<string | undefined>();

  constructor() {
    this.emitMessageOnError();
    this.emitMessageOnWarning();
  }

  handleDefectSelection(defect: Defect) {
    this.selectedDefectChange.emit(defect);
  }

  handleTableQueryParamsChange(event: TableLazyLoadEvent): void {
    const newQuery =
      this.filterTranslator.handleTableFiltersChange<DefectTableQuery>(event);
    this.stateService.setDefectTableQuery(newQuery);
  }

  private emitMessageOnError() {
    toObservable(this.errorMessage)
      .pipe(takeUntilDestroyed())
      .subscribe((error) => {
        if (error) this.errorMessageChange.emit(error);
      });
  }

  private emitMessageOnWarning() {
    toObservable(this.warningMessage)
      .pipe(takeUntilDestroyed())
      .subscribe((warning) => {
        this.warningMessageChange.emit(warning);
      });
  }
}
