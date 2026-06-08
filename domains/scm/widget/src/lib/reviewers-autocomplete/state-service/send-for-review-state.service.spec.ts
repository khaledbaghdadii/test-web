import { SendForReviewStateService } from "./send-for-review-state.service";
import { EMPTY, of, throwError } from "rxjs";
import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";
import {
  Reviewer,
  ReviewersService,
  ReviewersPage,
} from "@mxevolve/domains/scm/data-access";

const PROJECT_ID = "projectId";
const REPOSITORY_ID = "repoId";
const FILTER = "filter";

const FIRST_USER = {
  name: "lfirstname",
  displayName: "lastname firstname",
};

const SECOND_USER = {
  name: "lsecondname",
  displayName: "lastname firstname",
};

const REVIEWERS_RESPONSE_FIRST_PAGE_RESPONSE: ReviewersPage = {
  content: [FIRST_USER],
  last: false,
  page: 0,
  totalElements: 1,
};

const REVIEWERS_RESPONSE_SECOND_PAGE_RESPONSE: ReviewersPage = {
  content: [SECOND_USER],
  last: true,
  page: 1,
  totalElements: 1,
};

const REVIEWERS_RESPONSE_FIRST_PAGE: Reviewer[] = [FIRST_USER];

const REVIEWERS_RESPONSE_SECOND_PAGE: Reviewer[] = [SECOND_USER];

const ACCUMLATED_REVIEWERS_PAGE: Reviewer[] = [FIRST_USER, SECOND_USER];

const EMPTY_PAGE: ReviewersPage = {
  content: [],
  page: 0,
  totalElements: 0,
  last: false,
};

