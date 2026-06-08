import { Development } from "@mxevolve/domains/scm/data-access";
import { DateFormatPipe } from "@mxevolve/shared/pipe";
import { CommitIdDisplayComponent } from "@mxevolve/shared/ui/primitive";
import { render, screen } from "@testing-library/angular";
import { Tooltip } from "primeng/tooltip";
import { BranchDetailsCardComponent } from "./branch-details-card.component";

const MOCK_IMPORTS = [CommitIdDisplayComponent, Tooltip, DateFormatPipe];

const MOCK_DEVELOPMENT: Development = {
  id: "dev-456",
  name: "feature/my-branch",
  source: "main",
  projectId: "project-123",
  repository: {
    id: "repo-1",
    url: "https://bitbucket.org/scm/PRJ/my-repo.git",
  },
  latestCommitId: "abcdef1234567890abcdef",
  parentCommitId: "1234567890abcdefabcd",
  createdOn: "2024-01-01",
  deleted: false,
};

async function renderComponent(development: Development = MOCK_DEVELOPMENT) {
  return render(BranchDetailsCardComponent, {
    inputs: { development },
    componentImports: MOCK_IMPORTS,
  });
}

describe("BranchDetailsCardComponent", () => {
  it("shows the Branch Details title", async () => {
    await renderComponent();

    expect(screen.getByText("Branch Details")).toBeTruthy();
  });

  describe("configuration branch name", () => {
    it("shows the branch name as a link when a repository URL is available", async () => {
      await renderComponent();

      expect(
        screen.getByRole("link", { name: MOCK_DEVELOPMENT.name })
      ).toBeTruthy();
    });

    it("links the configuration branch name to the correct branch URL", async () => {
      await renderComponent();

      const link = screen.getByRole("link", {
        name: MOCK_DEVELOPMENT.name,
      });
      expect(link.getAttribute("href")).toContain(
        encodeURIComponent("refs/heads/" + MOCK_DEVELOPMENT.name)
      );
    });

    it("opens the configuration branch link in a new tab", async () => {
      await renderComponent();

      const link = screen.getByRole("link", {
        name: MOCK_DEVELOPMENT.name,
      });
      expect(link.getAttribute("target")).toBe("_blank");
    });

    it("shows the branch name as plain text when no repository URL is configured", async () => {
      await renderComponent({
        ...MOCK_DEVELOPMENT,
        repository: { id: "repo-1", url: "" },
      });

      expect(
        screen.queryByRole("link", { name: MOCK_DEVELOPMENT.name })
      ).toBeNull();
      expect(screen.getByText(MOCK_DEVELOPMENT.name)).toBeTruthy();
    });
  });

  describe("parent branch", () => {
    it("shows the parent branch as a link when a repository URL is available", async () => {
      await renderComponent();

      expect(
        screen.getByRole("link", { name: MOCK_DEVELOPMENT.source! })
      ).toBeTruthy();
    });

    it("links the parent branch to the correct branch URL", async () => {
      await renderComponent();

      const link = screen.getByRole("link", {
        name: MOCK_DEVELOPMENT.source!,
      });
      expect(link.getAttribute("href")).toContain(
        encodeURIComponent("refs/heads/" + MOCK_DEVELOPMENT.source)
      );
    });

    it("opens the parent branch link in a new tab", async () => {
      await renderComponent();

      const link = screen.getByRole("link", {
        name: MOCK_DEVELOPMENT.source!,
      });
      expect(link.getAttribute("target")).toBe("_blank");
    });

    it("shows the parent branch as plain text when no repository URL is configured", async () => {
      await renderComponent({
        ...MOCK_DEVELOPMENT,
        repository: { id: "repo-1", url: "" },
      });

      expect(
        screen.queryByRole("link", { name: MOCK_DEVELOPMENT.source! })
      ).toBeNull();
      expect(screen.getByText(MOCK_DEVELOPMENT.source!)).toBeTruthy();
    });
  });

  describe("parent commit ID", () => {
    it("shows the truncated parent commit ID", async () => {
      await renderComponent();

      expect(
        screen.getByText(MOCK_DEVELOPMENT.parentCommitId.substring(0, 10))
      ).toBeTruthy();
    });
  });

  describe("head commit ID", () => {
    it("shows the truncated head commit ID", async () => {
      await renderComponent();

      expect(
        screen.getByText(MOCK_DEVELOPMENT.latestCommitId.substring(0, 10))
      ).toBeTruthy();
    });
  });

  describe("branch creation date", () => {
    it("shows the formatted branch creation date", async () => {
      await renderComponent();

      expect(screen.getByText("Jan 1, 2024, 12:00:00 AM")).toBeTruthy();
    });

    it("shows a dash when createdOn is empty", async () => {
      await renderComponent({ ...MOCK_DEVELOPMENT, createdOn: "" });

      expect(screen.getByText("-")).toBeTruthy();
    });
  });
});
