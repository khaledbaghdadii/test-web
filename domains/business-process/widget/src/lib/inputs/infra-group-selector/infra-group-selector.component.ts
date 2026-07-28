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
        error: (error) => {
          this.setupSelectedGroupControl(null);
          this.toastService.showError(error);
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
        error: (error) => {
          this.setupSelectedGroupControl(null);
          this.toastService.showError(error);
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
