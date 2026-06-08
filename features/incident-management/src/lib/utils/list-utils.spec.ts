import { ListUtils } from "./list-utils";

describe("ListUtils", () => {
  describe("itemsNotInSecondList", () => {
    it("should return items in the first list that are not in the second list", () => {
      const list1 = ["1", "2", "3"];
      const list2 = ["2", "4"];
      const result = ListUtils.itemsNotInSecondList(list1, list2);
      expect(result).toEqual(["1", "3"]);
    });

    it("should return an empty array if all items in the first list are in the second list", () => {
      const list1 = ["1", "2"];
      const list2 = ["1", "2", "3"];
      const result = ListUtils.itemsNotInSecondList(list1, list2);
      expect(result).toEqual([]);
    });

    it("should return the first list if the second list is empty", () => {
      const list1 = ["1", "2", "3"];
      const list2: string[] = [];
      const result = ListUtils.itemsNotInSecondList(list1, list2);
      expect(result).toEqual(["1", "2", "3"]);
    });

    it("should return an empty array if the first list is empty", () => {
      const list1: string[] = [];
      const list2 = ["1", "2", "3"];
      const result = ListUtils.itemsNotInSecondList(list1, list2);
      expect(result).toEqual([]);
    });

    it("should return an empty array if both lists are empty", () => {
      const list1: string[] = [];
      const list2: string[] = [];
      const result = ListUtils.itemsNotInSecondList(list1, list2);
      expect(result).toEqual([]);
    });
  });

  describe("arePermutations", () => {
    it("should return true if both arrays have the same elements in the same order", () => {
      expect(ListUtils.arePermutations(["1", "2"], ["1", "2"])).toBe(true);
    });

    it("should return true if both arrays have the same elements in a different order", () => {
      expect(ListUtils.arePermutations(["1", "2"], ["2", "1"])).toBe(true);
    });

    it("should return false if first array is empty and second array is not", () => {
      expect(ListUtils.arePermutations([], ["1", "2"])).toBe(false);
    });

    it("should return false if second array is empty and first array is not", () => {
      expect(ListUtils.arePermutations(["1", "2"], [])).toBe(false);
    });

    it("should return true if both arrays are empty", () => {
      expect(ListUtils.arePermutations([], [])).toBe(true);
    });

    it("should return false if arrays have different elements", () => {
      expect(ListUtils.arePermutations(["1", "2"], ["1", "3"])).toBe(false);
    });
  });
});
