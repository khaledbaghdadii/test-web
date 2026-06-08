import { DetectionCategory } from './detection-category.enum';
import { DetectionType } from './detection-type.enum';

export interface DetectionUriBuilderRequest {
  id: string;
  category: DetectionCategory;
  type: DetectionType;
  projectId?: string;
}
