import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  computed,
  contentChildren,
  input,
  model,
  output,
  signal,
} from "@angular/core";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { MxevolveIconComponent } from "../icons/mxevolve-icon/mxevolve-icon.component";
import { MultiPageDialogPageDirective } from "./multi-page-dialog-page.directive";

/**
 * Generic, activity-agnostic multi-page dialog shell. A single PrimeNG dialog
 * instance whose body shows one of N consumer-projected pages, with internal
 * forward/back navigation and no modal-on-modal.
 *
 * The shell contains no business logic: pages are declared by the consumer via
 * `*mxevolveMultiPageDialogPage` template directives, and the header is supplied
 * through the `header` input signal. Navigation is driven by `open`, `goTo`,
 * `back` and `close`, all exposed via a template reference.
 */
@Component({
  selector: "mxevolve-multi-page-dialog",
  standalone: true,
  imports: [Dialog, PrimeTemplate, NgTemplateOutlet, MxevolveIconComponent],
  templateUrl: "./multi-page-dialog.component.html",
  styleUrl: "./multi-page-dialog.component.scss",
})
export class MultiPageDialogComponent {
  readonly visible = model<boolean>(false);
  readonly header = input<string>();

  /**
   * Optional CSS class applied to the underlying `p-dialog` host so a consumer
   * can size the dialog (e.g. the shared `dialog-cols-*` width utilities)
   * without the shell hard-coding any width. Defaults to empty, leaving the
   * generic dialog's native sizing untouched.
   */
  readonly dialogClass = input<string>("");

  /**
   * Locks the dialog while the active page is running something the user must
   * not interrupt. The X and Escape are both disabled, because closing destroys
   * the projected page while its request may still be in flight — the run would
   * be started with nothing left to report its outcome. The back chevron is
   * disabled for the same reason: navigating away swaps the projected page out,
   * which destroys it just as surely as closing.
   */
  readonly busy = input(false);

  readonly pageChange = output<string | undefined>();

  readonly pages = contentChildren(MultiPageDialogPageDirective);

  private readonly stack = signal<string[]>([]);

  readonly activePageId = computed(() => this.stack().at(-1));
  readonly canGoBack = computed(() => this.stack().length > 1);
  readonly activePage = computed(() =>
    this.pages().find((page) => page.id() === this.activePageId())
  );

  /** Opens the dialog at the given page, resetting the navigation stack. */
  open(pageId: string): void {
    this.stack.set([pageId]);
    this.visible.set(true);
    this.pageChange.emit(pageId);
  }

  /** Navigates forward to the given page, pushing it onto the stack. */
  goTo(pageId: string): void {
    this.stack.update((stack) => [...stack, pageId]);
    this.pageChange.emit(pageId);
  }

  /** Returns to the previous page in the stack. */
  back(): void {
    this.stack.update((stack) =>
      stack.length > 1 ? stack.slice(0, -1) : stack
    );
    this.pageChange.emit(this.activePageId());
  }

  /** Closes the dialog and clears the navigation stack. */
  close(): void {
    this.visible.set(false);
    this.stack.set([]);
    this.pageChange.emit(undefined);
  }

  protected onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.stack.set([]);
      this.pageChange.emit(undefined);
    }
  }
}
