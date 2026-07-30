import { Component } from "@angular/core";
import { of } from "rxjs";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { render, waitFor } from "@testing-library/angular";
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
      (failureEvent)="onFailure($event)"
    />
  `,
  imports: [RepositorySelectorComponent, ReactiveFormsModule],
})
class HostComponent {
  control = new FormControl<string | null>(null);
  onChanged = jest.fn();
  onFailure = jest.fn();
}

const repositoryService = {
  getTestRepositories: jest.fn(),
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
  beforeEach(() => {
    jest.clearAllMocks();
    repositoryService.getTestRepositories.mockReturnValue({
      subscribe: () => undefined,
    });
  });

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

  /**
   * The inner dropdown emits `selectionChange` only from its select/clear
   * handlers - never from the programmatic `setSelectedItem` the prefill uses -
   * so every emission is a genuine user change and must fire the cascade, as
   * legacy's `(onChange)="repositoryChanged.emit()"` did. Suppressing the first
   * one swallowed the cascade for the user's very first pick whenever there was
   * no prefilled repository to consume it.
   */
  it("notifies of a repository change on the user's first selection, not just later ones", async () => {
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
    expect(view.fixture.componentInstance.onChanged).toHaveBeenCalledTimes(1);

    dropdown.componentInstance.selectionChange.emit({
      ...repository,
      id: "repo-10",
    });
    expect(view.fixture.componentInstance.onChanged).toHaveBeenCalledTimes(2);
  });

  it("notifies of a repository change when the user clears the selection", async () => {
    const view = await renderComponent();
    const dropdown = ngMocks.find(MxevolveSingleSelectDropdownComponent);

    dropdown.componentInstance.selectionChange.emit(null);

    expect(view.fixture.componentInstance.onChanged).toHaveBeenCalledTimes(1);
    expect(view.fixture.componentInstance.control.value).toBeNull();
  });

  it("clears the control and reports a prefilled repository id that is not in the list", async () => {
    repositoryService.getTestRepositories.mockReturnValue(
      of([
        {
          id: "repo-1",
          name: "n",
          url: "u",
          label: "test",
          defaultBranch: "main",
        },
      ])
    );

    const control = new FormControl<string | null>("repo-gone");
    const view = await render(HostComponent, {
      imports: [MOCK_IMPORTS],
      componentProperties: { control },
      componentProviders: [
        { provide: RepositoryService, useValue: repositoryService },
      ],
    });
    // Legacy left an unresolvable prefill exactly where it was: the dropdown
    // rendered blank while the dead id kept passing `Validators.required`, so
    // the run button stayed enabled and the dead id was POSTed. The control is
    // now cleared to match what the dropdown shows, and the failure is reported
    // through the output the executors already bind to a toast.
    await waitFor(() =>
      expect(
        ngMocks.find(RepositorySelectorComponent).componentInstance.stateProvider.items()
      ).toHaveLength(1)
    );
    await waitFor(() =>
      expect(view.fixture.componentInstance.control.value).toBeNull()
    );
    expect(view.fixture.componentInstance.onFailure).toHaveBeenCalledWith(
      "The repository available in the Process Template no longer exists. Please update the Process Template."
    );
  });

  it("keeps a prefilled repository id that does resolve, and reports nothing", async () => {
    repositoryService.getTestRepositories.mockReturnValue(
      of([
        {
          id: "repo-1",
          name: "n",
          url: "u",
          label: "test",
          defaultBranch: "main",
        },
      ])
    );

    const control = new FormControl<string | null>("repo-1");
    const view = await render(HostComponent, {
      imports: [MOCK_IMPORTS],
      componentProperties: { control },
      componentProviders: [
        { provide: RepositoryService, useValue: repositoryService },
      ],
    });
    await waitFor(() =>
      expect(
        ngMocks.find(RepositorySelectorComponent).componentInstance.stateProvider.items()
      ).toHaveLength(1)
    );
    expect(view.fixture.componentInstance.control.value).toBe("repo-1");
    expect(view.fixture.componentInstance.onFailure).not.toHaveBeenCalled();
    // The prefill is a programmatic write, so it must not fire the cascade.
    expect(view.fixture.componentInstance.onChanged).not.toHaveBeenCalled();
  });
});
