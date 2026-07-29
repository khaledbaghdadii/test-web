import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { ReactiveFormsModule } from "@angular/forms";
import { Type } from "@angular/core";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, throwError } from "rxjs";
import { InputText } from "primeng/inputtext";
import { Button } from "primeng/button";
import {
  BackportProcessExecutorService,
  BusinessProcessDefinition,
} from "@mxevolve/domains/business-process/data-access";
import {
  BackportPrefilledInputsComponent,
  NotificationsRecipientsInputComponent,
  UserStoryInputComponent,
} from "@mxevolve/domains/business-process/widget";
import { ReviewersAutoCompleteComponent } from "@mxevolve/domains/scm/widget";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  MergeConfigurationService,
  RepositoryService,
} from "@mxevolve/domains/scm/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import { BackportExecutorComponent } from "./backport-executor.component";

function simulateCvaChange<T>(component: Type<unknown>, value: T): void {
  const instance = ngMocks.find(component).componentInstance as unknown as {
    __simulateChange?: (value: T) => void;
  };
  if (!instance.__simulateChange) {
    throw new Error("Mocked component is not a ControlValueAccessor");
  }
  instance.__simulateChange(value);
}

const COMPONENT_IMPORTS = [
  ReactiveFormsModule,
  InputText,
  Button,
  MockComponent(BackportPrefilledInputsComponent),
  MockComponent(UserStoryInputComponent),
  MockComponent(NotificationsRecipientsInputComponent),
  MockComponent(ReviewersAutoCompleteComponent),
  DefinitionInputComponent,
];

const mockExecutorService = {
  executeBackportProcessDefinition: jest.fn(),
};

const mockRepositoryService = { getRepository: jest.fn() };
const mockMergeConfigurationService = {
  getFilteredMergeConfigurations: jest.fn(),
};
const mockInfraGroupService = { getGroup: jest.fn() };

/** Services the executor resolves its three pre-filled ids against (W1 / D3). */
const PREFILL_PROVIDERS = [
  { provide: RepositoryService, useValue: mockRepositoryService },
  { provide: MergeConfigurationService, useValue: mockMergeConfigurationService },
  { provide: InfraGroupService, useValue: mockInfraGroupService },
];

function stubPrefillsResolve(): void {
  mockRepositoryService.getRepository.mockReturnValue(of({ id: "repo-1" }));
  mockInfraGroupService.getGroup.mockReturnValue(of({ id: "group-1" }));
  mockMergeConfigurationService.getFilteredMergeConfigurations.mockReturnValue(
    of({ content: [{ id: "merge-1" }] })
  );
}

const mockToastService = {
  showError: jest.fn(),
};

const PREFILLED_INPUTS = [
  { inputId: "repositoryId", value: "repo-1" },
  { inputId: "mergeConfigurationId", value: "merge-1" },
  { inputId: "buildAndTestInfraGroup", value: "test-group-1" },
];

function definition(
  providedInputs: { inputId: string; value: unknown }[] = PREFILLED_INPUTS
): BusinessProcessDefinition {
  return {
    id: "def-1",
    name: "Backport - 000001",
    description: "On Demand Backport",
    sourceDefinitionId: "on-demand-backport",
    providedInputs,
    family: { id: "user-story-build-and-test", name: "Build & Test" },
  };
}

async function renderComponent(
  providedInputs: { inputId: string; value: unknown }[] = PREFILLED_INPUTS
) {
  mockExecutorService.executeBackportProcessDefinition.mockReturnValue(
    of({ id: "exec-1" })
  );

  return render(BackportExecutorComponent, {
    inputs: { projectId: "project-1", definition: definition(providedInputs) },
    componentImports: COMPONENT_IMPORTS,
    componentProviders: [
      ...PREFILL_PROVIDERS,
      {
        provide: BackportProcessExecutorService,
        useValue: mockExecutorService,
      },
    ],
    providers: [
      ...PREFILL_PROVIDERS,
      {
        provide: BackportProcessExecutorService,
        useValue: mockExecutorService,
      },
      { provide: ToastMessageService, useValue: mockToastService },
    ],
  });
}

function buildButton(): HTMLElement {
  return screen.getByRole("button", { name: "Build" });
}

function setReviewers(names: string[]): void {
  const reviewers = ngMocks.find(ReviewersAutoCompleteComponent);
  const control = ngMocks.input(reviewers, "reviewersFormControl");
  control.setValue(names.map((name) => ({ name, displayName: name })));
}

