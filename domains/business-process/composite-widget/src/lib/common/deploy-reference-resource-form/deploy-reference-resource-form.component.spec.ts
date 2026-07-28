import { fireEvent, render, screen } from "@testing-library/angular";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { of, throwError } from "rxjs";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  CommitsService,
  TagService,
  Tag,
} from "@mxevolve/domains/scm/data-access";
import { DeployReferenceResourceService } from "@mxevolve/domains/business-process/data-access";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";
import { DeployReferenceResourceFormComponent } from "./deploy-reference-resource-form.component";

@Component({
  selector: "mxevolve-business-process-scenario-definition-selector",
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <input
      aria-label="Test scenario"
      [formControl]="testScenarioFormControl"
      type="text"
    />
  `,
})
class ScenarioDefinitionSelectorStubComponent {
  @Input({ required: true }) projectId!: string;
  @Input({ required: true }) testScenarioFormControl!: FormControl<string>;
  @Input({ required: true }) testScenariosFormControlName!: string;
  @Input() multiValue = false;
  @Input() clearArchived = false;
}

@Component({
  selector: "mxevolve-factory-product-input",
  standalone: true,
  template: `
    <input
      aria-label="Factory product ID"
      [value]="factoryProductId ?? ''"
      (input)="factoryProductIdChange.emit($any($event.target).value)"
      type="text"
    />
  `,
})
class FactoryProductInputStubComponent {
  @Input({ required: true }) projectId!: string;
  @Input() requiredInput = false;
  @Input() applyGridLayout = false;
  @Input() factoryProductId?: string;
  @Output() factoryProductIdChange = new EventEmitter<string>();
}

const REQUIRED_INPUTS = {
  projectId: "project-1",
  repositoryId: "repo-1",
  scenarioExecutionGroupId: "group-1",
  infraGroupId: "infra-1",
};

const mockTagService = { getTag: jest.fn() };
const mockCommitsService = { getCommit: jest.fn() };
const mockDeployService = {
  deployReferenceResource: jest.fn(),
};
const mockToast = { showSuccess: jest.fn(), showError: jest.fn() };
const mockAnalyticsTracker = { trackEvent: jest.fn() };

function tagError(status: number): Error & { status: number } {
  return Object.assign(new Error("tag not found"), { status });
}

function setCommitOrTag(value: string): void {
  fireEvent.input(screen.getByLabelText("Commit ID or Tag"), {
    target: { value },
  });
}

function setScenarioDefinition(value: string): void {
  fireEvent.input(screen.getByLabelText("Test scenario"), {
    target: { value },
  });
}

function setFactoryProductId(value: string): void {
  fireEvent.input(screen.getByLabelText("Factory product ID"), {
    target: { value },
  });
}

function getDeployButton(): HTMLElement {
  return screen.getByRole("button", { name: "Deploy" });
}

async function renderComponent(extraInputs: Record<string, unknown> = {}) {
  return render(DeployReferenceResourceFormComponent, {
    inputs: { ...REQUIRED_INPUTS, ...extraInputs },
    componentImports: [
      Dialog,
      Button,
      InputText,
      ReactiveFormsModule,
      ScenarioDefinitionSelectorStubComponent,
      FactoryProductInputStubComponent,
    ],
    providers: [
      { provide: ToastMessageService, useValue: mockToast },
      { provide: AnalyticsTrackerService, useValue: mockAnalyticsTracker },
    ],
    componentProviders: [
      { provide: TagService, useValue: mockTagService },
      { provide: CommitsService, useValue: mockCommitsService },
      {
        provide: DeployReferenceResourceService,
        useValue: mockDeployService,
      },
    ],
  });
}

describe("DeployReferenceResourceFormComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTagService.getTag.mockReturnValue(throwError(() => tagError(400)));
    mockCommitsService.getCommit.mockReturnValue(of([{ id: "abc1234" }]));
    mockDeployService.deployReferenceResource.mockReturnValue(of(undefined));
  });

  describe("DeployButton", () => {
    it("when the factory product, commitOrTag and TPK are provided, the deploy button should be enabled", async () => {
      await renderComponent({ visible: true });

      expect(getDeployButton()).toBeDisabled();

      setCommitOrTag("abc1234");
      setScenarioDefinition("scn-1");
      setFactoryProductId("fap-1");

      expect(getDeployButton()).toBeEnabled();
    });

    it("when the factory product is missing, the deploy button should be disabled", async () => {
      await renderComponent({ visible: true });

      setCommitOrTag("abc1234");
      setScenarioDefinition("scn-1");

      expect(getDeployButton()).toBeDisabled();
    });

    it("when the commitOrTag is missing, the deploy button should be disabled", async () => {
      await renderComponent({ visible: true });

      setScenarioDefinition("scn-1");
      setFactoryProductId("fap-1");

      expect(getDeployButton()).toBeDisabled();
    });

    it("when the TPK is missing, the deploy button should be disabled", async () => {
      await renderComponent({ visible: true });

      setCommitOrTag("abc1234");
      setFactoryProductId("fap-1");

      expect(getDeployButton()).toBeDisabled();
    });
  });

  it("given the user provided a commit (which is an invalid tag), then the system should deploy successfully", async () => {
    await renderComponent({ visible: true });

    setCommitOrTag("abc1234");
    setScenarioDefinition("scn-1");
    setFactoryProductId("fap-1");
    fireEvent.click(getDeployButton());

    expect(mockTagService.getTag).toHaveBeenCalledWith(
      "project-1",
      "repo-1",
      "abc1234"
    );
    expect(mockCommitsService.getCommit).toHaveBeenCalledWith({
      projectId: "project-1",
      repositoryId: "repo-1",
      commitId: "abc1234",
    });
    expect(mockDeployService.deployReferenceResource).toHaveBeenCalledWith(
      "project-1",
      {
        commitId: "abc1234",
        disableConfigurationEditor: false,
        disableKeepExecution: true,
        scenarioDefinitionId: "scn-1",
        executionGroupId: "group-1",
        incidentEnabled: true,
        referenceFactoryProductId: "fap-1",
        machineGroupId: "infra-1",
        qualityLevel: undefined,
        cleanIfPassed: false,
        stopServices: true,
        supportReconActivities: true,
        validationScopeEnabled: true,
      }
    );
    expect(mockToast.showSuccess).toHaveBeenCalled();
  });

  it("when the user inputs an invalid commitOrTag, should show an error and not deploy", async () => {
    mockCommitsService.getCommit.mockReturnValue(
      throwError(() => new Error("Commit not found"))
    );
    await renderComponent({ visible: true });

    setCommitOrTag("abc1234");
    setScenarioDefinition("scn-1");
    setFactoryProductId("fap-1");
    fireEvent.click(getDeployButton());

    expect(mockCommitsService.getCommit).toHaveBeenCalled();
    expect(mockDeployService.deployReferenceResource).not.toHaveBeenCalled();
    expect(mockToast.showError).toHaveBeenCalledWith(
      "Reference environment deployment failed due to invalid commit or tag"
    );
  });

  it("when user provides valid tag, the reference resource will be deployed using the tags resolved commit Id", async () => {
    const tag: Tag = { name: "release-1.0", commitId: "tag-commit" };
    mockTagService.getTag.mockReturnValue(of(tag));
    await renderComponent({ visible: true });

    setCommitOrTag("release-1.0");
    setScenarioDefinition("scn-1");
    setFactoryProductId("fap-1");
    fireEvent.click(getDeployButton());

    expect(mockTagService.getTag).toHaveBeenCalledWith(
      "project-1",
      "repo-1",
      "release-1.0"
    );
    expect(mockDeployService.deployReferenceResource).toHaveBeenCalledWith(
      "project-1",
      expect.objectContaining({ commitId: "tag-commit" })
    );
  });

  it("when launching a reference resource fails, then the user will see a toast error with generic message", async () => {
    mockDeployService.deployReferenceResource.mockReturnValue(
      throwError(() => new Error("TM specific error"))
    );
    await renderComponent({ visible: true });

    setCommitOrTag("abc1234");
    setScenarioDefinition("scn-1");
    setFactoryProductId("fap-1");
    fireEvent.click(getDeployButton());

    expect(mockToast.showError).toHaveBeenCalledWith(
      "Reference environment deployment failed"
    );
  });

  it("when user wants to deploy a reference resource the commit/tag should be prefilled", async () => {
    await renderComponent({
      visible: true,
      initialCommitOrTag: "release-9.9",
    });

    expect(screen.getByLabelText("Commit ID or Tag")).toHaveValue(
      "release-9.9"
    );
  });

  it("when user wants to deploy a reference resource the faP should be prefilled", async () => {
    await renderComponent({
      visible: true,
      initialFactoryProductId: "fap-prefilled",
    });

    expect(screen.getByLabelText("Factory product ID")).toHaveValue(
      "fap-prefilled"
    );
  });

  it("does nothing when deploy is triggered while disabled", async () => {
    await renderComponent({ visible: true });

    expect(getDeployButton()).toBeDisabled();
    fireEvent.click(getDeployButton());

    expect(mockTagService.getTag).not.toHaveBeenCalled();
    expect(mockCommitsService.getCommit).not.toHaveBeenCalled();
    expect(mockDeployService.deployReferenceResource).not.toHaveBeenCalled();
  });

  it("When a user changes the factory product ID, then a matomo tracking event is triggered containing the ID", async () => {
    await renderComponent({ visible: true });

    setFactoryProductId("fap-123");

    expect(mockAnalyticsTracker.trackEvent).toHaveBeenCalledWith(
      EventCategory.DROP_DOWN,
      EventAction.SELECT_FROM_DORP_DOWN,
      "Reference environment factory product ID changed to: fap-123"
    );
  });

  it("When a user deploys a reference environment, then a matomo tracking event is triggered containing the factory product ID", async () => {
    await renderComponent({ visible: true });

    setCommitOrTag("abc1234");
    setScenarioDefinition("scn-1");
    setFactoryProductId("fap-1");
    fireEvent.click(getDeployButton());

    expect(mockAnalyticsTracker.trackEvent).toHaveBeenCalledWith(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      "Reference Environment deployed with factory product ID: fap-1"
    );
  });
});
