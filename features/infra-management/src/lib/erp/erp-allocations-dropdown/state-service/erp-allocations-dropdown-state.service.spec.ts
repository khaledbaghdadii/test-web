import { ErpAllocation, ErpService } from "@mxflow/features/infra-management";
import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";
import { delay, dematerialize, materialize, of, throwError } from "rxjs";
import { ErpAllocationsDropdownDefaultSelectionMode } from "../../model/erp-allocations-dropdown-default-selection-mode";
import { ErpAllocationsDropdownStateService } from "./erp-allocations-dropdown-state.service";

const PROJECT_ID = "PROJECT_ID";
const MOCK_ERP_ALLOCATION_ID_1 = "erpAllocationId1";
const CUSTOM_ERP_ALLOCATION_ID = "customErpAllocationId";

const ERP_ALLOCATION_1: ErpAllocation = {
  id: MOCK_ERP_ALLOCATION_ID_1,
  projectId: PROJECT_ID,
  erpProjectId: "erpProjectId1",
  allocationName: "allocationName1",
};

const CUSTOM_ERP_ALLOCATION: ErpAllocation = {
  id: CUSTOM_ERP_ALLOCATION_ID,
  projectId: PROJECT_ID,
  erpProjectId: "erpProjectId2",
  allocationName: "allocationName2",
};

const ERP_ALLOCATION_DROPDOWN_OPTION_1 = {
  label: `${ERP_ALLOCATION_1.erpProjectId}-${ERP_ALLOCATION_1.allocationName}`,
  value: ERP_ALLOCATION_1,
};

const CUSTOM_ERP_ALLOCATION_DROPDOWN_OPTION = {
  label: `${CUSTOM_ERP_ALLOCATION.erpProjectId}-${CUSTOM_ERP_ALLOCATION.allocationName}`,
  value: CUSTOM_ERP_ALLOCATION,
};

