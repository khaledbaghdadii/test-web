import {
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
} from "@mxflow/features/analysis-objects";
import { LiteBinaryRegression } from "./model/lite-binary-regression.model";

export class BinaryRegressionTestUtils {
  public static readonly BINARY_REGRESSION_ID = "binaryRegressionId";
  public static readonly BINARY_REGRESSION_OWNER = "owner";
  public static readonly BINARY_REGRESSION_FIX = "fix";
  public static readonly BINARY_REGRESSION_TITLE = "title";
  public static readonly PROJECT_ID = "projectId";
  public static readonly BINARY_REGRESSION_MX_VERSION = "mxVersion";
  public static readonly DEFECT_ID = "defectId";
  public static readonly DEFECT_LINK = "defectLink";

  public static getFullySelectedBinaryRegression(
    binaryRegression: LiteBinaryRegression
  ): AnalysisObjectSelectionState<LiteBinaryRegression> {
    return {
      analysisObject: binaryRegression,
      selectionType: AnalysisObjectSelectionType.FULL,
    };
  }

  public static getLiteBinaryRegression(): LiteBinaryRegression {
    return {
      id: this.BINARY_REGRESSION_ID,
      owner: this.BINARY_REGRESSION_OWNER,
      title: this.BINARY_REGRESSION_TITLE,
      fix: this.BINARY_REGRESSION_FIX,
      projectId: this.PROJECT_ID,
      mxVersion: this.BINARY_REGRESSION_MX_VERSION,
      defect: {
        id: this.DEFECT_ID,
        link: this.DEFECT_LINK,
      },
    };
  }
}
