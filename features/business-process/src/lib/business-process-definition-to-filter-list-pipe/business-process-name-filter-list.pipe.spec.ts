import { BusinessProcessNameToFilterListPipe } from "@mxflow/features/business-process";
import {
  BusinessProcessDefinition,
  BusinessProcessFamily,
  BusinessProcessType,
} from "@mxflow/features/business-process";

describe("business process name to filter pipe test", () => {
  let pipe: BusinessProcessNameToFilterListPipe;

  beforeEach(() => {
    pipe = new BusinessProcessNameToFilterListPipe();
  });

  it("should transform list of definitions to filter list object filtered by familyId", () => {
    let definitions = [
      {
        family: {
          id: BusinessProcessType.BINARY_UPGRADE,
        } as BusinessProcessFamily,
        processName: "process 1",
      } as unknown as BusinessProcessDefinition,
      {
        family: {
          id: BusinessProcessType.BINARY_UPGRADE,
        } as BusinessProcessFamily,
        processName: "process 1",
      } as unknown as BusinessProcessDefinition,
      {
        family: {
          id: BusinessProcessType.CI_PROCESS,
        } as BusinessProcessFamily,
        processName: "process 2",
      } as unknown as BusinessProcessDefinition,
    ];
    let result = [{ text: "process 1", value: "process 1" }];

    let filterLists = pipe.transform(
      definitions,
      BusinessProcessType.BINARY_UPGRADE
    );
    expect(filterLists).toEqual(result);
  });
});
