import { render, screen } from "@testing-library/angular";
import { provideRouter } from "@angular/router";
import { MockComponent, ngMocks } from "ng-mocks";
import type { ICellRendererParams } from "ag-grid-enterprise";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { ExecutionStatusTagComponent } from "@mxevolve/domains/business-process/ui";
import {
  AllRunsNameCellComponent,
  AllRunsStatusCellComponent,
  type AllRunsNameCellParams,
} from "./all-runs-activity.cells";

describe("AllRunsNameCellComponent", () => {
  async function renderNameCell(params: Partial<AllRunsNameCellParams>) {
    const result = await render(AllRunsNameCellComponent, {
      providers: [provideRouter([])],
    });
    result.fixture.componentInstance.agInit(params as AllRunsNameCellParams);
    result.fixture.detectChanges();
    return result;
  }

  it("routes a CI execution name to the Build & Test execution view", async () => {
    await renderNameCell({
      value: "Build run",
      data: { id: "CI_PROCESS__run-1" } as never,
      projectId: "project-1",
    });

    expect(screen.getByRole("link", { name: "Build run" })).toHaveAttribute(
      "href",
      "/app/project-1/business-process/build-and-test-processes/execution/CI_PROCESS__run-1"
    );
  });

  it("routes validation and upgrade executions to their own views", async () => {
    const validation = await renderNameCell({
      value: "Validation run",
      data: { id: "MASTER_VALIDATION__run-1" } as never,
      projectId: "project-1",
    });
    expect(
      screen.getByRole("link", { name: "Validation run" })
    ).toHaveAttribute(
      "href",
      "/app/project-1/business-process/validation-processes/execution/MASTER_VALIDATION__run-1"
    );

    validation.fixture.componentInstance.refresh({
      value: "Upgrade run",
      data: {
        id: "unknown-id",
        familyId: "binary-upgrade",
      } as never,
      projectId: "project-1",
    });
    validation.fixture.detectChanges();

    expect(screen.getByRole("link", { name: "Upgrade run" })).toHaveAttribute(
      "href",
      "/app/project-1/business-process/upgrade-processes/execution/unknown-id"
    );
  });

  it("uses the legacy fallback URI for an unknown execution family", async () => {
    await renderNameCell({
      value: "Unknown run",
      data: { id: "unknown-id" } as never,
      projectId: "project-1",
    });

    expect(screen.getByRole("link", { name: "Unknown run" })).toHaveAttribute(
      "href",
      "/execution/details/unknown-id"
    );
  });

  it("routes a binary upgrade execution name to the Upgrade execution view", async () => {
    await renderNameCell({
      value: "Upgrade run",
      data: { id: "BINARY_UPGRADE__run-1" } as never,
      projectId: "project-1",
    });

    expect(screen.getByRole("link", { name: "Upgrade run" })).toHaveAttribute(
      "href",
      "/app/project-1/business-process/upgrade-processes/execution/BINARY_UPGRADE__run-1"
    );
  });

  it("renders plain text instead of a link when the execution has no id", async () => {
    await renderNameCell({
      value: "No link run",
      data: undefined as never,
      projectId: "project-1",
    });

    expect(screen.getByText("No link run")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders plain text when the data object has no id property", async () => {
    await renderNameCell({
      value: "No id run",
      data: {} as never,
      projectId: "project-1",
    });

    expect(screen.getByText("No id run")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders an empty name when no value is provided", async () => {
    await renderNameCell({
      value: undefined,
      data: { id: "CI_PROCESS__run-1" } as never,
      projectId: "project-1",
    });

    expect(screen.getByRole("link", { name: "" })).toHaveAttribute(
      "href",
      "/app/project-1/business-process/build-and-test-processes/execution/CI_PROCESS__run-1"
    );
  });

  it("defaults to an empty project id when none is provided", async () => {
    await renderNameCell({
      value: "Build run",
      data: { id: "CI_PROCESS__run-1" } as never,
      projectId: undefined as never,
    });

    expect(screen.getByRole("link", { name: "Build run" })).toHaveAttribute(
      "href",
      "/app//business-process/build-and-test-processes/execution/CI_PROCESS__run-1"
    );
  });
});

describe("AllRunsStatusCellComponent", () => {
  it("renders the shared status badge", async () => {
    const result = await render(AllRunsStatusCellComponent, {
      componentImports: [MockComponent(ExecutionStatusTagComponent)],
    });
    result.fixture.componentInstance.agInit({
      value: ExecutionStatus.RUNNING,
    } as ICellRendererParams);
    result.fixture.detectChanges();

    expect(
      ngMocks.find(result.fixture, ExecutionStatusTagComponent)
        .componentInstance.status
    ).toBe(ExecutionStatus.RUNNING);
  });

  it("renders a placeholder when no status is provided", async () => {
    const result = await render(AllRunsStatusCellComponent, {
      componentImports: [MockComponent(ExecutionStatusTagComponent)],
    });
    result.fixture.componentInstance.agInit({
      value: undefined,
    } as ICellRendererParams);
    result.fixture.detectChanges();

    expect(screen.getByText("-")).toBeInTheDocument();
    expect(
      document.querySelector("mxevolve-execution-status-tag")
    ).not.toBeInTheDocument();
  });

  it("reflects the updated status after a refresh", async () => {
    const result = await render(AllRunsStatusCellComponent, {
      componentImports: [MockComponent(ExecutionStatusTagComponent)],
    });
    result.fixture.componentInstance.agInit({
      value: ExecutionStatus.RUNNING,
    } as ICellRendererParams);
    result.fixture.detectChanges();

    result.fixture.componentInstance.refresh({
      value: ExecutionStatus.FAILED,
    } as ICellRendererParams);
    result.fixture.detectChanges();

    expect(
      ngMocks.find(result.fixture, ExecutionStatusTagComponent)
        .componentInstance.status
    ).toBe(ExecutionStatus.FAILED);
  });
});
