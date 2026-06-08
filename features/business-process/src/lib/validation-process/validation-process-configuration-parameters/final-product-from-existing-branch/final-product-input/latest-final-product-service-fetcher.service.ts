import { inject, Injectable } from "@angular/core";
import {
  CommitDetails,
  ScmManagementService,
  ScmService,
} from "@mxflow/features/scm";
import { FetchFinalProductRequest } from "./fetch-final-product-request";
import { firstValueFrom } from "rxjs";
import {
  FinalProduct,
  FinalProductService,
} from "@mxflow/features/artifact-manager";

export interface FinalProductResponse {
  optionalFinalProduct?: FinalProduct;
  failureReason?: LatestFinalProductFailureReason;
}

export enum LatestFinalProductFailureReason {
  INVALID_BRANCH_NAME,
  NO_FINAL_PRODUCT_FOUND,
  UNEXPECTED_FAILURE,
}

@Injectable({ providedIn: "root" })
export class LatestFinalProductServiceFetcher {
  scmService: ScmService = inject(ScmService);
  scmManagementService: ScmManagementService = inject(ScmManagementService);
  finalProductService: FinalProductService = inject(FinalProductService);

  async getLatestFinalProductOnBranch(
    request: FetchFinalProductRequest
  ): Promise<FinalProductResponse> {
    let optionalFinalProduct: FinalProduct | undefined;

    try {
      const developments = await firstValueFrom(
        this.scmManagementService.getDevelopments(request.projectId, {
          name: request.branchName,
          repositoryId: request.repositoryId,
        })
      );

      if (developments.content.length === 0) {
        return {
          failureReason: LatestFinalProductFailureReason.INVALID_BRANCH_NAME,
        };
      }

      const development = developments.content[0];

      if (!development.source) {
        return {
          failureReason: LatestFinalProductFailureReason.INVALID_BRANCH_NAME,
        };
      }

      const commitDifferences: CommitDetails[] = await firstValueFrom(
        this.scmService.getCommitDifferences({
          projectId: request.projectId,
          repositoryId: request.repositoryId,
          sourceBranch: development.name,
          destinationBranch: development.source,
        })
      );

      for (const commit of commitDifferences) {
        const finalProducts = await this.getFinalProductGivenACommit(
          request.projectId,
          commit.id,
          request.branchName
        );

        if (finalProducts.content.length > 0) {
          optionalFinalProduct = finalProducts.content[0];
          break;
        }
      }

      if (optionalFinalProduct) {
        return {
          optionalFinalProduct: optionalFinalProduct,
        };
      }

      const finalProducts = await this.getFinalProductGivenACommit(
        request.projectId,
        development.parentCommitId
      );

      if (finalProducts.content) {
        optionalFinalProduct = finalProducts.content[0];
      }
    } catch {
      return {
        failureReason: LatestFinalProductFailureReason.UNEXPECTED_FAILURE,
      };
    }

    return {
      optionalFinalProduct: optionalFinalProduct,
      failureReason: optionalFinalProduct
        ? undefined
        : LatestFinalProductFailureReason.NO_FINAL_PRODUCT_FOUND,
    };
  }

  private async getFinalProductGivenACommit(
    projectId: string,
    commit: string,
    branchName?: string
  ) {
    return await firstValueFrom(
      this.finalProductService.getFinalProducts(
        {
          branchFilter: branchName,
          configurationCommitIdFilter: commit,
          sort: "createdOn,desc",
        },
        projectId
      )
    );
  }
}
