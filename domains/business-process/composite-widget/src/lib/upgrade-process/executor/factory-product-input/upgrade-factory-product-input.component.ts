import { Component, input } from "@angular/core";
import { FormControl } from "@angular/forms";
import {
  BipBuildIdDropdownComponent,
  BipVersionDropdownComponent,
  FactoryProductSelectionDirective,
  MxBuildIdDropdownComponent,
  MxVersionDropdownComponent,
} from "@mxevolve/domains/artifact/widget";
import { UpgradeFactoryProductValue } from "../upgrade-executor.form";

/**
 * The Upgrade executor's factory-product field: MX Version, MX Build ID, BIP
 * Version and BIP Build ID (VAL-27132 W4).
 *
 * The migration had replaced legacy's four cascading dropdowns with a single
 * flat factory-product picker, which could not express the MX/BIP breakdown the
 * form actually submits. This restores the four-dropdown block on top of
 * `FactoryProductSelectionDirective`, and reproduces the legacy wrapper's
 * key-by-key patching: each of the five outputs writes one key of the value
 * object and marks the control dirty, exactly as
 * `BusinessProcessFactoryProductSelectorComponent` did.
 *
 * Unlike legacy — which wrapped the BIP pair in `@if (mxVersion && mxBuildId)` —
 * the dependent dropdowns stay visible and disabled until their prerequisites
 * are chosen (divergence register KEEP-1, decision D2). The dropdowns already
 * bind their own `disabled` state from `FactoryProductSelectionStateService`.
 */
@Component({
  selector: "mxevolve-upgrade-factory-product-input",
  imports: [
    FactoryProductSelectionDirective,
    MxVersionDropdownComponent,
    MxBuildIdDropdownComponent,
    BipVersionDropdownComponent,
    BipBuildIdDropdownComponent,
  ],
  template: `
    <div
      mxevolveFactoryProductSelection
      class="grid grid-cols-6 gap-4"
      [projectId]="projectId()"
      [factoryProductId]="factoryProductId()"
      (factoryProductIdChange)="patch({ id: $event ?? '' })"
      (mxVersionChange)="patch({ mxVersion: $event?.version ?? '' })"
      (mxBuildIdChange)="patch({ mxBuildId: $event?.buildId ?? '' })"
      (bipVersionChange)="patch({ bipVersion: $event?.version })"
      (bipBuildIdChange)="patch({ bipBuildId: $event?.buildId })"
    >
      <div class="flex flex-col gap-1 col-span-3">
        <label [for]="inputId() + '-mx-version'" class="required"
          >MX Version</label
        >
        <mxevolve-mx-version-dropdown />
      </div>
      <div class="flex flex-col gap-1 col-span-3">
        <label [for]="inputId() + '-mx-build-id'" class="required"
          >MX Build ID</label
        >
        <mxevolve-mx-build-id-dropdown />
      </div>
      <div class="flex flex-col gap-1 col-span-3">
        <label [for]="inputId() + '-bip-version'">BIP Version</label>
        <mxevolve-bip-version-dropdown />
      </div>
      <div class="flex flex-col gap-1 col-span-3">
        <label [for]="inputId() + '-bip-build-id'">BIP Build ID</label>
        <mxevolve-bip-build-id-dropdown />
      </div>
    </div>
  `,
})
export class UpgradeFactoryProductInputComponent {
  readonly projectId = input.required<string>();
  readonly inputId = input.required<string>();
  readonly factoryProductFormControl =
    input.required<FormControl<UpgradeFactoryProductValue | null>>();

  /** Seeds the cascade from the value the definition pre-filled. */
  protected factoryProductId(): string | undefined {
    return this.factoryProductFormControl().value?.id || undefined;
  }

  /**
   * Legacy patched one key at a time and marked the control dirty on every
   * emission, so a partially-chosen product still reaches the form (and fails
   * `factoryProductAttributes()` until every required attribute is set).
   */
  protected patch(change: Partial<UpgradeFactoryProductValue>): void {
    const control = this.factoryProductFormControl();
    const current = control.value;
    control.setValue({
      id: current?.id ?? "",
      mxVersion: current?.mxVersion ?? "",
      mxBuildId: current?.mxBuildId ?? "",
      bipVersion: current?.bipVersion,
      bipBuildId: current?.bipBuildId,
      ...change,
    });
    control.markAsDirty();
  }
}
