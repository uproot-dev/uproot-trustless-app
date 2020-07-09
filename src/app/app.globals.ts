import { Injectable } from '@angular/core';
import { PortisService } from './services/portis.service';
import { InfuraService } from './services/infura.service';
import { Classroom } from 'src/models/classroom.model';
import { ENSService } from './services/ens.service';
import { Student } from 'src/models/student.model';
import { baseClientService } from './services/baseClient.service';
import { MetamaskService } from './services/metamask.service';

@Injectable()
export class Globals {
	public ADDR0 = "0x0000000000000000000000000000000000000000";
	public defaultClassroomImg = "https://qph.fs.quoracdn.net/main-qimg-b1a1a5b86638cac39fa9e8389d4c3b46";

	public overlayLoader = false;

	public service: PortisService | InfuraService | MetamaskService;
	public ensService = new ENSService();
	public address: string;
	public mode = 'unconnected';
	public userIsStudent = false;
	public userIsUniversityAdmin = false;
	public userIsClassroomAdmin = false;
	public selectedClassroom: Classroom;
	public selectedStudent: Student;
	public classrooms = new Array<Classroom>();
	public universityInfoNeedsRefresh = true;
	public universityENSNameRecord = false;
	public universityENSHasNotice = false;
	public universityDisplayNotice = true;
	public pageParalelRefreshLock = false;
	public classlistLoaded = false;
	public universityENSDescription = 'Loading...';

	public universityName: any;
	public universityENSName: any;
	public universityENSTTL: any;
	public universityENSNotice: any;
	public universityCut: any;
	public universityFunds: any;
	public universityBudget: any;
	public universityDonations: any;
	public universityRevenue: any;
	public universityReturns: any;
	public universityAdmin: any;
	public universityParams: any;
	public universityFundAddress: string;
}
