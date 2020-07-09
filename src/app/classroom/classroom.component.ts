import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
//import * as skynet from '@nebulous/skynet';

import { Classroom } from 'src/models/classroom.model';
import { ModalService } from '../_modal';
import { Globals } from '../app.globals';

import { PortisService } from '../services/portis.service';
import { InfuraService } from '../services/infura.service';
import { environment } from 'src/environments/environment';
import { ENSService } from '../services/ens.service';
import { ethers } from 'ethers';
import * as Web3 from 'web3';
import { StudentApplication } from 'src/models/studentApplication.model';
import { Student } from 'src/models/student.model';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({
	selector: 'app-classroom',
	templateUrl: './classroom.component.html',
	styleUrls: ['./classroom.component.css'],
})
export class ClassroomComponent implements OnInit {
	focus;
	focus1;
	public form: FormGroup;
	displayNotice = true;
	public txMode = 'off';
	public hashTx: any;

	public myStudentApplication: StudentApplication;

	phase = -1;

	constructor(
		public globals: Globals,
		private modalService: ModalService,
		public portisService: PortisService,
		private ngxLoader: NgxUiLoaderService
	) {}

	async ngOnInit() {
		if (!this.globals.service) {
			this.globals.service = new InfuraService();
			this.globals.ensService.configureProvider(
				this.globals.service.provider,
				false
			);
			console.log('Connected to infura');
		}
		if (!this.globals.selectedClassroom) return;
		this.globals.service
			.connectClassroom(this.globals.selectedClassroom.smartcontract)
			.then(() => this.refreshClassroomInfo());
		this.checkApplication();
	}

	private checkApplication() {
		if (!this.globals.selectedStudent) return;
		this.phase = 0;
		this.globals.service.connectStudent().then(() => {
			this.globals.service
				.viewMyStudentApplication(
					this.globals.selectedClassroom.smartcontract
				)
				.then((address) => {
					this.globals.service
						.viewMyApplicationState(
							this.globals.selectedClassroom.smartcontract
						)
						.then(
							(state) => this.initApplication(address, state),
							() =>
								console.warn(
									'Student does not have an application'
								)
						);
				});
		});
	}

	private initApplication(address: string, state: any): any {
		this.myStudentApplication = new StudentApplication(
			this.globals,
			address,
			this.globals.address
		);
		this.myStudentApplication.connectService();
		this.myStudentApplication.updateState();
		this.myStudentApplication.classroomAddress = this.globals.selectedClassroom.smartcontract;
		this.myStudentApplication.state = state;
		//TODO: abstract service
		this.globals.service.studentContractInstance
			.viewChallengeMaterial(this.myStudentApplication.classroomAddress)
			.then(
				(material) => (this.myStudentApplication.material = material)
			);
		this.globals.service.studentApplicationContractInstance
			.verifyAnswer()
			.then(
				(correct: boolean) =>
					(this.myStudentApplication.correctAnswer = correct),
				() => {
					console.warn('Answer not found');
				}
			);

		this.updatePhase(state);
	}

	private updatePhase(stateBN: any) {
		const state = stateBN.toNumber();
		if (state > 2) {
			this.phase = 5;
			this.globals.service.getDAIBalance(this.myStudentApplication.address).then((val) => {
				if (val == 0) this.phase++;
			});
		} else {
			this.phase = state + 1;
			if (this.myStudentApplication.verifyAnswer) this.phase++;
		}
	}

	refreshApplication() {
		this.myStudentApplication.updateState().then(() => {
			this.globals.service
				.viewMyApplicationState(
					this.globals.selectedClassroom.smartcontract
				)
				.then((state) => {
					this.myStudentApplication.state = state;
					this.updatePhase(state);
				});
		});
	}

	openModal(id: string) {
		this.modalService.open(id);
	}
	closeModal(id: string) {
		this.modalService.close(id);
		this.ngOnInit();
		if (id == 'custom-modal-search-classroom')
			this.resetSearchClassroomModalErrorMsg();
	}

	closeNotice() {
		this.displayNotice = false;
	}

	txOn() {
		this.txMode = 'preTX';
	}

	txOff() {
		this.txMode = 'off';
	}

	searchClassroomModalErrorMsg = false;
	searchClassroomModalProgressMsg = false;

	resetSearchClassroomModalErrorMsg() {
		this.searchClassroomModalErrorMsg = false;
	}

	async searchForClassroomModal(address: string) {
		const found = await this.searchForClassroom(address);
		if (found) this.checkApplication();
	}

