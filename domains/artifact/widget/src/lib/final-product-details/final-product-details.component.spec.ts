import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, throwError } from "rxjs";
import { FinalProductDetailsComponent } from "./final-product-details.component";
import {
  FinalProduct,
  FinalProductApiService,
} from "@mxevolve/domains/artifact/data-access";

const mockFinalProductApiService = {
  getFinalProductById: jest.fn(),
};

function buildFinalProduct(
  overrides: Partial<FinalProduct> = {}
): FinalProduct {
  return {
    id: "fp-1",
    projectId: "project-1",
    branch: "Main-Test",
    repositoryId: "repo-1",
    version: "v1",
    configurationCommitId: "5600aca8c8aa00",
    state: "available",
    validationLevel: "MQG",
    factoryProduct: {
      id: "factory-1",
      type: "OFFICIAL",
      softwareProduct: { id: "sw-1", version: "v3.1", revision: "7231169" },
    },
    createdOn: "2024-01-01T00:00:00Z",
    ...overrides,
  } as FinalProduct;
}

async function renderComponent(
  finalProductId: string | undefined,
  on: Record<string, (value: unknown) => void> = {},
  publishingFailed = false
) {
  return render(FinalProductDetailsComponent, {
    inputs: { projectId: "project-1", finalProductId, publishingFailed },
    on,
    providers: [
      {
        provide: FinalProductApiService,
        useValue: mockFinalProductApiService,
      },
    ],
  });
}

