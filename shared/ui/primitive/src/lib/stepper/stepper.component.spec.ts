import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { Tooltip } from "primeng/tooltip";
import { MxevolveIconComponent } from "../icons/mxevolve-icon/mxevolve-icon.component";
import { StepComponent } from "./step.component";
import { StepperComponent } from "./stepper.component";
import { StepDefinition } from "./step";

const MOCK_IMPORTS = [
  StepperComponent,
  StepComponent,
  MockComponent(MxevolveIconComponent),
  Tooltip,
];

async function renderComponent(
  overrides: {
    steps?: StepDefinition[];
    template?: string;
  } = {}
) {
  const steps = overrides.steps ?? [
    { id: "s1", title: "Step One", status: "completed" as const },
    { id: "s2", title: "Step Two", status: "active" as const },
    { id: "s3", title: "Step Three", status: "inactive" as const },
  ];
  const template =
    overrides.template ??
    `
    <mxevolve-stepper [steps]="steps">
      <mxevolve-step stepId="s1"><ng-template>Content for step one</ng-template></mxevolve-step>
      <mxevolve-step stepId="s2"><ng-template>Content for step two</ng-template></mxevolve-step>
      <mxevolve-step stepId="s3"><ng-template>Content for step three</ng-template></mxevolve-step>
    </mxevolve-stepper>
  `;

  return render(template, {
    imports: [...MOCK_IMPORTS],
    componentProperties: { steps },
  });
}

