/**
 * Builds a browsable branch URL from an SCM repository URL.
 *
 * Handles Bitbucket Server `/scm/` URL patterns by converting them
 * to the `/projects/.../repos/.../browse` format. Appends the branch
 * ref as a query parameter when a branch name is provided.
 */
export function buildBranchUrl(
  repositoryUrl: string,
  branchName?: string
): string {
  if (!repositoryUrl) return "";

  let browseUrl = repositoryUrl.endsWith(".git")
    ? repositoryUrl.slice(0, -4)
    : repositoryUrl;

  const scmUrlPattern =
    /^(https?:\/\/[^/]+)\/scm\/([^/]+)\/([^/?#]+)(?:[/?#]|$)/i;
  const match = scmUrlPattern.exec(browseUrl);
  if (match) {
    const [, baseHost, projectKey, repoSlug] = match;
    browseUrl = `${baseHost}/projects/${projectKey.toUpperCase()}/repos/${repoSlug}/browse`;
  }

  if (!branchName) return browseUrl;

  return `${browseUrl}?at=${encodeURIComponent("refs/heads/" + branchName)}`;
}
