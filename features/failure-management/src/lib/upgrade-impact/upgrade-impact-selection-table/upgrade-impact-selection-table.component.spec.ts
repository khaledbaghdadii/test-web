import { UpgradeImpactSelectionTableComponent } from "./upgrade-impact-selection-table.component";
import { UpgradeImpactDataService } from "../upgrade-impact-data.service";
import {
  Defect,
  FetchUpgradeImpactsQueryResult,
  LiteUpgradeImpact,
} from "../model/lite-upgrade-impact.model";
import { of, throwError } from "rxjs";
import { FetchUpgradeImpactsTableQuery } from "./fetch-upgrade-impacts-table-query.model";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { CommonModule } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterLink } from "@angular/router";
import { HeaderTitleModule } from "@mxflow/ui/header";
import {
  TableChipsFilterComponent,
  TableEmptyMessageComponent,
} from "@mxflow/ui/utils";
import { SharedModule } from "primeng/api";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { By } from "@angular/platform-browser";
import { ValidationScope } from "@mxflow/features/validation-management";
import { DomTestUtils } from "@mxevolve/testing";

const currentVersion = "currentVersion";
const referenceVersion = "referenceVersion";
const validationScope: ValidationScope = {
  currentVersion: currentVersion,
  referenceVersion: referenceVersion,
};

