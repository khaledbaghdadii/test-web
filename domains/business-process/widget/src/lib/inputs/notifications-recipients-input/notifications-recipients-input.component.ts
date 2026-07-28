import { Component, DestroyRef, inject, input, OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { User } from "@mxevolve/domains/business-process/data-access";
import { UserService } from "@mxevolve/domains/user/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { ProjectUsersMultiselectComponent } from "../project-users-multiselect/project-users-multiselect.component";

/**
 * New-architecture migration (copied verbatim, adapted to the migrated new-arch
 * data-access and shared/ui toast service) of the legacy
 * `web/libs/features/business-process/src/lib/business-process-notifications-recipients-input/business-process-notifications-recipients-input.component.ts`.
 *
 * Bridges the recipient-emails `FormControl` to the user-object multiselect and
 * resolves prefilled emails back to user objects on init.
 *
 * Exposes `notificationsRecipientsFormControl` as a plain input (like
 * `infraGroupFormControl` / `reviewersFormControl` on sibling widgets) rather
 * than a `[formControl]` binding, so consumers never need a `ControlValueAccessor`
 * shim — this widget is not one.
 */
@Component({
  selector: "mxevolve-notifications-recipients-input",
  templateUrl: "./notifications-recipients-input.component.html",
  imports: [ProjectUsersMultiselectComponent, ReactiveFormsModule],
  providers: [UserService],
})
export class NotificationsRecipientsInputComponent implements OnInit {
  private readonly userFetcherByMailService = inject(UserService);
  private readonly toastService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly projectId = input.required<string>();
  readonly notificationsRecipientsFormControl = input.required<FormControl>();
  readonly inputId = input<string>();

  readonly multiSelectFormControl = new FormControl<User[]>([], {
    nonNullable: true,
  });

  constructor() {
    this.multiSelectFormControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedUsers: { mail: string }[]) => {
        const emails = selectedUsers.map((user) => user.mail);
        this.notificationsRecipientsFormControl().setValue(emails);
      });
  }

  ngOnInit(): void {
    const currentEmails = this.notificationsRecipientsFormControl().value;
    if (currentEmails?.length > 0) {
      this.userFetcherByMailService
        .fetchUsersByEmails(this.projectId(), currentEmails)
        .pipe(takeUntilDestroyed(this.destroyRef))
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
