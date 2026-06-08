import { render, screen } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import {
  MergeRequestOverview,
  MergeRequestState,
  Development,
} from "@mxevolve/domains/scm/data-access";
import { DevelopmentDetailsComponent } from "./development-details.component";
import {
  BranchDetailsCardComponent,
  MergeRequestCommitsComponent,
} from "@mxevolve/domains/scm/widget";

const MOCK_IMPORTS = [
  MockComponent(BranchDetailsCardComponent),
  MockComponent(MergeRequestCommitsComponent),
];

const MOCK_DEVELOPMENT: Development = {
  id: "dev-1",
  name: "feature/my-branch",
  source: "main",
  projectId: "project-1",
  repository: {
    id: "repo-1",
    url: "https://bitbucket.org/scm/PRJ/my-repo.git",
  },
  latestCommitId: "abc123",
  parentCommitId: "def456",
  createdOn: "2024-01-01",
  deleted: false,
};

async function renderComponent(
  inputs: Partial<{
    development: Development;
    mergeRequest: MergeRequestOverview;
    commitsBehindCount: number;
  }> = {}
) {
  return render(DevelopmentDetailsComponent, {
    imports: MOCK_IMPORTS,
    componentInputs: {
      development: MOCK_DEVELOPMENT,
      ...inputs,
    },
  });
}

describe("DevelopmentDetailsComponent", () => {
  it("renders the branch details card", async () => {
    await renderComponent();

    expect(
      document.querySelector("mxevolve-branch-details-card-widget")
    ).toBeTruthy();
  });

  it("renders the commits difference widget", async () => {
    await renderComponent();

    expect(
      document.querySelector("mxevolve-merge-request-commits")
    ).toBeTruthy();
  });

  it("passes development to the branch details card", async () => {
    const { fixture } = await renderComponent();

    const branchCard = ngMocks.find(fixture, BranchDetailsCardComponent);
    expect(branchCard.componentInstance.development).toEqual(MOCK_DEVELOPMENT);
  });

  it("passes development to the commits difference widget", async () => {
    const { fixture } = await renderComponent();

    const commitsDiff = ngMocks.find(fixture, MergeRequestCommitsComponent);
    expect(commitsDiff.componentInstance.development).toEqual(MOCK_DEVELOPMENT);
  });

  it("passes mergeRequest to the commits difference widget", async () => {
    const mergeRequest: MergeRequestOverview = {
      pullRequestId: "pr-999",
      mergeRequestState: MergeRequestState.MERGED,
    };
    const { fixture } = await renderComponent({ mergeRequest });

    const commitsDiff = ngMocks.find(fixture, MergeRequestCommitsComponent);
    expect(commitsDiff.componentInstance.mergeRequest).toEqual(mergeRequest);
  });

  it("passes undefined mergeRequest to the commits difference widget by default", async () => {
    const { fixture } = await renderComponent();

    const commitsDiff = ngMocks.find(fixture, MergeRequestCommitsComponent);
    expect(commitsDiff.componentInstance.mergeRequest).toBeUndefined();
  });

  it("emits errorOccurred when the branch details card reports an error", async () => {
    const { fixture } = await renderComponent();
    const spy = jest.fn();
    fixture.componentInstance.errorOccurred.subscribe(spy);

    ngMocks
      .find(fixture, BranchDetailsCardComponent)
      .componentInstance.errorOccurred.emit("branch error");

    expect(spy).toHaveBeenCalledWith("branch error");
  });

  it("emits errorOccurred when the commits difference widget reports an error", async () => {
    const { fixture } = await renderComponent();
    const spy = jest.fn();
    fixture.componentInstance.errorOccurred.subscribe(spy);

    ngMocks
      .find(fixture, MergeRequestCommitsComponent)
      .componentInstance.errorOccurred.emit("commits error");

    expect(spy).toHaveBeenCalledWith("commits error");
  });

  describe("commits behind warning", () => {
    it("shows warning message when commitsBehindCount > 0", async () => {
      await renderComponent({ commitsBehindCount: 3 });

      expect(screen.getByText(/You are/)).toBeTruthy();
      expect(screen.getByText("3")).toBeTruthy();
      expect(screen.getByText(/commits behind/)).toBeTruthy();
      expect(screen.getByText(/main/)).toBeTruthy();
    });

    it('uses singular "commit" when commitsBehindCount is 1', async () => {
      await renderComponent({ commitsBehindCount: 1 });

      expect(screen.getByText(/commit behind/)).toBeTruthy();
    });

    it("does not show warning message when commitsBehindCount is 0", async () => {
      await renderComponent({ commitsBehindCount: 0 });

      expect(screen.queryByText(/You are/)).toBeNull();
    });
  });
});
