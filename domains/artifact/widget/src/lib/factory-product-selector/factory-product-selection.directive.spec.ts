import { Component, signal } from "@angular/core";
import { ComponentFixture } from "@angular/core/testing";
import { render, waitFor } from "@testing-library/angular";
import { By } from "@angular/platform-browser";
import { of } from "rxjs";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import {
  createPrimeNgSelectHarness,
  installPrimeNgSelectPolyfills,
} from "@mxevolve/shared/core/testing";
import {
  FactoryProductApiService,
  FactoryProduct,
  SoftwareProductVersion,
  SoftwareProductBuild,
  BipVersion,
} from "@mxevolve/domains/artifact/data-access";
import { FactoryProductSelectionDirective } from "./factory-product-selection.directive";
import {
  BipBuildOption,
  FactoryProductSelectionStateService,
} from "./factory-product-selection-state.service";
import { MxVersionDropdownComponent } from "./mx-version-dropdown/mx-version-dropdown.component";
import { MxBuildIdDropdownComponent } from "./mx-build-dropdown/mx-build-id-dropdown.component";
import { BipVersionDropdownComponent } from "./bip-version-dropdown/bip-version-dropdown.component";
import { BipBuildIdDropdownComponent } from "./bip-build-dropdown/bip-build-id-dropdown.component";

const MX_VERSION_DROPDOWN_SELECTOR = "mxevolve-mx-version-dropdown";
const MX_BUILD_DROPDOWN_SELECTOR = "mxevolve-mx-build-id-dropdown";
const BIP_VERSION_DROPDOWN_SELECTOR = "mxevolve-bip-version-dropdown";
const BIP_BUILD_DROPDOWN_SELECTOR = "mxevolve-bip-build-id-dropdown";

const FACTORY_PRODUCT_WITH_BIPS: FactoryProduct = {
  id: "fp-1",
  type: "OFFICIAL",
  createdOn: "2026-01-01",
  lastModifiedOn: "2026-01-01",
  createdBy: "user",
  lastModifiedBy: "user",
  softwareProduct: {
    id: "sp-1",
    version: "3.1.65",
    revision: "1",
    builds: [
      {
        id: "spb-1",
        purged: false,
        projectId: undefined,
        mxBuild: {
          version: "3.1.65",
          buildId: "build-1",
          revision: "1",
          os: "linux",
        },
        core: { id: "core-1", type: "CORE" },
        mxBundles: [],
      },
    ],
  },
  configurationComponents: [
    {
      id: "cc-1",
      type: "BIP",
      version: "bip-1.0",
      purged: false,
      builds: [
        {
          id: "ccb-1",
          purged: false,
          mxBuild: { version: "bip-1.0", buildId: "bip-build-1" },
          mxBundles: [],
        },
      ],
    },
  ],
};

const FACTORY_PRODUCT_ALL_PURGED: FactoryProduct = {
  ...FACTORY_PRODUCT_WITH_BIPS,
  id: "fp-purged",
  configurationComponents: [
    {
      id: "cc-purged",
      type: "BIP",
      version: "bip-purged",
      purged: true,
      builds: [],
    },
  ],
};

const FACTORY_PRODUCT_SINGLE_BIP: FactoryProduct = {
  ...FACTORY_PRODUCT_WITH_BIPS,
  id: "fp-single-bip",
  configurationComponents: [
    {
      id: "cc-single",
      type: "BIP",
      version: "bip-only",
      purged: false,
      builds: [
        {
          id: "ccb-single",
          purged: false,
          mxBuild: { version: "bip-only", buildId: "bip-build-only" },
          mxBundles: [],
        },
      ],
    },
  ],
};

const FACTORY_PRODUCT_NO_BUILDS_FOR_VERSION: FactoryProduct = {
  ...FACTORY_PRODUCT_WITH_BIPS,
  id: "fp-no-builds",
  configurationComponents: [
    {
      id: "cc-no-builds",
      type: "BIP",
      version: "bip-empty",
      purged: false,
      builds: [],
    },
  ],
};

const MOCK_IMPORTS = [
  FactoryProductSelectionDirective,
  MxVersionDropdownComponent,
  MxBuildIdDropdownComponent,
  BipVersionDropdownComponent,
  BipBuildIdDropdownComponent,
];

