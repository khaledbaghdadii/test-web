import { ConfigurationComponentSelectorComponent } from "./configuration-component-selector.component";
import { of } from "rxjs";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { signal, SimpleChange } from "@angular/core";
import {
  ConfigurationComponentResponse,
  FactoryProduct,
  FactoryProducts,
  SoftwareProductResponse,
} from "../api-models/factory-product/factory-product";
import { ArtifactManagerService } from "../artifact-manager.service";

const componentWithPrivateFields = (
  c: ConfigurationComponentSelectorComponent
) =>
  c as unknown as {
    initialBipVersionLoadComplete: () => boolean;
    loadNewFactoryProducts: (fp: FactoryProducts) => void;
    popUpBipBuildIdDropdown: (bipVersion: string) => void;
  };

describe("ConfigurationComponentSelectorComponent", () => {
  let component: ConfigurationComponentSelectorComponent;
  let artifactManagerService: { getFactoryProducts: jest.Mock };

  beforeEach(() => {
    artifactManagerService = {
      getFactoryProducts: jest.fn(() =>
        of({ content: [] } as unknown as FactoryProducts)
      ),
    };

    TestBed.configureTestingModule({
      declarations: [ConfigurationComponentSelectorComponent],
      providers: [
        {
          provide: ArtifactManagerService,
          useValue: artifactManagerService,
        },
      ],
    });

    const fixture = TestBed.createComponent(
      ConfigurationComponentSelectorComponent
    );
    component = fixture.componentInstance;

    component.mxVersion = mxVersion;
    component.mxBuildId = mxBuildId;
    component.projectId = projectId;
  });

  describe("on init", () => {
    describe("when the bip version is passed to the component", () => {
      const bipVersion = "some-bip-version";

      beforeEach(() => {
        component.bipVersion = bipVersion;
      });

      it("should update the selected bip version in the dropdown", () => {
        component.ngOnInit();

        expect(component.selectedBipVersion).toEqual(bipVersion);
      });

      it("should add the selected bip version to the dropdown options", () => {
        component.ngOnInit();

        expect(component.bipVersionDropdown()).toEqual([
          { label: bipVersion, value: bipVersion },
        ]);
      });

      it("should not add the selected bip version to the dropdown options if it already exists", () => {
        component.bipVersionDropdown = signal([
          { label: bipVersion, value: bipVersion },
        ]);
        component.ngOnInit();

        expect(component.bipVersionDropdown()).toEqual([
          { label: bipVersion, value: bipVersion },
        ]);
      });

      it("should trigger a new factory product search on the selected bip version", () => {
        const searchSubjectTrigger = jest.spyOn(
          component.bipVersionSearchSubject,
          "next"
        );
        const pageIndexSubjectTrigger = jest.spyOn(
          component.bipVersionPageIndexSubject,
          "next"
        );
        component.ngOnInit();

        expect(searchSubjectTrigger).toHaveBeenCalledWith(bipVersion);
        expect(pageIndexSubjectTrigger).toHaveBeenCalledWith(0);
      });

      describe("when the bip build id is passed to the component", () => {
        const bipBuildId = "some-bip-build-id";
        beforeEach(() => {
          component.bipBuildId = bipBuildId;
        });

        it("should update the selected bip build id in the dropdown", () => {
          component.ngOnInit();

          expect(component.selectedBipBuildId).toEqual(bipBuildId);
        });

        it("should add the selected bip build id to the dropdown options", () => {
          component.ngOnInit();

          expect(component.bipBuildIdDropdown).toEqual([
            { label: bipBuildId, value: bipBuildId },
          ]);
        });
      });

      describe("when the bip build id is not passed to the component", () => {
        beforeEach(() => {
          component.bipBuildId = undefined;
        });

        it("should not update the selected bip build id in the dropdown", () => {
          component.ngOnInit();

          expect(component.selectedBipBuildId).toBeUndefined();
        });

        it("should not add the anything to the dropdown options", () => {
          component.ngOnInit();

          expect(component.bipBuildIdDropdown).toEqual([]);
        });
      });
    });

    describe("when the bip version is not passed to the component", () => {
      beforeEach(() => {
        component.bipVersion = undefined;
      });

      it("should not update the selected bip version in the dropdown", () => {
        component.ngOnInit();

        expect(component.selectedBipVersion).toBeUndefined();
      });

      it("should trigger a new factory product search without filtering on bip versions", () => {
        const searchSubjectTrigger = jest.spyOn(
          component.bipVersionSearchSubject,
          "next"
        );
        const pageIndexSubjectTrigger = jest.spyOn(
          component.bipVersionPageIndexSubject,
          "next"
        );
        component.ngOnInit();

        expect(searchSubjectTrigger).toHaveBeenCalledWith("");
        expect(pageIndexSubjectTrigger).toHaveBeenCalledWith(0);
      });
    });
  });

  describe("on changes", () => {
    describe("when the mx build id is changed", () => {
      it("should reset page index and search key", () => {
        const searchSubjectTrigger = jest.spyOn(
          component.bipVersionSearchSubject,
          "next"
        );
        const pageIndexSubjectTrigger = jest.spyOn(
          component.bipVersionPageIndexSubject,
          "next"
        );
        const bipVersion = "some-bip-version";
        const bipBuildId = "some-bip-id";
        component.selectedBipVersion = bipVersion;
        component.bipVersion = bipVersion;
        component.selectedBipBuildId = bipBuildId;
        component.bipBuildId = bipBuildId;
        component.bipVersionPageIndex = 10;
        component.bipVersionDropdown = signal([
          { label: bipVersion, value: bipVersion },
        ]);
        component.bipBuildIdDropdown = [
          { label: bipBuildId, value: bipBuildId },
        ];

        component.ngOnChanges({
          mxBuildId: {
            currentValue: "new-value",
          } as unknown as SimpleChange,
        });

        expect(searchSubjectTrigger).toHaveBeenCalledWith("");
        expect(pageIndexSubjectTrigger).toHaveBeenCalledWith(0);
        expect(component.bipVersion).toBeUndefined();
        expect(component.bipBuildId).toBeUndefined();
        expect(component.selectedBipVersion).toBeUndefined();
        expect(component.bipVersionDropdown()).toEqual([]);
        expect(component.selectedBipBuildId).toBeUndefined();
        expect(component.bipBuildIdDropdown).toEqual([]);
        expect(component.bipVersionPageIndex).toEqual(0);
      });
    });
    describe("when the parent factory product id is changed", () => {
      it("should reset page index and search key", () => {
        const searchSubjectTrigger = jest.spyOn(
          component.bipVersionSearchSubject,
          "next"
        );
        const pageIndexSubjectTrigger = jest.spyOn(
          component.bipVersionPageIndexSubject,
          "next"
        );
        const bipVersion = "some-bip-version";
        const bipBuildId = "some-bip-id";
        component.selectedBipVersion = bipVersion;
        component.bipVersion = bipVersion;
        component.selectedBipBuildId = bipBuildId;
        component.bipBuildId = bipBuildId;
        component.bipVersionPageIndex = 10;
        component.bipVersionDropdown = signal([
          { label: bipVersion, value: bipVersion },
        ]);
        component.bipBuildIdDropdown = [
          { label: bipBuildId, value: bipBuildId },
        ];

        component.ngOnChanges({
          parentFactoryProductId: {
            currentValue: "new-value",
          } as unknown as SimpleChange,
        });
        expect(searchSubjectTrigger).toHaveBeenCalledWith("");
        expect(pageIndexSubjectTrigger).toHaveBeenCalledWith(0);
        expect(component.bipVersion).toBeUndefined();
        expect(component.bipBuildId).toBeUndefined();
        expect(component.selectedBipVersion).toBeUndefined();
        expect(component.bipVersionDropdown()).toEqual([]);
        expect(component.selectedBipBuildId).toBeUndefined();
        expect(component.bipBuildIdDropdown).toEqual([]);
        expect(component.bipVersionPageIndex).toEqual(0);
      });
    });
    describe("when the bip version is changed", () => {
      it("should update the selected bip version in the dropdown", () => {
        component.ngOnChanges({
          bipVersion: {
            currentValue: "new-value",
          } as unknown as SimpleChange,
        });

        expect(component.selectedBipVersion).toEqual("new-value");
      });

      it("should add the selected bip version to the dropdown options", () => {
        component.ngOnChanges({
          bipVersion: {
            currentValue: "new-value",
          } as unknown as SimpleChange,
        });

        expect(component.bipVersionDropdown()).toEqual([
          { label: "new-value", value: "new-value" },
        ]);
      });

      it("should not add the selected bip version to the dropdown options if it already exists", () => {
        component.bipVersionDropdown.set([
          { label: "new-value", value: "new-value" },
        ]);
        component.ngOnChanges({
          bipVersion: {
            currentValue: "new-value",
          } as unknown as SimpleChange,
        });

        expect(component.bipVersionDropdown()).toEqual([
          { label: "new-value", value: "new-value" },
        ]);
      });

      it("should trigger a new factory product search on the selected bip version", () => {
        const searchSubjectTrigger = jest.spyOn(
          component.bipVersionSearchSubject,
          "next"
        );
        const pageIndexSubjectTrigger = jest.spyOn(
          component.bipVersionPageIndexSubject,
          "next"
        );
        component.ngOnChanges({
          bipVersion: {
            currentValue: "new-value",
          } as unknown as SimpleChange,
        });

        expect(searchSubjectTrigger).toHaveBeenCalledWith("new-value");
        expect(pageIndexSubjectTrigger).toHaveBeenCalledWith(0);
      });

      describe("when the bip build id is changed", () => {
        it("should update the selected bip build id in the dropdown", () => {
          component.ngOnChanges({
            bipVersion: {
              currentValue: "new-value",
            } as unknown as SimpleChange,
            bipBuildId: {
              currentValue: "new-value-build-id",
            } as unknown as SimpleChange,
          });

          expect(component.selectedBipBuildId).toEqual("new-value-build-id");
        });

        it("should add the selected bip build id to the dropdown options", () => {
          component.ngOnChanges({
            bipVersion: {
              currentValue: "new-value",
            } as unknown as SimpleChange,
            bipBuildId: {
              currentValue: "new-value-build-id",
            } as unknown as SimpleChange,
          });

          expect(component.bipBuildIdDropdown).toEqual([
            { label: "new-value-build-id", value: "new-value-build-id" },
          ]);
        });
      });
    });
  });

  describe("on triggering a new search", () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick(100);
    }));

    it("should wait 100ms after he user finishes typing to start processing the request", fakeAsync(() => {
      component.isSearchingForBipVersions = false;
      artifactManagerService.getFactoryProducts = jest.fn(() => of());
      component.bipVersionSearchSubject.next("some-search-key");

      tick(90);
      expect(component.isSearchingForBipVersions).toEqual(false);
      tick(10);

      expect(component.isSearchingForBipVersions).toEqual(true);
    }));

    it("should update the state of the component to indicate that a search is in progress", fakeAsync(() => {
      component.isSearchingForBipVersions = false;
      artifactManagerService.getFactoryProducts = jest.fn(() => of());
      component.bipVersionSearchSubject.next("some-search-key");

      tick(100);

      expect(component.isSearchingForBipVersions).toEqual(true);
    }));

    it("should reset the list of factory products in the component", fakeAsync(() => {
      component.factoryProducts = [factoryProduct];
      component.bipVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.factoryProducts).toEqual([]);
    }));

    it("should reset the options of the bip version dropdown", fakeAsync(() => {
      component.bipVersionDropdown.set([
        { label: "something", value: "something-else" },
      ]);
      component.bipVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.bipVersionDropdown()).toEqual([]);
    }));

    it("should unset the scrolling helper indicators", fakeAsync(() => {
      component.bipVersionPageIndex = 20;
      component.lastBipVersionPage = true;

      component.bipVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.bipVersionPageIndex).toEqual(0);
      expect(component.lastBipVersionPage).toEqual(false);
    }));

    it("should fetch the factory products from the server with the search key filter", fakeAsync(() => {
      component.bipVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(artifactManagerService.getFactoryProducts).toHaveBeenCalledWith(
        {
          softwareProductVersionFilter: mxVersion,
          softwareProductBuildFilter: mxBuildId,
          configurationComponentVersionSearch: "some-search-key",
          pageSize: 10,
          pageIndex: 0,
        },
        projectId
      );
    }));

    it("should do nothing when the server responds with an empty response for the factory products", fakeAsync(() => {
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of(undefined as unknown as FactoryProducts)
      );

      component.bipVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.factoryProducts).toEqual([]);
    }));

    it("should do nothing when the server responds with a response containing no factory products", fakeAsync(() => {
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of({ content: [] } as unknown as FactoryProducts)
      );

      component.bipVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.factoryProducts).toEqual([]);
    }));

    it("should mark in the component state whether the fetched data represent the last page of factory products", fakeAsync(() => {
      const isLast = randomBoolean();
      const factoryProducts = {
        content: [factoryProduct],
        last: isLast,
      } as unknown as FactoryProducts;
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of(factoryProducts)
      );

      component.lastBipVersionPage = undefined;
      component.bipVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.lastBipVersionPage).toEqual(isLast);
    }));

    it("should pick the factory product representing the mx version and build id passed to the component when no one exists that has configuration components", fakeAsync(() => {
      const factoryProduct = {
        id: factoryProductId,
        softwareProduct: softwareProduct,
        configurationComponents: [],
      } as unknown as FactoryProduct;
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of({
          content: [factoryProduct],
          last: true,
        } as unknown as FactoryProducts)
      );

      const factoryProductIdEmitter = jest.spyOn(
        component.factoryProductIdChange,
        "emit"
      );

      component.bipVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.factoryProduct).toEqual(factoryProduct);
      expect(factoryProductIdEmitter).toHaveBeenCalledWith(factoryProductId);
    }));

    it("should populate the bip version dropdown with the configuration components of the factory products returned from the server", fakeAsync(() => {
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of(factoryProducts)
      );

      component.bipVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.bipVersionDropdown()).toEqual([
        { label: bipVersion, value: bipVersion },
      ]);
    }));

    it("should not add the bip versions that already existed in the dropdown twice", fakeAsync(() => {
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of(factoryProducts)
      );

      component.bipVersionDropdown.set([
        { label: bipVersion, value: bipVersion },
      ]);
      component.bipVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.bipVersionDropdown()).toEqual([
        { label: bipVersion, value: bipVersion },
      ]);
    }));

    it("should add the returned factory products to exsiting list", fakeAsync(() => {
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of(factoryProducts)
      );

      component.bipVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.factoryProducts).toEqual([factoryProduct]);
    }));

    it("should increment the page index to 1", fakeAsync(() => {
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of(factoryProducts)
      );

      component.bipVersionSearchSubject.next("some-search-key");
      tick(100);

      expect(component.bipVersionPageIndex).toEqual(1);
    }));
  });

  describe("on triggering a scroll behavior", () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick(100);
    }));

    it("should fetch the factory products from the server with the correct page index", fakeAsync(() => {
      component.bipVersionPageIndexSubject.next(2);
      tick(100);

      expect(artifactManagerService.getFactoryProducts).toHaveBeenCalledWith(
        {
          softwareProductVersionFilter: mxVersion,
          softwareProductBuildFilter: mxBuildId,
          configurationComponentVersionSearch: "",
          pageSize: 10,
          pageIndex: 2,
        },
        projectId
      );
    }));

    it("should do nothing when the server responds with an empty response for the factory products", fakeAsync(() => {
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of(undefined as unknown as FactoryProducts)
      );

      component.bipVersionPageIndexSubject.next(2);
      tick(100);

      expect(component.factoryProducts).toEqual([]);
    }));

    it("should do nothing when the server responds with a response containing no factory products", fakeAsync(() => {
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of({ content: [] } as unknown as FactoryProducts)
      );

      component.bipVersionPageIndexSubject.next(2);
      tick(100);

      expect(component.factoryProducts).toEqual([]);
    }));

    it("should mark in the component state whether the fetched data represent the last page of factory products", fakeAsync(() => {
      const isLast = randomBoolean();
      const factoryProducts = {
        content: [factoryProduct],
        last: isLast,
      } as unknown as FactoryProducts;
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of(factoryProducts)
      );

      component.lastBipVersionPage = undefined;
      component.bipVersionPageIndexSubject.next(2);
      tick(100);

      expect(component.lastBipVersionPage).toEqual(isLast);
    }));

    it("should populate the bip version dropdown with the configuration components of the factory products returned from the server", fakeAsync(() => {
      component.bipVersionDropdown = signal([]);
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of(factoryProducts)
      );

      component.bipVersionPageIndexSubject.next(2);
      tick(100);

      expect(component.bipVersionDropdown()).toEqual([
        { label: bipVersion, value: bipVersion },
      ]);
    }));

    it("should not add the bip versions that already existed in the dropdown twice", fakeAsync(() => {
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of({
          content: [factoryProduct],
          last: true,
          number: 2,
          size: 10,
          totalElements: 32,
          totalPages: 5,
        })
      );

      component.bipVersionDropdown = signal([
        { label: bipVersion, value: bipVersion },
      ]);
      component.bipVersionPageIndexSubject.next(2);
      tick(100);

      expect(component.bipVersionDropdown()).toEqual([
        { label: bipVersion, value: bipVersion },
      ]);
    }));

    it("should not add the bip version if purged", fakeAsync(() => {
      component.bipVersionDropdown.set([]);
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of({
          content: [
            {
              ...factoryProduct,
              configurationComponents: [
                { ...configurationComponent, purged: true },
              ],
            },
          ],
          last: true,
          number: 2,
          size: 10,
          totalElements: 32,
          totalPages: 5,
        })
      );

      component.bipVersionPageIndexSubject.next(2);
      tick(100);

      expect(component.bipVersionDropdown()).toEqual([]);
    }));

    it("should not add the bip versions multiple times", fakeAsync(() => {
      component.bipVersionDropdown.set([]);
      artifactManagerService.getFactoryProducts.mockReturnValue(
        of({
          content: [
            factoryProduct,
            factoryProduct,
            factoryProduct,
            factoryProduct,
          ],
          last: true,
          number: 2,
          size: 2,
          totalElements: 2,
          totalPages: 1,
        })
      );

      component.bipVersionPageIndexSubject.next(0);
      tick(100);

      expect(component.bipVersionDropdown()).toEqual([
        { label: bipVersion, value: bipVersion },
      ]);
    }));

    it("should add the returned factory products to existing list", fakeAsync(() => {
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of(factoryProducts)
      );

      component.bipVersionPageIndexSubject.next(2);
      tick(100);

      expect(component.factoryProducts).toEqual([factoryProduct]);
    }));

    it("should increment the page index by one", fakeAsync(() => {
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of(factoryProducts)
      );

      component.bipVersionPageIndex = 1;
      component.bipVersionPageIndexSubject.next(2);
      tick(100);

      expect(component.bipVersionPageIndex).toEqual(2);
    }));

    it("should fetch the next page if no additional unique values were added to the bip version dropdown", fakeAsync(() => {
      component.bipVersionDropdown.set([
        { label: bipVersion, value: bipVersion },
      ]);

      artifactManagerService.getFactoryProducts = jest
        .fn()
        .mockReturnValueOnce(of(factoryProducts))
        .mockReturnValueOnce(
          of({
            content: [factoryProduct],
            last: true,
            number: 2,
            size: 10,
            totalElements: 32,
            totalPages: 5,
          })
        );
      component.bipVersionPageIndex = 5;
      const pageIndexEmitter = jest.spyOn(
        component.bipVersionPageIndexSubject,
        "next"
      );

      component.bipVersionPageIndexSubject.next(5);
      tick(100);

      expect(pageIndexEmitter).toHaveBeenCalledWith(6);
    }));
  });

  describe("when the user scrolls the bip version dropdown", () => {
    beforeEach(() => {
      component.lastBipVersionPage = false;
      component.isSearchingForBipVersions = false;
    });

    it("should do nothing if the user already fetched the last page", () => {
      component.lastBipVersionPage = true;

      const action = jest.spyOn(component.bipVersionPageIndexSubject, "next");

      component.handleBipVersionScroll({ last: 3 });

      expect(action).not.toHaveBeenCalled();
    });

    it("should do nothing if the user is searching while scrolling", () => {
      component.isSearchingForBipVersions = true;

      const action = jest.spyOn(component.bipVersionPageIndexSubject, "next");

      component.handleBipVersionScroll({ last: 3 });

      expect(action).not.toHaveBeenCalled();
    });

    it("should do nothing if the user did not scroll a whole new step beyond the previously fetched index", () => {
      component.bipVersionDropdown.set(
        Array(9)
          .fill(1)
          .map(() => ({} as unknown as { label: string; value: string }))
      );

      const action = jest.spyOn(component.bipVersionPageIndexSubject, "next");

      component.handleBipVersionScroll({ last: 3 });

      expect(action).not.toHaveBeenCalled();
    });

    it("should trigger a scroll behavior if the user is less than a whole step away from the last fetched index", () => {
      component.bipVersionPageIndex = 10;
      component.bipVersionDropdown.set(
        Array(7)
          .fill(1)
          .map(() => ({} as unknown as { label: string; value: string }))
      );

      const pageIndexTrigger = jest.spyOn(
        component.bipVersionPageIndexSubject,
        "next"
      );

      component.handleBipVersionScroll({ last: 3 });

      expect(pageIndexTrigger).toHaveBeenCalledWith(10);
    });

    it("should trigger a scroll behavior with the latest page index", () => {
      component.bipVersionPageIndex = 10;

      const pageIndexTrigger = jest.spyOn(
        component.bipVersionPageIndexSubject,
        "next"
      );

      component.handleBipVersionScroll({ last: 3 });

      expect(pageIndexTrigger).toHaveBeenCalledWith(10);
    });
  });

  describe("when the user selects a bip version", () => {
    it("should do nothing if the value equals the bip version passed from the parent where the user was not the action owner", () => {
      component.bipVersion = "some-bip-version";
      const action = jest.spyOn(component.bipVersionChange, "emit");
      component.onSelectedBipVersion("some-bip-version");

      expect(action).not.toHaveBeenCalled();
    });

    it("should emit the new bip version value to the parent component", () => {
      const action = jest.spyOn(component.bipVersionChange, "emit");
      component.onSelectedBipVersion("some-bip-version");

      expect(action).toHaveBeenCalledWith("some-bip-version");
    });

    it("should emit an undefined value for the bip build id to the parent component", () => {
      const action = jest.spyOn(component.bipBuildIdChange, "emit");
      component.onSelectedBipVersion("some-bip-version");

      expect(action).toHaveBeenCalledWith(undefined);
    });

    it("should emit an undefined value for the factory product id to the parent component", () => {
      const action = jest.spyOn(component.factoryProductIdChange, "emit");
      component.onSelectedBipVersion("some-bip-version");

      expect(action).toHaveBeenCalledWith(undefined);
    });

    it("should reset the selected bip build id in the dropdown", () => {
      component.selectedBipBuildId = "some-build-id";
      component.onSelectedBipVersion("some-bip-version");
      expect(component.selectedBipBuildId).toBeUndefined();
    });

    it("should populate the bip build id dropdown", () => {
      component.factoryProducts = [factoryProduct];
      component.mxVersion = mxVersion;
      component.onSelectedBipVersion(bipVersion);
      expect(component.bipBuildIdDropdown).toEqual([
        { label: bipBuildId, value: bipBuildId },
      ]);
    });

    it("should exclude the purged bip builds from the build id dropdown", () => {
      component.factoryProducts = [
        {
          id: factoryProductId,
          softwareProduct: softwareProduct,
          configurationComponents: [
            {
              version: bipVersion,
              builds: [
                {
                  purged: true,
                  mxBuild: {
                    version: bipVersion,
                    buildId: bipBuildId,
                  },
                },
              ],
            } as unknown as ConfigurationComponentResponse,
          ],
        } as unknown as FactoryProduct,
      ];
      component.mxVersion = mxVersion;
      component.onSelectedBipVersion(bipVersion);
      expect(component.bipBuildIdDropdown).toEqual([]);
    });
  });

  describe("when the user clears the bip version search text", () => {
    it("should stop the propagation of the html event", () => {
      const stopAction = jest.fn();
      component.clearBipVersionSearchKey({ stopPropagation: stopAction });
      expect(stopAction).toHaveBeenCalled();
    });

    it("should unset the bip search key in the component", () => {
      component.bipVersionSearchKey = "batata";
      component.clearBipVersionSearchKey({ stopPropagation: jest.fn() });
      expect(component.bipVersionSearchKey).toEqual("");
    });

    it("should trigger a new search on bip versions without any filter", () => {
      const trigger = jest.spyOn(component.bipVersionSearchSubject, "next");
      component.clearBipVersionSearchKey({ stopPropagation: jest.fn() });
      expect(trigger).toHaveBeenCalledWith("");
    });
  });

  describe("when the user writes in the search bar of the bip version", () => {
    it("should trigger a new bip version search", () => {
      const trigger = jest.spyOn(component.bipVersionSearchSubject, "next");
      component.onBipVersionSearchKeyChange("hello");
      expect(trigger).toHaveBeenCalledWith("hello");
    });
  });

  describe("when the user selects a bip build id", () => {
    it("should do nothing if the selected value matches the one passed from the parent component which indicates it being prefilled and not user-selected", () => {
      component.bipBuildId = "some-bip-build-id";
      const trigger = jest.spyOn(component.bipBuildIdChange, "emit");
      component.onSelectedBipBuildId("some-bip-build-id");
      expect(trigger).not.toHaveBeenCalled();
    });

    it("should emit the selected value to the parent component", () => {
      const trigger = jest.spyOn(component.bipBuildIdChange, "emit");
      component.onSelectedBipBuildId("some-bip-build-id");
      expect(trigger).toHaveBeenCalledWith("some-bip-build-id");
    });

    it("should update the factory product field in the component to the one matching the selected bip build id", () => {
      component.selectedBipVersion = bipVersion;
      component.factoryProducts = [
        factoryProduct,
        {
          id: factoryProductId,
          softwareProduct: softwareProduct,
          configurationComponents: [
            {
              version: bipVersion,
              builds: [
                {
                  mxBuild: {
                    version: bipVersion,
                    buildId: "another-bip-build-id",
                  },
                },
              ],
            } as unknown as ConfigurationComponentResponse,
          ],
        } as unknown as FactoryProduct,
      ];
      component.onSelectedBipBuildId(bipBuildId);
      expect(component.factoryProduct).toEqual(factoryProduct);
    });

    it("should update the factory product field in the component to the one matching the selected mx build id", () => {
      component.selectedBipVersion = bipVersion;
      component.mxBuildId = mxBuildId;
      component.factoryProducts = [
        {
          id: factoryProductId,
          softwareProduct: {
            version: mxVersion,
            builds: [
              {
                mxBuild: {
                  version: mxVersion,
                  buildId: "another-mx-build-id",
                  os: "Windows-x86-5.2-64b",
                },
              },
            ],
          },
          configurationComponents: [configurationComponent],
        } as unknown as FactoryProduct,
        factoryProduct,
      ];
      component.onSelectedBipBuildId(bipBuildId);
      expect(component.factoryProduct).toEqual(factoryProduct);
    });

    it("should update the factory product field in the component to the one matching the selected bip build id and parent id", () => {
      component.selectedBipVersion = bipVersion;
      component.parentFactoryProductId = "parentId";

      component.factoryProducts = [factoryProduct, factoryProductWithParent];
      component.onSelectedBipBuildId(bipBuildId);
      expect(component.factoryProduct).toEqual(factoryProductWithParent);
    });

    it("should update the factory product field in the component to the one matching the selected bip build id and parent id undefined", () => {
      component.selectedBipVersion = bipVersion;
      component.parentFactoryProductId = undefined;

      component.factoryProducts = [factoryProduct, factoryProductWithParent];
      component.onSelectedBipBuildId(bipBuildId);
      expect(component.factoryProduct).toEqual(factoryProduct);
    });
    it("should emit the value of the factory product id matching the selected bip build id", () => {
      const emitter = jest.spyOn(component.factoryProductIdChange, "emit");
      component.selectedBipVersion = bipVersion;
      component.factoryProducts = [factoryProduct];
      component.onSelectedBipBuildId(bipBuildId);
      expect(emitter).toHaveBeenCalledWith(factoryProductId);
    });
  });

  describe("set dropdown height correctly", () => {
    it.each([
      [2, "80px"],
      [5, "200px"],
      [10, "200px"],
    ])(
      "should set dropdown height correctly for %i items",
      fakeAsync((nbOfFiP: number, expectedHeight: string) => {
        component.bipVersionDropdown.set(
          Array(nbOfFiP)
            .fill(0)
            .map((_, i) => ({ label: `v${i}`, value: `v${i}` }))
        );

        const height = component.dropdownHeight();

        expect(height).toBe(expectedHeight);
      })
    );
  });

  describe("auto-select behavior", () => {
    it("should auto-select and emit bipVersion if dropdown has only one item", fakeAsync(() => {
      artifactManagerService.getFactoryProducts = jest.fn(() =>
        of({
          content: [factoryProduct],
          last: true,
          number: 1,
          size: 10,
          totalElements: 1,
          totalPages: 1,
        })
      );
      const emitSpy = jest.spyOn(component.bipVersionChange, "emit");
      component.factoryProducts = [];
      component.bipVersionDropdown.set([]);
      componentWithPrivateFields(component).loadNewFactoryProducts({
        content: [factoryProduct],
        last: true,
        number: 1,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      } as unknown as FactoryProducts);
      tick();
      expect(component.bipVersionDropdown().length).toBe(1);
      expect(component.selectedBipVersion).toBe(configurationComponent.version);
      expect(emitSpy).toHaveBeenCalledWith(configurationComponent.version);
    }));

    it("should auto-select and emit bipBuildId if dropdown has only one item", fakeAsync(() => {
      component.factoryProducts = [factoryProduct];
      component.selectedBipVersion = configurationComponent.version;
      const emitSpy = jest.spyOn(component.bipBuildIdChange, "emit");
      const factoryProductIdSpy = jest.spyOn(
        component.factoryProductIdChange,
        "emit"
      );
      componentWithPrivateFields(component).popUpBipBuildIdDropdown(
        configurationComponent.version
      );
      tick();
      expect(component.bipBuildIdDropdown.length).toBe(1);
      expect(component.selectedBipBuildId).toBe(bipBuildId);
      expect(emitSpy).toHaveBeenCalledWith(bipBuildId);
      expect(factoryProductIdSpy).toHaveBeenCalledWith(factoryProductId);
    }));
  });

  describe("show dropdown behavior", () => {
    let localArtifactManagerService: { getFactoryProducts: jest.Mock };
    let component: ConfigurationComponentSelectorComponent;

    const createComponent = () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        declarations: [ConfigurationComponentSelectorComponent],
        providers: [
          {
            provide: ArtifactManagerService,
            useValue: localArtifactManagerService,
          },
        ],
      });

      const fixture = TestBed.createComponent(
        ConfigurationComponentSelectorComponent
      );
      component = fixture.componentInstance;
      component.projectId = projectId;
      component.mxVersion = mxVersion;
      component.mxBuildId = mxBuildId;
    };

    beforeEach(() => {
      localArtifactManagerService = {
        getFactoryProducts: jest.fn(() => of(factoryProducts)),
      };
      createComponent();
    });

    it("should have  initialBipVersionLoadComplete as false initially", () => {
      expect(
        componentWithPrivateFields(component).initialBipVersionLoadComplete()
      ).toBe(false);
    });

    it("should set initialBipVersionLoadComplete to true and showDropdown to true after first response with results", fakeAsync(() => {
      component.ngOnInit();
      component.bipVersionSearchSubject.next("");
      component.bipVersionPageIndexSubject.next(0);
      tick(150);
      expect(
        componentWithPrivateFields(component).initialBipVersionLoadComplete()
      ).toBe(true);
      expect(component.showDropdown()).toBe(true);
    }));

    it("should set showDropdown to false if no results after first load", fakeAsync(() => {
      localArtifactManagerService.getFactoryProducts = jest.fn(() =>
        of({ content: [], last: true } as unknown as FactoryProducts)
      );
      createComponent();

      component.ngOnInit();
      component.bipVersionSearchSubject.next("");
      component.bipVersionPageIndexSubject.next(0);
      tick(150);
      expect(component.showDropdown()).toBe(false);
    }));
  });
});

