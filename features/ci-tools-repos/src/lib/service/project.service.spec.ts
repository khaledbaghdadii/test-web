import { HttpClient } from '@angular/common/http';
import { AppConfig } from '@mxflow/config';
import { lastValueFrom, of } from 'rxjs';
import { ProjectService } from '@mxflow/features/ci-tools-repos';
import { RepositoryService } from '@mxflow/features/repository';

const NAME = 'NAME';
const DESCRIPTION = 'DESCRIPTION';
const PROJECT_ID = '2b2ce6b4-cd66-45e3-bd26-f98e440ec159';

const getRepositoryData = [
  {
    id: '4e29eced-c9da-407b-a2ef-405811f42c98',
    name: 'MXflow Environment Deployment',
    url: 'ssh://git@stash.murex.com:7999/mxflow/mxflow-environment-deployment.git',
    credentialsId:
      'project/2b2ce6b4-cd66-45e3-bd26-f98e440ec159/repository/config/4e29eced-c9da-407b-a2ef-405811f42c98',
    label: 'config',
  },

  {
    id: '4e29eced-0000-0000-0000-405811f42c98',
    name: 'MXflow Environment Deployment',
    url: 'ssh://git@stash.murex.com:7999/mxflow/mxflow-environment-deployment.git',
    credentialsId:
      'project/2b2ce6b4-cd66-45e3-bd26-f98e440ec159/repository/config/4e29eced-c9da-407b-a2ef-405811f42c98',
    label: 'test',
  },
];

const getExpectedResponse = {
  description: 'DESCRIPTION',
  id: '2b2ce6b4-cd66-45e3-bd26-f98e440ec159',
  name: 'NAME',
  testRepositories: [
    {
      credentialsId:
        'project/2b2ce6b4-cd66-45e3-bd26-f98e440ec159/repository/config/4e29eced-c9da-407b-a2ef-405811f42c98',
      id: '4e29eced-0000-0000-0000-405811f42c98',
      label: 'test',
      name: 'MXflow Environment Deployment',
      url: 'ssh://git@stash.murex.com:7999/mxflow/mxflow-environment-deployment.git',
    },
  ],
};

describe('Service: ProjectService', () => {
  let projectService: ProjectService;
  let repositoryService: RepositoryService;

  let httpClient: HttpClient;
  const appConfig: AppConfig = {
    gatewayUrl: 'https://gateway.cd.murex.com/api/v1/',
  } as unknown as AppConfig;

  beforeEach(() => {
    httpClient = {
      get: jest.fn((url) => {
        if (url === appConfig.gatewayUrl + `projects/${PROJECT_ID}`) {
          return of({
            id: PROJECT_ID,
            name: NAME,
            description: DESCRIPTION,
          });
        }
        return of({});
      }),
    } as unknown as HttpClient;

    repositoryService = {
      getAllRepositories: jest.fn(() => {
        return of(getRepositoryData);
      }),
    } as unknown as RepositoryService;

    projectService = new ProjectService(appConfig, httpClient, repositoryService);
  });

  it('should return correct project', async () => {
    const result = await lastValueFrom(projectService.getProject(PROJECT_ID));
    expect(httpClient.get).toHaveBeenCalledWith(appConfig.gatewayUrl + `projects/${PROJECT_ID}`);
    expect(result).toEqual(getExpectedResponse);
  });
});
