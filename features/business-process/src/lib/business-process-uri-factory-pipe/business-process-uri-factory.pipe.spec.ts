import { BusinessProcessUriFactoryPipe } from "@mxflow/features/business-process";
import {
  BINARY_UPGRADE_MFE_PATH,
  CI_PROCESS_MFE_PATH,
  MASTER_VALIDATION_MFE_PATH,
} from "@mxflow/config";

describe("BusinessProcessUriFactoryPipe", () => {
  let pipe: BusinessProcessUriFactoryPipe;
  beforeEach(() => {
    pipe = new BusinessProcessUriFactoryPipe();
  });

  it("should default to common execution uri in case no template id separator present in id", () => {
    const id = "7b3a80f1-32e2-4def-b3b6-19e875c849c2";
    const uri = pipe.transform(id);
    expect(uri).toEqual(`/execution/details/${id}`);
  });

  it("should default to common execution uri in case template id present in id is unknown", () => {
    const id = "k__7b3a80f1-32e2-4def-b3b6-19e875c849c2";
    const uri = pipe.transform(id);
    expect(uri).toEqual(`/execution/details/${id}`);
  });

  it("should construct binary upgrade uri in case binary-upgrade template id present in id", () => {
    const id = "binary-upgrade__7b3a80f1-32e2-4def-b3b6-19e875c849c2";
    const uri = pipe.transform(id);
    expect(uri).toEqual(`/${BINARY_UPGRADE_MFE_PATH}/execution/${id}`);
  });

  it("should construct user story build and test uri in case user story build and test template id present in id", () => {
    const id =
      "user-story-build-and-test__a1897e12-6b66-486d-a567-2ab034274de3";
    const uri = pipe.transform(id);
    expect(uri).toEqual(`/${CI_PROCESS_MFE_PATH}/execution/${id}`);
  });

  it("should construct master validation uri in case master-validation template id present in id", () => {
    const id = "master-validation__7b3a80f1-32e2-4def-b3b6-19e875c849c2";
    const uri = pipe.transform(id);
    expect(uri).toEqual(`/${MASTER_VALIDATION_MFE_PATH}/execution/${id}`);
  });
});
