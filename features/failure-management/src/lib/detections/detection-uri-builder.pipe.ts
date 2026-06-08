import { Pipe, PipeTransform } from "@angular/core";
import { DetectionUriBuilderRequest } from "./detection-uri-builder-request.model";
import { DetectionCategory } from "./detection-category.enum";
import { DetectionType } from "./detection-type.enum";

@Pipe({
  name: "detectionUriBuilder",
  standalone: true,
})
export class DetectionUriBuilderPipe implements PipeTransform {
  transform(detection: DetectionUriBuilderRequest): string {
    const url = `detections/${detection.category.toLowerCase()}s/${detection.type.toLowerCase()}/${
      detection.id
    }`;
    if (!this.isGlobal(detection)) {
      return `/app/${detection.projectId}/${url}`;
    }
    return `/app/${url}`;
  }

  private isGlobal(detection: DetectionUriBuilderRequest) {
    return (
      detection.category === DetectionCategory.Regression &&
      detection.type === DetectionType.Binary
    );
  }
}
