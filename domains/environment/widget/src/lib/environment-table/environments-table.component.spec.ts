import { render, screen, waitFor, within } from "@testing-library/angular";
import { of, Subject, throwError } from "rxjs";
import { provideRouter } from "@angular/router";
import { MessageService } from "primeng/api";
import {
  Environment,
  EnvironmentService,
} from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { EnvironmentsTableComponent } from "./environments-table.component";
import {
  ActionsCellRendererComponent,
  ActionsCellRendererParams,
} from "./cell-renderers/actions-cell-renderer.component";
import { Component } from "@angular/core";

@Component({
  selector: "mxevolve-actions-cell-renderer",
  template: "<div>Mocked Value</div>",
  standalone: true,
})
class MockActionsCellRenderer extends ActionsCellRendererComponent {}

const mockEnvironmentService = {
  fetchByEnvironmentIds: jest.fn(),
};

const REQUIRED_INPUTS = {
  environmentIds: [] as string[],
  projectId: "project-1",
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(EnvironmentsTableComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      { provide: EnvironmentService, useValue: mockEnvironmentService },
    ],
    providers: [provideRouter([]), MessageService],
    componentProperties: {
      actionsCellRendererComponent: MockActionsCellRenderer,
    },
  });
}

function getDataRows() {
  return screen
    .queryAllByRole("row")
    .filter((row) => within(row).queryAllByRole("gridcell").length > 0);
}

const MOCK_ENVIRONMENT: Environment = {
  id: "env-1",
  status: EnvironmentStatus.READY,
  projectId: "project-1",
  startDate: "2024-01-01T00:00:00Z",
  mxVersion: "1.0.0",
  mxBuildId: "build-123",
  commitId: "abc123def456xyz",
  databases: [],
};

const MOCK_ENVIRONMENT_MINIMAL: Environment = {
  id: "env-2",
  status: EnvironmentStatus.EXECUTING,
  projectId: "project-1",
  databases: [],
};

