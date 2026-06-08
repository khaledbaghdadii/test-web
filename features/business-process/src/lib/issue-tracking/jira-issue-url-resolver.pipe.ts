import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "jiraIssueUrlResolver",
  standalone: true,
})
export class JiraIssueUrlResolverPipe implements PipeTransform {
  transform(id: string, baseUrl: string | undefined): string {
    if (!baseUrl) return "";
    const url = new URL("/browse/" + encodeURIComponent(id), baseUrl);
    return url.toString();
  }
}
