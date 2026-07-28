import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AnnouncementBannerComponent } from "@mxflow/ui/alert";

describe("AnnouncementBannerPreviewComponent", () => {
  let component: AnnouncementBannerComponent;
  let fixture: ComponentFixture<AnnouncementBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnouncementBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnnouncementBannerComponent);
    component = fixture.componentInstance;
  });

  it("should sanitize and set htmlAnnouncementHTML when htmlAnnouncement input is set", () => {
    component.htmlAnnouncement = "<b>Test</b>";
    expect(component.htmlAnnouncementHTML).toBeDefined();
  });

  it("should update htmlAnnouncementHTML when htmlAnnouncement input changes", () => {
    const html1 = "<div>First</div>";
    const html2 = "<div>Second</div>";
    component.htmlAnnouncement = html1;
    const firstSanitized = component.htmlAnnouncementHTML;
    component.htmlAnnouncement = html2;
    expect(component.htmlAnnouncementHTML).not.toBe(firstSanitized);
  });

  it("should handle empty htmlAnnouncement input", () => {
    component.htmlAnnouncement = "";
    expect(component.htmlAnnouncementHTML).toBeDefined();
  });
});
