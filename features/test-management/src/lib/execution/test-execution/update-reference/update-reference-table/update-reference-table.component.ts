import { Component, inject, Input, OnInit } from "@angular/core";
import { TableModule } from "primeng/table";

import { HeaderTitleModule } from "@mxflow/ui/header";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { Divider } from "primeng/divider";
import { Skeleton } from "primeng/skeleton";
import { UpdateReference, UpdateReferenceStatus } from "../update-reference";
import { UpdateReferenceService } from "../update-reference.service";
import { concatMap, forkJoin, map, of } from "rxjs";
import {
  BinaryImpactService,
  ConfigurationImpactService,
  DetectionCategory,
  DetectionType,
  DetectionUriBuilderPipe,
  ExternalIssueSummary,
  LiteBinaryImpact,
  LiteConfigurationImpact,
} from "@mxflow/features/failure-management";
import { UpdateReferenceStatusComponent } from "../status/update-reference-status.component";

export interface LinkedImpact {
  displayText: string;
  link: string;
}

export interface UpdateReferenceRow {
  path: string;
  commitMessage: string;
  commitId: string;
  linkedImpacts: LinkedImpact[];
  status: UpdateReferenceStatus;
}

@Component({
  selector: "mxevolve-update-reference-table",
  imports: [
    TableModule,
    HeaderTitleModule,
    Divider,
    Skeleton,
    TableEmptyMessageComponent,
    UpdateReferenceStatusComponent,
  ],
  providers: [UpdateReferenceService, DetectionUriBuilderPipe],
  templateUrl: "./update-reference-table.component.html",
})
export class UpdateReferenceTableComponent implements OnInit {
  private updateReferenceService = inject(UpdateReferenceService);
  private binaryImpactService = inject(BinaryImpactService);
  private configImpactService = inject(ConfigurationImpactService);
  private detectionUriBuilder = inject(DetectionUriBuilderPipe);

  protected readonly Array = Array;
  @Input({ required: true })
  testExecutionId: string;
  @Input({ required: true })
  projectId: string;
  updateReferences: UpdateReferenceRow[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.isLoading = true;
    this.updateReferenceService
      .fetch(this.projectId, this.testExecutionId)
      .pipe(
        concatMap((updateReferences) => {
          const { binaryImpactIds, configImpactIds } =
            this.getDistinctImpactIdsFromAllUpdateReferences(updateReferences);
          return forkJoin([
            of(updateReferences),
            this.fetchBinaryImpacts(binaryImpactIds),
            this.fetchConfigImpacts(configImpactIds),
          ]);
        })
      )
      .subscribe(([updateReferences, binaryImpacts, configImpacts]) => {
        this.updateReferences = this.constructUpdateReferencesWithLinkedImpacts(
          updateReferences,
          binaryImpacts,
          configImpacts
        );
      })
      .add(() => {
        this.isLoading = false;
      });
  }

  private constructUpdateReferencesWithLinkedImpacts(
    updateReferences: UpdateReference[],
    binaryImpacts: LiteBinaryImpact[],
    configImpacts: LiteConfigurationImpact[]
  ) {
    return updateReferences.map((updateReference) => {
      const linkedImpacts = [
        ...this.getUpgradeImpactFromLinkedBinaryImpacts(
          updateReference,
          binaryImpacts
        ),
        ...this.getLinkedConfigurationImpacts(updateReference, configImpacts),
      ];
      return {
        path: updateReference.path,
        commitMessage: updateReference.commitMessage,
        commitId: updateReference.commitId,
        status: updateReference.status,
        linkedImpacts: linkedImpacts,
      };
    });
  }

  private getUpgradeImpactFromLinkedBinaryImpacts(
    updateReference: UpdateReference,
    binaryImpacts: LiteBinaryImpact[]
  ) {
    return this.getDistinctUpgradeImpactExternalIssuesFromBinaryImpacts(
      updateReference,
      binaryImpacts
    ).map((upgradeImpactExternalIssue) => {
      return {
        displayText: upgradeImpactExternalIssue.id,
        link: upgradeImpactExternalIssue.link,
      };
    });
  }

  private getLinkedConfigurationImpacts(
    updateReference: UpdateReference,
    configImpacts: LiteConfigurationImpact[]
  ) {
    return Array.from(updateReference.linkedConfigurationImpactsIds)
      .map((id) => {
        const configurationImpactTitle = this.getConfigurationImpactTitle(
          configImpacts,
          id
        );
        return configurationImpactTitle
          ? {
              displayText: configurationImpactTitle,
              link: this.constructConfigurationImpactLink(id),
            }
          : undefined;
      })
      .filter((impact) => impact !== undefined);
  }

  private getConfigurationImpactTitle(
    configImpacts: LiteConfigurationImpact[],
    id: string
  ) {
    return configImpacts.filter((impact) => impact.id === id).pop()?.title;
  }

  private constructConfigurationImpactLink(id: string) {
    return this.detectionUriBuilder.transform({
      id: id,
      category: DetectionCategory.Impact,
      type: DetectionType.Configuration,
      projectId: this.projectId,
    });
  }

  private getDistinctUpgradeImpactExternalIssuesFromBinaryImpacts(
    updateReference: UpdateReference,
    binaryImpacts: LiteBinaryImpact[]
  ) {
    return this.getDistinctUpgradeImpactExternalIssues(
      this.getUpgradeImpactExternalIssues(updateReference, binaryImpacts)
    );
  }

  private getUpgradeImpactExternalIssues(
    updateReference: UpdateReference,
    binaryImpacts: LiteBinaryImpact[]
  ) {
    return Array.from(updateReference.linkedBinaryImpactsIds)
      .map((binaryImpactId) => {
        const upgradeImpact = binaryImpacts
          .filter((impact) => impact.id === binaryImpactId)
          .pop()?.upgradeImpact;
        return upgradeImpact ? upgradeImpact.externalIssue : undefined;
      })
      .filter((externalIssue) => externalIssue != undefined);
  }

  private fetchConfigImpacts(configImpactIds: Set<string>) {
    if (configImpactIds.size > 0) {
      return this.configImpactService.fetchByIds(
        this.projectId,
        Array.from(configImpactIds)
      );
    }
    return of([]);
  }

  private fetchBinaryImpacts(binaryImpactIds: Set<string>) {
    if (binaryImpactIds.size > 0) {
      return this.binaryImpactService
        .fetchByIds(this.projectId, Array.from(binaryImpactIds))
        .pipe(map((response) => response));
    }
    return of([]);
  }

  private getDistinctImpactIdsFromAllUpdateReferences(
    updateReferences: UpdateReference[]
  ) {
    const binaryImpactIds = new Set<string>();
    const configImpactIds = new Set<string>();
    for (const updateReference of updateReferences) {
      updateReference.linkedBinaryImpactsIds.forEach((id) => {
        binaryImpactIds.add(id);
      });
      updateReference.linkedConfigurationImpactsIds.forEach((id) => {
        configImpactIds.add(id);
      });
    }
    return { binaryImpactIds, configImpactIds };
  }

  private getDistinctUpgradeImpactExternalIssues(
    externalIssues: ExternalIssueSummary[]
  ) {
    const result = [...externalIssues];
    return result.filter(
      (externalIssue, index) =>
        index ===
        result.findIndex((otherIssue) => otherIssue.id === externalIssue.id)
    );
  }
}
