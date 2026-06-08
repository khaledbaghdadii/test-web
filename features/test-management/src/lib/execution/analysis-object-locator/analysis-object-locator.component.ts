import { Component, OnInit, inject } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AnalysisObjectLocatorType } from "./analysis-object-locator-type";
import {
  DetectionCategory,
  DetectionType,
  DetectionUriBuilderPipe,
} from "@mxflow/features/failure-management";

@Component({
  providers: [DetectionUriBuilderPipe],
  selector: "mxevolve-analysis-object-locator",
  template: "<div></div>",
})
export class AnalysisObjectLocatorComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private detectionUriBuilderPipe = inject(DetectionUriBuilderPipe);

  ngOnInit() {
    this.navigateToResource(
      this.activatedRoute.snapshot.queryParams["projectId"],
      this.activatedRoute.snapshot.queryParams["analysisObjectType"],
      this.activatedRoute.snapshot.queryParams["analysisObjectId"]
    );
  }

  private navigateToResource(
    projectId: string,
    resourceType: string,
    resourceId: string
  ) {
    switch (resourceType) {
      case AnalysisObjectLocatorType.BinaryRegression:
        this.router.navigateByUrl(
          this.detectionUriBuilderPipe.transform({
            id: resourceId,
            type: DetectionType.Binary,
            category: DetectionCategory.Regression,
          })
        );
        break;
      case AnalysisObjectLocatorType.BinaryImpact:
        this.router.navigateByUrl(
          this.detectionUriBuilderPipe.transform({
            projectId,
            id: resourceId,
            type: DetectionType.Binary,
            category: DetectionCategory.Impact,
          })
        );
        break;
      case AnalysisObjectLocatorType.ConfigurationRegression:
        this.router.navigateByUrl(
          this.detectionUriBuilderPipe.transform({
            projectId,
            id: resourceId,
            type: DetectionType.Configuration,
            category: DetectionCategory.Regression,
          })
        );
        break;
      case AnalysisObjectLocatorType.ConfigurationImpact:
        this.router.navigateByUrl(
          this.detectionUriBuilderPipe.transform({
            projectId,
            id: resourceId,
            type: DetectionType.Configuration,
            category: DetectionCategory.Impact,
          })
        );
        break;
      default:
        this.router.navigate(["/not-found"]);
    }
  }
}
