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
  ValidationProcessExecutionFetcherService,
} from "@mxevolve/domains/business-process/data-access";
import { ExecutionFamily } from "@mxevolve/domains/business-process/util";
import {
  MultiPageDialogComponent,
  MultiPageDialogPageDirective,
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  SubFamilyOption,
  deriveSubFamilies,
} from "../../shared/derive-sub-families";
import { TemplatesSubFamilyFilterComponent } from "../../shared/templates-sub-family-filter/templates-sub-family-filter.component";
import { DefinitionDetailsLinkComponent } from "../../shared/definition-details-link/definition-details-link.component";
import { ValidationExecutorComponent } from "../executor/validation-executor.component";
import {
  ValidationExecutorSeed,
  toValidationExecutorSeed,
} from "../executor/validation-executor.form";

/**
 * Validation "Available Templates" dialog — Page 1 of the generic multi-page
 * dialog (VAL-27132 Step 14). Loads the project's business-process definitions
 * once, UI-filters them to the Validation family, lets the user narrow by a
 * dynamically-derived Sub-Activity, and starts a run per row.
 *
 * Page 2 (the per-family executor) is the validation Reactive-Forms executor
 * (Step 15), projected into the same multi-page dialog; this component declares
 * the `executor` page, navigates to it on Run (setting the dialog header to the
 * selected template's name) and closes + re-emits `created` when a run starts.
 */
@Component({
  selector: "mxevolve-validation-templates-dialog",
  templateUrl: "./validation-templates-dialog.component.html",
  styleUrl: "./validation-templates-dialog.component.scss",
  imports: [
    MultiPageDialogComponent,
    MultiPageDialogPageDirective,
    TemplatesSubFamilyFilterComponent,
    TableModule,
    Button,
    MxevolveIconComponent,
    ValidationExecutorComponent,
    DefinitionDetailsLinkComponent,
  ],
  providers: [
    BusinessProcessDefinitionService,
    ValidationProcessExecutionFetcherService,
  ],
})
export class ValidationTemplatesDialogComponent {
  private static readonly ALL_OPTION: SubFamilyOption = {
    label: "All",
    value: "",
  };

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

  /** Editable-field seed passed to the executor when a run is repushed. */
  protected readonly executorSeed = signal<ValidationExecutorSeed | undefined>(
    undefined
  );

  /**
   * True while the executor page has a run in flight. It locks the dialog: the
   * X, Escape and the back chevron all destroy the executor, which would abandon
   * an already-issued POST with nothing left to report its outcome.
   */
  protected readonly executorBusy = signal(false);

  /** Current dialog page; both pages render at the same 6-column width. */
  protected readonly currentPage = signal<string | undefined>("templates");
  protected readonly dialogClass = computed(() => "dialog-cols-6");

  protected readonly dialog = viewChild.required(MultiPageDialogComponent);

  private readonly definitionService = inject(BusinessProcessDefinitionService);
  private readonly executionFetcher = inject(
    ValidationProcessExecutionFetcherService
  );
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

  private readonly validationSourceDefinitions = computed(() =>
    (this.sourceDefinitionsResource.value() ?? []).filter(
      (definition) =>
        definition.family?.id === ExecutionFamily.VALIDATION_PROCESS
    )
  );

  private readonly validationDefinitions = computed(() =>
    (this.definitionsResource.value() ?? []).filter(
      (definition) =>
        definition.family?.id === ExecutionFamily.VALIDATION_PROCESS
    )
  );

  protected readonly templates = computed(() => {
    const subFamily = this.subFamily();
    const search = this.searchTerm().trim().toLowerCase();
    return this.validationDefinitions().filter(
      (definition) =>
        (!subFamily ||
          (definition.sourceDefinitionId ?? definition.id) === subFamily) &&
        (!search || definition.name.toLowerCase().includes(search))
    );
  });

  protected readonly subFamilyOptions = computed<SubFamilyOption[]>(() => [
    ValidationTemplatesDialogComponent.ALL_OPTION,
    ...deriveSubFamilies(this.validationSourceDefinitions()),
  ]);
  protected readonly pageSize = ValidationTemplatesDialogComponent.PAGE_SIZE;

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
   * the executor page directly with the form pre-filled from that run.
   */
  openRepush(processId: string): void {
    this.executionFetcher
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
          this.executorSeed.set(toValidationExecutorSeed(execution));
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
      "validation-activity",
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