describe("UpgradeImpactSelectionTableComponent", () => {
  let component: UpgradeImpactSelectionTableComponent;
  let fixture: ComponentFixture<UpgradeImpactSelectionTableComponent>;
  let upgradeImpactDataService: jest.Mocked<UpgradeImpactDataService>;

  beforeEach(async () => {
    upgradeImpactDataService = {
      fetchAll: jest.fn(() => of(getFetchUpgradeImpactsQueryResult())),
    } as unknown as jest.Mocked<UpgradeImpactDataService>;

    await TestBed.configureTestingModule({
      imports: [UpgradeImpactSelectionTableComponent],
    })
      .overrideComponent(UpgradeImpactSelectionTableComponent, {
        set: {
          imports: [
            CommonModule,
            HeaderTitleModule,
            RouterLink,
            SharedModule,
            SkeletonModule,
            TableEmptyMessageComponent,
            TableModule,
            TooltipModule,
            TableChipsFilterComponent,
          ],
          providers: [
            {
              provide: UpgradeImpactDataService,
              useValue: upgradeImpactDataService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(UpgradeImpactSelectionTableComponent);
    component = fixture.componentInstance;
    component.isVisible = true;
    fixture.detectChanges();
  });

  describe("setting is visible field", () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(UpgradeImpactSelectionTableComponent);
      component = fixture.componentInstance;
      upgradeImpactDataService.fetchAll.mockClear();
    });

    it("should fetch upgrade impacts if visibility is true", () => {
      component.isVisible = true;
      expect(upgradeImpactDataService.fetchAll).toHaveBeenCalled();
    });

    it("should not fetch upgrade impacts if visibility is false", () => {
      component.isVisible = false;
      fixture.detectChanges();
      expect(upgradeImpactDataService.fetchAll).not.toHaveBeenCalled();
      expect(component.upgradeImpacts).toBeUndefined();
    });
  });

  describe("selecting an upgrade impact", () => {
    it("should set selected impact to initial selected impact value if it is provided", () => {
      expect(component.selectedImpact).toBeFalsy();
      component.selectedUpgradeImpactId = getLiteUpgradeImpact().id;
      expect(component.selectedImpact).toEqual({
        id: getLiteUpgradeImpact().id,
      });
    });

    it("should set selectedImpact to undefined if no initial selected impact id is provided", () => {
      component.selectedUpgradeImpactId = getLiteUpgradeImpact().id;
      component.selectedUpgradeImpactId = undefined;
      expect(component.selectedImpact).toBeUndefined();
    });

    it("should emit an event when upgrade impact is selected", () => {
      const emitSpy = jest.spyOn(
        component.selectedUpgradeImpactIdChange,
        "emit"
      );
      component.impactSelected(getLiteUpgradeImpact());
      expect(emitSpy).toHaveBeenCalledWith(getLiteUpgradeImpact().id);
    });

    it("should call the selectImpact method on selection change", () => {
      const handlerSpy = jest.spyOn(component, "impactSelected");
      getTableHarness().emitSelectionChange(getLiteUpgradeImpact());
      expect(handlerSpy).toHaveBeenCalledWith(getLiteUpgradeImpact());
    });
  });

  describe("setting the validation scope input", () => {
    it.each([
      [validationScope, currentVersion],
      [{ ...validationScope, currentVersion: undefined }, undefined],
    ])(
      "should update the currentVersion of the upgrade impact query",
      (validationScope, currentVersion) => {
        expect(component.validationScope?.currentVersion).toBeUndefined();
        fixture.componentRef.setInput("validationScope", validationScope);
        expect(component.validationScope?.currentVersion).toEqual(
          currentVersion
        );
      }
    );

    it.each([
      [validationScope, referenceVersion],
      [{ ...validationScope, referenceVersion: undefined }, undefined],
    ])(
      "should update the referenceVersion of the upgrade impact query",
      (validationScope, referenceVersion) => {
        expect(component.validationScope?.referenceVersion).toBeUndefined();
        fixture.componentRef.setInput("validationScope", validationScope);
        expect(component.validationScope?.referenceVersion).toEqual(
          referenceVersion
        );
      }
    );

    it("should reset the page index of the upgrade impact query", () => {
      component.query = {
        page: 1,
        size: 10,
      };
      fixture.componentRef.setInput("validationScope", validationScope);
      expect(component.query).toEqual({
        page: 0,
        size: 10,
      });
    });

    it("should fetch the upgrade impacts again", () => {
      const fetchSpy = jest.spyOn(component, "fetchUpgradeImpacts");
      expect(component.validationScope?.referenceVersion).toBeUndefined();
      fixture.componentRef.setInput("validationScope", validationScope);
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  describe("handle table param changes", () => {
    beforeEach(() => {
      upgradeImpactDataService.fetchAll.mockClear();
    });
    it("should handle table param changes correctly in case changed page size", () => {
      component.handleTableQueryParamsChange({ first: 20, rows: 10 });
      expect(upgradeImpactDataService.fetchAll.mock.calls[0][0].size).toEqual(
        10
      );
    });

    it("should handle change in page index correctly", () => {
      component.handleTableQueryParamsChange({ first: 20, rows: 10 });
      expect(upgradeImpactDataService.fetchAll.mock.calls[0][0].page).toEqual(
        2
      );
    });

    it("should request returning impacts with empty defects in case requested to do so", () => {
      component.showUpgradeImpactsWithoutDefects.set(true);
      fixture.detectChanges();
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[0][0]
          .returnUpgradeImpactsNotLinkedToAnyDefect
      ).toEqual(true);
    });

    it("should not request returning impacts with empty defects in case not requested to do so", () => {
      component.showUpgradeImpactsWithoutDefects.set(true);
      fixture.detectChanges();
      upgradeImpactDataService.fetchAll.mockClear();
      component.showUpgradeImpactsWithoutDefects.set(false);
      fixture.detectChanges();
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[0][0]
          .returnUpgradeImpactsNotLinkedToAnyDefect
      ).toEqual(false);
    });

    it("should not fetch impacts upon destroy", () => {
      component.ngOnDestroy();
      component.showUpgradeImpactsWithoutDefects.set(true);
      fixture.detectChanges();
      expect(upgradeImpactDataService.fetchAll).not.toHaveBeenCalled();
    });

    it("should handle table param changes correctly when adding title phrase", () => {
      const titlePhrases = ["title"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { titlePhrases: { value: titlePhrases } },
      });

      expect(
        upgradeImpactDataService.fetchAll.mock.calls[0][0].titlePhrases
      ).toEqual(titlePhrases);
    });

    it("should handle table param changes correctly when clearing title phrase", () => {
      const titlePhrases = ["title1", "title2"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { titlePhrases: { value: titlePhrases } },
      });
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { titlePhrases: { value: ["title2"] } },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[1][0].titlePhrases
      ).toEqual(["title2"]);
    });

    it("should handle table param changes correctly when adding description phrase", () => {
      const descriptionPhrase = "description";
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { descriptionPhrase: { value: descriptionPhrase } },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[0][0].descriptionPhrase
      ).toEqual(descriptionPhrase);
    });

    it("should handle table param changes correctly when clearing description phrase", () => {
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { descriptionPhrase: { value: "description" } },
      });
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { descriptionPhrase: undefined },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[1][0].descriptionPhrase
      ).toEqual(undefined);
    });

    it("should handle table param changes correctly when adding external issue id phrase", () => {
      const externalIssueIdPhrases = ["upgimpact-1"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { externalIssueIdPhrases: { value: externalIssueIdPhrases } },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[0][0]
          .externalIssueIdPhrases
      ).toEqual(externalIssueIdPhrases);
    });

    it("should handle table param changes correctly when clearing external issue id phrase", () => {
      const externalIssueIdPhrases = ["upgimpact-1", "upgimpact-2"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { externalIssueIdPhrases: { value: externalIssueIdPhrases } },
      });
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { externalIssueIdPhrases: { value: ["upgimpact-1"] } },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[1][0]
          .externalIssueIdPhrases
      ).toEqual(["upgimpact-1"]);
    });

    it("should handle table param changes correctly when adding introduced in archival phrase", () => {
      const introducedInArchivalPhrases = ["arch1"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: {
          introducedInArchivalPhrases: { value: introducedInArchivalPhrases },
        },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[0][0]
          .introducedInArchivalPhrases
      ).toEqual(introducedInArchivalPhrases);
    });

    it("should handle table param changes correctly when clearing introduced in archival phrase", () => {
      const introducedInArchivalPhrases = ["arch-1", "arch-2"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: {
          introducedInArchivalPhrases: { value: introducedInArchivalPhrases },
        },
      });
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { introducedInArchivalPhrases: { value: ["arch-1"] } },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[1][0]
          .introducedInArchivalPhrases
      ).toEqual(["arch-1"]);
    });

    it("should handle table param changes correctly when adding introduced in release version phrase", () => {
      const introducedInReleaseVersionPhrases = ["rel-1"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: {
          introducedInReleaseVersionPhrases: {
            value: introducedInReleaseVersionPhrases,
          },
        },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[0][0]
          .introducedInReleaseVersionPhrases
      ).toEqual(introducedInReleaseVersionPhrases);
    });

    it("should handle table param changes correctly when clearing introduced in release version phrase", () => {
      const introducedInReleaseVersionPhrases = ["rel-1"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: {
          introducedInReleaseVersionPhrases: {
            value: introducedInReleaseVersionPhrases,
          },
        },
      });
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { introducedInReleaseVersionPhrases: undefined },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[1][0]
          .introducedInReleaseVersionPhrases
      ).toEqual(undefined);
    });

    it("should handle table param changes correctly when adding defect id phrase", () => {
      const defectIdPhrases = ["defect-1"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { defectIdPhrases: { value: defectIdPhrases } },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[0][0].defectIdPhrases
      ).toEqual(defectIdPhrases);
    });

    it("should handle table param changes correctly when clearing defect id phrase", () => {
      const defectIdPhrases = ["defect-1"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { defectIdPhrases: { value: defectIdPhrases } },
      });
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { defectIdPhrases: undefined },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[1][0].defectIdPhrases
      ).toEqual(undefined);
    });

    it("should handle table param changes correctly when adding bpc ff topic phrase", () => {
      const bpcFfTopic = ["bpc-1"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { bpcFfTopicPhrases: { value: bpcFfTopic } },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[0][0].bpcFfTopicPhrases
      ).toEqual(bpcFfTopic);
    });

    it("should handle table param changes correctly when clearing bpc ff topic phrase", () => {
      const bpcFfTopicPhrases = ["bpc-1"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { bpcFfTopicPhrases: { value: bpcFfTopicPhrases } },
      });
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { bpcFfTopicPhrases: undefined },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[1][0].bpcFfTopicPhrases
      ).toEqual(undefined);
    });

    it("should handle table param changes correctly when adding impacted instruments scope phrase", () => {
      const impactedInstrumentsScopePhrases = ["scope-1"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: {
          impactedInstrumentsScopePhrases: {
            value: impactedInstrumentsScopePhrases,
          },
        },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[0][0]
          .impactedInstrumentsScopePhrases
      ).toEqual(impactedInstrumentsScopePhrases);
    });

    it("should handle table param changes correctly when clearing impacted instruments scope phrase", () => {
      const impactedInstrumentsScopePhrases = ["scope-1"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: {
          impactedInstrumentsScopePhrases: {
            value: impactedInstrumentsScopePhrases,
          },
        },
      });
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { impactedInstrumentsScopePhrases: undefined },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[1][0]
          .impactedInstrumentsScopePhrases
      ).toEqual(undefined);
    });

    it("should handle table param changes correctly when adding impacted outputs phrase", () => {
      const impactedOutputsPhrases = ["output-1"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { impactedOutputsPhrases: { value: impactedOutputsPhrases } },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[0][0]
          .impactedOutputsPhrases
      ).toEqual(impactedOutputsPhrases);
    });

    it("should handle table param changes correctly when clearing impacted outputs phrase", () => {
      const impactedOutputsPhrases = ["output-1"];
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { impactedOutputsPhrases: { value: impactedOutputsPhrases } },
      });
      component.handleTableQueryParamsChange({
        first: 0,
        rows: 10,
        filters: { impactedOutputsPhrases: undefined },
      });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[1][0]
          .impactedOutputsPhrases
      ).toEqual(undefined);
    });

    it("should fetch upgrade impacts with the validation scope filters", () => {
      component.validationScope = validationScope;
      component.handleTableQueryParamsChange({ first: 20, rows: 10 });
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[0][0].currentVersion
      ).toEqual(currentVersion);
      expect(
        upgradeImpactDataService.fetchAll.mock.calls[0][0].referenceVersion
      ).toEqual(referenceVersion);
    });

    it("should call handleTableQueryParamsChange when table emits lazy load event", () => {
      const handlerSpy = jest.spyOn(component, "handleTableQueryParamsChange");
      const event: TableLazyLoadEvent = { rows: 10, first: 0 };
      getTableHarness().emitLazyLoadEvent(event);
      expect(handlerSpy).toHaveBeenCalledWith(event);
    });
  });

  describe("fetch upgrade impacts", () => {
    let warningMessageEmitSpy: jest.SpyInstance;

    beforeEach(() => {
      fixture = TestBed.createComponent(UpgradeImpactSelectionTableComponent);
      component = fixture.componentInstance;
      warningMessageEmitSpy = jest.spyOn(component.warningMessage, "emit");
    });

    it("should fetch data correclty when table is visible", () => {
      component.isVisible = true;

      component.handleTableQueryParamsChange(getUpgradeImpactTableParams());

      expect(upgradeImpactDataService.fetchAll).toHaveBeenCalledWith(
        getFetchUpgradeImpactTableQuery()
      );
      expect(component.upgradeImpacts).toEqual([getLiteUpgradeImpact()]);
      expect(component.total).toEqual(1);
    });

    it("should not fetch data if table is not visible", () => {
      component.isVisible = false;

      component.handleTableQueryParamsChange(getUpgradeImpactTableParams());

      expect(upgradeImpactDataService.fetchAll).not.toHaveBeenCalledWith();
      expect(component.upgradeImpacts).toBeUndefined();
    });

    it("should handle error correctly when fetching data", () => {
      component.isVisible = true;
      const message = "Error";
      const emitSpy = jest.spyOn(component.errorMessage, "emit");
      jest
        .spyOn(upgradeImpactDataService, "fetchAll")
        .mockReturnValueOnce(throwError(() => message));

      component.handleTableQueryParamsChange({ first: 10, rows: 10 });

      expect(emitSpy).toHaveBeenCalledWith(message);
    });

    it("should emit the warning message if returned from fetching the upgrade impacts", () => {
      component.isVisible = true;
      expect(warningMessageEmitSpy).toHaveBeenCalledWith("warningMessage");
    });

    it("should emit an undefined warning message if not returned from fetching the upgrade impacts", () => {
      jest.spyOn(upgradeImpactDataService, "fetchAll").mockReturnValue(
        of({
          ...getFetchUpgradeImpactsQueryResult(),
          warningMessage: undefined,
        })
      );
      component.isVisible = true;
      expect(warningMessageEmitSpy).toHaveBeenCalledWith(undefined);
    });
  });

  describe("displaying the defects tooltips", () => {
    it("should show defect ids", () => {
      const defect1 = "defect1";
      const defect2 = "defect2";
      const defects: Defect[] = [
        {
          defectId: defect1,
          defectLink: "/" + defect1,
        },
        {
          defectId: defect2,
          defectLink: "/" + defect2,
        },
      ];

      expect(component.getDefectIds(defects)).toEqual("defect1, defect2");
    });
  });

  describe("on loading data", () => {
    it("should not display loading template when data is ready", () => {
      const loadingSkeletons = fixture.debugElement.queryAll(
        By.css("p-skeleton")
      );
      expect(loadingSkeletons.length).toBe(0);
    });

    it("should display loading template on loading", () => {
      component.isLoading = true;
      fixture.detectChanges();
      const loadingSkeletons = fixture.debugElement.queryAll(
        By.css("p-skeleton")
      );
      expect(loadingSkeletons.length).toBeGreaterThan(0);
    });
  });

  describe("hiding radio buttons", () => {
    it("should hide the selection header when hideSelection is true", () => {
      component.hideSelection = true;
      fixture.detectChanges();
      const selectionHeader = fixture.debugElement.query(
        By.css('[data-testid="selection-column-header"]')
      );
      expect(selectionHeader.attributes["hidden"]).toBe("");
    });

    it("should show the selection header when hideSelection is false", () => {
      component.hideSelection = false;
      fixture.detectChanges();
      const selectionColumn = fixture.debugElement.query(
        By.css('[data-testid="selection-column"]')
      );
      expect(selectionColumn.attributes["hidden"]).toBeFalsy();
    });
  });

  it("should set the first row index of the table from the page and size", () => {
    component.query = {
      page: 2,
      size: 10,
    };
    expect(getTableHarness().getFirstRowIndex()).toEqual(20);
  });

  it("should destroy correctly", () => {
    const next = jest.spyOn(component.destroy$, "next");
    const complete = jest.spyOn(component.destroy$, "complete");
    component.ngOnDestroy();
    expect(next).toHaveBeenCalledWith({});
    expect(complete).toHaveBeenCalled();
  });

  function getTableHarness() {
    return DomTestUtils.getTableByTestId(
      fixture,
      "upgrade-impacts-selection-table"
    );
  }
});