describe("FinalProductDetailsComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the final product id", async () => {
    mockFinalProductApiService.getFinalProductById.mockReturnValue(
      of(buildFinalProduct())
    );
    await renderComponent("fp-1");

    await waitFor(() => expect(screen.getByText("fp-1")).toBeTruthy());
  });

  it("renders the branch", async () => {
    mockFinalProductApiService.getFinalProductById.mockReturnValue(
      of(buildFinalProduct())
    );
    await renderComponent("fp-1");

    await waitFor(() => expect(screen.getByText("Main-Test")).toBeTruthy());
  });

  it("renders the resolved status label for an available state", async () => {
    mockFinalProductApiService.getFinalProductById.mockReturnValue(
      of(buildFinalProduct({ state: "available" }))
    );
    await renderComponent("fp-1");

    await waitFor(() => expect(screen.getByText("Available")).toBeTruthy());
  });

  it("renders the final product creation title and requested field order", async () => {
    mockFinalProductApiService.getFinalProductById.mockReturnValue(
      of(buildFinalProduct({ failureMessage: "Publishing failed" }))
    );
    await renderComponent("fp-1");

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Final Product Creation" })
      ).toBeTruthy()
    );

    const labelOrder = (row: HTMLElement) =>
      Array.from(row.children)
        .filter((field) => field.querySelector(".text-surface-500"))
        .map((field) =>
          field.querySelector(".text-surface-500")?.textContent?.trim()
        );

    expect(labelOrder(screen.getByTestId("final-product-summary-row"))).toEqual(
      ["Status", "Validation Level", "Failure Reason"]
    );
    expect(labelOrder(screen.getByTestId("final-product-details-row"))).toEqual(
      ["Final Product ID", "Commit", "Branch"]
    );
    expect(screen.getByTestId("final-product-validation-level")).toHaveClass(
      "flex"
    );
    const factoryProductRow = screen.getByTestId(
      "final-product-factory-product-row"
    );
    const softwareProductRow = screen.getByTestId(
      "final-product-software-product-row"
    );
    expect(factoryProductRow).toHaveTextContent("Factory Product");
    expect(factoryProductRow).toHaveTextContent("factory-1");
    expect(softwareProductRow).toHaveTextContent("Software Product");
    expect(softwareProductRow).toHaveTextContent("sw-1");
  });

  it("keeps a long failure reason in its responsive grid cell", async () => {
    const failureMessage =
      "/murex/final/product/mxconfig-configuration/MXevolve_SIZ0010.main.0700e263873.260702-0816-SNAPSHOT/" +
      "mxconfig-configuration-MXevolve_SIZ0010.main.0700e263873.260702-0816-SNAPSHOT.zip not found";
    mockFinalProductApiService.getFinalProductById.mockReturnValue(
      of(buildFinalProduct({ state: "failed", failureMessage }))
    );
    await renderComponent("fp-1");

    const truncatedFailureMessage = `${failureMessage.substring(0, 80)}...`;
    await waitFor(() =>
      expect(screen.getByText(truncatedFailureMessage)).toBeTruthy()
    );

    const failureReason = screen.getByTestId("final-product-failure-reason");
    expect(failureReason).toHaveClass("min-w-0");
    expect(failureReason.querySelector(".break-words")).toHaveTextContent(
      truncatedFailureMessage
    );

    await userEvent.click(
      screen.getByRole("button", { name: "See full failure reason" })
    );

    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveTextContent(failureMessage)
    );
  });

  it("renders a dash when the failure reason is missing", async () => {
    mockFinalProductApiService.getFinalProductById.mockReturnValue(
      of(buildFinalProduct())
    );
    await renderComponent("fp-1");

    await waitFor(() =>
      expect(
        screen.getByTestId("final-product-failure-reason")
      ).toHaveTextContent("-")
    );
    expect(
      screen.queryByRole("button", { name: "See full failure reason" })
    ).toBeNull();
  });

  it("renders N/A for a missing validation level", async () => {
    mockFinalProductApiService.getFinalProductById.mockReturnValue(
      of(buildFinalProduct({ validationLevel: undefined }))
    );
    await renderComponent("fp-1");

    await waitFor(() => expect(screen.getByText("N/A")).toBeTruthy());
  });

  it("renders the factory product type when present", async () => {
    mockFinalProductApiService.getFinalProductById.mockReturnValue(
      of(
        buildFinalProduct({
          factoryProduct: {
            id: "factory-1",
            type: "CANDIDATE",
            softwareProduct: {
              id: "sw-1",
              version: "v3.1",
              revision: "7231169",
            },
          },
        })
      )
    );
    await renderComponent("fp-1");

    await waitFor(() => expect(screen.getByText("CANDIDATE")).toBeTruthy());
  });

  it("keeps factory and software product values grouped together", async () => {
    mockFinalProductApiService.getFinalProductById.mockReturnValue(
      of(buildFinalProduct())
    );
    await renderComponent("fp-1");

    await waitFor(() => expect(screen.getByText("factory-1")).toBeTruthy());

    const factoryProductRow = screen.getByTestId(
      "final-product-factory-product-row"
    );
    const softwareProductRow = screen.getByTestId(
      "final-product-software-product-row"
    );
    expect(factoryProductRow).toHaveTextContent("Factory Product");
    expect(factoryProductRow).toHaveTextContent("factory-1");
    expect(softwareProductRow).toHaveTextContent("Software Product");
    expect(softwareProductRow).toHaveTextContent("sw-1");
    expect(screen.getByTestId("factory-product-id")).toHaveClass(
      "whitespace-nowrap"
    );
  });

  it("does not fetch the final product when no id is provided", async () => {
    await renderComponent(undefined);

    expect(
      mockFinalProductApiService.getFinalProductById
    ).not.toHaveBeenCalled();
  });

  it("renders no final product content when no id is provided", async () => {
    await renderComponent(undefined);

    await waitFor(() => expect(screen.queryByText("fp-1")).toBeNull());
  });

  it("shows an in-progress info message and no error when no id is provided", async () => {
    await renderComponent(undefined);

    await waitFor(() =>
      expect(
        screen.getByText("Final product publishing is in progress.")
      ).toBeTruthy()
    );
    expect(
      screen.queryByText(
        "Something Went Wrong! Failed to request publishing a final product"
      )
    ).toBeNull();
  });

  it("shows the error message when publishing failed even without an id", async () => {
    await renderComponent(undefined, {}, true);

    await waitFor(() =>
      expect(
        screen.getByText(
          "Something Went Wrong! Failed to request publishing a final product"
        )
      ).toBeTruthy()
    );
  });

  it("shows an error message when the final product cannot be loaded", async () => {
    mockFinalProductApiService.getFinalProductById.mockReturnValue(
      throwError(() => new Error("boom"))
    );
    await renderComponent("fp-1");

    await waitFor(() =>
      expect(
        screen.getByText(
          "Something Went Wrong! Failed to request publishing a final product"
        )
      ).toBeTruthy()
    );
  });

  it("emits an error when the fetch fails", async () => {
    mockFinalProductApiService.getFinalProductById.mockReturnValue(
      throwError(() => new Error("boom"))
    );
    const onError = jest.fn();
    await renderComponent("fp-1", { fetchError: onError });

    await waitFor(() => expect(onError).toHaveBeenCalledWith("boom"));
  });
});
