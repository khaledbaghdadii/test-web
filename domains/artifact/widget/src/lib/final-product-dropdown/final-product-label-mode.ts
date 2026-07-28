/**
 * How a final product is labelled in the dropdown.
 *
 * Mirrors the legacy `FinalProductDropdownInputLabelMode`
 * (`web/libs/features/artifact-manager/src/lib/final-product/final-product-dropdown-input/final-product-dropdown-input-label-mode.ts`).
 */
export enum FinalProductLabelMode {
  /** `<commitId> <commit message>`, prefixed with `HEAD-` on the branch head. */
  COMMIT_ID = "COMMIT_ID",
  /** The final product tag alone. */
  TAG = "TAG",
  /** `<tag>-<commitId> <commit message>`. */
  TAG_COMMIT_ID = "TAG_COMMIT_ID",
}
