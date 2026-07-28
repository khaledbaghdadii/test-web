import { render, screen } from "@testing-library/angular";
import { DynamicDialogConfig } from "primeng/dynamicdialog";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import {
  CommitTestExecutionsDialogComponent,
  CommitTestExecutionRow,
} from "@mxevolve/domains/scm/widget";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import { DateCellRendererComponent } from "@mxevolve/shared/ui/table";

ModuleRegistry.registerModules([AllCommunityModule]);

const MOCK_EXECUTIONS: CommitTestExecutionRow[] = [
  {
    id: "exec-1",
    projectId: "project-123",
    name: "Scenario A",
    status: ScenarioRunStatus.PASSED,
    startDate: "2024-01-15T10:00:00Z",
    endDate: "2024-01-15T12:00:00Z",
  },
  {
    id: "exec-2",
    projectId: "project-123",
    name: "Scenario B",
    status: ScenarioRunStatus.FAILED,
    startDate: "2024-01-15T09:00:00Z",
    endDate: "2024-01-15T11:00:00Z",
  },
];

function buildConfig(executions: CommitTestExecutionRow[] = MOCK_EXECUTIONS) {
  return {
    data: {
      commitId: "commit-abc",
      executions,
    },
  } as DynamicDialogConfig;
}

async function renderComponent(
  executions: CommitTestExecutionRow[] = MOCK_EXECUTIONS
) {
  return render(CommitTestExecutionsDialogComponent, {
    providers: [
      {
        provide: DynamicDialogConfig,
        useValue: buildConfig(executions),
      },
    ],
  });
}

describe("CommitTestExecutionsDialogComponent", () => {
  it("renders the executions from the dialog config", async () => {
    await renderComponent();

    expect(await screen.findByText("Scenario A")).toBeTruthy();
    expect(await screen.findByText("Scenario B")).toBeTruthy();
  });

  it("exposes rowData from dialog config", async () => {
    const { fixture } = await renderComponent();

    expect(fixture.componentInstance.rowData).toEqual(MOCK_EXECUTIONS);
  });

  it("defaults to empty rowData when executions are empty", async () => {
    const { fixture } = await renderComponent([]);

    expect(fixture.componentInstance.rowData).toEqual([]);
    expect(screen.queryByText("Scenario A")).toBeNull();
    expect(screen.queryByText("Scenario B")).toBeNull();
  });

  it("defines name and status columns", async () => {
    const { fixture } = await renderComponent();

    const fields = fixture.componentInstance.colDefs.map(
      (col) => col.field ?? col.headerName
    );

    expect(fields).toContain("name");
    expect(fields).toContain("status");
    expect(fields).toContain("startDate");
    expect(fields).toContain("endDate");
  });

  it("includes startDate and endDate columns with correct headers", async () => {
    const { fixture } = await renderComponent();

    const startDateCol = fixture.componentInstance.colDefs.find(
      (col) => col.field === "startDate"
    );
    const endDateCol = fixture.componentInstance.colDefs.find(
      (col) => col.field === "endDate"
    );

    expect(startDateCol).toBeTruthy();
    expect(startDateCol?.headerName).toBe("Start Date");
    expect(startDateCol?.cellRenderer).toBe(DateCellRendererComponent);
    expect(endDateCol).toBeTruthy();
    expect(endDateCol?.headerName).toBe("End Date");
    expect(endDateCol?.cellRenderer).toBe(DateCellRendererComponent);
  });
});
