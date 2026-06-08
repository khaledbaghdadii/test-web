import { IncidentStatusesTotalCountPipe } from './incident-statuses-total-count.pipe';
import { IncidentSummary } from '@mxflow/features/incident-management';

describe('Pipe: IncidentStatusesTotalCount', () => {
  const pipe = new IncidentStatusesTotalCountPipe();
  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });
  it('should transform correctly', () => {
    const summary: IncidentSummary = {
      statuses: [
        {
          name: 'name',
          count: 1,
        },

        {
          name: 'name1',
          count: 4,
        },
        {
          name: 'name2',
          count: 2,
        },
        {
          name: 'name3',
          count: 6,
        },
      ],
    };
    expect(pipe.transform(summary)).toEqual(13);
  });
  it('should return 0 if there is no statuses available', () => {
    const summary: IncidentSummary = {
      statuses: [],
    };
    expect(pipe.transform(summary)).toEqual(0);
  });
});
