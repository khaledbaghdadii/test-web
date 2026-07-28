import { RouterModule } from "@angular/router";
import { render, screen } from "@testing-library/angular";
import { BinaryImpactIdLinkComponent } from "./binary-impact-id-link.component";

const PROJECT_ID = "projectId";
const BINARY_IMPACT_ID = "binaryImpactId";
const READABLE_ID = "PROJECT-BIMP-1";

interface BinaryImpactIdLinkInputs {
  binaryImpactId: string;
  readableId: string;
  projectId?: string;
}

async function renderComponent(inputs: Partial<BinaryImpactIdLinkInputs> = {}) {
  return render(BinaryImpactIdLinkComponent, {
    inputs: {
      binaryImpactId: BINARY_IMPACT_ID,
      readableId: READABLE_ID,
      projectId: PROJECT_ID,
      ...inputs,
    },
    imports: [RouterModule.forRoot([])],
  });
}

describe("BinaryImpactIdLinkComponent", () => {
  it("renders the human-readable id", async () => {
    await renderComponent();

    expect(screen.getByText(READABLE_ID)).toBeTruthy();
  });

  it("links to the binary impact details page", async () => {
    await renderComponent();

    expect(
      screen.getByRole("link", { name: READABLE_ID }).getAttribute("href")
    ).toBe(`/app/${PROJECT_ID}/detections/impacts/binary/${BINARY_IMPACT_ID}`);
  });

  it("renders a dash when the human-readable id is empty", async () => {
    await renderComponent({ readableId: "" });

    expect(screen.getByText("-")).toBeTruthy();
  });
});
