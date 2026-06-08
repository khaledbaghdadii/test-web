import { TestBed } from "@angular/core/testing";
import { LazyLoadEvent } from "primeng/api";
import { of, Subject, throwError } from "rxjs";

import { NotificationService } from "@mxflow/ui/alert";
import {
  WorkItemAssignableUser,
  WorkItemAssignableUsersApiResponse,
} from "../../../services/work-item-api/response/work-item-assignable-users-api-response.model";
import { WorkItemService } from "../../../services/work-item-api/work-item.service";
import { WorkItemAssigneeAutocompleteStateService } from "./work-item-assignee-autocomplete-state.service";

const PROJECT_ID = "project-id";
const WORK_ITEM_ID = "work-item-id";
const SEARCH_QUERY = "doe";
const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 25;
const INITIAL_PAGE = 0;
const LAZY_LOAD_STEP = 25;
const MIN_SEARCH_LENGTH = 2;
const ERROR_MESSAGE = "Failed to load assignable users";

interface WorkItemServiceMock {
  getWorkItemAssignableUsers: jest.Mock<
    ReturnType<WorkItemService["getWorkItemAssignableUsers"]>,
    [string, string, number | undefined, number | undefined, string | undefined]
  >;
}

interface NotificationServiceMock {
  showError: jest.Mock<void, [string]>;
}

