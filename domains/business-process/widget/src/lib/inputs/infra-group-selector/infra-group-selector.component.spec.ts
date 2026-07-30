import { render, waitFor } from "@testing-library/angular";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Type } from "@angular/core";
import { MockComponent, ngMocks } from "ng-mocks";
import { Select } from "primeng/select";
import { of, Subject, throwError } from "rxjs";
import {
  InfraGroupService,
  SelectedGroup,
} from "@mxevolve/domains/infra/data-access";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { InfraGroupSelectorComponent } from "./infra-group-selector.component";
import { GroupDropdownSelectionComponent } from "../group-dropdown-selection/group-dropdown-selection.component";

function simulateCvaChange<T>(component: Type<unknown>, value: T): void {
  const instance = ngMocks.findInstance(component) as unknown as {
    __simulateChange?: (value: T) => void;
  };
  if (!instance.__simulateChange) {
    throw new Error("Mocked component is not a ControlValueAccessor");
  }
  instance.__simulateChange(value);
}

const mockGroupService = {
  getGroup: jest.fn(),
  getProjectInfraRegistryConfig: jest.fn(),
};
const mockToast = { showError: jest.fn() };

async function renderComponent(initialValue: string | null) {
  const control = new FormControl<string | null>(initialValue);
  const view = await render(InfraGroupSelectorComponent, {
    inputs: {
      infraGroupFormControl: control,
      projectId: "project-1",
      infraGroupFormControlName: "infraGroupId",
    },
    componentImports: [
      MockComponent(GroupDropdownSelectionComponent),
      Select,
      ReactiveFormsModule,
    ],
    componentProviders: [
      { provide: InfraGroupService, useValue: mockGroupService },
    ],
    providers: [{ provide: ToastMessageService, useValue: mockToast }],
  });
  return { ...view, control };
}

describe("InfraGroupSelectorComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGroupService.getGroup.mockReturnValue(
      of({ id: "g1", name: "Group One", projectId: "project-1" })
    );
    mockGroupService.getProjectInfraRegistryConfig.mockReturnValue(
      of({ id: "default-g", name: "Default Group", projectId: "project-1" })
    );
  });

  it("preselects the prefilled infra group and keeps its id in the control", async () => {
    const { control } = await renderComponent("g1");

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-group-dropdown-selection")
      ).toBeTruthy()
    );
    expect(mockGroupService.getGroup).toHaveBeenCalledWith("project-1", "g1");
    expect(control.value).toBe("g1");
  });

  it("preselects the project default group when nothing is prefilled", async () => {
    const { control } = await renderComponent(null);

    await waitFor(() => expect(control.value).toBe("default-g"));
    expect(mockGroupService.getProjectInfraRegistryConfig).toHaveBeenCalledWith(
      "project-1"
    );
    expect(control.dirty).toBe(false);
  });

  /**
   * The control is invalidated (correct legacy behaviour) but the field itself
   * is prefilled and therefore usually not rendered, so the toast is the only
   * thing the user sees - it has to say what to do about it, and it has to be a
   * string. Handing `showError` the raised object rendered "[object Object]".
   */
  it("clears the control and explains how to fix a prefilled group that will not load", async () => {
    mockGroupService.getGroup.mockReturnValue(
      throwError(() => new Error("boom"))
    );

    const { control } = await renderComponent("g1");

    await waitFor(() =>
      expect(mockToast.showError).toHaveBeenCalledWith(
        "The Infra Group available in the Process Template could not be loaded. Please update the Process Template."
      )
    );
    expect(control.value).toBeUndefined();
  });

  it("surfaces the reason when the project's default infra group cannot be read", async () => {
    mockGroupService.getProjectInfraRegistryConfig.mockReturnValue(
      throwError(() => "registry unreachable")
    );

    const { control } = await renderComponent(null);

    await waitFor(() =>
      expect(mockToast.showError).toHaveBeenCalledWith("registry unreachable")
    );
    expect(control.value).toBeUndefined();
  });

  it("falls back to a readable message when the default-group failure carries no message", async () => {
    mockGroupService.getProjectInfraRegistryConfig.mockReturnValue(
      throwError(() => ({ status: 500 }))
    );

    await renderComponent(null);

    await waitFor(() =>
      expect(mockToast.showError).toHaveBeenCalledWith(
        "Could not fetch groups details"
      )
    );
  });

  it("updates the control with the id of the group chosen in the dropdown", async () => {
    const { control } = await renderComponent("g1");
    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-group-dropdown-selection")
      ).toBeTruthy()
    );

    const chosen: SelectedGroup = {
      id: "g2",
      name: "Group Two",
      projectId: "project-1",
    };
    simulateCvaChange(GroupDropdownSelectionComponent, chosen);

    expect(control.value).toBe("g2");
    expect(control.dirty).toBe(true);
  });

  it("shows a loading dropdown until the prefilled group resolves", async () => {
    const groupSubject = new Subject<{
      id: string;
      name: string;
      projectId: string;
    }>();
    mockGroupService.getGroup.mockReturnValue(groupSubject.asObservable());

    await renderComponent("g1");

    expect(
      document.querySelector("mxevolve-group-dropdown-selection")
    ).toBeNull();
    expect(document.querySelector("p-select")).toBeTruthy();

    groupSubject.next({ id: "g1", name: "Group One", projectId: "project-1" });
    groupSubject.complete();

    await waitFor(() =>
      expect(
        document.querySelector("mxevolve-group-dropdown-selection")
      ).toBeTruthy()
    );
  });
});
