import { Component, inject, Input, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { ConfirmationService } from "primeng/api";
import { AddUserStoryModalComponent } from "../add-user-story-modal/add-user-story-modal.component";
import { TableModule } from "primeng/table";
import { ConfirmPopup } from "primeng/confirmpopup";
import { Button } from "primeng/button";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";

@Component({
  selector: "mxflow-user-story-input",
  templateUrl: "./user-story-input.component.html",
  imports: [
    AddUserStoryModalComponent,
    TableModule,
    ConfirmPopup,
    Button,
    TableEmptyMessageComponent,
  ],
})
export class UserStoryInputComponent implements OnInit {
  @Input() formControl: FormControl;
  @Input() requiredInput: boolean;
  @Input() shouldValidate: boolean = false;
  @Input() projectId: string;

  userStoryIds: string[] = [];

  private readonly promptUserForConfirmation: ConfirmationService =
    inject(ConfirmationService);

  ngOnInit(): void {
    this.userStoryIds = this.formControl.value ?? [];
  }

  addUserStory(userStory: string): void {
    this.userStoryIds = [...this.userStoryIds, userStory];
    this.formControl.setValue(this.userStoryIds);
  }

  removeUserStory(userStoryToRemove: string): void {
    this.userStoryIds = this.userStoryIds.filter((userStory) => {
      return userStoryToRemove !== userStory;
    });

    this.formControl.setValue(
      this.userStoryIds.length === 0 ? null : this.userStoryIds
    );
  }

  confirmDelete(event: Event, userStory: string) {
    this.promptUserForConfirmation.confirm({
      target: event.target ?? undefined,
      defaultFocus: undefined,
      message: "Sure to remove?",
      icon: "pi pi-exclamation-circle",
      accept: () => this.removeUserStory(userStory),
      acceptLabel: "Ok",
      acceptButtonStyleClass: "text-white",
      reject: () => {},
      rejectLabel: "Cancel",
    });
  }
}
