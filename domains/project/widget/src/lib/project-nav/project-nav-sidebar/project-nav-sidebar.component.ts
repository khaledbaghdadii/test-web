import { CommonModule } from "@angular/common";
import { Component, input, linkedSignal } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { MenuItem } from "primeng/api";

/**
 * Vertical navigation sidebar that renders the children of a selected
 * top-level menu item (e.g. Project Assets, Project Setup or Settings).
 *
 * - Items without nested `items` render as leaf links.
 * - Items with nested `items` render as expandable sections with a chevron.
 *
 * The sidebar is presentational: it receives an already authorization-filtered
 * `MenuItem[]` so authorization gating stays intact upstream.
 */
@Component({
  selector: "mxevolve-project-nav-sidebar",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: "./project-nav-sidebar.component.html",
  styleUrls: ["./project-nav-sidebar.component.css"],
})
export class ProjectNavSidebarComponent {
  readonly items = input<MenuItem[]>([]);

  /** Expanded section labels; reset whenever `items` change. */
  private readonly expanded = linkedSignal<MenuItem[], Set<string>>({
    source: this.items,
    computation: (items) =>
      new Set(
        items
          .filter((item) => this.isExpandable(item) && item.label)
          .map((item) => item.label as string)
      ),
  });

  isExpandable(item: MenuItem): boolean {
    return !!item.items && item.items.length > 0;
  }

  isExpanded(item: MenuItem): boolean {
    return !!item.label && this.expanded().has(item.label);
  }

  toggle(item: MenuItem): void {
    if (!item.label) {
      return;
    }

    const label = item.label;
    this.expanded.update((current) => {
      const next = new Set(current);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }
}
