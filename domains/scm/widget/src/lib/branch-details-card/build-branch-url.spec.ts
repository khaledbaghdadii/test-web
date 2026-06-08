import { buildBranchUrl } from "./build-branch-url";

describe("buildBranchUrl", () => {
  it("should strip .git suffix and convert SCM URL pattern", () => {
    const url = buildBranchUrl(
      "https://bitbucket.org/scm/PRJ/my-repo.git",
      "main"
    );
    expect(url).toBe(
      "https://bitbucket.org/projects/PRJ/repos/my-repo/browse?at=" +
        encodeURIComponent("refs/heads/main")
    );
  });

  it("should return browse URL without branch when branchName is undefined", () => {
    const url = buildBranchUrl("https://bitbucket.org/scm/PRJ/my-repo.git");
    expect(url).toBe("https://bitbucket.org/projects/PRJ/repos/my-repo/browse");
  });

  it("should return empty string for empty repositoryUrl", () => {
    expect(buildBranchUrl("")).toBe("");
  });

  it("should keep non-SCM URLs as-is with branch param", () => {
    const url = buildBranchUrl("https://github.com/org/repo", "develop");
    expect(url).toBe(
      "https://github.com/org/repo?at=" +
        encodeURIComponent("refs/heads/develop")
    );
  });
});
