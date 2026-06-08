import { render, screen, waitFor, within } from "@testing-library/angular";
import { TestBed } from "@angular/core/testing";
import { of, Subject } from "rxjs";
import { provideRouter } from "@angular/router";
import {
  ServiceActionsService,
  EnvironmentServiceItem,
} from "@mxevolve/domains/environment/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { ViewEnvironmentServicesDialogComponent } from "./view-environment-services-dialog.component";

const mockServiceActionsService = {
  fetchEnvironmentServices: jest.fn(),
};

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  clearErrors: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "proj-001",
  environmentId: "env-001",
  visible: true,
};

const MOCK_SERVICES: EnvironmentServiceItem[] = [
  {
    name: "SVC001",
    nickname: "Service One",
    installationCode: "INST001",
    description: "First service",
    status: "RUNNING",
  },
  {
    name: "SVC002",
    nickname: "Service Two",
    installationCode: "INST002",
    description: "Second service",
    status: "STOPPED",
  },
];

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  TestBed.overrideProvider(ToastMessageService, { useValue: mockToastService });
  return render(ViewEnvironmentServicesDialogComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      { provide: ServiceActionsService, useValue: mockServiceActionsService },
    ],
    providers: [provideRouter([])],
  });
}

function getDataRows() {
  return screen
    .queryAllByRole("row")
    .filter((row) => within(row).queryAllByRole("gridcell").length > 0);
}

describe("ViewEnvironmentServicesDialogComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(of([]));
  });

  describe("dialog visibility", () => {
    it("does not fetch services when dialog is not visible", async () => {
      await renderComponent({ visible: false });

      expect(
        mockServiceActionsService.fetchEnvironmentServices
      ).not.toHaveBeenCalled();
    });

    it("fetches services when dialog becomes visible", async () => {
      await renderComponent({ visible: true });

      expect(
        mockServiceActionsService.fetchEnvironmentServices
      ).toHaveBeenCalledWith("proj-001", "env-001");
    });
  });

  describe("column headers", () => {
    it("renders the Code column header", async () => {
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        of(MOCK_SERVICES)
      );

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByRole("columnheader", { name: "Code" })).toBeTruthy()
      );
    });

    it("renders the NickName column header", async () => {
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        of(MOCK_SERVICES)
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          screen.getByRole("columnheader", { name: "NickName" })
        ).toBeTruthy()
      );
    });

    it("renders the Installation Code column header", async () => {
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        of(MOCK_SERVICES)
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          screen.getByRole("columnheader", { name: "Installation Code" })
        ).toBeTruthy()
      );
    });

    it("renders the Description column header", async () => {
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        of(MOCK_SERVICES)
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          screen.getByRole("columnheader", { name: "Description" })
        ).toBeTruthy()
      );
    });

    it("renders the Status column header", async () => {
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        of(MOCK_SERVICES)
      );

      await renderComponent();

      await waitFor(() =>
        expect(
          screen.getByRole("columnheader", { name: "Status" })
        ).toBeTruthy()
      );
    });
  });

  describe("data rows", () => {
    it("renders a row for each service", async () => {
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        of(MOCK_SERVICES)
      );

      await renderComponent();

      await waitFor(() => expect(getDataRows()).toHaveLength(2));
    });

    it("renders no data rows when the service returns an empty list", async () => {
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        of([])
      );

      await renderComponent();

      await waitFor(() => expect(getDataRows()).toHaveLength(0));
    });

    it("displays the service name in the Code column", async () => {
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        of([MOCK_SERVICES[0]])
      );

      await renderComponent();

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[0].textContent?.trim()).toBe("SVC001");
      });
    });

    it("displays the nickname in the NickName column", async () => {
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        of([MOCK_SERVICES[0]])
      );

      await renderComponent();

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[1].textContent?.trim()).toBe("Service One");
      });
    });

    it("displays the installation code", async () => {
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        of([MOCK_SERVICES[0]])
      );

      await renderComponent();

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[2].textContent?.trim()).toBe("INST001");
      });
    });

    it("displays the description", async () => {
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        of([MOCK_SERVICES[0]])
      );

      await renderComponent();

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[3].textContent?.trim()).toBe("First service");
      });
    });

    it("displays the status", async () => {
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        of([MOCK_SERVICES[0]])
      );

      await renderComponent();

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[4].textContent?.trim()).toBe("RUNNING");
      });
    });

    it("displays a dash when a field is undefined", async () => {
      const serviceWithMissingFields: EnvironmentServiceItem = {
        name: "SVC003",
      };
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        of([serviceWithMissingFields])
      );

      await renderComponent();

      await waitFor(() => {
        const cells = within(getDataRows()[0]).getAllByRole("gridcell");
        expect(cells[1].textContent?.trim()).toBe("-");
        expect(cells[2].textContent?.trim()).toBe("-");
        expect(cells[3].textContent?.trim()).toBe("-");
        expect(cells[4].textContent?.trim()).toBe("-");
      });
    });
  });

  describe("loading state", () => {
    it("shows a loading indicator while services are being fetched", async () => {
      const subject = new Subject<EnvironmentServiceItem[]>();
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        subject
      );

      await renderComponent();

      expect(screen.getByText("Loading...")).toBeTruthy();
    });

    it("hides the loading indicator after services are loaded", async () => {
      const subject = new Subject<EnvironmentServiceItem[]>();
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        subject
      );

      await renderComponent();

      subject.next(MOCK_SERVICES);
      subject.complete();

      await waitFor(() => expect(screen.queryByText("Loading...")).toBeNull());
    });
  });

  describe("empty state", () => {
    it("shows 'No services found' when there are no services", async () => {
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        of([])
      );

      await renderComponent();

      await waitFor(() =>
        expect(screen.getByText("No services found")).toBeTruthy()
      );
    });
  });

  describe("error handling", () => {
    it("closes the dialog and shows an error toast when an error occurs", async () => {
      const subject = new Subject<EnvironmentServiceItem[]>();
      mockServiceActionsService.fetchEnvironmentServices.mockReturnValue(
        subject
      );

      const { fixture } = await renderComponent();

      // Spy on the injected toastService directly
      const toastSpy = jest.spyOn(
        fixture.componentInstance["toastService"],
        "showError"
      );

      subject.error(new Error("Fetch failed"));
      fixture.detectChanges();

      await waitFor(() =>
        expect(fixture.componentInstance.visible()).toBe(false)
      );

      expect(toastSpy).toHaveBeenCalledWith(
        "Fetch failed",
        "Failed to load environment services"
      );
    });
  });
});
