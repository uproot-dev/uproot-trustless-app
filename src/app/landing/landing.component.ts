import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
//import { RelayProvider } from '@opengsn/gsn';

import { Classroom } from 'src/models/classroom.model';
import { GenericUser } from 'src/models/genericUser.model';
import { CLASSROOMS } from 'src/models/mock-classroom';
import { ModalService } from '../_modal';
import { Globals } from '../app.globals';
import { ClassroomInfoComponent } from '../classroom/classroomInfo.component';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { environment } from 'src/environments/environment';
import { InfuraService } from '../services/infura.service';
import Web3 from 'web3';

const web3 = new Web3(Web3.givenProvider);

@Component({
	selector: 'app-landing',
	templateUrl: './landing.component.html',
	styleUrls: ['./landing.component.css'],
})
export class LandingComponent implements OnInit {
	focus: any;
	focus1: any;
	page = 2;
	page1 = 3;

	universityEtherscan =
		'https://' +
		environment.network +
		'.etherscan.io/address/' +
		environment.UniversityAddress;

	public modeUniversityAdmin = 'unconnected';
	public txMode = 'off';
	public hashTx: any;
	public receipt: any;
	public form: FormGroup;

	constructor(
		public globals: Globals,
		private modalService: ModalService,
		private ngxLoader: NgxUiLoaderService
	) {}

	async ngOnInit() {
		if (!this.globals.service) {
			this.globals.service = new InfuraService();
			await this.globals.ensService.configureProvider(
				this.globals.service.provider,
				false
			);
		}
		if (this.globals.universityInfoNeedsRefresh)
			this.refreshUniversityInfo();
	}

	openModal(id: string) {
		this.modalService.open(id);
	}

	closeModal(id: string) {
		this.modalService.close(id);
	}

	closeUniversityNotice() {
		this.globals.universityDisplayNotice = false;
	}

	onSelect(classroom: Classroom | void): void {
		if (classroom) this.globals.selectedClassroom = classroom;
		else this.globals.selectedClassroom = null;
	}

	txOn() {
		this.txMode = 'preTX';
	}

	txOff() {
		this.txMode = 'off';
	}

	clear() {
		this.form.reset();
	}

	async refreshUniversityInfo(): Promise<any> {
		if (this.globals.pageParalelRefreshLock) return;
		this.globals.pageParalelRefreshLock = true;
		this.refreshUniversityMetadata();
		this.updateClassrooms().then(() => {
			this.globals.classlistLoaded = true;
			this.globals.universityInfoNeedsRefresh = false;
			this.globals.pageParalelRefreshLock = false;
		});
		this.loadUniversityAdmin();
	}

	async refreshUniversityMetadata() {
		this.globals.universityENSName = await this.globals.ensService.lookupAddress(
			environment.UniversityAddress
		);
		this.globals.universityENSNameRecord = await this.globals.ensService.checkENSRecord();
		this.globals.universityENSTTL = await this.globals.ensService.getTTL();
		this.globals.universityENSDescription = await this.globals.ensService.getTxDescription();
		this.globals.universityENSNotice = await this.globals.ensService.getTxNotice();
		this.globals.universityENSHasNotice =
			this.globals.universityENSNotice.length > 0;
		this.globals.universityName = await this.globals.service.getUniversityName();
		this.globals.universityCut = await this.globals.service.getUniversityCut();
		this.globals.universityDonations = await this.globals.service.getUniversityDonations();
		this.globals.universityFunds = await this.globals.service.getUniversityFunds();
		this.globals.universityBudget = await this.globals.service.getUniversityBudget();
		this.globals.universityRevenue = await this.globals.service.getUniversityRevenue();
		this.globals.universityReturns = await this.globals.service.getUniversityReturns();
		this.globals.universityParams = await this.globals.service.getUniversityParams();
		this.globals.universityFundAddress = await this.globals.service.getUniversityFund();
	}

	async updateENSNotice(text: string) {
		await this.globals.service.setTxRecord(
			this.globals.ensService.node,
			'notice',
			text
		);
		await this.refreshUniversityMetadata();
	}

