import { render } from "@testing-library/angular";
import { MockComponent } from "ng-mocks";
import { of, throwError } from "rxjs";
import {
  BuildAndTestUserInputService,
  BusinessProcessDefinitionService,
} from "@mxevolve/domains/business-process/data-access";
import { DeleteDevelopmentCheckboxComponent } from "@mxevolve/domains/business-process/widget";
import {
  MergeConfigurationService,
  RepositoryService,
} from "@mxevolve/domains/scm/data-access";
import {
  MergeConfigurationDropdownComponent,
  ReviewersAutoCompleteComponent,
} from "@mxevolve/domains/scm/widget";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { BuildAndTestSendForReviewComponent } from "./build-and-test-send-for-review.component";

describe("BuildAndTestSendForReviewComponent", () => {
  const userInputService = {
    sendChangesForReview: jest.fn(),
    proceedWithPredefinedInputs: jest.fn(),
  };
  const definitionService = {
    getBusinessProcessDefinitions: jest.fn(),
  };
  const mergeConfigurationService = {
    getFilteredMergeConfigurations: jest.fn(),
  };
  const repositoryService = {
    getRepository: jest.fn(),
  };
  const toastMessageService = {
    showError: jest.fn(),
    showSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    userInputService.sendChangesForReview.mockReturnValue(of(undefined));
    userInputService.proceedWithPredefinedInputs.mockReturnValue(of(undefined));
    repositoryService.getRepository.mockReturnValue(
      of({
        id: "repository-1",
        name: "Repo One",
        url: "https://git.example/repo-one.git",
        defaultBranch: "master",
      })
    );
    definitionService.getBusinessProcessDefinitions.mockReturnValue(
      of([
        {
          id: "definition-1",
          name: "On-demand backport",
          sourceDefinitionId: "on-demand-backport",
          providedInputs: [
            { inputId: "repositoryId", value: "repository-2" },
            { inputId: "mergeConfigurationId", value: "merge-config-2" },
            { inputId: "buildAndTestInfraGroup", value: "infra-2" },
          ],
        },
      ])
    );
    mergeConfigurationService.getFilteredMergeConfigurations.mockReturnValue(
      of({
        content: [
          {
            id: "merge-config-1",
            branchName: "master",
            mergeConfigurationDefinition: { repositoryId: "repository-1" },
          },
        ],
      })
    );
  });

  it("submits v2 on-demand backport inputs", async () => {
    const { fixture } = await renderComponent({ ciVersion: 2 });
    const component = fixture.componentInstance;

    component.form.patchValue({
      mergeRequestTitle: "VAL-1 Fix issue",
      destinationBranch: mergeConfiguration("merge-config-1", "master"),
      reviewers: [{ name: "reviewer", displayName: "Reviewer" }],
      backport: true,
      backportDefinitions: [
        {
          id: "definition-1",
          name: "On-demand backport",
          providedInputs: [
            { inputId: "repositoryId", value: "repository-2" },
            { inputId: "mergeConfigurationId", value: "merge-config-2" },
            { inputId: "buildAndTestInfraGroup", value: "infra-2" },
          ],
        },
      ],
    });

    component.submit();

    expect(userInputService.sendChangesForReview).toHaveBeenCalledWith({
      projectId: "project-1",
      processId: "process-1",
      mergeConfigurationId: "merge-config-1",
      mergeJobTitle: "VAL-1 Fix issue",
      mergeJobReviewers: ["reviewer"],
      backportChanges: true,
      backportMergeConfigurationIds: undefined,
      backportInputs: [
        {
          definitionId: "definition-1",
          repositoryId: "repository-2",
          mergeConfigurationId: "merge-config-2",
          buildAndTestInfraGroupId: "infra-2",
        },
      ],
      shouldCleanDevelopment: true,
      developmentId: "development-1",
      supportsResourceManagement: true,
    });
  });

  it("submits v1 backport merge configuration ids", async () => {
    const { fixture } = await renderComponent({ ciVersion: 1 });
    const component = fixture.componentInstance;

    component.form.patchValue({
      mergeRequestTitle: "VAL-1 Fix issue",
      destinationBranch: mergeConfiguration("merge-config-1", "master"),
      reviewers: [],
      backport: true,
      backportMergeConfigurations: [
        mergeConfiguration("backport-config-1", "support/1"),
      ],
    });

    component.submit();

    expect(userInputService.sendChangesForReview).toHaveBeenCalledWith(
      expect.objectContaining({
        backportChanges: true,
        backportMergeConfigurationIds: ["backport-config-1"],
        backportInputs: undefined,
      })
    );
  });

  it("normalizes the SCM 'already up-to-date' conflict into a clean, non-technical message", async () => {
    userInputService.sendChangesForReview.mockReturnValue(
      throwError(() => new Error("Branch is already up to date"))
    );

    const { fixture } = await renderComponent({ ciVersion: 2 });
    const component = fixture.componentInstance;

    await fixture.whenStable();

    component.form.patchValue({
      mergeRequestTitle: "VAL-1 Fix issue",
      destinationBranch: mergeConfiguration("merge-config-1", "master"),
      reviewers: [],
      backport: false,
    });

    component.submit();
    fixture.detectChanges();

    const expectedMessage =
      'Branch "feature/temp-branch" is already up-to-date with branch "master" in repository "Repo One"';
    expect(component.submitError()).toBe(expectedMessage);
    expect(toastMessageService.showError).not.toHaveBeenCalled();
    expect(document.querySelector('p-message[severity="error"]')).toBeTruthy();
    expect(document.body.textContent).toContain(expectedMessage);
    expect(document.body.textContent).not.toContain("Error");
    expect(document.body.textContent).not.toContain("retryable");
  });

  it("shows unrelated submit errors unchanged inside the form instead of a toast", async () => {
    userInputService.sendChangesForReview.mockReturnValue(
      throwError(() => new Error("Reviewer is invalid"))
    );

    const { fixture } = await renderComponent({ ciVersion: 2 });
    const component = fixture.componentInstance;

    component.form.patchValue({
      mergeRequestTitle: "VAL-1 Fix issue",
      destinationBranch: mergeConfiguration("merge-config-1", "master"),
      reviewers: [],
      backport: false,
    });

    component.submit();
    fixture.detectChanges();

    expect(component.submitError()).toBe("Reviewer is invalid");
    expect(toastMessageService.showError).not.toHaveBeenCalled();
    expect(document.querySelector('p-message[severity="error"]')).toBeTruthy();
    expect(document.body.textContent).toContain("Reviewer is invalid");
  });

  it("clears a previous submit error when a new submission starts", async () => {
    const { fixture } = await renderComponent({ ciVersion: 2 });
    const component = fixture.componentInstance;
    component.submitError.set("Previous error");

    component.form.patchValue({
      mergeRequestTitle: "VAL-1 Fix issue",
      destinationBranch: mergeConfiguration("merge-config-1", "master"),
      reviewers: [],
      backport: false,
    });

    component.submit();

    expect(component.submitError()).toBeNull();
  });

  it("preserves prefilled form values when the dialog is dismissed", async () => {
    const { fixture } = await renderComponent({ ciVersion: 2 });
    const component = fixture.componentInstance;
    const destinationBranch = mergeConfiguration("merge-config-1", "master");
    const reviewers = [{ name: "reviewer", displayName: "Reviewer" }];
    const deleteBranch = {
      shouldDelete: false,
      developmentId: "development-1",
    };

    component.form.patchValue({
      mergeRequestTitle: "VAL-1 Fix issue",
      destinationBranch,
      reviewers,
      backport: false,
      deleteBranch,
    });
    component.submitError.set("Previous error");

    component.cancel();

    expect(component.visible()).toBe(false);
    expect(component.submitError()).toBeNull();
    expect(component.form.controls.mergeRequestTitle.value).toBe(
      "VAL-1 Fix issue"
    );
    expect(component.form.controls.destinationBranch.value).toEqual(
      destinationBranch
    );
    expect(component.form.controls.reviewers.value).toEqual(reviewers);
    expect(component.form.controls.backport.value).toBe(false);
    expect(component.form.controls.deleteBranch.value).toEqual(deleteBranch);
  });

  it("fetches backport definitions only once when none match the backport source", async () => {
    definitionService.getBusinessProcessDefinitions.mockReturnValue(
      of([
        {
          id: "definition-other",
          name: "CI Process",
          sourceDefinitionId: "configuration-build-and-test",
          providedInputs: [],
        },
      ])
    );

    const { fixture } = await renderComponent({ ciVersion: 2 });
    const component = fixture.componentInstance;

    expect(component.backportDefinitions()).toEqual([]);
    expect(
      definitionService.getBusinessProcessDefinitions
    ).toHaveBeenCalledTimes(1);
  });

  it("uses proceed-with-predefined-inputs for predefined merge request inputs", async () => {
    const { fixture } = await renderComponent({
      hasPredefinedMergeRequestInputs: true,
    });
    const component = fixture.componentInstance;

    component.form.controls.deleteBranch.setValue({
      shouldDelete: false,
      developmentId: "development-1",
    });
    component.submit();

    expect(userInputService.proceedWithPredefinedInputs).toHaveBeenCalledWith({
      projectId: "project-1",
      processId: "process-1",
      shouldCleanDevelopment: false,
      developmentId: "development-1",
      supportsResourceManagement: true,
    });
    expect(userInputService.sendChangesForReview).not.toHaveBeenCalled();
  });

  function renderComponent(
    overrides: Partial<{
      ciVersion: number;
      hasPredefinedMergeRequestInputs: boolean;
    }> = {}
  ) {
    return render(BuildAndTestSendForReviewComponent, {
      inputs: {
        projectId: "project-1",
        processId: "process-1",
        repositoryId: "repository-1",
        developmentId: "development-1",
        sourceBranchName: "feature/temp-branch",
        parentBranchName: "master",
        supportsResourceManagement: true,
        hasPredefinedMergeRequestInputs:
          overrides.hasPredefinedMergeRequestInputs ?? false,
        ciVersion: overrides.ciVersion ?? 2,
        visible: true,
      },
      componentImports: [
        MockComponent(DeleteDevelopmentCheckboxComponent),
        MockComponent(MergeConfigurationDropdownComponent),
        MockComponent(MxevolveIconComponent),
        MockComponent(ReviewersAutoCompleteComponent),
      ],
      componentProviders: [
        { provide: BuildAndTestUserInputService, useValue: userInputService },
        {
          provide: BusinessProcessDefinitionService,
          useValue: definitionService,
        },
        {
          provide: MergeConfigurationService,
          useValue: mergeConfigurationService,
        },
        { provide: RepositoryService, useValue: repositoryService },
        { provide: ToastMessageService, useValue: toastMessageService },
      ],
    });
  }

  function mergeConfiguration(id: string, branchName: string) {
    return {
      id,
      projectId: "project-1",
      branchName,
      mergeConfigurationDefinition: {
        id: "definition",
        repositoryId: "repository-1",
        branchPattern: ".*",
      },
    };
  }
});