function getFetchUpgradeImpactTableQuery(): FetchUpgradeImpactsTableQuery {
  return {
    page: 0,
    size: 10,
    sort: "createdOn,desc",
    titlePhrases: ["titlePhrases"],
    descriptionPhrase: "descriptionPhrases",
    externalIssueIdPhrases: ["externalIssueIdPhrases"],
    introducedInArchivalPhrases: ["introducedInArchivalPhrases"],
    introducedInReleaseVersionPhrases: ["introducedInReleaseVersionPhrases"],
    defectIdPhrases: ["defectIdPhrases"],
    bpcFfTopicPhrases: ["bpcFfTopicPhrases"],
    impactedInstrumentsScopePhrases: ["impactedInstrumentsScopePhrases"],
    impactedOutputsPhrases: ["impactedOutputsPhrases"],
    returnUpgradeImpactsNotLinkedToAnyDefect: false,
  };
}

function getUpgradeImpactTableParams(): TableLazyLoadEvent {
  return {
    first: 0,
    rows: 10,
    filters: {
      titlePhrases: {
        value: ["titlePhrases"],
      },
      descriptionPhrase: {
        value: "descriptionPhrases",
      },
      externalIssueIdPhrases: {
        value: ["externalIssueIdPhrases"],
      },
      introducedInArchivalPhrases: {
        value: ["introducedInArchivalPhrases"],
      },
      introducedInReleaseVersionPhrases: {
        value: ["introducedInReleaseVersionPhrases"],
      },
      defectIdPhrases: {
        value: ["defectIdPhrases"],
      },
      bpcFfTopicPhrases: {
        value: ["bpcFfTopicPhrases"],
      },
      impactedInstrumentsScopePhrases: {
        value: ["impactedInstrumentsScopePhrases"],
      },
      impactedOutputsPhrases: {
        value: ["impactedOutputsPhrases"],
      },
    },
  };
}

