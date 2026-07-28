import { Component, Input, ViewEncapsulation } from "@angular/core";
import { SafeHtml } from "@angular/platform-browser";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";

@Component({
  selector: "mxevolve-announcement-banner",
  templateUrl: "./announcement-banner.component.html",
  styleUrl: "./announcement-banner.component.scss",
  encapsulation: ViewEncapsulation.None,
  imports: [HeaderTitleModule, CardContainerModule],
  standalone: true,
})
export class AnnouncementBannerComponent {
  htmlAnnouncementHTML: SafeHtml;

  @Input() set htmlAnnouncement(value: string) {
    this.htmlAnnouncementHTML = value;
  }
  @Input() showWarning: boolean;
}
