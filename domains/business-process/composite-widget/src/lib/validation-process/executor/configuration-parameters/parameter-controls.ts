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

/*
 * emitEvent rule for every write below: these controls feed the executor's
 * scope-visibility snapshot (`rtpCommitId`, `parentBranchName`,
 * `archivalBranchName`) and the `mxevolve-branch-input` error state, both of
 * which are recomputed only from `valueChanges`. A silent write therefore
 * leaves a stale snapshot — the Validation-Scope-Start-Commit field can stay
 * visible and `required` after its preconditions are gone, making the form
 * unsubmittable — and a stale branch error. Legacy emitted on every one of
 * these writes (`setValue(...)` / `.reset()` with default options).
 *
 * `{ emitEvent: false }` is only for writes nothing subscribes to.
 */

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
  controls.finalProductId.setValue(product.id);
  controls.configCommitId.setValue(product.configurationCommitId);
  controls.rtpCommitId.setValue(
    product.rtpProduct?.rtpCommitId ?? product.configurationCommitId
  );
}

export function resetFinalProductSelection(
  controls: FinalProductControls
): void {
  controls.finalProductId.reset(null);
  controls.configCommitId.reset(null);
  controls.rtpCommitId.reset(null);
}

/**
 * Hands a control the step borrowed back to the form: cleared, then disabled.
 * Clearing after disabling would leave the stale value in `getRawValue()`,
 * which is what the submitted payload is built from.
 */
export function releaseControl(control: FormControl<unknown>): void {
  control.reset(null);
  control.disable({ emitEvent: false });
}
