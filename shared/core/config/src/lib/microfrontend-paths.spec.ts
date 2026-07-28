import {
  BINARY_UPGRADE_MFE_PATH,
  BUILD_AND_TEST_PROCESS_PATH,
} from "./microfrontend-paths";

describe("microfrontend paths", () => {
  it("exposes the binary upgrade micro-frontend path", () => {
    expect(BINARY_UPGRADE_MFE_PATH).toBe("upgrade-processes");
  });

  it("exposes the build-and-test process path", () => {
    expect(BUILD_AND_TEST_PROCESS_PATH).toBe("build-and-test-processes");
  });
});
