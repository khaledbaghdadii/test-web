import { AbstractControl, ValidatorFn } from "@angular/forms";
import { Observable, forkJoin, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { BranchDetailsError, BranchService, GetBranchDetailsRequest } from "@mxevolve/domains/scm/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";

/**
 * Eager resolution of the values a Process Template pre-fills into a run form
 * (VAL-27132 workstream W1).
 *
 * Legacy got this for free: `mxevolve-definition-input` gated visibility with
 * `@if (shouldShow)` around an `<ng-content>`, so the projected selector was
 * instantiated as part of the *parent's* view and ran `ngOnInit` — and therefore
 * fetched its entity — whether or not the field was actually shown. A pre-filled
 * id pointing at something deleted produced a toast and left the control invalid,
 * so Execute never enabled.
 *
 * The new architecture gates visibility with a structural `@if` in the executor
 * (locked decision D4), so a hidden field's component is never created and never
 * fetches. These helpers replace that lost side effect explicitly: the executor
 * resolves every pre-filled value once when the form is built, and a value that
 * no longer resolves is flagged here.
 *
 * A miss attaches a *validator* rather than calling `setErrors`, because
 * `setErrors` is wiped by the next `updateValueAndValidity()` on that control —
 * and the executors do call it (e.g. the Build & Test skip toggle revalidates
 * `buildScenarioDefinitionId` on every toggle), which would silently re-enable
 * the form with a dead value still in it.
 */

/**
 * Error key carrying the "this pre-filled value no longer resolves" message.
 * The payload is a string, so `DefinitionInputComponent` surfaces it through its
 * string-error fall-through once the control is dirty.
 */
export const DEAD_PREFILL_ERROR = "prefillMissing";

/**
 * Used when a lookup fails without a usable message. "Process Template" is the
 * user-facing name for a BP definition (VAL-27132 name mapping).
 */
export const PREFILL_LOOKUP_FAILED = "Could not resolve a value pre-filled by the Process Template.";

/**
 * Used when the branch-existence lookup itself fails, i.e. anything other than
 * the 404 that legitimately means "this branch does not exist". Deliberately
 * generic instead of relaying the backend text (divergence register KEEP-2).
 */
export const BRANCH_CHECK_FAILED = "Couldn't validate the branch. Please try again.";

/** A pre-filled value that could not be resolved, and why. */
export interface DeadPrefill {
  readonly value: string;
  readonly message: string;
}

/**
 * Reports {@link DEAD_PREFILL_ERROR} for as long as any of `deadValues` is still
 * held by the control, and clears itself once the value changes to something
 * else. Being a validator (rather than a one-shot `setErrors`) is what makes it
 * survive the revalidation the executors trigger for unrelated reasons.
 */
export function deadPrefillValidator(deadValues: readonly string[], message: string): ValidatorFn {
  const dead = new Set(deadValues);
  return (control: AbstractControl) =>
    prefilledIds(control.value).some((value) => dead.has(value)) ? { [DEAD_PREFILL_ERROR]: message } : null;
}

/**
 * The ids a control's value refers to: a bare id, every entry of an array, or the
 * `id` of an object value (the factory-product shape). Empty means nothing was
 * pre-filled, so there is nothing to resolve.
 *
 * Shared by the call sites and by {@link deadPrefillValidator}, so that what gets
 * looked up and what the validator later compares against cannot drift apart.
 */
export function prefilledIds(value: unknown): readonly string[] {
  if (typeof value === "string") {
    return value ? [value] : [];
  }
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  }
  if (value && typeof value === "object") {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" && id ? [id] : [];
  }
  return [];
}

/**
 * Resolves every id a control holds, one by-id lookup each. A lookup that errors
 * means the entity is gone: the control is flagged and the error relayed to the
 * user, exactly as the legacy per-field selectors did.
 *
 * Callers pass the ids explicitly, because controls hold them in different
 * shapes — a bare id, an array of ids, or an object whose `id` is the reference.
 */
export function checkPrefilledEntities(
  control: AbstractControl,
  ids: readonly string[],
  lookup: (id: string) => Observable<unknown>,
  toast: ToastMessageService
): Observable<void> {
  if (ids.length === 0) {
    return of(undefined);
  }
  return forkJoin(
    ids.map((id) =>
      lookup(id).pipe(
        map(() => null),
        catchError((error: unknown) => of({ value: id, message: messageOf(error, PREFILL_LOOKUP_FAILED) }))
      )
    )
  ).pipe(map((results) => flagDeadPrefills(control, results.filter(isDeadPrefill), toast)));
}

/**
 * Resolves a pre-filled branch name. Unlike an entity lookup this is directional:
 * a parent branch must exist, while a branch that is about to be created must
 * not. A 404 is the meaningful "does not exist" answer; any other failure means
 * the check itself could not run, which still blocks submission (legacy left the
 * control invalid in that case too) but reports a generic message.
 *
 * Only for branch fields the executor keeps *hidden* — when a branch field is
 * shown, `BranchInputComponent` already validates its initial value and raises
 * the toast itself, and running both would report the same problem twice.
 */
export function checkPrefilledBranch(
  control: AbstractControl,
  branchService: BranchService,
  request: GetBranchDetailsRequest,
  expectation: { readonly mustExist: boolean; readonly message: string },
  toast: ToastMessageService
): Observable<void> {
  if (!request.branchName || !request.repositoryId) {
    return of(undefined);
  }
  return branchService.getBranchDetails(request).pipe(
    map(() => ({ exists: true, failed: false })),
    catchError((error: unknown) =>
      of({ exists: false, failed: !(error instanceof BranchDetailsError && error.status === 404) })
    ),
    map(({ exists, failed }) => {
      if (failed) {
        return flagDeadPrefills(control, [{ value: request.branchName, message: BRANCH_CHECK_FAILED }], toast);
      }
      if (exists !== expectation.mustExist) {
        return flagDeadPrefills(control, [{ value: request.branchName, message: expectation.message }], toast);
      }
      return undefined;
    })
  );
}

/**
 * Attaches the validator holding every dead value and relays one toast per
 * failure — legacy raised one per failing field, so a field carrying several
 * dead ids reports each of them.
 */
function flagDeadPrefills(control: AbstractControl, failures: readonly DeadPrefill[], toast: ToastMessageService): void {
  if (failures.length === 0) {
    return;
  }
  const messages = [...new Set(failures.map((failure) => failure.message))];
  control.addValidators(
    deadPrefillValidator(
      failures.map((failure) => failure.value),
      messages.join(" ")
    )
  );
  control.updateValueAndValidity({ emitEvent: false });
  messages.forEach((message) => toast.showError(message));
}

/**
 * The data-access services are not consistent about what they throw:
 * `InfraGroupService` rejects with a bare string, the others with an `Error`.
 */
function messageOf(error: unknown, fallback: string): string {
  if (typeof error === "string" && error) {
    return error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function isDeadPrefill(result: DeadPrefill | null): result is DeadPrefill {
  return result !== null;
}
