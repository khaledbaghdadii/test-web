import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { Message } from "primeng/message";
import { InputText } from "primeng/inputtext";
import { Checkbox } from "primeng/checkbox";
import { RadioButton } from "primeng/radiobutton";
import { RerunDialogComponent } from "./rerun-dialog.component";
import { RerunModeAnalyticsTrackerService } from "./rerun-mode-analytics-tracker.service";
import { FactoryProductInputComponent } from "../rerun-scenario-button/factory-product-input/factory-product-input.component";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { FinalProductDropdownInputComponent } from "@mxevolve/domains/artifact/widget";
import type { FinalProduct } from "@mxevolve/domains/artifact/data-access";
import { RepositoryService } from "@mxevolve/domains/scm/data-access";
import { Skeleton } from "primeng/skeleton";
import { of } from "rxjs";

const MOCK_IMPORTS = [
  MockComponent(FactoryProductInputComponent),
  MockComponent(MxevolveIconComponent),
  MockComponent(FinalProductDropdownInputComponent),
  FormsModule,
  ReactiveFormsModule,
  Button,
  Dialog,
  Message,
  InputText,
  Checkbox,
  RadioButton,
  Skeleton,
];

const REQUIRED_INPUTS = {
  projectId: "project-123",
  visible: true,
};

const mockRerunModeAnalyticsTracker = {
  trackOfficialModeSelected: jest.fn(),
  trackUnofficialModeSelected: jest.fn(),
};

/**
 * The dialog resolves the repository the final products live on the same way
 * legacy did - the project's first repository - and hands it to the dropdown so
 * commit messages and the HEAD- prefix can load.
 */
const mockRepositoryService = {
  getAllRepositories: jest.fn(() => of([{ id: "repo-1", name: "repo" }])),
};

const mockToastService = { showError: jest.fn(), showSuccess: jest.fn() };

async function renderComponent(
  inputs: Partial<
    typeof REQUIRED_INPUTS & {
      factoryProductId: string;
      warningMessage: string;
      loading: boolean;
      allowOfficialRerun: boolean;
      initialFinalProductId: string;
      branch: string;
      enableKeepServices: boolean;
      defaultRerunMode: "official" | "unofficial";
    }
  > = {}
) {
  return render(RerunDialogComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: RerunModeAnalyticsTrackerService,
        useValue: mockRerunModeAnalyticsTracker,
      },
      { provide: RepositoryService, useValue: mockRepositoryService },
      { provide: ToastMessageService, useValue: mockToastService },
    ],
  });
}

const MOCK_FINAL_PRODUCT: FinalProduct = {
  id: "fp-final-123",
  projectId: "project-123",
  branch: "main",
  repositoryId: "repo-1",
  version: "1.0.0",
  configurationCommitId: "abc123commit",
  state: "AVAILABLE",
  createdOn: "2025-06-01T10:00:00Z",
  rtpProduct: {
    id: "rtp-1",
    rtpCommitId: "rtp-commit-abc",
    tag: "tag-1",
  },
};

