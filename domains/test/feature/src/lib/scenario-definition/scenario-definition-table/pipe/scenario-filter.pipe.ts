import { Pipe, PipeTransform } from "@angular/core";
import { ScenarioDefinition } from "@mxevolve/domains/test/model";
import { formatTests } from "../../scenario-tests-display";

@Pipe({
  name: "scenarioFilter",
  standalone: true,
})
export class ScenarioFilterPipe implements PipeTransform {
  transform(
    scenarios: ScenarioDefinition[],
    searchInput: string
  ): ScenarioDefinition[] {
    if (!searchInput.trim()) {
      return scenarios;
    }

    const searchLowerCase = searchInput.toLowerCase();

    return scenarios.filter((scenario) => {
      const { name, environmentDefinition } = scenario;
      const scenarioName = name.toLowerCase();
      const environmentName = environmentDefinition.name.toLowerCase();
      const testsToDisplay = formatTests(scenario.tests);

      return (
        scenarioName.includes(searchLowerCase) ||
        environmentName.includes(searchLowerCase) ||
        testsToDisplay.some((test) =>
          test.toLowerCase().includes(searchLowerCase)
        )
      );
    });
  }
}
