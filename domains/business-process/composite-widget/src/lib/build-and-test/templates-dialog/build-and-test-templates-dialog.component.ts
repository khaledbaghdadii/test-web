import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { TableModule } from "primeng/table";
import { Button } from "primeng/button";
import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
  BuildAndTestExecutionsService,
} from "@mxevolve/domains/business-process/data-access";
import { ExecutionFamily } from "@mxevolve/domains/business-process/util";
import {
  MultiPageDialogComponent,
  MultiPageDialogPageDirective,
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { BuildAndTestExecutorComponent } from "../executor/build-and-test-executor.component";
import {
  BuildAndTestExecutorSeed,
  toBuildAndTestExecutorSeed,
} from "../executor/build-and-test-executor.form";
import { BackportExecutorComponent } from "../../backport/executor/backport-executor.component";
import {
  SubFamilyOption,
  deriveSubFamilies,
} from "../../shared/derive-sub-families";
import { TemplatesSubFamilyFilterComponent } from "../../shared/templates-sub-family-filter/templates-sub-family-filter.component";
import { DefinitionDetailsLinkComponent } from "../../shared/definition-details-link/definition-details-link.component";

/**
 * Build & Test "Available Templates" dialog — Page 1 of the generic multi-page
 * dialog (VAL-27132 Step 8). Loads the project's business-process definitions
 * once, UI-filters them to the Build & Test family, lets the user narrow by a
 * dynamically-derived Sub-Family, and starts a run per row.
 *
 * Page 2 (the per-family executor) is wired by Steps 9/10; this component
 * declares the `executor` page and navigates to it on Run, setting the dialog
 * header to the selected template's name.
 */
@Component({
  selector: "mxevolve-build-and-test-templates-dialog",
  templateUrl: "./build-and-test-templates-dialog.component.html",
  styleUrl: "./build-and-test-templates-dialog.component.scss",
  imports: [
    MultiPageDialogComponent,
    MultiPageDialogPageDirective,
    TemplatesSubFamilyFilterComponent,
    TableModule,
    Button,
    MxevolveIconComponent,
    BuildAndTestExecutorComponent,
    BackportExecutorComponent,
    DefinitionDetailsLinkComponent,
  ],
  providers: [BusinessProcessDefinitionService, BuildAndTestExecutionsService],
})
export class BuildAndTestTemplatesDialogComponent {
  private static readonly ALL_OPTION: SubFamilyOption = {
    label: "All",
    value: "",
  };

  /** Sub-family / `sourceDefinitionId` that selects the Backport executor on Page 2. */
  private static readonly BACKPORT_SOURCE_DEFINITION_ID = "on-demand-backport";

  /** UI page size for the (client-side paginated) templates table. */
  protected static readonly PAGE_SIZE = 5;

  readonly projectId = input.required<string>();

  /** Emitted when a run is started from Page 2 so the landing page can refresh. */
  readonly created = output<void>();

  protected readonly subFamily = signal<string | undefined>(undefined);
  protected readonly searchTerm = signal("");
  protected readonly selected = signal<BusinessProcessDefinition | undefined>(
    undefined
  );

  /**
   * Editable-field seed passed to the executor when a run is repushed; undefined
   * for a normal "start a run" flow so the form uses the definition defaults.
   */
  protected readonly executorSeed = signal<
    BuildAndTestExecutorSeed | undefined
  >(undefined);

  /**
   * True while the executor page has a run in flight. It locks the dialog: the
   * X, Escape and the back chevron all destroy the executor, which would abandon
   * an already-issued POST with nothing left to report its outcome.
   */
  protected readonly executorBusy = signal(false);

  /** Current dialog page; both pages render at the same 6-column width. */
  protected readonly currentPage = signal<string | undefined>("templates");
  protected readonly dialogClass = computed(() => "dialog-cols-6");

  protected readonly isBackportSelected = computed(
    () =>
      this.selected()?.sourceDefinitionId ===
      BuildAndTestTemplatesDialogComponent.BACKPORT_SOURCE_DEFINITION_ID
  );

  protected readonly dialog = viewChild.required(MultiPageDialogComponent);

  private readonly definitionService = inject(BusinessProcessDefinitionService);
  private readonly executionsService = inject(BuildAndTestExecutionsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastMessageService);
  private readonly router = inject(Router);

  private readonly definitionsResource = rxResource({
    params: () => ({ projectId: this.projectId() }),
    stream: ({ params }) =>
      this.definitionService
        .getBusinessProcessDefinitions({
          projectId: params.projectId,
          extendable: false,
          executable: true,
        })
        .pipe(
          catchError((error: Error) => {
            this.toast.showError(error.message);
            return of<BusinessProcessDefinition[]>([]);
          })
        ),
  });

  protected readonly loading = computed(() =>
    this.definitionsResource.isLoading()
  );

  /**
   * Loads the project's source (base) definitions once; these are the family's
   * sub-families (the same list the Create Business Process Definition page
   * shows). Their `id`/`name` drive the Sub-Activity dropdown options, and the
   * executable templates are matched to them via `sourceDefinitionId`.
   */
  private readonly sourceDefinitionsResource = rxResource({
    params: () => ({ projectId: this.projectId() }),
    stream: ({ params }) =>
      this.definitionService
        .getBusinessProcessDefinitions({
          projectId: params.projectId,
          extendable: true,
        })
        .pipe(catchError(() => of<BusinessProcessDefinition[]>([]))),
  });

  private readonly buildAndTestSourceDefinitions = computed(() =>
    (this.sourceDefinitionsResource.value() ?? []).filter(
      (definition) =>
        definition.family?.id === ExecutionFamily.USER_STORY_BUILD_AND_TEST
    )
  );

  private readonly buildAndTestDefinitions = computed(() =>
    (this.definitionsResource.value() ?? []).filter(
      (definition) =>
        definition.family?.id === ExecutionFamily.USER_STORY_BUILD_AND_TEST
    )
  );

  protected readonly templates = computed(() => {
    const subFamily = this.subFamily();
    const search = this.searchTerm().trim().toLowerCase();
    return this.buildAndTestDefinitions().filter(
      (definition) =>
        (!subFamily ||
          (definition.sourceDefinitionId ?? definition.id) === subFamily) &&
        (!search || definition.name.toLowerCase().includes(search))
    );
  });

  protected readonly subFamilyOptions = computed<SubFamilyOption[]>(() => [
    BuildAndTestTemplatesDialogComponent.ALL_OPTION,
    ...deriveSubFamilies(this.buildAndTestSourceDefinitions()),
  ]);
  protected readonly pageSize = BuildAndTestTemplatesDialogComponent.PAGE_SIZE;

  /** Opens the dialog on the templates page. Called by the landing page's Build button. */
  open(): void {
    this.selected.set(undefined);
    this.executorSeed.set(undefined);
    this.subFamily.set(undefined);
    this.searchTerm.set("");
    this.dialog().open("templates");
  }

  /**
   * Repush entry point: fetches the previous run and its definition, then opens
   * the executor page directly with the form pre-filled from that run. Called by
   * the landing page when the Repush eligibility gate passes.
   */
  openRepush(processId: string): void {
    this.executionsService
      .fetchExecution(this.projectId(), processId)
      .pipe(
        switchMap((execution) =>
          this.definitionService
            .getBusinessProcessDefinition(
              this.projectId(),
              execution.definitionId
            )
            .pipe(map((definition) => ({ definition, execution })))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ definition, execution }) => {
          this.executorSeed.set(toBuildAndTestExecutorSeed(execution));
          this.selected.set(definition);
          this.dialog().open("executor");
        },
        error: (error: Error) => this.toast.showError(error.message),
      });
  }

  protected onSubFamilyChange(option: SubFamilyOption | null): void {
    this.subFamily.set(option?.value ? option.value : undefined);
  }

  protected onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  protected run(definition: BusinessProcessDefinition): void {
    this.executorSeed.set(undefined);
    this.selected.set(definition);
    this.dialog().goTo("executor");
  }

  /** A run was started from Page 2: close the dialog and notify the landing page. */
  protected onExecutorCreated(executionId: string): void {
    this.dialog().close();
    this.created.emit();
    void this.router.navigate([
      "/",
      "app",
      this.projectId(),
      "build-and-test-activity",
      "execution",
      executionId,
    ]);
  }

  protected onPageChange(pageId: string | undefined): void {
    this.currentPage.set(pageId);
    if (pageId !== "executor") {
      this.selected.set(undefined);
      this.executorSeed.set(undefined);
      // The executor is gone, so it will never emit `executingChange` again.
      this.executorBusy.set(false);
    }
  }

  /**
   * The executor's Cancel button. Coming from the templates list there is a page
   * to go back to; the repush entry point opens the executor directly (a stack of
   * one, hence no back chevron), and there Cancel has to close the dialog.
   */
  protected onExecutorCancelled(): void {
    const dialog = this.dialog();
    if (dialog.canGoBack()) {
      dialog.back();
    } else {
      dialog.close();
    }
  }
}
