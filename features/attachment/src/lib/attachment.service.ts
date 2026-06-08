import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { APP_CONFIG, AppConfig } from '@mxflow/config';
import { catchError, Observable, throwError } from 'rxjs';

export interface UploadProjectSpecificTemporaryAttachmentResponse {
  id: string;
  downloadLink: string;
}

@Injectable()
export class AttachmentService {
  private apiUrl: string;

  constructor(private http: HttpClient, @Inject(APP_CONFIG) private config: AppConfig) {
    this.apiUrl = `${config.gatewayUrl}`;
  }

  deleteAttachment(deleteLink: string): Observable<void> {
    return this.http
      .delete<void>(this.constructDeleteLink(deleteLink))
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  uploadTemporaryAttachment(
    projectId: string,
    file: File
  ): Observable<UploadProjectSpecificTemporaryAttachmentResponse> {
    const formData = new FormData();
    formData.set('file', file);
    return this.http
      .post<UploadProjectSpecificTemporaryAttachmentResponse>(
        `${this.apiUrl}projects/${projectId}/attachments`,
        formData
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private constructDeleteLink(deleteLink: string): string {
    return this.apiUrl + deleteLink;
  }
}
