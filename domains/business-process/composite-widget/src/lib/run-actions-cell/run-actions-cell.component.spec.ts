import { render } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import {
  ExecutionFamily,
  ExecutionStatus,
} from "@mxevolve/domains/business-process/util";
import { ExecutionAbortButtonComponent } from "../execution-abort-button/execution-abort-button.component";
import { RepushModalOpenerComponent } from "../repush-modal-opener/repush-modal-opener.component";
import {
  RunActionsCellComponent,
  RunActionsCellParams,
  RunActionsRow,
} from "./run-actions-cell.component";

const MOCK_IMPORTS = [
  MockComponent(ExecutionAbortButtonComponent),
  MockComponent(RepushModalOpenerComponent),
];

const ROW: RunActionsRow = {
  projectId: "project-1",
  processId: "process-1",
  status: ExecutionStatus.RUNNING,
  familyId: ExecutionFamily.USER_STORY_BUILD_AND_TEST,
  familyName: "Build & Test",
  sourceDefinitionId: "source-1",
};

function buildParams(
  overrides: Partial<RunActionsCellParams> = {}
): RunActionsCellParams {
  return {
    data: ROW,
    api: { refreshServerSide: jest.fn() },
    ...overrides,
  } as unknown as RunActionsCellParams;
}

async function renderCell(params: RunActionsCellParams = buildParams()) {
  const result = await render(RunActionsCellComponent, {
    componentImports: MOCK_IMPORTS,
  });
  result.fixture.componentInstance.agInit(params);
  result.fixture.detectChanges();
  return result;
}

function abortButton(
  result: Awaited<ReturnType<typeof renderCell>>
): ExecutionAbortButtonComponent {
  return ngMocks.find(result.fixture, ExecutionAbortButtonComponent)
    .componentInstance;
}

function repushOpener(
  result: Awaited<ReturnType<typeof renderCell>>
): RepushModalOpenerComponent {
  return ngMocks.find(result.fixture, RepushModalOpenerComponent)
    .componentInstance;
}

describe("RunActionsCellComponent", () => {
  it("renders an abort button using the run status for active rows", async () => {
    const result = await renderCell();

    const abort = abortButton(result);
    expect(abort.projectId).toBe(ROW.projectId);
    expect(abort.processId).toBe(ROW.processId);
    expect(abort.familyId).toBe(ROW.familyId);
    expect(abort.status).toBe(ExecutionStatus.RUNNING);
  });

  it("makes the abort non-abortable on terminal history rows", async () => {
    const result = await renderCell(
      buildParams({
        data: { ...ROW, status: ExecutionStatus.PASSED },
        terminal: true,
      } as unknown as Partial<RunActionsCellParams>)
    );

    expect(abortButton(result).status).toBe(ExecutionStatus.ABORTED);
  });

  it("reloads the grid when a run is aborted", async () => {
    const params = buildParams();
    const result = await renderCell(params);

    abortButton(result).aborted.emit();

    expect(params.api.refreshServerSide).toHaveBeenCalled();
  });

  it("notifies the consumer when a run is aborted", async () => {
    const onAborted = jest.fn();
    const result = await renderCell(buildParams({ onAborted }));

    abortButton(result).aborted.emit();

    expect(onAborted).toHaveBeenCalled();
  });

  it("renders no actions when the row has no run data", async () => {
    await renderCell(
      buildParams({
        data: undefined,
      } as unknown as Partial<RunActionsCellParams>)
    );

    expect(
      document.querySelector("mxevolve-execution-abort-button")
    ).toBeNull();
    expect(
      document.querySelector(
        "mxevolve-business-process-execution-repush-modal-opener"
      )
    ).toBeNull();
  });
});
