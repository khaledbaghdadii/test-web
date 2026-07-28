import { render, screen } from "@testing-library/angular";
import { provideRouter } from "@angular/router";
import { MockComponent, ngMocks } from "ng-mocks";
import type { ICellRendererParams } from "ag-grid-enterprise";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { ExecutionStatusTagComponent } from "@mxevolve/domains/business-process/ui";
import {
  BuildAndTestRunNameCellComponent,
  BuildAndTestRunStatusCellComponent,
  BuildAndTestRunUserStoriesCellComponent,
  type RunNameCellParams,
  type RunUserStoriesCellParams,
} from "./build-and-test-activity.cells";

describe("BuildAndTestRunNameCellComponent", () => {
  async function renderNameCell(params: Partial<RunNameCellParams>) {
    const result = await render(BuildAndTestRunNameCellComponent, {
      providers: [provideRouter([])],
    });
    result.fixture.componentInstance.agInit(params as RunNameCellParams);
    result.fixture.detectChanges();
    return result;
  }

  it("links the run name to its execution view", async () => {
    await renderNameCell({
      value: "Nightly build",
      data: { id: "exec-1" } as never,
      projectId: "project-1",
    });

    const link = screen.getByRole("link", { name: "Nightly build" });
    expect(link).toHaveAttribute(
      "href",
      "/app/project-1/business-process/build-and-test-processes/execution/exec-1"
    );
  });

  it("shows the name as plain text when the run has no id", async () => {
    await renderNameCell({
      value: "Pending build",
      data: {} as never,
      projectId: "project-1",
    });

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Pending build")).toBeInTheDocument();
  });

  it("updates the execution link when AG Grid refreshes the row", async () => {
    const result = await renderNameCell({
      value: "Initial build",
      data: { id: "exec-1" } as never,
      projectId: "project-1",
    });

    expect(
      result.fixture.componentInstance.refresh({
        value: "Refreshed build",
        data: { id: "exec-2" } as never,
        projectId: "project-2",
      })
    ).toBe(true);
    result.fixture.detectChanges();

    expect(
      screen.getByRole("link", { name: "Refreshed build" })
    ).toHaveAttribute(
      "href",
      "/app/project-2/business-process/build-and-test-processes/execution/exec-2"
    );
  });
});

describe("BuildAndTestRunStatusCellComponent", () => {
  async function renderStatusCell(value?: ExecutionStatus) {
    const result = await render(BuildAndTestRunStatusCellComponent, {
      componentImports: [MockComponent(ExecutionStatusTagComponent)],
    });
    result.fixture.componentInstance.agInit({
      value,
    } as ICellRendererParams);
    result.fixture.detectChanges();
    return result;
  }

  it("renders the status badge for the run status", async () => {
    const result = await renderStatusCell(ExecutionStatus.RUNNING);

    expect(
      document.querySelector("mxevolve-execution-status-tag")
    ).not.toBeNull();
    expect(
      ngMocks.find(result.fixture, ExecutionStatusTagComponent)
        .componentInstance.status
    ).toBe(ExecutionStatus.RUNNING);
  });

  it("renders a dash when the run has no status", async () => {
    await renderStatusCell();

    expect(document.querySelector("mxevolve-execution-status-tag")).toBeNull();
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("updates the status badge when AG Grid refreshes the row", async () => {
    const result = await renderStatusCell(ExecutionStatus.RUNNING);

    expect(
      result.fixture.componentInstance.refresh({
        value: ExecutionStatus.PASSED,
      } as ICellRendererParams)
    ).toBe(true);
    result.fixture.detectChanges();

    expect(
      ngMocks.find(result.fixture, ExecutionStatusTagComponent)
        .componentInstance.status
    ).toBe(ExecutionStatus.PASSED);
  });
});

describe("BuildAndTestRunUserStoriesCellComponent", () => {
  async function renderUserStoriesCell(
    params: Partial<RunUserStoriesCellParams>
  ) {
    const result = await render(BuildAndTestRunUserStoriesCellComponent);
    result.fixture.componentInstance.agInit(params as RunUserStoriesCellParams);
    result.fixture.detectChanges();
    return result;
  }

  it("links each user story to its Jira issue", async () => {
    await renderUserStoriesCell({
      value: ["VAL-1", "VAL-2"],
      jiraBaseUrl: "https://jira.example.com",
    });

    expect(screen.getByRole("link", { name: /VAL-1/ })).toHaveAttribute(
      "href",
      "https://jira.example.com/browse/VAL-1"
    );
    expect(screen.getByRole("link", { name: /VAL-2/ })).toHaveAttribute(
      "href",
      "https://jira.example.com/browse/VAL-2"
    );
  });

  it("shows the ids as plain text when no Jira base url is resolved", async () => {
    await renderUserStoriesCell({
      value: ["VAL-1"],
      jiraBaseUrl: "",
    });

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("VAL-1")).toBeInTheDocument();
  });

  it("updates the Jira links when AG Grid refreshes the row", async () => {
    const result = await renderUserStoriesCell({
      value: ["VAL-1"],
      jiraBaseUrl: "https://jira.example.com",
    });

    expect(
      result.fixture.componentInstance.refresh({
        value: ["VAL-2"],
        jiraBaseUrl: "https://jira.example.com",
      } as RunUserStoriesCellParams)
    ).toBe(true);
    result.fixture.detectChanges();

    expect(screen.getByRole("link", { name: /VAL-2/ })).toHaveAttribute(
      "href",
      "https://jira.example.com/browse/VAL-2"
    );
  });
});
