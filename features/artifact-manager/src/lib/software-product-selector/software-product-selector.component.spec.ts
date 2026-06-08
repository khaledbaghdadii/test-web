import { SoftwareProductSelectorComponent } from "./software-product-selector.component";

import { of, throwError } from "rxjs";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { SimpleChange, SimpleChanges } from "@angular/core";
import {
  FactoryProduct,
  FactoryProducts,
  SoftwareProductResponse,
} from "../api-models/factory-product/factory-product";
import { ArtifactManagerService } from "../artifact-manager.service";
import { MxBuildIdDropdownOption } from "./model/mxbuildid-dropdown-option";
import { Bundles } from "../bundles/model/bundles";

const MX_VERSIONS_ERROR_MESSAGE = "Failed to fetch MX versions";
const MX_BUILDS_ERROR_MESSAGE = "Failed to fetch MX builds";
const VALIDATION_DATE = new Date();
const VALIDATION_LEVEL = "CQG";
const SOFTWARE_PRODUCT_PATCH = "PATCH";

describe("FactoryProductSelectorComponent", () => {
  let component: SoftwareProductSelectorComponent;
  let artifactManagerService: jest.Mocked<ArtifactManagerService>;

  beforeEach(async () => {
    artifactManagerService = {
      getFactoryProducts: jest.fn(() => of(factoryProducts)),
    } as unknown as jest.Mocked<ArtifactManagerService>;

    TestBed.configureTestingModule({
      declarations: [SoftwareProductSelectorComponent],
      providers: [
        {
          provide: ArtifactManagerService,
          useValue: artifactManagerService,
        },
      ],
    });

    const fixture = TestBed.createComponent(SoftwareProductSelectorComponent);
    component = fixture.componentInstance;
    component.projectId = projectId;
  });

  describe("on component initialization", () => {
    describe("when the mx version is passed to the component", () => {
      const mxVersion = "some-mx-version";

      beforeEach(() => {
        component.mxVersion = mxVersion;
      });

      it("should update the selected mx version in the dropdown", () => {
        component.ngOnInit();

        expect(component.selectedMxVersion).toEqual(mxVersion);
      });

      it("should set next of mx version to the mx version search subject", () => {
        const action = jest.spyOn(component.mxVersionChangeSubject, "next");
        component.ngOnInit();

        expect(action).toHaveBeenCalledWith(mxVersion);
      });

      it("should not add the selected mx version to the dropdown options", () => {
        component.ngOnInit();

        expect(component.mxVersionDropdown).toEqual([]);
        expect(component.mxVersionDropdownSignal()).toEqual([]);
      });

      it("should trigger a new factory product search on the selected mx version", () => {
        const searchTrigger = jest.spyOn(
          component.mxVersionSearchSubject,
          "next"
        );
        const pageTrigger = jest.spyOn(
          component.mxVersionPageIndexSubject,
          "next"
        );

        component.ngOnInit();

        expect(searchTrigger).toHaveBeenCalledWith("");
        expect(pageTrigger).toHaveBeenCalledWith(0);
      });

      describe("when the build id is passed to the component", () => {
        const buildId = "some-build-id";
        const parentFactoryProductId = "parentId";
        beforeEach(() => {
          component.mxBuildId = buildId;
        });

        it("should update the selected build id in the dropdown", () => {
          component.ngOnInit();

          expect(component.selectedMxBuildId).toEqual({
            buildId: buildId,
            parentId: undefined,
          });
        });

        it("should update the selected build id in the dropdown with parent id", () => {
          component.parentFactoryProductId = parentFactoryProductId;
          component.ngOnInit();

          expect(component.selectedMxBuildId).toEqual({
            buildId: buildId,
            parentId: parentFactoryProductId,
          });
        });
        it("should not add the selected build id to the dropdown options", () => {
          component.ngOnInit();

          expect(component.mxBuildIdDropdown).toEqual([]);
          expect(component.mxbuildIdDropdownSignal()).toEqual([]);
        });

        it("should add the selected build id to the dropdown options with parent id", fakeAsync(() => {
          component.parentFactoryProductId = globalParentFactoryProductId;
          component.ngOnInit();
          artifactManagerService.getFactoryProducts.mockReturnValue(
            of(factoryProducts2)
          );
          component.mxBuildSearchSubject.next("some-search-key");
          component.mxBuildPageIndexSubject.next(10);
          component.mxVersionChangeSubject.next("some change");
          component.mxBuildSearchKey = "";
          tick(100);

          expect(component.mxBuildIdDropdown).toEqual([
            {
              label: `CUSTOM-${mxBuildId}`,
              value: {
                buildId: mxBuildId,
                parentId: globalParentFactoryProductId,
              },
            },
          ]);
          expect(component.mxbuildIdDropdownSignal()).toEqual([
            {
              label: `CUSTOM-${mxBuildId}`,
              value: {
                buildId: mxBuildId,
                parentId: globalParentFactoryProductId,
              },
            },
          ]);
        }));

        it("should not add the selected build id twice to the dropdown if it already exists", () => {
          component.mxBuildIdDropdown = [
            {
              label: buildId,
              value: { buildId: buildId, parentId: undefined },
            },
          ];
          component.ngOnInit();

          expect(component.mxBuildIdDropdown).toEqual([
            {
              label: buildId,
              value: { buildId: buildId, parentId: undefined },
            },
          ]);
        });

        it("should not add the selected build id with parent id twice to the dropdown if it already exists", () => {
          component.mxBuildIdDropdown = [
            {
              label: buildId,
              value: { buildId: buildId, parentId: parentFactoryProductId },
            },
          ];
          component.parentFactoryProductId = parentFactoryProductId;
          component.ngOnInit();

          expect(component.mxBuildIdDropdown).toEqual([
            {
              label: buildId,
              value: { buildId: buildId, parentId: parentFactoryProductId },
            },
          ]);
        });

        it("should add the selected build id when it exists but without parent id", fakeAsync(() => {
          component.mxBuildIdDropdown = [];
          component.parentFactoryProductId = parentFactoryProductId;
          component.ngOnInit();
          artifactManagerService.getFactoryProducts.mockReturnValue(
            of(factoryProducts2)
          );
          component.mxBuildSearchSubject.next("some-search-key");
          component.mxBuildPageIndexSubject.next(10);
          component.mxVersionChangeSubject.next("some change");
          component.mxBuildSearchKey = "";
          tick(100);

          expect(component.mxBuildIdDropdown).toEqual([
            {
              label: `CUSTOM-${mxBuildId}`,
              value: {
                buildId: mxBuildId,
                parentId: globalParentFactoryProductId,
              },
            },
          ]);
          expect(component.mxbuildIdDropdownSignal()).toEqual([
            {
              label: `CUSTOM-${mxBuildId}`,
              value: {
                buildId: mxBuildId,
                parentId: globalParentFactoryProductId,
              },
            },
          ]);
        }));

        it("should add the selected build id when it exists but with parent id", fakeAsync(() => {
          component.mxBuildIdDropdown = [];
          component.parentFactoryProductId = undefined;
          component.ngOnInit();
          artifactManagerService.getFactoryProducts.mockReturnValue(
            of(factoryProducts)
          );
          component.mxBuildSearchSubject.next("some-search-key");
          component.mxBuildPageIndexSubject.next(10);
          component.mxVersionChangeSubject.next("some change");
          component.mxBuildSearchKey = "";
          tick(100);
          expect(component.mxBuildIdDropdown).toEqual([
            {
              label: mxBuildId,
              value: { buildId: mxBuildId, parentId: undefined },
            },
          ]);
          expect(component.mxbuildIdDropdownSignal()).toEqual([
            {
              label: mxBuildId,
              value: { buildId: mxBuildId, parentId: undefined },
            },
          ]);
        }));
        it("should trigger a new factory product search on the selected mx version", () => {
          const searchTrigger = jest.spyOn(
            component.mxBuildSearchSubject,
            "next"
          );
          const pageTrigger = jest.spyOn(
            component.mxBuildPageIndexSubject,
            "next"
          );

          component.ngOnInit();

          expect(searchTrigger).toHaveBeenCalledWith("");
          expect(pageTrigger).toHaveBeenCalledWith(0);
        });
      });

      describe("when the build id is not passed to the component", () => {
        beforeEach(() => {
          component.mxBuildId = undefined;
        });

        it("should not update the selected build id in the dropdown", () => {
          component.ngOnInit();

          expect(component.selectedMxBuildId).toBeUndefined();
        });

        it("should not add anything to the build id dropdown options", () => {
          component.ngOnInit();

          expect(component.mxBuildIdDropdown).toEqual([]);
          expect(component.mxbuildIdDropdownSignal()).toEqual([]);
        });
      });
    });
  });

  describe("on change", () => {
    describe("when the mx version is passed to the component", () => {
      const mxVersion = "some-mx-version";
      const simpleChangesForMxVersion: SimpleChanges =
        {} as unknown as SimpleChanges;
      const simpleChangesForMxBuildIdAndParentId: SimpleChanges =
        {} as unknown as SimpleChanges;
      beforeEach(() => {
        component.mxVersion = mxVersion;
        simpleChangesForMxVersion["mxVersion"] = new SimpleChange(
          undefined,
          mxVersion,
          true
        );
        simpleChangesForMxBuildIdAndParentId["mxBuildId"] = new SimpleChange(
          undefined,
          mxBuildId,
          true
        );
        simpleChangesForMxBuildIdAndParentId["parentFactoryProductId"] =
          new SimpleChange(undefined, globalParentFactoryProductId, true);
      });

      it("should trigger mx version change subject", () => {
        const action = jest.spyOn(component.mxVersionChangeSubject, "next");
        component.ngOnChanges(simpleChangesForMxVersion);

        expect(action).toHaveBeenCalledWith(mxVersion);
      });
      it("should update the selected mx version in the dropdown", () => {
        component.ngOnChanges(simpleChangesForMxVersion);

        expect(component.selectedMxVersion).toEqual(mxVersion);
      });

      it("should add the selected mx version to the dropdown options", () => {
        component.ngOnChanges(simpleChangesForMxVersion);

        expect(component.mxVersionDropdown).toEqual([
          { label: mxVersion, value: mxVersion },
        ]);
        expect(component.mxVersionDropdownSignal()).toEqual([
          { label: mxVersion, value: mxVersion },
        ]);
      });

      it("should not add the selected mx version to the dropdown if it already exists", () => {
        component.mxVersionDropdown = [{ label: mxVersion, value: mxVersion }];
        component.ngOnChanges(simpleChangesForMxVersion);

        expect(component.mxVersionDropdown).toEqual([
          { label: mxVersion, value: mxVersion },
        ]);
      });

      it("should trigger a new factory product search on the selected mx version", () => {
        const searchTrigger = jest.spyOn(
          component.mxVersionSearchSubject,
          "next"
        );
        const pageTrigger = jest.spyOn(
          component.mxVersionPageIndexSubject,
          "next"
        );

        component.ngOnChanges(simpleChangesForMxVersion);

        expect(searchTrigger).toHaveBeenCalledWith("");
        expect(pageTrigger).toHaveBeenCalledWith(0);
      });

      it("should not trigger a new factory product search on the select mx version if it is already selected", () => {
        const searchTrigger = jest.spyOn(
          component.mxVersionSearchSubject,
          "next"
        );
        const pageTrigger = jest.spyOn(
          component.mxVersionPageIndexSubject,
          "next"
        );

        component.selectedMxVersion = mxVersion;
        component.ngOnChanges(simpleChangesForMxVersion);

        expect(searchTrigger).not.toHaveBeenCalledWith(mxVersion);
        expect(pageTrigger).not.toHaveBeenCalledWith(0);
      });

      describe("when the build id is passed to the component", () => {
        beforeEach(() => {
          component.mxBuildId = mxBuildId;
        });

        it("should update the selected build id in the dropdown", () => {
          component.ngOnChanges(simpleChangesForMxBuildIdAndParentId);

          expect(component.selectedMxBuildId).toEqual({
            buildId: mxBuildId,
            parentId: globalParentFactoryProductId,
          });
        });

        it("should add the selected build id to the dropdown options", () => {
          component.ngOnChanges(simpleChangesForMxBuildIdAndParentId);

          expect(component.mxBuildIdDropdown).toEqual([
            {
              label: `CUSTOM-${mxBuildId}`,
              value: {
                buildId: mxBuildId,
                parentId: globalParentFactoryProductId,
              },
            },
          ]);
          expect(component.mxbuildIdDropdownSignal()).toEqual([
            {
              label: `CUSTOM-${mxBuildId}`,
              value: {
                buildId: mxBuildId,
                parentId: globalParentFactoryProductId,
              },
            },
          ]);
        });

        it("should not add the selected build id to the dropdown options if it already exists", () => {
          component.mxBuildIdDropdown = [
            {
              label: `CUSTOM-${mxBuildId}`,
              value: {
                buildId: mxBuildId,
                parentId: globalParentFactoryProductId,
              },
            },
          ];
          component.mxbuildIdDropdownSignal.set([
            {
              label: `CUSTOM-${mxBuildId}`,
              value: {
                buildId: mxBuildId,
                parentId: globalParentFactoryProductId,
              },
            },
          ]);
          component.ngOnChanges(simpleChangesForMxBuildIdAndParentId);

          expect(component.mxBuildIdDropdown).toEqual([
            {
              label: `CUSTOM-${mxBuildId}`,
              value: {
                buildId: mxBuildId,
                parentId: globalParentFactoryProductId,
              },
            },
          ]);
          expect(component.mxbuildIdDropdownSignal()).toEqual([
            {
              label: `CUSTOM-${mxBuildId}`,
              value: {
                buildId: mxBuildId,
                parentId: globalParentFactoryProductId,
              },
            },
          ]);
        });

        it("should trigger a new factory product search on the selected mx build", () => {
          const searchTrigger = jest.spyOn(
            component.mxBuildSearchSubject,
            "next"
          );
          const pageTrigger = jest.spyOn(
            component.mxBuildPageIndexSubject,
            "next"
          );

          component.ngOnChanges(simpleChangesForMxBuildIdAndParentId);

          expect(searchTrigger).toHaveBeenCalledWith("");
          expect(pageTrigger).toHaveBeenCalledWith(0);
        });

        it("should not trigger a new factory product search on the selected mx build if it was already selected", () => {
          const searchTrigger = jest.spyOn(
            component.mxBuildSearchSubject,
            "next"
          );
          const pageTrigger = jest.spyOn(
            component.mxBuildPageIndexSubject,
            "next"
          );

          component.selectedMxBuildId = {
            buildId: mxBuildId,
            parentId: globalParentFactoryProductId,
          };
          component.ngOnChanges(simpleChangesForMxBuildIdAndParentId);

          expect(searchTrigger).not.toHaveBeenCalledWith({
            buildId: mxBuildId,
            parentId: globalParentFactoryProductId,
          });
          expect(pageTrigger).not.toHaveBeenCalledWith(0);
        });
      });

      describe("when the build id is not passed to the component", () => {
        beforeEach(() => {
          simpleChangesForMxBuildIdAndParentId["mxBuildId"] = new SimpleChange(
            undefined,
            undefined,
            true
          );
          simpleChangesForMxBuildIdAndParentId["parentFactoryProductId"] =
            new SimpleChange(undefined, undefined, true);
        });

        it("should not update the selected build id in the dropdown", () => {
          component.ngOnChanges(simpleChangesForMxBuildIdAndParentId);

          expect(component.selectedMxBuildId).toBeUndefined();
        });

        it("should not add anything to the build id dropdown options", () => {
          component.ngOnChanges(simpleChangesForMxBuildIdAndParentId);

          expect(component.mxBuildIdDropdown).toEqual([]);
          expect(component.mxbuildIdDropdownSignal()).toEqual([]);
        });
      });
    });
  });

  describe("on triggering a new search for mx version", () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it("should wait 100ms after the user finishes typing to start processing the request", fakeAsync(() => {
      artifactManagerService.getFactoryProducts.mockReturnValue(of());
      component.isSearchingForMxVersion = false;
      component.mxVersionSearchSubject.next("some-search-key");

      tick(90);
      expect(component.isSearchingForMxVersion).toEqual(false);
      tick(10);

      expect(component.isSearchingForMxVersion).toEqual(true);
    }));

    it("should reset the scrolling helper indices", fakeAsync(() => {
      component.lastMxVersionPage = true;
      component.mxVersionPageIndex = 10;

      artifactManagerService.getFactoryProducts.mockReturnValue(of());
      component.mxVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.lastMxVersionPage).toEqual(false);
      expect(component.mxVersionPageIndex).toEqual(0);
    }));

    it("should reset the mx version dropdown options", fakeAsync(() => {
      component.mxVersionDropdown = [{ label: "batata", value: "something" }];

      artifactManagerService.getFactoryProducts.mockReturnValue(of());
      component.mxVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.mxVersionDropdown).toEqual([]);
      expect(component.mxVersionDropdownSignal()).toEqual([]);
    }));

    it("should fetch the first page of the factory products matching the search criteria", fakeAsync(() => {
      component.mxVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(artifactManagerService.getFactoryProducts).toHaveBeenCalledWith(
        {
          softwareProductVersionSearch: "some-search-key",
          pageSize: 20,
          pageIndex: 0,
        },
        projectId
      );
    }));

    it("should reset the mx version dropdown even when a value is selected", fakeAsync(() => {
      component.selectedMxVersion = mxVersion;
      component.mxVersionDropdown = [
        { label: "batata", value: "something" },
        { label: mxVersion, value: mxVersion },
      ];

      artifactManagerService.getFactoryProducts.mockReturnValue(of());
      component.mxVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.mxVersionDropdown).toEqual([]);
      expect(component.mxVersionDropdownSignal()).toEqual([]);
    }));

    it("should unset the searching filter to false once the fetch is done", fakeAsync(() => {
      component.mxVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.isSearchingForMxVersion).toEqual(false);
    }));

    it("should do nothing when the server responds with a response containing no factory products", fakeAsync(() => {
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of({ content: [] } as unknown as FactoryProducts)
      );

      component.mxVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.factoryProductsForMxVersion).toEqual([]);
    }));

    it("should mark in the component state whether the fetched data represent the last page of factory products", fakeAsync(() => {
      const isLast = randomBoolean();
      const factoryProducts = {
        content: [factoryProduct],
        last: isLast,
      } as unknown as FactoryProducts;
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of(factoryProducts)
      );

      component.lastMxVersionPage = undefined;
      component.mxVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.lastMxVersionPage).toEqual(isLast);
    }));

    it("should add the distinct mx versions collected form the fetched data to the list of mx version dropdown", fakeAsync(() => {
      const factoryProducts = {
        last: true,
        content: [
          {
            id: "id1",
            softwareProduct: {
              version: mxVersion,
              builds: [
                {
                  mxBuild: {
                    version: mxVersion,
                    buildId: mxBuildId,
                    os: "Windows-x86-5.2-64b",
                  },
                },
              ],
            } as unknown as SoftwareProductResponse,
          } as unknown as FactoryProduct,
          {
            id: "id2",
            softwareProduct: {
              version: mxVersion,
              builds: [
                {
                  mxBuild: {
                    version: mxVersion,
                    buildId: mxBuildId,
                    os: "Windows-x86-5.2-64b",
                  },
                },
              ],
            } as unknown as SoftwareProductResponse,
          } as unknown as FactoryProduct,
        ],
      } as unknown as FactoryProducts;
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of(factoryProducts)
      );

      component.mxVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.mxVersionDropdown).toEqual([
        { label: mxVersion, value: mxVersion },
      ]);
      expect(component.mxVersionDropdownSignal()).toEqual([
        { label: mxVersion, value: mxVersion },
      ]);
    }));

    it("should not add the already existing options to the mx version dropdown", fakeAsync(() => {
      component.mxVersionDropdown = [{ label: mxVersion, value: mxVersion }];

      component.mxVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.mxVersionDropdown).toEqual([
        { label: mxVersion, value: mxVersion },
      ]);
      expect(component.mxVersionDropdownSignal()).toEqual([
        { label: mxVersion, value: mxVersion },
      ]);
    }));

    it("should add the fetched factory products to the list of factory products stored in the component", fakeAsync(() => {
      component.factoryProductsForMxVersion = [];

      component.mxVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.factoryProductsForMxVersion).toEqual([factoryProduct]);
    }));

    it("should increment the mx version page index to 1", fakeAsync(() => {
      component.mxVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.mxVersionPageIndex).toEqual(1);
    }));
  });

  describe("on triggering a new scroll for mx version", () => {
    const searchKey = "some-search-key";

    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      component.mxVersionSearchSubject.next(searchKey);
      tick(100);
    }));

    it("should fetch the next page of the factory products matching the search criteria", () => {
      component.mxVersionPageIndexSubject.next(3);

      expect(artifactManagerService.getFactoryProducts).toHaveBeenCalledWith(
        {
          softwareProductVersionSearch: searchKey,
          pageSize: 20,
          pageIndex: 3,
        },
        projectId
      );
    });

    it("should unset the searching filter to false once the fetch is done", () => {
      component.mxVersionPageIndexSubject.next(2);

      expect(component.isSearchingForMxVersion).toEqual(false);
    });

    it("should do nothing when the server responds with a response containing no factory products", () => {
      component.factoryProductsForMxVersion = [];
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of({ content: [] } as unknown as FactoryProducts)
      );

      component.mxVersionPageIndexSubject.next(3);

      expect(component.factoryProductsForMxVersion).toEqual([]);
    });

    it("should mark in the component state whether the fetched data represent the last page of factory products", () => {
      const isLast = randomBoolean();
      const factoryProducts = {
        content: [factoryProduct],
        last: isLast,
      } as unknown as FactoryProducts;
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of(factoryProducts)
      );

      component.lastMxVersionPage = undefined;
      component.mxVersionPageIndexSubject.next(3);

      expect(component.lastMxVersionPage).toEqual(isLast);
    });

    it("should add the distinct mx versions collected form the fetched data to the list of mx version dropdown", () => {
      const factoryProducts = {
        last: true,
        content: [
          {
            id: "id1",
            softwareProduct: {
              version: mxVersion,
              builds: [
                {
                  mxBuild: {
                    version: mxVersion,
                    buildId: mxBuildId,
                    os: "Windows-x86-5.2-64b",
                  },
                },
              ],
            } as unknown as SoftwareProductResponse,
          } as unknown as FactoryProduct,
          {
            id: "id2",
            softwareProduct: {
              version: mxVersion,
              builds: [
                {
                  mxBuild: {
                    version: mxVersion,
                    buildId: mxBuildId,
                    os: "Windows-x86-5.2-64b",
                  },
                },
              ],
            } as unknown as SoftwareProductResponse,
          } as unknown as FactoryProduct,
        ],
      } as unknown as FactoryProducts;
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of(factoryProducts)
      );

      component.mxVersionPageIndexSubject.next(3);

      expect(component.mxVersionDropdown).toEqual([
        { label: mxVersion, value: mxVersion },
      ]);
      expect(component.mxVersionDropdownSignal()).toEqual([
        { label: mxVersion, value: mxVersion },
      ]);
    });

    it("should not add the already existing options to the mx version dropdown", () => {
      component.mxVersionDropdown = [{ label: mxVersion, value: mxVersion }];

      component.mxVersionPageIndexSubject.next(3);
      expect(component.mxVersionDropdown).toEqual([
        { label: mxVersion, value: mxVersion },
      ]);
      expect(component.mxVersionDropdownSignal()).toEqual([
        { label: mxVersion, value: mxVersion },
      ]);
    });

    it("should add the fetched factory products to the list of factory products stored in the component", () => {
      component.factoryProductsForMxVersion = [];

      component.mxVersionPageIndexSubject.next(3);

      expect(component.factoryProductsForMxVersion).toEqual([factoryProduct]);
    });

    it("should increment the mx version page index", () => {
      component.mxVersionPageIndex = 3;
      component.mxVersionPageIndexSubject.next(3);

      expect(component.mxVersionPageIndex).toEqual(4);
    });

    it("should fetch another page if the first page did not result in new versions", () => {
      artifactManagerService.getFactoryProducts = jest
        .fn()
        .mockImplementationOnce(() =>
          of({
            content: [factoryProduct],
            last: false,
            number: 2,
            size: 10,
            totalElements: 32,
            totalPages: 5,
          })
        )
        .mockImplementationOnce(() =>
          of({
            content: [factoryProduct],
            last: true,
            number: 2,
            size: 10,
            totalElements: 32,
            totalPages: 5,
          })
        );
      component.mxVersionPageIndexSubject.next(1);

      expect(artifactManagerService.getFactoryProducts).toHaveBeenCalledWith(
        {
          softwareProductVersionSearch: searchKey,
          pageSize: 20,
          pageIndex: 1,
        },
        projectId
      );
      expect(artifactManagerService.getFactoryProducts).toHaveBeenCalledWith(
        {
          softwareProductVersionSearch: searchKey,
          pageSize: 20,
          pageIndex: 2,
        },
        projectId
      );
    });

    it("should not fetch another page if the first page resulted in new versions", () => {
      artifactManagerService.getFactoryProducts = jest
        .fn()
        .mockImplementationOnce(() =>
          of({
            content: [
              {
                id: "id1",
                softwareProduct: {
                  version: "new version",
                } as unknown as SoftwareProductResponse,
              } as unknown as FactoryProduct,
            ],
            last: false,
            number: 2,
            size: 10,
            totalElements: 32,
            totalPages: 5,
          })
        )
        .mockImplementationOnce(() =>
          of({
            content: [factoryProduct],
            last: true,
            number: 2,
            size: 10,
            totalElements: 32,
            totalPages: 5,
          })
        );
      component.mxVersionPageIndexSubject.next(1);

      expect(artifactManagerService.getFactoryProducts).toHaveBeenCalledWith(
        {
          softwareProductVersionSearch: searchKey,
          pageSize: 20,
          pageIndex: 1,
        },
        projectId
      );
      expect(
        artifactManagerService.getFactoryProducts
      ).not.toHaveBeenCalledWith(
        {
          softwareProductVersionSearch: searchKey,
          pageSize: 20,
          pageIndex: 2,
        },
        projectId
      );
    });
  });

  describe("when the user scrolls in the mx version dropdown", () => {
    beforeEach(() => {
      component.lastMxVersionPage = false;
      component.isSearchingForMxVersion = false;
    });

    it("should do nothing if the user already fetched the last page", () => {
      component.lastMxVersionPage = true;

      const action = jest.spyOn(component.mxVersionPageIndexSubject, "next");

      component.handleMxVersionScroll({ last: 3 });

      expect(action).not.toHaveBeenCalled();
    });

    it("should do nothing if the user is searching while scrolling", () => {
      component.isSearchingForMxVersion = true;

      const action = jest.spyOn(component.mxVersionPageIndexSubject, "next");

      component.handleMxVersionScroll({ last: 3 });

      expect(action).not.toHaveBeenCalled();
    });

    it("should do nothing if the user did not scroll a whole new step beyond the previously fetched index", () => {
      component.mxVersionDropdown = [
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
      ] as unknown as [
        {
          label: string;
          value: string;
        }
      ];

      const action = jest.spyOn(component.mxVersionPageIndexSubject, "next");

      component.handleMxVersionScroll({ last: 3 });

      expect(action).not.toHaveBeenCalled();
    });

    it("should trigger a scroll behavior with the latest page index", () => {
      component.mxVersionPageIndex = 10;

      const pageIndexTrigger = jest.spyOn(
        component.mxVersionPageIndexSubject,
        "next"
      );

      component.handleMxVersionScroll({ last: 3 });

      expect(pageIndexTrigger).toHaveBeenCalledWith(10);
    });

    it("should trigger a scroll behavior if the user not scrolled past the previously fetched index but with less than a whole step", () => {
      component.mxVersionDropdown = [{}, {}, {}, {}, {}, {}, {}] as unknown as [
        { label: string; value: string }
      ];
      component.mxVersionPageIndex = 10;

      const pageIndexTrigger = jest.spyOn(
        component.mxVersionPageIndexSubject,
        "next"
      );

      component.handleMxVersionScroll({ last: 3 });

      expect(pageIndexTrigger).toHaveBeenCalledWith(10);
    });

    it("should trigger a search behavior with the latest search key", () => {
      component.mxVersionSearchKey = "hello";

      const searchTrigger = jest.spyOn(
        component.mxVersionSearchSubject,
        "next"
      );

      component.handleMxVersionScroll({ last: 3 });

      expect(searchTrigger).toHaveBeenCalledWith("hello");
    });
  });

  describe("when the user selects an mx version", () => {
    it("should do nothing if the value equals the mx version passed from the parent where the user was not the action owner", () => {
      component.mxVersion = "some-mx-version";
      const action = jest.spyOn(component.mxVersionChange, "emit");
      component.onSelectMxVersion("some-mx-version");

      expect(action).not.toHaveBeenCalled();
    });

    it("should emit the new mx version value to the parent component", () => {
      const action = jest.spyOn(component.mxVersionChange, "emit");
      component.onSelectMxVersion("some-mx-version");

      expect(action).toHaveBeenCalledWith("some-mx-version");
    });

    it("should emit an undefined value for the mx build id to the parent component", () => {
      const action = jest.spyOn(component.mxBuildIdChange, "emit");
      component.onSelectMxVersion("some-mx-version");

      expect(action).toHaveBeenCalledWith(undefined);
    });

    it("should clear the build id dropdown", (done) => {
      component.selectedMxBuildId = {
        buildId: "some-build-id",
        parentId: "some-parent-id",
      };
      component.mxBuildIdDropdown = [
        {
          label: "label",
          value: { buildId: "some-build-id2", parentId: "some-parent-id2" },
        },
      ];
      component.factoryProductsForMxBuild = [factoryProduct];
      component.mxBuildPageIndex = 10;
      component.lastMxBuildPage = true;
      component.mxBuildSearchKey = "search key";
      component.mxBuildPageIndexSubject.next(10);

      component.mxBuildPageIndexSubject.subscribe((index) => {
        expect(index).toEqual(0);
        done();
      });

      component.selectedMxVersion = "some-mx-version";
      component.onSelectMxVersion("some-mx-version");

      expect(component.selectedMxBuildId).toStrictEqual(undefined);
      expect(component.mxBuildIdDropdown).toStrictEqual([]);
      expect(component.mxbuildIdDropdownSignal()).toStrictEqual([]);
      expect(component.factoryProductsForMxBuild).toStrictEqual([]);
      expect(component.mxBuildPageIndex).toStrictEqual(0);
      expect(component.lastMxBuildPage).toStrictEqual(false);
      expect(component.mxBuildSearchKey).toStrictEqual("");
    });

    it("should emit the mx version new value for the mx build dropdown", () => {
      const action = jest.spyOn(component.mxVersionChangeSubject, "next");

      component.selectedMxVersion = "some-mx-version";
      component.onSelectMxVersion("some-mx-version");

      expect(action).toHaveBeenCalledWith("some-mx-version");
    });
  });

  describe("when the user clears the mx version search text", () => {
    it("should stop the propagation of the html event", () => {
      const stopAction = jest.fn();
      component.clearMxVersionSearchKey({ stopPropagation: stopAction });
      expect(stopAction).toHaveBeenCalled();
    });

    it("should unset the bip search key in the component", () => {
      component.mxVersionSearchKey = "batata";
      component.clearMxVersionSearchKey({ stopPropagation: jest.fn() });
      expect(component.mxVersionSearchKey).toEqual("");
    });

    it("should trigger a new search on bip versions without any filter", () => {
      const trigger = jest.spyOn(component.mxVersionSearchSubject, "next");
      component.clearMxVersionSearchKey({ stopPropagation: jest.fn() });
      expect(trigger).toHaveBeenCalledWith("");
    });

    it("should auto-select and emit MX build ID if dropdown has only one item", fakeAsync(() => {
      const localArtifactManagerService = {
        getFactoryProducts: jest.fn(() => of(factoryProducts)),
      } as unknown as jest.Mocked<ArtifactManagerService>;

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [SoftwareProductSelectorComponent],
        providers: [
          {
            provide: ArtifactManagerService,
            useValue: localArtifactManagerService,
          },
        ],
      });
      const fixture = TestBed.createComponent(SoftwareProductSelectorComponent);
      const component = fixture.componentInstance;

      component.projectId = projectId;
      component.selectedMxVersion = mxVersion;
      component.mxVersionChangeSubject.next(mxVersion);
      const emitSpy = jest.spyOn(component.mxBuildIdChange, "emit");

      (
        component as unknown as {
          loadNewFactoryProductsForMxBuild: (fp: FactoryProducts) => void;
        }
      ).loadNewFactoryProductsForMxBuild(factoryProducts);
      tick();

      expect(component.mxBuildIdDropdown.length).toBe(1);
      expect(component.selectedMxBuildId).toEqual({
        buildId: mxBuildId,
        parentId: undefined,
      });
      expect(emitSpy).toHaveBeenCalledWith({
        buildId: mxBuildId,
        parentId: undefined,
      });
    }));

    it("should not auto-select when mxBuildId input is passed", fakeAsync(() => {
      const localArtifactManagerService = {
        getFactoryProducts: jest.fn(() => of(factoryProducts)),
      } as unknown as jest.Mocked<ArtifactManagerService>;

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [SoftwareProductSelectorComponent],
        providers: [
          {
            provide: ArtifactManagerService,
            useValue: localArtifactManagerService,
          },
        ],
      });
      const fixture = TestBed.createComponent(SoftwareProductSelectorComponent);
      const component = fixture.componentInstance;

      component.mxBuildId = "passedMxBuildId";
      component.projectId = projectId;
      component.selectedMxVersion = mxVersion;
      component.mxVersionChangeSubject.next(mxVersion);
      const emitSpy = jest.spyOn(component.mxBuildIdChange, "emit");

      (
        component as unknown as {
          loadNewFactoryProductsForMxBuild: (fp: FactoryProducts) => void;
        }
      ).loadNewFactoryProductsForMxBuild(factoryProducts);
      tick();

      expect(component.mxBuildIdDropdown.length).toBe(1);
      expect(component.selectedMxBuildId).toBeUndefined();
      expect(emitSpy).not.toHaveBeenCalled();
    }));
  });

  describe("when the user writes in the search bar of the mx version", () => {
    it("should trigger a new bip version search", () => {
      const trigger = jest.spyOn(component.mxVersionSearchSubject, "next");
      component.onMxVersionSearchKeyChange("hello");
      expect(trigger).toHaveBeenCalledWith("hello");
    });
  });

  describe("on triggering a new search for mx build", () => {
    it("should wait 100ms after the user finishes typing to start processing the request", fakeAsync(() => {
      artifactManagerService.getFactoryProducts.mockReturnValue(of());
      initializeComponentWithMxVersionAndMxBuildId(
        "some-mx-version",
        "some-search-key"
      );
      component.isSearchingForMxBuild = false;

      tick(90);
      expect(component.isSearchingForMxBuild).toEqual(false);
      tick(10);

      expect(component.isSearchingForMxBuild).toEqual(true);
    }));

    it("should reset the scrolling helper indices", fakeAsync(() => {
      component.lastMxBuildPage = true;
      component.mxBuildPageIndex = 10;

      artifactManagerService.getFactoryProducts.mockReturnValue(of());
      initializeComponentWithMxVersionAndMxBuildId(
        "some-mx-version",
        "some-search-key"
      );
      tick(100);

      expect(component.lastMxBuildPage).toEqual(false);
      expect(component.mxBuildPageIndex).toEqual(0);
    }));

    it("should reset the mx build dropdown options", fakeAsync(() => {
      component.mxBuildIdDropdown = [
        {
          label: "batata",
          value: { buildId: "some-build-id", parentId: "some-parent-id" },
        },
      ];

      artifactManagerService.getFactoryProducts.mockReturnValue(of());
      initializeComponentWithMxVersionAndMxBuildId(
        "some-mx-version",
        "some-search-key"
      );
      tick(100);

      expect(component.mxBuildIdDropdown).toEqual([]);
      expect(component.mxbuildIdDropdownSignal()).toEqual([]);
    }));

    it("should reset the mx build dropdown even when a value is selected", fakeAsync(() => {
      component.selectedMxBuildId = { buildId: mxBuildId, parentId: undefined };
      component.mxBuildIdDropdown = [
        {
          label: "batata",
          value: { buildId: "som-build-id", parentId: undefined },
        },
        {
          label: mxBuildId,
          value: { buildId: mxBuildId, parentId: undefined },
        },
      ];

      artifactManagerService.getFactoryProducts.mockReturnValue(of());
      initializeComponentWithMxVersionAndMxBuildId(
        "some-mx-version",
        "some-search-key"
      );
      tick(100);

      expect(component.mxBuildIdDropdown).toEqual([]);
      expect(component.mxbuildIdDropdownSignal()).toEqual([]);
    }));

    it("should fetch the first page of the factory products matching the search criteria", fakeAsync(() => {
      initializeComponentWithMxVersionAndMxBuildId(
        "some-mx-version",
        "some-search-key"
      );
      tick(100);

      expect(artifactManagerService.getFactoryProducts).toHaveBeenCalledWith(
        {
          softwareProductVersionFilter: "some-mx-version",
          softwareProductBuildSearch: "some-search-key",
          pageSize: 10,
          pageIndex: 0,
        },
        projectId
      );
    }));

    it("should unset the searching filter to false once the fetch is done", fakeAsync(() => {
      component.mxBuildSearchSubject.next("some-search-key");
      tick(100);

      expect(component.isSearchingForMxBuild).toEqual(false);
    }));

    it("should do nothing when the server responds with a response containing no factory products", fakeAsync(() => {
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of({ content: [] } as unknown as FactoryProducts)
      );

      component.mxBuildSearchSubject.next("some-search-key");
      tick(100);

      expect(component.factoryProductsForMxBuild).toEqual([]);
    }));

    it("should mark in the component state whether the fetched data represent the last page of factory products", fakeAsync(() => {
      const isLast = randomBoolean();
      const factoryProducts = {
        content: [factoryProduct],
        last: isLast,
      } as unknown as FactoryProducts;
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of(factoryProducts)
      );
      initializeComponentWithMxVersionAndMxBuildId(
        "some-mx-version",
        "some-search-key"
      );
      component.lastMxVersionPage = undefined;
      tick(100);

      expect(component.lastMxBuildPage).toEqual(isLast);
    }));

    it("should add the distinct mx builds that contains the search key collected form the fetched data to the list of mx build dropdown", fakeAsync(() => {
      const factoryProducts = {
        last: true,
        content: [
          {
            softwareProduct: {
              builds: [
                {
                  purged: false,
                  mxBuild: {
                    buildId: firstMxBuild,
                  },
                },
              ],
            } as unknown as SoftwareProductResponse,
          } as unknown as FactoryProduct,
          {
            softwareProduct: {
              builds: [
                {
                  purged: false,
                  mxBuild: {
                    buildId: firstMxBuild,
                    os: "Windows-x86-5.2-64b",
                  },
                },
              ],
            } as unknown as SoftwareProductResponse,
          } as unknown as FactoryProduct,
          {
            softwareProduct: {
              builds: [
                {
                  purged: false,
                  mxBuild: {
                    buildId: secondMxBuild,
                    os: "Windows-x86-5.2-64b",
                  },
                },
              ],
            } as unknown as SoftwareProductResponse,
          } as unknown as FactoryProduct,
        ],
      } as unknown as FactoryProducts;
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of(factoryProducts)
      );
      initializeComponentWithMxVersionAndMxBuildId("some-mx-version", "mx");
      tick(100);

      expect(component.mxBuildIdDropdown).toEqual([
        {
          label: firstMxBuild,
          value: { buildId: firstMxBuild, parent: undefined },
        },
        {
          label: secondMxBuild,
          value: { buildId: secondMxBuild, parent: undefined },
        },
      ]);
      expect(component.mxbuildIdDropdownSignal()).toEqual([
        {
          label: firstMxBuild,
          value: { buildId: firstMxBuild, parent: undefined },
        },
        {
          label: secondMxBuild,
          value: { buildId: secondMxBuild, parent: undefined },
        },
      ]);
    }));

    it("should not add all builds in each factory product collected from the fetched data that do contains the search key ", fakeAsync(() => {
      const factoryProducts = {
        last: true,
        content: [
          {
            softwareProduct: {
              builds: [
                {
                  purged: false,
                  mxBuild: {
                    buildId: firstMxBuild,
                  },
                },
                {
                  purged: false,
                  mxBuild: {
                    buildId: secondMxBuild,
                  },
                },
                {
                  purged: false,
                  mxBuild: {
                    buildId: "random",
                  },
                },
              ],
            } as unknown as SoftwareProductResponse,
          } as unknown as FactoryProduct,
        ],
      } as unknown as FactoryProducts;
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of(factoryProducts)
      );
      initializeComponentWithMxVersionAndMxBuildId("some-mx-version", "mx");
      component.mxBuildSearchKey = "mx";
      tick(100);

      expect(component.mxBuildIdDropdown).toEqual([
        {
          label: firstMxBuild,
          value: { buildId: firstMxBuild, parent: undefined },
        },
        {
          label: secondMxBuild,
          value: { buildId: secondMxBuild, parent: undefined },
        },
      ]);
      expect(component.mxbuildIdDropdownSignal()).toEqual([
        {
          label: firstMxBuild,
          value: { buildId: firstMxBuild, parent: undefined },
        },
        {
          label: secondMxBuild,
          value: { buildId: secondMxBuild, parent: undefined },
        },
      ]);
    }));

    it("should not add the already existing options to the mx build dropdown", fakeAsync(() => {
      initializeComponentWithMxVersionAndMxBuildId(
        "some-mx-version",
        "some-search-key"
      );
      component.mxBuildIdDropdown = [
        {
          label: mxBuildId,
          value: { buildId: mxBuildId, parentId: undefined },
        },
      ];

      component.mxBuildSearchSubject.next("some-search-key");
      tick(100);

      expect(component.mxBuildIdDropdown).toEqual([
        {
          label: mxBuildId,
          value: { buildId: mxBuildId, parentId: undefined },
        },
      ]);
      expect(component.mxbuildIdDropdownSignal()).toEqual([
        {
          label: mxBuildId,
          value: { buildId: mxBuildId, parentId: undefined },
        },
      ]);
    }));

    it("should not add the purged builds", fakeAsync(() => {
      const factoryProducts = {
        last: true,
        content: [
          {
            softwareProduct: {
              builds: [
                {
                  purged: true,
                  mxBuild: {
                    buildId: "some-build-id",
                  },
                },
              ],
            } as unknown as SoftwareProductResponse,
          } as unknown as FactoryProduct,
        ],
      } as unknown as FactoryProducts;
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of(factoryProducts)
      );

      component.mxBuildSearchKey = "mx";
      component.mxBuildSearchSubject.next("mx");
      tick(100);

      expect(component.mxBuildIdDropdown).toEqual([]);
      expect(component.mxbuildIdDropdownSignal()).toEqual([]);
    }));

    it("should add the fetched factory products to the list of factory products stored in the component", fakeAsync(() => {
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of(factoryProducts)
      );
      initializeComponentWithMxVersionAndMxBuildId(
        "some-mx-version",
        "some-search-key"
      );

      component.factoryProductsForMxBuild = [];

      tick(100);

      expect(component.factoryProductsForMxBuild).toEqual([factoryProduct]);
    }));

    it("should increment the mx build page index to 1", fakeAsync(() => {
      initializeComponentWithMxVersionAndMxBuildId(
        "some-mx-version",
        "some-search-key"
      );
      tick(100);

      expect(component.mxBuildPageIndex).toEqual(1);
    }));
  });

  describe("on triggering a new scroll for mx build", () => {
    const searchKey = "some-search-key";

    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      component.mxVersionPageIndexSubject.next(0);
      component.selectedMxVersion = mxVersion;
      component.onSelectMxVersion(mxVersion);
      component.mxBuildSearchSubject.next(searchKey);
      tick(100);
    }));

    it("should fetch the next page of the factory products matching the search criteria", () => {
      component.mxBuildPageIndexSubject.next(3);

      expect(artifactManagerService.getFactoryProducts).toHaveBeenCalledWith(
        {
          softwareProductVersionFilter: mxVersion,
          softwareProductBuildSearch: searchKey,
          pageSize: 10,
          pageIndex: 3,
        },
        projectId
      );
    });

    it("should unset the searching filter to false once the fetch is done", () => {
      component.mxBuildPageIndexSubject.next(2);

      expect(component.isSearchingForMxBuild).toEqual(false);
    });

    it("should do nothing when the server responds with a response containing no factory products", () => {
      component.factoryProductsForMxBuild = [];
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of({ content: [] } as unknown as FactoryProducts)
      );

      component.mxBuildPageIndexSubject.next(3);

      expect(component.factoryProductsForMxBuild).toEqual([]);
    });

    it("should mark in the component state whether the fetched data represent the last page of factory products", () => {
      const isLast = randomBoolean();
      const factoryProducts = {
        content: [factoryProduct],
        last: isLast,
      } as unknown as FactoryProducts;
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of(factoryProducts)
      );

      component.lastMxBuildPage = undefined;
      component.mxBuildPageIndexSubject.next(3);

      expect(component.lastMxBuildPage).toEqual(isLast);
    });

    it("should add the distinct mx build collected form the fetched data to the list of mx build dropdown", () => {
      const factoryProducts = {
        last: true,
        content: [
          {
            softwareProduct: {
              builds: [
                {
                  mxBuild: {
                    buildId: firstMxBuild,
                  },
                },
              ],
            } as unknown as SoftwareProductResponse,
          } as unknown as FactoryProduct,
          {
            softwareProduct: {
              builds: [
                {
                  mxBuild: {
                    buildId: firstMxBuild,
                    os: "Windows-x86-5.2-64b",
                  },
                },
              ],
            } as unknown as SoftwareProductResponse,
          } as unknown as FactoryProduct,
          {
            softwareProduct: {
              builds: [
                {
                  mxBuild: {
                    buildId: secondMxBuild,
                    os: "Windows-x86-5.2-64b",
                  },
                },
              ],
            } as unknown as SoftwareProductResponse,
          } as unknown as FactoryProduct,
        ],
      } as unknown as FactoryProducts;
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of(factoryProducts)
      );

      component.mxBuildIdDropdown = [];
      component.mxBuildPageIndexSubject.next(3);

      expect(component.mxBuildIdDropdown).toEqual([
        {
          label: firstMxBuild,
          value: { buildId: firstMxBuild, parent: undefined },
        },
        {
          label: secondMxBuild,
          value: { buildId: secondMxBuild, parent: undefined },
        },
      ]);
      expect(component.mxbuildIdDropdownSignal()).toEqual([
        {
          label: firstMxBuild,
          value: { buildId: firstMxBuild, parent: undefined },
        },
        {
          label: secondMxBuild,
          value: { buildId: secondMxBuild, parent: undefined },
        },
      ]);
    });

    it("should not add the already existing options to the mx version dropdown", () => {
      component.mxBuildIdDropdown = [
        {
          label: mxBuildId,
          value: { buildId: mxBuildId, parentId: undefined },
        },
      ];

      component.mxBuildPageIndexSubject.next(3);
      expect(component.mxBuildIdDropdown).toEqual([
        {
          label: mxBuildId,
          value: { buildId: mxBuildId, parentId: undefined },
        },
      ]);
      expect(component.mxbuildIdDropdownSignal()).toEqual([
        {
          label: mxBuildId,
          value: { buildId: mxBuildId, parentId: undefined },
        },
      ]);
    });

    it("should add the fetched factory products to the list of factory products stored in the component", () => {
      component.factoryProductsForMxBuild = [];

      component.mxBuildPageIndexSubject.next(3);

      expect(component.factoryProductsForMxBuild).toEqual([factoryProduct]);
    });

    it("should increment the mx build page index", () => {
      component.mxBuildPageIndex = 3;
      component.mxBuildPageIndexSubject.next(3);

      expect(component.mxBuildPageIndex).toEqual(4);
    });

    it("should fetch another page if the first page did not result in new builds", () => {
      artifactManagerService.getFactoryProducts = jest
        .fn()
        .mockImplementationOnce(() =>
          of({
            content: [factoryProduct],
            last: false,
            number: 2,
            size: 10,
            totalElements: 32,
            totalPages: 5,
          })
        )
        .mockImplementationOnce(() =>
          of({
            content: [factoryProduct],
            last: true,
            number: 2,
            size: 10,
            totalElements: 32,
            totalPages: 5,
          })
        );
      component.mxBuildPageIndexSubject.next(1);

      expect(artifactManagerService.getFactoryProducts).toHaveBeenCalledWith(
        {
          softwareProductVersionFilter: mxVersion,
          softwareProductBuildSearch: searchKey,
          pageSize: 10,
          pageIndex: 1,
        },
        projectId
      );
      expect(artifactManagerService.getFactoryProducts).toHaveBeenCalledWith(
        {
          softwareProductVersionFilter: mxVersion,
          softwareProductBuildSearch: searchKey,
          pageSize: 10,
          pageIndex: 2,
        },
        projectId
      );
    });

    it("should not fetch another page if the first page resulted in new builds", () => {
      artifactManagerService.getFactoryProducts = jest
        .fn()
        .mockImplementationOnce(() =>
          of({
            content: [
              {
                softwareProduct: {
                  builds: [
                    {
                      mxBuild: {
                        buildId: firstMxBuild,
                      },
                    },
                  ],
                } as unknown as SoftwareProductResponse,
              } as unknown as FactoryProduct,
            ],
            last: false,
            number: 2,
            size: 10,
            totalElements: 32,
            totalPages: 5,
          })
        )
        .mockImplementationOnce(() =>
          of({
            content: [factoryProduct],
            last: true,
            number: 2,
            size: 10,
            totalElements: 32,
            totalPages: 5,
          })
        );
      component.mxBuildPageIndexSubject.next(1);

      expect(artifactManagerService.getFactoryProducts).toHaveBeenCalledWith(
        {
          softwareProductVersionFilter: mxVersion,
          softwareProductBuildSearch: searchKey,
          pageSize: 10,
          pageIndex: 1,
        },
        projectId
      );
      expect(
        artifactManagerService.getFactoryProducts
      ).not.toHaveBeenCalledWith(
        {
          softwareProductVersionFilter: mxVersion,
          softwareProductBuildSearch: searchKey,
          pageSize: 10,
          pageIndex: 2,
        },
        projectId
      );
    });
  });

  describe("when the user scrolls in the mx build dropdown", () => {
    beforeEach(() => {
      component.lastMxBuildPage = false;
      component.isSearchingForMxBuild = false;
    });

    it("should do nothing if the user already fetched the last page", () => {
      component.lastMxBuildPage = true;

      const action = jest.spyOn(component.mxBuildPageIndexSubject, "next");

      component.handleMxBuildScroll({ last: 3 });

      expect(action).not.toHaveBeenCalled();
    });

    it("should do nothing if the user is searching while scrolling", () => {
      component.isSearchingForMxBuild = true;

      const action = jest.spyOn(component.mxBuildPageIndexSubject, "next");

      component.handleMxBuildScroll({ last: 3 });

      expect(action).not.toHaveBeenCalled();
    });

    it("should do nothing if the user did not scroll a whole new step beyond the previously fetched index", () => {
      component.mxBuildIdDropdown = Array(9)
        .fill(1)
        .map(
          () =>
            ({} as unknown as {
              label: string;
              value: { buildId: string; parentId: string | undefined };
            })
        );

      const action = jest.spyOn(component.mxBuildPageIndexSubject, "next");

      component.handleMxBuildScroll({ last: 3 });

      expect(action).not.toHaveBeenCalled();
    });

    it("should trigger a scroll behavior if the user is less than a whole step away from the last fetched index", () => {
      component.mxBuildPageIndex = 10;
      component.mxBuildIdDropdown = Array(7)
        .fill(1)
        .map(
          () =>
            ({} as unknown as {
              label: string;
              value: { buildId: string; parentId: string | undefined };
            })
        );

      const pageIndexTrigger = jest.spyOn(
        component.mxBuildPageIndexSubject,
        "next"
      );

      component.handleMxBuildScroll({ last: 3 });

      expect(pageIndexTrigger).toHaveBeenCalledWith(10);
    });

    it("should trigger a scroll behavior with the latest page index", () => {
      component.mxBuildPageIndex = 10;

      const pageIndexTrigger = jest.spyOn(
        component.mxBuildPageIndexSubject,
        "next"
      );

      component.handleMxBuildScroll({ last: 3 });

      expect(pageIndexTrigger).toHaveBeenCalledWith(10);
    });

    it("should trigger a search behavior with the latest search key", () => {
      component.mxBuildSearchKey = "hello";

      const searchTrigger = jest.spyOn(component.mxBuildSearchSubject, "next");

      component.handleMxBuildScroll({ last: 3 });

      expect(searchTrigger).toHaveBeenCalledWith("hello");
    });
  });

  describe("when the user clears the mx build search text", () => {
    it("should stop the propagation of the html event", () => {
      const stopAction = jest.fn();
      component.clearMxBuildSearchKey({ stopPropagation: stopAction });
      expect(stopAction).toHaveBeenCalled();
    });

    it("should unset the build search key in the component", () => {
      component.mxBuildSearchKey = "batata";
      component.clearMxBuildSearchKey({ stopPropagation: jest.fn() });
      expect(component.mxBuildSearchKey).toEqual("");
    });

    it("should trigger a new search on build without any filter", () => {
      const trigger = jest.spyOn(component.mxBuildSearchSubject, "next");
      component.clearMxBuildSearchKey({ stopPropagation: jest.fn() });
      expect(trigger).toHaveBeenCalledWith("");
    });
  });

  describe("when the user selects an mx build id", () => {
    it("should emit the new value to the parent component", () => {
      component.mxBuildId = undefined;
      const dropdownValue = {
        buildId: mxBuildId,
        parentId: globalParentFactoryProductId,
      };
      const emitter = jest.spyOn(component.mxBuildIdChange, "emit");
      component.onSelectMxBuildId(dropdownValue);

      expect(emitter).toHaveBeenCalledWith(dropdownValue);
      expect(component.parentFactoryProductId).toEqual(
        globalParentFactoryProductId
      );
    });
  });

  describe("error handling", () => {
    it("should have empty mx version dropdown and emit error message when fetch fails", fakeAsync(() => {
      artifactManagerService.getFactoryProducts.mockReturnValueOnce(
        throwError(() => new Error("error"))
      );
      const emitter = jest.spyOn(component.errorOutput, "emit");
      component.ngOnInit();
      component.mxVersionSearchSubject.next("");
      tick(100);

      expect(emitter).toHaveBeenCalledWith(MX_VERSIONS_ERROR_MESSAGE);
      expect(component.mxVersionDropdownSignal()).toEqual([]);
      expect(component.mxVersionDropdown).toEqual([]);
      expect(component.mxBuildIdDropdown).toEqual([]);
      expect(component.mxbuildIdDropdownSignal()).toEqual([]);
      expect(emitter).not.toHaveBeenCalledWith(MX_BUILDS_ERROR_MESSAGE);
    }));

    it("should have empty mx build dropdown and emit error message when fetch fails", fakeAsync(() => {
      component.ngOnInit();
      component.mxVersionPageIndexSubject.next(0);
      component.selectedMxVersion = "some-mx-version";
      component.onSelectMxVersion("some-mx-version");
      artifactManagerService.getFactoryProducts.mockReturnValueOnce(
        throwError(() => new Error("error"))
      );
      const emitter = jest.spyOn(component.errorOutput, "emit");
      component.mxBuildSearchSubject.next("mx");
      tick(100);
      expect(emitter).not.toHaveBeenCalledWith(MX_VERSIONS_ERROR_MESSAGE);
      expect(component.mxbuildIdDropdownSignal()).toEqual([]);
      expect(component.mxBuildIdDropdown).toEqual([]);
      expect(emitter).toHaveBeenCalledWith(MX_BUILDS_ERROR_MESSAGE);
    }));
  });

  describe("set dropdown height correctly", () => {
    it.each([
      [0, "40px"],
      [2, "80px"],
      [5, "200px"],
      [10, "200px"],
    ])(
      "should set dropdown heights correctly",
      fakeAsync((numberOfItems: number, expectedHeight: string) => {
        const mxVersions: { label: string; value: string }[] = Array.from(
          { length: numberOfItems },
          (_, i) => ({
            label: `label${i}`,
            value: `value${i}`,
          })
        );
        const mxBuildIDs: MxBuildIdDropdownOption[] = Array.from(
          { length: numberOfItems },
          (_, i) => ({
            label: `label${i}`,
            value: {
              buildId: `buildId${i}`,
              parentId: undefined,
            },
          })
        );
        component.mxVersionDropdownSignal.set(mxVersions);
        component.mxbuildIdDropdownSignal.set(mxBuildIDs);
        tick();
        expect(component.mxVersionDropdownHeight()).toEqual(expectedHeight);
        expect(component.mxBuildIdDropdownHeight()).toEqual(expectedHeight);
      })
    );
  });

  function initializeComponentWithMxVersionAndMxBuildId(
    mxVersion: string,
    mxBuildId: string
  ) {
    component.ngOnInit();
    component.mxVersionPageIndexSubject.next(0);
    component.selectedMxVersion = mxVersion;
    component.onSelectMxVersion(mxVersion);
    component.mxBuildSearchSubject.next(mxBuildId);
  }
});

