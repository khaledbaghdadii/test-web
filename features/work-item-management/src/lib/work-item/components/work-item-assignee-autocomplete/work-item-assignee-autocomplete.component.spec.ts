import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { WorkItemAssigneeAutocompleteComponent } from "./work-item-assignee-autocomplete.component";
import { WorkItemAssigneeAutocompleteStateService } from "./state-service/work-item-assignee-autocomplete-state.service";
import { NotificationService } from "@mxflow/ui/alert";
import { WorkItem } from "../../model/work-item";
import { WorkItemAssignableUser } from "../../services/work-item-api/response/work-item-assignable-users-api-response.model";
import { AutoCompleteCompleteEvent } from "primeng/autocomplete";
import { LazyLoadEvent } from "primeng/api";
import { APP_CONFIG } from "@mxflow/config";

describe("WorkItemAssigneeAutocompleteComponent", () => {
  let component: WorkItemAssigneeAutocompleteComponent;
  let fixture: ComponentFixture<WorkItemAssigneeAutocompleteComponent>;
  let mockStateService: jest.Mocked<WorkItemAssigneeAutocompleteStateService>;
  let isLoadingSignal: ReturnType<typeof signal<boolean>>;
  let isLastPageSignal: ReturnType<typeof signal<boolean>>;
  let assigneeSuggestionsSignal: ReturnType<
    typeof signal<WorkItemAssignableUser[]>
  >;

  const PROJECT_ID = "project-1";
  const WORK_ITEM_ID = "work-item-1";
  const WORK_ITEM_NAME = "Test Work Item";
  const USER_1_EMAIL = "user1@example.com";
  const USER_2_EMAIL = "user2@example.com";
  const EXISTING_EMAIL = "existing@example.com";
  const PREVIOUS_EMAIL = "previous@example.com";
  const SEARCH_QUERY = "john";
  const SEARCH_QUERY_WITH_SPACES = "  john  ";
  const MIN_LENGTH_QUERY = "ab";
  const SHORT_QUERY = "a";
  const EMPTY_STRING = "";
  const MIN_SEARCH_LENGTH = 2;
  const ITEMS_STEP = 25;
  const LAZY_LOAD_FIRST = 0;
  const LAZY_LOAD_LAST = 25;
  const GATEWAY_URL = "http://localhost:8080";

  const MOCK_USER_1: WorkItemAssignableUser = {
    id: "user1-id",
    displayName: "User 1",
    mail: USER_1_EMAIL,
  };
  const MOCK_USER_2: WorkItemAssignableUser = {
    id: "user2-id",
    displayName: "User 2",
    mail: USER_2_EMAIL,
  };
  const MOCK_USERS: WorkItemAssignableUser[] = [MOCK_USER_1, MOCK_USER_2];

  const MOCK_WORK_ITEM: WorkItem = {
    id: WORK_ITEM_ID,
    projectId: PROJECT_ID,
    name: WORK_ITEM_NAME,
    requireAssignee: true,
  } as WorkItem;

  beforeEach(async () => {
    isLoadingSignal = signal(false);
    isLastPageSignal = signal(false);
    assigneeSuggestionsSignal = signal<WorkItemAssignableUser[]>([]);

    const stateServiceSpy = {
      initialize: jest.fn(),
      search: jest.fn(),
      handleLazyLoad: jest.fn(),
      isLoading: isLoadingSignal,
      isLastPage: isLastPageSignal,
      assigneeSuggestions: assigneeSuggestionsSignal,
      minSearchLength: MIN_SEARCH_LENGTH,
      itemsStep: ITEMS_STEP,
    } as unknown as jest.Mocked<WorkItemAssigneeAutocompleteStateService>;

    const notificationServiceSpy = {
      showError: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    await TestBed.configureTestingModule({
      imports: [WorkItemAssigneeAutocompleteComponent],
      providers: [
        provideHttpClient(),
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    })
      .overrideComponent(WorkItemAssigneeAutocompleteComponent, {
        set: {
          providers: [
            {
              provide: WorkItemAssigneeAutocompleteStateService,
              useValue: stateServiceSpy,
            },
            { provide: NotificationService, useValue: notificationServiceSpy },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WorkItemAssigneeAutocompleteComponent);
    component = fixture.componentInstance;
    mockStateService = fixture.debugElement.injector.get(
      WorkItemAssigneeAutocompleteStateService
    ) as jest.Mocked<WorkItemAssigneeAutocompleteStateService>;

    fixture.componentRef.setInput("workItem", MOCK_WORK_ITEM);
  });

  it("should create the component when instantiated", () => {
    expect(component).toBeTruthy();
  });

  describe("initialization", () => {
    it("should initialize state service when work item has project id and work item id", () => {
      fixture.detectChanges();

      expect(mockStateService.initialize).toHaveBeenCalledWith(
        PROJECT_ID,
        WORK_ITEM_ID
      );
    });

    it("should not initialize state service when project id is missing", () => {
      const incompleteWorkItem = {
        ...MOCK_WORK_ITEM,
        projectId: undefined,
      } as unknown as WorkItem;
      fixture.componentRef.setInput("workItem", incompleteWorkItem);

      fixture.detectChanges();

      expect(mockStateService.initialize).not.toHaveBeenCalled();
    });

    it("should clear assignee and selected user", () => {
      const optionalWorkItem: WorkItem = {
        ...MOCK_WORK_ITEM,
        requireAssignee: false,
      };
      fixture.componentRef.setInput("workItem", optionalWorkItem);
      component.assignee.set(EXISTING_EMAIL);

      fixture.detectChanges();

      expect(component.assignee()).toBeUndefined();
      expect(component.selectedUser()).toBeNull();
    });
  });

  describe("suggestions sync", () => {
    it("should update suggestions when state service suggestions change", () => {
      assigneeSuggestionsSignal.set(MOCK_USERS);

      fixture.detectChanges();

      expect(component.suggestions()).toEqual(MOCK_USERS);
    });
  });

  describe("onSearch", () => {
    it("should call state service search with trimmed query when query has whitespace", () => {
      const event: AutoCompleteCompleteEvent = {
        query: SEARCH_QUERY_WITH_SPACES,
      } as AutoCompleteCompleteEvent;

      component.onSearch(event);

      expect(mockStateService.search).toHaveBeenCalledWith(SEARCH_QUERY);
    });

    it("should call state service search when query meets minimum length", () => {
      const event: AutoCompleteCompleteEvent = {
        query: MIN_LENGTH_QUERY,
      } as AutoCompleteCompleteEvent;

      component.onSearch(event);

      expect(mockStateService.search).toHaveBeenCalledWith(MIN_LENGTH_QUERY);
    });

    it("should not call state service search when query is below minimum length", () => {
      const event: AutoCompleteCompleteEvent = {
        query: SHORT_QUERY,
      } as AutoCompleteCompleteEvent;

      component.onSearch(event);

      expect(mockStateService.search).not.toHaveBeenCalled();
      expect(component.suggestions()).toEqual([]);
    });

    it("should not call state service search when query is null", () => {
      const event = { query: null } as unknown as AutoCompleteCompleteEvent;

      component.onSearch(event);

      expect(mockStateService.search).not.toHaveBeenCalled();
    });
  });

  describe("onSelect", () => {
    it("should set assignee and selected user when user with valid email is selected", () => {
      const event = { value: MOCK_USER_1 };

      component.onSelect(event);

      expect(component.assignee()).toBe(USER_1_EMAIL);
      expect(component.selectedUser()).toEqual(MOCK_USER_1);
    });

    it("should not update assignee when selected user has empty email", () => {
      component.assignee.set(PREVIOUS_EMAIL);
      const event = {
        value: {
          id: "empty-user-id",
          displayName: "Empty User",
          mail: EMPTY_STRING,
        },
      };

      component.onSelect(event);

      expect(component.assignee()).toBe(PREVIOUS_EMAIL);
    });

    it("should not update assignee when selected value is null", () => {
      component.assignee.set(PREVIOUS_EMAIL);
      const event = { value: null } as unknown as {
        value: WorkItemAssignableUser;
      };

      component.onSelect(event);

      expect(component.assignee()).toBe(PREVIOUS_EMAIL);
    });
  });

  describe("handleLazyLoad", () => {
    it("should delegate lazy load event to state service when triggered", () => {
      const event: LazyLoadEvent = {
        first: LAZY_LOAD_FIRST,
        last: LAZY_LOAD_LAST,
      };

      component.handleLazyLoad(event);

      expect(mockStateService.handleLazyLoad).toHaveBeenCalledWith(event);
    });
  });

  describe("state integration", () => {
    it("should reflect loading state when state service loading state changes", () => {
      isLoadingSignal.set(true);

      fixture.detectChanges();

      expect(component.isLoading()).toBe(true);
    });

    it("should reflect last page state when state service last page state changes", () => {
      isLastPageSignal.set(true);

      fixture.detectChanges();

      expect(component.isLastPage()).toBe(true);
    });

    it("should expose min search length from state service", () => {
      expect(component.minSearchLength).toBe(MIN_SEARCH_LENGTH);
    });

    it("should expose items step from state service", () => {
      expect(component.itemsStep).toBe(ITEMS_STEP);
    });
  });
});
