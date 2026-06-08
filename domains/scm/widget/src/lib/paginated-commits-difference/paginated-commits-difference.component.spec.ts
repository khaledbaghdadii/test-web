import { render, screen, waitFor, within } from "@testing-library/angular";
import { of, throwError } from "rxjs";
import { ModuleRegistry } from "ag-grid-community";
import { AllEnterpriseModule } from "ag-grid-enterprise";
import { AgGridAngular } from "ag-grid-angular";
import { CommitsService } from "@mxevolve/domains/scm/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import { PaginatedCommitsDifferenceComponent } from "./paginated-commits-difference.component";

ModuleRegistry.registerModules([AllEnterpriseModule]);

const mockCommitsService = {
  getPaginatedCommitDifferences: jest.fn(),
};

const mockToastMessageService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const MOCK_IMPORTS = [AgGridAngular];

const REQUIRED_INPUTS = {
  projectId: "project-1",
  repositoryId: "repo-1",
  source: "feature/branch",
  destination: "main",
};

const MOCK_COMMITS = [
  {
    id: "abc123",
    committerDisplayName: "John Doe",
    committerDisplayEmail: "john@example.com",
    timeStamp: "2024-01-15T10:30:00Z",
    message: "feat: add feature",
    url: "https://bitbucket.org/commits/abc123",
  },
  {
    id: "def456",
    committerDisplayName: "Jane Smith",
    committerDisplayEmail: "jane@example.com",
    timeStamp: "2024-01-14T09:00:00Z",
    message: "fix: resolve issue",
    url: "",
  },
];

const MOCK_RESPONSE = {
  content: MOCK_COMMITS,
  last: true,
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(PaginatedCommitsDifferenceComponent, {
    imports: MOCK_IMPORTS,
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      { provide: CommitsService, useValue: mockCommitsService },
    ],
    providers: [
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

function getDataRows() {
  return screen
    .queryAllByRole("row")
    .filter((row) => within(row).queryAllByRole("gridcell").length > 0);
}

describe("PaginatedCommitsDifferenceComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommitsService.getPaginatedCommitDifferences.mockReturnValue(
      of(MOCK_RESPONSE)
    );
  });

  describe("table rendering", () => {
    it("renders the grid", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByRole("grid")).toBeTruthy();
      });
    });

    it("displays column headers", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(
          screen.getByRole("columnheader", { name: "Commit ID" })
        ).toBeTruthy();
        expect(
          screen.getByRole("columnheader", { name: "Message" })
        ).toBeTruthy();
        expect(
          screen.getByRole("columnheader", { name: "Author" })
        ).toBeTruthy();
        expect(screen.getByRole("columnheader", { name: "Date" })).toBeTruthy();
      });
    });

    it("displays commit rows when data loads successfully", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(getDataRows()).toHaveLength(2);
      });
    });

    it("displays commit messages in the table", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText("feat: add feature")).toBeTruthy();
        expect(screen.getByText("fix: resolve issue")).toBeTruthy();
      });
    });

    it("displays author names in the table", async () => {
      await renderComponent();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeTruthy();
        expect(screen.getByText("Jane Smith")).toBeTruthy();
      });
    });
  });

  describe("error handling", () => {
    it("shows error toast when fetching commits fails", async () => {
      mockCommitsService.getPaginatedCommitDifferences.mockReturnValue(
        throwError(() => new Error("Network error"))
      );

      await renderComponent();

      await waitFor(() => {
        expect(mockToastMessageService.showError).toHaveBeenCalledWith(
          "Couldn't fetch commits"
        );
      });
    });
  });

  describe("service call", () => {
    it("fetches commits with the provided inputs", async () => {
      await renderComponent({
        projectId: "my-project",
        repositoryId: "my-repo",
        source: "feature/new",
        destination: "develop",
      });

      await waitFor(() => {
        expect(
          mockCommitsService.getPaginatedCommitDifferences
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            projectId: "my-project",
            repositoryId: "my-repo",
            source: "feature/new",
            destination: "develop",
            page: 0,
            size: 5,
          })
        );
      });
    });
  });
});
