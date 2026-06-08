import { Component, Input } from "@angular/core";
import {
  ErrorAlertComponent,
  InfoAlertComponent,
  ToastMessageService,
} from "@mxflow/ui/alert";
import { FinalProductDetailsComponent } from "@mxflow/features/artifact-manager";

import {
  FinalProductFailure,
  FinalProductPublishing,
} from "./model/final-product-publishing";

@Component({
  selector: "mxevolve-final-product-publishing-component",
  templateUrl: "./final-product-publishing.component.html",
  imports: [
    InfoAlertComponent,
    ErrorAlertComponent,
    FinalProductDetailsComponent,
  ],
})
export class FinalProductPublishingComponent {
  @Input() finalProductPublishing: FinalProductPublishing;
  @Input({ required: true }) projectId: string;

  constructor(private toastMessageService: ToastMessageService) {}

  awaitingToRequestPublishing() {
    return (
      this.isPublishingNotRequested() &&
      !this.didFailToRequestPublishingFinalProduct()
    );
  }

  showFinalProductDetails() {
    return (
      this.finalProductPublishing.id &&
      !this.didFailToRequestPublishingFinalProduct()
    );
  }

  didFailToRequestPublishingFinalProduct() {
    return (
      this.finalProductPublishing?.finalProductFailure ===
      FinalProductFailure.FAILURE_PRE_PUBLISHING_REQUESTED
    );
  }

  private isPublishingNotRequested() {
    return (
      this.finalProductPublishing?.publishingStartDate &&
      !this.finalProductPublishing?.id
    );
  }

  onError(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }
}
