import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LazyLoadEvent } from "primeng/api";
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
} from "primeng/autocomplete";
import { WorkItem } from "../../model/work-item";
import { WorkItemAssignableUser } from "../../services/work-item-api/response/work-item-assignable-users-api-response.model";
import { WorkItemAssigneeAutocompleteStateService } from "./state-service/work-item-assignee-autocomplete-state.service";
import { NotificationService } from "@mxflow/ui/alert";

@Component({
  selector: "mxevolve-work-item-assignee-autocomplete",
  templateUrl: "./work-item-assignee-autocomplete.component.html",
  imports: [AutoCompleteModule, FormsModule],
  providers: [WorkItemAssigneeAutocompleteStateService, NotificationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class WorkItemAssigneeAutocompleteComponent {
  private readonly stateService = inject(
    WorkItemAssigneeAutocompleteStateService
  );

  readonly workItem = input.required<WorkItem>();
  readonly assignee = model<string | undefined>();

  readonly suggestions = signal<WorkItemAssignableUser[]>([]);
  readonly selectedUser = signal<WorkItemAssignableUser | null>(null);
  readonly isLoading = this.stateService.isLoading;
  readonly isLastPage = this.stateService.isLastPage;
  readonly minSearchLength = this.stateService.minSearchLength;
  readonly itemsStep = this.stateService.itemsStep;

  constructor() {
    this.setupWorkItemInputEffect();
    this.setupSuggestionsSync();
  }

  readonly handleLazyLoad = (event: LazyLoadEvent): void => {
    this.stateService.handleLazyLoad(event);
  };

  onSearch(event: AutoCompleteCompleteEvent): void {
    const query = event.query?.trim() ?? "";
    if (query.length < this.minSearchLength) {
      this.suggestions.set([]);
      return;
    }
    this.stateService.search(query);
  }

  onSelect(event: { value: WorkItemAssignableUser }): void {
    const selectedUser = event.value;
    if (selectedUser?.mail) {
      this.assignee.set(selectedUser.mail);
      this.selectedUser.set(selectedUser);
    }
  }

  private setupWorkItemInputEffect(): void {
    effect(() => {
      const workItem = this.workItem();
      if (workItem?.projectId && workItem?.id) {
        this.stateService.initialize(workItem.projectId, workItem.id);
        this.assignee.set(undefined);
        this.selectedUser.set(null);
      }
    });
  }

  private setupSuggestionsSync(): void {
    effect(() => {
      const currentSuggestions = this.stateService.assigneeSuggestions();
      this.suggestions.set([...currentSuggestions]);
    });
  }
}
