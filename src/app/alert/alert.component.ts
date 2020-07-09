import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'dismiss-alert',
  templateUrl: './alert.component.html'
})
export class DismissAlertComponent {
  @ViewChild('alert', { static: true }) alert: ElementRef;

  closeAlert() {
    this.alert.nativeElement.classList.remove('show');
  }

}