describe("StepperComponent", () => {
  it("renders step titles in horizontal layout", async () => {
    await renderComponent();

    expect(screen.getByText("Step One")).toBeTruthy();
    expect(screen.getByText("Step Two")).toBeTruthy();
    expect(screen.getByText("Step Three")).toBeTruthy();
  });

  it("shows active step content by default", async () => {
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Content for step two")).toBeTruthy();
      expect(screen.queryByText("Content for step one")).toBeNull();
      expect(screen.queryByText("Content for step three")).toBeNull();
    });
  });

  it("shows last completed step content when no active step", async () => {
    await renderComponent({
      steps: [
        { id: "s1", title: "Step One", status: "completed" },
        { id: "s2", title: "Step Two", status: "completed" },
        { id: "s3", title: "Step Three", status: "inactive" },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText("Content for step two")).toBeTruthy();
      expect(screen.queryByText("Content for step one")).toBeNull();
      expect(screen.queryByText("Content for step three")).toBeNull();
    });
  });

  it("shows no content when all steps are inactive", async () => {
    await renderComponent({
      steps: [
        { id: "s1", title: "Step One", status: "inactive" },
        { id: "s2", title: "Step Two", status: "inactive" },
        { id: "s3", title: "Step Three", status: "inactive" },
      ],
    });

    await waitFor(() => {
      expect(screen.queryByText("Content for step one")).toBeNull();
      expect(screen.queryByText("Content for step two")).toBeNull();
      expect(screen.queryByText("Content for step three")).toBeNull();
    });
  });

  it("removes non-displayed step content from DOM instead of hiding it", async () => {
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Content for step two")).toBeTruthy();
      expect(document.body.innerHTML).not.toContain("Content for step one");
      expect(document.body.innerHTML).not.toContain("Content for step three");
    });
  });

  it("shows completed step content when clicked", async () => {
    await renderComponent();
    const user = userEvent.setup();

    await user.click(screen.getByText("Step One"));

    await waitFor(() => {
      expect(screen.getByText("Content for step one")).toBeTruthy();
      expect(screen.queryByText("Content for step two")).toBeNull();
    });
  });

  it("shows active step content when clicked", async () => {
    await renderComponent();
    const user = userEvent.setup();

    await user.click(screen.getByText("Step One"));
    await waitFor(() => {
      expect(screen.getByText("Content for step one")).toBeTruthy();
    });

    await user.click(screen.getByText("Step Two"));

    await waitFor(() => {
      expect(screen.getByText("Content for step two")).toBeTruthy();
      expect(screen.queryByText("Content for step one")).toBeNull();
    });
  });

  it("does not change content when inactive step is clicked", async () => {
    await renderComponent();
    const user = userEvent.setup();

    await user.click(screen.getByText("Step Three"));

    await waitFor(() => {
      expect(screen.getByText("Content for step two")).toBeTruthy();
      expect(screen.queryByText("Content for step three")).toBeNull();
    });
  });

  it("does not change step statuses when step is clicked", async () => {
    const steps: StepDefinition[] = [
      { id: "s1", title: "Step One", status: "completed" },
      { id: "s2", title: "Step Two", status: "active" },
      { id: "s3", title: "Step Three", status: "inactive" },
    ];
    await renderComponent({ steps });
    const user = userEvent.setup();

    await user.click(screen.getByText("Step One"));

    expect(steps[0].status).toBe("completed");
    expect(steps[1].status).toBe("active");
    expect(steps[2].status).toBe("inactive");
  });

  it("reflects displayed step when steps input changes", async () => {
    const { fixture } = await renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Content for step two")).toBeTruthy();
      expect(screen.queryByText("Content for step one")).toBeNull();
    });

    fixture.componentInstance.steps = [
      { id: "s1", title: "Step One", status: "active" as const },
      { id: "s2", title: "Step Two", status: "inactive" as const },
      { id: "s3", title: "Step Three", status: "inactive" as const },
    ];

    await waitFor(() => {
      expect(screen.getByText("Content for step one")).toBeTruthy();
      expect(screen.queryByText("Content for step two")).toBeNull();
    });
  });

  it("emits displayedStepId on step click", async () => {
    const displayedStepId: string | undefined = undefined;
    const displayedStepIdChange = jest.fn();

    await render(
      `
      <mxevolve-stepper [steps]="steps" [displayedStepId]="displayedStepId" (displayedStepIdChange)="displayedStepIdChange($event)">
        <mxevolve-step stepId="s1"><ng-template>Content for step one</ng-template></mxevolve-step>
        <mxevolve-step stepId="s2"><ng-template>Content for step two</ng-template></mxevolve-step>
        <mxevolve-step stepId="s3"><ng-template>Content for step three</ng-template></mxevolve-step>
      </mxevolve-stepper>
    `,
      {
        imports: [...MOCK_IMPORTS],
        componentProperties: {
          steps: [
            { id: "s1", title: "Step One", status: "completed" as const },
            { id: "s2", title: "Step Two", status: "active" as const },
            { id: "s3", title: "Step Three", status: "inactive" as const },
          ],
          displayedStepId,
          displayedStepIdChange,
        },
      }
    );

    const user = userEvent.setup();
    await user.click(screen.getByText("Step One"));

    expect(displayedStepIdChange).toHaveBeenCalledWith("s1");
  });

  it("shows step matching externally set displayedStepId", async () => {
    await render(
      `
      <mxevolve-stepper [steps]="steps" [displayedStepId]="displayedStepId">
        <mxevolve-step stepId="s1"><ng-template>Content for step one</ng-template></mxevolve-step>
        <mxevolve-step stepId="s2"><ng-template>Content for step two</ng-template></mxevolve-step>
        <mxevolve-step stepId="s3"><ng-template>Content for step three</ng-template></mxevolve-step>
      </mxevolve-stepper>
    `,
      {
        imports: [...MOCK_IMPORTS],
        componentProperties: {
          steps: [
            { id: "s1", title: "Step One", status: "completed" as const },
            { id: "s2", title: "Step Two", status: "active" as const },
            { id: "s3", title: "Step Three", status: "inactive" as const },
          ],
          displayedStepId: "s1",
        },
      }
    );

    await waitFor(() => {
      expect(screen.getByText("Content for step one")).toBeTruthy();
      expect(screen.queryByText("Content for step two")).toBeNull();
    });
  });

  describe("vertical orientation", () => {
    it("renders step titles in vertical mode", async () => {
      const template = `
        <mxevolve-stepper [steps]="steps" orientation="vertical">
          <mxevolve-step stepId="s1"><ng-template>Content for step one</ng-template></mxevolve-step>
          <mxevolve-step stepId="s2"><ng-template>Content for step two</ng-template></mxevolve-step>
          <mxevolve-step stepId="s3"><ng-template>Content for step three</ng-template></mxevolve-step>
        </mxevolve-stepper>`;
      await render(template, {
        imports: [...MOCK_IMPORTS],
        componentProperties: {
          steps: [
            { id: "s1", title: "Step One", status: "completed" as const },
            { id: "s2", title: "Step Two", status: "active" as const },
            { id: "s3", title: "Step Three", status: "inactive" as const },
          ],
        },
      });

      expect(screen.getByText("Step One")).toBeTruthy();
      expect(screen.getByText("Step Two")).toBeTruthy();
      expect(screen.getByText("Step Three")).toBeTruthy();
    });

    it("shows active step content in vertical mode", async () => {
      const template = `
        <mxevolve-stepper [steps]="steps" orientation="vertical">
          <mxevolve-step stepId="s1"><ng-template>Content for step one</ng-template></mxevolve-step>
          <mxevolve-step stepId="s2"><ng-template>Content for step two</ng-template></mxevolve-step>
          <mxevolve-step stepId="s3"><ng-template>Content for step three</ng-template></mxevolve-step>
        </mxevolve-stepper>`;
      await render(template, {
        imports: [...MOCK_IMPORTS],
        componentProperties: {
          steps: [
            { id: "s1", title: "Step One", status: "completed" as const },
            { id: "s2", title: "Step Two", status: "active" as const },
            { id: "s3", title: "Step Three", status: "inactive" as const },
          ],
        },
      });

      await waitFor(() => {
        expect(screen.getByText("Content for step two")).toBeTruthy();
      });
    });

    it("shows clicked step content in vertical mode", async () => {
      const template = `
        <mxevolve-stepper [steps]="steps" orientation="vertical">
          <mxevolve-step stepId="s1"><ng-template>Content for step one</ng-template></mxevolve-step>
          <mxevolve-step stepId="s2"><ng-template>Content for step two</ng-template></mxevolve-step>
          <mxevolve-step stepId="s3"><ng-template>Content for step three</ng-template></mxevolve-step>
        </mxevolve-stepper>`;
      await render(template, {
        imports: [...MOCK_IMPORTS],
        componentProperties: {
          steps: [
            { id: "s1", title: "Step One", status: "completed" as const },
            { id: "s2", title: "Step Two", status: "active" as const },
            { id: "s3", title: "Step Three", status: "inactive" as const },
          ],
        },
      });

      const user = userEvent.setup();
      await user.click(screen.getByText("Step One"));

      await waitFor(() => {
        expect(screen.getByText("Content for step one")).toBeTruthy();
        expect(screen.queryByText("Content for step two")).toBeNull();
      });
    });
  });

  describe("failed status", () => {
    it("allows clicking on a failed step", async () => {
      const displayedStepIdChange = jest.fn();

      await render(
        `
        <mxevolve-stepper [steps]="steps" (displayedStepIdChange)="displayedStepIdChange($event)">
          <mxevolve-step stepId="s1"><ng-template>Content for step one</ng-template></mxevolve-step>
          <mxevolve-step stepId="s2"><ng-template>Content for step two</ng-template></mxevolve-step>
          <mxevolve-step stepId="s3"><ng-template>Content for step three</ng-template></mxevolve-step>
        </mxevolve-stepper>
      `,
        {
          imports: [...MOCK_IMPORTS],
          componentProperties: {
            steps: [
              { id: "s1", title: "Step One", status: "completed" as const },
              { id: "s2", title: "Step Two", status: "failed" as const },
              { id: "s3", title: "Step Three", status: "inactive" as const },
            ],
            displayedStepIdChange,
          },
        }
      );

      const user = userEvent.setup();
      await user.click(screen.getByText("Step Two"));

      expect(displayedStepIdChange).toHaveBeenCalledWith("s2");
    });

    it("shows last failed step content when no active step", async () => {
      await renderComponent({
        steps: [
          { id: "s1", title: "Step One", status: "completed" },
          { id: "s2", title: "Step Two", status: "failed" },
          { id: "s3", title: "Step Three", status: "inactive" },
        ],
      });

      await waitFor(() => {
        expect(screen.getByText("Content for step two")).toBeTruthy();
        expect(screen.queryByText("Content for step one")).toBeNull();
        expect(screen.queryByText("Content for step three")).toBeNull();
      });
    });

    it("shows last failed step content when all steps are failed", async () => {
      await renderComponent({
        steps: [
          { id: "s1", title: "Step One", status: "failed" },
          { id: "s2", title: "Step Two", status: "failed" },
          { id: "s3", title: "Step Three", status: "failed" },
        ],
      });

      await waitFor(() => {
        expect(screen.getByText("Content for step three")).toBeTruthy();
        expect(screen.queryByText("Content for step one")).toBeNull();
        expect(screen.queryByText("Content for step two")).toBeNull();
      });
    });

    it("renders failed icon for failed steps", async () => {
      await renderComponent({
        steps: [
          { id: "s1", title: "Step One", status: "completed" },
          { id: "s2", title: "Step Two", status: "failed" },
          { id: "s3", title: "Step Three", status: "inactive" },
        ],
      });

      const icons = ngMocks.findInstances(MxevolveIconComponent);
      const iconNames = icons.map((icon) => icon.name);
      expect(iconNames).toContain("circle_dot_failed");
    });
  });

  describe("skipped status", () => {
    function skippedSteps(): StepDefinition[] {
      return [
        { id: "s1", title: "Step One", status: "completed" },
        { id: "s2", title: "Step Two", status: "skipped" },
        { id: "s3", title: "Step Three", status: "active" },
      ];
    }

    it("renders the skipped icon for skipped steps", async () => {
      await renderComponent({ steps: skippedSteps() });

      const iconNames = ngMocks
        .findInstances(MxevolveIconComponent)
        .map((icon) => icon.name);
      expect(iconNames).toContain("circle_dot_skipped");
    });

    it("appends the '- Skipped' suffix to a skipped step title", async () => {
      await renderComponent({ steps: skippedSteps() });

      expect(screen.getByText("Step Two - Skipped")).toBeTruthy();
      expect(screen.queryByText("Step Two")).toBeNull();
    });

    it("does not allow clicking on a skipped step", async () => {
      const displayedStepIdChange = jest.fn();

      await render(
        `
        <mxevolve-stepper [steps]="steps" (displayedStepIdChange)="displayedStepIdChange($event)">
          <mxevolve-step stepId="s1"><ng-template>Content for step one</ng-template></mxevolve-step>
          <mxevolve-step stepId="s2"><ng-template>Content for step two</ng-template></mxevolve-step>
          <mxevolve-step stepId="s3"><ng-template>Content for step three</ng-template></mxevolve-step>
        </mxevolve-stepper>
      `,
        {
          imports: [...MOCK_IMPORTS],
          componentProperties: {
            steps: skippedSteps(),
            displayedStepIdChange,
          },
        }
      );

      const user = userEvent.setup();
      await user.click(screen.getByText("Step Two - Skipped"));

      expect(displayedStepIdChange).not.toHaveBeenCalled();
    });

    it("renders the expected icon for every step status", async () => {
      await renderComponent({
        steps: [
          { id: "s1", title: "Completed", status: "completed" },
          { id: "s2", title: "Active", status: "active" },
          { id: "s3", title: "Failed", status: "failed" },
          { id: "s4", title: "Skipped", status: "skipped" },
          { id: "s5", title: "Inactive", status: "inactive" },
        ],
      });

      const iconNames = ngMocks
        .findInstances(MxevolveIconComponent)
        .map((icon) => icon.name);
      expect(iconNames).toEqual(
        expect.arrayContaining([
          "circle_dot_completed",
          "circle_dot_active",
          "circle_dot_failed",
          "circle_dot_skipped",
          "circle_dot_inactive",
        ])
      );
    });
  });

  describe("tooltip support", () => {
    it("shows tooltip text on hover", async () => {
      const steps: StepDefinition[] = [
        {
          id: "s1",
          title: "Step One",
          status: "active",
          tooltip: "Step one info",
        },
        { id: "s2", title: "Step Two", status: "inactive" },
      ];
      const template = `<mxevolve-stepper [steps]="steps"></mxevolve-stepper>`;
      const user = userEvent.setup();
      await render(template, {
        imports: [...MOCK_IMPORTS],
        componentProperties: { steps },
      });

      await user.hover(screen.getByText("Step One"));

      await waitFor(() => {
        expect(screen.getByText("Step one info")).toBeTruthy();
      });
    });

    it("does not show tooltip when tooltip text is not provided", async () => {
      const steps: StepDefinition[] = [
        { id: "s1", title: "Step One", status: "active" },
        { id: "s2", title: "Step Two", status: "inactive" },
      ];
      const template = `<mxevolve-stepper [steps]="steps"></mxevolve-stepper>`;
      const user = userEvent.setup();
      await render(template, {
        imports: [...MOCK_IMPORTS],
        componentProperties: { steps },
      });

      await user.hover(screen.getByText("Step One"));

      expect(screen.queryByText("Step one info")).toBeNull();
    });
  });
});
