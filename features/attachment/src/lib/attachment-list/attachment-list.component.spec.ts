import { of, throwError } from 'rxjs';
import { AttachmentListComponent } from './attachment-list.component';
import { AttachmentService } from '../attachment.service';
import { AttachmentTestUtils } from '../attachment-test-utils';
import { ConfirmationService } from 'primeng/api';
import { Attachment } from '../attachment.model';
import { ToastMessageService } from '@mxflow/ui/alert';

describe('AttachmentListComponent', () => {
  let component: AttachmentListComponent;
  let attachmentService: AttachmentService;
  let toastMessageService: ToastMessageService;
  let confirmationService: ConfirmationService;

  beforeEach(() => {
    attachmentService = {
      deleteAttachment: jest.fn(() => of({})),
    } as unknown as AttachmentService;

    toastMessageService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    confirmationService = {
      confirm: jest.fn(),
    } as unknown as ConfirmationService;
    jest.useFakeTimers();
    component = new AttachmentListComponent(attachmentService, toastMessageService, confirmationService);
    component.attachments = [];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call attachment service with correct parameter when deleting attachment with delete link', () => {
    const deleteAttachmentSpy = jest.spyOn(attachmentService, 'deleteAttachment').mockReturnValue(of(undefined));

    component.deleteAttachment(AttachmentTestUtils.ATTACHMENT);

    expect(deleteAttachmentSpy).toHaveBeenCalledWith(AttachmentTestUtils.DELETE_LINK);
  });

  it('should not call attachment service with correct parameter when deleting attachment without delete link', () => {
    const deleteAttachmentSpy = jest.spyOn(attachmentService, 'deleteAttachment').mockReturnValue(of(undefined));

    component.deleteAttachment({ ...AttachmentTestUtils.ATTACHMENT, deleteLink: undefined });

    expect(deleteAttachmentSpy).not.toHaveBeenCalled();
  });

  it.each([AttachmentTestUtils.ATTACHMENT, { ...AttachmentTestUtils.ATTACHMENT, deleteLink: undefined }])(
    'should push a success message if deleting an attachment is successful',
    (attachment: Attachment) => {
      component.deleteAttachment(attachment);
      jest.advanceTimersByTime(500);
      expect(toastMessageService.showSuccess).toHaveBeenCalledWith('The attachment was deleted successfully');
    }
  );

  it.each([AttachmentTestUtils.ATTACHMENT, { ...AttachmentTestUtils.ATTACHMENT, deleteLink: undefined }])(
    'should emit new attachments value upon delete',
    async (attachment: Attachment) => {
      const idToDelete = 'idToDelete';
      component.attachments = [attachment, { ...attachment, attachmentId: idToDelete }];
      const attachmentChangeEmitter = jest.spyOn(component.attachmentsChange, 'emit');
      component.deleteAttachment({ ...attachment, attachmentId: idToDelete });
      await jest.runAllTimersAsync();
      expect(attachmentChangeEmitter).toHaveBeenCalledWith([attachment]);
    }
  );

  it('should show confirmation message before deleting', () => {
    const mouseEvent = { target: 'target' } as unknown as MouseEvent;
    const confirmation = jest.spyOn(confirmationService, 'confirm');
    component.confirmDelete(mouseEvent, AttachmentTestUtils.ATTACHMENT);
    expectConfirmationPopupShowsCorrectly(confirmation, mouseEvent);
  });

  it('should display error message when failed to delete attachment', async () => {
    jest
      .spyOn(attachmentService, 'deleteAttachment')
      .mockReturnValue(throwError(() => new Error(AttachmentTestUtils.ERROR_MESSAGE)));
    component.deleteAttachment(AttachmentTestUtils.ATTACHMENT);
    await jest.runAllTimersAsync();
    expect(toastMessageService.showError).toHaveBeenCalledWith(AttachmentTestUtils.ERROR_MESSAGE);
  });

  function expectConfirmationPopupShowsCorrectly(confirmation: jest.SpyInstance, mouseEvent: MouseEvent) {
    expect(confirmation).toHaveBeenCalled();
    expect(confirmation.mock.calls[0][0].message).toEqual('Are you sure you want to delete the attachment?');
    expect(confirmation.mock.calls[0][0].target).toEqual(mouseEvent.target);
    expect(confirmation.mock.calls[0][0].icon).toEqual('pi pi-exclamation-triangle');
    expect(attachmentService.deleteAttachment).not.toHaveBeenCalled();
    confirmation.mock.calls[0][0].accept?.();
    expect(attachmentService.deleteAttachment).toHaveBeenCalledWith(AttachmentTestUtils.DELETE_LINK);
  }
});
