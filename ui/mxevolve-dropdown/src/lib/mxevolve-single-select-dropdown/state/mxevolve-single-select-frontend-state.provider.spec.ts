import { fakeAsync, tick } from "@angular/core/testing";
import { MxevolveSingleSelectFrontendStateProvider } from "./mxevolve-single-select-frontend-state.provider";
import { MxEvolveSingleSelectDataProvider } from "../../models/single-select-data-provider.interface";
import { of, throwError, firstValueFrom, filter } from "rxjs";
import { DropdownOption } from "../../models/dropdown-option.interface";
import { DestroyRef } from "@angular/core";

interface TestItem {
  id: string;
  name: string;
}

describe("MxevolveSingleSelectFrontendStateProvider", () => {
  let service: MxevolveSingleSelectFrontendStateProvider<
    TestItem,
    { testParam: string }
  >;
  let mockDataProvider: jest.Mocked<
    MxEvolveSingleSelectDataProvider<TestItem, { testParam: string }>
  >;
  let mockDestroyRef: DestroyRef;
  let MOCK_ITEMS: TestItem[];

  beforeEach(() => {
    MOCK_ITEMS = [
      { id: "1", name: "Apple" },
      { id: "2", name: "Banana" },
      { id: "3", name: "Cherry" },
      { id: "4", name: "Date" },
      { id: "5", name: "Elderberry" },
    ];

    mockDataProvider = {
      fetchData: jest.fn().mockReturnValue(of(MOCK_ITEMS)),
      toDropdownOption: jest.fn(
        (item: TestItem): DropdownOption<TestItem> => ({
          label: item.name,
          value: item,
        })
      ),
      getItemId: jest.fn((item: TestItem) => item.id),
    };

    mockDestroyRef = {
      onDestroy: jest.fn(),
    } as unknown as DestroyRef;

    service = new MxevolveSingleSelectFrontendStateProvider(
      mockDataProvider,
      mockDestroyRef,
      200
    );
  });

  describe("setDataParams", () => {
    it("should trigger data fetch with correct parameters", async () => {
      const itemsPromise = firstValueFrom(
        service.items$.pipe(filter((items) => items.length > 0))
      );

      service.setDataParams({ testParam: "test" });

      const items = await itemsPromise;

      expect(mockDataProvider.fetchData).toHaveBeenCalledWith({
        testParam: "test",
      });
      expect(items).toEqual(MOCK_ITEMS);
    });

    it("should load all items at once", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });

      tick(250);

      expect(service.items()?.length).toBe(5);
      expect(service.items()).toEqual(MOCK_ITEMS);
    }));
  });

  describe("setSelectedItem", () => {
    it("should update selected item signal", () => {
      const selectedItem = MOCK_ITEMS[0];
      service.setSelectedItem(selectedItem);

      expect(service.selectedItem()).toEqual(selectedItem);
    });

    it("should handle null value", () => {
      service.setSelectedItem(MOCK_ITEMS[0]);
      service.setSelectedItem(null);

      expect(service.selectedItem()).toBeNull();
    });
  });

  describe("setSearchKey - Frontend Filtering", () => {
    it("should filter items by search key (case-insensitive)", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });
      tick(250);

      service.setSearchKey("apple");
      tick(250);

      const filteredItems = service.items();
      expect(filteredItems?.length).toBe(1);
      expect(filteredItems?.[0].name).toBe("Apple");
    }));

    it("should filter items by partial match", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });
      tick(250);

      service.setSearchKey("an");
      tick(250);

      const filteredItems = service.items();
      expect(filteredItems?.length).toBe(1);
      expect(filteredItems?.map((i) => i.name)).toContain("Banana");
    }));

    it("should return all items when search key is empty", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });
      tick(250);

      service.setSearchKey("apple");
      tick(250);
      expect(service.items()?.length).toBe(1);

      service.setSearchKey("");
      tick(250);

      expect(service.items()?.length).toBe(5);
    }));

    it("should return empty array when no items match", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });
      tick(250);

      service.setSearchKey("xyz");
      tick(250);

      expect(service.items()?.length).toBe(0);
    }));

    it("should filter case-insensitively", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });
      tick(250);

      service.setSearchKey("APPLE");
      tick(250);

      expect(service.items()?.length).toBe(1);
      expect(service.items()?.[0].name).toBe("Apple");
    }));

    it("should not make additional backend calls when filtering", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });
      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenCalledTimes(1);

      service.setSearchKey("apple");
      tick(250);

      service.setSearchKey("banana");
      tick(250);

      // Should still be only 1 call - filtering happens on frontend
      expect(mockDataProvider.fetchData).toHaveBeenCalledTimes(1);
    }));
  });

  describe("dropdownOptions", () => {
    it("should map items to dropdown options", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });
      tick(250);

      const options = service.dropdownOptions();

      expect(options.length).toBe(5);
      expect(options[0]).toEqual({ label: "Apple", value: MOCK_ITEMS[0] });
      expect(options[1]).toEqual({ label: "Banana", value: MOCK_ITEMS[1] });
    }));

    it("should include selected item not in filtered list at the top", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });
      tick(250);

      // Select an item
      service.setSelectedItem(MOCK_ITEMS[0]); // Apple

      // Filter to only show items containing 'an' (Banana)
      service.setSearchKey("ban");
      tick(250);

      const options = service.dropdownOptions();

      // Should have Apple at top (selected) + Banana (filtered)
      expect(options.length).toBe(2);
      expect(options[0].value).toEqual(MOCK_ITEMS[0]); // Apple - selected
      expect(options[1].value).toEqual(MOCK_ITEMS[1]); // Banana - filtered
    }));

    it("should not duplicate selected item if already in filtered list", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });
      tick(250);

      // Select Apple
      service.setSelectedItem(MOCK_ITEMS[0]);

      // Filter to show Apple
      service.setSearchKey("apple");
      tick(250);

      const options = service.dropdownOptions();

      // Should only have one Apple
      expect(options.length).toBe(1);
      expect(options[0].value).toEqual(MOCK_ITEMS[0]);
    }));

    it("should return empty array when items is undefined", () => {
      const options = service.dropdownOptions();
      expect(options).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("should emit error message when fetch fails", async () => {
      const errorMessage = "Fetch failed";
      mockDataProvider.fetchData.mockReturnValue(
        throwError(() => new Error(errorMessage))
      );

      const errorPromise = firstValueFrom(service.errorMessageSubject);

      service.setDataParams({ testParam: "test" });

      const error = await errorPromise;
      expect(error).toBe(errorMessage);
    });

    it("should set loading to false when fetch fails", fakeAsync(() => {
      mockDataProvider.fetchData.mockReturnValue(
        throwError(() => new Error("Fetch failed"))
      );

      service.setDataParams({ testParam: "test" });

      tick(250);

      expect(service.loading()).toBe(false);
    }));
  });

  describe("loading state", () => {
    it("should set loading to false after successful fetch", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });

      tick(250);

      expect(service.loading()).toBe(false);
    }));
  });

  describe("itemsPage signal", () => {
    it("should have itemsPage as undefined initially", () => {
      expect(service.itemsPage()).toBeUndefined();
    });
  });

  describe("items$ observable", () => {
    it("should emit items when data is fetched", async () => {
      const itemsPromise = firstValueFrom(
        service.items$.pipe(filter((items) => items.length > 0))
      );

      service.setDataParams({ testParam: "test" });

      const items = await itemsPromise;
      expect(items).toEqual(MOCK_ITEMS);
    });
  });

  describe("searchKey signal", () => {
    it("should update searchKey signal when setSearchKey is called", fakeAsync(() => {
      service.setSearchKey("test");
      tick(250);

      expect(service.searchKey()).toBe("test");
    }));

    it("should be empty string initially", () => {
      expect(service.searchKey()).toBe("");
    });
  });
});
