import { Component, input, signal } from "@angular/core";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { DeleteDevelopmentCheckboxComponent } from "@mxevolve/domains/business-process/widget";
import {
  QualityGateValidationDecision,
  ExecutionFamily,
} from "@mxevolve/domains/business-process/util";
import {
  QualityGateValidationFormComponent,
  QualityGateValidationValue,
} from "./quality-gate-validation-form.component";

const MockDeleteDevelopmentCheckbox = MockComponent(
  DeleteDevelopmentCheckboxComponent
);

@Component({
  selector: "mxevolve-test-host",
  standalone: true,
  imports: [QualityGateValidationFormComponent, ReactiveFormsModule],
  template: `
    @if (showCva()) {
    <mxevolve-quality-gate-validation-form
      [formControl]="control"
      [projectId]="projectId()"
      [processId]="processId()"
      [supportsResourceManagement]="supportsResourceManagement()"
    />
    }
  `,
})
class TestHostComponent {
  readonly projectId = input("project-123");
  readonly processId = input("process-456");
  readonly supportsResourceManagement = input(true);
  readonly showCva = signal(true);
  readonly control = new FormControl<QualityGateValidationValue | null>(null);
}

async function renderComponent(
  overrides: Partial<{
    projectId: string;
    processId: string;
    supportsResourceManagement: boolean;
  }> = {}
) {
  return render(TestHostComponent, {
    inputs: { ...overrides },
    configureTestBed: (testBed) => {
      testBed.overrideComponent(QualityGateValidationFormComponent, {
        remove: { imports: [DeleteDevelopmentCheckboxComponent] },
        add: { imports: [MockDeleteDevelopmentCheckbox] },
      });
    },
  });
}

