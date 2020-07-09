import { Globals } from '../app/app.globals';
import { ethers } from 'ethers';

export class StudentApplication {
	public state = 0;
	public classroomAddress: string;
	public verifyAnswer = false;
	public prize = 0;
	public principal = 0;
	public funds = 0;
	public material: string;
	public answerAddress: string;
	public correctAnswer: boolean;

	constructor(
		public globals: Globals,
		public address: string,
		public studentAddress: string
	) {}

	public connectService() {
		this.globals.service.connectStudentApplication(this.address);
	}

	public isConnected() {
		if (!this.globals.service.studentApplicationContractInstance)
			return false;
		if (
			this.globals.service.studentApplicationContractInstance.address !=
			this.address
		)
			return false;
		return true;
	}

	public async updateState() {
		if (!this.isConnected()) this.connectService();
		this.verifyAnswer = await this.globals.service.studentApplicationContractInstance.verifyAnswer();
		let val = await this.globals.service.studentApplicationContractInstance.viewPrincipalReturned();
		this.principal = Number(ethers.utils.formatEther(val));
		val = await this.globals.service.studentApplicationContractInstance.viewPrizeReturned();
		this.prize = Number(ethers.utils.formatEther(val));
		this.funds = this.prize + this.principal;
	}
}
