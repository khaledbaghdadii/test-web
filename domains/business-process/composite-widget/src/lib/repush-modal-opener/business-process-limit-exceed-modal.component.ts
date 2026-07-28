import { Component, computed, input, model } from "@angular/core";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { Button } from "primeng/button";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { IneligibilityResult } from "@mxevolve/domains/business-process/data-access";

/**
 * Displays the load-limit exceeded message when a user is not eligible to
 * repush (or execute) a business process of a given type.
 *
 * New-architecture port of the legacy
 * `mxevolve-business-process-limit-exceed-modal`.
 */
@Component({
  selector: "mxevolve-business-process-limit-exceed-modal",
  imports: [Dialog, PrimeTemplate, Button, MxevolveIconComponent],
  templateUrl: "./business-process-limit-exceed-modal.component.html",
})
export class BusinessProcessLimitExceedModalComponent {
  readonly visible = model(false);
  readonly ineligibilityResult = input<IneligibilityResult>();

  private static readonly TYPE_ID_TO_NAME_MAPPER: Record<string, string> = {
    "default-user-story-build-and-test-limit-group": "Build & Test",
    "default-binary-upgrade-limit-group": "Binary Upgrade",
    "default-master-validation-limit-group": "Master Validation",
    "infinite-limit-group": "On Demand Backport",
  };

  readonly typeName = computed(() =>
    this.getTypeName(
      this.ineligibilityResult()?.ineligibilityData["type"] as
        | string
        | undefined
    )
  );

  readonly currentRunning = computed(
    () =>
      this.ineligibilityResult()?.ineligibilityData["currentRunning"] as
        | number
        | undefined
  );

  readonly maximumSupported = computed(
    () =>
      this.ineligibilityResult()?.ineligibilityData["maximumSupported"] as
        | number
        | undefined
  );

  close(): void {
    this.visible.set(false);
  }

  private getTypeName(typeId: string | undefined): string {
    if (typeId === undefined) {
      return "";
    }
    return (
      BusinessProcessLimitExceedModalComponent.TYPE_ID_TO_NAME_MAPPER[typeId] ??
      typeId
    );
  }
}
