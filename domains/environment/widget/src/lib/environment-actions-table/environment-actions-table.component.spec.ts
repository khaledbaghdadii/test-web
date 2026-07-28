import { render } from "@testing-library/angular";
import { MockComponent } from "ng-mocks";
import { AgGridAngular } from "ag-grid-angular";
import type { ColDef, ValueGetterParams } from "ag-grid-enterprise";
import { ManagementRequest } from "@mxevolve/domains/environment/data-access";
import {
  DateCellRendererComponent,
  TableNoRowsOverlayComponent,
} from "@mxevolve/shared/ui/table";
import { EnvironmentActionsTableComponent } from "./environment-actions-table.component";
import { RequestTypeCellRendererComponent } from "./cell-renderers/request-type-cell-renderer.component";
import { RequestResultCellRendererComponent } from "./cell-renderers/request-result-cell-renderer.component";
import { RequestActionsCellRendererComponent } from "./cell-renderers/request-actions-cell-renderer.component";

const REQUIRED_INPUTS = {
  projectId: "proj-1",
  environmentId: "env-1",
  requests: [] as ManagementRequest[],
};

async function renderComponent(
  inputs: Partial<typeof REQUIRED_INPUTS> = {}
): Promise<EnvironmentActionsTableComponent> {
  const view = await render(EnvironmentActionsTableComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: [MockComponent(AgGridAngular)],
  });
  return view.fixture.componentInstance;
}

function columnByHeader(
  columns: ColDef<ManagementRequest>[],
  header: string
): ColDef<ManagementRequest> | undefined {
  return columns.find((column) => column.headerName === header);
}

describe("EnvironmentActionsTableComponent", () => {
  it("renders the Type column with the request type cell renderer", async () => {
    const component = await renderComponent();

    expect(
      columnByHeader(component.columnDefinitions(), "Type")?.cellRenderer
    ).toBe(RequestTypeCellRendererComponent);
  });

  it("passes the project id to the Type column renderer", async () => {
    const component = await renderComponent();

    const params = columnByHeader(component.columnDefinitions(), "Type")
      ?.cellRendererParams as { projectId: string };
    expect(params.projectId).toBe("proj-1");
  });

  it("labels the aborting status when aborted before a result exists", async () => {
    const component = await renderComponent();

    const statusColumn = component
      .columnDefinitions()
      .find((column) => column.colId === "status");
    const value = statusColumn?.valueGetter?.({
      data: { abortedBy: "user", resultStatus: undefined, status: "RUNNING" },
    } as ValueGetterParams<ManagementRequest>);
    expect(value).toBe("ABORTING");
  });

  it("uses the request status when no abort is in progress", async () => {
    const component = await renderComponent();

    const statusColumn = component
      .columnDefinitions()
      .find((column) => column.colId === "status");
    const value = statusColumn?.valueGetter?.({
      data: { abortedBy: undefined, resultStatus: "SUCCESS", status: "ENDED" },
    } as ValueGetterParams<ManagementRequest>);
    expect(value).toBe("ENDED");
  });

  it("renders the Result column with the result cell renderer", async () => {
    const component = await renderComponent();

    expect(
      columnByHeader(component.columnDefinitions(), "Result")?.cellRenderer
    ).toBe(RequestResultCellRendererComponent);
  });

  it("renders the Created On column with the date cell renderer", async () => {
    const component = await renderComponent();

    expect(
      columnByHeader(component.columnDefinitions(), "Created On")?.cellRenderer
    ).toBe(DateCellRendererComponent);
  });

  it("renders the actions column with the request actions cell renderer", async () => {
    const component = await renderComponent();

    const actionsColumn = component
      .columnDefinitions()
      .find((column) => column.colId === "actions");
    expect(actionsColumn?.cellRenderer).toBe(
      RequestActionsCellRendererComponent
    );
  });

  it("passes the environment id to the actions column renderer", async () => {
    const component = await renderComponent();

    const actionsColumn = component
      .columnDefinitions()
      .find((column) => column.colId === "actions");
    const params = actionsColumn?.cellRendererParams as {
      environmentId: string;
    };
    expect(params.environmentId).toBe("env-1");
  });

  it("configures the empty grid message", async () => {
    const component = await renderComponent();

    expect(component.noRowsOverlayComponent).toBe(TableNoRowsOverlayComponent);
  });
});
