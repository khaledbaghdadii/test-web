import { PipeTransform } from "@angular/core";

export abstract class TableSearchPipe implements PipeTransform {
  transform(value: unknown, searchValue: string): unknown {
    if (!value) return null;
    if (!searchValue) return value;
    return this.search(value, searchValue.toLocaleLowerCase().trim());
  }

  abstract search(value: unknown, searchValue: string): unknown;
}
