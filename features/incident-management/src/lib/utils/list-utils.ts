export class ListUtils {
  static itemsNotInSecondList(list1: string[], list2: string[]) {
    return list1.filter((s) => !list2.includes(s));
  }

  static arePermutations(list1: string[], list2: string[]) {
    return (
      list1.length == list2.length && list1.every((id) => list2.includes(id))
    );
  }
}
