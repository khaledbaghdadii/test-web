import { render, screen, waitFor } from "@testing-library/angular";
import { MockComponent } from "ng-mocks";
import { of, throwError } from "rxjs";
import {
  BuildAndTestExecutionsService,
  BusinessProcessDefinitionService,
} from "@mxevolve/domains/business-process/data-access";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { AgGridAngular } from "ag-grid-angular";
import {
  BuildAndTestBackportExecutionsSummaryComponent,
  BuildAndTestBackportLinkCellRendererComponent,
  BuildAndTestBackportStatusCellRendererComponent,
} from "./build-and-test-backport-executions-summary.component";

describe("BuildAndTestBackportExecutionsSummaryComponent", () => {
  const executionsService = {
    getBuildAndTestExecutions: jest.fn(),
  };
  const definitionService = {
    getBusinessProcessDefinitions: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    executionsService.getBuildAndTestExecutions.mockReturnValue(
      of({
        totalElements: 1,
        content: [
          {
            id: "exec-1",
            name: "Backport execution",
            status: ExecutionStatus.PASSED,
          },
        ],
      })
    );
    definitionService.getBusinessProcessDefinitions.mockReturnValue(
      of([
        {
          id: "definition-1",
          name: "Backport MQG",
          providedInputs: [],
        },
      ])
    );
  });

  it("fetches and exposes backport executions plus missing execution ids", async () => {
    const { fixture } = await renderComponent({
      backportExecutionIds: ["exec-1", "exec-2"],
    });

    await waitFor(() => {
      expect(executionsService.getBuildAndTestExecutions).toHaveBeenCalledWith(
        "project-1",
        { ids: ["exec-1", "exec-2"] }
      );
    });

    expect(fixture.componentInstance.backportExecutionRows()).toEqual([
      {
        id: "exec-1",
        name: "Backport execution",
        href: "/app/project-1/business-process/execution/details/exec-1",
        status: ExecutionStatus.PASSED,
      },
      {
        id: "exec-2",
        name: "exec-2",
        href: "/app/project-1/business-process/execution/details/exec-2",
        status: undefined,
      },
    ]);
  });

  it("uses legacy CI execution and definition navigation links in the grid rows", async () => {
    executionsService.getBuildAndTestExecutions.mockReturnValue(
      of({
        totalElements: 1,
        content: [
          {
            id: "user-story-build-and-test__exec-1",
            name: "Backport execution",
            status: ExecutionStatus.RUNNING,
          },
        ],
      })
    );

    const { fixture } = await renderComponent({
      backportExecutionIds: ["user-story-build-and-test__exec-1"],
      failedBackportDefinitionIds: ["definition-1"],
    });

    await waitFor(() =>
      expect(
        fixture.componentInstance.failedBackportDefinitionRows()
      ).toHaveLength(1)
    );

    expect(fixture.componentInstance.backportExecutionRows()[0].href).toBe(
      "/app/project-1/business-process/build-and-test-processes/execution/user-story-build-and-test__exec-1"
    );
    expect(fixture.componentInstance.failedBackportDefinitionRows()[0].href).toBe(
      "/app/project-1/business-process/definition/details/definition-1"
    );
  });

  it("preserves legacy family-prefixed execution routes", async () => {
    executionsService.getBuildAndTestExecutions.mockReturnValue(
      of({
        totalElements: 2,
        content: [
          {
            id: "binary-upgrade__exec-1",
            name: "Upgrade execution",
            status: ExecutionStatus.PASSED,
          },
          {
            id: "master-validation__exec-2",
            name: "Validation execution",
            status: ExecutionStatus.PASSED,
          },
        ],
      })
    );

    const { fixture } = await renderComponent({
      backportExecutionIds: ["binary-upgrade__exec-1", "master-validation__exec-2"],
    });

    await waitFor(() =>
      expect(fixture.componentInstance.backportExecutionRows()).toHaveLength(2)
    );

    expect(fixture.componentInstance.backportExecutionRows()[0].href).toBe(
      "/app/project-1/business-process/upgrade-processes/execution/binary-upgrade__exec-1"
    );
    expect(fixture.componentInstance.backportExecutionRows()[1].href).toBe(
      "/app/project-1/business-process/validation-processes/execution/master-validation__exec-2"
    );
  });

  it("renders execution name and status columns with link and status cell renderers", async () => {
    const { fixture } = await renderComponent();

    expect(
      fixture.componentInstance.executionColumnDefinitions[0].cellRenderer
    ).toBe(BuildAndTestBackportLinkCellRendererComponent);
    expect(
      fixture.componentInstance.executionColumnDefinitions[1].cellRenderer
    ).toBe(BuildAndTestBackportStatusCellRendererComponent);
    expect(
      fixture.componentInstance.failedDefinitionColumnDefinitions[0]
        .cellRenderer
    ).toBe(BuildAndTestBackportLinkCellRendererComponent);
  });

  it("places missing definition banner above tables", async () => {
    await renderComponent({
      backportExecutionIds: ["exec-1"],
      failedBackportDefinitionIds: ["definition-1", "missing-definition"],
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "These business process definitions could not be fetched and executed: missing-definition."
        )
      ).toBeInTheDocument();
    });

    expect(screen.getByText("On-Demand Backport Executions")).toBeInTheDocument();
    expect(screen.getByText("Failed to Launch Backports")).toBeInTheDocument();
  });

  it("keeps the v2 in-progress info wording when nothing has launched yet", async () => {
    await renderComponent({
      backportExecutionIds: [],
      failedBackportDefinitionIds: [],
      integrateDestinationBranch: "master",
    });

    expect(
      screen.getByText(
        "Backport processes will start after changes are integrated into master."
      )
    ).toBeInTheDocument();
  });

  it("shows legacy fetch error message when executions cannot be fetched", async () => {
    executionsService.getBuildAndTestExecutions.mockReturnValue(
      throwError(() => new Error("boom"))
    );

    await renderComponent({ backportExecutionIds: ["exec-1"] });

    await waitFor(() => {
      expect(
        screen.getByText("Failed to fetch backport executions")
      ).toBeInTheDocument();
    });
  });

  function renderComponent(
    inputs: Partial<{
      backportExecutionIds: string[];
      failedBackportDefinitionIds: string[];
      integrateDestinationBranch: string;
      backportDestinationBranches: string[];
    }> = {}
  ) {
    return render(BuildAndTestBackportExecutionsSummaryComponent, {
      inputs: {
        projectId: "project-1",
        backportExecutionIds: inputs.backportExecutionIds ?? [],
        failedBackportDefinitionIds: inputs.failedBackportDefinitionIds ?? [],
        integrateDestinationBranch: inputs.integrateDestinationBranch ?? "",
        backportDestinationBranches: inputs.backportDestinationBranches ?? [],
      },
      imports: [MockComponent(AgGridAngular)],
      componentProviders: [
        { provide: BuildAndTestExecutionsService, useValue: executionsService },
        { provide: BusinessProcessDefinitionService, useValue: definitionService },
      ],
    });
  }
});
