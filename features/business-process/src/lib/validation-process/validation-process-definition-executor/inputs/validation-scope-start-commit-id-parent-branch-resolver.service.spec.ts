import { TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { ScmManagementService } from "@mxflow/features/scm";
import { of } from "rxjs";
import { v4 as uuidv4 } from "uuid";
import { ValidationScopeStartCommitIdParentBranchResolverService } from "./validation-scope-start-commit-id-parent-branch-resolver.service";

describe("ValidationScopeStartCommitIdParentBranchResolverService", () => {
  const projectId = uuidv4();
  const parentBranch = uuidv4();
  const archivalBranchName = uuidv4();
  const repositoryId = uuidv4();
  const resolvedSource = uuidv4();

  let service: ValidationScopeStartCommitIdParentBranchResolverService;
  let scmManagementService: ScmManagementService;

  beforeEach(() => {
    scmManagementService = {
      getDevelopments: jest.fn(() =>
        of({ content: [{ source: resolvedSource }] })
      ),
    } as unknown as ScmManagementService;

    TestBed.configureTestingModule({
      providers: [
        ValidationScopeStartCommitIdParentBranchResolverService,
        { provide: ScmManagementService, useValue: scmManagementService },
      ],
    });

    service = TestBed.inject(
      ValidationScopeStartCommitIdParentBranchResolverService
    );
  });

  function makeControls(
    createBranch: boolean | null,
    parentBranchValue: string | null,
    archivalBranchNameValue: string | null,
    repositoryIdValue: string | null
  ) {
    return {
      createBranch: new FormControl(createBranch),
      parentBranch: new FormControl(parentBranchValue),
      archivalBranchName: new FormControl(archivalBranchNameValue),
      repositoryId: new FormControl(repositoryIdValue),
    };
  }

  it("given create branch is true and parent branch is set, when resolving, then it should return the parent branch value", () => {
    const controls = makeControls(true, parentBranch, null, null);
    let result: string | null | undefined;

    service.resolve(controls, projectId).subscribe((v) => (result = v));

    expect(result).toBe(parentBranch);
    expect(scmManagementService.getDevelopments).not.toHaveBeenCalled();
  });

  it("given create branch is false and archival branch name and repository id are set, when resolving, then it should fetch and extract the parent branch of the archival branch", () => {
    const controls = makeControls(
      false,
      null,
      archivalBranchName,
      repositoryId
    );
    let result: string | null | undefined;

    service.resolve(controls, projectId).subscribe((v) => (result = v));

    expect(scmManagementService.getDevelopments).toHaveBeenCalledWith(
      projectId,
      { repositoryId, name: archivalBranchName }
    );
    expect(result).toBe(resolvedSource);
  });

  it("given create branch changes from false to true, when the control value changes, then it should switch to returning the parent branch", () => {
    const controls = makeControls(
      false,
      parentBranch,
      archivalBranchName,
      repositoryId
    );
    const results: (string | null)[] = [];

    service.resolve(controls, projectId).subscribe((v) => results.push(v));

    controls.createBranch.setValue(true);

    expect(results[0]).toBe(resolvedSource);
    expect(results[1]).toBe(parentBranch);
  });

  it("given create branch is false and archival branch name changes, when the control value changes, then it should fetch the parent branch using the new archival branch name", () => {
    const newArchivalBranch = uuidv4();
    const controls = makeControls(
      false,
      null,
      archivalBranchName,
      repositoryId
    );
    const results: (string | null)[] = [];

    service.resolve(controls, projectId).subscribe((v) => results.push(v));

    controls.archivalBranchName.setValue(newArchivalBranch);

    expect(scmManagementService.getDevelopments).toHaveBeenCalledTimes(2);
    expect(
      (scmManagementService.getDevelopments as jest.Mock).mock.calls[1][1]
    ).toEqual({ repositoryId, name: newArchivalBranch });
  });
});
