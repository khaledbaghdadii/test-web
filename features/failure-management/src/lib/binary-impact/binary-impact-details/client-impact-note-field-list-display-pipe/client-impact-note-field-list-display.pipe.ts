import { Pipe, PipeTransform } from "@angular/core";
import { ClientImpactNoteField } from "@mxflow/features/failure-management";

@Pipe({
  name: "displayClientImpactNoteListField",
})
export class DisplayClientImpactNoteListFieldPipe implements PipeTransform {
  transform(listField?: ClientImpactNoteField[]): string {
    if (listField && listField.length > 0) {
      return listField.map((field) => field.name).join(",  ");
    }
    return "-";
  }
}
