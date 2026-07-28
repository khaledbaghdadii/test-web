import { Component } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { render } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { of } from "rxjs";
import { MxevolveSingleSelectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import {
  FactoryProduct,
  FactoryProductApiService,
} from "@mxevolve/domains/artifact/data-access";
import { FactoryProductSelectorComponent } from "./factory-product-form-selector.component";
import {
  FactoryProductValue,
  mapFactoryProductToValue,
} from "./factory-product-data-provider";

@Component({
  template: `
    <mxevolve-factory-product-selector
      [projectId]="'project-1'"
      [formControl]="control"
      (failureEvent)="onFailure($event)"
    />
  `,
  imports: [FactoryProductSelectorComponent, ReactiveFormsModule],
})
class HostComponent {
  control = new FormControl<FactoryProductValue | null>(null);
  onFailure = jest.fn();
}

const factoryProductService = {
  getFactoryProducts: jest.fn().mockReturnValue(of({ content: [] })),
};

async function renderComponent() {
  return render(HostComponent, {
    imports: [MockComponent(MxevolveSingleSelectDropdownComponent)],
    componentProviders: [
      { provide: FactoryProductApiService, useValue: factoryProductService },
    ],
  });
}

const PRODUCT = {
  id: "fp-1",
  softwareProduct: {
    version: "MX-3.1",
    builds: [
      { mxBundles: [], mxBuild: { buildId: "no-bundles" } },
      { mxBundles: [{ id: "b", type: "t" }], mxBuild: { buildId: "mx-build" } },
    ],
  },
  configurationComponents: [
    {
      version: "BIP-2.0",
      builds: [
        {
          mxBundles: [{ id: "b", type: "t" }],
          mxBuild: { buildId: "bip-build" },
        },
      ],
    },
  ],
} as unknown as FactoryProduct;

describe("FactoryProductSelectorComponent", () => {
  it("maps the selected factory product to the submitted value", async () => {
    const view = await renderComponent();

    ngMocks
      .find(MxevolveSingleSelectDropdownComponent)
      .componentInstance.selectionChange.emit(PRODUCT);

    expect(view.fixture.componentInstance.control.value).toEqual({
      id: "fp-1",
      mxVersion: "MX-3.1",
      mxBuildId: "mx-build",
      bipVersion: "BIP-2.0",
      bipBuildId: "bip-build",
    });
  });

  it("mapFactoryProductToValue picks the build carrying MX bundles", () => {
    expect(mapFactoryProductToValue(PRODUCT).mxBuildId).toBe("mx-build");
    expect(mapFactoryProductToValue(PRODUCT).bipBuildId).toBe("bip-build");
  });

  it("surfaces fetch errors via failureEvent", async () => {
    const view = await renderComponent();

    ngMocks
      .find(MxevolveSingleSelectDropdownComponent)
      .componentInstance.errorEvent.emit("Unable to load factory products");

    expect(view.fixture.componentInstance.onFailure).toHaveBeenCalledWith(
      "Unable to load factory products"
    );
  });
});
