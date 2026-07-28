import { Component, computed, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import type { MenuItem } from "primeng/api";
import { BreadcrumbModule } from "primeng/breadcrumb";
import { TieredMenuModule } from "primeng/tieredmenu";
import {
  BreadcrumbApiService,
  BreadcrumbResourceType,
} from "@mxevolve/domains/analytics/data-access";
import { BreadcrumbItemsBuilder } from "./breadcrumb-items.builder";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

/**
 * Self-contained smart breadcrumb widget.
 *
 * Given a resource type + id (+ project id) it fetches the ancestor chain from the
 * analytics breadcrumb API, builds every navigation URL on the client, and renders the
 * breadcrumb: bulk levels as dropdowns, unavailable parents disabled, and the leaf
 * (current resource) non-clickable. It may be imported as-is by any domain's pages.
 */
@Component({
  selector: "mxevolve-breadcrumb",
  standalone: true,
  imports: [
    BreadcrumbModule,
    RouterLink,
    TieredMenuModule,
    MxevolveIconComponent,
  ],
  providers: [BreadcrumbApiService],
  templateUrl: "./breadcrumb.component.html",
})
export class BreadcrumbComponent {
  readonly resourceType = input.required<BreadcrumbResourceType>();
  readonly resourceId = input.required<string>();
  readonly projectId = input.required<string>();

  private readonly api = inject(BreadcrumbApiService);
  private readonly builder = inject(BreadcrumbItemsBuilder);

  protected readonly breadcrumb = rxResource({
    params: () => ({
      projectId: this.projectId(),
      resourceType: this.resourceType(),
      resourceId: this.resourceId(),
    }),
    stream: ({ params }) =>
      this.api.getBreadcrumb(
        params.projectId,
        params.resourceType,
        params.resourceId
      ),
  });

  protected readonly items = computed<MenuItem[]>(() => {
    const response = this.breadcrumb.value();

    if (!response) {
      return [];
    }

    return this.builder.build(response).map<MenuItem>((item) => ({
      label: item.label,
      routerLink: item.url,
      disabled: item.disabled,
      expanded: !!item.dropdown,
      items: item.dropdown?.map<MenuItem>((entry) => ({
        label: entry.label,
        routerLink: entry.url,
      })),
      data: item,
    }));
  });

  protected home = computed<MenuItem | undefined>(() => {
    const items = this.items();

    return items.length
      ? {
          label: items[0].label,
          routerLink: items[0].routerLink,
        }
      : undefined;
  });

  protected breadcrumbItems = computed(() => this.items().slice(1));
}
