import { render, screen, waitFor } from "@testing-library/angular";
import { of } from "rxjs";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { ValidationProcessArchivalUserStoriesComponent } from "./archival-user-stories.component";
import {
  ArchivalUserStoriesUpdateStatus,
  JiraDetailsService,
} from "@mxevolve/domains/business-process/data-access";

ModuleRegistry.registerModules([AllCommunityModule]);

const mockJiraDetailsService = {
  getJiraDetails: jest.fn(),
};

function jiraDetails(jiraBaseUrl: string) {
  return { projectId: "project-1", jiraProjectId: "JP", jiraBaseUrl };
}

async function renderComponent(
  archivalStatus: ArchivalUserStoriesUpdateStatus,
  jiraBaseUrl = "https://jira.example.com"
) {
  mockJiraDetailsService.getJiraDetails.mockReturnValue(
    of(jiraDetails(jiraBaseUrl))
  );
  return render(ValidationProcessArchivalUserStoriesComponent, {
    inputs: { archivalStatus, projectId: "project-1" },
    providers: [
      { provide: JiraDetailsService, useValue: mockJiraDetailsService },
    ],
  });
}

describe("ValidationProcessArchivalUserStoriesComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the not-available info message when there is no startDate", async () => {
    await renderComponent({ facedTechnicalIssues: false, result: [] });

    expect(screen.getByText(/their updates will appear here/)).toBeTruthy();
  });

  it("shows the Underway status when started but not ended", async () => {
    await renderComponent({
      startDate: "2024-01-01",
      facedTechnicalIssues: false,
      result: [],
    });

    expect(screen.getByText("Underway")).toBeTruthy();
  });

  it("shows the in-progress info message when underway", async () => {
    await renderComponent({
      startDate: "2024-01-01",
      facedTechnicalIssues: false,
      result: [],
    });

    expect(screen.getByText(/archival update is in progress/)).toBeTruthy();
  });

  it("shows the Failed status when ended with technical issues", async () => {
    await renderComponent({
      startDate: "2024-01-01",
      endDate: "2024-01-02",
      facedTechnicalIssues: true,
      result: [],
    });

    expect(
      screen.getByText("Failed. Please update issues manually")
    ).toBeTruthy();
  });

  it("shows the Done status when ended without technical issues", async () => {
    await renderComponent({
      startDate: "2024-01-01",
      endDate: "2024-01-02",
      facedTechnicalIssues: false,
      result: [],
    });

    expect(screen.getByText("Done")).toBeTruthy();
  });

  it("renders an ag-grid with one row per result item", async () => {
    await renderComponent({
      startDate: "2024-01-01",
      endDate: "2024-01-02",
      facedTechnicalIssues: false,
      result: [
        { userStoryId: "VAL-1", updated: true },
        { userStoryId: "VAL-2", updated: false },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText("VAL-1")).toBeTruthy();
      expect(screen.getByText("VAL-2")).toBeTruthy();
    });
  });

  it("renders a Jira link for a user story when the jira base URL is available", async () => {
    await renderComponent({
      startDate: "2024-01-01",
      endDate: "2024-01-02",
      facedTechnicalIssues: false,
      result: [{ userStoryId: "VAL-1", updated: true }],
    });

    expect(await screen.findByRole("link", { name: "VAL-1" })).toHaveAttribute(
      "href",
      "https://jira.example.com/browse/VAL-1"
    );
  });

  it("renders the user story id as plain text when there is no jira base URL", async () => {
    await renderComponent(
      {
        startDate: "2024-01-01",
        endDate: "2024-01-02",
        facedTechnicalIssues: false,
        result: [{ userStoryId: "VAL-2", updated: true }],
      },
      ""
    );

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "VAL-2" })).toBeNull();
      expect(screen.getByText("VAL-2")).toBeTruthy();
    });
  });

  it("shows the Updated status tag in the cell for a successfully archived user story", async () => {
    await renderComponent({
      startDate: "2024-01-01",
      endDate: "2024-01-02",
      facedTechnicalIssues: false,
      result: [{ userStoryId: "VAL-1", updated: true }],
    });

    await waitFor(() => {
      expect(screen.getByText("Updated")).toBeTruthy();
    });
  });

  it("shows the Not Updated status tag in the cell for a non-archived user story", async () => {
    await renderComponent({
      startDate: "2024-01-01",
      endDate: "2024-01-02",
      facedTechnicalIssues: false,
      result: [{ userStoryId: "VAL-1", updated: false }],
    });

    await waitFor(() => {
      expect(screen.getByText("Not Updated")).toBeTruthy();
    });
  });

  it("shows the Underway status tag in each cell when the archival is still underway", async () => {
    await renderComponent({
      startDate: "2024-01-01",
      facedTechnicalIssues: false,
      result: [
        { userStoryId: "VAL-1", updated: false },
        { userStoryId: "VAL-2", updated: true },
      ],
    });

    await waitFor(() => {
      const underwayEls = screen.getAllByText("Underway");
      // at least one in the status header, one per row
      expect(underwayEls.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("shows 'No user stories were found' when the result is empty and archival has started", async () => {
    await renderComponent({
      startDate: "2024-01-01",
      endDate: "2024-01-02",
      facedTechnicalIssues: false,
      result: [],
    });

    await waitFor(() => {
      expect(screen.getByText("No user stories")).toBeTruthy();
    });
  });

  it("shows pagination controls when there are more than 10 rows", async () => {
    const result = Array.from({ length: 11 }, (_, i) => ({
      userStoryId: `VAL-${i + 1}`,
      updated: true,
    }));

    await renderComponent({
      startDate: "2024-01-01",
      endDate: "2024-01-02",
      facedTechnicalIssues: false,
      result,
    });

    await waitFor(() => {
      expect(document.querySelector(".ag-paging-panel")).toBeTruthy();
    });
  });

  it("does not paginate when there are 10 or fewer rows — all rows are visible", async () => {
    const result = Array.from({ length: 10 }, (_, i) => ({
      userStoryId: `VAL-${i + 1}`,
      updated: true,
    }));

    await renderComponent({
      startDate: "2024-01-01",
      endDate: "2024-01-02",
      facedTechnicalIssues: false,
      result,
    });

    // All 10 rows visible without needing to navigate pages
    await waitFor(() => {
      expect(screen.getByText("VAL-10")).toBeTruthy();
    });
  });
});
