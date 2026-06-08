import { of, throwError } from "rxjs";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { AppConfig } from "@mxflow/config";
import { AttachmentService } from "./attachment.service";
import { AttachmentTestUtils } from "./attachment-test-utils";

const projectId = "projectId";
describe("AttachmentService", () => {
  let service: AttachmentService;
  let httpClientSpy: HttpClient;
  const appConfig = {
    gatewayUrl: "http://localhost/",
  } as AppConfig;

  const deleteUrl = appConfig.gatewayUrl + AttachmentTestUtils.DELETE_LINK;

  beforeEach(() => {
    httpClientSpy = {
      delete: jest.fn(),
      post: jest.fn(),
    } as unknown as HttpClient;
    service = new AttachmentService(httpClientSpy, appConfig);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should delete attachment correctly", (done) => {
    jest.spyOn(httpClientSpy, "delete").mockReturnValue(of(null));

    service.deleteAttachment(AttachmentTestUtils.DELETE_LINK).subscribe(() => {
      done();
    });

    expect(httpClientSpy.delete).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.delete).toHaveBeenCalledWith(deleteUrl);
  });

  it("should handle error correctly when failing to delete attachment", (done) => {
    const errorResponse = new HttpErrorResponse({
      error: AttachmentTestUtils.ERROR_MESSAGE,
    });
    jest
      .spyOn(httpClientSpy, "delete")
      .mockReturnValue(throwError(() => errorResponse));

    service.deleteAttachment(AttachmentTestUtils.DELETE_LINK).subscribe({
      error: (error) => {
        expect(error.message).toEqual(AttachmentTestUtils.ERROR_MESSAGE);
        done();
      },
    });
  });

  describe("upload temporary project specific attachment", () => {
    it("should upload the attachment correctly", (done) => {
      jest
        .spyOn(httpClientSpy, "post")
        .mockReturnValue(
          of(AttachmentTestUtils.UPLOAD_PROJECT_SPECIFIC_ATTACHMENT_RESPONSE)
        );
      service
        .uploadTemporaryAttachment(projectId, AttachmentTestUtils.FILE)
        .subscribe((result) => {
          expect(result).toEqual(
            AttachmentTestUtils.UPLOAD_PROJECT_SPECIFIC_ATTACHMENT_RESPONSE
          );
          expect(httpClientSpy.post).toHaveBeenCalledWith(
            `${appConfig.gatewayUrl}projects/${projectId}/attachments`,
            AttachmentTestUtils.getAttachmentFormData()
          );
          done();
        });
    });
    it("should handle error correctly if failed to upload attachment", (done) => {
      jest.spyOn(httpClientSpy, "post").mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              error: AttachmentTestUtils.ERROR_MESSAGE,
            })
        )
      );
      service
        .uploadTemporaryAttachment(projectId, AttachmentTestUtils.FILE)
        .subscribe({
          error: (error) => {
            expect(error.message).toEqual(AttachmentTestUtils.ERROR_MESSAGE);
            done();
          },
        });
    });
  });
});
