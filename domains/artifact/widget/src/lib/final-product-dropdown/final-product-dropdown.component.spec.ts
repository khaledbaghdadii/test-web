import { render, screen, waitFor } from "@testing-library/angular";
import { Component } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { GATEWAY_CONFIG } from "@mxevolve/shared/core/config";
import { APP_CONFIG } from "@mxflow/config";
import { EMPTY, of, throwError } from "rxjs";
import { FinalProductDropdownComponent } from "./final-product-dropdown.component";
import { FinalProductLabelMode } from "./final-product-label-mode";
import type {
  FinalProduct,
  FinalProducts,
} from "@mxevolve/domains/artifact/data-access";
import {
  FinalProductApiService,
  FinalProductState,
} from "@mxevolve/domains/artifact/data-access";
import { BranchService, CommitsService } from "@mxevolve/domains/scm/data-access";

const MOCK_FINAL_PRODUCT: FinalProduct = {
  id: "fp-001",
  projectId: "project-123",
  branch: "main",
  repositoryId: "repo-1",
  version: "1.0.0",
  configurationCommitId: "abc123commit",
  state: "AVAILABLE",
  createdOn: "2025-06-01T10:00:00Z",
};

const MOCK_UNLISTED_FINAL_PRODUCT: FinalProduct = {
  id: "fp-archived",
  projectId: "project-123",
  branch: "main",
  repositoryId: "repo-1",
  version: "0.9.0",
  configurationCommitId: "archivedcommit",
  state: "ARCHIVED",
  createdOn: "2025-05-01T10:00:00Z",
};

const MOCK_PRODUCTS: FinalProducts = {
  content: [MOCK_FINAL_PRODUCT],
  totalPages: 1,
  totalElements: 1,
  size: 100,
  number: 0,
  last: true,
};

const mockFinalProductService = {
  getFinalProducts: jest.fn(),
  getFinalProductById: jest.fn(),
};

const mockCommitsService = { getCommitsInfo: jest.fn() };
const mockBranchService = { getBranchDetails: jest.fn() };

const COMPONENT_PROVIDERS = [
  { provide: FinalProductApiService, useValue: mockFinalProductService },
  { provide: CommitsService, useValue: mockCommitsService },
  { provide: BranchService, useValue: mockBranchService },
];

async function renderComponent(
  inputs: Partial<{
    projectId: string;
    repositoryId: string;
    branch: string;
    labelMode: FinalProductLabelMode;
    placeholder: string;
    initialFinalProductId: string;
    validationLevelFilter: string[];
    stateFilter: FinalProductState[];
    sort: string;
    fetchParent: boolean;
  }> = {}
) {
  return render(FinalProductDropdownComponent, {
    inputs: { projectId: "project-123", ...inputs },
    componentProviders: COMPONENT_PROVIDERS,
  });
}

