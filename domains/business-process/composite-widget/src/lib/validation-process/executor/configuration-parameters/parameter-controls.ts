import { FormControl } from "@angular/forms";
import { FinalProduct } from "@mxevolve/domains/artifact/data-access";

/**
 * The final product and the two commit ids that always move with it. Every
 * configuration-parameter step that offers a final product owns all three, and
 * they are only ever written together.
 */
export interface FinalProductControls {
  readonly finalProductId: FormControl<string | null>;
  readonly configCommitId: FormControl<string | null>;
  readonly rtpCommitId: FormControl<string | null>;
}

/**
 * Legacy `handleSelectedFinalProduct`: the commits follow the product, and the
 * RTP commit falls back to the configuration commit when the product carries no
 * RTP product of its own.
 */
export function applyFinalProductSelection(
  controls: FinalProductControls,
  product: FinalProduct | undefined
): void {
  if (!product) {
    resetFinalProductSelection(controls);
    return;
  }
  controls.finalProductId.setValue(product.id, { emitEvent: false });
  controls.configCommitId.setValue(product.configurationCommitId, {
    emitEvent: false,
  });
  controls.rtpCommitId.setValue(
    product.rtpProduct?.rtpCommitId ?? product.configurationCommitId,
    { emitEvent: false }
  );
}

export function resetFinalProductSelection(
  controls: FinalProductControls
): void {
  controls.finalProductId.reset(null, { emitEvent: false });
  controls.configCommitId.reset(null, { emitEvent: false });
  controls.rtpCommitId.reset(null, { emitEvent: false });
}

/**
 * Hands a control the step borrowed back to the form: cleared, then disabled,
 * both silently. Clearing after disabling would leave the stale value in
 * `getRawValue()`, which is what the submitted payload is built from.
 */
export function releaseControl(control: FormControl<unknown>): void {
  control.reset(null, { emitEvent: false });
  control.disable({ emitEvent: false });
}
