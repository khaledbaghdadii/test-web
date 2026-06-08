import { UpgradeImpactDetailsComponent } from "./upgrade-impact-details.component";
import {
  UpgradeImpact,
  UpgradeImpactAttachment,
} from "../model/upgrade-impact.model";
import { of, throwError } from "rxjs";
import { UpgradeImpactDataService } from "../upgrade-impact-data.service";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockComponents, MockPipe } from "ng-mocks";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import { AttachmentListComponent } from "@mxflow/features/attachment";
import { SkeletonModule } from "primeng/skeleton";
import { UpgradeImpactAttachmentTransformationPipe } from "./upgrade-impact-attachment-transformation-pipe";
import { CommonModule } from "@angular/common";
import { DomTestUtils } from "@mxevolve/testing";

describe("UpgradeImpactDetailsComponent", () => {
  let component: UpgradeImpactDetailsComponent;
  let upgradeImpactDataService: UpgradeImpactDataService;
  let fixture: ComponentFixture<UpgradeImpactDetailsComponent>;

  beforeEach(() => {
    upgradeImpactDataService = {
      fetchById: jest.fn(),
    } as unknown as UpgradeImpactDataService;

    TestBed.configureTestingModule({
      imports: [UpgradeImpactDetailsComponent],
    }).overrideComponent(UpgradeImpactDetailsComponent, {
      set: {
        imports: [
          CommonModule,
          MockComponents(QuillEditorComponent, AttachmentListComponent),
          MockPipe(UpgradeImpactAttachmentTransformationPipe),
          SkeletonModule,
        ],
        providers: [
          {
            provide: UpgradeImpactDataService,
            useValue: upgradeImpactDataService,
          },
        ],
      },
    });
    fixture = TestBed.createComponent(UpgradeImpactDetailsComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should fetch upgrade impact details on change in upgrade impact id", (done) => {
    jest
      .spyOn(upgradeImpactDataService, "fetchById")
      .mockReturnValue(of(getUpgradeImpact()));
    component.upgradeImpactId = "new id";

    expect(upgradeImpactDataService.fetchById).toHaveBeenCalledWith("new id");
    component.upgradeImpact$.subscribe((value) => {
      expect(value).toEqual(getUpgradeImpact());
      done();
    });
  });

  it("should not fetch upgrade impact details if upgrade impact id is not changed", () => {
    expect(upgradeImpactDataService.fetchById).not.toHaveBeenCalled();
  });

  it("should emit error message on failure to fetch details", (done) => {
    const errorMessage = "errorMessage";
    const emitterSpy = jest.spyOn(component.errorMessage, "emit");
    jest
      .spyOn(upgradeImpactDataService, "fetchById")
      .mockReturnValue(throwError(() => new Error(errorMessage)));

    component.upgradeImpactId = "new id";

    expect(upgradeImpactDataService.fetchById).toHaveBeenCalledWith("new id");
    component.upgradeImpact$.subscribe((value) => {
      expect(emitterSpy).toHaveBeenCalledWith(errorMessage);
      expect(value).toEqual(new Error(errorMessage));
      done();
    });
  });

  it("should emit the fetched upgrade impact", (done) => {
    jest
      .spyOn(upgradeImpactDataService, "fetchById")
      .mockReturnValue(of(getUpgradeImpact()));
    jest.spyOn(component.upgradeImpact, "emit");

    component.upgradeImpactId = "new id";

    component.upgradeImpact$.subscribe((value) => {
      expect(value).toEqual(getUpgradeImpact());
      expect(component.upgradeImpact.emit).toHaveBeenCalledWith(
        getUpgradeImpact()
      );
      done();
    });
  });

  describe("template tests", () => {
    it("should display introduced in archival values", () => {
      jest.spyOn(upgradeImpactDataService, "fetchById").mockReturnValue(
        of({
          ...getUpgradeImpact(),
          introducedInArchival: [
            "introducedInArchival1",
            "introducedInArchival2",
          ],
        })
      );
      component.upgradeImpactId = "new id";
      fixture.detectChanges();

      const archivalElement = getElementByTestId("introduced-in-archival");
      expect(archivalElement.isRendered()).toBeTruthy();

      const introducedInArchivalElement = archivalElement.getNativeElement()
        .nextElementSibling as HTMLElement;
      expect(introducedInArchivalElement).toBeTruthy();
      expect(introducedInArchivalElement.textContent?.trim()).toEqual(
        "introducedInArchival1, introducedInArchival2"
      );
    });

    it("should display - when there are no introduced in archival values", () => {
      jest.spyOn(upgradeImpactDataService, "fetchById").mockReturnValue(
        of({
          ...getUpgradeImpact(),
          introducedInArchival: [],
        })
      );
      component.upgradeImpactId = "new id";
      fixture.detectChanges();

      const archivalElement = getElementByTestId("introduced-in-archival");
      expect(archivalElement.isRendered()).toBeTruthy();

      const introducedInArchivalElement = archivalElement.getNativeElement()
        .nextElementSibling as HTMLElement;
      expect(introducedInArchivalElement).toBeTruthy();
      expect(introducedInArchivalElement.textContent?.trim()).toEqual("-");
    });

    it("should display impacted outputs", () => {
      jest.spyOn(upgradeImpactDataService, "fetchById").mockReturnValue(
        of({
          ...getUpgradeImpact(),
          impactedOutputs: "impactedOutputs",
        })
      );
      component.upgradeImpactId = "new id";
      fixture.detectChanges();

      const impactedOutputsElement =
        getElementByTestId("impacted-outputs").getNativeElement();
      expect(impactedOutputsElement).toBeTruthy();
      expect(impactedOutputsElement.textContent?.trim()).toEqual(
        "impactedOutputs"
      );
    });

    it("should display - when there are no impacted outputs", () => {
      jest.spyOn(upgradeImpactDataService, "fetchById").mockReturnValue(
        of({
          ...getUpgradeImpact(),
          impactedOutputs: "",
        })
      );
      component.upgradeImpactId = "new id";
      fixture.detectChanges();

      const outputsElement =
        getElementByTestId("impacted-outputs").getNativeElement();
      expect(outputsElement).toBeTruthy();
      expect(outputsElement.textContent?.trim()).toEqual("-");
    });

    it("should display bpc ff topics", () => {
      jest.spyOn(upgradeImpactDataService, "fetchById").mockReturnValue(
        of({
          ...getUpgradeImpact(),
          bpcFFTopic: ["topic1", "topic2"],
        })
      );
      component.upgradeImpactId = "new id";
      fixture.detectChanges();

      const bpcElement = getElementByTestId("bpc-ff-topic");
      expect(bpcElement.isRendered()).toBeTruthy();

      const bpcTopicsElement = bpcElement.getNativeElement()
        .nextElementSibling as HTMLElement;
      expect(bpcTopicsElement).toBeTruthy();
      expect(bpcTopicsElement.textContent?.trim()).toEqual("topic1, topic2");
    });

    it("should display - when there are no bpc ff topics", () => {
      jest.spyOn(upgradeImpactDataService, "fetchById").mockReturnValue(
        of({
          ...getUpgradeImpact(),
          bpcFFTopic: [],
        })
      );
      component.upgradeImpactId = "new id";
      fixture.detectChanges();

      const bpcElement = getElementByTestId("bpc-ff-topic");
      expect(bpcElement.isRendered()).toBeTruthy();

      const bpcTopicsElement = bpcElement.getNativeElement()
        .nextElementSibling as HTMLElement;
      expect(bpcTopicsElement).toBeTruthy();
      expect(bpcTopicsElement.textContent?.trim()).toEqual("-");
    });

    it("should display introduced in release version values", () => {
      jest.spyOn(upgradeImpactDataService, "fetchById").mockReturnValue(
        of({
          ...getUpgradeImpact(),
          introducedInReleaseVersion: [
            "introducedInReleaseVersion1",
            "introducedInReleaseVersion2",
          ],
        })
      );
      component.upgradeImpactId = "new id";
      fixture.detectChanges();

      const releaseElement = getElementByTestId(
        "introduced-in-release-version"
      );
      expect(releaseElement.isRendered()).toBeTruthy();

      const releaseValuesElement = releaseElement.getNativeElement()
        .nextElementSibling as HTMLElement;
      expect(releaseValuesElement).toBeTruthy();
      expect(releaseValuesElement.textContent).toEqual(
        "introducedInReleaseVersion1, introducedInReleaseVersion2"
      );
    });

    it("should display - when there are no introduced in release version values", () => {
      jest.spyOn(upgradeImpactDataService, "fetchById").mockReturnValue(
        of({
          ...getUpgradeImpact(),
          introducedInReleaseVersion: [],
        })
      );
      component.upgradeImpactId = "new id";
      fixture.detectChanges();

      const releaseElement = getElementByTestId(
        "introduced-in-release-version"
      );
      expect(releaseElement.isRendered()).toBeTruthy();

      const releaseValuesElement = releaseElement.getNativeElement()
        .nextElementSibling as HTMLElement;
      expect(releaseValuesElement).toBeTruthy();
      expect(releaseValuesElement.textContent).toEqual("-");
    });

    it("should display impacted instruments scope values", () => {
      jest.spyOn(upgradeImpactDataService, "fetchById").mockReturnValue(
        of({
          ...getUpgradeImpact(),
          impactedInstrumentsScope: [
            "impactedInstrumentsScope1",
            "impactedInstrumentsScope2",
          ],
        })
      );
      component.upgradeImpactId = "new id";
      fixture.detectChanges();

      const instrumentsElement = getElementByTestId(
        "impacted-instruments-scope"
      );
      expect(instrumentsElement.isRendered()).toBeTruthy();

      const instrumentsValuesElement = instrumentsElement.getNativeElement()
        .nextElementSibling as HTMLElement;
      expect(instrumentsValuesElement).toBeTruthy();
      expect(instrumentsValuesElement.textContent).toEqual(
        "impactedInstrumentsScope1, impactedInstrumentsScope2"
      );
    });

    it("should display - when there are no impacted instruments scope values", () => {
      jest.spyOn(upgradeImpactDataService, "fetchById").mockReturnValue(
        of({
          ...getUpgradeImpact(),
          impactedInstrumentsScope: [],
        })
      );
      component.upgradeImpactId = "new id";
      fixture.detectChanges();

      const instrumentsElement = getElementByTestId(
        "impacted-instruments-scope"
      );
      expect(instrumentsElement.isRendered()).toBeTruthy();

      const instrumentsValuesElement = instrumentsElement.getNativeElement()
        .nextElementSibling as HTMLElement;
      expect(instrumentsValuesElement).toBeTruthy();
      expect(instrumentsValuesElement.textContent).toEqual("-");
    });

    it("should display defect ids with links", () => {
      jest.spyOn(upgradeImpactDataService, "fetchById").mockReturnValue(
        of({
          ...getUpgradeImpact(),
          defects: [
            {
              defectId: "defectId1",
              defectLink: "defectLink1",
            },
            {
              defectId: "defectId2",
              defectLink: "defectLink2",
            },
          ],
        })
      );
      component.upgradeImpactId = "new id";
      fixture.detectChanges();

      const defectElement = getElementByTestId("defect-ids");
      expect(defectElement.isRendered()).toBeTruthy();

      const defectLinksElement = defectElement.getNativeElement()
        .nextElementSibling as HTMLElement;
      expect(defectLinksElement).toBeTruthy();
      const links = defectLinksElement.querySelectorAll("a");
      expect(links.length).toBe(2);
      expect(links[0].textContent).toBe("defectId1");
      expect(links[0].getAttribute("href")).toBe("defectLink1");
      expect(links[1].textContent).toBe("defectId2");
      expect(links[1].getAttribute("href")).toBe("defectLink2");
    });

    it("should display - when there are no defect ids", () => {
      jest.spyOn(upgradeImpactDataService, "fetchById").mockReturnValue(
        of({
          ...getUpgradeImpact(),
          defects: [],
        })
      );
      component.upgradeImpactId = "new id";
      fixture.detectChanges();

      const defectElement = getElementByTestId("defect-ids");
      expect(defectElement.isRendered()).toBeTruthy();

      const defectLinksElement = defectElement.getNativeElement()
        .nextElementSibling as HTMLElement;
      expect(defectLinksElement).toBeTruthy();
      expect(defectLinksElement.textContent?.trim()).toEqual("-");
    });

    it("should display affected versions when upgrade impact has introduced in release versions", () => {
      jest.spyOn(upgradeImpactDataService, "fetchById").mockReturnValue(
        of({
          ...getUpgradeImpact(),
          introducedInReleaseVersion: ["1.0", "2.0"],
        })
      );
      component.upgradeImpactId = "new id";
      fixture.detectChanges();

      const affectedVersionsElement = getElementByTestId("affected-versions");
      expect(affectedVersionsElement.isRendered()).toBeTruthy();

      const versionsValuesElement = affectedVersionsElement.getNativeElement()
        .nextElementSibling as HTMLElement;
      expect(versionsValuesElement).toBeTruthy();
      expect(versionsValuesElement.textContent).toEqual("1.0, 2.0");
    });

    it("should display - when there are no affected versions", () => {
      jest.spyOn(upgradeImpactDataService, "fetchById").mockReturnValue(
        of({
          ...getUpgradeImpact(),
          introducedInReleaseVersion: [],
        })
      );
      component.upgradeImpactId = "new id";
      fixture.detectChanges();

      const affectedVersionsElement = getElementByTestId("affected-versions");
      expect(affectedVersionsElement.isRendered()).toBeTruthy();

      const versionsValuesElement = affectedVersionsElement.getNativeElement()
        .nextElementSibling as HTMLElement;
      expect(versionsValuesElement).toBeTruthy();
      expect(versionsValuesElement.textContent).toEqual("-");
    });
  });

  function getElementByTestId(testId: string) {
    return DomTestUtils.getElementByTestId<
      UpgradeImpactDetailsComponent,
      HTMLElement
    >(fixture, testId);
  }

  function getUpgradeImpact(): UpgradeImpact {
    return {
      id: "id",
      title: "title",
      impactType: "impactType",
      bpcFFTopic: ["bpc"],
      defects: [
        {
          defectId: "defectId",
          defectLink: "defectLink",
        },
      ],
      impactedOutputs: "impactedOutputs",
      fullDescription: "fullDescription",
      introducedInArchival: ["introducedInArchival"],
      externalIssue: {
        id: "id",
        link: "link",
        origin: "origin",
      },
      impactDocumentationTrigger: "impactDocumentationTrigger",
      introducedInReleaseVersion: ["introducedInReleaseVersion"],
      impactedInstrumentsScope: ["impactedInstrumentsScope"],
      attachments: [getUpgradeImpactAttachment()],
    };
  }

  function getUpgradeImpactAttachment(): UpgradeImpactAttachment {
    return {
      attachmentId: "attachmentId",
      upgradeImpactId: "upgradeImpactId",
      name: "name",
      type: "type",
      downloadLink: "downloadLink",
      externalAttachment: {
        id: "id",
        origin: "origin",
      },
    };
  }
});
