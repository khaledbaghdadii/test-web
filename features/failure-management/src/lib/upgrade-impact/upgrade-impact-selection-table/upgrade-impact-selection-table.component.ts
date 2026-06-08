import {
  Component,
  EventEmitter,
  inject,
  Input,
  model,
  OnDestroy,
  Output,
} from "@angular/core";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import {
  TableChipsFilterComponent,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { SharedModule } from "primeng/api";
import { SkeletonModule } from "primeng/skeleton";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { UpgradeImpactDataService } from "../upgrade-impact-data.service";
import { Defect, LiteUpgradeImpact } from "../model/lite-upgrade-impact.model";
import { Subject, takeUntil } from "rxjs";
import { FetchUpgradeImpactsTableQuery } from "./fetch-upgrade-impacts-table-query.model";
import { FetchUpgradeImpactsQuery } from "../model/fetch-upgrade-impacts-query.model";
import { ValidationScope } from "@mxflow/features/validation-management";
import { toObservable } from "@angular/core/rxjs-interop";

@Component({
  imports: [
    CardContainerModule,
    HeaderTitleModule,
    SharedModule,
    SkeletonModule,
    TableEmptyMessageComponent,
    TableModule,
    TooltipModule,
    TableChipsFilterComponent,
  ],
  providers: [UpgradeImpactDataService],
  selector: "mxevolve-upgrade-impact-selection-table",
  templateUrl: "./upgrade-impact-selection-table.component.html",
  styleUrls: ["upgrade-impact-selection-table.component.scss"],
})
export class UpgradeImpactSelectionTableComponent implements OnDestroy {
  private readonly upgradeImpactDataService = inject(UpgradeImpactDataService);

  private _selectedUpgradeImpactId?: string;
  private _validationScope?: ValidationScope;
  private _isVisible = false;
  query: FetchUpgradeImpactsTableQuery = {
    page: 0,
    size: 10,
    sort: "createdOn,desc",
  };

  showUpgradeImpactsWithoutDefects = model<boolean>(false);

  constructor() {
    toObservable(this.showUpgradeImpactsWithoutDefects)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.fetchUpgradeImpacts();
      });
  }

  upgradeImpacts: LiteUpgradeImpact[];
  selectedImpact: { id: string } | undefined;
  isLoading = false;
  total = 0;
  selectedTitlePhrases: string[] = [];
  selectedIntroducedInArchivalPhrases: string[] = [];
  selectedDefectIdPhrases: string[] = [];
  selectedBpcFFTopicPhrases: string[] = [];
  selectedIntroducedInReleaseVersionPhrases: string[] = [];
  selectedImpactedOutputPhrases: string[] = [];
  selectedImpactedInstrumentsScopePhrases: string[] = [];
  selectedExternalIssueIdPhrases: string[] = [];
  readonly destroy$ = new Subject();

  @Input() set selectedUpgradeImpactId(value: string | undefined) {
    this._selectedUpgradeImpactId = value;
    this.selectedImpact = value ? { id: value } : undefined;
  }

  get selectedUpgradeImpactId(): string | undefined {
    return this._selectedUpgradeImpactId;
  }

  @Input() set isVisible(value: boolean) {
    this._isVisible = value;
    if (value) {
      this.fetchUpgradeImpacts();
    }
  }

  get isVisible(): boolean {
    return this._isVisible;
  }

  @Input() get validationScope(): ValidationScope | undefined {
    return this._validationScope;
  }

  set validationScope(value: ValidationScope | undefined) {
    this._validationScope = value;
    this.query = {
      ...this.query,
      page: 0,
    };
    this.fetchUpgradeImpacts();
  }

  @Input() hideSelection = false;
  @Output() selectedUpgradeImpactIdChange = new EventEmitter<string>();
  @Output() errorMessage = new EventEmitter<string>();
  @Output() warningMessage = new EventEmitter<string | undefined>();

  handleTableQueryParamsChange(event: TableLazyLoadEvent) {
    this.updateQueryPaginationParams(event);
    this.updateQueryFilterParams(event);
    this.fetchUpgradeImpacts();
  }

  impactSelected(impact: LiteUpgradeImpact) {
    this.selectedUpgradeImpactIdChange.emit(impact.id);
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  getDefectIds(defects: Defect[]): string {
    return defects.map((defect) => defect.defectId).join(", ");
  }

  fetchUpgradeImpacts() {
    if (this.isVisible) {
      this.isLoading = true;
      this.upgradeImpacts = [];
      this.upgradeImpactDataService
        .fetchAll(this.buildFetchUpgradeImpactsQuery())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.upgradeImpacts = response.upgradeImpacts.content;
            this.total = response.upgradeImpacts.totalElements;
            this.handleWarningMessage(response.warningMessage);
          },
          error: (errorMessage) => {
            this.isLoading = false;
            this.errorMessage.emit(errorMessage);
          },
        });
    }
  }

  private handleWarningMessage(warningMessage: string | undefined) {
    this.warningMessage.emit(warningMessage);
  }

  private buildFetchUpgradeImpactsQuery(): FetchUpgradeImpactsQuery {
    return {
      ...this.query,
      currentVersion: this.validationScope?.currentVersion,
      referenceVersion: this.validationScope?.referenceVersion,
      returnUpgradeImpactsNotLinkedToAnyDefect:
        this.showUpgradeImpactsWithoutDefects(),
    };
  }

  private updateQueryPaginationParams(event: TableLazyLoadEvent) {
    this.query.size = event.rows ?? 10;
    this.query.page = this.getPageIndex(event);
  }

  private updateQueryFilterParams(event: TableLazyLoadEvent) {
    Object.entries(event.filters ?? {}).forEach(
      ([tableFilterKey, tableFilterValue]) => {
        if (Array.isArray(tableFilterValue) && tableFilterValue[0].value) {
          this.updateQueryProperty(tableFilterKey, tableFilterValue[0].value);
        } else if (
          !Array.isArray(tableFilterValue) &&
          typeof tableFilterValue === "object"
        ) {
          this.updateQueryProperty(tableFilterKey, tableFilterValue.value);
        } else {
          this.deleteQueryProperty(tableFilterKey);
        }
      }
    );
  }

  private updateQueryProperty(
    key: keyof FetchUpgradeImpactsTableQuery,
    newValue?: FetchUpgradeImpactsTableQuery[keyof FetchUpgradeImpactsTableQuery]
  ) {
    if (newValue) {
      this.query[key] = newValue;
    }
  }

  private deleteQueryProperty(key: keyof FetchUpgradeImpactsTableQuery) {
    delete this.query[key];
  }

  private getPageIndex(event: TableLazyLoadEvent): number {
    const firstRowDisplayedIndex = event.first ?? 0;
    const numberOfRowsPerPage = event.rows ?? 10;
    return Math.floor(firstRowDisplayedIndex / numberOfRowsPerPage);
  }
}
