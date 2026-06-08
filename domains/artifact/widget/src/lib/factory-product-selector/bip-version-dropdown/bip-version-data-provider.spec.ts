import { of, lastValueFrom } from "rxjs";
import { BipVersionDataProvider } from "./bip-version-data-provider";
import {
  FactoryProduct,
  FactoryProductApiService,
} from "@mxevolve/domains/artifact/data-access";

describe("BipVersionDataProvider", () => {
  let dataProvider: BipVersionDataProvider;
  let mockService: jest.Mocked<FactoryProductApiService>;
  let onFactoryProductsFetched: jest.Mock;

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

  const FACTORY_PRODUCT_WITH_PURGED_BIP: FactoryProduct = {
    ...FACTORY_PRODUCT_WITH_BIPS,
    id: "fp-2",
    configurationComponents: [
      {
        id: "cc-3",
        type: "BIP",
        version: "bip-purged",
        purged: true,
        builds: [],
      },
      {
        id: "cc-4",
        type: "BIP",
        version: "bip-3.0",
        purged: false,
        builds: [
          {
            id: "ccb-3",
            purged: false,
            mxBuild: { version: "bip-3.0", buildId: "bip-build-3" },
            mxBundles: [],
          },
        ],
      },
    ],
  };

  const FACTORY_PRODUCT_WITHOUT_BIPS: FactoryProduct = {
    ...FACTORY_PRODUCT_WITH_BIPS,
    id: "fp-3",
    configurationComponents: [],
  };

  const FACTORY_PRODUCT_DUPLICATE_BIP: FactoryProduct = {
    ...FACTORY_PRODUCT_WITH_BIPS,
    id: "fp-4",
    configurationComponents: [
      {
        id: "cc-5",
        type: "BIP",
        version: "bip-1.0",
        purged: false,
        builds: [
          {
            id: "ccb-5",
            purged: false,
            mxBuild: { version: "bip-1.0", buildId: "bip-build-5" },
            mxBundles: [],
          },
        ],
      },
    ],
  };

  function createParams(
    overrides: Partial<{
      isCustomBuild: boolean;
    }> = {}
  ) {
    return {
      projectId: "project-1",
      softwareProductVersion: "3.1.65",
      softwareProductBuildId: "build-1",
      isCustomBuild: overrides.isCustomBuild ?? false,
      onFactoryProductsFetched,
    };
  }

  beforeEach(() => {
    onFactoryProductsFetched = jest.fn();
    mockService = {
      getFactoryProducts: jest.fn(),
    } as unknown as jest.Mocked<FactoryProductApiService>;

    dataProvider = new BipVersionDataProvider(mockService);
  });

  describe("fetchData", () => {
    it("returns empty page when softwareProductVersion is empty", () => {
      return lastValueFrom(
        dataProvider.fetchData(
          {
            ...createParams(),
            softwareProductVersion: "",
          },
          0,
          10,
          ""
        )
      ).then((result) => {
        expect(result.content).toEqual([]);
        expect(result.last).toBe(true);
      });
    });

    it("returns empty page when softwareProductBuildId is empty", () => {
      return lastValueFrom(
        dataProvider.fetchData(
          {
            ...createParams(),
            softwareProductBuildId: "",
          },
          0,
          10,
          ""
        )
      ).then((result) => {
        expect(result.content).toEqual([]);
        expect(result.last).toBe(true);
      });
    });

    it("does not call the API when softwareProductBuildId is empty", () => {
      return lastValueFrom(
        dataProvider.fetchData(
          {
            ...createParams(),
            softwareProductBuildId: "",
          },
          0,
          10,
          ""
        )
      ).then(() => {
        expect(mockService.getFactoryProducts).not.toHaveBeenCalled();
      });
    });

    it("delegates to FactoryProductApiService with correct filters", () => {
      mockService.getFactoryProducts.mockReturnValue(
        of({
          content: [FACTORY_PRODUCT_WITH_BIPS],
          last: true,
          totalPages: 1,
          totalElements: 1,
          size: 10,
          number: 0,
        })
      );

      return lastValueFrom(
        dataProvider.fetchData(createParams(), 0, 10, "")
      ).then(() => {
        expect(mockService.getFactoryProducts).toHaveBeenCalledWith(
          "project-1",
          expect.objectContaining({
            softwareProductVersionFilter: "3.1.65",
            softwareProductBuildFilter: "build-1",
            fetchGlobal: true,
            pageIndex: 0,
            pageSize: 10,
          })
        );
      });
    });

    it("passes fetchGlobal as true when non-custom build is selected", () => {
      mockService.getFactoryProducts.mockReturnValue(
        of({
          content: [],
          last: true,
          totalPages: 0,
          totalElements: 0,
          size: 10,
          number: 0,
        })
      );

      return lastValueFrom(
        dataProvider.fetchData(
          createParams({ isCustomBuild: false }),
          0,
          10,
          ""
        )
      ).then(() => {
        expect(mockService.getFactoryProducts).toHaveBeenCalledWith(
          "project-1",
          expect.objectContaining({ fetchGlobal: true })
        );
      });
    });

    it("passes fetchGlobal as false when custom build is selected", () => {
      mockService.getFactoryProducts.mockReturnValue(
        of({
          content: [],
          last: true,
          totalPages: 0,
          totalElements: 0,
          size: 10,
          number: 0,
        })
      );

      return lastValueFrom(
        dataProvider.fetchData(createParams({ isCustomBuild: true }), 0, 10, "")
      ).then(() => {
        expect(mockService.getFactoryProducts).toHaveBeenCalledWith(
          "project-1",
          expect.objectContaining({ fetchGlobal: false })
        );
      });
    });

    it("passes configurationComponentVersionSearch when searchKey is provided", () => {
      mockService.getFactoryProducts.mockReturnValue(
        of({
          content: [],
          last: true,
          totalPages: 0,
          totalElements: 0,
          size: 10,
          number: 0,
        })
      );

      return lastValueFrom(
        dataProvider.fetchData(createParams(), 0, 10, "bip-search")
      ).then(() => {
        expect(mockService.getFactoryProducts).toHaveBeenCalledWith(
          "project-1",
          expect.objectContaining({
            configurationComponentVersionSearch: "bip-search",
          })
        );
      });
    });

    it("does not send configurationComponentVersionSearch when searchKey is empty", () => {
      mockService.getFactoryProducts.mockReturnValue(
        of({
          content: [],
          last: true,
          totalPages: 0,
          totalElements: 0,
          size: 10,
          number: 0,
        })
      );

      return lastValueFrom(
        dataProvider.fetchData(createParams(), 0, 10, "")
      ).then(() => {
        expect(mockService.getFactoryProducts).toHaveBeenCalledWith(
          "project-1",
          expect.objectContaining({
            configurationComponentVersionSearch: undefined,
          })
        );
      });
    });

    it("extracts unique non-purged BIP versions from factory products", () => {
      mockService.getFactoryProducts.mockReturnValue(
        of({
          content: [FACTORY_PRODUCT_WITH_BIPS],
          last: true,
          totalPages: 1,
          totalElements: 1,
          size: 10,
          number: 0,
        })
      );

      return lastValueFrom(
        dataProvider.fetchData(createParams(), 0, 10, "")
      ).then((result) => {
        expect(result.content).toEqual([
          { version: "bip-1.0" },
          { version: "bip-2.0" },
        ]);
        expect(result.last).toBe(true);
      });
    });

    it("filters out purged configuration components", () => {
      mockService.getFactoryProducts.mockReturnValue(
        of({
          content: [FACTORY_PRODUCT_WITH_PURGED_BIP],
          last: true,
          totalPages: 1,
          totalElements: 1,
          size: 10,
          number: 0,
        })
      );

      return lastValueFrom(
        dataProvider.fetchData(createParams(), 0, 10, "")
      ).then((result) => {
        expect(result.content).toEqual([{ version: "bip-3.0" }]);
      });
    });

    it("deduplicates BIP versions across factory products", () => {
      mockService.getFactoryProducts.mockReturnValue(
        of({
          content: [FACTORY_PRODUCT_WITH_BIPS, FACTORY_PRODUCT_DUPLICATE_BIP],
          last: true,
          totalPages: 1,
          totalElements: 2,
          size: 10,
          number: 0,
        })
      );

      return lastValueFrom(
        dataProvider.fetchData(createParams(), 0, 10, "")
      ).then((result) => {
        expect(result.content).toEqual([
          { version: "bip-1.0" },
          { version: "bip-2.0" },
        ]);
      });
    });

    it("returns empty content when factory products have no config components", () => {
      mockService.getFactoryProducts.mockReturnValue(
        of({
          content: [FACTORY_PRODUCT_WITHOUT_BIPS],
          last: true,
          totalPages: 1,
          totalElements: 1,
          size: 10,
          number: 0,
        })
      );

      return lastValueFrom(
        dataProvider.fetchData(createParams(), 0, 10, "")
      ).then((result) => {
        expect(result.content).toEqual([]);
      });
    });

    it("calls onFactoryProductsFetched callback with raw FPs and isLastPage", () => {
      mockService.getFactoryProducts.mockReturnValue(
        of({
          content: [FACTORY_PRODUCT_WITH_BIPS],
          last: true,
          totalPages: 1,
          totalElements: 1,
          size: 10,
          number: 0,
        })
      );

      return lastValueFrom(
        dataProvider.fetchData(createParams(), 0, 10, "")
      ).then(() => {
        expect(onFactoryProductsFetched).toHaveBeenCalledWith(
          [FACTORY_PRODUCT_WITH_BIPS],
          true
        );
      });
    });

    it("passes isLastPage as false when not the last page", () => {
      mockService.getFactoryProducts.mockReturnValue(
        of({
          content: [FACTORY_PRODUCT_WITH_BIPS],
          last: false,
          totalPages: 3,
          totalElements: 25,
          size: 10,
          number: 0,
        })
      );

      return lastValueFrom(
        dataProvider.fetchData(createParams(), 0, 10, "")
      ).then(() => {
        expect(onFactoryProductsFetched).toHaveBeenCalledWith(
          [FACTORY_PRODUCT_WITH_BIPS],
          false
        );
      });
    });
  });

  describe("toDropdownOption", () => {
    it("maps BipVersion to dropdown option with version as label", () => {
      const option = dataProvider.toDropdownOption({ version: "bip-1.0" });

      expect(option).toEqual({
        label: "bip-1.0",
        value: { version: "bip-1.0" },
      });
    });
  });

  describe("getItemId", () => {
    it("returns the version string as the unique ID", () => {
      expect(dataProvider.getItemId({ version: "bip-1.0" })).toBe("bip-1.0");
    });
  });
});
