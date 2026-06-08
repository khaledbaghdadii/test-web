import { render, screen, waitFor } from "@testing-library/angular";
import { of, Subject, throwError } from "rxjs";
import { InfraGroupNameComponent } from "./infra-group-name.component";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";

function mockInfraGroupService(
  overrides: Partial<InfraGroupService> = {}
): InfraGroupService {
  return {
    getGroup: jest
      .fn()
      .mockReturnValue(of({ id: "group-1", name: "production-group" })),
    ...overrides,
  } as unknown as InfraGroupService;
}

function mockToastMessageService(): ToastMessageService {
  return { showError: jest.fn() } as unknown as ToastMessageService;
}

const REQUIRED_INPUTS = {
  projectId: "project-1",
  infraGroupId: "group-1",
};

async function renderComponent(
  inputs: Partial<{ projectId: string; infraGroupId: string }> = {},
  service = mockInfraGroupService(),
  toast = mockToastMessageService()
) {
  return render(InfraGroupNameComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      { provide: InfraGroupService, useValue: service },
      { provide: ToastMessageService, useValue: toast },
    ],
  });
}

describe("InfraGroupNameComponent", () => {
  it("shows a skeleton while loading", async () => {
    const subject = new Subject<{ id: string; name: string }>();
    const service = mockInfraGroupService({
      getGroup: jest.fn().mockReturnValue(subject),
    });

    await renderComponent({}, service);

    expect(document.querySelector("p-skeleton")).toBeTruthy();
  });

  it("hides the skeleton after loading", async () => {
    await renderComponent();

    await screen.findByText("production-group");
    expect(document.querySelector("p-skeleton")).toBeNull();
  });

  it("shows a dash when the service fails", async () => {
    const service = mockInfraGroupService({
      getGroup: jest
        .fn()
        .mockReturnValue(throwError(() => new Error("Network error"))),
    });

    await renderComponent({}, service);

    expect(await screen.findByText("-")).toBeTruthy();
  });

  it("shows a toast error when the service fails", async () => {
    const service = mockInfraGroupService({
      getGroup: jest
        .fn()
        .mockReturnValue(throwError(() => new Error("Network error"))),
    });
    const toast = mockToastMessageService();

    await renderComponent({}, service, toast);

    await waitFor(() => {
      expect(toast.showError).toHaveBeenCalledWith(
        "Failed to load infra group name"
      );
    });
  });
});
