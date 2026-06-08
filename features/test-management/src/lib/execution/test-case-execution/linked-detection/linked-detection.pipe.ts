import { Pipe, PipeTransform } from "@angular/core";
import { LinkedDetectionData } from "../test-case-execution-with-linked-analysis-objects";

@Pipe({
  name: "linkedDetection",
})
export class LinkedDetectionPipe implements PipeTransform {
  transform(linkedDetections: LinkedDetectionData[]): string {
    return this.getLinkedDetectionDataTitles(linkedDetections);
  }

  private getLinkedDetectionDataTitles(
    linkedDetectionsData: LinkedDetectionData[]
  ): string {
    return linkedDetectionsData
      .map((linkedDetectionData) => linkedDetectionData.title)
      .join(", ");
  }
}
