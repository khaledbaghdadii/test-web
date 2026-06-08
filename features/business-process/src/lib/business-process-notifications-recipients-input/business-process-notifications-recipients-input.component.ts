import { Component, inject, Input, OnInit } from "@angular/core";
import { ProjectUsersMultiselectComponent } from "../../../../user-management/src/lib/project-users-multiselect/project-users-multiselect.component";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ProjectUsersFetcherService } from "../../../../user-management/src/lib/project-users-fetcher-service/project-users-fetcher.service";
import { ToastMessageService } from "@mxflow/ui/alert";

@Component({
  selector: "mxevolve-notifications-recipients-input",
  templateUrl:
    "./business-process-notifications-recipients-input.component.html",
  imports: [ProjectUsersMultiselectComponent, ReactiveFormsModule],
})
export class BusinessProcessNotificationsRecipientsInputComponent
  implements OnInit
{
  private readonly userFetcherByMailService = inject(
    ProjectUsersFetcherService
  );
  private readonly toastService = inject(ToastMessageService);

  @Input({ required: true })
  projectId: string;
  @Input({ required: true })
  formControl: FormControl;
  multiSelectFormControl: FormControl;

  errorMessage: string;

  ngOnInit(): void {
    this.multiSelectFormControl = new FormControl([]);
    this.multiSelectFormControl.valueChanges.subscribe(
      (selectedUsers: { mail: string }[]) => {
        const emails = selectedUsers.map((user) => user.mail);
        this.formControl.setValue(emails);
      }
    );
    if (this.formControl.value?.length > 0) {
      this.userFetcherByMailService
        .fetchUsersByEmails(this.projectId, this.formControl.value)
        .subscribe({
          next: (users) => {
            this.multiSelectFormControl.setValue(users.content);
          },
          error: (error) => {
            this.toastService.showError(error.message);
          },
        });
    }
  }
}
