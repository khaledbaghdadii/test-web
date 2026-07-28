import { Component, Type } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  MockBuilder,
  MockedComponentFixture,
  MockRender,
  ngMocks,
} from "ng-mocks";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import {
  MxevolveDropdownBackendStateProvider,
  MxevolveMultiselectDropdownComponent,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  FetchVersionsQuery,
  Page,
  VersionApiModel,
  VersionService,
  VersionType,
} from "@mxevolve/domains/test/data-access";
import { Version } from "@mxevolve/domains/test/model";
import { DomTestUtils } from "@mxevolve/testing";
import { VersionsMultiselectDropdownComponent } from "./versions-multiselect-dropdown.component";
import { VersionsDropdownParams } from "./versions-dropdown-params";
import { VersionsDataProvider } from "./versions-data-provider";
import { filter, firstValueFrom, of } from "rxjs";

const DATA_PARAMS: VersionsDropdownParams = {
  versionTypes: [VersionType.RELEASE_EFFECTIVE],
  active: true,
};

const VERSION_ONE: Version = { id: "v1", name: "Version One" };
const VERSION_TWO: Version = { id: "v2", name: "Version Two" };

const versionsPage: Page<VersionApiModel> = {
  content: [
    {
      id: "v1",
      name: "Version One",
      active: true,
      type: VersionType.RELEASE_EFFECTIVE,
    },
    {
      id: "v2",
      name: "Version Two",
      active: true,
      type: VersionType.RELEASE_EFFECTIVE,
    },
  ],
  totalElements: 2,
  totalPages: 1,
  size: 20,
  number: 0,
  last: true,
};

function mockVersionService(): Partial<VersionService> {
  return {
    fetchVersions: jest.fn(() => of(versionsPage)),
  } as Partial<VersionService>;
}

const firstVersionsPage: Page<VersionApiModel> = {
  content: [
    {
      id: "v1",
      name: "Version One",
      active: true,
      type: VersionType.RELEASE_EFFECTIVE,
    },
  ],
  totalElements: 2,
  totalPages: 2,
  size: 1,
  number: 0,
  last: false,
};

const secondVersionsPage: Page<VersionApiModel> = {
  content: [
    {
      id: "v2",
      name: "Version Two",
      active: true,
      type: VersionType.RELEASE_EFFECTIVE,
    },
  ],
  totalElements: 2,
  totalPages: 2,
  size: 1,
  number: 1,
  last: true,
};

@Component({
  template: `
    <form [formGroup]="form">
      <mxevolve-versions-multiselect-dropdown
        [dataParams]="dataParams"
        [prefilledVersions]="prefilledVersions"
        formControlName="versions"
        (failureEvent)="lastError = $event"
      />
    </form>
  `,
  imports: [VersionsMultiselectDropdownComponent, ReactiveFormsModule],
})
class VersionsFormHostComponent {
  dataParams = DATA_PARAMS;
  prefilledVersions?: Version[];
  form = new FormGroup({
    versions: new FormControl<Version[]>([]),
  });
  lastError: string | null = null;
}