	async updateENSDescription(text: string) {
		await this.globals.service.setTxRecord(
			this.globals.ensService.node,
			'description',
			text
		);
		await this.refreshUniversityMetadata();
	}

	async setupUniversityENS() {
		const normalName = this.globals.universityName
			.toLowerCase()
			.replace(/\s/g, '');
		let tx;
		if (!this.globals.universityENSNameRecord) {
			tx = await this.globals.service.registerInRegistrar(normalName);
			await this.loadTx(tx);
		}
		const node = this.globals.ensService.node;
		tx = await this.globals.service.setResolver(node);
		await this.loadTx(tx);
		tx = await this.globals.service.setAddr(
			node,
			environment.UniversityAddress
		);
		await this.loadTx(tx);
		tx = await this.globals.service.setReverse(
			normalName + environment.ENSDomain
		);
		await this.loadTx(tx);
	}

	async updateClassrooms() {
		let classroomCount = await this.globals.service.getClassroomCount();
		if (
			this.globals.classrooms.length ==
			classroomCount + CLASSROOMS.length
		)
			return;
		this.globals.classlistLoaded = false;
		this.globals.classrooms = new Array<Classroom>();
		let index = 0;
		while (index < classroomCount) {
			const [
				title,
				smartcontract,
				startDate,
				finishDate,
				duration,
				price,
				minScore,
				cutPrincipal,
				cutPool,
				isOpen,
				isEmpty,
				isActive,
				isFinished,
				addressChallenge,
				owner,
			] = await this.globals.service.getClassroomInfo(index);
			const newClassroom = new Classroom(
				index,
				title,
				smartcontract,
				startDate,
				finishDate,
				duration / (60 * 60 * 24),
				price,
				minScore,
				cutPrincipal / 1e4,
				cutPool / 1e4,
				isOpen,
				isEmpty,
				isActive,
				isFinished,
				addressChallenge,
				owner
			);
			this.globals.classrooms.push(newClassroom);
			this.refreshClassroomMetadata(newClassroom);
			index++;
		}
	}

	async refreshClassroomMetadata(classroom: Classroom) {
		const normalName = classroom.title.toLowerCase().replace(/\s/g, '');
		const node = this.globals.ensService.getSubNode(normalName);
		const record = await this.globals.ensService.hasRecord(node);
		if (!record) return;
		classroom.metadata.email = await this.globals.ensService.getTxEmail(
			node
		);
		classroom.metadata.url = await this.globals.ensService.getTxURL(node);
		classroom.metadata.avatar = await this.globals.ensService.getTxAvatar(
			node
		);
		if (classroom.metadata.avatar.length < 5)
			classroom.metadata.avatar = this.globals.defaultClassroomImg;
		classroom.metadata.description = await this.globals.ensService.getTxDescription(
			node
		);
		classroom.metadata.notice = await this.globals.ensService.getTxNotice(
			node
		);
		classroom.metadata.keywords = await this.globals.ensService.getTxKeywordsArray(
			node
		);
	}

	async refreshAccountInfo(): Promise<any> {
		this.globals.address = await this.globals.service.getAddress();
	}

	getClassrooms(id: Number) {
		const data = localStorage.getItem('classrooms');
		if (data) {
			this.globals.classrooms = JSON.parse(data);
		} else {
			this.globals.classrooms = [];
		}
	}

	revokeRole(role: string, address: string) {
		this.globals.service
			.revokeRole(role, address)
			.then(() => this.loadUniversityAdmin());
	}

	grantRole(role: string, address: string) {
		this.globals.service
			.grantRole(role, address)
			.then(() => this.loadUniversityAdmin());
	}

	attachFund(address: string) {
		this.globals.service.universityContractInstance.attachFund(address);
	}

	grantFundAdmin(address: string) {
		this.globals.service.grantFundAdmin(address);
	}

	applyFunds(val: number) {
		this.globals.service.applyFunds(val);
	}

	recoverFunds(val: number) {
		this.globals.service.recoverFunds(val);
	}

