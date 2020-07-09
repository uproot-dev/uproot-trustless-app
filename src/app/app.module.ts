import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { ModalModule } from './_modal';
import { Globals } from './app.globals';

import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing.component';
import { ClassroomComponent } from './classroom/classroom.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { StudentComponent } from './student/student.component';
import { ClassroomInfoComponent } from './classroom/classroomInfo.component';
import { FundComponent } from './fund/fund.component';
import { NgxUiLoaderModule } from 'ngx-ui-loader';


@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    ClassroomComponent,
    ClassroomInfoComponent,
    NavbarComponent,
    FooterComponent,
    StudentComponent,
    FundComponent
  ],
  imports: [
    BrowserModule,
    RouterModule,
    ModalModule,
	AppRoutingModule,
	NgxUiLoaderModule
  ],
  providers: [Globals],
  bootstrap: [AppComponent],
  exports: [FundComponent]
})
export class AppModule { }