describe("EnvironmentsTableComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(of([]));
  });

  describe("column headers", () => {
    it("renders the ID column header", async () => {
      await renderComponent();

      expect(screen.getByRole("columnheader", { name: "ID" })).toBeTruthy();
    });

    it("renders the Status column header", async () => {
      await renderComponent();

      expect(screen.getByRole("columnheader", { name: "Status" })).toBeTruthy();
    });

    it("renders the Start Date column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "Start Date" })
      ).toBeTruthy();
    });

    it("renders the MX Version column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "MX Version" })
      ).toBeTruthy();
    });

    it("renders the MX Build ID column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "MX Build ID" })
      ).toBeTruthy();
    });

    it("renders the Commit ID column header", async () => {
      await renderComponent();

      expect(
        screen.getByRole("columnheader", { name: "Commit ID" })
      ).toBeTruthy();
    });
  });

  describe("data rows", () => {
    it("renders a row for each loaded environment", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT, MOCK_ENVIRONMENT_MINIMAL])
      );

      await renderComponent({ environmentIds: ["env-1", "env-2"] });

      await waitFor(() => expect(getDataRows()).toHaveLength(2));
    });

    it("renders no data rows when the service returns an empty list", async () => {
      await renderComponent();

      await waitFor(() => expect(getDataRows()).toHaveLength(0));
    });

    it("renders no data rows when the service returns an error", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        throwError(() => new Error("Service error"))
      );

      await renderComponent({ environmentIds: ["env-1"] });

      await waitFor(() => expect(getDataRows()).toHaveLength(0));
    });
  });

  it("shows a 'No environments' message when there are no environments", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(screen.getByText("No environments")).toBeTruthy()
    );
  });

  it("shows a 'No environments' message when an error occurs while fetching environments", async () => {
    mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
      throwError(() => new Error("Service error"))
    );

    await renderComponent({ environmentIds: ["env-1"] });

    await waitFor(() =>
      expect(screen.getByText("No environments")).toBeTruthy()
    );
  });

  describe("ID column", () => {
    it("renders a link with the environment ID", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT])
      );

      await renderComponent({ environmentIds: ["env-1"] });

      await waitFor(() =>
        expect(screen.getByRole("link", { name: "env-1" })).toBeTruthy()
      );
    });

    it("links to the environment detail page for the given project", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT])
      );

      await renderComponent({
        environmentIds: ["env-1"],
        projectId: "project-1",
      });

      await waitFor(() => {
        const link = screen.getByRole("link", { name: "env-1" });
        expect(link.getAttribute("href")).toBe(
          "/app/project-1/environments/env-1"
        );
      });
    });
  });

  describe("MX Version column", () => {
    it("shows the mxVersion value", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT])
      );

      await renderComponent({ environmentIds: ["env-1"] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[3].textContent?.trim()).toBe("1.0.0");
      });
    });

    it("shows a dash when mxVersion is not available", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT_MINIMAL])
      );

      await renderComponent({ environmentIds: ["env-2"] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[3].textContent?.trim()).toBe("-");
      });
    });
  });

  describe("MX Build ID column", () => {
    it("shows the mxBuildId value", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT])
      );

      await renderComponent({ environmentIds: ["env-1"] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[4].textContent?.trim()).toBe("build-123");
      });
    });

    it("shows a dash when mxBuildId is not available", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT_MINIMAL])
      );

      await renderComponent({ environmentIds: ["env-2"] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[4].textContent?.trim()).toBe("-");
      });
    });
  });

  describe("Status column", () => {
    it("shows the status value", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT])
      );

      await renderComponent({ environmentIds: ["env-1"] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(within(cells[1]).getByText("Ready")).toBeTruthy();
      });
    });
  });

  describe("Start Date column", () => {
    it("shows the formatted start date when available", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT])
      );

      await renderComponent({ environmentIds: ["env-1"] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[2].textContent?.trim()).toMatch(/2024/);
      });
    });

    it("shows a dash when start date is not available", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT_MINIMAL])
      );

      await renderComponent({ environmentIds: ["env-2"] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[2].textContent?.trim()).toBe("-");
      });
    });
  });

  describe("loading state", () => {
    it("shows a loading indicator while environments are being fetched", async () => {
      const subject = new Subject<Environment[]>();
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(subject);

      await renderComponent({ environmentIds: ["env-1"] });

      expect(screen.getByText("Loading...")).toBeTruthy();
    });

    it("hides the loading indicator after environments are loaded", async () => {
      const subject = new Subject<Environment[]>();
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(subject);

      await renderComponent({ environmentIds: ["env-1"] });

      subject.next([MOCK_ENVIRONMENT]);
      subject.complete();

      await waitFor(() => expect(screen.queryByText("Loading...")).toBeNull());
    });

    it("hides the loading indicator after a fetch error", async () => {
      const subject = new Subject<Environment[]>();
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(subject);

      await renderComponent({ environmentIds: ["env-1"] });

      subject.error(new Error("Service error"));

      await waitFor(() => expect(screen.queryByText("Loading...")).toBeNull());
    });
  });

  describe("Commit ID column", () => {
    it("renders the first 10 characters of the commit ID", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT])
      );

      await renderComponent({ environmentIds: ["env-1"] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[5].textContent?.trim()).toBe("abc123def4");
      });
    });

    it("shows a dash when commitId is not available", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT_MINIMAL])
      );

      await renderComponent({ environmentIds: ["env-2"] });

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[5].textContent?.trim()).toBe("-");
      });
    });
  });

  describe("Actions column", () => {
    let agInitSpy: jest.SpyInstance;

    beforeEach(() => {
      agInitSpy = jest.spyOn(MockActionsCellRenderer.prototype, "agInit");
    });

    afterEach(() => {
      agInitSpy.mockRestore();
    });

    it("renders the Actions column header", async () => {
      await renderComponent();

      await waitFor(() =>
        expect(
          screen.getByRole("columnheader", { name: "Actions" })
        ).toBeTruthy()
      );
    });

    it("renders the actions cell renderer for each environment", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT])
      );

      await renderComponent({ environmentIds: ["env-1"] });

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-actions-cell-renderer")
        ).toBeTruthy()
      );
    });

    it("passes the environment data to the actions cell renderer", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT])
      );

      await renderComponent({ environmentIds: ["env-1"] });

      await waitFor(() =>
        expect(agInitSpy).toHaveBeenCalledWith(
          expect.objectContaining({ data: MOCK_ENVIRONMENT })
        )
      );
    });

    it("passes the projectId to the actions cell renderer", async () => {
      mockEnvironmentService.fetchByEnvironmentIds.mockReturnValue(
        of([MOCK_ENVIRONMENT])
      );

      await renderComponent({
        environmentIds: ["env-1"],
        projectId: "project-1",
      });

      await waitFor(() =>
        expect(agInitSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            projectId: "project-1",
          } as Partial<ActionsCellRendererParams>)
        )
      );
    });
  });
});