function randomBoolean() {
  return Math.random() < 0.5;
}

const projectId = "projectId";

const mxVersion = "v3.1.build.archival.2024.0271.4";

const mxBuildId = "20005081-240508-1140-73994-SoftwareProductBuildBuildId4";
const softwareProduct = {
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
} as unknown as SoftwareProductResponse;

const bipVersion = "archival.2024.027";
const bipBuildId = "6ae021d32d6-240412-0701-6698899-bipBuildBuildId";
const configurationComponent = {
  version: bipVersion,
  builds: [
    {
      purged: false,
      mxBuild: {
        version: bipVersion,
        buildId: bipBuildId,
      },
    },
  ],
} as unknown as ConfigurationComponentResponse;

const factoryProductId = "0a91e12c-05b8-42c4-b2d0-8634acf4995c";

const factoryProduct = {
  id: factoryProductId,
  softwareProduct: softwareProduct,
  configurationComponents: [configurationComponent],
} as unknown as FactoryProduct;

const factoryProductWithParent = {
  id: factoryProductId,
  softwareProduct: softwareProduct,
  configurationComponents: [configurationComponent],
  parent: {
    id: "parentId",
    type: "MAINSTREAM",
  },
} as unknown as FactoryProduct;

const factoryProducts: FactoryProducts = {
  content: [factoryProduct],
  last: false,
  number: 2,
  size: 10,
  totalElements: 32,
  totalPages: 5,
};
