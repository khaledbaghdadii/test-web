import { ComponentFixture, TestBed } from "@angular/core/testing";
import { JIRA_CONFIG, JiraConfig } from "@mxflow/config";
import { ClientImpactNoteRedirectorComponent } from "./client-impact-note-redirector.component";
import { By } from "@angular/platform-browser";

const cinId = "CIN-1234";

describe("ClientImpactNoteRedirectorComponent", () => {
  let fixture: ComponentFixture<ClientImpactNoteRedirectorComponent>;

  const defaultConfig: JiraConfig = {
    clientImpactNoteBaseUrl: "https://jira.example.com/client-impact-notes/",
  } as JiraConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ClientImpactNoteRedirectorComponent],
      providers: [{ provide: JIRA_CONFIG, useValue: defaultConfig }],
    });

    fixture = TestBed.createComponent(ClientImpactNoteRedirectorComponent);
    fixture.componentRef.setInput("id", cinId);
    fixture.detectChanges();
  });

  it("should redirect to client impact note url", () => {
    const anchor = fixture.debugElement.query(By.css("a"));
    expect(anchor).toBeTruthy();
    expect(anchor.attributes["href"]).toBe(
      `https://jira.example.com/client-impact-notes/${cinId}`
    );
  });

  it("should not redirect if the id is empty", () => {
    fixture.componentRef.setInput("id", undefined);
    fixture.detectChanges();

    const anchor = fixture.debugElement.query(By.css("a"));
    expect(anchor.attributes["href"]).toBe("");
  });
});
