import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { DefectTableStateService } from "./defect-table-state.service";
import { DefectService } from "../defect.service";
import { FetchDefectsQuery } from "../model/fetch-defects-query.model";
import { Defect, DefectPage, FetchDefectResult } from "../model/defect.model";
import { of, throwError } from "rxjs";
import { DefectTableQuery } from "./defect-table-query.model";

const EMPTY_RESULT: FetchDefectResult = {
  defects: {
    content: [],
    size: 0,
    number: 0,
    totalPages: 0,
    totalElements: 0,
    last: true,
  },
};

const CURRENT_VERSION = "currentVersion";

const REFERENCE_VERSION = "referenceVersion";

const FIRST_DEFECT: Defect = {
  id: "defect1",
  link: "/defect1",
  title: "Defect 1",
  description: "description1",
  submissionDate: new Date(),
  developer: "3amo sami",
};

const SECOND_DEFECT: Defect = {
  id: "defect2",
  link: "/defect2",
  title: "Defect 2",
  description: "description2",
  submissionDate: new Date(),
  developer: "3amo may",
};

const FIRST_DEFECT_PAGE: DefectPage = {
  content: [FIRST_DEFECT],
  number: 0,
  size: 1,
  totalElements: 2,
  totalPages: 2,
  last: false,
};

const SECOND_DEFECT_PAGE: DefectPage = {
  content: [SECOND_DEFECT],
  number: 1,
  size: 1,
  totalElements: 2,
  totalPages: 2,
  last: true,
};

const WARNING_MESSAGE = "warning";

const FIRST_FETCH_DEFECT_RESULT: FetchDefectResult = {
  defects: FIRST_DEFECT_PAGE,
};

const SECOND_FETCH_DEFECT_RESULT: FetchDefectResult = {
  defects: SECOND_DEFECT_PAGE,
  warningMessage: WARNING_MESSAGE,
};

const DEFECT_TABLE_QUERY: DefectTableQuery = {
  page: 1,
  pageSize: 20,
  idPhrase: "idPhrase",
  titlePhrase: "titlePhrase",
  descriptionPhrase: "descriptionPhrase",
  developerPhrase: "developerPhrase",
};

const DEFAULT_FETCH_DEFECTS_QUERY: FetchDefectsQuery = {
  page: 0,
  size: 10,
  sort: "submissionDate,desc",
  idPhrase: undefined,
  titlePhrase: undefined,
  descriptionPhrase: undefined,
  developerPhrase: undefined,
};

const FETCH_DEFECTS_QUERY: FetchDefectsQuery = {
  page: 1,
  size: 20,
  sort: "submissionDate,desc",
  idPhrase: "idPhrase",
  titlePhrase: "titlePhrase",
  descriptionPhrase: "descriptionPhrase",
  developerPhrase: "developerPhrase",
  currentVersion: CURRENT_VERSION,
  referenceVersion: REFERENCE_VERSION,
};

