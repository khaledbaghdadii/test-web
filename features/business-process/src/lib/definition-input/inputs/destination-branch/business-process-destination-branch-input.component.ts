import { Component, inject, Input, OnInit } from "@angular/core";
import {
  DestinationBranchDropdownComponent,
  MergeConfiguration,
  MergeConfigurationService,
} from "@mxflow/features/scm-management";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { tap } from "rxjs";
import { Select } from "primeng/select";
import { ToastMessageService } from "@mxflow/ui/alert";

@Component({
  selector: "mxevolve-business-process-destination-branch-input",
  imports: [DestinationBranchDropdownComponent, Select, ReactiveFormsModule],
  providers: [MergeConfigurationService],
  templateUrl: "business-process-destination-branch-input.component.html",
})
export class BusinessProcessDestinationBranchInputComponent implements OnInit {
  protected mergeConfigurationService = inject(MergeConfigurationService);
  protected toastMessageService = inject(ToastMessageService);

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) repositoryId: string;
  @Input({ required: true })
  mergeConfigurationIdFormControl: FormControl<string>;

  formControlAdapter: FormControl<MergeConfiguration>;
  mergeConfigurationLoading = true;

  ngOnInit() {
    this.formControlAdapter = new FormControl();
    this.formControlAdapter.setValidators(Validators.required);

    if (this.mergeConfigurationIdFormControl.value) {
      this.mergeConfigurationService
        .getFilteredMergeConfigurations(
          this.projectId,
          {
            repositoryId: this.repositoryId,
            searchKey: this.mergeConfigurationIdFormControl.value,
          },
          1
        )
        .subscribe((mergeConfiguration) => {
          if (mergeConfiguration.content.length > 0) {
            this.formControlAdapter.setValue(mergeConfiguration.content[0]);
          } else {
            this.toastMessageService.showError(
              "The selected merge configuration could not be found, please select a new one."
            );
          }
        });
    }

    this.formControlAdapter.valueChanges
      .pipe(
        tap((value) => {
          this.mergeConfigurationIdFormControl.setValue(value?.id);
          this.mergeConfigurationIdFormControl.markAsDirty();
        })
      )
      .subscribe();
  }

  mergeConfigurationLoadingFinished() {
    this.mergeConfigurationLoading = false;
  }
}
