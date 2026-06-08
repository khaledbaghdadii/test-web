import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import {
  AutoCompleteCompleteEvent,
  AutoCompleteLazyLoadEvent,
  AutoCompleteModule,
} from "primeng/autocomplete";
import { SendForReviewStateService } from "./state-service/send-for-review-state.service";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import {
  Reviewer,
  MergeConfiguration,
  DevelopmentService,
  ReviewersService,
} from "@mxevolve/domains/scm/data-access";
import { concatMap, filter, startWith, tap } from "rxjs";
import { Skeleton } from "primeng/skeleton";
import { WarningAlertModule } from "@mxflow/ui/alert";

@Component({
  selector: "mxevolve-autocomplete-reviewers",
  templateUrl: "./reviewers-autocomplete.component.html",
  imports: [
    AutoCompleteModule,
    ReactiveFormsModule,
    Skeleton,
    WarningAlertModule,
  ],
  providers: [SendForReviewStateService, DevelopmentService, ReviewersService],
})
export class ReviewersAutoCompleteComponent implements OnInit {
  sendForReviewStateService = inject(SendForReviewStateService);
  developmentService = inject(DevelopmentService);
  reviewersService = inject(ReviewersService);

  @Input()
  reviewersFormControl: FormControl;
  @Input()
  destinationBranchFormControl: FormControl;
  @Input()
  sourceDevelopmentId: string;
  showReviewersWarningMessage = false;
  private _project_id: string;

  @Input() set projectId(value: string) {
    if (value) {
      this._project_id = value;
      this.sendForReviewStateService.setProjectId(value);
    }
  }
  get projectId(): string {
    return this._project_id;
  }

  @Output() errorMessageChange = new EventEmitter<string>();

  readonly itemsStep = 15;
  readonly virtualScrollItemSize = 34;

  errorMessageSignal = this.sendForReviewStateService.errorMessage;
  reviewerSuggestions = this.sendForReviewStateService.reviewerSuggestions;
  isReviewersLastPage = this.sendForReviewStateService.isLastPage;
  isLoadingData = this.sendForReviewStateService.isLoadingData;
  pageIndex = this.sendForReviewStateService.pageIndex;
  defaultReviewersLoading = false;

  reviewerSuggestionsChanged = false;
  listOfReviewerSuggestions: Reviewer[] = [];

  readonly changeRef = inject(ChangeDetectorRef);

  constructor() {
    toObservable(this.errorMessageSignal)
      .pipe(takeUntilDestroyed())
      .subscribe((error) => {
        if (error) this.errorMessageChange.emit(error);
      });

    toObservable(this.reviewerSuggestions)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.reviewerSuggestions().length > 0) {
          this.reviewerSuggestionsChanged = true;
        }
      });
  }

  ngOnInit() {
    if (this.destinationBranchFormControl) {
      this.destinationBranchFormControl.valueChanges
        .pipe(
          startWith(this.destinationBranchFormControl.value),
          filter((mergeConfig) => !!mergeConfig)
        )
        .subscribe((mergeConfiguration: MergeConfiguration) => {
          this.defaultReviewersLoading = true;
          this.showReviewersWarningMessage = false;
          this.getDefaultReviewers(
            this.projectId,
            this.sourceDevelopmentId,
            mergeConfiguration.branchName
          ).subscribe({
            next: (defaultReviewers) => {
              this.reviewersFormControl.setValue(
                defaultReviewers.content.map((reviewers) => ({
                  name: reviewers.name,
                  displayName: reviewers.displayName,
                }))
              );
              this.defaultReviewersLoading = false;
              this.changeRef.detectChanges();
            },
            error: () => {
              this.defaultReviewersLoading = false;
              this.showReviewersWarningMessage = true;
              this.reviewersFormControl.setValue([]);
              this.changeRef.detectChanges();
            },
          });
        });
    }
  }

  private getDefaultReviewers(
    projectId: string,
    developmentId: string,
    targetBranch: string
  ) {
    return this.developmentService
      .getDevelopment(projectId, developmentId)
      .pipe(
        tap((development) => {
          this.sendForReviewStateService.setRepositoryId(
            development.repository.id
          );
        }),
        concatMap((development) =>
          this.reviewersService.getDefaultReviewers(
            projectId,
            development.repository.id,
            development.name,
            targetBranch
          )
        )
      );
  }

  handleReviewerSuggestionsScroll = (
    event: AutoCompleteLazyLoadEvent
  ): void => {
    if (this.shouldScrollForReviewerSuggestions(event.last ?? 0)) {
      this.sendForReviewStateService.setPageIndex(this.pageIndex() + 1);
    }
  };

  getMatchingReviewers(event: AutoCompleteCompleteEvent) {
    this.sendForReviewStateService.setFilterReset(true);
    this.sendForReviewStateService.setPageIndex(0);
    this.sendForReviewStateService.setFilter(event.query);
    this.waitForReviewerSuggestionsUpdate().then(() => {
      this.reviewerSuggestionsChanged = false;
      this.listOfReviewerSuggestions = this.reviewerSuggestions();
      this.changeRef.detectChanges();
    });
  }

  waitForReviewerSuggestionsUpdate() {
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (
          this.reviewerSuggestionsChanged &&
          this.reviewerSuggestions().length > 0
        ) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  private shouldScrollForReviewerSuggestions(last: number): boolean {
    return (
      !this.isReviewersLastPage() &&
      this.reviewerSuggestions().length < last + this.itemsStep &&
      !this.isLoadingData()
    );
  }
}
