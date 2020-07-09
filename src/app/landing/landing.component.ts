import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
//import { RelayProvider } from '@opengsn/gsn';

import { Classroom } from 'src/models/classroom.model';
import { GenericUser } from 'src/models/genericUser.model';
import { CLASSROOMS } from 'src/models/mock-classroom';
import { Student } from 'src/models/student.model';
import { ModalService } from '../_modal';
import { Globals } from '../app.globals';
import { ClassroomInfoComponent } from '../classroom/classroomInfo.component';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { PortisService } from '../services/portis.service';
import { InfuraService } from '../services/infura.service';
import { ENSService } from '../services/ens.service';
import { environment } from 'src/environments/environment';
import Web3 from 'web3';
import { MetamaskService } from '../services/metamask.service';
import { ethers } from 'ethers';

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
		public portisService: PortisService,
		private ngxLoader: NgxUiLoaderService
	) {}

	async ngOnInit() {
		if (!this.globals.service) {
			if (environment.connectMetamskForTests)
				this.connectMetamaskForTests();
			else this.globals.service = new InfuraService();
			await this.globals.ensService.configureProvider(
				this.globals.service.provider,
				false
			);
		}
		if (this.globals.universityInfoNeedsRefresh)
			this.refreshUniversityInfo();
	}

	connectMetamaskForTests() {
		this.globals.service = new MetamaskService();
		this.initSigner();
	}

	connectGSN() {
		// const relayHubAddress = environment.DefaultGasRelayHub;
		// const paymasterAddress = environment.DefaultTestPaymaster;
		// const stakeManagerAddress = environment.DefaultStakeManager;
		// const gsnConfig = {
		// 	relayHubAddress,
		// 	paymasterAddress,
		// 	stakeManagerAddress,
		// 	methodSuffix: '_v4',
		// 	jsonStringifyRequest: true,
		// 	chainId: 3,
		// };
		// const gsnProvider = new RelayProvider(
		// 	this.globals.service.portis,
		// 	gsnConfig
		// );
		// const provider = new ethers.providers.Web3Provider(gsnProvider);
		// this.globals.service.provider = provider;
		// console.log("GSN Registered as provider");
		// this.globals.useGSN = true;
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

	onConnect(student: Student | void): void {
		if (student) this.globals.selectedStudent = student;
		else
			this.globals.selectedStudent = new Student(
				this.globals,
				this.globals.ADDR0
			);
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

	async conectPortis(): Promise<any> {
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
		this.globals.address = await this.globals.service.getAddress();
		this.globals.ensService.configureProvider(this.portisService.provider);
		if (
			this.roleMembersAdmin &&
			this.roleMembersAdmin['DEFAULT_ADMIN_ROLE'].find(
				(element) => element.address == this.globals.address
			)
		)
			this.globals.userIsUniversityAdmin = true;
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
		if (!this.globals.universityENSNameRecord)
			await this.globals.service.registerInRegistrar(normalName);
		const node = this.globals.ensService.node;
		await this.globals.service.setResolver(node);
		await this.globals.service.setAddr(node, environment.UniversityAddress);
		await this.globals.service.setReverse(
			normalName + environment.ENSDomain
		);
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

	async studentSelfRegister(_name: string): Promise<any> {
		this.txOn();
		if (_name.length < 1) {
			this.txMode = 'failedTX';
		} else {
			this.txMode = 'processingTX';
			const selfRegister = await this.globals.service.studentSelfRegister(
				_name,
				this.globals.useGSN
			);
			if (!selfRegister) {
				this.txMode = 'failedTX';
			} else {
				this.hashTx = selfRegister.hash;
				this.txMode = 'successTX';
			}
		}
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

	roleMembersAdmin: Map<string, Array<GenericUser>>;

	loadUniversityAdmin() {
		this.modeUniversityAdmin = 'unconnected';
		this.roleMembersAdmin = new Map<string, Array<GenericUser>>();
		this.getRoleMembers('DEFAULT_ADMIN_ROLE').then((result) => {
			this.roleMembersAdmin['DEFAULT_ADMIN_ROLE'] = result;
			if (
				this.roleMembersAdmin['DEFAULT_ADMIN_ROLE'].find(
					(element) => element.address == this.globals.address
				)
			)
				this.globals.userIsUniversityAdmin = true;
		});
		this.getRoleMembers('FUNDS_MANAGER_ROLE').then((result) => {
			this.roleMembersAdmin['FUNDS_MANAGER_ROLE'] = result;
		});
		this.getRoleMembers('CLASSLIST_ADMIN_ROLE').then((result) => {
			this.roleMembersAdmin['CLASSLIST_ADMIN_ROLE'] = result;
		});
		this.getRoleMembers('GRANTS_MANAGER_ROLE').then((result) => {
			this.roleMembersAdmin['GRANTS_MANAGER_ROLE'] = result;
		});
		this.getRoleMembers('UNIVERSITY_OVERSEER_ROLE').then((result) => {
			this.roleMembersAdmin['UNIVERSITY_OVERSEER_ROLE'] = result;
		});
		this.getRoleMembers('REGISTERED_SUPPLIER_ROLE').then((result) => {
			this.roleMembersAdmin['REGISTERED_SUPPLIER_ROLE'] = result;
		});
		this.getRoleMembers('STUDENT_IDENTITY_ROLE').then((result) => {
			this.roleMembersAdmin['STUDENT_IDENTITY_ROLE'] = result;
		});
		this.getRoleMembers('CLASSROOM_PROFESSOR_ROLE').then((result) => {
			this.roleMembersAdmin['CLASSROOM_PROFESSOR_ROLE'] = result;
		});
		this.getRoleMembers('READ_STUDENT_LIST_ROLE').then((result) => {
			this.roleMembersAdmin['READ_STUDENT_LIST_ROLE'] = result;
			this.modeUniversityAdmin = 'loaded';
		});
	}

	public async setUniversityOwner(param) {}

	public async setUniversityName(param) {}

	public async setUniversityCut(param) {}

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
