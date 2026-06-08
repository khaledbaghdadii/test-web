import {
  Component,
  computed,
  contentChildren,
  input,
  model,
} from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { MxevolveIconComponent } from "../icons/mxevolve-icon/mxevolve-icon.component";
import { StepComponent } from "./step.component";
import { StepDefinition } from "./step";
import { Tooltip } from "primeng/tooltip";
import { Divider } from "primeng/divider";

@Component({
  selector: "mxevolve-stepper",
  standalone: true,
  imports: [MxevolveIconComponent, NgTemplateOutlet, Tooltip, Divider],
  templateUrl: "./stepper.component.html",
  host: {
    style: "display: contents;",
  },
})
export class StepperComponent {
  readonly steps = input.required<StepDefinition[]>();
  readonly orientation = input<"horizontal" | "vertical">("horizontal");
  readonly verticalStepperHeightLimitingClasses = input<string>("");

  readonly isVertical = computed(() => this.orientation() === "vertical");

  readonly displayedStepId = model<string | undefined>();

  readonly stepComponents = contentChildren(StepComponent);

  readonly defaultStepId = computed(() => {
    const steps = this.steps();
    const activeStep = steps.find((s) => s.status === "active");
    if (activeStep) return activeStep.id;
    const fallbackSteps = steps.filter(
      (s) => s.status === "completed" || s.status === "failed"
    );
    return fallbackSteps.length > 0
      ? fallbackSteps[fallbackSteps.length - 1].id
      : undefined;
  });

  readonly effectiveDisplayedStepId = computed(
    () => this.displayedStepId() ?? this.defaultStepId()
  );

  readonly displayedStep = computed(() => {
    const id = this.effectiveDisplayedStepId();
    if (!id) return undefined;
    return this.stepComponents().find((s) => s.stepId() === id);
  });

  protected iconName(step: StepDefinition): string {
    switch (step.status) {
      case "completed":
        return "circle_dot_completed";
      case "active":
        return "circle_dot_active";
      case "failed":
        return "circle_dot_failed";
      case "skipped":
        return "circle_dot_skipped";
      default:
        return "circle_dot_inactive";
    }
  }

  protected isClickable(step: StepDefinition): boolean {
    return step.status !== "inactive" && step.status !== "skipped";
  }

  protected isMuted(step: StepDefinition): boolean {
    return step.status === "inactive" || step.status === "skipped";
  }

  protected displayTitle(step: StepDefinition): string {
    return step.status === "skipped" ? `${step.title} - Skipped` : step.title;
  }

  protected onStepClick(step: StepDefinition): void {
    if (this.isClickable(step)) {
      this.displayedStepId.set(step.id);
    }
  }
}
