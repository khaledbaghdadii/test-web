import { Component } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { render, waitFor } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { of } from "rxjs";
import { MxevolveSingleSelectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import {
  EnvironmentDefinition,
  EnvironmentDefinitionService,
} from "@mxevolve/domains/environment/data-access";
import { EnvironmentDefinitionSelectorComponent } from "./environment-definition-selector.component";

@Component({
  template: `
    <mxevolve-environment-definition-selector
      [projectId]="'project-1'"
      [formControl]="control"
      [invalidateHiddenEnvironmentDefinition]="invalidate"
    />
  `,
  imports: [EnvironmentDefinitionSelectorComponent, ReactiveFormsModule],
})
class HostComponent {
  control = new FormControl<string | null>(null);
  invalidate = false;
}

const environmentDefinitionService = {
  getEnvironmentDefinitions: jest.fn().mockReturnValue(of([])),
};

async function renderComponent(
  componentProperties: Partial<HostComponent> = {}
) {
  return render(HostComponent, {
    componentProperties,
    imports: [MockComponent(MxevolveSingleSelectDropdownComponent)],
    componentProviders: [
      {
        provide: EnvironmentDefinitionService,
        useValue: environmentDefinitionService,
      },
    ],
  });
}

const DEFINITION = {
  id: "env-9",
  name: "Env Nine",
} as EnvironmentDefinition;

describe("EnvironmentDefinitionSelectorComponent", () => {
  it("renders the shared dropdown scoped to the project", async () => {
    await renderComponent();

    expect(
      ngMocks
        .find(MxevolveSingleSelectDropdownComponent)
        .componentInstance.dataParams()
    ).toEqual({ projectId: "project-1" });
  });

  it("writes the selected environment definition id to the control", async () => {
    const view = await renderComponent();

    ngMocks
      .find(MxevolveSingleSelectDropdownComponent)
      .componentInstance.selectionChange.emit(DEFINITION);

    expect(view.fixture.componentInstance.control.value).toBe("env-9");
  });

  describe("a prefilled id that is no longer in the list", () => {
    beforeEach(() => {
      environmentDefinitionService.getEnvironmentDefinitions.mockReturnValue(
        of([DEFINITION])
      );
    });

    afterEach(() => {
      environmentDefinitionService.getEnvironmentDefinitions.mockReturnValue(
        of([])
      );
    });

    it("keeps the id by default, so the run stays submittable", async () => {
      const view = await renderComponent({
        control: new FormControl<string | null>("env-gone"),
      });

      await waitFor(() =>
        expect(
          ngMocks.find(EnvironmentDefinitionSelectorComponent)
            .componentInstance.stateProvider.items()
        ).toHaveLength(1)
      );
      expect(view.fixture.componentInstance.control.value).toBe("env-gone");
    });

    it("clears the id when the consumer asks for it", async () => {
      const view = await renderComponent({
        control: new FormControl<string | null>("env-gone"),
        invalidate: true,
      });

      await waitFor(() =>
        expect(view.fixture.componentInstance.control.value).toBeNull()
      );
    });
  });
});