describe("QualityGateValidationComponent", () => {
  it("renders radio buttons for passed and failed decisions", async () => {
    await renderComponent();

    expect(screen.getByLabelText("Passed and Proceed")).toBeTruthy();
    expect(screen.getByLabelText("Failed and stop the process")).toBeTruthy();
  });

  it("renders comment textarea with placeholder", async () => {
    await renderComponent();

    expect(screen.getByPlaceholderText("Enter your comments")).toBeTruthy();
  });

  it("shows delete-branch checkbox when decision is FAILED and supportsResourceManagement is true", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(screen.getByLabelText("Failed and stop the process"));

    await waitFor(() => {
      expect(
        document.querySelector("mxevolve-delete-development-checkbox")
      ).toBeTruthy();
    });
  });

  it("hides delete-branch checkbox when decision is PASSED", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(screen.getByLabelText("Passed and Proceed"));

    await waitFor(() => {
      expect(
        document.querySelector("mxevolve-delete-development-checkbox")
      ).toBeNull();
    });
  });

  it("hides delete-branch checkbox when supportsResourceManagement is false", async () => {
    const user = userEvent.setup();
    await renderComponent({ supportsResourceManagement: false });

    await user.click(screen.getByLabelText("Failed and stop the process"));

    await waitFor(() => {
      expect(
        document.querySelector("mxevolve-delete-development-checkbox")
      ).toBeNull();
    });
  });

  it("hides delete-branch checkbox when no decision is selected", async () => {
    await renderComponent();

    expect(
      document.querySelector("mxevolve-delete-development-checkbox")
    ).toBeNull();
  });

  it("updates form control value when user selects PASSED decision", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByLabelText("Passed and Proceed"));

    await waitFor(() => {
      expect(fixture.componentInstance.control.value).toEqual({
        validationDecision: QualityGateValidationDecision.VALIDATION_PASSED,
        comment: "",
        deleteBranch: null,
      });
    });
  });

  it("updates form control value when user selects FAILED decision", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByLabelText("Failed and stop the process"));

    await waitFor(() => {
      expect(fixture.componentInstance.control.value).toEqual({
        validationDecision:
          QualityGateValidationDecision.FAILED_AND_STOP_THE_PROCESS,
        comment: "",
        deleteBranch: null,
      });
    });
  });

  it("updates form control value with comment", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.type(
      screen.getByPlaceholderText("Enter your comments"),
      "Some feedback"
    );

    await waitFor(() => {
      expect(fixture.componentInstance.control.value).toEqual({
        validationDecision: null,
        comment: "Some feedback",
        deleteBranch: null,
      });
    });
  });

  it("pre-populates the form when the control has an initial value", async () => {
    const { fixture } = await renderComponent();

    fixture.componentInstance.control.setValue({
      validationDecision: QualityGateValidationDecision.VALIDATION_PASSED,
      comment: "Already validated",
      deleteBranch: null,
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter your comments")).toHaveValue(
        "Already validated"
      );
      expect(screen.getByLabelText("Passed and Proceed")).toBeChecked();
    });
  });

  it("disables all controls when the form control is disabled", async () => {
    const { fixture } = await renderComponent();

    fixture.componentInstance.control.disable();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter your comments")).toBeDisabled();
      expect(screen.getByLabelText("Passed and Proceed")).toBeDisabled();
      expect(
        screen.getByLabelText("Failed and stop the process")
      ).toBeDisabled();
    });
  });

  it("re-enables all controls when the form control is re-enabled", async () => {
    const { fixture } = await renderComponent();

    fixture.componentInstance.control.disable();
    fixture.componentInstance.control.enable();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Enter your comments")
      ).not.toBeDisabled();
      expect(screen.getByLabelText("Passed and Proceed")).not.toBeDisabled();
      expect(
        screen.getByLabelText("Failed and stop the process")
      ).not.toBeDisabled();
    });
  });

  it("passes correct inputs to delete-development checkbox", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByLabelText("Failed and stop the process"));

    await waitFor(() => {
      const checkbox = ngMocks.find(
        fixture,
        DeleteDevelopmentCheckboxComponent
      );
      expect(checkbox.componentInstance.projectId).toBe("project-123");
      expect(checkbox.componentInstance.processId).toBe("process-456");
      expect(checkbox.componentInstance.familyId).toBe(
        ExecutionFamily.UPGRADE_PROCESS
      );
      expect(checkbox.componentInstance.actionLabel).toBe(
        "after stopping the process"
      );
    });
  });

  it("is invalid when no decision is selected", async () => {
    const { fixture } = await renderComponent();

    expect(fixture.componentInstance.control.valid).toBe(false);
  });

  it("becomes valid when PASSED decision is selected", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByLabelText("Passed and Proceed"));

    await waitFor(() => {
      expect(fixture.componentInstance.control.valid).toBe(true);
    });
  });

  it("becomes valid when FAILED decision is selected", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.click(screen.getByLabelText("Failed and stop the process"));

    await waitFor(() => {
      expect(fixture.componentInstance.control.valid).toBe(true);
    });
  });

  it("is invalid when only a comment is provided without a decision", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();

    await user.type(
      screen.getByPlaceholderText("Enter your comments"),
      "Some feedback"
    );

    await waitFor(() => {
      expect(fixture.componentInstance.control.valid).toBe(false);
    });
  });

  it("preserves parent form value when component is destroyed and recreated", async () => {
    const { fixture } = await renderComponent();
    const host = fixture.componentInstance;

    host.control.setValue({
      validationDecision: QualityGateValidationDecision.VALIDATION_PASSED,
      comment: "Already validated",
      deleteBranch: null,
    });

    await waitFor(() => {
      expect(host.control.value).toEqual({
        validationDecision: QualityGateValidationDecision.VALIDATION_PASSED,
        comment: "Already validated",
        deleteBranch: null,
      });
    });

    host.showCva.set(false);

    await waitFor(() => {
      expect(host.control.value).toEqual({
        validationDecision: QualityGateValidationDecision.VALIDATION_PASSED,
        comment: "Already validated",
        deleteBranch: null,
      });
    });

    host.showCva.set(true);

    await waitFor(() => {
      expect(host.control.value).toEqual({
        validationDecision: QualityGateValidationDecision.VALIDATION_PASSED,
        comment: "Already validated",
        deleteBranch: null,
      });
    });
  });
});
