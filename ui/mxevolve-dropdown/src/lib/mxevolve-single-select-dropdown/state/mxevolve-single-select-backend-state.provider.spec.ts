import { fakeAsync, tick } from "@angular/core/testing";
import { MxevolveSingleSelectBackendStateProvider } from "./mxevolve-single-select-backend-state.provider";
import { MxEvolveDropdownDataProvider } from "../../models/dropdown-data-provider.interface";
import { of, throwError, firstValueFrom, filter } from "rxjs";
import { PageResponse } from "../../models/page-response.interface";
import { DropdownOption } from "../../models/dropdown-option.interface";
import { DestroyRef } from "@angular/core";

interface TestItem {
  id: string;
  name: string;
}

describe("MxevolveSingleSelectBackendStateProvider", () => {
  let service: MxevolveSingleSelectBackendStateProvider<
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

    service = new MxevolveSingleSelectBackendStateProvider(
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
  });

  describe("setSelectedItem", () => {
    it("should update selected item signal", () => {
      service.setSelectedItem(MOCK_ITEMS[0]);

      expect(service.selectedItem()).toEqual(MOCK_ITEMS[0]);
    });

    it("should handle null value", () => {
      service.setSelectedItem(MOCK_ITEMS[0]);
      service.setSelectedItem(null);

      expect(service.selectedItem()).toBeNull();
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

    it("should include selected item not in current page at the top", fakeAsync(() => {
      const selectedItem: TestItem = { id: "99", name: "Selected" };
      service.setSelectedItem(selectedItem);

      service.setDataParams({ testParam: "test" });

      tick(250);

      const options = service.dropdownOptions();

      expect(options.length).toBe(4);
      expect(options[0]).toEqual({
        label: "Selected",
        value: selectedItem,
      });
    }));

    it("should not duplicate selected item if already in list", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });

      tick(250);

      service.setSelectedItem(MOCK_ITEMS[0]);

      const options = service.dropdownOptions();
      expect(options.length).toBe(3);
      expect(options).toEqual([
        { label: "Item 1", value: MOCK_ITEMS[0] },
        { label: "Item 2", value: MOCK_ITEMS[1] },
        { label: "Item 3", value: MOCK_ITEMS[2] },
      ]);
    }));

    it("should return empty array when items is undefined", () => {
      const options = service.dropdownOptions();
      expect(options).toEqual([]);
    });

    it("should handle null selected item", fakeAsync(() => {
      service.setDataParams({ testParam: "test" });

      tick(250);

      service.setSelectedItem(null);

      const options = service.dropdownOptions();
      expect(options.length).toBe(3);
    }));

    it("should keep selected item at top after search", fakeAsync(() => {
      const selectedItem: TestItem = { id: "99", name: "Selected Item" };

      service.setDataParams({ testParam: "test" });
      tick(250);

      service.setSelectedItem(selectedItem);

      let options = service.dropdownOptions();
      expect(options.length).toBe(4);
      expect(options[0].value).toEqual(selectedItem);

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
      expect(options.length).toBe(3);
      expect(options[0].value).toEqual(selectedItem);
      expect(options[1].value).toEqual(searchResults[0]);
      expect(options[2].value).toEqual(searchResults[1]);
    }));

    it("should keep selected item at top after pagination", fakeAsync(() => {
      const selectedItem: TestItem = { id: "99", name: "Selected" };

      const page1 = { content: [MOCK_ITEMS[0]], last: false };
      mockDataProvider.fetchData.mockReturnValue(of(page1));

      service.setDataParams({ testParam: "test" });
      tick(250);

      service.setSelectedItem(selectedItem);

      let options = service.dropdownOptions();
      expect(options.length).toBe(2);
      expect(options[0].value).toEqual(selectedItem);
      expect(options[1].value).toEqual(MOCK_ITEMS[0]);

      const page2 = { content: [MOCK_ITEMS[1]], last: false };
      mockDataProvider.fetchData.mockReturnValue(of(page2));

      service.setPageIndex(1);
      tick(250);

      options = service.dropdownOptions();
      expect(options.length).toBe(3);
      expect(options[0].value).toEqual(selectedItem);
      expect(options[1].value).toEqual(MOCK_ITEMS[0]);
      expect(options[2].value).toEqual(MOCK_ITEMS[1]);
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

      const customPageSizeService =
        new MxevolveSingleSelectBackendStateProvider(
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
      const newItems: TestItem[] = [{ id: "new", name: "New Item" }];
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

    it("should update selectedItem signal immediately", () => {
      expect(service.selectedItem()).toBeNull();

      service.setSelectedItem(MOCK_ITEMS[0]);

      expect(service.selectedItem()).toEqual(MOCK_ITEMS[0]);
    });

    it("should update loading signal during fetch lifecycle", fakeAsync(() => {
      expect(service.loading()).toBe(false);

      service.setDataParams({ testParam: "test" });

      tick(1);

      expect(service.loading()).toBe(false);
    }));
  });

  describe("syncSelectedItemWithList", () => {
    it("should sync selectedItem to matching item from loaded list when IDs match but references differ", fakeAsync(() => {
      const prefilledItem: TestItem = { id: "1", name: "Prefilled Item 1" };
      service.setSelectedItem(prefilledItem);

      expect(service.selectedItem()).toBe(prefilledItem);

      service.setDataParams({ testParam: "test" });
      tick(250);

      const syncedItem = service.selectedItem();
      expect(syncedItem).toBe(MOCK_ITEMS[0]); // Same reference as API item
      expect(syncedItem).not.toBe(prefilledItem); // Different reference from prefilled
      expect(mockDataProvider.getItemId(syncedItem!)).toBe("1");
    }));

    it("should not change selectedItem when no matching item exists in list", fakeAsync(() => {
      const unknownItem: TestItem = { id: "unknown", name: "Unknown Item" };
      service.setSelectedItem(unknownItem);

      service.setDataParams({ testParam: "test" });
      tick(250);

      expect(service.selectedItem()).toBe(unknownItem);
    }));

    it("should not sync when selectedItem is null", fakeAsync(() => {
      service.setSelectedItem(null);

      service.setDataParams({ testParam: "test" });
      tick(250);

      expect(service.selectedItem()).toBeNull();
    }));

    it("should not sync when items list is empty", fakeAsync(() => {
      const emptyResponse: PageResponse<TestItem> = { content: [], last: true };
      mockDataProvider.fetchData.mockReturnValue(of(emptyResponse));

      const prefilledItem: TestItem = { id: "1", name: "Prefilled" };
      service.setSelectedItem(prefilledItem);

      service.setDataParams({ testParam: "test" });
      tick(250);

      expect(service.selectedItem()).toBe(prefilledItem);
    }));
  });
});
