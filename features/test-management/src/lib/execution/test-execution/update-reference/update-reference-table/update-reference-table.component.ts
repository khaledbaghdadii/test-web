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
  BinaryImpactIdLinksComponent,
  BinaryImpactService,
  ConfigurationImpactService,
  DetectionCategory,
  DetectionType,
  DetectionUriBuilderPipe,
  LiteBinaryImpact,
  LiteConfigurationImpact,
} from "@mxflow/features/failure-management";
import { UpdateReferenceStatusComponent } from "../status/update-reference-status.component";

export interface LinkedImpact {
  displayText: string;
  link: string;
}

export interface LinkedBinaryImpact {
  binaryImpactId: string;
  readableId: string;
}

export interface UpdateReferenceRow {
  path: string;
  commitMessage: string;
  commitId: string;
  linkedBinaryImpacts: LinkedBinaryImpact[];
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
    BinaryImpactIdLinksComponent,
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
      return {
        path: updateReference.path,
        commitMessage: updateReference.commitMessage,
        commitId: updateReference.commitId,
        status: updateReference.status,
        linkedBinaryImpacts: this.getLinkedBinaryImpacts(
          updateReference,
          binaryImpacts
        ),
        linkedImpacts: this.getLinkedConfigurationImpacts(
          updateReference,
          configImpacts
        ),
      };
    });
  }

  private getLinkedBinaryImpacts(
    updateReference: UpdateReference,
    binaryImpacts: LiteBinaryImpact[]
  ): LinkedBinaryImpact[] {
    return Array.from(updateReference.linkedBinaryImpactsIds)
      .map((binaryImpactId) =>
        binaryImpacts.filter((impact) => impact.id === binaryImpactId).pop()
      )
      .filter((impact) => impact !== undefined)
      .map((impact) => ({
        binaryImpactId: impact.id,
        readableId: impact.objectId,
      }));
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
}
