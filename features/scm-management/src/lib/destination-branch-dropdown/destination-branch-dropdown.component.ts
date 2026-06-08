import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  input,
  OnInit,
  Output,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { catchError, of, switchMap, throwError } from "rxjs";
import { MergeConfigurationService } from "../merge-configuration/merge-configuration.service";
import { MergeConfiguration } from "../merge-configuration/model/merge-configuration";
import { Repository, RepositoryService } from "@mxflow/features/repository";
import { DestinationBranchDataProvider } from "./data-provider/destination-branch-data-provider";
import {
  MxevolveSingleSelectDropdownComponent,
  BaseSingleSelectDropdown,
  MxevolveSingleSelectBackendStateProvider,
  MxEvolveSingleSelectDropdownState,
} from "@mxflow/ui/mxevolve-dropdown";

@Component({
  selector: "mxflow-destination-branch-dropdown",
  templateUrl: "destination-branch-dropdown.component.html",
  standalone: true,
  imports: [MxevolveSingleSelectDropdownComponent],
  providers: [
    ...BaseSingleSelectDropdown.createProviders(
      DestinationBranchDropdownComponent
    ),
    MergeConfigurationService,
    RepositoryService,
  ],
})
export class DestinationBranchDropdownComponent
  extends BaseSingleSelectDropdown<
    MergeConfiguration,
    { projectId: string; repositoryId: string }
  >
  implements OnInit
{
  projectId = input.required<string>();
  repositoryId = input.required<string>();

  @Input() defaultDestinationBranchName?: string;
  @Input() setDefaultDestinationBranch?: boolean = true;

  @Output() loadingFinishedEventEmitter = new EventEmitter<any>();

  defaultDestinationBranchConfiguration?: MergeConfiguration;
  mergeConfigurations: MergeConfiguration[] = [];

  mergeConfigurationPageSize = 100;
  mergeConfigurationPageIndex = 0;
  lastMergeConfigurationPage = false;

  protected override stateProvider: MxEvolveSingleSelectDropdownState<
    MergeConfiguration,
    { projectId: string; repositoryId: string }
  >;

  private readonly destroyRef = inject(DestroyRef);
  private readonly repositoryService = inject(RepositoryService);
  private readonly mergeConfigurationService = inject(
    MergeConfigurationService
  );

  constructor() {
    super();
    const dataProvider = new DestinationBranchDataProvider(
      this.mergeConfigurationService
    );

    this.stateProvider = new MxevolveSingleSelectBackendStateProvider(
      dataProvider,
      this.destroyRef
    );
  }

  ngOnInit(): void {
    this.setupLegacyInit();
  }

  /**
   * Backward-compatible initialization: loads all merge configs,
   * resolves default destination branch, and emits loadingFinishedEventEmitter.
   */
  private setupLegacyInit(): void {
    this.mergeConfigurationService
      .getFilteredMergeConfigurations(
        this.projectId(),
        { searchKey: "", repositoryId: this.repositoryId() },
        this.mergeConfigurationPageSize,
        this.mergeConfigurationPageIndex
      )
      .pipe(
        switchMap((mergeConfigurationPage) => {
          this.lastMergeConfigurationPage = mergeConfigurationPage.last;
          this.mergeConfigurations = mergeConfigurationPage.content;
          return this.setRepositoryDefaultDestinationBranch();
        }),
        catchError(() =>
          throwError(() => {
            this.failureEvent.emit(
              "Error! Could not load initial merge configurations"
            );
            this.loadingFinishedEventEmitter.emit();
          })
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          if (
            this.setDefaultDestinationBranch &&
            this.defaultDestinationBranchConfiguration
          ) {
            this.stateProvider.setSelectedItem(
              this.defaultDestinationBranchConfiguration
            );
            this.onSelectionChange(this.defaultDestinationBranchConfiguration);
          }
          this.loadingFinishedEventEmitter.emit();
        },
        error: () => {
          this.failureEvent.emit("Error! Could not load merge configurations");
          this.loadingFinishedEventEmitter.emit();
        },
      });
  }

  private setRepositoryDefaultDestinationBranch() {
    return this.repositoryService
      .getRepoById(this.projectId(), this.repositoryId())
      .pipe(
        switchMap((repository) => {
          this.setDefaultDestinationBranchConfigurationIfAvailable();
          if (!this.defaultDestinationBranchConfiguration) {
            this.setDefaultDestinationBranchConfigurationToRepositoryDefault(
              repository
            );
          }
          return of(this.defaultDestinationBranchConfiguration);
        }),
        catchError(() => {
          this.defaultDestinationBranchConfiguration =
            this.mergeConfigurations.find(
              (mergeConfig) =>
                mergeConfig.branchName == this.defaultDestinationBranchName
            );
          return of(this.defaultDestinationBranchConfiguration);
        })
      );
  }

  private setDefaultDestinationBranchConfigurationIfAvailable() {
    this.defaultDestinationBranchConfiguration = this.mergeConfigurations.find(
      (mergeConfiguration) =>
        mergeConfiguration.branchName == this.defaultDestinationBranchName
    );
  }

  private setDefaultDestinationBranchConfigurationToRepositoryDefault(
    repository: Repository
  ) {
    this.defaultDestinationBranchConfiguration = this.mergeConfigurations.find(
      (mergeConfiguration) =>
        mergeConfiguration.branchName == repository.defaultBranch
    );
  }
}
