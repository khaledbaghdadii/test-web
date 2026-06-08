import { Component, computed, inject, input } from "@angular/core";
import { JIRA_CONFIG, JiraConfig } from "@mxflow/config";

@Component({
  selector: "mxevolve-client-impact-note-redirector",
  imports: [],
  template: `
    <a [href]="url()" target="_blank" rel="noopener" class="p-button-link">
      {{ id() }}
    </a>
  `,
})
export class ClientImpactNoteRedirectorComponent {
  private readonly config = inject<JiraConfig>(JIRA_CONFIG);

  id = input<string>();

  url = computed(() => {
    if (!this.id()) {
      return undefined;
    }
    return `${this.config.clientImpactNoteBaseUrl}${this.id()}`;
  });
}
