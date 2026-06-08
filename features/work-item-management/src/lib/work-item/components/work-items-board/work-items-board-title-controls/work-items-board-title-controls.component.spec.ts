import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import {
  Component,
  Output,
  EventEmitter,
  signal,
  WritableSignal,
} from "@angular/core";
import { DomTestUtils } from "@mxevolve/testing";
import { WorkItemBoardStateService } from "../services/state/work-item-board-state.service";
import {
  Project,
  ProjectViewMultiselectComponent,
} from "@mxflow/features/project";
import { WorkItemsBoardTitleControlsComponent } from "./work-items-board-title-controls.component";

@Component({
  selector: "mxevolve-project-view-multiselect",
  template:
    '<div data-testid="project-view-multiselect">Mock Project View Multiselect</div>',
  standalone: true,
})
class MockProjectViewMultiselectComponent {
  @Output() selectedProjectsChange = new EventEmitter<Project[]>();
}

describe("WorkItemsBoardTitleControlsComponent", () => {
  let component: WorkItemsBoardTitleControlsComponent;
  let fixture: ComponentFixture<WorkItemsBoardTitleControlsComponent>;
  let mockStateService: {
    setSelectedProjects: jest.Mock;
    setSearchKey: jest.Mock;
    setShowMyTasksOnly: jest.Mock;
    fullBoardRefresh: jest.Mock;
    filters: {
      searchKey: ReturnType<typeof signal>;
      showMyTasksOnly: ReturnType<typeof signal>;
      selectedProjects: ReturnType<typeof signal>;
    };
    isInitialLoading: ReturnType<typeof signal>;
    isProjectSpecific: ReturnType<typeof signal>;
  };

  const mockProjects: Project[] = [
    { id: "1", name: "Project 1", description: "Description 1" },
    { id: "2", name: "Project 2", description: "Description 2" },
  ];

  beforeEach(async () => {
    mockStateService = {
      setSelectedProjects: jest.fn(),
      setSearchKey: jest.fn(),
      setShowMyTasksOnly: jest.fn(),
      fullBoardRefresh: jest.fn(),
      filters: {
        searchKey: signal("") as ReturnType<typeof signal>,
        showMyTasksOnly: signal(false) as ReturnType<typeof signal>,
        selectedProjects: signal<Project[]>([]) as ReturnType<typeof signal>,
      },
      isInitialLoading: signal(false),
      isProjectSpecific: signal(false),
    };

    await TestBed.configureTestingModule({
      imports: [WorkItemsBoardTitleControlsComponent],
      providers: [
        { provide: WorkItemBoardStateService, useValue: mockStateService },
      ],
    })
      .overrideComponent(WorkItemsBoardTitleControlsComponent, {
        remove: {
          imports: [ProjectViewMultiselectComponent],
        },
        add: {
          imports: [MockProjectViewMultiselectComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WorkItemsBoardTitleControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should delegate project selection changes to state service", () => {
    component.onProjectsChange(mockProjects);
    expect(mockStateService.setSelectedProjects).toHaveBeenCalledWith(
      mockProjects.map((p) => p.id)
    );
  });

  it("should update search when user types in search input", () => {
    const searchInput = fixture.debugElement.query(
      By.css('[data-testid="searchBox"]')
    );
    const searchValue = "test search";

    searchInput.triggerEventHandler("ngModelChange", searchValue);

    expect(mockStateService.setSearchKey).toHaveBeenCalledWith(searchValue);
  });

  it("should clear search when clear icon is clicked", () => {
    mockStateService.filters.searchKey.set("test search");
    fixture.detectChanges();

    const clearIcon = fixture.debugElement.query(
      By.css('[data-testid="clearSearch"]')
    );
    expect(clearIcon).toBeTruthy();

    clearIcon.triggerEventHandler("click", null);

    expect(mockStateService.setSearchKey).toHaveBeenCalledWith("");
  });

  it("should toggle my tasks filter when toggle switch is changed", () => {
    const toggleSwitch = fixture.debugElement.query(
      By.css('[data-testid="my-tasks-toggle"]')
    );

    toggleSwitch.triggerEventHandler("onChange", null);

    expect(mockStateService.setShowMyTasksOnly).toHaveBeenCalledWith(true);
  });

  it("should refresh board when refresh button is clicked", () => {
    const refreshButton = fixture.debugElement.query(
      By.css('[data-testid="refresh-board-btn"]')
    );

    refreshButton.triggerEventHandler("click", null);

    expect(mockStateService.fullBoardRefresh).toHaveBeenCalled();
  });

  describe("filter highlight", () => {
    const HIGHLIGHT_CLASS = "filter-active";

    it("should not highlight search wrapper when search is empty", () => {
      const el = DomTestUtils.getElementByTestId(
        fixture,
        "filter-wrapper-search"
      ).getNativeElement();
      expect(el.classList).not.toContain(HIGHLIGHT_CLASS);
    });

    it("should highlight search wrapper when search has value", () => {
      (mockStateService.filters.searchKey as WritableSignal<string>).set(
        "test"
      );
      fixture.detectChanges();

      const el = DomTestUtils.getElementByTestId(
        fixture,
        "filter-wrapper-search"
      ).getNativeElement();
      expect(el.classList).toContain(HIGHLIGHT_CLASS);
    });

    it("should remove search highlight when search is cleared", () => {
      (mockStateService.filters.searchKey as WritableSignal<string>).set(
        "test"
      );
      fixture.detectChanges();

      (mockStateService.filters.searchKey as WritableSignal<string>).set("");
      fixture.detectChanges();

      const el = DomTestUtils.getElementByTestId(
        fixture,
        "filter-wrapper-search"
      ).getNativeElement();
      expect(el.classList).not.toContain(HIGHLIGHT_CLASS);
    });

    it("should not highlight projects wrapper when no projects selected", () => {
      const el = DomTestUtils.getElementByTestId(
        fixture,
        "filter-wrapper-projects"
      ).getNativeElement();
      expect(el.classList).not.toContain(HIGHLIGHT_CLASS);
    });

    it("should highlight projects wrapper when projects are selected", () => {
      (
        mockStateService.filters.selectedProjects as WritableSignal<string[]>
      ).set(["proj-1"]);
      fixture.detectChanges();

      const el = DomTestUtils.getElementByTestId(
        fixture,
        "filter-wrapper-projects"
      ).getNativeElement();
      expect(el.classList).toContain(HIGHLIGHT_CLASS);
    });
  });
});