function randomBoolean() {
  return Math.random() < 0.5;
}

const projectId = "projectId";

const mxVersion = "v3.1.build.archival.2024.0271.4";

const mxBuildId = "20005081-240508-1140-73994-SoftwareProductBuildBuildId4";
const globalParentFactoryProductId = "parentFactoryProductId";
const firstMxBuild = "firstMxBuild";
const secondMxBuild = "secondMxBuild";
const factoryProductId = "0a91e12c-05b8-42c4-b2d0-8634acf4995c";

const factoryProduct: FactoryProduct = {
  configurationComponents: [
    {
      builds: [
        {
          id: "a1bb9d53-7f68-4981-8a33-ce0d2ec18f09",
          purged: false,
          mxBuild: {
            buildId: "6ae021d32d6-240412-0701-6698899-bipBuildBuildId",
            version: "archival.2024.027",
          },
          mxBundles: [],
        },
      ],
      id: "3d28381b-6c67-4b39-9db7-e1fc57be9b9d",
      type: "NewBIP",
      version: "archival.2024.027",
      purged: false,
    },
  ],
  createdBy: "mxflow-dev-admin",
  createdOn: "2024-07-15T08:46:01.770439Z",
  id: factoryProductId,
  projectId: "projectId",
  lastModifiedBy: "mxflow-dev-admin",
  lastModifiedOn: "2024-07-15T08:46:01.770439Z",
  validationDate: VALIDATION_DATE,
  validationLevel: VALIDATION_LEVEL,
  softwareProduct: {
    builds: [
      {
        id: "82eec4fd-9907-4785-880b-efe635ed2890",
        purged: false,
        mxBuild: {
          buildId: mxBuildId,
          os: "Windows-x86-5.2-64b",
          revision: "7027870",
          version: mxVersion,
        },
        core: {} as unknown as Bundles,
        mxBundles: [],
      },
    ],
    id: "19fb652a-d352-45e6-9c1a-19d5603a6d1c",
    revision: "7027870",
    version: mxVersion,
    patch: SOFTWARE_PRODUCT_PATCH,
  },
  type: "MAINSTREAM",
};

