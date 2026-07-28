import { Component } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { render } from "@testing-library/angular";
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
    />
  `,
  imports: [EnvironmentDefinitionSelectorComponent, ReactiveFormsModule],
})
class HostComponent {
  control = new FormControl<string | null>(null);
}

const environmentDefinitionService = {
  getEnvironmentDefinitions: jest.fn().mockReturnValue(of([])),
};

async function renderComponent() {
  return render(HostComponent, {
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
});