function getFetchUpgradeImpactsQueryResult(): FetchUpgradeImpactsQueryResult {
  return {
    upgradeImpacts: {
      totalElements: 1,
      content: [
        {
          id: "id",
          title: "title",
          textOnlyDescription: "textOnlyDescription",
          impactType: "impactType",
          impactDocumentationTrigger: "impactDocumentationTrigger",
          introducedInArchival: ["introducedInArchival"],
          introducedInReleaseVersion: ["introducedInReleaseVersion"],
          impactedOutputs: "impactedOutputs",
          impactedInstrumentsScope: ["impactedInstrumentsScope"],
          bpcFFTopic: ["bpcFFTopic"],
          defects: [
            {
              defectId: "defectId",
              defectLink: "defectLink",
            },
          ],
          externalIssue: {
            id: "id",
            origin: "origin",
            link: "link",
          },
        },
      ],
    },
    warningMessage: "warningMessage",
  };
}

function getLiteUpgradeImpact(): LiteUpgradeImpact {
  return {
    id: "id",
    title: "title",
    textOnlyDescription: "textOnlyDescription",
    impactType: "impactType",
    impactDocumentationTrigger: "impactDocumentationTrigger",
    introducedInArchival: ["introducedInArchival"],
    introducedInReleaseVersion: ["introducedInReleaseVersion"],
    impactedOutputs: "impactedOutputs",
    impactedInstrumentsScope: ["impactedInstrumentsScope"],
    bpcFFTopic: ["bpcFFTopic"],
    defects: getDefects(),
    externalIssue: {
      id: "id",
      origin: "origin",
      link: "link",
    },
  };
}

function getDefects() {
  return [
    {
      defectId: "defectId",
      defectLink: "defectLink",
    },
  ];
}
