import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  InfraGroupService,
  SelectedGroup,
} from "@mxevolve/domains/infra/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { tap } from "rxjs";
import { Select } from "primeng/select";
import { GroupDropdownSelectionComponent } from "../group-dropdown-selection/group-dropdown-selection.component";

/**
 * Shown when the group the Process Template points at cannot be fetched. The
 * control is left empty and required, so the form is unsubmittable until the
 * template is corrected — the toast has to say that, because the field itself
 * is usually hidden (it is prefilled, so `ACCESS_INVALID_INPUTS_ONLY` had
 * already decided not to render it) and the user sees nothing else.
 */
const PREFILLED_INFRA_GROUP_UNAVAILABLE =
  "The Infra Group available in the Process Template could not be loaded. Please update the Process Template.";

/** The service's own fallback wording for a failed groups lookup. */
const INFRA_GROUP_FETCH_FAILED = "Could not fetch groups details";

/**
 * `ToastMessageService.showError` takes a `detail: string`. `InfraGroupService`
 * rejects with a plain message string, but anything raised before that mapping
 * (a thrown `TypeError`, an `HttpErrorResponse` that never reached it) arrives
 * as an object and used to be handed to the toast as-is, rendering
 * "[object Object]".
 */
function toErrorDetail(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

/**
 * New-architecture migration (copied verbatim, adapted to the migrated new-arch
 * data-access and shared/ui toast service) of the legacy
 * `web/libs/ui/inputs/src/lib/business-process-infra-group-selector/business-process-infra-group-selector.component.ts`.
 *
 * Bridges a plain infra-group-id `FormControl` to the
 * `SelectedGroup`-based dropdown, preselecting either the prefilled group or the
 * project's default registry group.
 */
@Component({
  selector: "mxevolve-business-process-infra-group-selector",
  templateUrl: "./infra-group-selector.component.html",
  imports: [GroupDropdownSelectionComponent, Select, ReactiveFormsModule],
  providers: [InfraGroupService],
})
export class InfraGroupSelectorComponent implements OnInit {
  private readonly groupService = inject(InfraGroupService);
  private readonly toastService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly infraGroupFormControl = input.required<FormControl>();
  readonly projectId = input.required<string>();
  readonly infraGroupFormControlName = input.required<string>();

  readonly selectedGroupFormControl = new FormControl<SelectedGroup | null>(
    null
  );
  protected readonly isLoading = signal(false);

  constructor() {
    this.selectedGroupFormControl.valueChanges
      .pipe(
        tap((value) => {
          this.infraGroupFormControl().setValue(value?.id);
          this.infraGroupFormControl().markAsDirty();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  ngOnInit(): void {
    this.isLoading.set(true);
    if (this.infraGroupFormControl().value) {
      this.createFormAdapterWithPreselectGroupId();
    } else {
      this.createFormAdapterWithDefaultProjectGroup();
    }
  }

  private createFormAdapterWithPreselectGroupId(): void {
    this.groupService
      .getGroup(this.projectId(), this.infraGroupFormControl().value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (group) => {
          this.setupSelectedGroupControl({
            id: group.id,
            name: group.name,
            projectId: this.projectId(),
          });
        },
        error: () => {
          this.setupSelectedGroupControl(null);
          this.toastService.showError(PREFILLED_INFRA_GROUP_UNAVAILABLE);
        },
      });
  }

  private createFormAdapterWithDefaultProjectGroup(): void {
    this.groupService
      .getProjectInfraRegistryConfig(this.projectId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (defaultGroup) => {
          this.setupSelectedGroupControl({
            id: defaultGroup.id,
            name: defaultGroup.name,
            projectId: this.projectId(),
          });
        },
        error: (error: unknown) => {
          this.setupSelectedGroupControl(null);
          this.toastService.showError(
            toErrorDetail(error, INFRA_GROUP_FETCH_FAILED)
          );
        },
      });
  }

  private setupSelectedGroupControl(selectGroup: SelectedGroup | null): void {
    this.selectedGroupFormControl.setValidators(
      this.infraGroupFormControl().validator
    );
    this.selectedGroupFormControl.setValue(selectGroup, { emitEvent: false });
    this.selectedGroupFormControl.updateValueAndValidity({
      emitEvent: false,
    });

    this.infraGroupFormControl().setValue(selectGroup?.id);

    this.isLoading.set(false);
  }
}
