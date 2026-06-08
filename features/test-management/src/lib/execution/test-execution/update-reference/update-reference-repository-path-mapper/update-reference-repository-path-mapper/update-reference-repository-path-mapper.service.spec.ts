import { UpdateReferenceRepositoryPathMapper } from "./update-reference-repository-path-mapper.service";

describe("Update reference repo path mapper test", () => {
  let service: UpdateReferenceRepositoryPathMapper;
  const testName = "testName";
  const testDirectoryPathSegments = [
    "some path",
    "batata",
    "path",
    "to",
    "testRunner",
  ];
  const testDirectoryForwardSlash = testDirectoryPathSegments.join("/");
  const testDirectoryBackwardSlash = testDirectoryPathSegments.join("\\");
  const request = {
    testDirectory: testDirectoryForwardSlash,
    testName,
  };
  beforeEach(() => {
    service = new UpdateReferenceRepositoryPathMapper();
  });

  it.each([
    [
      "forward slash",
      testDirectoryForwardSlash,
      `${testDirectoryForwardSlash}/${testName}/ref.csv`,
    ],
    [
      "backward slash",
      testDirectoryBackwardSlash,
      `${testDirectoryBackwardSlash}\\${testName}\\ref.csv`,
    ],
  ])(
    "should map applicative path with %s to repo path if the reference file is under a tpk",
    (description: string, testDirectory: string, pathOnApplicative: string) => {
      const pathOnRepo = service.map({
        ...request,
        pathOnApplicative,
        testDirectory,
      });
      expect(pathOnRepo).toBe(
        `common/mxtest/test_packages/${testName}/ref.csv`
      );
    }
  );

  it.each([
    [
      "forward slash",
      testDirectoryForwardSlash,
      `${testDirectoryForwardSlash}/reference_files/ref.csv`,
    ],
    [
      "backward slash",
      testDirectoryBackwardSlash,
      `${testDirectoryBackwardSlash}/reference_files/ref.csv`,
    ],
  ])(
    "should map applicative path with %s to repo path if the reference file is not under a tpk but under reference files",
    (description: string, testDirectory: string, pathOnApplicative: string) => {
      const pathOnRepo = service.map({
        ...request,
        pathOnApplicative,
        testDirectory,
      });
      expect(pathOnRepo).toBe(
        `common/mxtest/test_packages/TestPackagesData/reference_files/ref.csv`
      );
    }
  );

  it("should map applicative path to repo path if the reference file under reference_files_1 folder", () => {
    const pathOnApplicative = `${testDirectoryForwardSlash}/reference_files_1/ref.csv`;
    expect(
      service.map({
        ...request,
        pathOnApplicative,
        testDirectory: testDirectoryForwardSlash,
      })
    ).toBe(
      `common/mxtest/test_packages/TestPackagesData/reference_files_1/ref.csv`
    );
  });

  it("should map applicative path to repo path if the reference file under testName_1 folder", () => {
    const pathOnApplicative = `${testDirectoryForwardSlash}/${testName}_1/ref.csv`;
    expect(
      service.map({
        ...request,
        pathOnApplicative,
        testDirectory: testDirectoryForwardSlash,
      })
    ).toBe(
      `common/mxtest/test_packages/TestPackagesData/${testName}_1/ref.csv`
    );
  });

  it.each([
    [
      "forward slash",
      testDirectoryForwardSlash,
      `some/other/path/testRunner/ref.csv`,
    ],
    [
      "backward slash",
      testDirectoryBackwardSlash,
      `some\\other\\path\\testRunner\\ref.csv`,
    ],
  ])(
    "should throw an exception in case the provided path with %s on applicative does not contain the test directory",
    (description: string, testDirectory: string, pathOnApplicative: string) => {
      expect(() =>
        service.map({ ...request, pathOnApplicative, testDirectory })
      ).toThrow(
        new Error(
          `Unable to map the path '${pathOnApplicative}' to a path on repo`
        )
      );
    }
  );
});