const mockApiService = {
  getFactoryProductById: jest.fn(),
  getFactoryProducts: jest.fn(),
  getDistinctVersions: jest.fn(),
  getDistinctBuilds: jest.fn(),
};

function createVersionOptionsResponse(versions: string[]) {
  return of({
    content: versions.map((version) => ({ version })),
    last: true,
  });
}

function createBuildOptionsResponse(buildIds: string[]) {
  return of({
    content: buildIds.map((buildId) => ({ buildId, projectId: undefined })),
    last: true,
  });
}

function createFactoryProductsResponse(factoryProducts: FactoryProduct[]) {
  return of({
    content: factoryProducts,
    last: true,
    totalPages: factoryProducts.length > 0 ? 1 : 0,
    totalElements: factoryProducts.length,
    size: 10,
    number: 0,
  });
}

function setFactoryProductsResponse(
  ...factoryProducts: FactoryProduct[]
): void {
  mockApiService.getFactoryProducts.mockReturnValue(
    createFactoryProductsResponse(factoryProducts)
  );
}

@Component({
  selector: "mxevolve-test-host",
  standalone: true,
  imports: MOCK_IMPORTS,
  template: `
    <div
      mxevolveFactoryProductSelection
      [projectId]="projectId()"
      [factoryProductId]="factoryProductId()"
      [initialMxVersion]="initialMxVersion()"
      [initialMxBuildId]="initialMxBuildId()"
      [initialBipVersion]="initialBipVersion()"
      [initialBipBuildId]="initialBipBuildId()"
      (mxVersionChange)="onMxVersionChange($event)"
      (mxBuildIdChange)="onMxBuildIdChange($event)"
      (bipVersionChange)="onBipVersionChange($event)"
      (bipBuildIdChange)="onBipBuildIdChange($event)"
      (factoryProductIdChange)="onFactoryProductIdChange($event)"
    >
      <mxevolve-mx-version-dropdown />
      <mxevolve-mx-build-id-dropdown />
      <mxevolve-bip-version-dropdown />
      <mxevolve-bip-build-id-dropdown />
    </div>
  `,
})
class TestHostComponent {
  readonly projectId = signal("project-1");
  readonly factoryProductId = signal<string | undefined>(undefined);
  readonly initialMxVersion = signal<SoftwareProductVersion | null>(null);
  readonly initialMxBuildId = signal<SoftwareProductBuild | null>(null);
  readonly initialBipVersion = signal<BipVersion | null>(null);
  readonly initialBipBuildId = signal<BipBuildOption | null>(null);

  onMxVersionChange = jest.fn();
  onMxBuildIdChange = jest.fn();
  onBipVersionChange = jest.fn();
  onBipBuildIdChange = jest.fn();
  onFactoryProductIdChange = jest.fn();
}

@Component({
  selector: "mxevolve-reactive-test-host",
  standalone: true,
  imports: [...MOCK_IMPORTS, ReactiveFormsModule],
  template: `
    <div
      mxevolveFactoryProductSelection
      [projectId]="projectId()"
      (factoryProductIdChange)="onFactoryProductIdChange($event)"
    >
      <mxevolve-mx-version-dropdown [formControl]="mxVersionControl" />
      <mxevolve-mx-build-id-dropdown [formControl]="mxBuildControl" />
      <mxevolve-bip-version-dropdown [formControl]="bipVersionControl" />
      <mxevolve-bip-build-id-dropdown [formControl]="bipBuildControl" />
    </div>
  `,
})
class ReactiveTestHostComponent {
  readonly projectId = signal("project-1");
  readonly mxVersionControl = new FormControl<SoftwareProductVersion | null>(
    null
  );
  readonly mxBuildControl = new FormControl<SoftwareProductBuild | null>(null);
  readonly bipVersionControl = new FormControl<BipVersion | null>(null);
  readonly bipBuildControl = new FormControl<BipBuildOption | null>(null);

  onFactoryProductIdChange = jest.fn();
}

function getStateService(
  fixture: ComponentFixture<unknown>
): FactoryProductSelectionStateService {
  const directiveElement = fixture.debugElement.query(
    By.directive(FactoryProductSelectionDirective)
  );
  return directiveElement.injector.get(FactoryProductSelectionStateService);
}

