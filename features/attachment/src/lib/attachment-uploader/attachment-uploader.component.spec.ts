import { AttachmentUploaderComponent } from './attachment-uploader.component';
import { FileSelectEvent } from 'primeng/fileupload';
import { AttachmentTestUtils } from '../attachment-test-utils';

describe('AttachmentUploaderComponent', () => {
  let component: AttachmentUploaderComponent;

  beforeEach(() => {
    component = new AttachmentUploaderComponent();
  });

  it('should emit upload files correctly', () => {
    const uploadFilesEmitter = jest.spyOn(component.uploadFiles, 'emit');
    const event = { files: getFileList() } as unknown as FileSelectEvent;
    component.upload(event);
    expect(uploadFilesEmitter).toHaveBeenCalledWith([AttachmentTestUtils.FILE]);
  });

  const getFileList = () => {
    return {
      0: AttachmentTestUtils.FILE,
      length: 1,
    };
  };
});