describe("FinalProductDropdownComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommitsService.getCommitsInfo.mockReturnValue(EMPTY);
    mockBranchService.getBranchDetails.mockReturnValue(EMPTY);
    mockFinalProductService.getFinalProducts.mockReturnValue(of(MOCK_PRODUCTS));
    mockFinalProductService.getFinalProductById.mockImplementation(
      (_projectId: string, id: string) =>
        of(
          id === "fp-archived"
            ? MOCK_UNLISTED_FINAL_PRODUCT
            : MOCK_FINAL_PRODUCT
        )
    );
  });

  afterEach(() => {
    document.body
      .querySelectorAll(".p-select-overlay")
      .forEach((el) => el.remove());
  });

  it("renders the final product dropdown", async () => {
    await renderComponent();

    expect(screen.getByTestId("final-product-dropdown")).toBeTruthy();
  });

  it("shows the Select a Final Product placeholder initially", async () => {
    mockFinalProductService.getFinalProducts.mockReturnValue(
      of({ ...MOCK_PRODUCTS, content: [] })
    );
    await renderComponent();

    expect(screen.getByText("Select a Final Product")).toBeTruthy();
  });

  it("calls getFinalProducts with the provided projectId", async () => {
    await renderComponent({ projectId: "proj-abc" });

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalledWith(
        "proj-abc",
        expect.objectContaining({})
      )
    );
  });

  it("calls getFinalProducts with branchFilter when branch is provided", async () => {
    await renderComponent({ branch: "feature/test" });

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ branchFilter: "feature/test" })
      )
    );
  });

  it("does not filter getFinalProducts by state", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalled()
    );
    const [, filters] = mockFinalProductService.getFinalProducts.mock.calls[0];
    expect(filters).not.toHaveProperty("stateFilter");
  });

  it("calls getFinalProducts with fetchParent so the branch root final product is included", async () => {
    await renderComponent({ branch: "feature/test" });

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ fetchParent: true })
      )
    );
  });

  it("calls getFinalProducts with page 0 and a page size", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ page: 0, size: expect.any(Number) })
      )
    );
  });

  it("calls getFinalProducts with the provided validationLevelFilter", async () => {
    await renderComponent({ validationLevelFilter: ["CQG"] });

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ validationLevelFilter: ["CQG"] })
      )
    );
  });

  it("does not send validationLevelFilter when not provided", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalled()
    );
    const [, filters] = mockFinalProductService.getFinalProducts.mock.calls[0];
    expect(filters).not.toHaveProperty("validationLevelFilter");
  });

  it("calls getFinalProducts with the provided stateFilter", async () => {
    await renderComponent({ stateFilter: [FinalProductState.AVAILABLE] });

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ stateFilter: [FinalProductState.AVAILABLE] })
      )
    );
  });

  it("calls getFinalProducts with the provided sort", async () => {
    await renderComponent({ sort: "createdOn,desc" });

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ sort: "createdOn,desc" })
      )
    );
  });

  it("does not send sort when not provided", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalled()
    );
    const [, filters] = mockFinalProductService.getFinalProducts.mock.calls[0];
    expect(filters).not.toHaveProperty("sort");
  });

  it("calls getFinalProducts with fetchParent false when explicitly overridden", async () => {
    await renderComponent({ branch: "feature/test", fetchParent: false });

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ fetchParent: false })
      )
    );
  });

  it("defaults fetchParent to true when not provided (unchanged behavior for existing consumers)", async () => {
    await renderComponent({ branch: "feature/test" });

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ fetchParent: true })
      )
    );
  });

  it("passes searchKey to getFinalProducts when filtering", async () => {
    const { fixture } = await renderComponent();

    jest.clearAllMocks();
    mockCommitsService.getCommitsInfo.mockReturnValue(EMPTY);
    mockBranchService.getBranchDetails.mockReturnValue(EMPTY);
    mockFinalProductService.getFinalProducts.mockReturnValue(of(MOCK_PRODUCTS));
    fixture.componentInstance.stateProvider.setSearchKey("abc123");

    await waitFor(
      () => {
        expect(mockFinalProductService.getFinalProducts).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ searchKey: "abc123" })
        );
      },
      { timeout: 1000 }
    );
  });

  it("emits undefined from selectedFinalProductChange when selection is cleared", async () => {
    const changeSpy = jest.fn();
    const { fixture } = await renderComponent();
    fixture.componentInstance.selectedFinalProductChange.subscribe(changeSpy);

    fixture.componentInstance.onSelectionChange(null);

    expect(changeSpy).toHaveBeenCalledWith(undefined);
  });

  it("emits the matching FinalProduct when a product is selected", async () => {
    const changeSpy = jest.fn();
    const { fixture } = await renderComponent();
    fixture.componentInstance.selectedFinalProductChange.subscribe(changeSpy);

    fixture.componentInstance.onSelectionChange(MOCK_FINAL_PRODUCT);

    expect(changeSpy).toHaveBeenCalledWith(MOCK_FINAL_PRODUCT);
  });

  it("propagates the selected product id through the ControlValueAccessor while retaining its selection event", async () => {
    const changeSpy = jest.fn();
    const selectedSpy = jest.fn();
    const { fixture } = await renderComponent();
    fixture.componentInstance.registerOnChange(changeSpy);
    fixture.componentInstance.selectedFinalProductChange.subscribe(selectedSpy);

    fixture.componentInstance.onSelectionChange(MOCK_FINAL_PRODUCT);

    expect(changeSpy).toHaveBeenCalledWith("fp-001");
    expect(selectedSpy).toHaveBeenCalledWith(MOCK_FINAL_PRODUCT);
  });

  it("does not re-fetch the just-selected product by id (regression: caused the 'select twice' display bug)", async () => {
    const { fixture } = await renderComponent();
    jest.clearAllMocks();

    fixture.componentInstance.onSelectionChange(MOCK_FINAL_PRODUCT);
    fixture.detectChanges();

    expect(mockFinalProductService.getFinalProductById).not.toHaveBeenCalled();
  });

  it("resolves an externally written final-product id through the ControlValueAccessor", async () => {
    const { fixture } = await renderComponent();

    fixture.componentInstance.writeValue("fp-archived");

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProductById).toHaveBeenCalledWith(
        "project-123",
        "fp-archived"
      )
    );
    expect(fixture.componentInstance.stateProvider.selectedItem()?.id).toBe(
      "fp-archived"
    );
  });

  it("sets the initial selection when initialFinalProductId is provided", async () => {
    const { fixture } = await renderComponent({
      initialFinalProductId: "fp-001",
    });

    await waitFor(() =>
      expect(fixture.componentInstance.stateProvider.selectedItem()?.id).toBe(
        "fp-001"
      )
    );
  });

  it("emits selectedFinalProductChange for the prefilled product", async () => {
    const changeSpy = jest.fn();
    await render(FinalProductDropdownComponent, {
      inputs: { projectId: "project-123", initialFinalProductId: "fp-001" },
      on: { selectedFinalProductChange: changeSpy },
      componentProviders: COMPONENT_PROVIDERS,
    });

    await waitFor(() =>
      expect(changeSpy).toHaveBeenCalledWith(MOCK_FINAL_PRODUCT)
    );
  });

  it("fetches the product by id when it is not in the available list", async () => {
    await renderComponent({ initialFinalProductId: "fp-archived" });

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProductById).toHaveBeenCalledWith(
        "project-123",
        "fp-archived"
      )
    );
  });

  it("selects the product fetched by id when not in the available list", async () => {
    const { fixture } = await renderComponent({
      initialFinalProductId: "fp-archived",
    });

    await waitFor(() =>
      expect(fixture.componentInstance.stateProvider.selectedItem()?.id).toBe(
        "fp-archived"
      )
    );
  });

  it("emits selectedFinalProductChange for the product fetched by id", async () => {
    const changeSpy = jest.fn();
    await render(FinalProductDropdownComponent, {
      inputs: {
        projectId: "project-123",
        initialFinalProductId: "fp-archived",
      },
      on: { selectedFinalProductChange: changeSpy },
      componentProviders: COMPONENT_PROVIDERS,
    });

    await waitFor(() =>
      expect(changeSpy).toHaveBeenCalledWith(MOCK_UNLISTED_FINAL_PRODUCT)
    );
  });

  it("does not set initial selection when initialFinalProductId is not provided", async () => {
    const { fixture } = await renderComponent();

    expect(fixture.componentInstance.stateProvider.selectedItem()).toBeNull();
  });

  it("keeps the prefilled final product in the dropdown options even when the backend list doesn't return it", async () => {
    const { fixture } = await renderComponent({
      initialFinalProductId: "fp-archived",
    });

    await waitFor(() => {
      const options = fixture.componentInstance.stateProvider.dropdownOptions();
      expect(options.map((o) => o.value?.id)).toContain("fp-archived");
    });
  });

  it("does not duplicate the prefilled final product when the backend list also returns it", async () => {
    mockFinalProductService.getFinalProductById.mockReturnValue(
      of(MOCK_FINAL_PRODUCT)
    );

    const { fixture } = await renderComponent({
      initialFinalProductId: "fp-001",
    });

    await waitFor(() => {
      const options = fixture.componentInstance.stateProvider.dropdownOptions();
      const matches = options.filter((o) => o.value?.id === "fp-001");
      expect(matches).toHaveLength(1);
    });
  });

  it("keeps the prefilled final product in the dropdown options after the selection is cleared", async () => {
    const { fixture } = await renderComponent({
      initialFinalProductId: "fp-archived",
    });

    await waitFor(() =>
      expect(fixture.componentInstance.stateProvider.selectedItem()?.id).toBe(
        "fp-archived"
      )
    );

    fixture.componentInstance.stateProvider.setSelectedItem(null);

    const options = fixture.componentInstance.stateProvider.dropdownOptions();
    expect(options.map((o) => o.value?.id)).toContain("fp-archived");
  });

  it("maps products to options with a 10-character truncated configurationCommitId as label", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() => {
      const options = fixture.componentInstance.stateProvider.dropdownOptions();
      expect(options[0]?.label).toBe("abc123comm");
    });
  });

  it("maps products to options with the FinalProduct as value", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() => {
      const options = fixture.componentInstance.stateProvider.dropdownOptions();
      expect(options[0]?.value?.id).toBe("fp-001");
    });
  });

  it("scopes the available list to the provided branch input, not the pre-selected product's branch", async () => {
    mockFinalProductService.getFinalProductById.mockReturnValue(
      of({ ...MOCK_FINAL_PRODUCT, branch: "release/1.0" })
    );

    await renderComponent({
      branch: "parent/xyz",
      initialFinalProductId: "fp-001",
    });

    await waitFor(() =>
      expect(mockFinalProductService.getFinalProducts).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ branchFilter: "parent/xyz" })
      )
    );
  });

  describe("[formControl] binding from a real parent (regression: NG01203 no value accessor)", () => {
    @Component({
      selector: "mxevolve-final-product-dropdown-host",
      standalone: true,
      imports: [ReactiveFormsModule, FinalProductDropdownComponent],
      template: `<mxevolve-final-product-dropdown
        [projectId]="projectId"
        [formControl]="control"
      />`,
    })
    class FinalProductDropdownHostComponent {
      projectId = "project-123";
      control = new FormControl<string | null>(null);
    }

    it("registers a value accessor so the host's [formControl] binding does not throw NG01203", async () => {
      const { fixture } = await render(FinalProductDropdownHostComponent, {
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: GATEWAY_CONFIG,
            useValue: { gatewayUrl: "https://api.test.com/" },
          },
          {
            provide: APP_CONFIG,
            useValue: { gatewayUrl: "https://api.test.com/" },
          },
        ],
      });

      expect(screen.getByTestId("final-product-dropdown")).toBeTruthy();

      const host = fixture.componentInstance;
      fixture.componentInstance.control.setValue("fp-001");
      fixture.detectChanges();

      expect(host.control.value).toBe("fp-001");
    });
  });
  describe("option labels", () => {
    function labels(fixture: {
      componentInstance: FinalProductDropdownComponent;
    }) {
      return fixture.componentInstance.stateProvider
        .dropdownOptions()
        .map((option) => option.label);
    }

    it("shows a shortened commit id by default", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => expect(labels(fixture)).toEqual(["abc123comm"]));
    });

    it("shows the final product tag in tag mode", async () => {
      mockFinalProductService.getFinalProducts.mockReturnValue(
        of({
          ...MOCK_PRODUCTS,
          content: [{ ...MOCK_FINAL_PRODUCT, tag: "v1" }],
        })
      );
      const { fixture } = await renderComponent({
        labelMode: FinalProductLabelMode.TAG,
      });

      await waitFor(() => expect(labels(fixture)).toEqual(["v1"]));
    });

    it("shows a dash in tag mode for an untagged final product", async () => {
      const { fixture } = await renderComponent({
        labelMode: FinalProductLabelMode.TAG,
      });

      await waitFor(() => expect(labels(fixture)).toEqual(["-"]));
    });

    it("combines the tag and the commit id in tag-commit mode", async () => {
      mockFinalProductService.getFinalProducts.mockReturnValue(
        of({
          ...MOCK_PRODUCTS,
          content: [{ ...MOCK_FINAL_PRODUCT, tag: "v1" }],
        })
      );
      const { fixture } = await renderComponent({
        labelMode: FinalProductLabelMode.TAG_COMMIT_ID,
      });

      await waitFor(() => expect(labels(fixture)).toEqual(["v1-abc123comm"]));
    });

    it("falls back to the commit id in tag-commit mode for an untagged final product", async () => {
      const { fixture } = await renderComponent({
        labelMode: FinalProductLabelMode.TAG_COMMIT_ID,
      });

      await waitFor(() => expect(labels(fixture)).toEqual(["abc123comm"]));
    });

    it("marks the final product at the head of the scoped branch", async () => {
      mockBranchService.getBranchDetails.mockReturnValue(
        of({ latestCommitId: "abc123commit" })
      );

      const { fixture } = await renderComponent({
        repositoryId: "repo-1",
        branch: "feature/x",
      });

      await waitFor(() => expect(labels(fixture)).toEqual(["HEAD-abc123comm"]));
    });

    it("appends the commit message once the commit description is resolved", async () => {
      mockCommitsService.getCommitsInfo.mockReturnValue(
        of([
          {
            id: "abc123commit",
            displayId: "abc123c",
            message: "fix: adjust pricing",
          },
        ])
      );

      const { fixture } = await renderComponent({ repositoryId: "repo-1" });

      await waitFor(() =>
        expect(labels(fixture)).toEqual(["abc123c fix: adjust pricing"])
      );
    });

    it("truncates a long commit message", async () => {
      mockCommitsService.getCommitsInfo.mockReturnValue(
        of([
          { id: "abc123commit", displayId: "abc123c", message: "m".repeat(80) },
        ])
      );

      const { fixture } = await renderComponent({ repositoryId: "repo-1" });

      await waitFor(() =>
        expect(labels(fixture)).toEqual([`abc123c ${"m".repeat(60)}...`])
      );
    });

    it("keeps the shortened commit id when no repository is given to resolve against", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => expect(labels(fixture)).toEqual(["abc123comm"]));
    });

    it("keeps the shortened commit id when the commit lookup fails", async () => {
      mockCommitsService.getCommitsInfo.mockReturnValue(
        throwError(() => new Error("boom"))
      );

      const { fixture } = await renderComponent({ repositoryId: "repo-1" });

      await waitFor(() => expect(labels(fixture)).toEqual(["abc123comm"]));
    });
  });

  describe("notifications", () => {
    it("announces the expiry date of the selected final product", async () => {
      const notified = jest.fn();
      const { fixture } = await renderComponent();
      fixture.componentInstance.expiryDateNotification.subscribe(notified);

      fixture.componentInstance.onSelectionChange({
        ...MOCK_FINAL_PRODUCT,
        expiryDate: "2026-01-31",
      });

      expect(notified).toHaveBeenCalledWith(
        "The selected final product will expire on 2026-01-31"
      );
    });

    it("stays silent when the selected final product does not expire", async () => {
      const notified = jest.fn();
      const { fixture } = await renderComponent();
      fixture.componentInstance.expiryDateNotification.subscribe(notified);

      fixture.componentInstance.onSelectionChange(MOCK_FINAL_PRODUCT);

      expect(notified).not.toHaveBeenCalled();
    });

    it("reports a failure to load the final product list", async () => {
      const failed = jest.fn();
      const { fixture } = await renderComponent();
      fixture.componentInstance.errorMessage.subscribe(failed);

      fixture.componentInstance.onError("Unable to load final products");

      expect(failed).toHaveBeenCalledWith("Unable to load final products");
    });
  });
});