describe("WorkItemAssigneeAutocompleteStateService", () => {
  let service: WorkItemAssigneeAutocompleteStateService;
  let workItemService: WorkItemServiceMock;
  let notificationService: NotificationServiceMock;

  const createAssignee = (mail: string): WorkItemAssignableUser => ({
    id: `id-${mail}`,
    displayName: mail.split("@")[0],
    mail,
  });

  const createPageResponse = (
    content: WorkItemAssignableUser[],
    last: boolean
  ): WorkItemAssignableUsersApiResponse => ({
    content,
    last,
  });

  const flushAsyncTasks = async (): Promise<void> => {
    for (let index = 0; index < 5; index += 1) {
      await Promise.resolve();
    }
  };

  const advanceSearchDebounce = async (): Promise<void> => {
    jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    await flushAsyncTasks();
  };

  beforeEach(() => {
    jest.useFakeTimers();

    workItemService = {
      getWorkItemAssignableUsers: jest.fn(),
    };

    notificationService = {
      showError: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        WorkItemAssigneeAutocompleteStateService,
        { provide: WorkItemService, useValue: workItemService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });

    service = TestBed.runInInjectionContext(() =>
      TestBed.inject(WorkItemAssigneeAutocompleteStateService)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
    TestBed.resetTestingModule();
  });

  it("should fetch suggestions when search query meets minimum length", async () => {
    const firstPageAssignees = [
      createAssignee("first@example.com"),
      createAssignee("second@example.com"),
    ];
    const firstPage = createPageResponse(firstPageAssignees, false);
    workItemService.getWorkItemAssignableUsers.mockReturnValue(of(firstPage));
    service.initialize(PROJECT_ID, WORK_ITEM_ID);

    service.search(SEARCH_QUERY);
    await advanceSearchDebounce();

    expect(workItemService.getWorkItemAssignableUsers).toHaveBeenCalledWith(
      PROJECT_ID,
      WORK_ITEM_ID,
      INITIAL_PAGE,
      PAGE_SIZE,
      SEARCH_QUERY
    );
    expect(service.assigneeSuggestions()).toEqual(firstPage.content);
    expect(service.isLastPage()).toBe(firstPage.last);
    expect(service.isLoading()).toBe(false);
  });

  it("should not trigger search when query shorter than minimum length", async () => {
    workItemService.getWorkItemAssignableUsers.mockReturnValue(
      of(createPageResponse([], true))
    );
    service.initialize(PROJECT_ID, WORK_ITEM_ID);

    service.search("a");
    await advanceSearchDebounce();

    expect(workItemService.getWorkItemAssignableUsers).not.toHaveBeenCalled();
    expect(service.assigneeSuggestions()).toEqual([]);
  });

  it("should initialize with empty suggestions when no search performed", () => {
    service.initialize(PROJECT_ID, WORK_ITEM_ID);

    expect(service.assigneeSuggestions()).toEqual([]);
    expect(service.isLoading()).toBe(false);
  });

  it("should reset suggestions when initialized with new project and work item", async () => {
    const firstAssignees = [createAssignee("first@example.com")];
    const firstPage = createPageResponse(firstAssignees, true);
    workItemService.getWorkItemAssignableUsers.mockReturnValue(of(firstPage));
    service.initialize(PROJECT_ID, WORK_ITEM_ID);
    service.search(SEARCH_QUERY);
    await advanceSearchDebounce();

    service.initialize("new-project", "new-work-item");

    expect(service.assigneeSuggestions()).toEqual([]);
  });

  it("should not trigger handleLazyLoad when suggestions list empty", () => {
    const lazyLoadEvent: LazyLoadEvent = { last: 10 };
    service.initialize(PROJECT_ID, WORK_ITEM_ID);

    service.handleLazyLoad(lazyLoadEvent);

    expect(workItemService.getWorkItemAssignableUsers).not.toHaveBeenCalled();
  });

  it("should not trigger handleLazyLoad when already loading", async () => {
    const firstPageAssignees = [createAssignee("user@example.com")];
    const firstPage = createPageResponse(firstPageAssignees, false);
    const pendingSubject = new Subject<WorkItemAssignableUsersApiResponse>();
    const lazyLoadEvent: LazyLoadEvent = { last: 0 };
    let callCount = 0;
    workItemService.getWorkItemAssignableUsers.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return pendingSubject.asObservable();
      return of(firstPage);
    });
    service.initialize(PROJECT_ID, WORK_ITEM_ID);
    service.search(SEARCH_QUERY);
    await advanceSearchDebounce();

    service.handleLazyLoad(lazyLoadEvent);

    expect(service.isLoading()).toBe(true);
    expect(workItemService.getWorkItemAssignableUsers).toHaveBeenCalledTimes(1);

    pendingSubject.next(firstPage);
    pendingSubject.complete();
    await flushAsyncTasks();
  });

  it("should not trigger handleLazyLoad when last page reached", async () => {
    const singlePageAssignees = [createAssignee("only@example.com")];
    const lastPage = createPageResponse(singlePageAssignees, true);
    const lazyLoadEvent: LazyLoadEvent = { last: 0 };
    workItemService.getWorkItemAssignableUsers.mockReturnValue(of(lastPage));
    service.initialize(PROJECT_ID, WORK_ITEM_ID);
    service.search(SEARCH_QUERY);
    await advanceSearchDebounce();

    service.handleLazyLoad(lazyLoadEvent);

    expect(workItemService.getWorkItemAssignableUsers).toHaveBeenCalledTimes(1);
    expect(service.assigneeSuggestions()).toEqual(singlePageAssignees);
    expect(service.isLastPage()).toBe(true);
  });

  it("should debounce search requests when search method called multiple times", async () => {
    const assignees = [createAssignee("user@example.com")];
    const page = createPageResponse(assignees, true);
    workItemService.getWorkItemAssignableUsers.mockReturnValue(of(page));
    service.initialize(PROJECT_ID, WORK_ITEM_ID);

    service.search("d");
    service.search("do");
    service.search(SEARCH_QUERY);
    await advanceSearchDebounce();

    expect(workItemService.getWorkItemAssignableUsers).toHaveBeenCalledTimes(1);
    expect(workItemService.getWorkItemAssignableUsers).toHaveBeenCalledWith(
      PROJECT_ID,
      WORK_ITEM_ID,
      INITIAL_PAGE,
      PAGE_SIZE,
      SEARCH_QUERY
    );
    expect(service.assigneeSuggestions()).toEqual(assignees);
  });

  it("should show error notification when fetch fails", async () => {
    workItemService.getWorkItemAssignableUsers.mockReturnValue(
      throwError(() => new Error("network error"))
    );
    service.initialize(PROJECT_ID, WORK_ITEM_ID);

    service.search(SEARCH_QUERY);
    await advanceSearchDebounce();

    expect(notificationService.showError).toHaveBeenCalledWith(ERROR_MESSAGE);
    expect(service.assigneeSuggestions()).toEqual([]);
    expect(service.isLoading()).toBe(false);
  });

  it("should expose configuration values", () => {
    service.initialize(PROJECT_ID, WORK_ITEM_ID);

    expect(service.minSearchLength).toBe(MIN_SEARCH_LENGTH);
    expect(service.itemsStep).toBe(LAZY_LOAD_STEP);
  });

  it("should set isLoading to true when search initiated", async () => {
    const assignees = [createAssignee("user@example.com")];
    const page = createPageResponse(assignees, true);
    const pendingSubject = new Subject<WorkItemAssignableUsersApiResponse>();
    workItemService.getWorkItemAssignableUsers.mockReturnValue(
      pendingSubject.asObservable()
    );
    service.initialize(PROJECT_ID, WORK_ITEM_ID);

    service.search(SEARCH_QUERY);
    jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    await flushAsyncTasks();

    expect(service.isLoading()).toBe(true);

    pendingSubject.next(page);
    pendingSubject.complete();
    await flushAsyncTasks();
    expect(service.isLoading()).toBe(false);
  });

  it("should not trigger handleLazyLoad when not within threshold", async () => {
    const manyAssignees = Array.from({ length: LAZY_LOAD_STEP }, (_, index) =>
      createAssignee(`user${index}@example.com`)
    );
    const page = createPageResponse(manyAssignees, false);
    const lazyLoadEvent: LazyLoadEvent = { last: 5 };
    workItemService.getWorkItemAssignableUsers.mockReturnValue(of(page));
    service.initialize(PROJECT_ID, WORK_ITEM_ID);
    service.search(SEARCH_QUERY);
    await advanceSearchDebounce();

    service.handleLazyLoad(lazyLoadEvent);

    expect(workItemService.getWorkItemAssignableUsers).toHaveBeenCalledTimes(1);
  });

  it("should accept search query with exact minimum length", async () => {
    const assignees = [createAssignee("user@example.com")];
    const page = createPageResponse(assignees, true);
    const minLengthQuery = "ab";
    workItemService.getWorkItemAssignableUsers.mockReturnValue(of(page));
    service.initialize(PROJECT_ID, WORK_ITEM_ID);

    service.search(minLengthQuery);
    await advanceSearchDebounce();

    expect(workItemService.getWorkItemAssignableUsers).toHaveBeenCalledWith(
      PROJECT_ID,
      WORK_ITEM_ID,
      INITIAL_PAGE,
      PAGE_SIZE,
      minLengthQuery
    );
    expect(service.assigneeSuggestions()).toEqual(assignees);
  });

  it("should return empty page when API call fails", async () => {
    workItemService.getWorkItemAssignableUsers.mockReturnValue(
      throwError(() => new Error("network error"))
    );
    service.initialize(PROJECT_ID, WORK_ITEM_ID);

    service.search(SEARCH_QUERY);
    await advanceSearchDebounce();

    expect(service.isLastPage()).toBe(true);
    expect(service.assigneeSuggestions()).toEqual([]);
  });

  it("should not search when query empty string", async () => {
    workItemService.getWorkItemAssignableUsers.mockReturnValue(
      of(createPageResponse([], true))
    );
    service.initialize(PROJECT_ID, WORK_ITEM_ID);

    service.search("");
    await advanceSearchDebounce();

    expect(workItemService.getWorkItemAssignableUsers).not.toHaveBeenCalled();
  });

  it("should update isLastPage when receiving last page response", async () => {
    const assignees = [createAssignee("user@example.com")];
    const lastPage = createPageResponse(assignees, true);
    workItemService.getWorkItemAssignableUsers.mockReturnValue(of(lastPage));
    service.initialize(PROJECT_ID, WORK_ITEM_ID);

    service.search(SEARCH_QUERY);
    await advanceSearchDebounce();

    expect(service.isLastPage()).toBe(true);
  });

  it("should update isLastPage to false when receiving non-last page response", async () => {
    const assignees = [createAssignee("user@example.com")];
    const notLastPage = createPageResponse(assignees, false);
    workItemService.getWorkItemAssignableUsers.mockReturnValue(of(notLastPage));
    service.initialize(PROJECT_ID, WORK_ITEM_ID);

    service.search(SEARCH_QUERY);
    await advanceSearchDebounce();

    expect(service.isLastPage()).toBe(false);
  });

  it("should load next page when lazy load threshold reached during scroll", async () => {
    const firstPageAssignees = Array.from(
      { length: LAZY_LOAD_STEP },
      (_, index) => createAssignee(`user${index}@example.com`)
    );
    const secondPageAssignees = [
      createAssignee("next1@example.com"),
      createAssignee("next2@example.com"),
    ];
    const firstPage = createPageResponse(firstPageAssignees, false);
    const secondPage = createPageResponse(secondPageAssignees, true);
    let callCount = 0;
    workItemService.getWorkItemAssignableUsers.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return of(firstPage);
      if (callCount === 2) return of(secondPage);
      return of(createPageResponse([], true));
    });
    service.initialize(PROJECT_ID, WORK_ITEM_ID);
    service.search(SEARCH_QUERY);
    await advanceSearchDebounce();

    expect(service.assigneeSuggestions().length).toBe(LAZY_LOAD_STEP);
    expect(workItemService.getWorkItemAssignableUsers).toHaveBeenCalledTimes(1);

    const lazyLoadThreshold = Math.floor(LAZY_LOAD_STEP / 2);
    const lazyLoadEvent: LazyLoadEvent = {
      last: firstPageAssignees.length - lazyLoadThreshold,
    };

    service.handleLazyLoad(lazyLoadEvent);
    jest.advanceTimersByTime(0);
    await flushAsyncTasks();
    jest.advanceTimersByTime(0);
    await flushAsyncTasks();

    expect(workItemService.getWorkItemAssignableUsers).toHaveBeenCalledTimes(2);
    expect(workItemService.getWorkItemAssignableUsers).toHaveBeenNthCalledWith(
      2,
      PROJECT_ID,
      WORK_ITEM_ID,
      INITIAL_PAGE + 1,
      PAGE_SIZE,
      SEARCH_QUERY
    );
    expect(service.assigneeSuggestions()).toEqual([
      ...firstPageAssignees,
      ...secondPageAssignees,
    ]);
  });

  it("should reset suggestions when search query changes", async () => {
    const firstSearchAssignees = [createAssignee("john@example.com")];
    const secondSearchAssignees = [createAssignee("jane@example.com")];
    const firstPage = createPageResponse(firstSearchAssignees, true);
    const secondPage = createPageResponse(secondSearchAssignees, true);
    let callCount = 0;
    workItemService.getWorkItemAssignableUsers.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return of(firstPage);
      if (callCount === 2) return of(secondPage);
      return of(createPageResponse([], true));
    });
    service.initialize(PROJECT_ID, WORK_ITEM_ID);
    service.search("john");
    await advanceSearchDebounce();

    expect(service.assigneeSuggestions()).toEqual(firstSearchAssignees);

    service.search("jane");
    await advanceSearchDebounce();

    expect(service.assigneeSuggestions()).toEqual(secondSearchAssignees);
    expect(workItemService.getWorkItemAssignableUsers).toHaveBeenCalledTimes(2);
  });

  it("should append suggestions when loading next page without resetting", async () => {
    const firstPageAssignees = [createAssignee("first@example.com")];
    const secondPageAssignees = [createAssignee("second@example.com")];
    const firstPage = createPageResponse(firstPageAssignees, false);
    const secondPage = createPageResponse(secondPageAssignees, true);
    let callCount = 0;
    workItemService.getWorkItemAssignableUsers.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return of(firstPage);
      if (callCount === 2) return of(secondPage);
      return of(createPageResponse([], true));
    });
    service.initialize(PROJECT_ID, WORK_ITEM_ID);
    service.search(SEARCH_QUERY);
    await advanceSearchDebounce();

    expect(service.assigneeSuggestions()).toEqual(firstPageAssignees);

    const lazyLoadEvent: LazyLoadEvent = { last: 0 };
    service.handleLazyLoad(lazyLoadEvent);
    await flushAsyncTasks();

    expect(service.assigneeSuggestions()).toEqual([
      ...firstPageAssignees,
      ...secondPageAssignees,
    ]);
  });
});