function getMxBuildDropdownComponent(fixture: ComponentFixture<unknown>): {
  stateProvider: {
    setSearchKey(searchKey: string): void;
    setPageIndex(index: number): void;
  };
} {
  const dropdownElement = fixture.debugElement.query(
    By.directive(MxBuildIdDropdownComponent)
  );

  return dropdownElement.componentInstance as {
    stateProvider: {
      setSearchKey(searchKey: string): void;
      setPageIndex(index: number): void;
    };
  };
}

async function renderComponent(
  inputs: Partial<{
    projectId: string;
    factoryProductId: string | undefined;
    initialMxVersion: SoftwareProductVersion | null;
    initialMxBuildId: SoftwareProductBuild | null;
    initialBipVersion: BipVersion | null;
    initialBipBuildId: BipBuildOption | null;
  }> = {}
) {
  const rendered = await render(TestHostComponent, {
    providers: [
      { provide: FactoryProductApiService, useValue: mockApiService },
    ],
    componentProperties: {
      ...(inputs.projectId && { projectId: signal(inputs.projectId) }),
      ...(inputs.factoryProductId !== undefined && {
        factoryProductId: signal(inputs.factoryProductId),
      }),
      ...(inputs.initialMxVersion !== undefined && {
        initialMxVersion: signal(inputs.initialMxVersion),
      }),
      ...(inputs.initialMxBuildId !== undefined && {
        initialMxBuildId: signal(inputs.initialMxBuildId),
      }),
      ...(inputs.initialBipVersion !== undefined && {
        initialBipVersion: signal(inputs.initialBipVersion),
      }),
      ...(inputs.initialBipBuildId !== undefined && {
        initialBipBuildId: signal(inputs.initialBipBuildId),
      }),
    },
  });

  return {
    ...rendered,
    mxVersionDropdown: createPrimeNgSelectHarness(
      rendered.fixture,
      MX_VERSION_DROPDOWN_SELECTOR
    ),
    mxBuildDropdown: createPrimeNgSelectHarness(
      rendered.fixture,
      MX_BUILD_DROPDOWN_SELECTOR
    ),
    bipVersionDropdown: createPrimeNgSelectHarness(
      rendered.fixture,
      BIP_VERSION_DROPDOWN_SELECTOR
    ),
    bipBuildDropdown: createPrimeNgSelectHarness(
      rendered.fixture,
      BIP_BUILD_DROPDOWN_SELECTOR
    ),
  };
}

async function renderReactiveComponent() {
  const rendered = await render(ReactiveTestHostComponent, {
    providers: [
      { provide: FactoryProductApiService, useValue: mockApiService },
    ],
  });

  return {
    ...rendered,
    mxVersionDropdown: createPrimeNgSelectHarness(
      rendered.fixture,
      MX_VERSION_DROPDOWN_SELECTOR
    ),
    mxBuildDropdown: createPrimeNgSelectHarness(
      rendered.fixture,
      MX_BUILD_DROPDOWN_SELECTOR
    ),
    bipVersionDropdown: createPrimeNgSelectHarness(
      rendered.fixture,
      BIP_VERSION_DROPDOWN_SELECTOR
    ),
    bipBuildDropdown: createPrimeNgSelectHarness(
      rendered.fixture,
      BIP_BUILD_DROPDOWN_SELECTOR
    ),
  };
}