describe("VersionsMultiselectDropdownComponent", () => {
  let fixture: MockedComponentFixture<VersionsFormHostComponent>;
  let component: VersionsMultiselectDropdownComponent;

  beforeEach(async () => {
    await MockBuilder(VersionsFormHostComponent)
      .keep(VersionsMultiselectDropdownComponent)
      .keep(VersionsDataProvider)
      .keep(ReactiveFormsModule)
      .mock(MxevolveMultiselectDropdownComponent)
      .mock(VersionService, mockVersionService());

    fixture = MockRender(VersionsFormHostComponent);
    component = getComponent(VersionsMultiselectDropdownComponent);
    fixture.detectChanges();
  });

  it("should render the multiselect dropdown", async () => {
    expect(getDropdown()).toBeTruthy();
  });

  it("should pass state provider to multiselect dropdown", async () => {
    const dropdown = getDropdown();
    expect(dropdown.componentInstance.stateProvider).toBeDefined();
  });

  it("given the user selects a version, it appears in the form", () => {
    getDropdown().componentInstance.selectionChange.emit([VERSION_ONE]);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.value.versions).toEqual([
      VERSION_ONE,
    ]);
  });

  it("given the user selects multiple versions, all appear in the form", () => {
    getDropdown().componentInstance.selectionChange.emit([
      VERSION_ONE,
      VERSION_TWO,
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.value.versions).toEqual([
      VERSION_ONE,
      VERSION_TWO,
    ]);
  });

  it("given the user clears all selections, the form becomes empty", () => {
    getDropdown().componentInstance.selectionChange.emit([VERSION_ONE]);
    fixture.detectChanges();

    getDropdown().componentInstance.selectionChange.emit([]);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.value.versions).toEqual([]);
  });

  it("given the form is reset, the versions are cleared", () => {
    getDropdown().componentInstance.selectionChange.emit([VERSION_ONE]);
    fixture.detectChanges();

    fixture.componentInstance.form.reset();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.value.versions).toBeNull();
  });

  it("given the form is reset multiple times, the state provider selected items should be cleared", () => {
    getDropdown().componentInstance.selectionChange.emit([VERSION_ONE]);
    fixture.detectChanges();

    const setSelectedItemsSpy = jest.spyOn(
      component.stateProvider,
      "setSelectedItems"
    );

    fixture.componentInstance.form.reset();
    fixture.detectChanges();

    fixture.componentInstance.form.reset();
    fixture.detectChanges();

    expect(setSelectedItemsSpy).toHaveBeenNthCalledWith(2, []);
  });

  it("given versions fail to load, the error is surfaced to the host", () => {
    const errorMessage = "Failed to load versions";
    getDropdown().componentInstance.errorEvent.emit(errorMessage);
    fixture.detectChanges();

    expect(fixture.componentInstance.lastError).toBe(errorMessage);
  });

  it("given a prefilled value, it is shown as selected in the dropdown", async () => {
    await loadVersions(DATA_PARAMS);

    fixture.componentInstance.form.controls.versions.setValue([VERSION_ONE]);
    fixture.detectChanges();

    expect(getSelectedItems()).toEqual([VERSION_ONE]);
  });

  it("given multiple prefilled values, all are shown as selected", async () => {
    await loadVersions(DATA_PARAMS);

    fixture.componentInstance.form.controls.versions.setValue([
      VERSION_ONE,
      VERSION_TWO,
    ]);
    fixture.detectChanges();

    expect(getSelectedItems()).toEqual([VERSION_ONE, VERSION_TWO]);
  });

  it("should pre-select all prefilled values including those not in the fetched paged version", async () => {
    const VERSION_THREE: Version = {
      id: "v3",
      name: "Version 3",
    };
    await loadVersions(DATA_PARAMS);

    fixture.componentInstance.form.controls.versions.setValue([
      VERSION_ONE,
      VERSION_THREE,
    ]);
    fixture.detectChanges();

    expect(getSelectedItems()).toEqual([VERSION_ONE, VERSION_THREE]);
  });

  it("given the prefilled value is cleared, the dropdown selection is emptied", () => {
    fixture.componentInstance.form.controls.versions.setValue([VERSION_ONE]);
    fixture.detectChanges();

    fixture.componentInstance.form.controls.versions.setValue([]);
    fixture.detectChanges();

    expect(getSelectedItems()).toEqual([]);
  });

  it("given a pre-selected version is on a later page, then it is still selected before that page is loaded", async () => {
    configurePagedVersions();
    await loadVersions(DATA_PARAMS);

    fixture.componentInstance.form.controls.versions.setValue([
      VERSION_ONE,
      VERSION_TWO,
    ]);
    fixture.detectChanges();

    expect(getSelectedItems()).toEqual([VERSION_ONE, VERSION_TWO]);
  });

  it("should select the versions provided through the prefilled input", () => {
    const dropdownFixture = TestBed.createComponent(
      VersionsMultiselectDropdownComponent
    );
    dropdownFixture.componentRef.setInput("dataParams", DATA_PARAMS);
    dropdownFixture.componentRef.setInput("prefilledVersions", [VERSION_TWO]);

    dropdownFixture.detectChanges();

    expect(
      dropdownFixture.componentInstance.stateProvider.selectedItems()
    ).toEqual([VERSION_TWO]);
  });

  it("should propagate the prefilled input versions to the form control", () => {
    const dropdownFixture = TestBed.createComponent(
      VersionsMultiselectDropdownComponent
    );
    const onChange = jest.fn();
    dropdownFixture.componentInstance.registerOnChange(onChange);
    dropdownFixture.componentRef.setInput("dataParams", DATA_PARAMS);
    dropdownFixture.componentRef.setInput("prefilledVersions", [
      VERSION_ONE,
      VERSION_TWO,
    ]);

    dropdownFixture.detectChanges();

    expect(onChange).toHaveBeenCalledWith([VERSION_ONE, VERSION_TWO]);
  });

  async function loadVersions(dataParams: VersionsDropdownParams) {
    const stateProvider =
      component.stateProvider as MxevolveDropdownBackendStateProvider<
        Version,
        VersionsDropdownParams
      >;
    const versionsLoaded = firstValueFrom(
      stateProvider.items$.pipe(filter((items) => items.length > 0))
    );
    stateProvider.setDataParams(dataParams);
    await versionsLoaded;
    fixture.detectChanges();
  }

  function configurePagedVersions(): void {
    const versionService = ngMocks.get(VersionService);
    (versionService.fetchVersions as jest.Mock).mockImplementation(
      (query: FetchVersionsQuery) =>
        of(query.page === 0 ? firstVersionsPage : secondVersionsPage)
    );
  }

  function getSelectedItems(): Version[] {
    return component.stateProvider.selectedItems();
  }

  function getDropdown() {
    return ngMocks.find<
      MxevolveMultiselectDropdownComponent<Version, VersionsDropdownParams>
    >(MxevolveMultiselectDropdownComponent);
  }

  function getComponent<S>(type: Type<S>): S {
    return DomTestUtils.getElementByType(fixture, type).getInstance();
  }
});
