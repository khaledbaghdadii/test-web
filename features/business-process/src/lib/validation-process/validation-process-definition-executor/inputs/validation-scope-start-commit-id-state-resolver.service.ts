import { inject, Injectable } from "@angular/core";
import { FormControl } from "@angular/forms";
import { combineLatest, from, merge, Observable, startWith } from "rxjs";
import { map } from "rxjs/operators";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ValidationScopeStartCommitIdParentBranchResolverService } from "./validation-scope-start-commit-id-parent-branch-resolver.service";

export interface ValidationScopeStartCommitIdVisibilityControls {
  official: FormControl;
  businessProcessQualityLevel: FormControl;
  createBranch: FormControl;
  parentBranch: FormControl;
  archivalBranchName: FormControl;
  repositoryId: FormControl;
}

export interface ValidationScopeStartCommitIdVisibilityState {
  visible: boolean;
  resolvedParentBranch: string | null;
}

@Injectable()
export class ValidationScopeStartCommitIdStateResolverService {
  private readonly JIRA_USER_STORY_ARCHIVAL_FEATURE_FLAG_NAME =
    "jira-user-story-archival";
  private readonly featureFlagResolver = inject(FeatureFlagResolver);
  private readonly parentBranchResolver = inject(
    ValidationScopeStartCommitIdParentBranchResolverService
  );

  resolve(
    controls: ValidationScopeStartCommitIdVisibilityControls,
    projectId: string
  ): Observable<ValidationScopeStartCommitIdVisibilityState> {
    return combineLatest([
      from(
        this.featureFlagResolver.isFeatureEnabled(
          projectId,
          this.JIRA_USER_STORY_ARCHIVAL_FEATURE_FLAG_NAME
        )
      ),
      this.parentBranchResolver.resolve(
        {
          createBranch: controls.createBranch,
          parentBranch: controls.parentBranch,
          archivalBranchName: controls.archivalBranchName,
          repositoryId: controls.repositoryId,
        },
        projectId
      ),
      merge(
        controls.official.valueChanges,
        controls.businessProcessQualityLevel.valueChanges
      ).pipe(startWith(null)),
    ]).pipe(
      map(([featureFlagEnabled, resolvedParentBranch]) => ({
        visible: this.isVisible(
          featureFlagEnabled,
          resolvedParentBranch,
          controls
        ),
        resolvedParentBranch,
      }))
    );
  }

  private isVisible(
    featureFlagEnabled: boolean,
    resolvedParentBranch: string | null,
    controls: ValidationScopeStartCommitIdVisibilityControls
  ): boolean {
    if (!featureFlagEnabled) return false;
    if (controls.official.value !== true) return false;
    if (controls.businessProcessQualityLevel.value !== "MQG") return false;
    if (resolvedParentBranch === null) return false;
    if (controls.createBranch.value === true) {
      return !!controls.parentBranch.value;
    }
    return !!controls.archivalBranchName.value;
  }
}