describe("FactoryProductSelection integration", () => {
  beforeAll(() => {
    installPrimeNgSelectPolyfills();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.getDistinctVersions.mockReturnValue(
      createVersionOptionsResponse([])
    );
    mockApiService.getDistinctBuilds.mockReturnValue(
      createBuildOptionsResponse([])
    );
    setFactoryProductsResponse();
  });

  describe("rendering", () => {
    it("renders all four dropdown components", async () => {
      await renderComponent();

      expect(document.querySelector(MX_VERSION_DROPDOWN_SELECTOR)).toBeTruthy();
      expect(document.querySelector(MX_BUILD_DROPDOWN_SELECTOR)).toBeTruthy();
      expect(
        document.querySelector(BIP_VERSION_DROPDOWN_SELECTOR)
      ).toBeTruthy();
      expect(document.querySelector(BIP_BUILD_DROPDOWN_SELECTOR)).toBeTruthy();
    });
  });

  describe("initial state", () => {
    it("sets projectId on the state service from the directive input", async () => {
      const { fixture } = await renderComponent({ projectId: "my-project" });

      const state = getStateService(fixture);
      expect(state.projectId()).toBe("my-project");
    });

    it("shows MX Version dropdown as enabled initially", async () => {
      expect.hasAssertions();
      const { mxVersionDropdown } = await renderComponent();

      await waitFor(() => mxVersionDropdown.expectToBeEnabled());
    });

    it("shows MX Build dropdown as disabled when no MX Version is selected", async () => {
      expect.hasAssertions();
      const { mxBuildDropdown } = await renderComponent();

      await waitFor(() => mxBuildDropdown.expectToBeDisabled());
    });

    it("shows BIP Version dropdown as disabled when no MX Build is selected", async () => {
      expect.hasAssertions();
      const { bipVersionDropdown } = await renderComponent();

      await waitFor(() => bipVersionDropdown.expectToBeDisabled());
    });

    it("shows BIP Build dropdown as disabled when no BIP Version is selected", async () => {
      expect.hasAssertions();
      const { bipBuildDropdown } = await renderComponent();

      await waitFor(() => bipBuildDropdown.expectToBeDisabled());
    });
  });

  describe("cascade: selecting MX version", () => {
    beforeEach(() => {
      mockApiService.getDistinctVersions.mockReturnValue(
        createVersionOptionsResponse(["3.1.65", "3.1.66"])
      );
    });

    it("enables MX Build dropdown after clicking an MX Version option", async () => {
      expect.hasAssertions();
      const { mxVersionDropdown, mxBuildDropdown } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");

      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
    });

    it("keeps BIP Version dropdown disabled after clicking only an MX Version option", async () => {
      expect.hasAssertions();
      const { mxVersionDropdown, bipVersionDropdown } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");

      await waitFor(() => bipVersionDropdown.expectToBeDisabled());
    });

    it("keeps BIP Build dropdown disabled after clicking only an MX Version option", async () => {
      expect.hasAssertions();
      const { mxVersionDropdown, bipBuildDropdown } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");

      await waitFor(() => bipBuildDropdown.expectToBeDisabled());
    });

    it("emits mxVersionChange when the user clicks an MX Version option", async () => {
      const { fixture, mxVersionDropdown } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");

      await waitFor(() =>
        expect(
          fixture.componentInstance.onMxVersionChange
        ).toHaveBeenCalledWith({ version: "3.1.65" })
      );
    });

    it("displays the selected MX Version in the dropdown", async () => {
      expect.hasAssertions();
      const { mxVersionDropdown } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");

      await waitFor(() => mxVersionDropdown.expectToHaveValue("3.1.65"));
    });
  });

  describe("cascade: selecting MX build", () => {
    beforeEach(() => {
      mockApiService.getDistinctVersions.mockReturnValue(
        createVersionOptionsResponse(["3.1.65"])
      );
      mockApiService.getDistinctBuilds.mockReturnValue(
        createBuildOptionsResponse(["build-1"])
      );
    });

    it("keeps BIP Version dropdown disabled when factory products have no non-purged BIPs", async () => {
      expect.hasAssertions();
      const { mxVersionDropdown, mxBuildDropdown, bipVersionDropdown } =
        await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");

      await waitFor(() => bipVersionDropdown.expectToBeDisabled());
    });

    it("keeps BIP Version dropdown disabled when the factory product has no BIPs", async () => {
      expect.hasAssertions();
      setFactoryProductsResponse({
        ...FACTORY_PRODUCT_WITH_BIPS,
        configurationComponents: [],
      });

      const { mxVersionDropdown, mxBuildDropdown, bipVersionDropdown } =
        await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");

      await waitFor(() => bipVersionDropdown.expectToBeDisabled());
    });

    it("enables BIP Version dropdown after factory products with non-purged BIPs are fetched", async () => {
      expect.hasAssertions();
      setFactoryProductsResponse(FACTORY_PRODUCT_WITH_BIPS);

      const { mxVersionDropdown, mxBuildDropdown, bipVersionDropdown } =
        await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");

      await waitFor(() => bipVersionDropdown.expectToBeEnabled());
    });

    it("emits mxBuildIdChange when the user clicks an MX Build option", async () => {
      const { fixture, mxVersionDropdown, mxBuildDropdown } =
        await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");

      await waitFor(() =>
        expect(
          fixture.componentInstance.onMxBuildIdChange
        ).toHaveBeenCalledWith({ buildId: "build-1", projectId: undefined })
      );
    });

    it("emits factoryProductIdChange when the factory product has no BIPs", async () => {
      setFactoryProductsResponse({
        ...FACTORY_PRODUCT_WITH_BIPS,
        id: "fp-no-bips",
        configurationComponents: [],
      });

      const { fixture, mxVersionDropdown, mxBuildDropdown } =
        await renderComponent();

      fixture.componentInstance.onFactoryProductIdChange.mockClear();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");

      await waitFor(() =>
        expect(
          fixture.componentInstance.onFactoryProductIdChange
        ).toHaveBeenCalledWith("fp-no-bips")
      );
    });

    it("keeps BIP Build dropdown disabled after clicking only an MX Build option", async () => {
      expect.hasAssertions();
      setFactoryProductsResponse(FACTORY_PRODUCT_WITH_BIPS);

      const { mxVersionDropdown, mxBuildDropdown, bipBuildDropdown } =
        await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");

      await waitFor(() => bipBuildDropdown.expectToBeDisabled());
    });

    it("displays the selected MX Build in the dropdown", async () => {
      expect.hasAssertions();
      const { mxVersionDropdown, mxBuildDropdown } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");

      await waitFor(() => mxBuildDropdown.expectToHaveValue("build-1"));
    });
  });

  describe("cascade: selecting BIP version and BIP build", () => {
    beforeEach(() => {
      mockApiService.getDistinctVersions.mockReturnValue(
        createVersionOptionsResponse(["3.1.65"])
      );
      mockApiService.getDistinctBuilds.mockReturnValue(
        createBuildOptionsResponse(["build-1"])
      );
      setFactoryProductsResponse(FACTORY_PRODUCT_WITH_BIPS);
    });

    it("emits bipVersionChange when the user clicks a BIP Version option", async () => {
      const {
        fixture,
        mxVersionDropdown,
        mxBuildDropdown,
        bipVersionDropdown,
      } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");
      await waitFor(() => bipVersionDropdown.expectToBeEnabled());
      await bipVersionDropdown.select("bip-1.0");

      await waitFor(() =>
        expect(
          fixture.componentInstance.onBipVersionChange
        ).toHaveBeenCalledWith({ version: "bip-1.0" })
      );
    });

    it("emits bipBuildIdChange when the user clicks a BIP Build option", async () => {
      const {
        fixture,
        mxVersionDropdown,
        mxBuildDropdown,
        bipVersionDropdown,
        bipBuildDropdown,
      } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");
      await waitFor(() => bipVersionDropdown.expectToBeEnabled());
      await bipVersionDropdown.select("bip-1.0");
      await waitFor(() => bipBuildDropdown.expectToBeEnabled());
      await bipBuildDropdown.select("bip-build-1");

      await waitFor(() =>
        expect(
          fixture.componentInstance.onBipBuildIdChange
        ).toHaveBeenCalledWith({
          buildId: "bip-build-1",
          factoryProductId: "fp-1",
        })
      );
    });

    it("emits factoryProductIdChange after the user completes the full cascade", async () => {
      const {
        fixture,
        mxVersionDropdown,
        mxBuildDropdown,
        bipVersionDropdown,
        bipBuildDropdown,
      } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");
      await waitFor(() => bipVersionDropdown.expectToBeEnabled());
      await bipVersionDropdown.select("bip-1.0");
      await waitFor(() => bipBuildDropdown.expectToBeEnabled());
      await bipBuildDropdown.select("bip-build-1");

      await waitFor(() =>
        expect(
          fixture.componentInstance.onFactoryProductIdChange
        ).toHaveBeenCalledWith("fp-1")
      );
    });

    it("displays the selected BIP Version in the dropdown", async () => {
      expect.hasAssertions();
      const { mxVersionDropdown, mxBuildDropdown, bipVersionDropdown } =
        await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");
      await waitFor(() => bipVersionDropdown.expectToBeEnabled());
      await bipVersionDropdown.select("bip-1.0");

      await waitFor(() => bipVersionDropdown.expectToHaveValue("bip-1.0"));
    });

    it("displays the selected BIP Build in the dropdown", async () => {
      expect.hasAssertions();
      const {
        mxVersionDropdown,
        mxBuildDropdown,
        bipVersionDropdown,
        bipBuildDropdown,
      } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");
      await waitFor(() => bipVersionDropdown.expectToBeEnabled());
      await bipVersionDropdown.select("bip-1.0");
      await waitFor(() => bipBuildDropdown.expectToBeEnabled());
      await bipBuildDropdown.select("bip-build-1");

      await waitFor(() => bipBuildDropdown.expectToHaveValue("bip-build-1"));
    });
  });

  describe("edge cases", () => {
    beforeEach(() => {
      mockApiService.getDistinctVersions.mockReturnValue(
        createVersionOptionsResponse(["3.1.65"])
      );
      mockApiService.getDistinctBuilds.mockReturnValue(
        createBuildOptionsResponse(["build-1"])
      );
    });

    it("keeps BIP Version dropdown disabled when accumulated FPs have no non-purged config components", async () => {
      expect.hasAssertions();
      setFactoryProductsResponse(FACTORY_PRODUCT_ALL_PURGED);

      const { mxVersionDropdown, mxBuildDropdown, bipVersionDropdown } =
        await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");

      await waitFor(() => bipVersionDropdown.expectToBeDisabled());
    });

    it("keeps BIP Build dropdown disabled when BIP version has no matching builds", async () => {
      expect.hasAssertions();
      setFactoryProductsResponse(FACTORY_PRODUCT_NO_BUILDS_FOR_VERSION);

      const {
        mxVersionDropdown,
        mxBuildDropdown,
        bipVersionDropdown,
        bipBuildDropdown,
      } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");
      await waitFor(() => bipVersionDropdown.expectToBeEnabled());
      await bipVersionDropdown.select("bip-empty");

      await waitFor(() => bipBuildDropdown.expectToBeDisabled());
    });
  });

  describe("cascade reset", () => {
    beforeEach(() => {
      mockApiService.getDistinctVersions.mockReturnValue(
        createVersionOptionsResponse(["3.1.65", "3.1.66"])
      );
      mockApiService.getDistinctBuilds.mockReturnValue(
        createBuildOptionsResponse(["build-1"])
      );
      setFactoryProductsResponse(FACTORY_PRODUCT_WITH_BIPS);
    });

    it("disables MX Build dropdown when the user selects a different MX Version after a full cascade", async () => {
      expect.hasAssertions();
      const { mxVersionDropdown, mxBuildDropdown, bipVersionDropdown } =
        await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");
      await waitFor(() => bipVersionDropdown.expectToBeEnabled());

      await mxVersionDropdown.select("3.1.66");

      await waitFor(() => bipVersionDropdown.expectToBeDisabled());
    });

    it("emits null for downstream outputs when the user re-selects MX Version", async () => {
      const {
        fixture,
        mxVersionDropdown,
        mxBuildDropdown,
        bipVersionDropdown,
      } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");
      await waitFor(() => bipVersionDropdown.expectToBeEnabled());

      fixture.componentInstance.onMxBuildIdChange.mockClear();

      await mxVersionDropdown.select("3.1.66");

      await waitFor(() =>
        expect(
          fixture.componentInstance.onMxBuildIdChange
        ).toHaveBeenCalledWith(null)
      );
    });

    it("clears the MX Build dropdown value when the user selects a different MX Version", async () => {
      expect.hasAssertions();
      const { mxVersionDropdown, mxBuildDropdown } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");

      await mxVersionDropdown.select("3.1.66");

      await waitFor(() => expect(mxBuildDropdown.getValue()).toBeNull());
    });
  });

  describe("auto-selection", () => {
    it("auto-selects the only MX build when exactly one result is returned", async () => {
      mockApiService.getDistinctVersions.mockReturnValue(
        createVersionOptionsResponse(["3.1.65"])
      );
      mockApiService.getDistinctBuilds.mockReturnValue(
        createBuildOptionsResponse(["build-1"])
      );

      const { fixture, mxVersionDropdown, bipVersionDropdown } =
        await renderComponent();

      await mxVersionDropdown.select("3.1.65");

      await waitFor(() =>
        expect(
          fixture.componentInstance.onMxBuildIdChange
        ).toHaveBeenCalledWith({ buildId: "build-1", projectId: undefined })
      );
      await waitFor(() => bipVersionDropdown.expectToBeDisabled());
    });

    it("displays the auto-selected MX Build in the dropdown", async () => {
      expect.hasAssertions();
      mockApiService.getDistinctVersions.mockReturnValue(
        createVersionOptionsResponse(["3.1.65"])
      );
      mockApiService.getDistinctBuilds.mockReturnValue(
        createBuildOptionsResponse(["build-1"])
      );

      const { mxVersionDropdown, mxBuildDropdown } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");

      await waitFor(() => mxBuildDropdown.expectToHaveValue("build-1"));
    });

    it("does not auto-select MX build when multiple builds are returned", async () => {
      mockApiService.getDistinctVersions.mockReturnValue(
        createVersionOptionsResponse(["3.1.65"])
      );
      mockApiService.getDistinctBuilds.mockReturnValue(
        createBuildOptionsResponse(["build-1", "build-2"])
      );

      const { fixture, mxVersionDropdown, bipVersionDropdown } =
        await renderComponent();

      await mxVersionDropdown.select("3.1.65");

      await waitFor(() => bipVersionDropdown.expectToBeDisabled());
      expect(
        fixture.componentInstance.onMxBuildIdChange
      ).not.toHaveBeenCalledWith({ buildId: "build-1", projectId: undefined });
      expect(
        fixture.componentInstance.onMxBuildIdChange
      ).not.toHaveBeenCalledWith({ buildId: "build-2", projectId: undefined });
    });

    it("does not auto-select MX build when a search narrows the results to one item", async () => {
      mockApiService.getDistinctVersions.mockReturnValue(
        createVersionOptionsResponse(["3.1.65"])
      );
      mockApiService.getDistinctBuilds.mockImplementation(
        (
          _projectId: string,
          _softwareProductVersion: string,
          _pageIndex: number,
          _pageSize: number,
          searchKey?: string
        ) =>
          createBuildOptionsResponse(
            searchKey ? ["build-1"] : ["build-1", "build-2"]
          )
      );

      const {
        fixture,
        mxVersionDropdown,
        mxBuildDropdown,
        bipVersionDropdown,
      } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());

      const mxBuildDropdownComponent = getMxBuildDropdownComponent(fixture);
      mxBuildDropdownComponent.stateProvider.setSearchKey("build-1");
      mxBuildDropdownComponent.stateProvider.setPageIndex(0);

      await waitFor(() => bipVersionDropdown.expectToBeDisabled());
      expect(
        fixture.componentInstance.onMxBuildIdChange
      ).not.toHaveBeenCalledWith({ buildId: "build-1", projectId: undefined });
    });

    it("auto-selects the only BIP build when exactly one build exists for the selected BIP version", async () => {
      mockApiService.getDistinctVersions.mockReturnValue(
        createVersionOptionsResponse(["3.1.65"])
      );
      mockApiService.getDistinctBuilds.mockReturnValue(
        createBuildOptionsResponse(["build-1"])
      );
      setFactoryProductsResponse(FACTORY_PRODUCT_SINGLE_BIP);

      const { fixture, mxVersionDropdown, mxBuildDropdown } =
        await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");

      await waitFor(() =>
        expect(
          fixture.componentInstance.onFactoryProductIdChange
        ).toHaveBeenCalledWith("fp-single-bip")
      );
    });

    it("displays the auto-selected BIP version and build in the dropdowns", async () => {
      expect.hasAssertions();
      mockApiService.getDistinctVersions.mockReturnValue(
        createVersionOptionsResponse(["3.1.65"])
      );
      mockApiService.getDistinctBuilds.mockReturnValue(
        createBuildOptionsResponse(["build-1"])
      );
      setFactoryProductsResponse(FACTORY_PRODUCT_SINGLE_BIP);

      const {
        mxVersionDropdown,
        mxBuildDropdown,
        bipVersionDropdown,
        bipBuildDropdown,
      } = await renderComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");

      await waitFor(() => bipVersionDropdown.expectToHaveValue("bip-only"));
      await waitFor(() => bipBuildDropdown.expectToHaveValue("bip-build-only"));
    });
  });

  describe("prefill / edit flow", () => {
    it("populates all dropdowns when factoryProductId input is provided", async () => {
      expect.hasAssertions();
      mockApiService.getFactoryProductById.mockReturnValue(
        of(FACTORY_PRODUCT_WITH_BIPS)
      );

      const { mxVersionDropdown, mxBuildDropdown, bipVersionDropdown } =
        await renderComponent({
          factoryProductId: "fp-1",
        });

      await waitFor(() => mxVersionDropdown.expectToHaveValue("3.1.65"));
      mxBuildDropdown.expectToHaveValue("build-1");
      bipVersionDropdown.expectToHaveValue("bip-1.0");
    });

    it("calls the API with projectId and factoryProductId when factoryProductId input is provided", async () => {
      mockApiService.getFactoryProductById.mockReturnValue(
        of(FACTORY_PRODUCT_WITH_BIPS)
      );

      await renderComponent({ factoryProductId: "fp-1" });

      expect(mockApiService.getFactoryProductById).toHaveBeenCalledWith(
        "project-1",
        "fp-1"
      );
    });

    it("populates dropdowns from initialMxVersion and initialMxBuildId inputs", async () => {
      expect.hasAssertions();
      const { mxVersionDropdown, mxBuildDropdown } = await renderComponent({
        initialMxVersion: { version: "3.1.65" },
        initialMxBuildId: { buildId: "build-1", projectId: undefined },
      });

      await waitFor(() => mxVersionDropdown.expectToHaveValue("3.1.65"));
      mxBuildDropdown.expectToHaveValue("build-1");
    });

    it("populates dropdowns from initialBipVersion and initialBipBuildId inputs", async () => {
      expect.hasAssertions();
      const { bipVersionDropdown, bipBuildDropdown } = await renderComponent({
        initialMxVersion: { version: "3.1.65" },
        initialMxBuildId: { buildId: "build-1", projectId: undefined },
        initialBipVersion: { version: "bip-1.0" },
        initialBipBuildId: {
          buildId: "bip-build-1",
          factoryProductId: "fp-1",
        },
      });

      await waitFor(() => bipVersionDropdown.expectToHaveValue("bip-1.0"));
      bipBuildDropdown.expectToHaveValue("bip-build-1");
    });

    it("does not call the API when factoryProductId is not provided", async () => {
      await renderComponent();

      expect(mockApiService.getFactoryProductById).not.toHaveBeenCalled();
    });

    it("does not prefill when no initial inputs are provided", async () => {
      const { mxVersionDropdown, mxBuildDropdown } = await renderComponent();

      expect(mxVersionDropdown.getValue()).toBeNull();
      expect(mxBuildDropdown.getValue()).toBeNull();
    });
  });

  describe("FormControl binding (ControlValueAccessor)", () => {
    beforeEach(() => {
      mockApiService.getDistinctVersions.mockReturnValue(
        createVersionOptionsResponse(["3.1.65", "3.1.66"])
      );
      mockApiService.getDistinctBuilds.mockReturnValue(
        createBuildOptionsResponse(["build-1"])
      );
      setFactoryProductsResponse(FACTORY_PRODUCT_WITH_BIPS);
    });

    it("emits factoryProductIdChange after completing the full cascade in reactive form", async () => {
      const {
        fixture,
        mxVersionDropdown,
        mxBuildDropdown,
        bipVersionDropdown,
        bipBuildDropdown,
      } = await renderReactiveComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");
      await waitFor(() => bipVersionDropdown.expectToBeEnabled());
      await bipVersionDropdown.select("bip-1.0");
      await waitFor(() => bipBuildDropdown.expectToBeEnabled());
      await bipBuildDropdown.select("bip-build-1");

      await waitFor(() =>
        expect(
          fixture.componentInstance.onFactoryProductIdChange
        ).toHaveBeenCalledWith("fp-1")
      );
    });

    it("resets factoryProductId when the user selects a different MX Version after a full cascade", async () => {
      const {
        fixture,
        mxVersionDropdown,
        mxBuildDropdown,
        bipVersionDropdown,
        bipBuildDropdown,
      } = await renderReactiveComponent();

      await mxVersionDropdown.select("3.1.65");
      await waitFor(() => mxBuildDropdown.expectToBeEnabled());
      await mxBuildDropdown.select("build-1");
      await waitFor(() => bipVersionDropdown.expectToBeEnabled());
      await bipVersionDropdown.select("bip-1.0");
      await waitFor(() => bipBuildDropdown.expectToBeEnabled());
      await bipBuildDropdown.select("bip-build-1");

      await waitFor(() =>
        expect(
          fixture.componentInstance.onFactoryProductIdChange
        ).toHaveBeenCalledWith("fp-1")
      );

      fixture.componentInstance.onFactoryProductIdChange.mockClear();

      await mxVersionDropdown.select("3.1.66");

      await waitFor(() =>
        expect(
          fixture.componentInstance.onFactoryProductIdChange
        ).toHaveBeenCalledWith(undefined)
      );
    });
  });
});
