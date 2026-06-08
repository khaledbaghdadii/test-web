import { CreateFailureReasonForm, CreateFailureReasonModalComponent } from './create-failure-reason-modal.component';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

describe('Create Failure Reason Modal Component', () => {

  it('should handle the submission of the create failure reason form correctly', () => {
    //Given
    const fixture = TestBed.createComponent(CreateFailureReasonModalComponent);
    const component = fixture.componentInstance;
    jest.spyOn(component.failureReasonCreationSubmitted, 'emit');
    component.failureReasonCreationForm = new FormGroup<CreateFailureReasonForm>({
      title: new FormControl<string | null>('title'),
      description: new FormControl<string | null>('description'),
      isEnabled: new FormControl<boolean | null>(true)
    } as CreateFailureReasonForm);

    // When
    component.handleCreateFailureReasonSubmitted();
    fixture.detectChanges();

    //Then
    expect(component.failureReasonCreationSubmitted.emit).toHaveBeenCalledWith({
      title: 'title',
      description: 'description',
      isEnabled: true
    });
  });

  it('should handle the cancellation of the create failure reason form correctly', () => {
    //Given
    const fixture = TestBed.createComponent(CreateFailureReasonModalComponent);
    const component = fixture.componentInstance;
    jest.spyOn(component.failureReasonCreationCancelled, 'emit');
    component.failureReasonCreationForm = new FormGroup<CreateFailureReasonForm>({
      title: new FormControl<string | null>('title'),
      description: new FormControl<string | null>('description'),
      isEnabled: new FormControl<boolean | null>(true)
    } as CreateFailureReasonForm);

    // When
    component.handleCreateFailureReasonCancelled();
    fixture.detectChanges();

    //Then
    expect(component.failureReasonCreationForm.value).toEqual({
      title: null,
      description: null,
      isEnabled: true
    })
    expect(component.failureReasonCreationCancelled.emit).toHaveBeenCalled();
  });
});
