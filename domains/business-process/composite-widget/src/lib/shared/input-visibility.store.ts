import { Injectable, Signal, inject, signal } from "@angular/core";

/** Per-field visibility decided by an executor, keyed by definition input id. */
export type InputVisibilityMap = Readonly<Record<string, boolean>>;

/**
 * Carries an executor's per-field visibility down to its nested input groups
 * (VAL-27132 W3).
 *
 * Legacy passed `[inputAccessMode]` to every `mxevolve-definition-input`, so each
 * field decided for itself whether it was shown. The new executors make the same
 * decision once — from a definition-only probe form, so a repush seed cannot hide
 * a field — but nested groups had no way to read it and rendered unconditionally,
 * which is why a pre-filled Quality Gate, Create Branch?, archival branch, parent
 * branch, final product and config/RTP commit all reappeared in the form (V1/V2).
 *
 * Provided by the executor and injected by the groups beneath it, so the decision
 * stays in one place instead of being threaded through three component levels as
 * a growing list of inputs.
 */
@Injectable()
export class InputVisibilityStore {
  private source: Signal<InputVisibilityMap> = signal({});

  /** Called once by the executor with its own visibility map. */
  connect(source: Signal<InputVisibilityMap>): void {
    this.source = source;
  }

  /**
   * Whether a field is shown. Unknown fields default to shown, so a group that
   * asks about a field the executor does not track is never silently hidden.
   */
  shows(field: string): boolean {
    return this.source()[field] ?? true;
  }
}

/**
 * Injects the enclosing executor's store, falling back to an all-visible one
 * when there is no executor above — so an input group stays renderable on its
 * own (its spec renders it directly, with no executor to provide the store).
 */
export function injectInputVisibility(): InputVisibilityStore {
  return inject(InputVisibilityStore, { optional: true }) ?? new InputVisibilityStore();
}
