import { render, screen } from "@testing-library/angular";
import { provideRouter } from "@angular/router";
import { MockComponent, ngMocks } from "ng-mocks";
import type { ICellRendererParams } from "ag-grid-enterprise";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { ExecutionStatusTagComponent } from "@mxevolve/domains/business-process/ui";
import {
  ValidationRunNameCellComponent,
  ValidationRunStatusCellComponent,
  type ValidationRunNameCellParams,
} from "./validation-activity.cells";

async function renderNameCell(params: Partial<ValidationRunNameCellParams>) {
  const result = await render(ValidationRunNameCellComponent, {
    providers: [provideRouter([])],
  });
  result.fixture.componentInstance.agInit(
    params as ValidationRunNameCellParams
  );
  result.fixture.detectChanges();
  return result;
}

async function renderStatusCell(value?: ExecutionStatus) {
  const result = await render(ValidationRunStatusCellComponent, {
    componentImports: [MockComponent(ExecutionStatusTagComponent)],
  });
  result.fixture.componentInstance.agInit({ value } as ICellRendererParams);
  result.fixture.detectChanges();
  return result;
}

describe("ValidationRunNameCellComponent", () => {
  it("links the execution name and refreshes the link when the row changes", async () => {
    const result = await renderNameCell({
      value: "First validation",
      data: { id: "exec-1" } as never,
      projectId: "project-1",
    });

    expect(
      screen.getByRole("link", { name: "First validation" })
    ).toHaveAttribute(
      "href",
      "/app/project-1/business-process/validation-processes/execution/exec-1"
    );

    expect(
      result.fixture.componentInstance.refresh({
        value: "Refreshed validation",
        data: { id: "exec-2" } as never,
        projectId: "project-2",
      })
    ).toBe(true);
    result.fixture.detectChanges();

    expect(
      screen.getByRole("link", { name: "Refreshed validation" })
    ).toHaveAttribute(
      "href",
      "/app/project-2/business-process/validation-processes/execution/exec-2"
    );
  });

  it("renders plain text when the run has no id", async () => {
    await renderNameCell({ value: "Pending validation", data: {} as never });

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Pending validation")).toBeInTheDocument();
  });
});

describe("ValidationRunStatusCellComponent", () => {
  it("renders the status badge and refreshes to the empty state", async () => {
    const result = await renderStatusCell(ExecutionStatus.RUNNING);

    expect(
      ngMocks.find(result.fixture, ExecutionStatusTagComponent)
        .componentInstance.status
    ).toBe(ExecutionStatus.RUNNING);

    expect(
      result.fixture.componentInstance.refresh({} as ICellRendererParams)
    ).toBe(true);
    result.fixture.detectChanges();

    expect(document.querySelector("mxevolve-execution-status-tag")).toBeNull();
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
