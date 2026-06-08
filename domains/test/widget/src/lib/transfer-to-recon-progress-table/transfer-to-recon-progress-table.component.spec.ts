import { render, screen, waitFor, within } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { TableModule } from "primeng/table";
import {
  TableCheckboxFilterComponent,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { of, Subject, throwError } from "rxjs";
import {
  ReconReportTransferProgress,
  TransferToReconProgressStatus,
  TransferToReconProgressStatusDisplayValue,
} from "@mxevolve/domains/test/model";
import { ReconService } from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import { TransferToReconProgressTableComponent } from "./transfer-to-recon-progress-table.component";
import { TransferToReconStatusComponent } from "../transfer-to-recon-status/transfer-to-recon-status.component";
import { MockComponent, ngMocks } from "ng-mocks";
import { formatDate } from "@angular/common";

function getTimeFormat(date: Date): string {
  return formatDate(date, "medium", "en-US");
}

const mockReconService = {
  fetch: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
};

const MOCK_ROWS: ReconReportTransferProgress[] = [
  {
    reportPath: "/reports/recon-2024-01.xml",
    status: TransferToReconProgressStatus.PASSED,
    triggerTime: new Date("2024-01-01T09:50:00Z"),
    endTime: new Date("2024-01-01T10:50:00Z"),
  },
  {
    reportPath: "/reports/recon-2024-02.xml",
    status: TransferToReconProgressStatus.FAILED,
    triggerTime: new Date("2024-02-01T07:55:00Z"),
    errorMessage: "Connection timeout",
  },
  {
    reportPath: "/reports/recon-2024-03",
    status: TransferToReconProgressStatus.IN_PROGRESS,
    triggerTime: new Date("2024-02-02T08:00:00Z"),
  },
];

const REQUIRED_INPUTS = {
  projectId: "project-1",
  scenarioExecutionId: "scenario-exec-1",
  testExecutionId: "test-exec-1",
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(TransferToReconProgressTableComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    imports: [
      TableModule,
      TableEmptyMessageComponent,
      TableCheckboxFilterComponent,
      MockComponent(TransferToReconStatusComponent),
    ],
    componentProviders: [
      { provide: ReconService, useValue: mockReconService },
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

function getDataRows() {
  return screen
    .queryAllByRole("row")
    .filter((row) => within(row).queryAllByRole("cell").length === 4);
}

describe("TransferToReconProgressTableComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReconService.fetch.mockReturnValue(of(MOCK_ROWS));
  });

  describe("data fetching", () => {
    it("fetches transfer progress with the correct request params", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(mockReconService.fetch).toHaveBeenCalledWith({
          projectId: "project-1",
          scenarioExecutionId: "scenario-exec-1",
          testExecutionId: "test-exec-1",
        });
      });
    });

    it.each([
      { input: "projectId", value: "project-2" },
      { input: "scenarioExecutionId", value: "scenario-exec-2" },
      { input: "testExecutionId", value: "test-exec-2" },
    ])("re-fetches when $input changes", async ({ input, value }) => {
      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(mockReconService.fetch).toHaveBeenCalledTimes(1)
      );

      fixture.componentRef.setInput(input, value);

      await waitFor(() => {
        expect(mockReconService.fetch).toHaveBeenCalledWith(
          expect.objectContaining({ [input]: value })
        );
      });
    });
  });

  describe("column headers", () => {
    it("renders the Report Path column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "Report Path" })
      ).toBeTruthy();
    });

    it("renders the Status column header", async () => {
      await renderComponent();

      expect(screen.getByRole("columnheader", { name: "Status" })).toBeTruthy();
    });

    it("renders the Transfer Time column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "Transfer Time" })
      ).toBeTruthy();
    });

    it("renders the Error Message column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "Error Message" })
      ).toBeTruthy();
    });
  });

  describe("table display", () => {
    it("displays a row for each fetched entry", async () => {
      await renderComponent();

      await waitFor(() => expect(getDataRows()).toHaveLength(3));
    });

    it("renders the report path in the first column", async () => {
      await renderComponent();

      await waitFor(() => {
        const firstRow = within(getDataRows()[0]).getAllByRole("cell");
        expect(firstRow[0].textContent?.trim()).toBe(MOCK_ROWS[0].reportPath);
        const secondRow = within(getDataRows()[1]).getAllByRole("cell");
        expect(secondRow[0].textContent?.trim()).toBe(MOCK_ROWS[1].reportPath);
        const thirdRow = within(getDataRows()[2]).getAllByRole("cell");
        expect(thirdRow[0].textContent?.trim()).toBe(MOCK_ROWS[2].reportPath);
      });
    });

    it("renders the status in the second column", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => {
        const statusComponents = ngMocks.findAll(
          fixture,
          TransferToReconStatusComponent
        );
        expect(statusComponents[0].componentInstance.status).toBe(
          MOCK_ROWS[0].status
        );
        expect(statusComponents[1].componentInstance.status).toBe(
          MOCK_ROWS[1].status
        );
        expect(statusComponents[2].componentInstance.status).toBe(
          MOCK_ROWS[2].status
        );
      });
    });

    it("renders the error message when present", async () => {
      await renderComponent();

      await waitFor(() => {
        const cells = within(getDataRows()[1]).getAllByRole("cell");
        expect(cells[3].textContent?.trim()).toBe("Connection timeout");
      });
    });

    it("shows dash for null error message", async () => {
      await renderComponent();

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("cell");
        expect(cells[3].textContent?.trim()).toBe("-");
      });
    });

    it("shows triggered time in Transfer Time column when present", async () => {
      await renderComponent();

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("cell");
        expect(cells[2].textContent).toContain(
          `Triggered Time: ${getTimeFormat(MOCK_ROWS[0].triggerTime)}`
        );
      });
    });

    it("shows end time in Transfer Time column when present", async () => {
      await renderComponent();

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("cell");
        expect(cells[2].textContent).toContain(
          `End Time: ${getTimeFormat(MOCK_ROWS[0].endTime!)}`
        );
      });
    });

    it("shows duration in Transfer Time column when both dates present", async () => {
      await renderComponent();

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("cell");
        expect(cells[2].textContent).toContain("Duration: 1h 0m 0s");
      });
    });

    it("shows dash for all time fields when they are null", async () => {
      await renderComponent();

      await waitFor(() => {
        const cells = within(getDataRows()[2]).getAllByRole("cell");
        expect(cells[2].textContent).toContain("End Time: -");
        expect(cells[2].textContent).toContain("Duration: -");
      });
    });

    it("shows dash for duration when only end time is not present", async () => {
      mockReconService.fetch.mockReturnValue(of([MOCK_ROWS[1]]));
      await renderComponent();

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("cell");
        expect(cells[2].textContent).toContain("Duration: -");
      });
    });
  });

  describe("empty state", () => {
    it("shows empty message when service returns no rows", async () => {
      mockReconService.fetch.mockReturnValue(of([]));

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("No Data Available")).toBeTruthy()
      );
    });

    it("renders no data rows when service returns empty array", async () => {
      mockReconService.fetch.mockReturnValue(of([]));

      await renderComponent();

      await waitFor(() => expect(getDataRows()).toHaveLength(0));
    });
  });

  describe("error handling", () => {
    it("shows empty table when fetch fails", async () => {
      mockReconService.fetch.mockReturnValue(
        throwError(() => new Error("Network error"))
      );

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("No Data Available")).toBeTruthy()
      );
    });

    it("shows error toast when fetch fails", async () => {
      mockReconService.fetch.mockReturnValue(
        throwError(() => new Error("Network error"))
      );

      await renderComponent();

      await waitFor(() => {
        expect(mockToastMessageService.showError).toHaveBeenCalledWith(
          "Failed to load transfer progress"
        );
      });
    });
  });

  describe("refresh button", () => {
    it("shows skeleton rows only while reloading after refresh is clicked", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await waitFor(() => expect(getDataRows()).toHaveLength(3));

      const pending$ = new Subject<ReconReportTransferProgress[]>();
      mockReconService.fetch.mockReturnValue(pending$);

      await user.click(screen.getByTestId("refresh-button"));

      const rows = getDataRows();

      expect(rows).toHaveLength(5);

      rows.forEach((row) => {
        expect(row.querySelectorAll("p-skeleton")).toHaveLength(4);
      });
    });

    it("shows new data after refresh completes", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await waitFor(() => expect(getDataRows()).toHaveLength(3));

      const REFRESHED_ROWS: ReconReportTransferProgress[] = [
        {
          reportPath: "/reports/recon-refreshed.xml",
          status: TransferToReconProgressStatus.PASSED,
          triggerTime: new Date("2024-03-01T10:00:00Z"),
          endTime: new Date("2024-03-01T11:00:00Z"),
        },
      ];
      const refresh$ = new Subject<ReconReportTransferProgress[]>();
      mockReconService.fetch.mockReturnValue(refresh$);

      await user.click(screen.getByTestId("refresh-button"));

      refresh$.next(REFRESHED_ROWS);
      refresh$.complete();

      await waitFor(() => expect(getDataRows()).toHaveLength(1));
      const cells = within(getDataRows()[0]).getAllByRole("cell");
      expect(cells[0].textContent?.trim()).toBe(REFRESHED_ROWS[0].reportPath);
    });
  });

  describe("loading state", () => {
    it("renders skeleton rows while loading", async () => {
      const pending$ = new Subject<ReconReportTransferProgress[]>();
      mockReconService.fetch.mockReturnValue(pending$);

      await renderComponent();

      const skeletonRows = screen
        .queryAllByRole("row")
        .filter((row) => within(row).queryAllByRole("cell").length === 4);

      expect(skeletonRows).toHaveLength(5);

      skeletonRows.forEach((row) => {
        expect(row.querySelectorAll("p-skeleton")).toHaveLength(4);
      });
    });
  });

  describe("filtering", () => {
    it("filters rows by report path using contains match when text is typed", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await waitFor(() => expect(getDataRows()).toHaveLength(3));

      const reportPathHeader = screen.getByRole("columnheader", {
        name: /Report Path/,
      });
      await user.click(within(reportPathHeader).getByRole("button"));

      const filterInput = await screen.findByRole("textbox");
      await user.type(filterInput, "recon-2024-01");
      await user.click(screen.getByRole("button", { name: "Apply" }));

      await waitFor(() => expect(getDataRows()).toHaveLength(1));
      const cells = within(getDataRows()[0]).getAllByRole("cell");
      expect(cells[0].textContent?.trim()).toBe(MOCK_ROWS[0].reportPath);
    });

    async function openStatusFilter() {
      const user = userEvent.setup();
      const statusHeader = screen.getByRole("columnheader", { name: /Status/ });
      await user.click(within(statusHeader).getByRole("button"));
      return user;
    }

    it("opens a popup with all status options when the Status filter button is clicked", async () => {
      await renderComponent();

      await openStatusFilter();

      for (const status of Object.values(TransferToReconProgressStatus)) {
        expect(
          await screen.findByText(
            TransferToReconProgressStatusDisplayValue[status]
          )
        ).toBeTruthy();
      }
    });

    it("filters rows by status when a status checkbox is clicked", async () => {
      await renderComponent();

      await waitFor(() => expect(getDataRows()).toHaveLength(3));

      const user = await openStatusFilter();

      const completedLabel = await screen.findByText(
        TransferToReconProgressStatusDisplayValue[
          TransferToReconProgressStatus.PASSED
        ]
      );
      const completedCheckbox = within(
        completedLabel.closest(".field-checkbox") as HTMLElement
      ).getByRole("checkbox");
      await user.click(completedCheckbox);

      await waitFor(() => expect(getDataRows()).toHaveLength(1));
      const { fixture } = await renderComponent();
      await waitFor(() => {
        const statusComponents = ngMocks.findAll(
          fixture,
          TransferToReconStatusComponent
        );
        expect(statusComponents[0].componentInstance.status).toBe(
          TransferToReconProgressStatus.PASSED
        );
      });
    });

    it("filters by multiple statuses when multiple checkboxes are clicked", async () => {
      await renderComponent();

      await waitFor(() => expect(getDataRows()).toHaveLength(3));

      const user = await openStatusFilter();

      await user.click(
        within(
          (
            await screen.findByText(
              TransferToReconProgressStatusDisplayValue[
                TransferToReconProgressStatus.PASSED
              ]
            )
          ).closest(".field-checkbox") as HTMLElement
        ).getByRole("checkbox")
      );
      await user.click(
        within(
          (
            await screen.findByText(
              TransferToReconProgressStatusDisplayValue[
                TransferToReconProgressStatus.FAILED
              ]
            )
          ).closest(".field-checkbox") as HTMLElement
        ).getByRole("checkbox")
      );

      await waitFor(() => expect(getDataRows()).toHaveLength(2));
    });
  });

  it("filter by all filters combined", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await waitFor(() => expect(getDataRows()).toHaveLength(3));

    const reportPathHeader = screen.getByRole("columnheader", {
      name: /Report Path/,
    });
    await user.click(within(reportPathHeader).getByRole("button"));
    const filterInput = await screen.findByRole("textbox");
    await user.type(filterInput, ".xml");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(getDataRows()).toHaveLength(2));

    const statusHeader = screen.getByRole("columnheader", { name: /Status/ });
    await user.click(within(statusHeader).getByRole("button"));
    await user.click(
      within(
        (
          await screen.findByText(
            TransferToReconProgressStatusDisplayValue[
              TransferToReconProgressStatus.PASSED
            ]
          )
        ).closest(".field-checkbox") as HTMLElement
      ).getByRole("checkbox")
    );

    await waitFor(() => expect(getDataRows()).toHaveLength(1));
    const cells = within(getDataRows()[0]).getAllByRole("cell");
    expect(cells[0].textContent?.trim()).toBe(MOCK_ROWS[0].reportPath);
  });
});
