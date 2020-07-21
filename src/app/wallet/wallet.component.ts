import { Component, OnInit } from '@angular/core';
import { Globals } from '../app.globals';

import { PortisService } from '../services/portis.service';
import { InfuraService } from '../services/infura.service';
import { ENSService } from '../services/ens.service';
import { ModalService } from '../_modal';
import { environment } from 'src/environments/environment';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MetamaskService } from '../services/metamask.service';
import { ethers } from 'ethers';
import { Student } from 'src/models/student.model';
import Web3 from 'web3';

@Component({
	selector: 'app-wallet',
	templateUrl: './wallet.component.html',
	styleUrls: ['./wallet.component.css'],
})
export class WalletComponent implements OnInit {
	constructor(
		private modalService: ModalService,
		public metamaskService: MetamaskService,
		public portisService: PortisService,
		public globals: Globals
	) {}
	public txMode = 'off';
	focus: any;
	public hashTx: any;

	ngOnInit(): void {
		if (!this.globals.service) {
			this.globals.service = new InfuraService();
			this.globals.ensService.configureProvider(this.globals.service.provider, false);
		}
	}

	txOn() {
		this.txMode = 'preTX';
	}

	txOff() {
		this.txMode = 'off';
	}

	openModal(id: string) {
		this.modalService.open(id);
	}

	closeModal(id: string) {
		this.modalService.close(id);
	}

	public async connectWallet(): Promise<any> {
		if (window['ethereum']) {
			this.openModal('select-provider');
		} else await this.connectPortis();
	}

	connectMetamask() {
		this.globals.mode = 'loadingPage';
		if (window['web3']) {
			window['web3'] = new Web3(window['web3'].currentProvider);
		}
		window['ethereum'].enable().then(
			(accounts) => {
				this.globals.mode = 'connected';
				this.globals.address = ethers.utils.getAddress(accounts[0]);
				this.globals.service = this.metamaskService;
				this.globals.service.setupProvider(new ethers.providers.Web3Provider(window['web3'].currentProvider));
				this.initSigner();
			},
			(err) => console.warn(err)
		);
		window['ethereum'].on('accountsChanged', (accounts) => {
			this.globals.address = accounts[0];
			this.initSigner();
		});
	}

	async connectPortis(): Promise<any> {
		this.globals.mode = 'loadingPage';
		const answer = await this.portisService.initPortis();
		if (!answer) {
			this.globals.mode = 'unconnected';
			return;
		}
		this.globals.address = await this.portisService.getAddress();
		this.globals.service = this.portisService;
		await this.initSigner();
	}

	private async initSigner() {
		this.globals.ensService.configureProvider(this.globals.service.provider);
		if (
			this.globals.roleMembersAdmin &&
			this.globals.roleMembersAdmin['DEFAULT_ADMIN_ROLE'].find((element) => element.address == this.globals.address)
		)
			this.globals.userIsUniversityAdmin = true;
		if (this.globals.selectedClassroom) {
			await this.globals.service.connectClassroom(this.globals.selectedClassroom.smartcontract);
			const adminAddress = await this.globals.service.getClassroomOwner();
			this.globals.userIsClassroomAdmin = this.globals.address == adminAddress;
		}
		const isRegistered = await this.globals.service.isStudentRegistred();
		if (!isRegistered) {
			this.globals.mode = 'connected';
		} else {
			this.globals.userIsStudent = true;
			this.globals.mode = 'registered';
			const studentSmartContract = await this.globals.service.getStudentSmartContract();
			this.onConnect(new Student(this.globals, studentSmartContract));
		}
	}

	onConnect(student: Student | void): void {
		if (student) this.globals.selectedStudent = student;
		else this.globals.selectedStudent = new Student(this.globals, this.globals.ADDR0);
	}

	async studentSelfRegister(_name: string): Promise<any> {
		this.txOn();
		if (_name.length < 1) {
			this.txMode = 'failedTX';
		} else {
			this.txMode = 'processingTX';
			const selfRegister = await this.globals.service.studentSelfRegister(_name);
			if (!selfRegister) {
				this.txMode = 'failedTX';
			} else {
				this.hashTx = selfRegister.hash;
				this.txMode = 'successTX';
			}
		}
	}
}