describe("RerunDialogComponent", () => {
  afterEach(() => {
    document.body
      .querySelectorAll(".p-dialog-mask")
      .forEach((el) => el.remove());
    jest.clearAllMocks();
  });

  it("renders the dialog when visible", async () => {
    await renderComponent();

    expect(screen.getByText("Scenario Rerun")).toBeTruthy();
  });

  it("does not render the dialog when not visible", async () => {
    await renderComponent({ visible: false });

    expect(screen.queryByText("Scenario Rerun")).toBeNull();
  });

  it("shows the warning message when provided", async () => {
    await renderComponent({ warningMessage: "This is a warning" });

    expect(screen.getByText("This is a warning")).toBeTruthy();
  });

  it("does not show a warning message when not provided", async () => {
    await renderComponent();

    expect(screen.queryByText("This is a warning")).toBeNull();
  });

  it("shows commit ID helper text", async () => {
    await renderComponent();

    expect(
      screen.getByText("Defaults to the HEAD commit if left empty.")
    ).toBeTruthy();
  });

  it("disables the Rerun button when no factory product is selected", async () => {
    await renderComponent();

    expect(screen.getByRole("button", { name: "Rerun" })).toBeDisabled();
  });

  it("emits rerunRequested with the selected factory product", async () => {
    const rerunSpy = jest.fn();
    const { fixture } = await renderComponent();
    fixture.componentInstance.rerunRequested.subscribe(rerunSpy);

    const fpInput = ngMocks.find(fixture, FactoryProductInputComponent);
    ngMocks.output(fpInput, "factoryProductIdChange").emit("fp-456");
    fixture.detectChanges();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Rerun" }));

    expect(rerunSpy).toHaveBeenCalledWith({
      mode: "unofficial",
      factoryProductId: "fp-456",
      commitId: undefined,
      stopServices: true,
    });
  });

  it("emits rerunRequested with the commit ID when provided", async () => {
    const rerunSpy = jest.fn();
    const { fixture } = await renderComponent();
    fixture.componentInstance.rerunRequested.subscribe(rerunSpy);

    const fpInput = ngMocks.find(fixture, FactoryProductInputComponent);
    ngMocks.output(fpInput, "factoryProductIdChange").emit("fp-456");
    fixture.detectChanges();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Enter a commit ID"), "abc123");
    await user.click(screen.getByRole("button", { name: "Rerun" }));

    expect(rerunSpy).toHaveBeenCalledWith({
      mode: "unofficial",
      factoryProductId: "fp-456",
      commitId: "abc123",
      stopServices: true,
    });
  });

  it("passes the projectId to FactoryProductInputComponent", async () => {
    const { fixture } = await renderComponent({ projectId: "proj-789" });

    const fpInput = ngMocks.find(fixture, FactoryProductInputComponent);
    expect(ngMocks.input(fpInput, "projectId")).toBe("proj-789");
  });

  it("passes the factoryProductId to FactoryProductInputComponent", async () => {
    const { fixture } = await renderComponent({
      factoryProductId: "fp-pre-filled",
    });

    const fpInput = ngMocks.find(fixture, FactoryProductInputComponent);
    expect(ngMocks.input(fpInput, "factoryProductId")).toBe("fp-pre-filled");
  });

  it("resets the commit ID field when the dialog opens", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.type(
      screen.getByPlaceholderText("Enter a commit ID"),
      "old-value"
    );
    expect(screen.getByPlaceholderText("Enter a commit ID")).toHaveValue(
      "old-value"
    );

    fixture.componentInstance.visible.set(false);
    fixture.detectChanges();
    fixture.componentInstance.visible.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(screen.getByPlaceholderText("Enter a commit ID")).toHaveValue("");
  });

  describe("official rerun mode", () => {
    it("does not show Official or Unofficial radio buttons when allowOfficialRerun is false", async () => {
      await renderComponent();

      expect(screen.queryByText("Official")).toBeNull();
    });

    it("shows Official and Unofficial radio buttons when allowOfficialRerun is true", async () => {
      await renderComponent({ allowOfficialRerun: true });

      expect(screen.getByText("Official")).toBeTruthy();
    });

    it("shows Unofficial radio button when allowOfficialRerun is true", async () => {
      await renderComponent({ allowOfficialRerun: true });

      expect(screen.getByText("Unofficial")).toBeTruthy();
    });

    it("shows the RTP commit ID input when Official mode is selected", async () => {
      const user = userEvent.setup();
      await renderComponent({ allowOfficialRerun: true });

      await user.click(screen.getByLabelText("Official"));

      expect(screen.getByPlaceholderText("Enter RTP commit ID")).toBeTruthy();
    });

    it("hides the factory product commit ID input when Official mode is selected", async () => {
      const user = userEvent.setup();
      await renderComponent({ allowOfficialRerun: true });

      await user.click(screen.getByLabelText("Official"));

      expect(screen.queryByPlaceholderText("Enter a commit ID")).toBeNull();
    });

    it("disables Rerun when in official mode with no final product selected", async () => {
      const user = userEvent.setup();
      await renderComponent({ allowOfficialRerun: true });

      await user.click(screen.getByLabelText("Official"));

      expect(screen.getByRole("button", { name: "Rerun" })).toBeDisabled();
    });

    it("stores the selected final product on final product change", async () => {
      const { fixture } = await renderComponent({ allowOfficialRerun: true });

      fixture.componentInstance.onFinalProductChange(MOCK_FINAL_PRODUCT);

      expect(fixture.componentInstance.selectedFinalProduct()).toBe(
        MOCK_FINAL_PRODUCT
      );
    });

    it("prefills the RTP commit ID from the selected final product", async () => {
      const { fixture } = await renderComponent({ allowOfficialRerun: true });

      fixture.componentInstance.onFinalProductChange(MOCK_FINAL_PRODUCT);

      expect(fixture.componentInstance.rtpCommitIdControl.value).toBe(
        "rtp-commit-abc"
      );
    });

    it("clears the RTP commit ID when the final product is cleared", async () => {
      const { fixture } = await renderComponent({ allowOfficialRerun: true });
      fixture.componentInstance.onFinalProductChange(MOCK_FINAL_PRODUCT);

      fixture.componentInstance.onFinalProductChange(undefined);

      expect(fixture.componentInstance.rtpCommitIdControl.value).toBe("");
    });

    it("emits rerunRequested with official mode shape when official rerun submitted", async () => {
      const rerunSpy = jest.fn();
      const { fixture } = await renderComponent({ allowOfficialRerun: true });
      fixture.componentInstance.rerunRequested.subscribe(rerunSpy);

      fixture.componentInstance.rerunMode.set("official");
      fixture.componentInstance.selectedFinalProduct.set(MOCK_FINAL_PRODUCT);
      fixture.componentInstance.rtpCommitIdControl.setValue("rtp-xyz");
      fixture.detectChanges();
      await fixture.whenStable();

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Rerun" }));

      expect(rerunSpy).toHaveBeenCalledWith({
        mode: "official",
        finalProductId: "fp-final-123",
        rtpCommitId: "rtp-xyz",
        stopServices: true,
      });
    });

    it("passes projectId to FinalProductDropdownInputComponent", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        allowOfficialRerun: true,
        projectId: "proj-789",
      });

      await user.click(screen.getByLabelText("Official"));
      fixture.detectChanges();

      const fpDropdown = ngMocks.find(fixture, FinalProductDropdownInputComponent);
      expect(ngMocks.input(fpDropdown, "projectId")).toBe("proj-789");
    });

    it("passes the branch filter to FinalProductDropdownInputComponent", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        allowOfficialRerun: true,
        branch: "feature/my-branch",
      });

      await user.click(screen.getByLabelText("Official"));
      fixture.detectChanges();

      const fpDropdown = ngMocks.find(fixture, FinalProductDropdownInputComponent);
      expect(ngMocks.input(fpDropdown, "branchFilter")).toBe("feature/my-branch");
    });

    it("passes the prefilled final product id to FinalProductDropdownInputComponent", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        allowOfficialRerun: true,
        initialFinalProductId: "fp-pre-filled",
      });

      await user.click(screen.getByLabelText("Official"));
      fixture.detectChanges();

      const fpDropdown = ngMocks.find(fixture, FinalProductDropdownInputComponent);
      expect(ngMocks.input(fpDropdown, "customFinalProductId")).toBe(
        "fp-pre-filled"
      );
    });

    it("resets to unofficial mode when dialog is reopened", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({ allowOfficialRerun: true });

      await user.click(screen.getByLabelText("Official"));
      fixture.detectChanges();

      fixture.componentInstance.visible.set(false);
      fixture.detectChanges();
      fixture.componentInstance.visible.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(screen.queryByPlaceholderText("Enter RTP commit ID")).toBeNull();
      expect(screen.getByPlaceholderText("Enter a commit ID")).toBeTruthy();
    });

    it("defaults to official mode when defaultRerunMode is official", async () => {
      await renderComponent({
        allowOfficialRerun: true,
        defaultRerunMode: "official",
      });

      expect(screen.getByPlaceholderText("Enter RTP commit ID")).toBeTruthy();
    });

    it("tracks a Matomo event when Official is selected", async () => {
      const rerunSpy = jest.fn();
      const { fixture } = await renderComponent({ allowOfficialRerun: true });
      fixture.componentInstance.rerunRequested.subscribe(rerunSpy);

      fixture.componentInstance.rerunMode.set("official");
      fixture.componentInstance.selectedFinalProduct.set(MOCK_FINAL_PRODUCT);
      fixture.componentInstance.rtpCommitIdControl.setValue("rtp-xyz");
      fixture.detectChanges();
      await fixture.whenStable();

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Rerun" }));
      expect(
        mockRerunModeAnalyticsTracker.trackOfficialModeSelected
      ).toHaveBeenCalled();
    });

    it("tracks a Matomo event when Unofficial is selected", async () => {
      const rerunSpy = jest.fn();
      const { fixture } = await renderComponent({ allowOfficialRerun: true });
      fixture.componentInstance.rerunRequested.subscribe(rerunSpy);

      fixture.componentInstance.rerunMode.set("unofficial");
      fixture.componentInstance.selectedFactoryProductId.set(
        "FACTORY_PRODUCT_ID"
      );
      fixture.componentInstance.commitIdControl.setValue("rtp-xyz");
      fixture.detectChanges();
      await fixture.whenStable();

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Rerun" }));

      expect(
        mockRerunModeAnalyticsTracker.trackUnofficialModeSelected
      ).toHaveBeenCalled();
    });
  });

  describe("keep services checkbox", () => {
    it("does not show the keep services checkbox when enableKeepServices is false", async () => {
      await renderComponent();

      expect(
        screen.queryByText("Keep services running after rerun")
      ).toBeNull();
    });

    it("shows the keep services checkbox when enableKeepServices is true", async () => {
      await renderComponent({ enableKeepServices: true });

      expect(screen.getByText("Keep services running")).toBeTruthy();
    });

    it("sets stopServices to true when enableKeepServices is false and official rerun submitted", async () => {
      const rerunSpy = jest.fn();
      const { fixture } = await renderComponent({ allowOfficialRerun: true });
      fixture.componentInstance.rerunRequested.subscribe(rerunSpy);

      fixture.componentInstance.rerunMode.set("official");
      fixture.componentInstance.selectedFinalProduct.set(MOCK_FINAL_PRODUCT);
      fixture.componentInstance.rtpCommitIdControl.setValue("rtp-xyz");
      fixture.detectChanges();
      await fixture.whenStable();

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Rerun" }));

      expect(rerunSpy).toHaveBeenCalledWith(
        expect.objectContaining({ stopServices: true })
      );
    });

    it("sets stopServices to false when keepServices is checked and official rerun submitted", async () => {
      const rerunSpy = jest.fn();
      const { fixture } = await renderComponent({
        allowOfficialRerun: true,
        enableKeepServices: true,
      });
      fixture.componentInstance.rerunRequested.subscribe(rerunSpy);

      fixture.componentInstance.rerunMode.set("official");
      fixture.componentInstance.selectedFinalProduct.set(MOCK_FINAL_PRODUCT);
      fixture.componentInstance.keepServices.set(true);
      fixture.componentInstance.rtpCommitIdControl.setValue("rtp-xyz");
      fixture.detectChanges();
      await fixture.whenStable();

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Rerun" }));

      expect(rerunSpy).toHaveBeenCalledWith(
        expect.objectContaining({ stopServices: false })
      );
    });

    it("sets stopServices to true on unofficial rerun when enableKeepServices is false", async () => {
      const rerunSpy = jest.fn();
      const { fixture } = await renderComponent();
      fixture.componentInstance.rerunRequested.subscribe(rerunSpy);

      const fpInput = ngMocks.find(fixture, FactoryProductInputComponent);
      ngMocks.output(fpInput, "factoryProductIdChange").emit("fp-456");
      fixture.detectChanges();

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Rerun" }));

      expect(rerunSpy).toHaveBeenCalledWith(
        expect.objectContaining({ mode: "unofficial", stopServices: true })
      );
    });

    it("sets stopServices to false on unofficial rerun when keepServices is checked", async () => {
      const rerunSpy = jest.fn();
      const { fixture } = await renderComponent({ enableKeepServices: true });
      fixture.componentInstance.rerunRequested.subscribe(rerunSpy);

      const fpInput = ngMocks.find(fixture, FactoryProductInputComponent);
      ngMocks.output(fpInput, "factoryProductIdChange").emit("fp-456");
      fixture.componentInstance.keepServices.set(true);
      fixture.detectChanges();

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Rerun" }));

      expect(rerunSpy).toHaveBeenCalledWith(
        expect.objectContaining({ mode: "unofficial", stopServices: false })
      );
    });
  });
});