describe("BackportExecutorComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stubPrefillsResolve();
  });

  describe("field presence", () => {
    it("shows every backport field", async () => {
      await renderComponent();

      expect(screen.getByLabelText("Execution Name")).toBeTruthy();
      expect(screen.getByLabelText("Pull Request Id")).toBeTruthy();
      expect(screen.getByText("User Stories")).toBeTruthy();
      expect(ngMocks.find(UserStoryInputComponent).componentInstance).toBeTruthy();
      expect(screen.getByLabelText("Merge Request Title")).toBeTruthy();
      expect(ngMocks.find(ReviewersAutoCompleteComponent).componentInstance).toBeTruthy();
      expect(screen.getByText("Notifications")).toBeTruthy();
      expect(
        ngMocks.find(NotificationsRecipientsInputComponent).componentInstance
      ).toBeTruthy();
      expect(buildButton()).toBeTruthy();
    });

    it("scopes the reviewers autocomplete to the project and prefilled repository", async () => {
      await renderComponent();

      const reviewers = ngMocks.find(ReviewersAutoCompleteComponent);
      expect(ngMocks.input(reviewers, "projectId")).toBe("project-1");
      expect(ngMocks.input(reviewers, "repositoryId")).toBe("repo-1");
    });

    it("renders the prefilled inputs read-only on the details panel", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Backport - 000001 Details" })
      );

      const prefilled = ngMocks.find(BackportPrefilledInputsComponent);
      expect(ngMocks.input(prefilled, "providedInputs")).toEqual(
        PREFILLED_INPUTS
      );
    });

    it("wires the user-story input to the project without forced validation", async () => {
      await renderComponent();

      const userStory = ngMocks.find(UserStoryInputComponent);
      expect(ngMocks.input(userStory, "shouldValidate")).toBe(false);
      expect(ngMocks.input(userStory, "projectId")).toBe("project-1");
    });
  });

  describe("required-field markers", () => {
    it("renders the mandatory-field legend", async () => {
      await renderComponent();

      expect(screen.getByText("* Mandatory Field")).toBeTruthy();
    });

    it("marks required fields with an asterisk and leaves optional fields unmarked", async () => {
      await renderComponent();

      for (const label of [
        "Execution Name",
        "Pull Request Id",
        "User Stories",
        "Merge Request Title",
        "Reviewers",
      ]) {
        expect(screen.getByText(label).classList.contains("required")).toBe(
          true
        );
      }

      expect(
        screen
          .getByText("Expiry Date Notification Recipients")
          .classList.contains("required")
      ).toBe(false);
    });
  });

  describe("submit", () => {
    it("submits the exact legacy payload and emits created on success", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const created = jest.fn();
      fixture.componentInstance.created.subscribe(created);

      await user.type(screen.getByLabelText("Execution Name"), "My backport");
      await user.type(screen.getByLabelText("Pull Request Id"), "4402");
      await user.type(
        screen.getByLabelText("Merge Request Title"),
        "My MR title"
      );
      simulateCvaChange(UserStoryInputComponent, ["VAL-1"]);
      setReviewers(["reviewer-a"]);

      await user.click(buildButton());

      expect(
        mockExecutorService.executeBackportProcessDefinition
      ).toHaveBeenCalledWith("project-1", {
        name: "My backport",
        definitionId: "def-1",
        repositoryId: "repo-1",
        destinationMergeConfigurationId: "merge-1",
        pullRequestToBeBackported: "4402",
        pullRequestTitle: "My MR title",
        pullRequestReviewers: ["reviewer-a"],
        userStoryIds: ["VAL-1"],
        buildAndTestInfraGroup: "test-group-1",
        notificationsRecipients: undefined,
      });
      expect(created).toHaveBeenCalledWith("exec-1");
    });

    it("keeps the build button disabled until every required field is filled", async () => {
      const user = userEvent.setup();
      await renderComponent();

      expect(buildButton()).toBeDisabled();

      await user.type(screen.getByLabelText("Execution Name"), "My backport");
      await user.type(screen.getByLabelText("Pull Request Id"), "4402");
      await user.type(
        screen.getByLabelText("Merge Request Title"),
        "My MR title"
      );
      simulateCvaChange(UserStoryInputComponent, ["VAL-1"]);
      setReviewers(["reviewer-a"]);

      await waitFor(() => expect(buildButton()).toBeEnabled());
    });

    it("shows an error toast and does not emit created when the execute call fails", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const created = jest.fn();
      fixture.componentInstance.created.subscribe(created);
      mockExecutorService.executeBackportProcessDefinition.mockReturnValue(
        throwError(() => new Error("boom"))
      );

      await user.type(screen.getByLabelText("Execution Name"), "My backport");
      await user.type(screen.getByLabelText("Pull Request Id"), "4402");
      await user.type(
        screen.getByLabelText("Merge Request Title"),
        "My MR title"
      );
      simulateCvaChange(UserStoryInputComponent, ["VAL-1"]);
      setReviewers(["reviewer-a"]);
      await user.click(buildButton());

      await waitFor(() =>
        expect(mockToastService.showError).toHaveBeenCalledWith("boom")
      );
      expect(created).not.toHaveBeenCalled();
    });
  });
});
