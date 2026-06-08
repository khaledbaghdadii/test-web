import { render } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { MxevolveMultiselectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import {
  VersionService,
  VersionType,
} from "@mxevolve/domains/test/data-access";
import { VersionsMultiselectDropdownComponent } from "./versions-multiselect-dropdown.component";
import { VersionsDropdownParams } from "./versions-dropdown-params";

const mockVersionService = {
  fetchVersions: jest.fn(),
};

const REQUIRED_INPUTS = {
  dataParams: {
    versionTypes: [VersionType.RELEASE_EFFECTIVE],
    active: true,
  } as VersionsDropdownParams,
};

const IMPORTS = [MockComponent(MxevolveMultiselectDropdownComponent)];

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(VersionsMultiselectDropdownComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: IMPORTS,
    componentProviders: [
      { provide: VersionService, useValue: mockVersionService },
    ],
  });
}

describe("VersionsMultiselectDropdownComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the multiselect dropdown", async () => {
    const { fixture } = await renderComponent();

    expect(
      ngMocks.find(fixture, MxevolveMultiselectDropdownComponent)
    ).toBeTruthy();
  });

  it("should pass state provider to multiselect dropdown", async () => {
    const { fixture } = await renderComponent();

    const childComponent = ngMocks.find(
      fixture,
      MxevolveMultiselectDropdownComponent
    );

    expect(childComponent.componentInstance.stateProvider).toBe(
      fixture.componentInstance["stateProvider"]
    );
  });

  it("should pass data params multiselect dropdown", async () => {
    const { fixture } = await renderComponent();

    const childComponent = ngMocks.find(
      fixture,
      MxevolveMultiselectDropdownComponent
    );

    expect(childComponent.componentInstance.dataParams).toEqual(
      REQUIRED_INPUTS.dataParams
    );
  });
});
