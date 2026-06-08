import { render, screen } from "@testing-library/angular";
import { MockComponent, MockDirective } from "ng-mocks";
import {
  FactoryProductSelectionDirective,
  MxVersionDropdownComponent,
  MxBuildIdDropdownComponent,
  BipVersionDropdownComponent,
  BipBuildIdDropdownComponent,
} from "@mxevolve/domains/artifact/widget";
import { FactoryProductInputComponent } from "./factory-product-input.component";

const MOCK_IMPORTS = [
  MockDirective(FactoryProductSelectionDirective),
  MockComponent(MxVersionDropdownComponent),
  MockComponent(MxBuildIdDropdownComponent),
  MockComponent(BipVersionDropdownComponent),
  MockComponent(BipBuildIdDropdownComponent),
];

const REQUIRED_INPUTS = {
  projectId: "project-123",
};

async function renderComponent(
  inputs: Partial<typeof REQUIRED_INPUTS & { factoryProductId: string }> = {}
) {
  return render(FactoryProductInputComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
  });
}

describe("FactoryProductInputComponent", () => {
  it("renders MX Version label", async () => {
    await renderComponent();
    expect(screen.getByText("MX Version")).toBeInTheDocument();
  });

  it("renders MX Build ID label", async () => {
    await renderComponent();
    expect(screen.getByText("MX Build ID")).toBeInTheDocument();
  });

  it("renders BIP Version label", async () => {
    await renderComponent();
    expect(screen.getByText("BIP Version")).toBeInTheDocument();
  });

  it("renders BIP Build ID label", async () => {
    await renderComponent();
    expect(screen.getByText("BIP Build ID")).toBeInTheDocument();
  });
});
