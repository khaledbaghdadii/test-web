import { Component, input } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { of } from "rxjs";
import { FactoryProductInputComponent } from "@mxevolve/domains/test/widget";
import { DevelopmentService } from "@mxevolve/domains/scm/data-access";
import { ConfigurationFilesPickerComponent } from "@mxflow/features/environment";
import {
  FactoryProductSubmissionFormComponent,
  FactoryProductSubmissionMode,
  FactoryProductSubmissionValue,
} from "./factory-product-submission-form.component";

const MockFactoryProductInput = MockComponent(FactoryProductInputComponent);
const MockConfigurationFilesPicker = MockComponent(
  ConfigurationFilesPickerComponent
);

const MOCK_DEVELOPMENT = {
  id: "dev-1",
  name: "upgrade-branch",
  projectId: "proj-1",
  repository: { id: "repo-1", url: "https://repo.example.com" },
  latestCommitId: "abc123",
  createdOn: "2026-01-01",
  parentCommitId: "parent123",
  deleted: false,
};

const mockDevelopmentService = {
  getDevelopment: jest.fn(),
};

@Component({
  selector: "mxevolve-test-host",
  standalone: true,
  imports: [FactoryProductSubmissionFormComponent, ReactiveFormsModule],
  template: `
    <mxevolve-factory-product-submission-form
      [formControl]="control"
      [projectId]="projectId()"
      [developmentId]="developmentId()"
      [initialFactoryProductId]="initialFactoryProductId()"
      [mode]="mode()"
    />
  `,
})
class FactoryProductSubmissionFormHostComponent {
  readonly projectId = input("proj-1");
  readonly developmentId = input("dev-1");
  readonly initialFactoryProductId = input<string | undefined>(undefined);
  readonly mode = input<FactoryProductSubmissionMode>("edit");
  readonly control = new FormControl<FactoryProductSubmissionValue | null>(
    null
  );
}

async function renderComponent(
  overrides: Partial<{
    projectId: string;
    developmentId: string;
    initialFactoryProductId: string;
    mode: FactoryProductSubmissionMode;
  }> = {}
) {
  return render(FactoryProductSubmissionFormHostComponent, {
    inputs: { ...overrides },
    configureTestBed: (testBed) => {
      testBed.overrideComponent(FactoryProductSubmissionFormComponent, {
        remove: {
          imports: [
            FactoryProductInputComponent,
            ConfigurationFilesPickerComponent,
          ],
        },
        add: {
          imports: [MockFactoryProductInput, MockConfigurationFilesPicker],
        },
      });
    },
    componentProviders: [
      { provide: DevelopmentService, useValue: mockDevelopmentService },
    ],
  });
}

describe("FactoryProductSubmissionFormComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDevelopmentService.getDevelopment.mockReturnValue(of(MOCK_DEVELOPMENT));
  });

  it("renders the skip updating factory product toggle", async () => {
    await renderComponent();

    expect(
      screen.getByLabelText(/Skip updating Factory Product/i)
    ).toBeInTheDocument();
  });

  it("renders the factory product input", async () => {
    await renderComponent();

    expect(
      document.querySelector("mxevolve-factory-product-input")
    ).toBeTruthy();
  });

  it("renders the commit message textarea", async () => {
    await renderComponent();

    expect(screen.getByLabelText(/Commit Message/)).toBeInTheDocument();
  });

  it("renders the configuration files picker with the resolved repository id and branch name", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() => {
      const picker = ngMocks.find(fixture, ConfigurationFilesPickerComponent);

      expect(picker.componentInstance.repositoryId).toBe("repo-1");
      expect(picker.componentInstance.branchName).toBe("upgrade-branch");
      expect(picker.componentInstance.projectId).toBe("proj-1");
    });
  });

  it("is invalid when factory product and commit message are empty", async () => {
    const { fixture } = await renderComponent();

    expect(fixture.componentInstance.control.valid).toBe(false);
  });

  it("remains invalid when no configuration files are selected", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.type(screen.getByLabelText(/Commit Message/), "My commit");

    const factoryProductInput = ngMocks.find(
      fixture,
      FactoryProductInputComponent
    );
    factoryProductInput.componentInstance.factoryProductIdChange.emit("fp-1");

    await waitFor(() => {
      expect(fixture.componentInstance.control.valid).toBe(false);
    });
  });

  it("is valid when factory product, commit message and configuration files are provided", async () => {
    const { fixture } = await renderComponent();

    fixture.componentInstance.control.setValue({
      factoryProductId: "fp-1",
      commitMessage: "My commit",
      selectedConfigurationFilePaths: ["file.yml"],
      skipSubmission: false,
    });

    await waitFor(() => {
      expect(fixture.componentInstance.control.valid).toBe(true);
    });
  });

  it("propagates form values to the outer form control", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.type(screen.getByLabelText(/Commit Message/), "My commit");

    await waitFor(() => {
      expect(fixture.componentInstance.control.value).toEqual(
        expect.objectContaining({ commitMessage: "My commit" })
      );
    });
  });

  it("initializes the factory product id from initialFactoryProductId", async () => {
    const { fixture } = await renderComponent({
      initialFactoryProductId: "fp-initial",
    });

    await waitFor(() => {
      expect(fixture.componentInstance.control.value).toEqual(
        expect.objectContaining({ factoryProductId: "fp-initial" })
      );
    });
  });

  it("does not override a user-selected factory product with initialFactoryProductId", async () => {
    const { fixture } = await renderComponent({
      initialFactoryProductId: "fp-initial",
    });

    const factoryProductInput = ngMocks.find(
      fixture,
      FactoryProductInputComponent
    );
    factoryProductInput.componentInstance.factoryProductIdChange.emit(
      "fp-user-selected"
    );

    await waitFor(() => {
      expect(fixture.componentInstance.control.value).toEqual(
        expect.objectContaining({ factoryProductId: "fp-user-selected" })
      );
    });
  });

  it("does not update the factory product id when in readonly mode", async () => {
    const { fixture } = await renderComponent({
      mode: "readonly",
      initialFactoryProductId: "fp-initial",
    });

    const factoryProductInput = ngMocks.find(
      fixture,
      FactoryProductInputComponent
    );

    factoryProductInput.componentInstance.factoryProductIdChange.emit(
      "fp-changed"
    );

    await waitFor(() => {
      expect(fixture.componentInstance.control.value).toEqual(
        expect.objectContaining({
          factoryProductId: "fp-initial",
        })
      );
    });
  });

  it("pre-populates the form when the control has an initial value", async () => {
    const { fixture } = await renderComponent();

    fixture.componentInstance.control.setValue({
      factoryProductId: "fp-1",
      commitMessage: "Pre-filled commit",
      selectedConfigurationFilePaths: ["dir/mxevolve-configuration.yaml"],
      skipSubmission: false,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Commit Message/)).toHaveValue(
        "Pre-filled commit"
      );
    });
  });

  it("bypasses factory product submission validation when skip is enabled", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    expect(fixture.componentInstance.control.valid).toBe(false);

    await user.click(screen.getByLabelText(/Skip updating Factory Product/i));

    await waitFor(() => {
      expect(fixture.componentInstance.control.valid).toBe(true);
    });
  });

  it("disables the commit message field when the skip toggle is enabled", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(screen.getByLabelText(/Skip updating Factory Product/i));

    await waitFor(() => {
      expect(screen.getByLabelText(/Commit Message/)).toBeDisabled();
    });
  });

  it("re-enables the commit message field when the skip toggle is turned off again", async () => {
    const user = userEvent.setup();
    await renderComponent();

    const toggle = screen.getByLabelText(/Skip updating Factory Product/i);

    await user.click(toggle);
    await waitFor(() =>
      expect(screen.getByLabelText(/Commit Message/)).toBeDisabled()
    );

    await user.click(toggle);
    await waitFor(() =>
      expect(screen.getByLabelText(/Commit Message/)).toBeEnabled()
    );
  });

  it("exposes the skip choice in the emitted value", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByLabelText(/Skip updating Factory Product/i));

    await waitFor(() => {
      expect(fixture.componentInstance.control.value).toEqual(
        expect.objectContaining({ skipSubmission: true })
      );
    });
  });

  it("disables all fields in readonly mode", async () => {
    await renderComponent({ mode: "readonly" });

    await waitFor(() => {
      expect(
        screen.getByLabelText(/Skip updating Factory Product/i)
      ).toBeDisabled();
      expect(screen.getByLabelText(/Commit Message/)).toBeDisabled();
    });
  });

  it("is considered valid in readonly mode even without user input", async () => {
    const { fixture } = await renderComponent({ mode: "readonly" });

    await waitFor(() => {
      expect(fixture.componentInstance.control.valid).toBe(true);
    });
  });

  it("becomes invalid again when skip is turned off and required fields are empty", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    const toggle = screen.getByLabelText(/Skip updating Factory Product/i);

    await waitFor(() => {
      expect(fixture.componentInstance.control.valid).toBe(false);
    });

    await user.click(toggle);

    await waitFor(() => {
      expect(fixture.componentInstance.control.valid).toBe(true);
    });

    await user.click(toggle);

    await waitFor(() => {
      expect(fixture.componentInstance.control.valid).toBe(false);
    });
  });
});
