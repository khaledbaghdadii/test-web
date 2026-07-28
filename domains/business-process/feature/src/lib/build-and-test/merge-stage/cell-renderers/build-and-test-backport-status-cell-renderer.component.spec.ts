import { Component, Input } from "@angular/core";
import { render, screen } from "@testing-library/angular";
import { TestBed } from "@angular/core/testing";
import { ICellRendererParams } from "ag-grid-community";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { ExecutionStatusTagComponent } from "@mxevolve/domains/business-process/ui";
import { BuildAndTestBackportStatusCellRendererComponent } from "./build-and-test-backport-status-cell-renderer.component";

@Component({
  selector: "mxevolve-execution-status-tag",
  standalone: true,
  template: `<span data-testid="execution-status-tag">{{ status }}</span>`,
})
class MockExecutionStatusTagComponent {
  @Input() status?: ExecutionStatus;
}

describe("BuildAndTestBackportStatusCellRendererComponent", () => {
  beforeEach(() => {
    TestBed.overrideComponent(BuildAndTestBackportStatusCellRendererComponent, {
      remove: {
        imports: [ExecutionStatusTagComponent],
      },
      add: {
        imports: [MockExecutionStatusTagComponent],
      },
    });
  });

  it("renders the execution status tag when a status is provided", async () => {
    const { fixture } = await render(
      BuildAndTestBackportStatusCellRendererComponent
    );

    fixture.componentInstance.agInit({
      value: "SUCCESS" as ExecutionStatus,
    } as ICellRendererParams);
    fixture.detectChanges();

    expect(screen.getByTestId("execution-status-tag")).toHaveTextContent(
      "SUCCESS"
    );
    expect(screen.queryByText("-")).not.toBeInTheDocument();
  });

  it("renders a dash when the status is missing", async () => {
    const { fixture } = await render(
      BuildAndTestBackportStatusCellRendererComponent
    );

    fixture.componentInstance.agInit({
      value: undefined,
    } as ICellRendererParams);
    fixture.detectChanges();

    expect(screen.getByText("-")).toBeInTheDocument();
    expect(
      screen.queryByTestId("execution-status-tag")
    ).not.toBeInTheDocument();
  });

  it("updates the rendered status when refreshed", async () => {
    const { fixture } = await render(
      BuildAndTestBackportStatusCellRendererComponent
    );

    fixture.componentInstance.agInit({
      value: "PENDING" as ExecutionStatus,
    } as ICellRendererParams);
    fixture.detectChanges();

    expect(screen.getByTestId("execution-status-tag")).toHaveTextContent(
      "PENDING"
    );

    fixture.componentInstance.refresh({
      value: "FAILED" as ExecutionStatus,
    } as ICellRendererParams);
    fixture.detectChanges();

    expect(screen.getByTestId("execution-status-tag")).toHaveTextContent(
      "FAILED"
    );
  });
});
