export class ListUtils {
  static itemsNotInSecondList(list1: string[], list2: string[]) {
    const set2 = new Set(list2);
    return list1.filter((s) => !set2.has(s));
  }

  static arePermutations(list1: string[], list2: string[]) {
    const set1 = new Set(list1);
    const set2 = new Set(list2);
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  }
}
