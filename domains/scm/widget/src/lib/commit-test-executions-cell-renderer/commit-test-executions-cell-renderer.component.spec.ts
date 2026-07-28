import { render } from "@testing-library/angular";
import { DialogService } from "primeng/dynamicdialog";
import { CommitTestExecutionsCellRendererComponent } from "./commit-test-executions-cell-renderer.component";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";
import type { ICellRendererParams } from "ag-grid-enterprise";
import type { CommitTestExecutionRow } from "@mxevolve/domains/scm/widget";

const MOCK_EXECUTIONS: CommitTestExecutionRow[] = [
  {
    id: "exec-1",
    projectId: "project-123",
    name: "Scenario A",
    status: ScenarioRunStatus.PASSED,
    endDate: "2024-01-15T12:00:00Z",
  },
];

const mockDialogService = {
  open: jest.fn(),
};

function makeParams(
  id: string,
  executions: CommitTestExecutionRow[]
): ICellRendererParams {
  return { data: { id, executions } } as unknown as ICellRendererParams;
}

async function renderComponent(params?: ICellRendererParams) {
  const result = await render(CommitTestExecutionsCellRendererComponent, {
    providers: [
      {
        provide: DialogService,
        useValue: mockDialogService,
      },
    ],
  });

  if (params) {
    result.fixture.componentInstance.agInit(params);

    // Needed because agInit is called manually by the test.
    // In production, AG Grid calls agInit.
    result.fixture.detectChanges();
  }

  return result;
}

describe("CommitTestExecutionsCellRendererComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns true from refresh", async () => {
    const { fixture } = await renderComponent();

    expect(fixture.componentInstance.refresh()).toBe(true);
  });

  describe("agInit", () => {
    it("reads executions from params.data", async () => {
      const { fixture } = await renderComponent(
        makeParams("commit-abc", MOCK_EXECUTIONS)
      );

      expect(fixture.componentInstance.executions).toEqual(MOCK_EXECUTIONS);
    });

    it("defaults to empty executions when params.data has none", async () => {
      const { fixture } = await renderComponent({
        data: { id: "commit-abc" },
      } as unknown as ICellRendererParams);

      expect(fixture.componentInstance.executions).toEqual([]);
    });

    it("defaults to empty executions when params.data is missing", async () => {
      const { fixture } = await renderComponent({} as ICellRendererParams);

      expect(fixture.componentInstance.executions).toEqual([]);
    });
  });

  describe("onClick", () => {
    it("opens the dialog with the commit ID and executions", async () => {
      const { fixture } = await renderComponent(
        makeParams("commit-abc", MOCK_EXECUTIONS)
      );

      fixture.componentInstance.onClick();

      expect(mockDialogService.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          header: "Runs on Commit ID: commit-abc",
          data: {
            commitId: "commit-abc",
            executions: MOCK_EXECUTIONS,
          },
        })
      );
    });

    it("does not open the dialog when there are no executions", async () => {
      const { fixture } = await renderComponent(makeParams("commit-abc", []));

      fixture.componentInstance.onClick();

      expect(mockDialogService.open).not.toHaveBeenCalled();
    });

    it("does not open the dialog when commit ID is empty", async () => {
      const { fixture } = await renderComponent({
        data: {
          id: "",
          executions: MOCK_EXECUTIONS,
        },
      } as unknown as ICellRendererParams);

      fixture.componentInstance.onClick();

      expect(mockDialogService.open).not.toHaveBeenCalled();
    });
  });
});
