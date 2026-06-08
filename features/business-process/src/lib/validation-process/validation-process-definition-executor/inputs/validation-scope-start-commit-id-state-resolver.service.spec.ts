import { TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { BehaviorSubject, firstValueFrom, of } from "rxjs";
import { v4 as uuidv4 } from "uuid";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ValidationScopeStartCommitIdStateResolverService } from "./validation-scope-start-commit-id-state-resolver.service";
import { ValidationScopeStartCommitIdParentBranchResolverService } from "./validation-scope-start-commit-id-parent-branch-resolver.service";

describe("ValidationScopeStartCommitIdStateResolverService", () => {
  const projectId = uuidv4();
  const parentBranch = uuidv4();
  const archivalBranchName = uuidv4();
  const repositoryId = uuidv4();

  let service: ValidationScopeStartCommitIdStateResolverService;
  let parentBranchResolver: jest.Mocked<ValidationScopeStartCommitIdParentBranchResolverService>;
  let featureFlagResolver: jest.Mocked<FeatureFlagResolver>;
  let controls: {
    official: FormControl;
    businessProcessQualityLevel: FormControl;
    createBranch: FormControl;
    parentBranch: FormControl;
    archivalBranchName: FormControl;
    repositoryId: FormControl;
  };

  beforeEach(() => {
    parentBranchResolver = {
      resolve: jest.fn().mockReturnValue(of(parentBranch)),
    } as unknown as jest.Mocked<ValidationScopeStartCommitIdParentBranchResolverService>;

    featureFlagResolver = {
      isFeatureEnabled: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<FeatureFlagResolver>;

    controls = {
      official: new FormControl(true),
      businessProcessQualityLevel: new FormControl("MQG"),
      createBranch: new FormControl(false),
      parentBranch: new FormControl(null),
      archivalBranchName: new FormControl(archivalBranchName),
      repositoryId: new FormControl(repositoryId),
    };

    TestBed.configureTestingModule({
      providers: [
        ValidationScopeStartCommitIdStateResolverService,
        {
          provide: ValidationScopeStartCommitIdParentBranchResolverService,
          useValue: parentBranchResolver,
        },
        {
          provide: FeatureFlagResolver,
          useValue: featureFlagResolver,
        },
      ],
    });

    service = TestBed.inject(ValidationScopeStartCommitIdStateResolverService);
  });

  it("when resolving, then it should return the resolved parent branch", async () => {
    const state = await firstValueFrom(service.resolve(controls, projectId));

    expect(state.resolvedParentBranch).toEqual(parentBranch);
  });

  describe("visibility", () => {
    it("given the feature flag is disabled, then visible should be false", async () => {
      featureFlagResolver.isFeatureEnabled.mockResolvedValue(false);

      const state = await firstValueFrom(service.resolve(controls, projectId));

      expect(state.visible).toBe(false);
    });

    it("given official is not true, then visible should be false", async () => {
      controls.official.setValue(false);

      const state = await firstValueFrom(service.resolve(controls, projectId));

      expect(state.visible).toBe(false);
    });

    it("given quality level is not MQG, then visible should be false", async () => {
      controls.businessProcessQualityLevel.setValue("DQG");

      const state = await firstValueFrom(service.resolve(controls, projectId));

      expect(state.visible).toBe(false);
    });

    it("given resolved parent branch is null, then visible should be false", async () => {
      parentBranchResolver.resolve.mockReturnValue(of(null));

      const state = await firstValueFrom(service.resolve(controls, projectId));

      expect(state.visible).toBe(false);
    });

    it("given feature flag is enabled and officiality is true and quality level is MQG and create branch is false and archival branch name is provided, then visible should be true", async () => {
      controls.createBranch.setValue(false);
      controls.archivalBranchName.setValue(archivalBranchName);

      const state = await firstValueFrom(service.resolve(controls, projectId));

      expect(state.visible).toBe(true);
    });

    it("given feature flag is enabled and officiality is true and quality level is MQG and create branch is false and archival branch name is not provided, then visible should be false", async () => {
      controls.createBranch.setValue(false);
      controls.archivalBranchName.setValue(null);

      const state = await firstValueFrom(service.resolve(controls, projectId));

      expect(state.visible).toBe(false);
    });

    it("given feature flag is enabled and officiality is true and quality level is MQG and create branch is true and parent branch is provided, then visible should be true", async () => {
      controls.createBranch.setValue(true);
      controls.parentBranch.setValue(parentBranch);

      const state = await firstValueFrom(service.resolve(controls, projectId));

      expect(state.visible).toBe(true);
    });

    it("given feature flag is enabled and officiality is true and quality level is MQG and create branch is true and parent branch is not provided, then visible should be false", async () => {
      controls.createBranch.setValue(true);
      controls.parentBranch.setValue(null);

      const state = await firstValueFrom(service.resolve(controls, projectId));

      expect(state.visible).toBe(false);
    });
  });

  it("given the official flag changes, then it should re-evaluate the visibility", async () => {
    const states: boolean[] = [];

    const subscription = service
      .resolve(controls, projectId)
      .subscribe((state) => states.push(state.visible));

    await Promise.resolve();

    controls.official.setValue(false);

    expect(states).toHaveLength(2);
    expect(states[1]).toBe(false);

    subscription.unsubscribe();
  });

  it("given the quality level changes, then it should re-evaluate the visibility", async () => {
    const states: boolean[] = [];

    const subscription = service
      .resolve(controls, projectId)
      .subscribe((state) => states.push(state.visible));

    await Promise.resolve();

    controls.businessProcessQualityLevel.setValue("OTHER");

    expect(states).toHaveLength(2);
    expect(states[1]).toBe(false);

    subscription.unsubscribe();
  });

  it("given the parent branch changes, then it should reflect the updated resolved parent branch", async () => {
    const parentBranchSubject = new BehaviorSubject<string | null>(null);
    parentBranchResolver.resolve.mockReturnValue(parentBranchSubject);

    const states: (string | null)[] = [];

    const subscription = service
      .resolve(controls, projectId)
      .subscribe((state) => states.push(state.resolvedParentBranch));

    await Promise.resolve();
    parentBranchSubject.next(parentBranch);

    expect(states).toHaveLength(2);
    expect(states[1]).toEqual(parentBranch);

    subscription.unsubscribe();
  });
});
