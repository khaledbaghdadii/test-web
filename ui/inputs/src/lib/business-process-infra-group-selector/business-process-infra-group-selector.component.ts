import { Component, inject, Input, OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import {
  GroupDropdownSelectionComponent,
  InfraGroupsService,
  SelectedGroup,
} from "@mxflow/features/infra-management";
import { tap } from "rxjs";
import { Select } from "primeng/select";
import { ToastMessageService } from "@mxflow/ui/alert";

@Component({
  selector: "mxevolve-business-process-infra-group-selector",
  templateUrl: "business-process-infra-group-selector.component.html",
  imports: [GroupDropdownSelectionComponent, Select, ReactiveFormsModule],
  providers: [InfraGroupsService],
})
export class BusinessProcessInfraGroupSelectorComponent implements OnInit {
  groupService = inject(InfraGroupsService);
  toastService = inject(ToastMessageService);

  @Input({ required: true }) infraGroupFormControl: FormControl;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) infraGroupFormControlName: string;

  selectedGroupFormControl = new FormControl<SelectedGroup | null>(null);
  isLoading = false;

  ngOnInit(): void {
    this.isLoading = true;
    if (this.infraGroupFormControl.value) {
      this.createFormAdapterWithPreselectGroupId();
    } else {
      this.createFormAdapterWithDefaultProjectGroup();
    }
  }

  private createFormAdapterWithPreselectGroupId() {
    this.groupService
      .getGroup(this.projectId, this.infraGroupFormControl.value)
      .subscribe({
        next: (group) => {
          this.setupSelectedGroupControl({
            id: group.id,
            name: group.name,
            projectId: this.projectId,
          });
        },
        error: (error) => {
          this.setupSelectedGroupControl(null);
          this.toastService.showError(error);
        },
      });
  }

  private createFormAdapterWithDefaultProjectGroup() {
    this.groupService.getProjectInfraRegistryConfig(this.projectId).subscribe({
      next: (defaultGroup) => {
        this.setupSelectedGroupControl({
          id: defaultGroup.id,
          name: defaultGroup.name,
          projectId: this.projectId,
        });
      },
      error: (error) => {
        this.setupSelectedGroupControl(null);
        this.toastService.showError(error);
      },
    });
  }

  private setupSelectedGroupControl(selectGroup: SelectedGroup | null) {
    this.selectedGroupFormControl = new FormControl<SelectedGroup | null>(
      selectGroup,
      this.infraGroupFormControl.validator
    );

    this.infraGroupFormControl.setValue(selectGroup?.id);

    this.selectedGroupFormControl.valueChanges
      .pipe(
        tap((value) => {
          this.infraGroupFormControl.setValue(value?.id);
          this.infraGroupFormControl.markAsDirty();
        })
      )
      .subscribe();

    this.isLoading = false;
  }
}
