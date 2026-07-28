import { Injectable } from "@angular/core";
import type {
  BreadcrumbNode,
  BreadcrumbResponse,
} from "@mxevolve/domains/analytics/data-access";
import { constructBusinessProcessExecutionUri } from "@mxevolve/domains/business-process/util";
import type {
  BreadcrumbDropdownEntry,
  BreadcrumbItem,
} from "./breadcrumb.model";

/** Static labels for node types that never carry a resolved name. */
const STATIC_LABELS: Record<string, string> = {
  PROJECT: "Project",
  BUSINESS_PROCESS: "Business Process",
  SCENARIO: "Scenario",
  MERGE_REQUEST: "Merge Request",
  ENVIRONMENT: "Environment",
  ENVIRONMENT_REQUEST: "Environment Request",
  INFRA_ALLOCATION: "Infra Allocation",
};

/** Node types rendered with the resource's actual name. */
const NAMED_TYPES = new Set(["PROJECT", "BUSINESS_PROCESS", "SCENARIO"]);

/**
 * Turns a {@link BreadcrumbResponse} into the flat, root-to-leaf list of
 * {@link BreadcrumbItem}s the breadcrumb widget renders.
 *
 * Responsibilities:
 * - flattens the recursive `parent` chain (root first, target last);
 * - prepends the static **Home** item;
 * - builds each navigation URL on the client (per node type);
 * - renders bulk levels (nodes with siblings) as a dropdown of alternatives;
 * - disables unavailable parents and leaves the leaf (current resource) non-clickable.
 */
@Injectable({ providedIn: "root" })
export class BreadcrumbItemsBuilder {
  build(response: BreadcrumbResponse): BreadcrumbItem[] {
    const chain = this.flatten(response.target);
    this.propagateBulkAncestors(chain);
    const items: BreadcrumbItem[] = [{ label: "Home", url: "/home" }];

    chain.forEach((node, index) => {
      items.push(this.toItem(node, index === chain.length - 1));
    });

    return items;
  }

  /** Walk the `parent` chain and return the nodes ordered root → leaf. */
  private flatten(target: BreadcrumbNode): BreadcrumbNode[] {
    const nodes: BreadcrumbNode[] = [];
    let current: BreadcrumbNode | undefined = target;
    while (current) {
      nodes.unshift(current);
      current = current.parent;
    }
    return nodes;
  }

  private toItem(node: BreadcrumbNode, isLeaf: boolean): BreadcrumbItem {
    if (node.available === false) {
      return { label: this.label(node), disabled: true };
    }

    if (!isLeaf && node.siblings.length > 0) {
      return { label: this.label(node), dropdown: this.dropdown(node) };
    }

    const url = isLeaf ? undefined : this.url(node);
    return url ? { label: this.label(node), url } : { label: this.label(node) };
  }

  /** Dropdown entries for a bulk level: the representative node plus its siblings. */
  private dropdown(node: BreadcrumbNode): BreadcrumbDropdownEntry[] {
    return [node, ...node.siblings]
      .map((sibling) => ({
        label: this.entryLabel(sibling),
        url: this.url(sibling),
      }))
      .filter((entry): entry is BreadcrumbDropdownEntry => !!entry.url);
  }

  /** The breadcrumb-segment label (static for non-named types, actual name otherwise). */
  private label(node: BreadcrumbNode): string {
    if (NAMED_TYPES.has(node.type)) {
      return node.name ?? STATIC_LABELS[node.type];
    }
    return STATIC_LABELS[node.type];
  }

  /** A dropdown entry always uses the resource title when available. */
  private entryLabel(node: BreadcrumbNode): string {
    return node.name ?? STATIC_LABELS[node.type];
  }

  private url(node: BreadcrumbNode): string | undefined {
    const { projectId, id } = node;
    switch (node.type) {
      case "PROJECT":
        return `/app/${projectId}/home`;
      case "BUSINESS_PROCESS":
        return id ? this.businessProcessUrl(id, projectId) : undefined;
      case "SCENARIO":
        return id
          ? `/app/${projectId}/test/execution/details/${id}`
          : undefined;
      case "ENVIRONMENT":
        return id ? `/app/${projectId}/environments/${id}` : undefined;
      case "MERGE_REQUEST":
        return id ? `/app/${projectId}/scm/merge-requests/${id}` : undefined;
      default:
        // ENVIRONMENT_REQUEST / INFRA_ALLOCATION — static labels, no target route.
        return undefined;
    }
  }

  private businessProcessUrl(
    id: string,
    projectId: string
  ): string | undefined {
    try {
      return constructBusinessProcessExecutionUri(id, projectId);
    } catch {
      return undefined;
    }
  }

  /**
   * When the target has siblings, project each sibling's parent chain onto the
   * flattened chain so that bulk levels *above* the target also render as
   * dropdowns. Order is anchored on the leaf siblings: the ancestor of `target`
   * stays first (representative), then the ancestor of `target.siblings[0]`,
   * `target.siblings[1]`, … so BPᵢ pairs with MRᵢ.
   */
  /**
   * Find the deepest node in the chain that already carries siblings (the
   * "bulk anchor"), then walk each sibling's `parent` chain and push distinct
   * ancestors onto the representative node's `siblings` at every level above,
   * preserving the sibling order so BPᵢ pairs with MRᵢ.
   */
  private propagateBulkAncestors(chain: BreadcrumbNode[]): void {
    // Deepest level with siblings — that's the bulk anchor level.
    let anchorLevel = -1;
    for (let i = chain.length - 1; i >= 0; i--) {
      if (chain[i].siblings.length > 0) {
        anchorLevel = i;
        break;
      }
    }
    if (anchorLevel <= 0) return; // no bulk, or bulk already at root

    const anchor = chain[anchorLevel];
    const anchors = [anchor, ...anchor.siblings];

    for (let level = anchorLevel - 1; level >= 0; level--) {
      const levelsUp = anchorLevel - level;
      const representative = chain[level];

      const ancestors = anchors
        .map((a) => this.ancestorAt(a, levelsUp))
        .filter((n): n is BreadcrumbNode => !!n);

      const extras = this.dedupeOthers(ancestors, representative);
      if (extras.length > 0) {
        // Keep representative first, then extras in sibling order, then anything
        // the backend already provided at this level.
        representative.siblings = [...extras, ...representative.siblings];
      }
    }
  }

  private ancestorAt(
    node: BreadcrumbNode,
    levelsUp: number
  ): BreadcrumbNode | undefined {
    let current: BreadcrumbNode | undefined = node;
    for (let i = 0; i < levelsUp && current; i++) current = current.parent;
    return current;
  }

  private dedupeOthers(
    nodes: BreadcrumbNode[],
    representative: BreadcrumbNode
  ): BreadcrumbNode[] {
    const key = (n: BreadcrumbNode) => `${n.type}:${n.id ?? ""}`;
    const seen = new Set<string>([key(representative)]);
    const result: BreadcrumbNode[] = [];
    for (const n of nodes) {
      const k = key(n);
      if (!seen.has(k)) {
        seen.add(k);
        result.push(n);
      }
    }
    return result;
  }
}