describe("ErpAllocationsDropdownStateService", () => {
  let service: ErpAllocationsDropdownStateService;
  let erpService: jest.Mocked<ErpService>;

  beforeEach(waitForAsync(() => {
    erpService = {
      getAllErpAllocations: jest.fn(() =>
        of([ERP_ALLOCATION_1, CUSTOM_ERP_ALLOCATION])
      ),
    } as unknown as jest.Mocked<ErpService>;

    TestBed.configureTestingModule({
      providers: [
        ErpAllocationsDropdownStateService,
        { provide: ErpService, useValue: erpService },
      ],
    });
    service = TestBed.inject(ErpAllocationsDropdownStateService);
  }));

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("signals and observables initialization", () => {
    it("should compute erpAllocationsDropdownOptions from erpAllocations and keep same order with dropdown selection mode latest", fakeAsync(() => {
      service.setProjectId(PROJECT_ID);
      tick(100);
      expect(service.erpAllocationsDropdownOptions()).toEqual([
        ERP_ALLOCATION_DROPDOWN_OPTION_1,
        CUSTOM_ERP_ALLOCATION_DROPDOWN_OPTION,
      ]);

      service.setCustomErpAllocationId(CUSTOM_ERP_ALLOCATION_ID);
      tick(100);
      expect(service.erpAllocationsDropdownOptions()).toEqual([
        ERP_ALLOCATION_DROPDOWN_OPTION_1,
        CUSTOM_ERP_ALLOCATION_DROPDOWN_OPTION,
      ]);
    }));

    it("should compute erpAllocationsDropdownOptions from erpAllocations and put custom erp allocation first with dropdown selection mode latest", fakeAsync(() => {
      service.setProjectId(PROJECT_ID);
      setDropdownDefaultSelectionMode(
        ErpAllocationsDropdownDefaultSelectionMode.CUSTOM
      );
      tick(100);
      expect(service.erpAllocationsDropdownOptions()).toEqual([
        ERP_ALLOCATION_DROPDOWN_OPTION_1,
        CUSTOM_ERP_ALLOCATION_DROPDOWN_OPTION,
      ]);

      service.setCustomErpAllocationId(CUSTOM_ERP_ALLOCATION_ID);
      tick(100);
      expect(service.erpAllocationsDropdownOptions()).toEqual([
        CUSTOM_ERP_ALLOCATION_DROPDOWN_OPTION,
        ERP_ALLOCATION_DROPDOWN_OPTION_1,
      ]);
    }));

    it("should initialize error message subject to undefined", () => {
      service["errorMessageSubject"].subscribe((error) =>
        expect(error).toBeUndefined()
      );
    });

    it("should initialize isLoading signal correctly", () => {
      expect(service.isLoadingData()).toBeFalsy();
    });

    it("should initialize customErpAllocationIdSubject to null", () => {
      service["customErpAllocationIdSubject"].subscribe(
        (customErpAllocationId) => {
          expect(customErpAllocationId).toBeNull();
        }
      );
    });

    it("should emit values from customErpAllocationId$ observable", () => {
      let customErpAllocationId: string | undefined = undefined;
      service["customErpAllocationId$"].subscribe(
        (receivedCustomErpAllocationId) => {
          customErpAllocationId = receivedCustomErpAllocationId;
        }
      );
      setCustomErpAllocationId(CUSTOM_ERP_ALLOCATION.id);

      expect(customErpAllocationId).toEqual(CUSTOM_ERP_ALLOCATION.id);
    });

    it("should initialize dropdownDefaultSelectionModeSubject to LATEST", () => {
      service["dropdownDefaultSelectionModeSubject"].subscribe(
        (dropdownDefaultSelectionMode) => {
          expect(dropdownDefaultSelectionMode).toEqual(
            ErpAllocationsDropdownDefaultSelectionMode.LATEST
          );
        }
      );
    });

    it("should default dropdownDefaultSelectionModeSignal to LATEST", () => {
      expect(service.dropdownDefaultSelectionModeSignal()).toEqual(
        ErpAllocationsDropdownDefaultSelectionMode.LATEST
      );
    });

    it("should compute dropdownDefaultSelectionModeSignal from dropdownDefaultSelectionMode$ observable", () => {
      setDropdownDefaultSelectionMode(
        ErpAllocationsDropdownDefaultSelectionMode.CUSTOM
      );

      expect(service.dropdownDefaultSelectionModeSignal()).toEqual(
        ErpAllocationsDropdownDefaultSelectionMode.CUSTOM
      );
    });

    it("should set isLoading to true when fetching erp allocations", () => {
      const isLoadingSpy = jest.spyOn(service.isLoadingData, "set");
      service.setProjectId(PROJECT_ID);
      expect(isLoadingSpy).toHaveBeenCalledWith(true);
    });

    it("should set isLoading to false on successfully fetching erp allocations", () => {
      service.setProjectId(PROJECT_ID);
      expect(erpService.getAllErpAllocations).toHaveBeenCalledTimes(1);
      expect(service.isLoadingData()).toBeFalsy();
    });

    it("should set isLoading to false when error occurs while fetching erp allocations", fakeAsync(async () => {
      erpService.getAllErpAllocations.mockImplementationOnce(() =>
        throwError(() => "error").pipe(
          materialize(),
          delay(100),
          dematerialize()
        )
      );
      service.setProjectId("projectId");
      tick(1000);

      expect(service.isLoadingData()).toBe(false);
      expect(erpService.getAllErpAllocations).toHaveBeenCalledTimes(1);
    }));
    it("should still react to changes when error occurs while retrieving erp allocations", fakeAsync(async () => {
      erpService.getAllErpAllocations
        .mockImplementationOnce(() =>
          throwError(() => "error").pipe(
            materialize(),
            delay(1000),
            dematerialize()
          )
        )
        .mockImplementationOnce(() =>
          of([ERP_ALLOCATION_1, CUSTOM_ERP_ALLOCATION])
        );

      service["errorMessageSubject"].subscribe((next) => {
        expect(next).toEqual("Failed to fetch ERP Allocations");
      });
      service.setProjectId("projectId");
      tick();
      service.setProjectId(PROJECT_ID);
      tick();
      expect(service.erpAllocations()).toEqual([
        ERP_ALLOCATION_1,
        CUSTOM_ERP_ALLOCATION,
      ]);
      expect(erpService.getAllErpAllocations).toHaveBeenCalledTimes(2);
    }));

    it("should emit selectedOption values into the signal", () => {
      service["selectedOptionSubject"].next(ERP_ALLOCATION_DROPDOWN_OPTION_1);
      expect(service.selectedOption()).toEqual(
        ERP_ALLOCATION_DROPDOWN_OPTION_1
      );
    });

    it("should emit values from dropdownDefaultSelectionMode$ observable", (done) => {
      service["dropdownDefaultSelectionModeSubject"].next(
        ErpAllocationsDropdownDefaultSelectionMode.LATEST
      );
      service["dropdownDefaultSelectionMode$"].subscribe(
        (defaultSelectionMode) => {
          if (
            defaultSelectionMode ===
            ErpAllocationsDropdownDefaultSelectionMode.CUSTOM
          ) {
            expect(defaultSelectionMode).toEqual(
              ErpAllocationsDropdownDefaultSelectionMode.CUSTOM
            );
            done();
          }
        }
      );
      setDropdownDefaultSelectionMode(
        ErpAllocationsDropdownDefaultSelectionMode.CUSTOM
      );
    });
  });

  describe("on initialization", () => {
    it("should have empty erpAllocations and null customErpAllocation when no project id is set", () => {
      expect(service.retrievedErpAllocations()).toEqual([]);
      expect(service.customErpAllocation()).toBeUndefined();
      expect(service.erpAllocations()).toEqual([]);
      expect(service.erpAllocationsDropdownOptions()).toEqual([]);
    });

    it("should get all erp allocations when project id is set", fakeAsync(() => {
      service.setProjectId(PROJECT_ID);
      tick(100);
      expect(erpService.getAllErpAllocations).toHaveBeenCalledWith(PROJECT_ID);
      expect(service.retrievedErpAllocations()).toEqual([
        ERP_ALLOCATION_1,
        CUSTOM_ERP_ALLOCATION,
      ]);
    }));

    it("should have customErpAllocation as undefined when no custom erp allocation id is not set but project id is set", fakeAsync(() => {
      service.setProjectId(PROJECT_ID);
      tick(100);
      expect(erpService.getAllErpAllocations).toHaveBeenCalledWith(PROJECT_ID);
      expect(service.retrievedErpAllocations()).toEqual([
        ERP_ALLOCATION_1,
        CUSTOM_ERP_ALLOCATION,
      ]);
      expect(service.customErpAllocation()).toBeUndefined();
    }));

    it("should set customErpAllocation when custom erp allocation id is set ", fakeAsync(() => {
      service.setProjectId(PROJECT_ID);
      setCustomErpAllocationId(CUSTOM_ERP_ALLOCATION.id);
      tick(100);
      expect(erpService.getAllErpAllocations).toHaveBeenCalledWith(PROJECT_ID);
      expect(service.retrievedErpAllocations()).toEqual([
        ERP_ALLOCATION_1,
        CUSTOM_ERP_ALLOCATION,
      ]);
      expect(service.customErpAllocation()).toEqual(CUSTOM_ERP_ALLOCATION);
    }));

    it("should have undefined customErpAllocation when custom erp allocation id is set but not found in retrieved erp allocations", fakeAsync(() => {
      service.setProjectId(PROJECT_ID);
      setCustomErpAllocationId("randomId");
      tick(100);
      expect(erpService.getAllErpAllocations).toHaveBeenCalledWith(PROJECT_ID);
      expect(service.retrievedErpAllocations()).toEqual([
        ERP_ALLOCATION_1,
        CUSTOM_ERP_ALLOCATION,
      ]);
      expect(service.customErpAllocation()).toBeUndefined();
    }));

    it("should set erp allocations to same order as retrieved erp allocations when custom erp allocation is not set", fakeAsync(() => {
      service.setProjectId(PROJECT_ID);
      tick(100);
      expect(erpService.getAllErpAllocations).toHaveBeenCalledWith(PROJECT_ID);
      expect(service.retrievedErpAllocations()).toEqual([
        ERP_ALLOCATION_1,
        CUSTOM_ERP_ALLOCATION,
      ]);
      expect(service.customErpAllocation()).toBeUndefined();
      expect(service.erpAllocations()).toEqual([
        ERP_ALLOCATION_1,
        CUSTOM_ERP_ALLOCATION,
      ]);
    }));

    it("should set erp allocations to same order as retrieved erp allocations when custom erp allocation is set but dropdown selection mode is LATEST", fakeAsync(() => {
      service.setProjectId(PROJECT_ID);
      setCustomErpAllocationId(CUSTOM_ERP_ALLOCATION.id);
      tick(100);
      expect(erpService.getAllErpAllocations).toHaveBeenCalledWith(PROJECT_ID);
      expect(service.retrievedErpAllocations()).toEqual([
        ERP_ALLOCATION_1,
        CUSTOM_ERP_ALLOCATION,
      ]);
      expect(service.customErpAllocation()).toEqual(CUSTOM_ERP_ALLOCATION);
      expect(service.erpAllocations()).toEqual([
        ERP_ALLOCATION_1,
        CUSTOM_ERP_ALLOCATION,
      ]);
    }));

    it("should set custom erp allocation as first element of erp allocations when custom erp allocation is set and dropdown selection mode is CUSTOM", fakeAsync(() => {
      service.setProjectId(PROJECT_ID);
      setCustomErpAllocationId(CUSTOM_ERP_ALLOCATION.id);
      setDropdownDefaultSelectionMode(
        ErpAllocationsDropdownDefaultSelectionMode.CUSTOM
      );
      tick(100);
      expect(erpService.getAllErpAllocations).toHaveBeenCalledWith(PROJECT_ID);
      expect(service.retrievedErpAllocations()).toEqual([
        ERP_ALLOCATION_1,
        CUSTOM_ERP_ALLOCATION,
      ]);
      expect(service.customErpAllocation()).toEqual(CUSTOM_ERP_ALLOCATION);
      expect(service.erpAllocations()).toEqual([
        CUSTOM_ERP_ALLOCATION,
        ERP_ALLOCATION_1,
      ]);
    }));

    it("should not set custom erp allocation as first element of erp allocations when custom erp allocation does not exist and dropdown selection mode is CUSTOM", fakeAsync(() => {
      service.setProjectId(PROJECT_ID);
      setCustomErpAllocationId("randomId");
      setDropdownDefaultSelectionMode(
        ErpAllocationsDropdownDefaultSelectionMode.CUSTOM
      );
      tick(100);
      expect(erpService.getAllErpAllocations).toHaveBeenCalledWith(PROJECT_ID);
      expect(service.retrievedErpAllocations()).toEqual([
        ERP_ALLOCATION_1,
        CUSTOM_ERP_ALLOCATION,
      ]);
      expect(service.customErpAllocation()).toBeUndefined();
      expect(service.erpAllocations()).toEqual([
        ERP_ALLOCATION_1,
        CUSTOM_ERP_ALLOCATION,
      ]);
    }));

    it("should propagate error through errorMessageSubject when fetching erp allocations fails", fakeAsync(() => {
      const FAILURE_MESSAGE = "Failed to fetch ERP Allocations";
      let receivedFailure: string | undefined = undefined;
      service["errorMessageSubject"].subscribe(
        (error) => (receivedFailure = error)
      );
      erpService.getAllErpAllocations.mockReturnValueOnce(
        throwError(() => new Error(FAILURE_MESSAGE))
      );
      service.setProjectId(PROJECT_ID);
      tick(100);

      expect(erpService.getAllErpAllocations).toHaveBeenCalledWith(PROJECT_ID);
      expect(receivedFailure as unknown as string).toBe(FAILURE_MESSAGE);
    }));
  });

  describe("setters", () => {
    it("should set project id", () => {
      const nextSpy = jest.spyOn(service["projectIdSubject"], "next");
      service.setProjectId("newProjectId");
      expect(nextSpy).toHaveBeenCalledWith("newProjectId");
    });

    it("should set customErpAllocationId", () => {
      const nextSpy = jest.spyOn(
        service["customErpAllocationIdSubject"],
        "next"
      );
      service.setCustomErpAllocationId(CUSTOM_ERP_ALLOCATION.id);

      expect(nextSpy).toHaveBeenCalledWith(CUSTOM_ERP_ALLOCATION.id);
    });

    it("should set dropdownDefaultSelectionMode", () => {
      const nextSpy = jest.spyOn(
        service["dropdownDefaultSelectionModeSubject"],
        "next"
      );
      service.setDropdownDefaultSelectionMode(
        ErpAllocationsDropdownDefaultSelectionMode.CUSTOM
      );

      expect(nextSpy).toHaveBeenCalledWith(
        ErpAllocationsDropdownDefaultSelectionMode.CUSTOM
      );
    });

    it.each([undefined, ERP_ALLOCATION_DROPDOWN_OPTION_1])(
      "should set selected option",
      (selectedOption) => {
        const nextSpy = jest.spyOn(service["selectedOptionSubject"], "next");
        service.setSelectedOption(selectedOption);
        expect(nextSpy).toHaveBeenCalledWith(selectedOption);
      }
    );
  });

  function setCustomErpAllocationId(customErpAllocationId: string) {
    service["customErpAllocationIdSubject"].next(customErpAllocationId);
  }

  function setDropdownDefaultSelectionMode(
    dropdownDefaultSelectionMode: ErpAllocationsDropdownDefaultSelectionMode
  ) {
    service["dropdownDefaultSelectionModeSubject"].next(
      dropdownDefaultSelectionMode
    );
  }
});
