import { render } from "@testing-library/angular";
import { MockComponent } from "ng-mocks";
import { of } from "rxjs";
import {
  BuildAndTestUserInputService,
  BusinessProcessDefinitionService,
} from "@mxevolve/domains/business-process/data-access";
import { DeleteDevelopmentCheckboxComponent } from "@mxevolve/domains/business-process/widget";
import { MergeConfigurationService } from "@mxevolve/domains/scm/data-access";
import {
  MergeConfigurationDropdownComponent,
  ReviewersAutoCompleteComponent,
} from "@mxevolve/domains/scm/widget";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
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

  beforeEach(() => {
    jest.resetAllMocks();
    userInputService.sendChangesForReview.mockReturnValue(of(undefined));
    userInputService.proceedWithPredefinedInputs.mockReturnValue(of(undefined));
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
        { provide: BusinessProcessDefinitionService, useValue: definitionService },
        { provide: MergeConfigurationService, useValue: mergeConfigurationService },
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
