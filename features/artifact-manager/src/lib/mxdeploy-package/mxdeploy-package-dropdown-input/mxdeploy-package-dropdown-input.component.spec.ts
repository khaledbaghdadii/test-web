import { MxDeployPackage } from "../model/mxdeploy-package";
import { MxDeployPackageDropdownOption } from "./mxdeploy-package-dropdown-option.model";
import { MxBuildVersion } from "../../version/mxbuild/model/mxbuild-version";
import { MavenBuildVersion } from "../../version/maven-build/model/maven-build-version";
import { Asset } from "../../asset/model/asset";
import { Storage } from "../../storage/model/storage";
import { PathBasedAssetLocation } from "../../location/model/path-based-asset-location";
import { AssetLocationType } from "../../location/model/asset-location-type";
import { MxDeployPackageDropdownStateService } from "./mxdeploy-package-dropdown-state.service";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { VersionType } from "../../version/version-type";
import { MxDeployPackageDropdownInputComponent } from "./mxdeploy-package-dropdown-input.component";
import { signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { InputTextModule } from "primeng/inputtext";
import { By } from "@angular/platform-browser";
import { MxDeployPackageDropdownDefaultSelectionMode } from "../model/mxdeploy-package-dropdown-default-selection-mode";
import { Select, SelectChangeEvent, SelectModule } from "primeng/select";
import { StorageUseCase } from "../../storage/model/storage-use-case";
import { StorageType } from "../../storage/model/storage-type";

const PROJECT_ID = "projectId";
const SEARCH_KEY = "SEARCH_KEY";
const MXDEPLOY_PACKAGE_ID_1 = "MXDEPLOY_PACKAGE_ID_1";
const MXDEPLOY_PACKAGE_ID_2 = "MXDEPLOY_PACKAGE_ID_2";
const MXDEPLOY_PACKAGE_TYPE_1 = "TYPE_1";
const MXDEPLOY_PACKAGE_TYPE_2 = "TYPE_2";
const VERSION_1: MxBuildVersion = {
  version: "version1",
  buildId: "buildId1",
  revision: "revision1",
  os: "os1",
  type: VersionType.MXBUILD,
};
const VERSION_2: MavenBuildVersion = {
  groupId: "groupId",
  artifactId: "artifactId",
  version: "version2",
  classifier: "classifier",
  type: VersionType.MAVEN,
};
const storage: Storage = {
  id: "storageID",
  baseUri: "http:/baseUri",
  name: "name",
  storageType: StorageType.HTTP,
  useCases: [StorageUseCase.CLIENT_CONFIGURATIONS],
  createdOn: new Date(),
};
const assetLocation: PathBasedAssetLocation = {
  storage: storage,
  relativePath: "/relativePath",
  fullPath: "http:/baseUri/relativePath",
  type: AssetLocationType.PATH,
};
const asset: Asset = {
  id: "assetId",
  locations: [assetLocation],
};
const FIRST_MXDEPLOY_PACKAGE: MxDeployPackage = {
  id: MXDEPLOY_PACKAGE_ID_1,
  type: MXDEPLOY_PACKAGE_TYPE_1,
  version: VERSION_1,
  asset: asset,
  createdOn: new Date(),
};
const SECOND_MXDEPLOY_PACKAGE: MxDeployPackage = {
  id: MXDEPLOY_PACKAGE_ID_2,
  type: MXDEPLOY_PACKAGE_TYPE_2,
  version: VERSION_2,
  asset: asset,
  createdOn: new Date(),
};
const FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS: MxDeployPackageDropdownOption[] =
  [
    {
      label: `${MXDEPLOY_PACKAGE_TYPE_1}-${VERSION_1.version}`,
      value: FIRST_MXDEPLOY_PACKAGE,
    },
    {
      label: `${MXDEPLOY_PACKAGE_TYPE_2}-${VERSION_2.version}`,
      value: SECOND_MXDEPLOY_PACKAGE,
    },
  ];

describe("MxDeployPackageDropdownInputComponent", () => {
  let component: MxDeployPackageDropdownInputComponent;
  let fixture: ComponentFixture<MxDeployPackageDropdownInputComponent>;
  let mockStateService: any;

  beforeEach(async () => {
    mockStateService = {
      setProjectId: jest.fn(),
      setPageIndex: jest.fn(),
      setSelectedOption: jest.fn(),
      setSearchKey: jest.fn(),
      setLastFetchedElement: jest.fn(),
      setCustomMxDeployPackageId: jest.fn(),
      setDropdownDefaultSelectionMode: jest.fn(),
      selectedOption: signal(undefined),
      mxDeployPackagesPage: signal(undefined),
      mxDeployPackageDropdownOptions: signal(undefined),
      isLastPage: signal(false),
      isLoadingData: signal(false),
      lastFetchedElement: signal(-1),
      pageIndex: signal(0),
      searchKey: signal(undefined),
      dropdownDefaultSelectionModeSignal: signal(
        MxDeployPackageDropdownDefaultSelectionMode.LATEST
      ),
      customMxDeployPackage: signal(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [
        MxDeployPackageDropdownInputComponent,
        SelectModule,
        FormsModule,
        CommonModule,
        InputTextModule,
      ],
    })
      .overrideComponent(MxDeployPackageDropdownInputComponent, {
        set: {
          providers: [
            {
              provide: MxDeployPackageDropdownStateService,
              useValue: mockStateService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MxDeployPackageDropdownInputComponent);
    component = fixture.componentInstance;
    initializeInputs();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call hide on the dropdown when closeDialog is called", () => {
    component.dropdown = {
      hide: jest.fn(),
    } as unknown as Select;

    fixture.detectChanges();
    component.closeDialog();
    expect(component.dropdown.hide).toHaveBeenCalled();
  });
  describe("function Object() { [native code] }", () => {
    it("should set the projectId on input change", () => {
      expect(mockStateService.setProjectId).toHaveBeenCalledWith(PROJECT_ID);
      fixture.componentRef.setInput("projectId", "projectId2");
      fixture.detectChanges();
      expect(mockStateService.setProjectId).toHaveBeenCalledWith("projectId2");
    });

    it("should emit selected option on selection observable change", fakeAsync(() => {
      const emitSpy = jest.spyOn(
        component.selectedMxDeployPackageChange,
        "emit"
      );
      mockStateService.selectedOption.set(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS[0]
      );
      fixture.detectChanges();
      tick();
      expect(emitSpy).toHaveBeenCalledWith(FIRST_MXDEPLOY_PACKAGE);
    }));

    describe("auto-select", () => {
      it.each([undefined, null])(
        "should clear selection when dropdownDefaultSelectionMode is set to CUSTOM and customMxDeployPackage does not exist",
        fakeAsync((customMxDeployPackage: MxDeployPackage) => {
          mockStateService.dropdownDefaultSelectionModeSignal.set(
            MxDeployPackageDropdownDefaultSelectionMode.CUSTOM
          );
          mockStateService.customMxDeployPackage.set(customMxDeployPackage);
          mockStateService.mxDeployPackageDropdownOptions.set(
            FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
          );
          tick();
          fixture.detectChanges();

          expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
            undefined
          );
        })
      );
      it.each([
        MxDeployPackageDropdownDefaultSelectionMode.CUSTOM,
        MxDeployPackageDropdownDefaultSelectionMode.LATEST,
      ])(
        "should auto-select first option on init",
        fakeAsync(
          (
            dropdownDefaultSelectionMode: MxDeployPackageDropdownDefaultSelectionMode
          ) => {
            mockStateService.mxDeployPackageDropdownOptions.set(
              FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
            );
            mockStateService.dropdownDefaultSelectionModeSignal.set(
              dropdownDefaultSelectionMode
            );
            tick();
            fixture.detectChanges();
            expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
              FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS[0]
            );
          }
        )
      );

      it.each([
        MxDeployPackageDropdownDefaultSelectionMode.CUSTOM,
        MxDeployPackageDropdownDefaultSelectionMode.LATEST,
      ])(
        "should not auto-select first option if page index is greater than 0",
        fakeAsync(
          (
            dropdownDefaultSelectionMode: MxDeployPackageDropdownDefaultSelectionMode
          ) => {
            mockStateService.pageIndex.set(1);
            mockStateService.mxDeployPackageDropdownOptions.set(
              FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
            );
            mockStateService.dropdownDefaultSelectionModeSignal.set(
              dropdownDefaultSelectionMode
            );
            tick();
            expect(mockStateService.setSelectedOption).not.toHaveBeenCalled();
          }
        )
      );
    });
  });

  it("should emit clear event when selected option has blank label", fakeAsync(() => {
    const emitSpy = jest.spyOn(component.clearEvent, "emit");
    mockStateService.selectedOption.set(
      FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS[0]
    );
    fixture.detectChanges();
    tick();
    mockStateService.selectedOption.set({ label: "", value: undefined });
    fixture.detectChanges();
    tick();
    expect(emitSpy).toHaveBeenCalled();
  }));

  describe("reading signals from state service", () => {
    it("should read the mxDeployPackageDropdownOptions signal from the state service", () => {
      mockStateService.mxDeployPackageDropdownOptions.set(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
      );
      expect(component.mxDeployPackageDropdownOptions()).toEqual(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
      );
    });

    it("should bind mxDeployPackageDropdownOptions to the dropdown options in the template", () => {
      mockStateService.mxDeployPackageDropdownOptions.set(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
      );
      fixture.detectChanges();
      const pDropdownElement = fixture.debugElement.query(By.directive(Select));
      const pDropdownInstance = pDropdownElement.componentInstance as Select;
      expect(pDropdownInstance.options).toEqual(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS
      );
    });
    it("should read the isLastPage signal from the state service", () => {
      mockStateService.isLastPage.set(true);
      expect(component.isLastPage).toBeTruthy();
    });

    it("should read selected option from state service", () => {
      mockStateService.selectedOption.set(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS[0]
      );
      expect(component.selectedOption()).toEqual(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS[0]
      );
    });

    it("should bind selectedOption to the dropdown ngModel in the template", () => {
      mockStateService.selectedOption.set(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS[0]
      );
      fixture.detectChanges();
      const pDropdownElement = fixture.debugElement.query(By.directive(Select));
      const pDropdownInstance = pDropdownElement.componentInstance as Select;
      expect(pDropdownInstance.hasSelectedOption()).toBeTruthy();
    });

    it("should read searchKey from the state service", () => {
      mockStateService.searchKey.set(SEARCH_KEY);
      expect(component.mxDeployPackageSearchKey()).toEqual(SEARCH_KEY);
    });

    it("should read last fetched element from state service", () => {
      mockStateService.lastFetchedElement.set(1);
      expect(component.lastFetchedElement()).toEqual(1);
    });

    it("should read page index from state service", () => {
      mockStateService.pageIndex.set(1);
      expect(component.pageIndex()).toEqual(1);
    });

    it("should read is loading data from state service", () => {
      mockStateService.isLoadingData.set(true);
      expect(component.isLoadingData()).toBeTruthy();
    });
  });

  describe("handleScroll", () => {
    beforeEach(() => {
      initializeInputs();
    });

    it("should do nothing if first is undefined", () => {
      component.handleScroll({ first: undefined, last: 0 });
      expect(mockStateService.setPageIndex).not.toHaveBeenCalled();
      expect(mockStateService.setLastFetchedElement).not.toHaveBeenCalled();
    });

    it("should do nothing if last is undefined", () => {
      component.handleScroll({ first: 0, last: undefined });
      expect(mockStateService.setPageIndex).not.toHaveBeenCalled();
      expect(mockStateService.setLastFetchedElement).not.toHaveBeenCalled();
    });

    it("should do nothing if it is the last page", () => {
      mockStateService.isLastPage.set(true);
      component.handleScroll({ first: 5, last: 10 });
      expect(mockStateService.setPageIndex).not.toHaveBeenCalled();
      expect(mockStateService.setLastFetchedElement).not.toHaveBeenCalled();
    });

    it.each([10, 15])(
      "should do nothing if lastFetchedElement is greater than or equal to the current last",
      (lastFetchedElement) => {
        mockStateService.isLastPage.set(false);
        mockStateService.lastFetchedElement.set(lastFetchedElement);
        component.handleScroll({ first: 5, last: 10 });
        expect(mockStateService.setPageIndex).not.toHaveBeenCalled();
        expect(mockStateService.setLastFetchedElement).not.toHaveBeenCalled();
      }
    );

    it("should do nothing if the user is more than one step away from the next page", () => {
      component.handleScroll({ first: 0, last: 5 });
      expect(mockStateService.setPageIndex).not.toHaveBeenCalled();
      expect(mockStateService.setLastFetchedElement).not.toHaveBeenCalled();
    });

    it("should do nothing if the data is loading", () => {
      mockStateService.isLoadingData.set(true);
      component.handleScroll({ first: 5, last: 10 });
      expect(mockStateService.setPageIndex).not.toHaveBeenCalled();
      expect(mockStateService.setLastFetchedElement).not.toHaveBeenCalled();
    });

    it("should set the page index if the user is less than one step away from the last fetched page", () => {
      component.handleScroll({ first: 5, last: 10 });
      expect(mockStateService.setPageIndex).toHaveBeenCalled();
    });

    it("should increment the page index if the next page should be loaded", () => {
      mockStateService.pageIndex.set(0);
      component.handleScroll({ first: 5, last: 10 });
      expect(mockStateService.setPageIndex).toHaveBeenCalledWith(1);
    });

    it("should update the last fetched element signal if the next page should be loaded", () => {
      component.handleScroll({ first: 5, last: 10 });
      expect(mockStateService.setLastFetchedElement).toHaveBeenCalledWith(10);
    });
  });
  describe("handleMxDeployPackageSelected", () => {
    it("should set the selected mxdeploy package with version type mxbuild", () => {
      const event = { value: FIRST_MXDEPLOY_PACKAGE } as SelectChangeEvent;
      component.handleMxDeployPackageSelected(event);
      expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS[0]
      );
    });

    it("should set the selected mxdeploy package with version type maven", () => {
      const event = { value: SECOND_MXDEPLOY_PACKAGE } as SelectChangeEvent;
      component.handleMxDeployPackageSelected(event);
      expect(mockStateService.setSelectedOption).toHaveBeenCalledWith(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS[1]
      );
    });
    it("should call handleMxDeployPackageSelected on change", () => {
      const handlerSpy = jest.spyOn(component, "handleMxDeployPackageSelected");
      const event = { value: FIRST_MXDEPLOY_PACKAGE } as SelectChangeEvent;
      const pDropdownElement = fixture.debugElement.query(By.directive(Select));
      const pDropdownInstance = pDropdownElement.componentInstance as Select;

      pDropdownInstance.onChange.emit(event);
      fixture.detectChanges();

      expect(handlerSpy).toHaveBeenCalled();
    });
  });
  describe("handleSearchKeyInputChange", () => {
    it("should set searchkey", () => {
      component.handleSearchKeyInputChange(SEARCH_KEY);
      expect(mockStateService.setSearchKey).toHaveBeenCalledWith(SEARCH_KEY);
    });

    it("should reset the page index", () => {
      component.handleSearchKeyInputChange(SEARCH_KEY);
      expect(mockStateService.setPageIndex).toHaveBeenCalledWith(0);
    });

    it("should reset the lastFetchedElement", () => {
      component.handleSearchKeyInputChange(SEARCH_KEY);
      expect(mockStateService.setLastFetchedElement).toHaveBeenCalledWith(-1);
    });
  });
  describe("clearSearchKey", () => {
    it("should reset searchKey", () => {
      const stopAction = jest.fn();
      component.clearSearchKey({ stopPropagation: stopAction });
      expect(mockStateService.setSearchKey).toHaveBeenCalledWith(undefined);
    });

    it("should reset the page index", () => {
      mockStateService.setPageIndex.mockClear();
      const stopAction = jest.fn();
      component.clearSearchKey({ stopPropagation: stopAction });
      expect(mockStateService.setPageIndex).toHaveBeenCalledWith(0);
    });

    it("should reset the lastFetchedElement", () => {
      component.handleSearchKeyInputChange("commitId");
      expect(mockStateService.setLastFetchedElement).toHaveBeenCalledWith(-1);
    });
  });

  describe("clear selected option", () => {
    it("should clear selected option on dropdown clear", () => {
      mockStateService.selectedOption.set(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS[0]
      );
      fixture.detectChanges();
      const pDropdownElement = fixture.debugElement.query(By.directive(Select));
      const pDropdownInstance = pDropdownElement.componentInstance as Select;

      pDropdownInstance.onClear.emit();
      fixture.detectChanges();

      expect(mockStateService.setSelectedOption).toHaveBeenCalledWith({
        label: "",
        value: undefined,
      });
    });
  });

  describe("selectedOption validity", () => {
    it("should be true when selected option is defined", () => {
      mockStateService.selectedOption.set(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS[0]
      );
      expect(component.selectedOption()).toEqual(
        FIRST_MXDEPLOY_PACKAGE_DROPDOWN_OPTIONS[0]
      );
      expect(component.selectedOptionValidity()).toBeTruthy();
    });

    it("should be true when selected option is undefined", () => {
      mockStateService.selectedOption.set(undefined);
      expect(component.selectedOption()).toBe(undefined);
      expect(component.selectedOptionValidity()).toBeTruthy();
    });

    it("should be false when label is blank", () => {
      const option: MxDeployPackageDropdownOption = {
        label: "",
        value: FIRST_MXDEPLOY_PACKAGE,
      };
      mockStateService.selectedOption.set(option);
      expect(component.selectedOption()).toBe(option);
      expect(component.selectedOptionValidity()).toBeFalsy();
    });
  });

  function initializeInputs() {
    fixture.componentRef.setInput("projectId", PROJECT_ID);
    mockStateService.setPageIndex.mockClear();
    mockStateService.setLastFetchedElement.mockClear();
  }
});
