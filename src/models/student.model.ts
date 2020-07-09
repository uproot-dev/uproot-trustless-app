import { StudentApplication } from './studentApplication.model';
import { Globals } from '../app/app.globals';

export class Student {
	public metadata = {
		ENSName: '',
		email: '',
		url: '',
		avatar: '',
		description: '',
		notice: '',
		keywords: new Array<string>(),
	};

	public studentENSNameRecord = false;

	public applications: Array<StudentApplication>;

	public hasApplications = false;
	public address: string;
	public name: string;
	public score: string;
	constructor(public globals: Globals, public smartContractAddress: string) {}

	public async updateApplications() {
		this.applications = new Array<StudentApplication>();
		const apps = await this.globals.service.getApplications();
		apps.forEach((address) => {
			let thisApp = new StudentApplication(
				this.globals,
				address,
				this.smartContractAddress
			);
			this.globals.service.connectStudentApplication(address);
			this.globals.service
				.viewApplicationClassroomAddress()
				.then((val) => {
					thisApp.address = val;
					this.applications.push(thisApp);
				});
		});
	}
}
