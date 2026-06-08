import { Component, computed, input, signal } from "@angular/core";
import { Tag } from "primeng/tag";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import {
  QualityGateValidationDecision,
  QualityGateValidationResult,
} from "@mxevolve/domains/business-process/util";
import { Divider } from "primeng/divider";

interface DecisionTagConfiguration {
  label: string;
  severity: "success" | "info" | "warn" | "danger" | "secondary" | "contrast";
  icon: string;
}

const DECISION_TAG_CONFIGURATIONS: Record<string, DecisionTagConfiguration> = {
  [QualityGateValidationDecision.VALIDATION_PASSED]: {
    label: "Passed",
    severity: "success",
    icon: "check_circle",
  },
  [QualityGateValidationDecision.FAILED_AND_STOP_THE_PROCESS]: {
    label: "Failed",
    severity: "danger",
    icon: "cancel",
  },
};

const DEFAULT_DECISION_TAG_CONFIGURATION: DecisionTagConfiguration = {
  label: "Unknown",
  severity: "secondary",
  icon: "help",
};

const COMMENT_TRUNCATION_LENGTH = 80;

@Component({
  selector: "mxevolve-quality-gate-validation-banner",
  imports: [Tag, MxevolveIconComponent, Divider],
  templateUrl: "./quality-gate-validation-banner.component.html",
})
export class QualityGateValidationBannerComponent {
  readonly validationResult = input.required<QualityGateValidationResult>();

  readonly decisionConfig = computed(
    () =>
      DECISION_TAG_CONFIGURATIONS[this.validationResult().decision] ??
      DEFAULT_DECISION_TAG_CONFIGURATION
  );

  readonly comment = computed(() => this.validationResult().comment);

  readonly requester = computed(() => this.validationResult().requester);

  readonly truncatedComment = computed(() => {
    const c = this.comment();
    if (!c || c.length === 0) return null;
    if (c.length <= COMMENT_TRUNCATION_LENGTH) return c;
    return c.substring(0, COMMENT_TRUNCATION_LENGTH) + "...";
  });

  readonly isCommentTruncated = computed(() => {
    const c = this.comment();
    return !!c && c.length > COMMENT_TRUNCATION_LENGTH;
  });

  readonly commentExpanded = signal(false);

  toggleCommentExpanded(): void {
    this.commentExpanded.update((v) => !v);
  }
}