	private async searchForClassroom(address: string) {
		this.searchClassroomModalProgressMsg = true;
		await this.updateClassrooms();
		this.globals.classrooms.forEach((classroom) => {
			if (classroom.smartcontract === address) {
				this.modalService.close('custom-modal-search-classroom');
				this.globals.selectedClassroom = classroom;
				this.searchClassroomModalProgressMsg = false;
				return true;
			}
		});
		const node = address.includes('.')
			? this.globals.ensService.getNode(address)
			: this.globals.ensService.getSubNode(
					address.toLowerCase().replace(/\s/g, '')
			  );
		const ensAddress = await this.globals.ensService.lookupNodeAddress(
			node
		);
		this.globals.classrooms.forEach((classroom) => {
			if (classroom.smartcontract === ensAddress) {
				this.modalService.close('custom-modal-search-classroom');
				this.globals.selectedClassroom = classroom;
				this.searchClassroomModalProgressMsg = false;
				return true;
			}
		});
		this.searchClassroomModalProgressMsg = false;
		this.searchClassroomModalErrorMsg = true;
		return false;
	}

	async updateClassrooms() {
		let classroomCount = await this.globals.service.getClassroomCount();
		if (this.globals.classrooms.length == classroomCount) return;
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
			await this.refreshClassroomMetadata(newClassroom);
			index++;
		}
	}

	public refreshClassroomInfo() {
		this.globals.service
			.getClassroomInfo(this.globals.selectedClassroom.id)
			.then(
				([
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
				]) =>
					this.globals.selectedClassroom.setupInfo(
						this.globals.selectedClassroom.id,
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
					)
			);
		this.globals.service.getClassroomOwner().then((adminAddress) => {
			this.globals.userIsClassroomAdmin =
				this.globals.address == adminAddress;
			if (this.globals.userIsClassroomAdmin) {
				this.refreshClassroomConfigs();
				this.refreshClassroomParams();
				this.refreshClassroomData();
			}
			this.ngxLoader.stop();
		});
		this.refreshClassroomFunds();
		this.refreshClassroomMetadata();
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
		this.globals.ensService.configureProvider(this.portisService.provider);
		if (this.globals.selectedClassroom) {
			await this.portisService.connectClassroom(
				this.globals.selectedClassroom.smartcontract
			);
			const adminAddress = await this.portisService.getClassroomOwner();
			this.globals.userIsClassroomAdmin =
				this.globals.address == adminAddress;
		}
		const isRegistered = await this.globals.service.isStudentRegistred();
		if (!isRegistered) {
			this.globals.mode = 'connected';
			return;
		} else {
			this.globals.userIsStudent = true;
			this.globals.mode = 'registered';
			const studentSmartContract = await this.globals.service.getStudentSmartContract();
			this.onConnect(new Student(this.globals, studentSmartContract));
			this.checkApplication();
			return;
		}
	}

	onConnect(student: Student | void): void {
		if (student) this.globals.selectedStudent = student;
		else
			this.globals.selectedStudent = new Student(
				this.globals,
				this.globals.ADDR0
			);
	}

	async registerENSRecord() {
		const normalName = this.globals.selectedClassroom.title
			.toLowerCase()
			.replace(/\s/g, '');
		const node = this.globals.ensService.getSubNode(normalName);
		const hasRecord = await this.globals.ensService.hasRecord(node);
		if (!hasRecord)
			await this.teacherClaimSubnode(
				normalName,
				this.globals.address,
				this.globals.selectedClassroom.smartcontract
			);
		const nodeAddress = await this.globals.ensService.lookupNodeAddress(
			node
		);
		if (nodeAddress === this.globals.ADDR0)
			await this.globals.ensService.setAddr(
				node,
				this.globals.selectedClassroom.smartcontract
			);
		this.ngxLoader.stop();
	}

	async teacherClaimSubnode(label, owner, classroom) {
		const node = this.globals.ensService.node;
		const normalName = label.toLowerCase().replace(/\s/g, '');
		await this.globals.service.claimSubnodeClassroom(
			node,
			normalName,
			owner,
			classroom
		);
	}

	async setMetadataRecord(type: string, text: string) {
		const normalName = this.globals.selectedClassroom.title
			.toLowerCase()
			.replace(/\s/g, '');
		const node = this.globals.ensService.getSubNode(normalName);
		const tx = await this.globals.ensService.setTxRecord(type, text, node);
		this.ngxLoader.start();
		await tx.wait();
		this.ngxLoader.stop();
	}

	async refreshClassroomMetadata(
		classroom: Classroom = this.globals.selectedClassroom
	) {
		const normalName = classroom.title.toLowerCase().replace(/\s/g, '');
		const node = this.globals.ensService.getSubNode(normalName);
		const record = await this.globals.ensService.hasRecord(node);
		if (!record) return;
		classroom.metadata.ENSName =
			normalName +
			'.' +
			this.globals.ensService.name +
			this.globals.ensService.domain;
		classroom.metadata.email = await this.globals.ensService.getTxEmail(
			node
		);
		classroom.metadata.url = await this.globals.ensService.getTxURL(node);
		classroom.metadata.avatar = await this.globals.ensService.getTxAvatar(
			node
		);
		classroom.metadata.description = await this.globals.ensService.getTxDescription(
			node
		);
		classroom.metadata.notice = await this.globals.ensService.getTxNotice(
			node
		);
		classroom.ENSHasNotice = classroom.metadata.notice.length > 0;
		classroom.metadata.keywords = await this.globals.ensService.getTxKeywordsArray(
			node
		);
		classroom.metadata.skylink = await this.globals.ensService.getTxRecord(
			node,
			'skylink'
		);
	}

	warned = false;

	async uploadSkylink(files) {
		if (!this.warned){
			console.warn("Please upload the file to siasky and paste the record to register. We are working to fix this issue");
			this.warned = true;
			return;
		}
		// this.ngxLoader.start();
		// const file = files[0];
		// console.log(file);
		// const skylink = await skynet.UploadFile(
		// 	file,
		// 	skynet.DefaultUploadOptions
		// );
		// console.log(`Upload successful, skylink: ${skylink}`);
		// this.ngxLoader.stop();
	}

	downloadSkylink(skylink, filename) {
		if (!this.warned){
			console.warn("Please copy the link and download the file from siasky. We are working to fix this issue");
			this.warned = true;
			return;
		}
		// skynet.DownloadFile(
		// 	filename,
		// 	skylink,
		// 	skynet.DefaultDownloadOptions
		//);
	}

	refreshClassroomFunds(
		classroom: Classroom = this.globals.selectedClassroom
	) {
		this.globals.service
			.getDAIBalance(this.globals.selectedClassroom.smartcontract)
			.then(
				(val) =>
					(this.globals.selectedClassroom.funds.DAI = Number(
						ethers.utils.formatEther(val)
					))
			);
		this.globals.service
			.getLINKBalance(this.globals.selectedClassroom.smartcontract)
			.then(
				(val) =>
					(this.globals.selectedClassroom.funds.LINK = Number(
						ethers.utils.formatEther(val)
					))
			);
	}

	async exchangeDAI_LINK(val: number) {}

	async exchangeLINK_DAI(val: number) {}

	refreshClassroomConfigs(
		classroom: Classroom = this.globals.selectedClassroom
	) {
		//TODO: abstract service
		this.globals.service.classroomContractInstance
			.oracleRandom()
			.then(
				(val) =>
					(this.globals.selectedClassroom.configs.oracleRandom = val)
			);
		this.globals.service.classroomContractInstance
			.requestIdRandom()
			.then(
				(val) =>
					(this.globals.selectedClassroom.configs.requestIdRandom = val)
			);
		this.globals.service.classroomContractInstance
			.oraclePaymentRandom()
			.then(
				(val) =>
					(this.globals.selectedClassroom.configs.oraclePaymentRandom = val)
			);
		this.globals.service.classroomContractInstance
			.oracleTimestamp()
			.then(
				(val) =>
					(this.globals.selectedClassroom.configs.oracleTimestamp = val)
			);
		this.globals.service.classroomContractInstance
			.requestIdTimestamp()
			.then(
				(val) =>
					(this.globals.selectedClassroom.configs.requestIdTimestamp = val)
			);
		this.globals.service.classroomContractInstance
			.oraclePaymentTimestamp()
			.then(
				(val) =>
					(this.globals.selectedClassroom.configs.oraclePaymentTimestamp = val)
			);
		this.globals.service.classroomContractInstance
			.linkToken()
			.then(
				(val) =>
					(this.globals.selectedClassroom.configs.linkToken = val)
			);
		this.globals.service.classroomContractInstance
			.uniswapDAI()
			.then(
				(val) =>
					(this.globals.selectedClassroom.configs.uniswapDAI = val)
			);
		this.globals.service.classroomContractInstance
			.uniswapLINK()
			.then(
				(val) =>
					(this.globals.selectedClassroom.configs.uniswapLINK = val)
			);
		this.globals.service.classroomContractInstance
			.uniswapRouter()
			.then(
				(val) =>
					(this.globals.selectedClassroom.configs.uniswapRouter = val)
			);
		this.globals.service.classroomContractInstance
			.aaveProvider()
			.then(
				(val) =>
					(this.globals.selectedClassroom.configs.aaveProvider = val)
			);
		this.globals.service.classroomContractInstance
			.aaveLendingPool()
			.then(
				(val) =>
					(this.globals.selectedClassroom.configs.aaveLendingPool = val)
			);
		this.globals.service.classroomContractInstance
			.aaveLendingPoolCore()
			.then(
				(val) =>
					(this.globals.selectedClassroom.configs.aaveLendingPoolCore = val)
			);
		this.globals.service.classroomContractInstance
			.aTokenDAI()
			.then(
				(val) =>
					(this.globals.selectedClassroom.configs.aTokenDAI = val)
			);
	}

	refreshClassroomParams(
		classroom: Classroom = this.globals.selectedClassroom
	) {
		//TODO: abstract service
		this.globals.service.classroomContractInstance
			.compoundApplyPercentage()
			.then((val) => {
				this.globals.selectedClassroom.params.compoundApplyPercentage =
					val / 1e4;
				this.globals.selectedClassroom.params.aaveApplyPercentage =
					100 -
					this.globals.selectedClassroom.params
						.compoundApplyPercentage;
			});
	}

	refreshClassroomData(
		classroom: Classroom = this.globals.selectedClassroom
	) {
		//TODO: abstract service
		this.globals.service.classroomContractInstance
			.countNewApplications()
			.then(
				(val) =>
					(this.globals.selectedClassroom.classdata.students = val)
			);
		this.globals.service.classroomContractInstance
			.countReadyApplications()
			.then(
				(val) =>
					(this.globals.selectedClassroom.classdata.validStudents = val)
			);
		this.globals.service.classroomContractInstance
			.courseBalance()
			.then(
				(val) =>
					(this.globals.selectedClassroom.classdata.courseBalance =
						val / 1e18)
			);
		this.courseFunds();
	}

	private courseFunds() {
		let [aDAI, cDAI, aDAI_u, cDAI_u] = [0, 0, 0, 0];
		this.globals.service.ADAIContract.balanceOf(
			this.globals.selectedClassroom.smartcontract
		).then((balance) => {
			aDAI = balance / 1e18;
			this.globals.service.ADAIContract.principalBalanceOf(
				this.globals.selectedClassroom.smartcontract
			).then((balance) => {
				aDAI_u = balance / 1e18;
				this.globals.service.CDAIContract.balanceOf(
					this.globals.selectedClassroom.smartcontract
				).then((balance) => {
					cDAI = balance / 1e8;
					this.globals.service.CDAIContract.balanceOfUnderlying(
						this.globals.selectedClassroom.smartcontract
					).then((balance) => {
						cDAI_u = balance / 1e8;
						this.globals.selectedClassroom.classdata.fundsInvested =
							aDAI_u + cDAI_u;
						this.globals.selectedClassroom.classdata.investmentReturns =
							aDAI +
							cDAI -
							this.globals.selectedClassroom.classdata
								.fundsInvested;
					});
				});
			});
		});
	}

	openApplications() {
		this.globals.service.classroomContractInstance
			.openApplications()
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomInfo());
			});
	}

	closeApplications() {
		this.globals.service.classroomContractInstance
			.closeApplications()
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomInfo());
			});
	}

	applyDAI() {
		this.globals.service.classroomContractInstance
			.applyDAI({ gasLimit: 821000 })
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomInfo());
			});
	}

	beginCourse() {
		this.globals.service.classroomContractInstance
			.beginCourse(false)
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomInfo());
			});
	}

	finishCourse() {
		this.globals.service.classroomContractInstance
			.finishCourse({ gasLimit: 1210000 })
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomInfo());
			});
	}

	async processResults() {
		let tx;
		tx = await this.globals.service.classroomContractInstance.processResults();
		this.ngxLoader.start();
		await tx.wait();
		this.ngxLoader.stop();
		tx = await this.globals.service.classroomContractInstance.startAnswerVerification();
		this.ngxLoader.start();
		await tx.wait();
		this.ngxLoader.stop();
		tx = await this.globals.service.classroomContractInstance.accountValues();
		this.ngxLoader.start();
		await tx.wait();
		this.ngxLoader.stop();
		tx = await this.globals.service.classroomContractInstance.resolveStudentAllowances();
		this.ngxLoader.start();
		await tx.wait();
		this.ngxLoader.stop();
		tx = await this.globals.service.classroomContractInstance.resolveUniversityCut();
		this.ngxLoader.start();
		await tx.wait();
		this.ngxLoader.stop();
		tx = await this.globals.service.classroomContractInstance.updateStudentScores();
		this.ngxLoader.start();
		await tx.wait();
		this.ngxLoader.stop();
		tx = await this.globals.service.classroomContractInstance.endProcessResults();
		this.ngxLoader.start();
		await tx.wait();
		this.refreshClassroomInfo();
	}

	withdrawAllResults() {
		this.globals.service.classroomContractInstance
			.withdrawAllResults()
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomInfo());
			});
	}

	configureUniswap(
		uniswapDAI: string,
		uniswapLINK: string,
		uniswapRouter: string
	) {
		//TODO: abstract service
		uniswapDAI = uniswapDAI ? uniswapDAI : environment.DAIAddress;
		uniswapLINK = uniswapLINK ? uniswapLINK : environment.LINKAddress;
		uniswapRouter = uniswapRouter
			? uniswapRouter
			: environment.UniswapRouter;
		this.globals.service.classroomContractInstance
			.configureUniswap(uniswapDAI, uniswapLINK, uniswapRouter)
			.then((tx) => tx.wait().then(() => this.refreshClassroomConfigs()));
	}

	changeName(val) {
		this.globals.service.classroomContractInstance
			.changeName(val)
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomInfo());
			});
	}

	changePrincipalCut(percentage) {
		this.globals.service.classroomContractInstance
			.changePrincipalCut(percentage * 1e4)
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomInfo());
			});
	}

	changePoolCut(percentage) {
		this.globals.service.classroomContractInstance
			.changePoolCut(percentage * 1e4)
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomInfo());
			});
	}

	changeMinScore(val) {
		this.globals.service.classroomContractInstance
			.changeMinScore(val)
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomInfo());
			});
	}

	changeEntryPrice(val: string) {
		this.globals.service.classroomContractInstance
			.changeEntryPrice(ethers.utils.parseEther(val))
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomInfo());
			});
	}

	changeDuration(val) {
		this.globals.service.classroomContractInstance
			.changeDuration(val)
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomInfo());
			});
	}

	changeCompoundApplyPercentage(percentage) {
		this.globals.service.classroomContractInstance
			.changeCompoundApplyPercentage(percentage * 1e4)
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomInfo());
			});
	}

	changeChallenge(addr) {
		this.globals.service.classroomContractInstance
			.changeChallenge(addr)
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomInfo());
			});
	}

	configureOracles(
		oracleRandom: string,
		requestIdRandom: string,
		oraclePaymentRandom: number,
		oracleTimestamp: string,
		requestIdTimestamp: string,
		oraclePaymentTimestamp: number,
		linkToken: string
	) {
		//TODO: abstract service
		oracleRandom = oracleRandom
			? oracleRandom
			: environment.ChainlinkOracleRandom;
		requestIdRandom = requestIdRandom
			? requestIdRandom
			: environment.ChainlinkRequestIdRandom;
		oraclePaymentRandom = oraclePaymentRandom
			? oraclePaymentRandom
			: environment.ChainlinkOraclePaymentRandom;
		oracleTimestamp = oracleTimestamp
			? oracleTimestamp
			: environment.ChainlinkOracleTimestamp;
		requestIdTimestamp = requestIdTimestamp
			? requestIdTimestamp
			: environment.ChainlinkRequestIdTimestamp;
		oraclePaymentTimestamp = oraclePaymentTimestamp
			? oraclePaymentTimestamp
			: environment.ChainlinkOraclePaymentTimestamp;
		linkToken = linkToken ? linkToken : environment.LINKAddress;
		this.globals.service.classroomContractInstance
			.configureOracles(
				oracleRandom,
				requestIdRandom,
				oraclePaymentRandom,
				oracleTimestamp,
				requestIdTimestamp,
				oraclePaymentTimestamp,
				linkToken,
				true
			)
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomConfigs());
			});
	}

	configureAave(lendingPoolAddressesProvider: string) {
		lendingPoolAddressesProvider = lendingPoolAddressesProvider
			? lendingPoolAddressesProvider
			: environment.AaveLendingPoolAddressesProvider;
		this.globals.service.classroomContractInstance
			.configureAave(lendingPoolAddressesProvider)
			.then((tx) => {
				this.ngxLoader.start();
				tx.wait().then(() => this.refreshClassroomConfigs());
			});
	}

	async studentSelfRegister(_name: string): Promise<any> {
		this.txOn();
		if (_name.length < 1) {
			this.txMode = 'failedTX';
		} else {
			this.txMode = 'processingTX';
			const selfRegister = await this.globals.service.studentSelfRegister(
				_name
			);
			this.ngxLoader.start();
			if (!selfRegister) {
				this.txMode = 'failedTX';
			} else {
				await selfRegister.wait();
				this.hashTx = selfRegister.hash;
				this.txMode = 'successTX';
			}
		}
		this.ngxLoader.stop();
	}

	async applyClassroom(): Promise<any> {
		this.txOn();
		const classroomAddress = this.globals.selectedClassroom.smartcontract;
		if (classroomAddress == '') {
			this.txMode = 'failedTX';
		} else {
			this.txMode = 'processingTX';
			const application = await this.globals.service.applyToClassroom(
				classroomAddress
			);
			this.ngxLoader.start();
			if (!application) {
				this.txMode = 'failedTX';
			} else {
				await application.wait();
				this.hashTx = application.hash;
				this.txMode = 'successTX';
			}
		}
		this.ngxLoader.stop();
	}

	async approveStart(): Promise<any> {
		this.txOn();
		const value = this.globals.selectedClassroom.price;
		this.txMode = 'processingTX';
		const approve = await this.globals.service.approveDAI(
			value,
			this.myStudentApplication.address
		);
		this.ngxLoader.start();
		if (!approve) {
			this.txMode = 'failedTX';
		} else {
			await approve.wait();
			this.hashTx = approve.hash;
			this.txMode = 'successTX';
			this.allowanceMode = 2;
		}
		this.ngxLoader.stop();
	}

	allowanceMode = -1;

	checkAllowance() {
		if (this.allowanceMode > 0) return;
		this.globals.service.DAIContract.allowance(
			this.globals.address,
			this.myStudentApplication.address
		).then((val) => {
			if (
				Number(ethers.utils.formatEther(val)) >=
				this.globals.selectedClassroom.price
			) {
				this.allowanceMode = 2;
			} else {
				this.allowanceMode = 1;
			}
		});
	}

	async payPrice(): Promise<any> {
		this.txOn();
		this.txMode = 'processingTX';
		const pay = await this.globals.service.payEntryPrice();
		this.ngxLoader.start();
		if (!pay) {
			this.txMode = 'failedTX';
		} else {
			await pay.wait();
			this.hashTx = pay.hash;
			this.txMode = 'successTX';
			this.allowanceMode = 3;
			this.phase = 2;
		}
		this.ngxLoader.stop();
	}

	async sendAnswer(secret: string): Promise<any> {
		this.txOn();
		const classroomAddress = this.globals.selectedClassroom.smartcontract;
		if (classroomAddress == '' || secret == '') {
			this.txMode = 'failedTX';
		} else {
			this.txMode = 'processingTX';
			const sendTx = await this.globals.service.setAnswerSecret(
				classroomAddress,
				secret
			);
			this.ngxLoader.start();
			if (!sendTx) {
				this.txMode = 'failedTX';
			} else {
				await sendTx.wait();
				this.hashTx = sendTx.hash;
				this.txMode = 'successTX';
			}
		}
		this.ngxLoader.stop();
	}

	async colletcReward(): Promise<any> {
		this.txOn();
		const classroomAddress = this.globals.selectedClassroom.smartcontract;
		const studentAddress = this.globals.address;
		if (classroomAddress == '' || studentAddress == '') {
			this.txMode = 'failedTX';
		} else {
			this.txMode = 'processingTX';
			const collectTx = await this.globals.service.withdrawAllResultsFromClassroom(
				classroomAddress,
				studentAddress
			);
			this.ngxLoader.start();
			if (!collectTx) {
				this.txMode = 'failedTX';
			} else {
				await collectTx.wait();
				this.hashTx = collectTx.hash;
				this.txMode = 'successTX';
			}
		}
		this.ngxLoader.stop();
	}
}
