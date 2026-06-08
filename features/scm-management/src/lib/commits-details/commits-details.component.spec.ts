import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CommitsDetailsStateService } from "./state-service/commits-details-state-service";
import { signal } from "@angular/core";
import { CommitsDetailsComponent } from "./commits-details.component";
import { CommitDetailsPage } from "./model/commit-details-page";

const PROJECT_ID = "project1";
const DEVELOPMENT_ID = "dev1";
const BUSINESS_PROCESS_ID = "bp1";

const EMPTY_PAGE: CommitDetailsPage = {
  content: [],
  size: 0,
  page: 0,
  totalElements: 0,
  last: true,
};

const MOCK_COMMITS_PAGE = {
  content: [
    {
      id: "commit1",
      message: "Initial commit",
      committerDisplayName: "Author1",
      timeStamp: new Date().toISOString(),
      url: "example.com/commit1",
    },
    {
      id: "commit2",
      message: "Added new feature",
      committerDisplayName: "Author2",
      timeStamp: new Date().toISOString(),
      url: "example.com/commit2",
    },
  ],
  totalElements: 2,
  size: 2,
  page: 0,
  last: true,
};

describe("CommitsDetailsComponent", () => {
  let component: CommitsDetailsComponent;
  let fixture: ComponentFixture<CommitsDetailsComponent>;
  let mockCommitsStateService: jest.Mocked<CommitsDetailsStateService>;

  beforeEach(async () => {
    mockCommitsStateService = {
      commitsPage: signal(EMPTY_PAGE),
      fetchCommitsLoading: signal(false),
      errorMessage: signal(undefined),
      totalElements: signal(0),
      pageSize: signal(5),
      pageIndex: signal(0),
      setPageIndex: jest.fn(),
      setPageSize: jest.fn(),
      fetchCommits: jest.fn(),
    } as unknown as jest.Mocked<CommitsDetailsStateService>;

    await TestBed.configureTestingModule({
      imports: [CommitsDetailsComponent],
    })
      .overrideComponent(CommitsDetailsComponent, {
        set: {
          providers: [
            {
              provide: CommitsDetailsStateService,
              useValue: mockCommitsStateService,
            },
          ],
        },
      })
      .compileComponents();
    fixture = TestBed.createComponent(CommitsDetailsComponent);
    component = fixture.componentInstance;
  });

  describe("test on init", () => {
    it("should fetch commits on init", () => {
      component.projectId = PROJECT_ID;
      component.developmentId = DEVELOPMENT_ID;
      component.businessProcessId = BUSINESS_PROCESS_ID;

      fixture.detectChanges();

      expect(mockCommitsStateService.fetchCommits).toHaveBeenCalledWith(
        PROJECT_ID,
        DEVELOPMENT_ID,
        BUSINESS_PROCESS_ID
      );
    });
  });

  describe("on destroy", () => {
    it("should complete componentDestroy$ on destroy", () => {
      const destroySpy = jest.spyOn(component["componentDestroy$"], "complete");

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe("commitsData signal", () => {
    it("should return commits content when commitsPage is defined", () => {
      mockCommitsStateService.commitsPage.set(MOCK_COMMITS_PAGE);

      fixture.detectChanges();

      expect(component.commitsData()).toEqual(MOCK_COMMITS_PAGE.content);
    });

    it("should return empty array when commitsPage is undefined", () => {
      mockCommitsStateService.commitsPage.set(EMPTY_PAGE);

      fixture.detectChanges();

      expect(component.commitsData()).toEqual([]);
    });
  });

  describe("onPageIndexOrSizeChange", () => {
    it("should call setPageIndex and setPageSize with correct values", () => {
      const event = { first: 10, rows: 5 };

      component.onPageIndexOrSizeChange(event);

      expect(mockCommitsStateService.setPageIndex).toHaveBeenCalledWith(2);
      expect(mockCommitsStateService.setPageSize).toHaveBeenCalledWith(5);
    });

    it("should use default values when event properties are undefined", () => {
      const event = {};

      component.onPageIndexOrSizeChange(event);

      expect(mockCommitsStateService.setPageIndex).toHaveBeenCalledWith(0);
      expect(mockCommitsStateService.setPageSize).toHaveBeenCalledWith(5);
    });
  });
});
