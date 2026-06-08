import { BusinessProcessDefinitionToFilterListPipe } from "./business-process-definition-to-filter-list.pipe";
import {
  BusinessProcessDefinition,
  BusinessProcessFamily,
  BusinessProcessType,
} from "@mxflow/features/business-process";

const NAME_1 = "definition1";
const NAME_2 = "definition2";
const DEFINITION_ID_1 = "definition id 1";
const DEFINITION_ID_2 = "definition id 2";
describe("Business process definition to filter list pipe test", () => {
  let pipe: BusinessProcessDefinitionToFilterListPipe;
  beforeEach(() => {
    pipe = new BusinessProcessDefinitionToFilterListPipe();
  });

  it("should return an empty list in cases the list passed is null", () => {
    let filterList = pipe.transform(null, BusinessProcessType.CI_PROCESS);
    expect(filterList).toEqual([]);
  });

  it("should return a list having definition name as text and definition id as value", function () {
    const filterList = pipe.transform(
      [
        {
          name: NAME_1,
          id: DEFINITION_ID_1,
          family: {
            id: BusinessProcessType.MASTER_VALIDATION,
          } as BusinessProcessFamily,
          executable: true,
        } as BusinessProcessDefinition,
        {
          name: NAME_2,
          id: DEFINITION_ID_2,
          family: {
            id: BusinessProcessType.MASTER_VALIDATION,
          } as BusinessProcessFamily,
          executable: true,
        } as BusinessProcessDefinition,
      ],
      BusinessProcessType.MASTER_VALIDATION
    );
    expect(filterList).toEqual([
      { text: NAME_1, value: DEFINITION_ID_1 },
      { text: NAME_2, value: DEFINITION_ID_2 },
    ]);
  });

  it("should return a list having only MV definitions", function () {
    const filterList = pipe.transform(
      [
        {
          name: NAME_1,
          id: DEFINITION_ID_1,
          family: {
            id: BusinessProcessType.BINARY_UPGRADE,
          } as BusinessProcessFamily,
          executable: true,
        } as BusinessProcessDefinition,
        {
          name: NAME_2,
          id: DEFINITION_ID_2,
          family: {
            id: BusinessProcessType.MASTER_VALIDATION,
          } as BusinessProcessFamily,
          executable: true,
        } as BusinessProcessDefinition,
      ],
      BusinessProcessType.MASTER_VALIDATION
    );
    expect(filterList).toEqual([{ text: NAME_2, value: DEFINITION_ID_2 }]);
  });

  it("should return only executable definitions", function () {
    const filterList = pipe.transform(
      [
        {
          name: NAME_1,
          id: DEFINITION_ID_1,
          family: {
            id: BusinessProcessType.BINARY_UPGRADE,
          } as BusinessProcessFamily,
          executable: true,
        } as BusinessProcessDefinition,
        {
          name: NAME_2,
          id: DEFINITION_ID_2,
          family: {
            id: BusinessProcessType.BINARY_UPGRADE,
          } as BusinessProcessFamily,
          executable: false,
        } as BusinessProcessDefinition,
      ],
      BusinessProcessType.BINARY_UPGRADE
    );
    expect(filterList).toEqual([{ text: NAME_1, value: DEFINITION_ID_1 }]);
  });
});
