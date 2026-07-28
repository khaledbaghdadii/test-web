/**
 * Builds an absolute router link array from a slash-delimited relative path.
 * Links are ABSOLUTE (`/app/:projectId/...`) because the sidebars render
 * inside micro-frontend route contexts where relative links would resolve
 * against the wrong base.
 */
export function link(projectId: string, path: string): string[] {
  const segments = path.split("/").filter((segment) => segment.length > 0);
  return ["/app", projectId, ...segments];
}
