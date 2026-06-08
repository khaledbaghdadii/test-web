import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import {
  FactoryProductApiService,
  FactoryProduct,
  SoftwareProductBuild,
} from "@mxevolve/domains/artifact/data-access";
import { FactoryProductSelectionStateService } from "./factory-product-selection-state.service";

const SINGLE_AVAILABLE_MX_BUILD: SoftwareProductBuild = {
  buildId: "build-1",
  projectId: undefined,
};

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
    {
      id: "cc-2",
      type: "BIP",
      version: "bip-2.0",
      purged: false,
      builds: [
        {
          id: "ccb-2",
          purged: false,
          mxBuild: { version: "bip-2.0", buildId: "bip-build-2" },
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
      id: "cc-purged-1",
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

const FACTORY_PRODUCT_MIXED_PURGED: FactoryProduct = {
  ...FACTORY_PRODUCT_WITH_BIPS,
  id: "fp-mixed",
  configurationComponents: [
    {
      id: "cc-purged",
      type: "BIP",
      version: "bip-purged",
      purged: true,
      builds: [],
    },
    {
      id: "cc-not-purged",
      type: "BIP",
      version: "bip-alive",
      purged: false,
      builds: [
        {
          id: "ccb-alive",
          purged: false,
          mxBuild: { version: "bip-alive", buildId: "bip-build-alive" },
          mxBundles: [],
        },
      ],
    },
  ],
};

const FACTORY_PRODUCT_WITH_PURGED_BUILD: FactoryProduct = {
  ...FACTORY_PRODUCT_WITH_BIPS,
  id: "fp-purged-build",
  configurationComponents: [
    {
      id: "cc-purged-build",
      type: "BIP",
      version: "bip-1.0",
      purged: false,
      builds: [
        {
          id: "ccb-purged",
          purged: true,
          mxBuild: { version: "bip-1.0", buildId: "purged-build" },
          mxBundles: [],
        },
        {
          id: "ccb-not-purged",
          purged: false,
          mxBuild: { version: "bip-1.0", buildId: "active-build" },
          mxBundles: [],
        },
      ],
    },
  ],
};

const FACTORY_PRODUCT_DUPLICATE_BUILDS: FactoryProduct = {
  ...FACTORY_PRODUCT_WITH_BIPS,
  id: "fp-dup-builds",
  configurationComponents: [
    {
      id: "cc-dup-1",
      type: "BIP",
      version: "bip-1.0",
      purged: false,
      builds: [
        {
          id: "shared-build-id",
          purged: false,
          mxBuild: { version: "bip-1.0", buildId: "shared-build-id" },
          mxBundles: [],
        },
      ],
    },
    {
      id: "cc-dup-2",
      type: "BIP",
      version: "bip-1.0",
      purged: false,
      builds: [
        {
          id: "shared-build-id",
          purged: false,
          mxBuild: { version: "bip-1.0", buildId: "shared-build-id" },
          mxBundles: [],
        },
      ],
    },
  ],
};

describe("FactoryProductSelectionStateService", () => {
  let service: FactoryProductSelectionStateService;
  let mockApiService: jest.Mocked<FactoryProductApiService>;

  beforeEach(() => {
    mockApiService = {
      getFactoryProductById: jest.fn(),
      getFactoryProducts: jest.fn(),
      getDistinctVersions: jest.fn(),
      getDistinctBuilds: jest.fn(),
    } as unknown as jest.Mocked<FactoryProductApiService>;

    TestBed.configureTestingModule({
      providers: [
        FactoryProductSelectionStateService,
        { provide: FactoryProductApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(FactoryProductSelectionStateService);
  });

  describe("selectBipVersion", () => {
    it("does not auto-select when bipBuildOptions has multiple entries", () => {
      const factoryProductWithMultipleBuilds: FactoryProduct = {
        ...FACTORY_PRODUCT_WITH_BIPS,
        configurationComponents: [
          {
            id: "cc-multi",
            type: "BIP",
            version: "bip-1.0",
            purged: false,
            builds: [
              {
                id: "ccb-a",
                purged: false,
                mxBuild: { version: "bip-1.0", buildId: "bip-build-a" },
                mxBundles: [],
              },
              {
                id: "ccb-b",
                purged: false,
                mxBuild: { version: "bip-1.0", buildId: "bip-build-b" },
                mxBundles: [],
              },
            ],
          },
        ],
      };
      service.accumulatedFactoryProducts.set([
        factoryProductWithMultipleBuilds,
      ]);

      service.selectBipVersion({ version: "bip-1.0" });

      expect(service.bipBuildId()).toBeNull();
    });

    it("does not auto-select when called with null", () => {
      service.accumulatedFactoryProducts.set([FACTORY_PRODUCT_SINGLE_BIP]);

      service.selectBipVersion(null);

      expect(service.bipBuildId()).toBeNull();
    });
  });

  describe("isCustomBuild", () => {
    it("returns true when mxBuildId has a projectId", () => {
      service.mxBuildId.set({ buildId: "build-1", projectId: "project-1" });

      expect(service.isCustomBuild()).toBe(true);
    });

    it("returns false when mxBuildId has no projectId", () => {
      service.mxBuildId.set({ buildId: "build-1", projectId: undefined });

      expect(service.isCustomBuild()).toBe(false);
    });

    it("returns false when mxBuildId is null", () => {
      expect(service.isCustomBuild()).toBe(false);
    });

    describe("applyMxBuildAutoSelection", () => {
      it("does not auto-select when the result page is not the last page", () => {
        service.mxVersion.set({ version: "3.1.65" });

        service.applyMxBuildAutoSelection(
          [SINGLE_AVAILABLE_MX_BUILD],
          false,
          false
        );

        expect(service.mxBuildId()).toBeNull();
      });

      it("does not auto-select when an MX build is already selected", () => {
        service.mxVersion.set({ version: "3.1.65" });
        service.mxBuildId.set({
          buildId: "existing-build",
          projectId: undefined,
        });

        service.applyMxBuildAutoSelection(
          [SINGLE_AVAILABLE_MX_BUILD],
          true,
          false
        );

        expect(service.mxBuildId()).toEqual({
          buildId: "existing-build",
          projectId: undefined,
        });
      });

      it("does not auto-select when no MX version is selected", () => {
        service.applyMxBuildAutoSelection(
          [SINGLE_AVAILABLE_MX_BUILD],
          true,
          false
        );

        expect(service.mxBuildId()).toBeNull();
      });
    });
  });

  describe("bipBuildOptions", () => {
    it("returns empty array when bipVersion is null", () => {
      service.accumulatedFactoryProducts.set([FACTORY_PRODUCT_WITH_BIPS]);

      expect(service.bipBuildOptions()).toEqual([]);
    });

    it("returns builds matching the selected BIP version", () => {
      service.accumulatedFactoryProducts.set([FACTORY_PRODUCT_WITH_BIPS]);
      service.bipVersion.set({ version: "bip-1.0" });

      const options = service.bipBuildOptions();

      expect(options).toEqual([
        {
          label: "bip-build-1",
          value: { buildId: "bip-build-1", factoryProductId: "fp-1" },
        },
      ]);
    });

    it("excludes purged config components", () => {
      service.accumulatedFactoryProducts.set([FACTORY_PRODUCT_MIXED_PURGED]);
      service.bipVersion.set({ version: "bip-purged" });

      expect(service.bipBuildOptions()).toEqual([]);
    });

    it("excludes purged builds", () => {
      service.accumulatedFactoryProducts.set([
        FACTORY_PRODUCT_WITH_PURGED_BUILD,
      ]);
      service.bipVersion.set({ version: "bip-1.0" });

      const options = service.bipBuildOptions();

      expect(options).toEqual([
        {
          label: "active-build",
          value: {
            buildId: "active-build",
            factoryProductId: "fp-purged-build",
          },
        },
      ]);
    });

    it("deduplicates builds by build ID", () => {
      service.accumulatedFactoryProducts.set([
        FACTORY_PRODUCT_DUPLICATE_BUILDS,
      ]);
      service.bipVersion.set({ version: "bip-1.0" });

      const options = service.bipBuildOptions();

      expect(options).toHaveLength(1);
      expect(options[0].value.buildId).toBe("shared-build-id");
    });

    it("returns empty when no config components match the selected BIP version", () => {
      service.accumulatedFactoryProducts.set([FACTORY_PRODUCT_WITH_BIPS]);
      service.bipVersion.set({ version: "non-existent" });

      expect(service.bipBuildOptions()).toEqual([]);
    });
  });

  describe("accumulateFactoryProducts", () => {
    it("accumulates FPs across multiple calls", () => {
      service.accumulateFactoryProducts([FACTORY_PRODUCT_WITH_BIPS], false);
      service.accumulateFactoryProducts([FACTORY_PRODUCT_SINGLE_BIP], true);

      expect(service.accumulatedFactoryProducts()).toHaveLength(2);
      expect(service.accumulatedFactoryProducts()[0].id).toBe("fp-1");
      expect(service.accumulatedFactoryProducts()[1].id).toBe("fp-single-bip");
    });

    it("does not set factoryProductId when FPs have non-purged config components", () => {
      service.accumulateFactoryProducts([FACTORY_PRODUCT_WITH_BIPS], false);

      expect(service.factoryProductId()).toBeUndefined();
    });

    it("auto-selects BIP version on last page when exactly one unique non-purged version exists", () => {
      service.accumulateFactoryProducts([FACTORY_PRODUCT_SINGLE_BIP], true);

      expect(service.bipVersion()).toEqual({ version: "bip-only" });
    });

    it("does not auto-select BIP version when multiple unique versions exist on last page", () => {
      service.accumulateFactoryProducts([FACTORY_PRODUCT_WITH_BIPS], true);

      expect(service.bipVersion()).toBeNull();
    });

    it("does not auto-select BIP version when not the last page", () => {
      service.accumulateFactoryProducts([FACTORY_PRODUCT_SINGLE_BIP], false);

      expect(service.bipVersion()).toBeNull();
    });

    it("counts unique versions only from non-purged config components", () => {
      service.accumulateFactoryProducts([FACTORY_PRODUCT_MIXED_PURGED], true);

      expect(service.bipVersion()).toEqual({ version: "bip-alive" });
    });
  });

  describe("prefill", () => {
    it("sets mxVersion when provided", () => {
      service.prefill({ version: "3.1.65" }, null, null, null);

      expect(service.mxVersion()).toEqual({ version: "3.1.65" });
    });

    it("sets mxBuildId when provided", () => {
      service.prefill(
        null,
        { buildId: "build-1", projectId: undefined },
        null,
        null
      );

      expect(service.mxBuildId()).toEqual({
        buildId: "build-1",
        projectId: undefined,
      });
    });

    it("sets bipVersion when provided", () => {
      service.prefill(null, null, { version: "bip-1.0" }, null);

      expect(service.bipVersion()).toEqual({ version: "bip-1.0" });
    });

    it("sets bipBuildId and factoryProductId when provided", () => {
      service.prefill(null, null, null, {
        buildId: "bip-build-1",
        factoryProductId: "fp-1",
      });

      expect(service.bipBuildId()).toEqual({
        buildId: "bip-build-1",
        factoryProductId: "fp-1",
      });
      expect(service.factoryProductId()).toBe("fp-1");
    });

    it("does not overwrite mxVersion when null is passed", () => {
      service.mxVersion.set({ version: "3.1.65" });

      service.prefill(
        null,
        { buildId: "build-1", projectId: undefined },
        null,
        null
      );

      expect(service.mxVersion()).toEqual({ version: "3.1.65" });
    });

    it("does not overwrite mxBuildId when null is passed", () => {
      service.mxBuildId.set({ buildId: "build-1", projectId: undefined });

      service.prefill({ version: "3.1.65" }, null, null, null);

      expect(service.mxBuildId()).toEqual({
        buildId: "build-1",
        projectId: undefined,
      });
    });
  });

  describe("initializeFromFactoryProductId", () => {
    it("does not set any fields when softwareProduct is missing", () => {
      const factoryProductWithoutSoftwareProduct: FactoryProduct = {
        ...FACTORY_PRODUCT_WITH_BIPS,
        softwareProduct:
          undefined as unknown as FactoryProduct["softwareProduct"],
      };
      mockApiService.getFactoryProductById.mockReturnValue(
        of(factoryProductWithoutSoftwareProduct)
      );

      service.initializeFromFactoryProductId("fp-1", "project-1");

      expect(service.mxVersion()).toBeNull();
      expect(service.mxBuildId()).toBeNull();
      expect(service.bipVersion()).toBeNull();
      expect(service.factoryProductId()).toBeUndefined();
    });

    it("does not set bipVersion when all config components are purged", () => {
      mockApiService.getFactoryProductById.mockReturnValue(
        of(FACTORY_PRODUCT_ALL_PURGED)
      );

      service.initializeFromFactoryProductId("fp-purged", "project-1");

      expect(service.bipVersion()).toBeNull();
    });
  });
});
