import { Observable } from "rxjs";
import {
  DropdownOption,
  MxEvolveDropdownDataProvider,
  PageResponse,
} from "@mxflow/ui/mxevolve-dropdown";
import type {
  FinalProduct,
  FinalProductState,
} from "@mxevolve/domains/artifact/data-access";
import { FinalProductApiService } from "@mxevolve/domains/artifact/data-access";
import { FinalProductLabelMode } from "./final-product-label-mode";

/**
 * The subset of a commit's description used to label an option. Declared
 * locally so the provider stays independent of the SCM data-access models; the
 * component feeds it from `CommitsService.getCommitsInfo`.
 */
export interface CommitLabelInfo {
  readonly displayId: string;
  readonly message: string;
}

export interface FinalProductParams {
  projectId: string;
  branch: string | undefined;
  /** Restricts the list to final products at the given validation level(s) (e.g. `["CQG"]`). */
  validationLevelFilter?: string[];
  /** Restricts the list to final products in the given state(s) (e.g. `AVAILABLE`). */
  stateFilter?: FinalProductState[];
  /** Backend sort expression (e.g. `"createdOn,desc"`). */
  sort?: string;
  /**
   * Also include the final product at the root of the branch (i.e. the one
   * inherited from the parent branch) in addition to any new final products
   * created directly on the branch. Defaults to `true` to preserve the
   * existing behavior of consumers that don't set this explicitly.
   */
  fetchParent?: boolean;
  /**
   * The scoped branch's head commit id (legacy `headCommitId`). When an
   * option's `configurationCommitId` matches, its label is prefixed with
   * `"HEAD-"` (legacy `final-product-dropdown-state.service.ts`).
   */
  headCommitId?: string;
  /** How each option is labelled. Defaults to {@link FinalProductLabelMode.COMMIT_ID}. */
  labelMode?: FinalProductLabelMode;
}

export class FinalProductDataProvider
  implements MxEvolveDropdownDataProvider<FinalProduct, FinalProductParams>
{
  private static readonly COMMIT_ID_DISPLAY_LENGTH = 10;
  /** Legacy `commitMessageMaxLength` / `headCommitMessageMaxLength`. */
  private static readonly COMMIT_MESSAGE_MAX_LENGTH = 60;
  private static readonly HEAD_COMMIT_MESSAGE_MAX_LENGTH = 40;

  /** Latest head commit id seen via {@link fetchData}, used by {@link toDropdownOption}. */
  private headCommitId: string | undefined;
  /** Latest label mode seen via {@link fetchData}. */
  private labelMode: FinalProductLabelMode = FinalProductLabelMode.COMMIT_ID;

  constructor(private readonly service: FinalProductApiService) {}

  fetchData(
    params: FinalProductParams,
    pageIndex = 0,
    pageSize = 10,
    searchKey?: string
  ): Observable<PageResponse<FinalProduct>> {
    this.headCommitId = params.headCommitId;
    this.labelMode = params.labelMode ?? FinalProductLabelMode.COMMIT_ID;
    return this.service.getFinalProducts(params.projectId, {
      branchFilter: params.branch,
      ...(params.fetchParent !== undefined
        ? { fetchParent: params.fetchParent }
        : {}),
      ...(params.validationLevelFilter
        ? { validationLevelFilter: params.validationLevelFilter }
        : {}),
      ...(params.stateFilter ? { stateFilter: params.stateFilter } : {}),
      ...(params.sort ? { sort: params.sort } : {}),
      page: pageIndex,
      size: pageSize,
      searchKey: searchKey || undefined,
    });
  }

  /**
   * Builds the option label, transcribed from the legacy
   * `FinalProductDropdownStateService.getDropdownOptionLabel`: `HEAD-` prefix on
   * the branch head, the commit's `displayId` (falling back to a shortened
   * commit id while the commit description is still loading), the truncated
   * commit message, and the tag prefix in tag modes.
   */
  toDropdownOption(
    item: FinalProduct,
    commitsInfo?: ReadonlyMap<string, CommitLabelInfo>
  ): DropdownOption<FinalProduct> {
    return { label: this.buildLabel(item, commitsInfo), value: item };
  }

  private buildLabel(
    item: FinalProduct,
    commitsInfo?: ReadonlyMap<string, CommitLabelInfo>
  ): string {
    if (this.labelMode === FinalProductLabelMode.TAG) {
      return item.tag ?? "-";
    }

    const isHeadCommit =
      !!this.headCommitId && item.configurationCommitId === this.headCommitId;
    const commitInfo = commitsInfo?.get(item.configurationCommitId);
    const shortCommitId =
      commitInfo?.displayId ??
      item.configurationCommitId.substring(
        0,
        FinalProductDataProvider.COMMIT_ID_DISPLAY_LENGTH
      );
    const commitIdLabel =
      (isHeadCommit ? "HEAD-" : "") +
      shortCommitId +
      this.buildCommitMessageSuffix(commitInfo?.message, isHeadCommit);

    if (this.labelMode === FinalProductLabelMode.TAG_COMMIT_ID && item.tag) {
      return `${item.tag}-${commitIdLabel}`;
    }
    return commitIdLabel;
  }

  private buildCommitMessageSuffix(
    message: string | undefined,
    isHeadCommit: boolean
  ): string {
    if (!message) {
      return "";
    }
    const maxLength = isHeadCommit
      ? FinalProductDataProvider.HEAD_COMMIT_MESSAGE_MAX_LENGTH
      : FinalProductDataProvider.COMMIT_MESSAGE_MAX_LENGTH;
    return message.length > maxLength
      ? ` ${message.slice(0, maxLength)}...`
      : ` ${message}`;
  }

  getItemId(item: FinalProduct): string {
    return item.id;
  }
}
