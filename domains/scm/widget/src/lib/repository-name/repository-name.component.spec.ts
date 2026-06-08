import { render, screen, waitFor } from "@testing-library/angular";
import { of, Subject, throwError } from "rxjs";
import { RepositoryNameComponent } from "./repository-name.component";
import { RepositoryService } from "@mxevolve/domains/scm/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";

function mockRepositoryService(
  overrides: Partial<RepositoryService> = {}
): RepositoryService {
  return {
    getRepository: jest
      .fn()
      .mockReturnValue(
        of({ id: "repo-1", name: "my-repository", url: "https://example.com" })
      ),
    ...overrides,
  } as unknown as RepositoryService;
}

function mockToastMessageService(): ToastMessageService {
  return { showError: jest.fn() } as unknown as ToastMessageService;
}

const REQUIRED_INPUTS = {
  projectId: "project-1",
  repositoryId: "repo-1",
};

async function renderComponent(
  inputs: Partial<{ projectId: string; repositoryId: string }> = {},
  service = mockRepositoryService(),
  toast = mockToastMessageService()
) {
  return render(RepositoryNameComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      { provide: RepositoryService, useValue: service },
      { provide: ToastMessageService, useValue: toast },
    ],
  });
}

describe("RepositoryNameComponent", () => {
  it("shows a skeleton while loading", async () => {
    const subject = new Subject<{ id: string; name: string; url: string }>();
    const service = mockRepositoryService({
      getRepository: jest.fn().mockReturnValue(subject),
    });

    await renderComponent({}, service);

    expect(document.querySelector("p-skeleton")).toBeTruthy();
  });

  it("hides the skeleton after loading", async () => {
    await renderComponent();

    await screen.findByText("my-repository");
    expect(document.querySelector("p-skeleton")).toBeNull();
  });

  it("shows a dash when the service fails", async () => {
    const service = mockRepositoryService({
      getRepository: jest
        .fn()
        .mockReturnValue(throwError(() => new Error("Network error"))),
    });

    await renderComponent({}, service);

    expect(await screen.findByText("-")).toBeTruthy();
  });

  it("shows a toast error when the service fails", async () => {
    const service = mockRepositoryService({
      getRepository: jest
        .fn()
        .mockReturnValue(throwError(() => new Error("Network error"))),
    });
    const toast = mockToastMessageService();

    await renderComponent({}, service, toast);

    await waitFor(() => {
      expect(toast.showError).toHaveBeenCalledWith(
        "Failed to load repository name"
      );
    });
  });
});