describe("SendForReviewStateService", () => {
  let service: SendForReviewStateService;
  let reviewersService: jest.Mocked<ReviewersService>;

  beforeEach(waitForAsync(() => {
    reviewersService = {
      getReviewers: jest.fn(() => of(REVIEWERS_RESPONSE_FIRST_PAGE_RESPONSE)),
    } as unknown as jest.Mocked<ReviewersService>;

    TestBed.configureTestingModule({
      providers: [
        SendForReviewStateService,
        { provide: ReviewersService, useValue: reviewersService },
      ],
    });

    service = TestBed.inject(SendForReviewStateService);
  }));

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("signals and observables initialization", () => {
    it("should initialize pageIndex subject correctly", fakeAsync(() => {
      expect(service.pageIndex()).toEqual(0);
    }));

    it("should initialize resetFilter subject correctly", () => {
      service["filterResetSubject"].subscribe((filterReset) =>
        expect(filterReset).toEqual(false)
      );
    });

    it("should compute newReviewerSuggestions from reviewersPage", fakeAsync(() => {
      initializeSubjects();
      setFilterSubject(FILTER);
      expect(service.newReviewerSuggestions()).toEqual(
        REVIEWERS_RESPONSE_FIRST_PAGE
      );

      reviewersService.getReviewers.mockReturnValue(
        of(REVIEWERS_RESPONSE_SECOND_PAGE_RESPONSE)
      );
      setPageIndex(1);
      tick();
      expect(service.newReviewerSuggestions()).toEqual(
        REVIEWERS_RESPONSE_SECOND_PAGE
      );
    }));

    it("should compute isLastPage from the reviewersPage signal", fakeAsync(() => {
      initializeSubjects();
      setFilterSubject(FILTER);
      expect(service.isLastPage()).toBeFalsy();

      reviewersService.getReviewers.mockReturnValue(
        of(REVIEWERS_RESPONSE_SECOND_PAGE_RESPONSE)
      );
      setPageIndex(1);
      tick();
      expect(service.isLastPage()).toBeTruthy();
    }));

    it("should initialize filter subject to undefined", () => {
      service["filterSubject"].subscribe((filter) =>
        expect(filter).toBeUndefined()
      );
    });

    it("should initialize errorMessage signal to undefined", () => {
      expect(service.errorMessage()).toBeUndefined();
    });

    it("should initialize filterResetSubject to the correct value", () => {
      service["filterResetSubject"].subscribe((filterReset) =>
        expect(filterReset).toBeFalsy()
      );
    });

    it("should initialize isLoading signal correctly", () => {
      expect(service.isLoadingData()).toBeFalsy();
    });
  });

  describe("fetching reviewers", () => {
    it("should fetch the reviewers page correctly", fakeAsync(() => {
      initializeSubjects();
      setFilterSubject(FILTER);
      expect(reviewersService.getReviewers).toHaveBeenCalledWith(
        PROJECT_ID,
        REPOSITORY_ID,
        FILTER,
        0,
        15
      );
    }));

    it("should fetch the reviewers and update suggestions", fakeAsync(() => {
      initializeSubjects();
      setFilterSubject(FILTER);
      expect(reviewersService.getReviewers).toHaveBeenCalledWith(
        PROJECT_ID,
        REPOSITORY_ID,
        FILTER,
        0,
        15
      );
      tick(100);
      expect(service.reviewerSuggestions()).toEqual(
        REVIEWERS_RESPONSE_FIRST_PAGE
      );
    }));

    it("should fetch reviewers again when projectIdSubject changes", fakeAsync(() => {
      initializeSubjects();
      setFilterSubject(FILTER);
      setProjectIdSubject("newProjectId");
      expect(reviewersService.getReviewers).toHaveBeenCalledWith(
        "newProjectId",
        REPOSITORY_ID,
        FILTER,
        0,
        15
      );
      expect(reviewersService.getReviewers).toHaveBeenCalledTimes(2);
    }));

    it("should set empty page as initial value for reviewers page signal", () => {
      reviewersService.getReviewers.mockReturnValue(EMPTY);
      expect(service.reviewersPage()).toEqual(EMPTY_PAGE);
    });

    it("should return empty page on failure to fetch reviewers", () => {
      reviewersService.getReviewers.mockReturnValueOnce(
        throwError(() => "failed")
      );
      initializeSubjects();
      setFilterSubject(FILTER);
      expect(service.reviewerSuggestions()).toEqual([]);
    });

    it("should set isLoading to true when fetching reviewers", () => {
      const isLoadingSpy = jest.spyOn(service.isLoadingData, "set");
      initializeSubjects();
      setFilterSubject(FILTER);
      expect(isLoadingSpy).toHaveBeenCalledWith(true);
    });

    it("should set isLoading to false on successfully fetching reviewers", () => {
      initializeSubjects();
      setFilterSubject(FILTER);
      expect(reviewersService.getReviewers).toHaveBeenCalledTimes(1);
      expect(service.isLoadingData()).toBeFalsy();
    });

    it("should set isLoading to false on failure to fetch reviewers", () => {
      reviewersService.getReviewers.mockReturnValueOnce(
        throwError(() => "failed")
      );
      initializeSubjects();
      setFilterSubject(FILTER);
      expect(reviewersService.getReviewers).toHaveBeenCalledTimes(1);
      expect(service.isLoadingData()).toBeFalsy();
    });

    it("should initialize value for page index signal to zero", () => {
      expect(service.pageIndex()).toEqual(0);
    });

    it("should reset the reviewers page correctly when resetFilter is true", fakeAsync(() => {
      initializeSubjects();
      setFilterSubject(FILTER);
      expect(reviewersService.getReviewers).toHaveBeenCalledWith(
        PROJECT_ID,
        REPOSITORY_ID,
        FILTER,
        0,
        15
      );
      tick(100);
      expect(service.reviewerSuggestions()).toEqual(
        REVIEWERS_RESPONSE_FIRST_PAGE
      );
      setResetFilterSubject(true);
      expect(service.reviewerSuggestions()).toEqual([]);
    }));
  });

  describe("populating the reviewer Suggestions", () => {
    it("should initialize reviewer suggestions to empty array", () => {
      expect(service.reviewerSuggestions()).toEqual([]);
    });

    it("should concatenate new reviewers to existing reviewers", fakeAsync(() => {
      initializeSubjects();
      setFilterSubject(FILTER);
      expect(service.newReviewerSuggestions()).toEqual(
        REVIEWERS_RESPONSE_FIRST_PAGE
      );
      tick();
      expect(service.reviewerSuggestions()).toEqual(
        REVIEWERS_RESPONSE_FIRST_PAGE
      );

      reviewersService.getReviewers.mockReturnValue(
        of(REVIEWERS_RESPONSE_SECOND_PAGE_RESPONSE)
      );
      setPageIndex(1);
      tick();

      expect(service.newReviewerSuggestions()).toEqual(
        REVIEWERS_RESPONSE_SECOND_PAGE
      );
      expect(service.reviewerSuggestions()).toEqual(ACCUMLATED_REVIEWERS_PAGE);
    }));

    it("should replace the existing reviewers with the new reviewers when pageIndex is 0", fakeAsync(() => {
      initializeSubjects();
      setFilterSubject(FILTER);
      expect(service.newReviewerSuggestions()).toEqual(
        REVIEWERS_RESPONSE_FIRST_PAGE
      );
      tick();
      expect(service.reviewerSuggestions()).toEqual(
        REVIEWERS_RESPONSE_FIRST_PAGE
      );

      reviewersService.getReviewers.mockReturnValue(
        of(REVIEWERS_RESPONSE_SECOND_PAGE_RESPONSE)
      );
      setPageIndex(1);
      setPageIndex(0);
      tick();

      expect(service.newReviewerSuggestions()).toEqual(
        REVIEWERS_RESPONSE_SECOND_PAGE
      );
      expect(service.reviewerSuggestions()).toEqual(
        REVIEWERS_RESPONSE_SECOND_PAGE
      );
    }));
  });

  describe("setters", () => {
    it("should set project id", () => {
      const nextSpy = jest.spyOn(service["projectIdSubject"], "next");
      service.setProjectId("newProjectId");
      expect(nextSpy).toHaveBeenCalledWith("newProjectId");
    });

    it("should set repository id", () => {
      const nextSpy = jest.spyOn(service["repositoryIdSubject"], "next");
      service.setRepositoryId("newRepoId");
      expect(nextSpy).toHaveBeenCalledWith("newRepoId");
    });

    it("should set page index", () => {
      const nextSpy = jest.spyOn(service.pageIndex, "set");
      service.setPageIndex(2);
      expect(nextSpy).toHaveBeenCalledWith(2);
    });

    it("should set filter", () => {
      const nextSpy = jest.spyOn(service["filterSubject"], "next");
      service.setFilter("newFilter");
      expect(nextSpy).toHaveBeenCalledWith("newFilter");
    });

    it("should set filterReset", () => {
      const nextSpy = jest.spyOn(service["filterResetSubject"], "next");
      service.setFilterReset(true);
      expect(nextSpy).toHaveBeenCalledWith(true);
    });
  });

  function initializeSubjects() {
    setProjectIdSubject(PROJECT_ID);
    setRepositoryIdSubject(REPOSITORY_ID);
    setPageIndex(0);
  }

  function setProjectIdSubject(projectId: string) {
    service["projectIdSubject"].next(projectId);
  }

  function setRepositoryIdSubject(repositoryId: string) {
    service["repositoryIdSubject"].next(repositoryId);
  }

  function setFilterSubject(filter: string) {
    service["filterSubject"].next(filter);
  }

  function setResetFilterSubject(reset: boolean) {
    service["filterResetSubject"].next(reset);
  }

  function setPageIndex(index: number) {
    service.pageIndex.set(index);
  }
});
