import { Injectable } from "@angular/core";
import { UpdateReferencePathMapperRequest } from "./update-reference-path-mapper-request";

@Injectable({
  providedIn: "root",
})
export class UpdateReferenceRepositoryPathMapper {
  private readonly COMMON_MXTEST_TEST_PACKAGES_PATH =
    "common/mxtest/test_packages";

  private convertToForwardSlashes(path: string) {
    return path.replaceAll("\\", "/");
  }

  map(request: UpdateReferencePathMapperRequest): string {
    const testDirectoryWithForwardSlashes = this.convertToForwardSlashes(
      request.testDirectory
    );
    const pathOnApplicativeWithForwardSlashes = this.convertToForwardSlashes(
      request.pathOnApplicative
    );
    const pathOnApplicativePathParts =
      pathOnApplicativeWithForwardSlashes.split(
        testDirectoryWithForwardSlashes
      );
    if (pathOnApplicativePathParts.length === 2) {
      const referenceSubDirectory = pathOnApplicativePathParts[1];
      if (referenceSubDirectory.startsWith(`/${request.testName}/`)) {
        return `${this.COMMON_MXTEST_TEST_PACKAGES_PATH}${referenceSubDirectory}`;
      } else {
        return `${this.COMMON_MXTEST_TEST_PACKAGES_PATH}/TestPackagesData${referenceSubDirectory}`;
      }
    }
    throw new Error(
      `Unable to map the path '${request.pathOnApplicative}' to a path on repo`
    );
  }
}
