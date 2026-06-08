import { DetectionUriBuilderPipe } from './detection-uri-builder.pipe';
import { DetectionCategory } from './detection-category.enum';
import { DetectionType } from './detection-type.enum';

const PROJECT_ID = '456';
const DETECTION_ID = '123';
describe('DetectionUriBuilderPipe', () => {
  let pipe: DetectionUriBuilderPipe;
  beforeEach(() => {
    pipe = new DetectionUriBuilderPipe();
  });
  it('should build the correct uri for binary regressions', () => {
    const detection = {
      id: DETECTION_ID,
      category: DetectionCategory.Regression,
      type: DetectionType.Binary,
    };
    expect(pipe.transform(detection)).toBe(`/app/detections/regressions/binary/${DETECTION_ID}`);
  });

  it('should build correct uri for configuration regression', () => {
    const detection = {
      id: DETECTION_ID,
      category: DetectionCategory.Regression,
      type: DetectionType.Configuration,
      projectId: PROJECT_ID,
    };
    expect(pipe.transform(detection)).toBe(`/app/${PROJECT_ID}/detections/regressions/configuration/${DETECTION_ID}`);
  });

  it('should build binary impact uri correctly', () => {
    const detection = {
      id: DETECTION_ID,
      category: DetectionCategory.Impact,
      type: DetectionType.Binary,
      projectId: PROJECT_ID,
    };
    expect(pipe.transform(detection)).toBe(`/app/${PROJECT_ID}/detections/impacts/binary/${DETECTION_ID}`);
  });
  it('should build configuration impact uri correctly', () => {
    const detection = {
      id: DETECTION_ID,
      category: DetectionCategory.Impact,
      type: DetectionType.Configuration,
      projectId: PROJECT_ID,
    };
    expect(pipe.transform(detection)).toBe(`/app/${PROJECT_ID}/detections/impacts/configuration/${DETECTION_ID}`);
  });
});
