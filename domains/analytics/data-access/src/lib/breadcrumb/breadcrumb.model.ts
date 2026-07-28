/** External resource types accepted by the breadcrumb endpoint. */
export type BreadcrumbResourceType =
  | "BUSINESS_PROCESS"
  | "SCENARIO"
  | "ENVIRONMENT"
  | "ENVIRONMENT_REQUEST"
  | "INFRA_ALLOCATION"
  | "MERGE_REQUEST";

/**
 * A single breadcrumb node (the target resource or one of its ancestors).
 *
 * Mirrors the backend `BreadcrumbNodeDto`:
 * - `type` is the enum name string; `PROJECT` appears only as the root node type.
 * - `name`, `businessProcessFamily` and `parent` are omitted by the backend when null
 *   (Jackson `@JsonInclude(NON_NULL)`), so they are optional here.
 * - `available` is always present.
 * - `siblings` is always present; `[]` for single-parent levels. At a bulk level the
 *   representative node's `siblings` holds the alternative nodes for the dropdown.
 */
export interface BreadcrumbNode {
  type: BreadcrumbResourceType | "PROJECT";
  id?: string;
  name?: string;
  projectId: string;
  businessProcessFamily?: string;
  available: boolean;
  parent?: BreadcrumbNode;
  siblings: BreadcrumbNode[];
}

/** Envelope returned by the breadcrumb endpoint. `target` is the resource the user is viewing. */
export interface BreadcrumbResponse {
  target: BreadcrumbNode;
}
