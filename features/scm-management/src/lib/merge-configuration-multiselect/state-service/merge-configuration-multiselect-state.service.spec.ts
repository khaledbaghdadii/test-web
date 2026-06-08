import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";
import { delay, dematerialize, materialize, of, throwError } from "rxjs";
import { MergeConfiguration } from "../../merge-configuration/model/merge-configuration";
import { MergeConfigurationPage } from "../../merge-configuration/model/merge-configuration-page";
import { MergeConfigurationService } from "../../merge-configuration/merge-configuration.service";
import { MergeConfigurationMultiSelectStateService } from "./merge-configuration-multiselect-state.service";

const SEARCH_KEY = "SEARCH_KEY";
const SEARCH_KEY_2 = "SEARCH_KEY_2";

const DEBOUNCE_TIME = 100;

const PROJECT_ID = "PROJECT_ID";
const BRANCH_NAME = "BRANCH_NAME";
const MERGE_CONFIGURATION_ID_1 = "MERGE_CONFIGURATION_ID_1";
const MERGE_CONFIGURATION_ID_2 = "MERGE_CONFIGURATION_ID_2";
const FIRST_MERGE_CONFIGURATION: MergeConfiguration = {
  id: MERGE_CONFIGURATION_ID_1,
  projectId: PROJECT_ID,
  branchName: BRANCH_NAME,
  mergeConfigurationDefinition: {
    id: "def-1",
    repositoryId: "repoId",
  },
};
const SECOND_MERGE_CONFIGURATION: MergeConfiguration = {
  id: MERGE_CONFIGURATION_ID_2,
  projectId: PROJECT_ID,
  branchName: BRANCH_NAME,
  mergeConfigurationDefinition: {
    id: "def-2",
    repositoryId: "repoId",
  },
};
const FIRST_MERGE_CONFIGURATION_PAGE: MergeConfigurationPage = {
  content: [FIRST_MERGE_CONFIGURATION],
  number: 0,
  size: 1,
  last: false,
  totalElements: 2,
  totalPages: 2,
};
const SECOND_MERGE_CONFIGURATION_PAGE: MergeConfigurationPage = {
  content: [SECOND_MERGE_CONFIGURATION],
  number: 1,
  size: 1,
  last: true,
  totalElements: 2,
  totalPages: 2,
};

describe("MergeConfigurationMultiSelectStateService", () => {
  let service: MergeConfigurationMultiSelectStateService;
  let mergeConfigurationService: jest.Mocked<MergeConfigurationService>;

  beforeEach(waitForAsync(() => {
    mergeConfigurationService = {
      getFilteredMergeConfigurations: jest.fn(() =>
        of(FIRST_MERGE_CONFIGURATION_PAGE)
      ),
    } as unknown as jest.Mocked<MergeConfigurationService>;

    TestBed.configureTestingModule({
      providers: [
        MergeConfigurationMultiSelectStateService,
        {
          provide: MergeConfigurationService,
          useValue: mergeConfigurationService,
        },
      ],
    });
    service = TestBed.inject(MergeConfigurationMultiSelectStateService);
  }));

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("function Object() { [native code] }", () => {
    it("should fetch merge configuration page with the correct filters", fakeAsync(() => {
      setSearchKeySubject(SEARCH_KEY);
      tick(DEBOUNCE_TIME);
      expect(
        mergeConfigurationService.getFilteredMergeConfigurations
      ).toHaveBeenCalledTimes(3);
    }));

    it("should fetch merge configuration page again when searchKeySubject changes", fakeAsync(async () => {
      setSearchKeySubject(SEARCH_KEY);
      tick(DEBOUNCE_TIME);
      setSearchKeySubject(SEARCH_KEY_2);
      tick(DEBOUNCE_TIME);

      expect(
        mergeConfigurationService.getFilteredMergeConfigurations
      ).toHaveBeenCalledTimes(4);
    }));

    it("should fetch merge configuration page again when pageIndexSubject changes", fakeAsync(async () => {
      setPageIndexSubject(2);
      tick();

      expect(
        mergeConfigurationService.getFilteredMergeConfigurations
      ).toHaveBeenCalledTimes(3);
    }));

    it("should emit the merge configuration page value into a signal", fakeAsync(async () => {
      setSearchKeySubject(SEARCH_KEY);
      setSearchKeySubject(SEARCH_KEY_2);
      tick(DEBOUNCE_TIME);
      expect(service.mergeConfigurationsSignal()).toEqual([
        FIRST_MERGE_CONFIGURATION,
      ]);
    }));

    it("should set isLoading to false on successfully fetching merge configurations", () => {
      expect(service.isLoadingDataSignal()).toBeFalsy();
    });

    it("should still react to changes when error occurs while retrieving merge configurations", fakeAsync(async () => {
      mergeConfigurationService.getFilteredMergeConfigurations
        .mockImplementationOnce(() =>
          throwError(() => "error").pipe(
            materialize(),
            delay(1000),
            dematerialize()
          )
        )
        .mockImplementationOnce(() => of(SECOND_MERGE_CONFIGURATION_PAGE));

      service.setPageIndexSubject(1);
      tick(2000);
      service.setPageIndexSubject(0);
      tick();
      expect(service.isLoadingDataSignal()).toBe(false);
      expect(service.mergeConfigurationsSignal()).toEqual([
        SECOND_MERGE_CONFIGURATION,
      ]);
      tick();
    }));
    it("should initialize value for page index signal to zero", () => {
      expect(service.pageIndexSignal()).toEqual(0);
    });

    it("should set value for page index siganl to the values emitted by ", fakeAsync(() => {
      setPageIndexSubject(3);
      tick();
      expect(service.pageIndexSignal()).toEqual(3);
    }));

    it("should emit searchkey values into the signal", fakeAsync(() => {
      setSearchKeySubject(SEARCH_KEY);
      tick(DEBOUNCE_TIME);
      expect(service.searchKeySignal()).toEqual(SEARCH_KEY);
    }));
  });

  describe("signals and observables initialization", () => {
    it("should initialize searchkey subject to undefined", () => {
      service["searchKeySubject"].subscribe((searchkey: string) =>
        expect(searchkey).toBe("")
      );
    });

    it("should initialize pageIndex subject to undefined", () => {
      service["pageIndexSubject"].subscribe((pageIndex: number) =>
        expect(pageIndex).toBe(0)
      );
    });

    it("should initialize isLoading signal correctly", () => {
      expect(service.isLoadingDataSignal()).toBeFalsy();
    });
  });

  describe("setters", () => {
    it("should set page index", () => {
      const nextSpy = jest.spyOn(service["pageIndexSubject"], "next");
      service.setPageIndexSubject(2);
      expect(nextSpy).toHaveBeenCalledWith(2);
    });

    it("should set search key", () => {
      const searchKeySignal = "search key";
      const nextSpy = jest.spyOn(service["searchKeySubject"], "next");
      service.setSearchKeySubject(searchKeySignal);
      expect(nextSpy).toHaveBeenCalledWith(searchKeySignal);
    });
  });

  function setPageIndexSubject(index: number) {
    service["pageIndexSubject"].next(index);
  }

  function setSearchKeySubject(searchKeySignal: string) {
    service["searchKeySubject"].next(searchKeySignal);
  }
});
