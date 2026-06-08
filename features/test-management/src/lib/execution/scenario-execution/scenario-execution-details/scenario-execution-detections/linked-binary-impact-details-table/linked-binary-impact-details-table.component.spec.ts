import { LinkedBinaryImpactDetailsTableComponent } from "./linked-binary-impact-details-table.component";
import { DomTestUtils } from "@mxevolve/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TableModule } from "primeng/table";
import { BinaryImpact } from "@mxflow/features/failure-management";
import { provideRouter } from "@angular/router";

describe("binary impact component", () => {
  let component: LinkedBinaryImpactDetailsTableComponent;
  let fixture: ComponentFixture<LinkedBinaryImpactDetailsTableComponent>;

  const BINARY_IMPACT_ID = "binaryImpactId";

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [LinkedBinaryImpactDetailsTableComponent, TableModule],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(LinkedBinaryImpactDetailsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should handle unlinking correctly", () => {
    jest.spyOn(component.unlinkImpactRequestEvent, "emit");
    component.handleUnlink(BINARY_IMPACT_ID);
    expect(component.unlinkImpactRequestEvent.emit).toHaveBeenCalledWith(
      BINARY_IMPACT_ID
    );
  });

  it("should display - if no upgrade impact is linked", () => {
    component.binaryImpacts = [
      {
        id: "1",
        upgradeImpact: null,
      } as unknown as BinaryImpact,
    ];
    fixture.detectChanges();
    expect(
      DomTestUtils.getElementByTestId(
        fixture,
        "no-upgrade-impact-linked"
      ).isRendered()
    ).toBeTruthy();
  });

  it("should display upgrade impact link if upgrade impact is linked to binary impact", () => {
    component.binaryImpacts = [
      {
        id: "1",
        upgradeImpact: {
          externalIssue: {
            link: "http://example.com/upgrade-impact",
            title: "Upgrade Impact External Issue",
          },
        },
      } as unknown as BinaryImpact,
    ];
    fixture.detectChanges();
    expect(
      DomTestUtils.getElementByTestId(
        fixture,
        "upgrade-impact-link"
      ).isRendered()
    ).toBeTruthy();
  });
});
