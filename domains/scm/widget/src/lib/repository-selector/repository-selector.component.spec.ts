import { Component } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { render } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { MxevolveSingleSelectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import { RepositoryService } from "@mxevolve/domains/scm/data-access";
import { RepositorySelectorComponent } from "./repository-selector.component";

@Component({
  template: `
    <mxevolve-repository-selector
      [projectId]="'project-1'"
      [formControl]="control"
      (repositoryChanged)="onChanged()"
    />
  `,
  imports: [RepositorySelectorComponent, ReactiveFormsModule],
})
class HostComponent {
  control = new FormControl<string | null>(null);
  onChanged = jest.fn();
}

const repositoryService = {
  getTestRepositories: jest
    .fn()
    .mockReturnValue({ subscribe: () => undefined }),
};

const MOCK_IMPORTS = [MockComponent(MxevolveSingleSelectDropdownComponent)];

async function renderComponent() {
  return render(HostComponent, {
    imports: [MOCK_IMPORTS],
    componentProviders: [
      { provide: RepositoryService, useValue: repositoryService },
    ],
  });
}

describe("RepositorySelectorComponent", () => {
  it("renders the shared single-select dropdown scoped to the project", async () => {
    await renderComponent();

    const dropdown = ngMocks.find(MxevolveSingleSelectDropdownComponent);
    expect(dropdown).toBeTruthy();
    expect(dropdown.componentInstance.dataParams()).toEqual({
      projectId: "project-1",
    });
  });

  it("writes the selected repository id to the bound control", async () => {
    const view = await renderComponent();
    const dropdown = ngMocks.find(MxevolveSingleSelectDropdownComponent);

    dropdown.componentInstance.selectionChange.emit({
      id: "repo-9",
      name: "n",
      url: "u",
      label: "test",
      defaultBranch: "main",
    });

    expect(view.fixture.componentInstance.control.value).toBe("repo-9");
  });

  it("notifies of a repository change only after the initial selection", async () => {
    const view = await renderComponent();
    const dropdown = ngMocks.find(MxevolveSingleSelectDropdownComponent);
    const repository = {
      id: "repo-9",
      name: "n",
      url: "u",
      label: "test",
      defaultBranch: "main",
    };

    dropdown.componentInstance.selectionChange.emit(repository);
    expect(view.fixture.componentInstance.onChanged).not.toHaveBeenCalled();

    dropdown.componentInstance.selectionChange.emit({
      ...repository,
      id: "repo-10",
    });
    expect(view.fixture.componentInstance.onChanged).toHaveBeenCalledTimes(1);
  });
});