	loadUniversityAdmin() {
		this.modeUniversityAdmin = 'unconnected';
		this.globals.roleMembersAdmin = new Map<string, Array<GenericUser>>();
		this.getRoleMembers('DEFAULT_ADMIN_ROLE').then((result) => {
			this.globals.roleMembersAdmin['DEFAULT_ADMIN_ROLE'] = result;
			if (
				this.globals.roleMembersAdmin['DEFAULT_ADMIN_ROLE'].find(
					(element) => element.address == this.globals.address
				)
			)
				this.globals.userIsUniversityAdmin = true;
		});
		this.getRoleMembers('FUNDS_MANAGER_ROLE').then((result) => {
			this.globals.roleMembersAdmin['FUNDS_MANAGER_ROLE'] = result;
		});
		this.getRoleMembers('CLASSLIST_ADMIN_ROLE').then((result) => {
			this.globals.roleMembersAdmin['CLASSLIST_ADMIN_ROLE'] = result;
		});
		this.getRoleMembers('GRANTS_MANAGER_ROLE').then((result) => {
			this.globals.roleMembersAdmin['GRANTS_MANAGER_ROLE'] = result;
		});
		this.getRoleMembers('UNIVERSITY_OVERSEER_ROLE').then((result) => {
			this.globals.roleMembersAdmin['UNIVERSITY_OVERSEER_ROLE'] = result;
		});
		this.getRoleMembers('REGISTERED_SUPPLIER_ROLE').then((result) => {
			this.globals.roleMembersAdmin['REGISTERED_SUPPLIER_ROLE'] = result;
		});
		this.getRoleMembers('STUDENT_IDENTITY_ROLE').then((result) => {
			this.globals.roleMembersAdmin['STUDENT_IDENTITY_ROLE'] = result;
		});
		this.getRoleMembers('CLASSROOM_PROFESSOR_ROLE').then((result) => {
			this.globals.roleMembersAdmin['CLASSROOM_PROFESSOR_ROLE'] = result;
		});
		this.getRoleMembers('READ_STUDENT_LIST_ROLE').then((result) => {
			this.globals.roleMembersAdmin['READ_STUDENT_LIST_ROLE'] = result;
			this.modeUniversityAdmin = 'loaded';
		});
	}

	public async setUniversityOwner(param: string) {}

	public async setUniversityName(param: string) {
		const tx = await this.globals.service.changeUniversityName(param);
		await this.loadTx(tx);
	}

	private async loadTx(tx: any) {
		this.ngxLoader.start();
		this.globals.overlayLoader = true;
		await tx.wait();
		this.ngxLoader.stop();
		this.globals.overlayLoader = false;
	}

	public async setUniversityCut(param: string) {}

	public async setUniversityParams(param: string) {
		const paramArray = param.split(',');
		this.globals.service.universityContractInstance.updateAddresses(
			...paramArray
		);
	}

	public createClassroom(
		_Owner: string,
		_Name: string,
		_Price: string,
		_Cutfromprincipal: string,
		_Cutfromsuccesspool: string,
		_Minimumscore: string,
		_Duration: string,
		_Challengeaddress: string
	) {
		this.globals.service
			.createClassroom(
				_Owner,
				_Name,
				_Price,
				Number(_Cutfromprincipal),
				Number(_Cutfromsuccesspool),
				Number(_Minimumscore),
				Number(_Duration),
				_Challengeaddress
			)
			.then(() => this.updateClassrooms());
	}

	async studentClaimSubnode(label, owner, classroom) {
		const node = this.globals.ensService.node;
		const normalName = label.toLowerCase().replace(/\s/g, '');
		await this.globals.service.claimSubnodeStudent(
			node,
			normalName,
			owner,
			classroom
		);
	}

	async getRoleMembers(role: string) {
		return await this.globals.service.listRoles(role);
	}

	async donateDAi(val: number) {
		const tx1 = await this.globals.service.approveDAI(val);
		this.ngxLoader.start();
		this.globals.overlayLoader = true;
		await tx1.wait();
		this.ngxLoader.stop();
		this.globals.overlayLoader = false;
		const tx2 = await this.globals.service.donateDAI(val);
		this.ngxLoader.start();
		this.globals.overlayLoader = true;
		await tx1.wait();
		this.ngxLoader.stop();
		this.globals.overlayLoader = false;
	}
}