describe("DefectTableStateServiceService", () => {
  let service: DefectTableStateService;
  let defectService: DefectService;

  beforeEach(() => {
    defectService = {
      fetchAll: jest.fn(() => of(FIRST_FETCH_DEFECT_RESULT)),
    } as unknown as DefectService;

    TestBed.configureTestingModule({
      providers: [
        DefectTableStateService,
        { provide: DefectService, useValue: defectService },
      ],
    });

    service = TestBed.inject(DefectTableStateService);
    service["isVisible"].set(true);
    TestBed.flushEffects();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("initialization", () => {
    it("should initialize page index signal to 0", () => {
      expect(service.page()).toEqual(0);
    });

    it("should initialize page size to 10", () => {
      expect(service.pageSize()).toEqual(10);
    });

    it("should initialize query signal correctly", () => {
      expect(service["fetchDefectsQuery"]()).toEqual(
        DEFAULT_FETCH_DEFECTS_QUERY
      );
    });

    it("should compute defect query signal from nested signals", () => {
      service["pageIndex"].set(1);
      service["size"].set(20);
      service["idPhrase"].set("idPhrase");
      service["titlePhrase"].set("titlePhrase");
      service["descriptionPhrase"].set("descriptionPhrase");
      service["developerPhrase"].set("developerPhrase");
      service["currentVersionCriteria"].set("currentVersion");
      service["referenceVersionCriteria"].set("referenceVersion");
      expect(service["fetchDefectsQuery"]()).toStrictEqual(FETCH_DEFECTS_QUERY);
    });

    it("should compute defect page from fetch defect result", fakeAsync(() => {
      expect(service.defectsPage()).toEqual(FIRST_DEFECT_PAGE);

      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["pageIndex"].set(1);
      tick();

      TestBed.flushEffects();

      expect(service.defectsPage()).toEqual(SECOND_DEFECT_PAGE);
    }));

    it("should compute warning message from fetch defect result", fakeAsync(() => {
      expect(service.warningMessage()).toBeUndefined();

      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["pageIndex"].set(1);
      tick();

      TestBed.flushEffects();

      expect(service.warningMessage()).toEqual(WARNING_MESSAGE);
    }));

    it("should compute defect content from defects page", fakeAsync(() => {
      expect(service.defects()).toEqual([FIRST_DEFECT]);

      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["pageIndex"].set(1);
      tick();

      TestBed.flushEffects();

      expect(service.defects()).toEqual([SECOND_DEFECT]);
    }));

    it("should compute total elements from defects page", fakeAsync(() => {
      expect(service.totalElements()).toEqual(2);

      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(
          of({ defects: { ...SECOND_DEFECT_PAGE, totalElements: 12 } })
        );
      service["pageIndex"].set(1);
      tick();

      TestBed.flushEffects();

      expect(service.totalElements()).toEqual(12);
    }));

    it("should initialize error message signal correctly", () => {
      expect(service.errorMessage()).toBeUndefined();
    });

    it("should initialize isLoading signal correctly", () => {
      expect(service.isLoading()).toBeFalsy();
    });
  });

  describe("fetch defects page", () => {
    it("should fetch defects page with no validation scope criteria correctly", () => {
      expect(defectService.fetchAll).toHaveBeenCalledWith(
        DEFAULT_FETCH_DEFECTS_QUERY
      );
    });

    it("should fetch defects page with all query fields correctly", fakeAsync(() => {
      service["pageIndex"].set(1);
      service["size"].set(20);
      service["idPhrase"].set("idPhrase");
      service["titlePhrase"].set("titlePhrase");
      service["descriptionPhrase"].set("descriptionPhrase");
      service["developerPhrase"].set("developerPhrase");
      service["currentVersionCriteria"].set("currentVersion");
      service["referenceVersionCriteria"].set("referenceVersion");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledWith(FETCH_DEFECTS_QUERY);
    }));

    it("should not fetch defects if table is not visible", fakeAsync(() => {
      jest.spyOn(defectService, "fetchAll").mockClear();
      service["isVisible"].set(false);
      tick();
      service["pageIndex"].set(2);
      tick();
      expect(defectService.fetchAll).not.toHaveBeenCalled();
    }));

    it("should return empty result if table is not visible", fakeAsync(() => {
      jest.spyOn(defectService, "fetchAll").mockClear();
      service["isVisible"].set(false);
      service["pageIndex"].set(2);
      tick();
      TestBed.flushEffects();
      expect(service.defectsPage()).toEqual(EMPTY_RESULT.defects);
      expect(service.warningMessage()).toBeUndefined();
    }));

    it("should fetch the defects page again when page index changes", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().page).toEqual(0);
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["pageIndex"].set(1);
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
        page: 1,
      });
    }));

    it("should fetch the defects page again when page size changes", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().size).toEqual(10);
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["size"].set(20);
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
        size: 20,
      });
    }));

    it("should fetch the defects page again when idPhrase changes", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().idPhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["idPhrase"].set("idPhrase");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
        idPhrase: "idPhrase",
      });
    }));

    it("should not trim idPhrase when idPhrase contains characters and whitespace", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().idPhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["idPhrase"].set("idPhrase ");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
        idPhrase: "idPhrase ",
      });
    }));

    it("should set idPhrase undefined when idPhrase is empty string", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().idPhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["idPhrase"].set("");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
      });
    }));

    it("should set idPhrase undefined when idPhrase is whitespace string", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().idPhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["idPhrase"].set(" ");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
      });
    }));

    it("should not trim titlePhrase when titlePhrase contains characters and whitespace", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().titlePhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["titlePhrase"].set("titlePhrase ");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
        titlePhrase: "titlePhrase ",
      });
    }));

    it("should set titlePhrase undefined when titlePhrase is empty string", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().titlePhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["titlePhrase"].set("");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
      });
    }));

    it("should set titlePhrase undefined when titlePhrase is whitespace string", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().titlePhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["titlePhrase"].set(" ");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
      });
    }));

    it("should not trim developerPhrase when developerPhrase contains characters and whitespace", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().developerPhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["developerPhrase"].set("developerPhrase ");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
        developerPhrase: "developerPhrase ",
      });
    }));

    it("should set developerPhrase undefined when developerPhrase is empty string", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().developerPhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["developerPhrase"].set("");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
      });
    }));

    it("should set developerPhrase undefined when developerPhrase is whitespace string", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().developerPhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["developerPhrase"].set(" ");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
      });
    }));

    it("should not trim descriptionPhrase when descriptionPhrase contains characters and whitespace", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().descriptionPhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["descriptionPhrase"].set("descriptionPhrase ");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
        descriptionPhrase: "descriptionPhrase ",
      });
    }));

    it("should set descriptionPhrase undefined when descriptionPhrase is empty string", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().descriptionPhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["descriptionPhrase"].set("");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
      });
    }));

    it("should set descriptionPhrase undefined when descriptionPhrase is whitespace string", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().descriptionPhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["descriptionPhrase"].set(" ");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
      });
    }));

    it("should fetch the defects page again when titlePhrase changes", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().titlePhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["titlePhrase"].set("titlePhrase");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
        titlePhrase: "titlePhrase",
      });
    }));

    it("should fetch the defects page again when descriptionPhrase changes", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().titlePhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["descriptionPhrase"].set("descriptionPhrase");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
        descriptionPhrase: "descriptionPhrase",
      });
    }));

    it("should fetch the defects page again when developerPhrase changes", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().developerPhrase).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["developerPhrase"].set("developerPhrase");
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
        developerPhrase: "developerPhrase",
      });
    }));

    it("should fetch the defects page again when currentVersion changes", fakeAsync(() => {
      expect(service["currentVersionCriteria"]()).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["currentVersionCriteria"].set(CURRENT_VERSION);
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
        currentVersion: CURRENT_VERSION,
      });
    }));

    it("should fetch the defects page again when referenceVersion changes", fakeAsync(() => {
      expect(service["referenceVersionCriteria"]()).toBeUndefined();
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["referenceVersionCriteria"].set(REFERENCE_VERSION);
      tick();
      TestBed.flushEffects();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(2);
      expect(defectService.fetchAll).toHaveBeenCalledWith({
        ...DEFAULT_FETCH_DEFECTS_QUERY,
        referenceVersion: REFERENCE_VERSION,
      });
    }));

    it("should not fetch the defects page again if the page index is set to the same value", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().page).toEqual(0);
      service["pageIndex"].set(0);
      tick();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(1);
    }));

    it("should not fetch the defects page again if the page size is set to the same value", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().size).toEqual(10);
      service["size"].set(10);
      tick();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(1);
    }));

    it("should not fetch the defects page again if the idPhrase is set to the same value", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().idPhrase).toBeUndefined();
      service["idPhrase"].set(undefined);
      tick();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(1);
    }));

    it("should not fetch the defects page again if the titlePhrase is set to the same value", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().titlePhrase).toBeUndefined();
      service["titlePhrase"].set(undefined);
      tick();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(1);
    }));

    it("should not fetch the defects page again if the descriptionPhrase is set to the same value", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().titlePhrase).toBeUndefined();
      service["descriptionPhrase"].set(undefined);
      tick();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(1);
    }));

    it("should not fetch the defects page again if the developerPhrase is set to the same value", fakeAsync(() => {
      expect(service["fetchDefectsQuery"]().developerPhrase).toBeUndefined();
      service["developerPhrase"].set(undefined);
      tick();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(1);
    }));

    it("should not fetch the defects page again if the currentVersionCriteria is set to the same value", fakeAsync(() => {
      expect(service["currentVersionCriteria"]()).toBeUndefined();
      service["currentVersionCriteria"].set(undefined);
      tick();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(1);
    }));

    it("should not fetch the defects page again if the referenceVersionCriteria is set to the same value", fakeAsync(() => {
      expect(service["referenceVersionCriteria"]()).toBeUndefined();
      service["referenceVersionCriteria"].set(undefined);
      tick();
      expect(defectService.fetchAll).toHaveBeenCalledTimes(1);
    }));

    it("should set isloading to true when fetching defects", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(service.isLoading, "set");
      service["pageIndex"].set(1);
      tick();
      TestBed.flushEffects();
      expect(isLoadingSpy).toHaveBeenCalledWith(true);
    }));

    it("should set isLoading to false on successfully fetching final products", fakeAsync(() => {
      const isLoadingSpy = jest.spyOn(service.isLoading, "set");
      service["pageIndex"].set(1);
      tick();
      TestBed.flushEffects();
      expect(service.isLoading()).toBeFalsy();
      expect(isLoadingSpy).toHaveBeenCalledWith(false);
    }));

    it("should handle error on failure to fetch defects", fakeAsync(() => {
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service["pageIndex"].set(1);
      tick();
      TestBed.flushEffects();
      expect(service.fetchDefectResult()).toEqual(EMPTY_RESULT);
      expect(service.defects()).toEqual([]);
    }));

    it("should set error message signal on failure to fetch defects", fakeAsync(() => {
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      service["pageIndex"].set(1);
      tick();
      TestBed.flushEffects();
      expect(service.errorMessage()).toEqual("failure");
    }));

    it("should set isLoading to false on failure to fetch the final products", fakeAsync(() => {
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"));
      const isLoadingSpy = jest.spyOn(service.isLoading, "set");
      service["pageIndex"].set(1);
      tick();
      TestBed.flushEffects();
      expect(service.isLoading()).toBeFalsy();
      expect(isLoadingSpy).toHaveBeenCalledWith(false);
    }));

    it("should still react to changes when an error occurs while retrieving the defects", fakeAsync(() => {
      jest
        .spyOn(defectService, "fetchAll")
        .mockReturnValueOnce(throwError(() => "failure"))
        .mockReturnValueOnce(of(SECOND_FETCH_DEFECT_RESULT));
      service["pageIndex"].set(1);
      TestBed.flushEffects();
      tick();
      service["pageIndex"].set(2);
      TestBed.flushEffects();
      tick();
      expect(service.isLoading()).toBeFalsy();
      expect(service.defects()).toEqual([SECOND_DEFECT]);
    }));
  });

  describe("setDefectTableQuery", () => {
    it("should set the page index", () => {
      const signalSpy = jest.spyOn(service["pageIndex"], "set");
      service.setDefectTableQuery(DEFECT_TABLE_QUERY);
      expect(signalSpy).toHaveBeenCalledWith(1);
    });

    it("should default the page index to 0 when not passed", () => {
      const signalSpy = jest.spyOn(service["pageIndex"], "set");
      service.setDefectTableQuery({ ...DEFECT_TABLE_QUERY, page: undefined });
      expect(signalSpy).toHaveBeenCalledWith(0);
    });

    it("should set the page size", () => {
      const signalSpy = jest.spyOn(service["size"], "set");
      service.setDefectTableQuery(DEFECT_TABLE_QUERY);
      expect(signalSpy).toHaveBeenCalledWith(20);
    });

    it("should default the page size to 10 when not passed", () => {
      const signalSpy = jest.spyOn(service["size"], "set");
      service.setDefectTableQuery({
        ...DEFECT_TABLE_QUERY,
        pageSize: undefined,
      });
      expect(signalSpy).toHaveBeenCalledWith(10);
    });

    it.each([
      [DEFECT_TABLE_QUERY, DEFECT_TABLE_QUERY.idPhrase],
      [{ ...DEFECT_TABLE_QUERY, idPhrase: undefined }, undefined],
    ])("should set the id phrase", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["idPhrase"], "set");
      service.setDefectTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [DEFECT_TABLE_QUERY, DEFECT_TABLE_QUERY.titlePhrase],
      [{ ...DEFECT_TABLE_QUERY, titlePhrase: undefined }, undefined],
    ])("should set the title phrase", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["titlePhrase"], "set");
      service.setDefectTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [DEFECT_TABLE_QUERY, DEFECT_TABLE_QUERY.descriptionPhrase],
      [{ ...DEFECT_TABLE_QUERY, descriptionPhrase: undefined }, undefined],
    ])("should set the description phrase", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["descriptionPhrase"], "set");
      service.setDefectTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });

    it.each([
      [DEFECT_TABLE_QUERY, DEFECT_TABLE_QUERY.developerPhrase],
      [{ ...DEFECT_TABLE_QUERY, developerPhrase: undefined }, undefined],
    ])("should set the developer phrase", (query, expectedPhrase) => {
      const signalSpy = jest.spyOn(service["developerPhrase"], "set");
      service.setDefectTableQuery(query);
      expect(signalSpy).toHaveBeenCalledWith(expectedPhrase);
    });
  });

  describe("setValidationScope", () => {
    it.each(["criteria", undefined])(
      "should set the reference version criteria",
      (criteria) => {
        const signalSpy = jest.spyOn(
          service["referenceVersionCriteria"],
          "set"
        );
        service.setValidationScope({ referenceVersion: criteria });
        expect(signalSpy).toHaveBeenCalledWith(criteria);
      }
    );

    it.each(["criteria", undefined])(
      "should set the current version criteria",
      (criteria) => {
        const signalSpy = jest.spyOn(service["currentVersionCriteria"], "set");
        service.setValidationScope({ currentVersion: criteria });
        expect(signalSpy).toHaveBeenCalledWith(criteria);
      }
    );

    it("should reset page index to 0", () => {
      service.setDefectTableQuery({
        page: 1,
      } as FetchDefectsQuery);
      const signalSpy = jest.spyOn(service["pageIndex"], "set");
      service.setValidationScope({ currentVersion: "criteria" });
      expect(signalSpy).toHaveBeenCalledWith(0);
    });
  });

  describe("setIsVisible", () => {
    it("should set the current version criteria", () => {
      const signalSpy = jest.spyOn(service["isVisible"], "set");
      service.setIsVisible(true);
      expect(signalSpy).toHaveBeenCalledWith(true);
    });
  });
});
