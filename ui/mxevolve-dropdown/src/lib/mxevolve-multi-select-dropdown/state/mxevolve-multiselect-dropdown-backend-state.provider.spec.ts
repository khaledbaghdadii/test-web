import { fakeAsync, tick } from "@angular/core/testing";
import { MxevolveDropdownBackendStateProvider } from "./mxevolve-multiselect-dropdown-backend-state.provider";
import { MxEvolveDropdownDataProvider } from "../../models/dropdown-data-provider.interface";
import { of, throwError, firstValueFrom, filter } from "rxjs";
import { PageResponse } from "../../models/page-response.interface";
import { DropdownOption } from "../../models/dropdown-option.interface";
import { DestroyRef } from "@angular/core";

interface TestItem {
  id: string;
  name: string;
}

describe("MxEvolveDropdownBackendStateProvider", () => {
  let service: MxevolveDropdownBackendStateProvider<
    TestItem,
    { testParam: string }
  >;
  let mockDataProvider: jest.Mocked<
    MxEvolveDropdownDataProvider<TestItem, { testParam: string }>
  >;
  let mockDestroyRef: DestroyRef;
  let MOCK_ITEMS: TestItem[];
  let MOCK_PAGE_RESPONSE: PageResponse<TestItem>;

  beforeEach(() => {
    MOCK_ITEMS = [
      { id: "1", name: "Item 1" },
      { id: "2", name: "Item 2" },
      { id: "3", name: "Item 3" },
    ];

    MOCK_PAGE_RESPONSE = {
      content: MOCK_ITEMS,
      last: false,
    };

    mockDataProvider = {
      fetchData: jest.fn().mockReturnValue(of(MOCK_PAGE_RESPONSE)),
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

    service = new MxevolveDropdownBackendStateProvider(
      mockDataProvider,
      mockDestroyRef,
      10,
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

      expect(mockDataProvider.fetchData).toHaveBeenCalledWith(
        { testParam: "test" },
        0,
        10,
        ""
      );
      expect(items).toEqual(MOCK_ITEMS);
    });

    it("resets page index to zero when data params change", fakeAsync(() => {
      service.setDataParams({ testParam: "test1" });
      tick(250);

      service.setPageIndex(2);
      tick(250);

      service.setDataParams({ testParam: "test2" });
      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenLastCalledWith(
        { testParam: "test2" },
        0,
        10,
        ""
      );
    }));

    it("resets search key when data params change", fakeAsync(() => {
      service.setDataParams({ testParam: "test1" });
      tick(250);

      service.setSearchKey("some-filter");
      tick(250);

      service.setDataParams({ testParam: "test2" });
      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenLastCalledWith(
        { testParam: "test2" },
        0,
        10,
        ""
      );
    }));

    it("does not accumulate stale items from previous params after scrolling", fakeAsync(() => {
      const page1 = { content: [MOCK_ITEMS[0]], last: false };
      const page2 = { content: [MOCK_ITEMS[1]], last: true };
      const newItems = [{ id: "new", name: "New Item" }];
      const newPage = { content: newItems, last: true };

      mockDataProvider.fetchData
        .mockReturnValueOnce(of(page1))
        .mockReturnValueOnce(of(page2))
        .mockReturnValueOnce(of(newPage));

      service.setDataParams({ testParam: "test1" });
      tick(250);

      service.setPageIndex(1);
      tick(250);

      expect(service.items()?.length).toBe(2);

      service.setDataParams({ testParam: "test2" });
      tick(250);

      expect(service.items()).toEqual(newItems);
    }));
  });

  describe("setSelectedItems", () => {
    it("should update selected items signal", () => {
      service.setSelectedItems(MOCK_ITEMS);

      expect(service.selectedItems()).toEqual(MOCK_ITEMS);
    });
  });

  describe("setSearchKey", () => {
    it("should trigger data fetch with search key", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });

      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenCalledTimes(1);

      service.setSearchKey("search");

      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenCalledTimes(2);
      expect(mockDataProvider.fetchData).toHaveBeenCalledWith(
        { testParam: "test" },
        0,
        10,
        "search"
      );
    }));
  });

  describe("setPageIndex", () => {
    it("should trigger data fetch with new page index", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });
      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenCalledTimes(1);

      service.setPageIndex(1);
      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenCalledTimes(2);
      expect(mockDataProvider.fetchData).toHaveBeenCalledWith(
        { testParam: "test" },
        1,
        10,
        ""
      );
    }));
  });

  describe("attemptLoadingMoreItems", () => {
    it("should increment page index when not on last page", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });

      tick(250);

      service.attemptLoadingMoreItems();

      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenCalledWith(
        { testParam: "test" },
        1,
        10,
        ""
      );
    }));

    it("should not increment page index when on last page", fakeAsync(() => {
      const lastPageResponse: PageResponse<TestItem> = {
        content: MOCK_ITEMS,
        last: true,
      };
      mockDataProvider.fetchData.mockReturnValue(of(lastPageResponse));

      service.setDataParams({ testParam: "test" });

      tick(250);

      const callCount = mockDataProvider.fetchData.mock.calls.length;
      service.attemptLoadingMoreItems();

      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenCalledTimes(callCount);
    }));

    it("should not skip pages when called rapidly during debounce window", fakeAsync(() => {
      const page1 = { content: [MOCK_ITEMS[0]], last: false };
      const page2 = { content: [MOCK_ITEMS[1]], last: false };
      const page3 = { content: [MOCK_ITEMS[2]], last: true };

      mockDataProvider.fetchData
        .mockReturnValueOnce(of(page1))
        .mockReturnValueOnce(of(page2))
        .mockReturnValueOnce(of(page3));

      service.setDataParams({ testParam: "test" });
      tick(250);

      service.attemptLoadingMoreItems();
      service.attemptLoadingMoreItems();
      service.attemptLoadingMoreItems();
      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenNthCalledWith(
        2,
        { testParam: "test" },
        1,
        10,
        ""
      );

      service.attemptLoadingMoreItems();
      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenNthCalledWith(
        3,
        { testParam: "test" },
        2,
        10,
        ""
      );
    }));
  });

  describe("dropdownOptions", () => {
    it("should map items to dropdown options", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });

      tick(250);

      const options = service.dropdownOptions();

      expect(options).toEqual([
        { label: "Item 1", value: MOCK_ITEMS[0] },
        { label: "Item 2", value: MOCK_ITEMS[1] },
        { label: "Item 3", value: MOCK_ITEMS[2] },
      ]);
    }));

    it("should include preselected items not in current page", fakeAsync(() => {
      const preselectedItem: TestItem = { id: "99", name: "Preselected" };
      service.setSelectedItems([preselectedItem]);

      service.setDataParams({ testParam: "test" });

      tick(250);

      const options = service.dropdownOptions();

      expect(options.length).toBe(4);
      expect(options[0]).toEqual({
        label: "Preselected",
        value: preselectedItem,
      });
    }));
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
    it("should set loading to true during fetch", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });

      tick(201);
      expect(service.loading()).toBe(false);
    }));

    it("should set loading to false after successful fetch", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });

      tick(250);

      expect(service.loading()).toBe(false);
    }));
  });

  describe("deduplication", () => {
    it("should deduplicate items when loading more pages", fakeAsync(() => {
      const page1 = { content: [MOCK_ITEMS[0], MOCK_ITEMS[1]], last: false };
      const page2 = { content: [MOCK_ITEMS[1], MOCK_ITEMS[2]], last: true };

      mockDataProvider.fetchData
        .mockReturnValueOnce(of(page1))
        .mockReturnValueOnce(of(page2));

      service.setDataParams({ testParam: "test" });

      tick(250);

      service.setPageIndex(1);

      tick(250);

      const items = service.items();
      expect(items?.length).toBe(3);
    }));

    it("should not accumulate items when resetting to page 0", fakeAsync(() => {
      const page1 = { content: [MOCK_ITEMS[0], MOCK_ITEMS[1]], last: false };
      const page2 = { content: [MOCK_ITEMS[2]], last: true };

      mockDataProvider.fetchData
        .mockReturnValueOnce(of(page1))
        .mockReturnValueOnce(of(page2));

      service.setDataParams({ testParam: "test" });

      tick(250);

      service.setPageIndex(0);

      tick(250);

      const items = service.items();
      expect(items?.length).toBe(1);
    }));
  });

  describe("itemsPage signal", () => {
    it("should update itemsPage signal when data is fetched", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });

      tick(250);

      const itemsPage = service.itemsPage();
      expect(itemsPage).toEqual(MOCK_PAGE_RESPONSE);
    }));

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

    it("should accumulate items across pages", fakeAsync(() => {
      const page1 = { content: [MOCK_ITEMS[0]], last: false };
      const page2 = { content: [MOCK_ITEMS[1]], last: false };
      const page3 = { content: [MOCK_ITEMS[2]], last: true };

      mockDataProvider.fetchData
        .mockReturnValueOnce(of(page1))
        .mockReturnValueOnce(of(page2))
        .mockReturnValueOnce(of(page3));

      service.setDataParams({ testParam: "test" });

      tick(250);

      let items = service.items();
      expect(items?.length).toBe(1);

      service.setPageIndex(1);
      tick(250);

      items = service.items();
      expect(items?.length).toBe(2);

      service.setPageIndex(2);
      tick(250);

      items = service.items();
      expect(items?.length).toBe(3);
    }));
  });

  describe("dropdownOptions computed", () => {
    it("should return empty array when items is undefined", () => {
      const options = service.dropdownOptions();
      expect(options).toEqual([]);
    });

    it("should not duplicate preselected items that already exist in list", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });

      tick(250);

      // Set selected items after data is loaded
      service.setSelectedItems([MOCK_ITEMS[0]]);

      const options = service.dropdownOptions();
      expect(options.length).toBe(3);
      expect(options).toEqual([
        { label: "Item 1", value: MOCK_ITEMS[0] },
        { label: "Item 2", value: MOCK_ITEMS[1] },
        { label: "Item 3", value: MOCK_ITEMS[2] },
      ]);
    }));

    it("should handle multiple preselected items not in list", fakeAsync(() => {
      const preselectedItem1: TestItem = { id: "99", name: "Preselected 1" };
      const preselectedItem2: TestItem = { id: "98", name: "Preselected 2" };

      service.setDataParams({ testParam: "test" });

      tick(250);

      service.setSelectedItems([preselectedItem1, preselectedItem2]);

      const options = service.dropdownOptions();
      expect(options.length).toBe(5);
      expect(options[0].value).toEqual(preselectedItem1);
      expect(options[1].value).toEqual(preselectedItem2);
    }));

    it("should handle mix of preselected items in and out of list", fakeAsync(() => {
      const preselectedItem1: TestItem = { id: "99", name: "Preselected" };

      service.setDataParams({ testParam: "test" });

      tick(250);

      const items = service.items();
      expect(items?.length).toBe(3);

      service.setSelectedItems([preselectedItem1, MOCK_ITEMS[1]]);

      const options = service.dropdownOptions();

      expect(options.length).toBe(4);
      expect(options[0].value).toEqual(preselectedItem1);
    }));

    it("should keep preselected items at top after search", fakeAsync(() => {
      const preselectedItem: TestItem = { id: "99", name: "Preselected Item" }; // Initial load

      service.setDataParams({ testParam: "test" });
      tick(250);

      service.setSelectedItems([preselectedItem, MOCK_ITEMS[0]]);

      let options = service.dropdownOptions();
      expect(options.length).toBe(4); // 2 selected + 2 remaining from initial load
      expect(options[0].value).toEqual(preselectedItem);
      expect(options[1].value).toEqual(MOCK_ITEMS[0]); // Selected item from results, now at top!
      expect(options[2].value).toEqual(MOCK_ITEMS[1]); // Non-selected items after
      expect(options[3].value).toEqual(MOCK_ITEMS[2]);

      const searchResults: TestItem[] = [
        { id: "10", name: "Search Result 1" },
        { id: "11", name: "Search Result 2" },
      ];
      mockDataProvider.fetchData.mockReturnValue(
        of({ content: searchResults, last: true })
      );

      service.setSearchKey("search");
      service.setPageIndex(0);
      tick(250);

      options = service.dropdownOptions();
      expect(options.length).toBe(4); // 2 selected + 2 search results
      expect(options[0].value).toEqual(preselectedItem);
      expect(options[1].value).toEqual(MOCK_ITEMS[0]); // Still selected, still first!
      expect(options[2].value).toEqual(searchResults[0]);
      expect(options[3].value).toEqual(searchResults[1]);
    }));

    it("should keep preselected items at top after pagination", fakeAsync(() => {
      const preselectedItem: TestItem = { id: "99", name: "Preselected" };

      const page1 = { content: [MOCK_ITEMS[0]], last: false };
      mockDataProvider.fetchData.mockReturnValue(of(page1));

      service.setDataParams({ testParam: "test" });
      tick(250);

      // Set preselected items (one not in results, one in results)
      service.setSelectedItems([preselectedItem, MOCK_ITEMS[0]]);

      // Verify BOTH are first
      let options = service.dropdownOptions();
      expect(options.length).toBe(2);
      expect(options[0].value).toEqual(preselectedItem);
      expect(options[1].value).toEqual(MOCK_ITEMS[0]); // Selected, appears first not in natural position

      // Load second page
      const page2 = { content: [MOCK_ITEMS[1]], last: false };
      mockDataProvider.fetchData.mockReturnValue(of(page2));

      service.setPageIndex(1);
      tick(250);

      // Selected items should STILL be at the top
      options = service.dropdownOptions();
      expect(options.length).toBe(3); // 2 selected + 1 new item
      expect(options[0].value).toEqual(preselectedItem);
      expect(options[1].value).toEqual(MOCK_ITEMS[0]); // Still first!
      expect(options[2].value).toEqual(MOCK_ITEMS[1]); // Non-selected item after
    }));

    it("should move selected item to top when it appears in search results", fakeAsync(() => {
      const selectedItem1: TestItem = { id: "99", name: "Selected 1" };
      const selectedItem2: TestItem = { id: "98", name: "Selected 2" };

      // Initial load - selected items not in results
      service.setDataParams({ testParam: "test" });
      tick(250);

      service.setSelectedItems([selectedItem1, selectedItem2]);

      // Both selected items at top since not in results
      let options = service.dropdownOptions();
      expect(options[0].value).toEqual(selectedItem1);
      expect(options[1].value).toEqual(selectedItem2);

      // Search returns results that INCLUDE one of the selected items
      const searchResults: TestItem[] = [
        { id: "10", name: "Other Result" },
        selectedItem2, // This selected item now in results
        { id: "11", name: "Another Result" },
      ];
      mockDataProvider.fetchData.mockReturnValue(
        of({ content: searchResults, last: true })
      );

      service.setSearchKey("search");
      service.setPageIndex(0);
      tick(250);

      // BOTH selected items should be at top, not in their natural search result position
      options = service.dropdownOptions();
      expect(options.length).toBe(4); // 2 selected + 2 non-selected from search
      expect(options[0].value).toEqual(selectedItem1); // Selected, first
      expect(options[1].value).toEqual(selectedItem2); // Selected, second (not in natural position!)
      expect(options[2].value).toEqual(searchResults[0]); // Non-selected results after
      expect(options[3].value).toEqual(searchResults[2]);

      // Verify no duplication
      const ids = options.map((opt) => opt.value.id);
      expect(new Set(ids).size).toBe(ids.length);
    }));
  });

  describe("debounce behavior", () => {
    it("should debounce multiple rapid search key changes", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });

      tick(250);

      const initialCallCount = mockDataProvider.fetchData.mock.calls.length;

      service.setSearchKey("a");
      tick(50);
      service.setSearchKey("ab");
      tick(50);
      service.setSearchKey("abc");

      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenCalledTimes(
        initialCallCount + 1
      );
      expect(mockDataProvider.fetchData).toHaveBeenLastCalledWith(
        { testParam: "test" },
        0,
        10,
        "abc"
      );
    }));

    it("should debounce multiple rapid page changes", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });

      tick(250);

      const initialCallCount = mockDataProvider.fetchData.mock.calls.length;

      service.setPageIndex(1);
      tick(50);
      service.setPageIndex(2);
      tick(50);
      service.setPageIndex(3);

      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenCalledTimes(
        initialCallCount + 1
      );
      expect(mockDataProvider.fetchData).toHaveBeenLastCalledWith(
        { testParam: "test" },
        3,
        10,
        ""
      );
    }));
  });

  describe("page size configuration", () => {
    it("should use custom page size when initialized", fakeAsync(() => {
      mockDataProvider.fetchData.mockClear();

      const customPageSizeService = new MxevolveDropdownBackendStateProvider(
        mockDataProvider,
        mockDestroyRef,
        25,
        200
      );

      customPageSizeService.setDataParams({ testParam: "test" });

      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenCalledWith(
        { testParam: "test" },
        0,
        25,
        ""
      );
    }));
  });

  describe("data params changes", () => {
    it("should fetch data with new params when params change", fakeAsync(() => {
      service.setDataParams({ testParam: "test1" });

      tick(250);

      service.setDataParams({ testParam: "test2" });

      tick(250);

      expect(mockDataProvider.fetchData).toHaveBeenLastCalledWith(
        { testParam: "test2" },
        0,
        10,
        ""
      );
    }));
  });

  describe("edge cases", () => {
    it("should handle empty page response", fakeAsync(() => {
      const emptyResponse: PageResponse<TestItem> = {
        content: [],
        last: true,
      };
      mockDataProvider.fetchData.mockReturnValue(of(emptyResponse));

      service.setDataParams({ testParam: "test" });

      tick(250);

      const items = service.items();
      expect(items).toEqual([]);

      const options = service.dropdownOptions();
      expect(options).toEqual([]);
    }));

    it("should handle empty selected items array", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });

      tick(250);

      service.setSelectedItems([]);

      const options = service.dropdownOptions();
      expect(options.length).toBe(3);
    }));

    it("should handle undefined itemsPage when calling attemptLoadingMoreItems", () => {
      expect(() => service.attemptLoadingMoreItems()).not.toThrow();
    });
  });

  describe("signal updates", () => {
    it("should update searchKey signal immediately", () => {
      expect(service.searchKey()).toBe("");

      service.setSearchKey("test");

      expect(service.searchKey()).toBe("test");
    });

    it("should update selectedItems signal immediately", () => {
      expect(service.selectedItems()).toEqual([]);

      service.setSelectedItems(MOCK_ITEMS);

      expect(service.selectedItems()).toEqual(MOCK_ITEMS);
    });

    it("should update loading signal during fetch lifecycle", fakeAsync(() => {
      expect(service.loading()).toBe(false);

      service.setDataParams({ testParam: "test" });

      tick(1);

      expect(service.loading()).toBe(false);
    }));
  });

  describe("syncSelectedItemsWithList", () => {
    it("should sync selected items to matching items from loaded list when IDs match but references differ", fakeAsync(() => {
      const prefilledItem1: TestItem = { id: "1", name: "Prefilled Item 1" };
      const prefilledItem2: TestItem = { id: "2", name: "Prefilled Item 2" };
      service.setSelectedItems([prefilledItem1, prefilledItem2]);

      expect(service.selectedItems()).toContain(prefilledItem1);
      expect(service.selectedItems()).toContain(prefilledItem2);

      service.setDataParams({ testParam: "test" });
      tick(250);

      const syncedItems = service.selectedItems();
      expect(syncedItems[0]).toBe(MOCK_ITEMS[0]); // Same reference as API item
      expect(syncedItems[1]).toBe(MOCK_ITEMS[1]); // Same reference as API item
      expect(syncedItems[0]).not.toBe(prefilledItem1); // Different reference from prefilled
      expect(syncedItems[1]).not.toBe(prefilledItem2); // Different reference from prefilled
    }));

    it("should not change selectedItems when they already reference items in the list", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });
      tick(250);

      service.setSelectedItems([MOCK_ITEMS[0], MOCK_ITEMS[1]]);

      service.setDataParams({ testParam: "test2" });
      tick(250);

      expect(service.selectedItems()[0]?.id).toBe("1");
      expect(service.selectedItems()[1]?.id).toBe("2");
    }));

    it("should only sync items that have matching IDs in the list", fakeAsync(() => {
      const prefilledItem1: TestItem = { id: "1", name: "Prefilled 1" }; // Will match
      const prefilledItem2: TestItem = { id: "unknown", name: "Unknown" }; // Won't match

      service.setSelectedItems([prefilledItem1, prefilledItem2]);

      service.setDataParams({ testParam: "test" });
      tick(250);

      const syncedItems = service.selectedItems();
      expect(syncedItems[0]).toBe(MOCK_ITEMS[0]); // Synced to API reference
      expect(syncedItems[1]).toBe(prefilledItem2); // Unchanged (no match)
    }));

    it("should not sync when selectedItems is empty", fakeAsync(() => {
      service.setSelectedItems([]);

      service.setDataParams({ testParam: "test" });
      tick(250);

      expect(service.selectedItems()).toEqual([]);
    }));

    it("should not sync when items list is empty", fakeAsync(() => {
      const emptyResponse: PageResponse<TestItem> = { content: [], last: true };
      mockDataProvider.fetchData.mockReturnValue(of(emptyResponse));

      const prefilledItems: TestItem[] = [{ id: "1", name: "Prefilled" }];
      service.setSelectedItems(prefilledItems);

      service.setDataParams({ testParam: "test" });
      tick(250);

      expect(service.selectedItems()).toBe(prefilledItems);
    }));
  });
});