const factoryProduct2: FactoryProduct = {
  configurationComponents: [
    {
      builds: [
        {
          id: "a1bb9d53-7f68-4981-8a33-ce0d2ec18f09",
          purged: false,
          mxBuild: {
            buildId: "6ae021d32d6-240412-0701-6698899-bipBuildBuildId",
            version: "archival.2024.027",
          },
          mxBundles: [],
        },
      ],
      id: "3d28381b-6c67-4b39-9db7-e1fc57be9b9d",
      type: "NewBIP",
      version: "archival.2024.027",
      purged: false,
    },
  ],
  createdBy: "mxflow-dev-admin",
  createdOn: "2024-07-15T08:46:01.770439Z",
  id: "0a91e12c-05b8-42c4-b2d0-8634acf4995c",
  projectId: "projectId",
  parent: {
    id: globalParentFactoryProductId,
    type: "NewBIP",
  },
  lastModifiedBy: "mxflow-dev-admin",
  lastModifiedOn: "2024-07-15T08:46:01.770439Z",
  validationDate: VALIDATION_DATE,
  validationLevel: VALIDATION_LEVEL,
  softwareProduct: {
    builds: [
      {
        id: "82eec4fd-9907-4785-880b-efe635ed2890",
        purged: false,
        mxBuild: {
          buildId: mxBuildId,
          os: "Windows-x86-5.2-64b",
          revision: "7027870",
          version: "v3.1.build.archival.2024.027",
        },
        core: {} as unknown as Bundles,
        mxBundles: [],
      },
    ],
    id: "19fb652a-d352-45e6-9c1a-19d5603a6d1c",
    revision: "7027870",
    version: "v3.1.build.archival.2024.0271",
    patch: SOFTWARE_PRODUCT_PATCH,
  },
  type: "MAINSTREAM",
};

const factoryProducts: FactoryProducts = {
  content: [factoryProduct],
  last: true,
  number: 2,
  size: 10,
  totalElements: 32,
  totalPages: 5,
};

const factoryProducts2: FactoryProducts = {
  content: [factoryProduct2],
  last: true,
  number: 2,
  size: 10,
  totalElements: 32,
  totalPages: 5,
};
