import { Component } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { of } from "rxjs";
import { MxevolveSingleSelectDropdownComponent } from "@mxflow/ui/mxevolve-dropdown";
import {
  ValidationProcessExecutionMapperService,
  ValidationProcessListingService,
} from "@mxevolve/domains/business-process/data-access";
import { ScopeStartCommitInputComponent } from "./scope-start-commit-input.component";

@Component({
  template: `
    <form [formGroup]="form">
      <mxevolve-scope-start-commit-input
        [projectId]="'project-1'"
        [parentBranch]="'main'"
        formControlName="commit"
      />
    </form>
  `,
  imports: [ScopeStartCommitInputComponent, ReactiveFormsModule],
})
class HostComponent {
  form = new FormGroup({
    commit: new FormControl<string | null>(null),
  });
}

const listingService = {
  getValidationProcessExecutions: jest
    .fn()
    .mockReturnValue(of({ executions: [], total: 0, last: true })),
};

async function renderComponent() {
  return render(HostComponent, {
    imports: [MockComponent(MxevolveSingleSelectDropdownComponent)],
    componentProviders: [
      {
        provide: ValidationProcessListingService,
        useValue: listingService,
      },
      {
        provide: ValidationProcessExecutionMapperService,
        useValue: {},
      },
    ],
  });
}

describe("ScopeStartCommitInputComponent", () => {
  it("offers the suggested and custom modes", async () => {
    await renderComponent();

    expect(screen.getByLabelText("Suggested commits")).toBeTruthy();
    expect(screen.getByLabelText("Custom Commit ID")).toBeTruthy();
  });

  it("writes the chosen suggested commit to the bound control", async () => {
    const view = await renderComponent();

    ngMocks
      .find(MxevolveSingleSelectDropdownComponent)
      .componentInstance.selectionChange.emit("commit-9");

    expect(view.fixture.componentInstance.form.value.commit).toBe("commit-9");
  });

  it("writes a custom commit id when switching to custom mode", async () => {
    const user = userEvent.setup();
    const view = await renderComponent();

    await user.click(screen.getByLabelText("Custom Commit ID"));
    await user.type(screen.getByRole("textbox"), "abc123");

    expect(view.fixture.componentInstance.form.value.commit).toBe("abc123");
  });
});
