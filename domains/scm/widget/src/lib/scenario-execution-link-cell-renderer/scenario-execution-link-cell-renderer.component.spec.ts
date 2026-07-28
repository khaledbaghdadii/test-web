import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { DynamicDialogRef } from "primeng/dynamicdialog";
import { ScenarioExecutionUriFactoryService } from "../../../../../../features/test-management/src/lib/execution/scenario-execution/scenario-execution-uri-factory-pipe/scenario-execution-uri-factory.service";
import { ScenarioExecutionLinkCellRendererComponent } from "./scenario-execution-link-cell-renderer.component";
import type { ICellRendererParams } from "ag-grid-enterprise";
import type { CommitTestExecutionRow } from "@mxevolve/domains/scm/widget";
import { ScenarioRunStatus } from "@mxevolve/domains/test/model";

const MOCK_ROW: CommitTestExecutionRow = {
  id: "exec-1",
  projectId: "project-123",
  name: "Scenario A",
  status: ScenarioRunStatus.PASSED,
  endDate: "2024-01-15T12:00:00Z",
};

const MOCK_URL = "/projects/project-123/test/execution/details/exec-1";

const mockUriFactoryService = {
  constructScenarioExecutionUrl: jest.fn(),
};

const mockDialogRef = {
  close: jest.fn(),
};

function makeParams(
  row?: Partial<CommitTestExecutionRow>,
  value?: string
): ICellRendererParams {
  return { data: row, value } as unknown as ICellRendererParams;
}

async function renderComponent(
  params?: ICellRendererParams,
  provideDialogRef = true
) {
  const result = await render(ScenarioExecutionLinkCellRendererComponent, {
    providers: [
      {
        provide: ScenarioExecutionUriFactoryService,
        useValue: mockUriFactoryService,
      },
      ...(provideDialogRef
        ? [{ provide: DynamicDialogRef, useValue: mockDialogRef }]
        : []),
    ],
  });

  if (params) {
    result.fixture.componentInstance.agInit(params);
    result.fixture.detectChanges();
  }

  return result;
}

describe("ScenarioExecutionLinkCellRendererComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUriFactoryService.constructScenarioExecutionUrl.mockReturnValue(
      MOCK_URL
    );
  });

  it("returns false from refresh", async () => {
    const { fixture } = await renderComponent();

    expect(fixture.componentInstance.refresh()).toBe(false);
  });

  describe("agInit", () => {
    it("renders provided value as link text when params.value is provided", async () => {
      await renderComponent(makeParams(MOCK_ROW, "Custom Label"));

      expect(screen.getByRole("link", { name: "Custom Label" })).toBeTruthy();
    });

    it("renders row name when params.value is undefined", async () => {
      await renderComponent(makeParams(MOCK_ROW));

      expect(screen.getByRole("link", { name: MOCK_ROW.name })).toBeTruthy();
    });

    it("renders a link with the generated url when row has id and projectId", async () => {
      await renderComponent(makeParams(MOCK_ROW));

      const anchor = screen.getByRole("link", {
        name: MOCK_ROW.name,
      });

      expect(anchor.getAttribute("href")).toBe(MOCK_URL);

      expect(
        mockUriFactoryService.constructScenarioExecutionUrl
      ).toHaveBeenCalledWith(MOCK_ROW.id, MOCK_ROW.projectId);
    });

    it("renders text instead of a link when row is missing id", async () => {
      await renderComponent(makeParams({ ...MOCK_ROW, id: "" }));

      expect(screen.queryByRole("link")).toBeNull();
      expect(screen.getByText(MOCK_ROW.name)).toBeTruthy();
    });

    it("renders text instead of a link when row is missing projectId", async () => {
      await renderComponent(makeParams({ ...MOCK_ROW, projectId: "" }));

      expect(screen.queryByRole("link")).toBeNull();
      expect(screen.getByText(MOCK_ROW.name)).toBeTruthy();
    });

    it("does not render a link when params.data is undefined", async () => {
      await renderComponent({} as ICellRendererParams);

      expect(screen.queryByRole("link")).toBeNull();
    });
  });

  describe("onNavigate", () => {
    it("closes the dialog ref when link is clicked", async () => {
      const user = userEvent.setup();

      await renderComponent(makeParams(MOCK_ROW));

      await user.click(screen.getByRole("link", { name: MOCK_ROW.name }));

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it("does not throw when dialogRef is not provided", async () => {
      const { fixture } = await renderComponent(makeParams(MOCK_ROW), false);

      expect(() => fixture.componentInstance.onNavigate()).not.toThrow();
    });
  });

  describe("template", () => {
    it("renders an anchor with href and target _blank when url is set", async () => {
      await renderComponent(makeParams(MOCK_ROW));

      const anchor = screen.getByRole("link", {
        name: MOCK_ROW.name,
      });

      expect(anchor.getAttribute("href")).toBe(MOCK_URL);
      expect(anchor.getAttribute("target")).toBe("_blank");
      expect(anchor.getAttribute("rel")).toBe("noopener noreferrer");
    });

    it("renders text without link when url is null", async () => {
      await renderComponent(makeParams({ ...MOCK_ROW, id: "" }));

      expect(screen.queryByRole("link")).toBeNull();
      expect(screen.getByText(MOCK_ROW.name)).toBeTruthy();
    });
  });
});
