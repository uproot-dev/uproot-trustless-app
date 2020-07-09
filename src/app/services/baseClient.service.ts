import { Injectable } from '@angular/core';
//import Web3 from 'web3';
import * as ethers from 'ethers';
import { environment } from '../../environments/environment';

import * as University from '../../../build/contracts/University.json';
import * as UniversityFund from '../../../build/contracts/UniversityFund.json';
import * as Classroom from '../../../build/contracts/Classroom.json';
import * as Student from '../../../build/contracts/Student.json';
import * as StudentApplication from '../../../build/contracts/StudentApplication.json';
import * as ERC20 from '../../../build/contracts/ERC20.json';
import * as CDAI from '../../../build/contracts/CERC20.json';
import * as ADAI from '../../../build/contracts/aToken.json';
import * as LINK from '../../../build/contracts/LinkTokenInterface.json';
import * as IUniswapV2Router01 from '../../../build/contracts/IUniswapV2Router01.json';
import { GenericUser } from '../../models/genericUser.model';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Injectable({
	providedIn: 'root',
})
export class baseClientService {
	public universityContractInstance: any;
	public classroomContractInstance: any;
	public studentContractInstance: any;
	public studentApplicationContractInstance: any;
	public universityFundContractInstance: any;
	public DAIContract: any;
	public CDAIContract: any;
	public ADAIContract: any;
	public LINKContract: any;
	public UniswapRouter: any;
	public provider: any;
	public networkName: any;
	public useSigner = false;

	portis: any;
	account: any;

	constructor() {}

	public async setupProvider(_provider) {
		this.provider = _provider;
		this.setupPublicTokens();
		await this.connectUniversity();
		await this.connectUniversityFund();
	}

	// Contracts setup

	public setupPublicTokens() {
		const providerOrSigner = this.useSigner
			? this.provider.getSigner()
			: this.provider;
		this.DAIContract = new ethers.Contract(
			environment.DAIAddress,
			ERC20.abi,
			providerOrSigner
		);
		this.CDAIContract = new ethers.Contract(
			environment.CompoundDAIAddress,
			CDAI.abi,
			providerOrSigner
		);
		this.ADAIContract = new ethers.Contract(
			environment.AaveDAIAddress,
			ADAI.abi,
			providerOrSigner
		);
		this.LINKContract = new ethers.Contract(
			environment.LINKAddress,
			LINK.abi,
			providerOrSigner
		);
		this.UniswapRouter = new ethers.Contract(
			environment.UniswapRouter,
			IUniswapV2Router01.abi,
			providerOrSigner
		);
	}

	async getAddress() {
		if (this.account) return this.account;
		const addresses = await this.provider.listAccounts();
		this.account = addresses[0];
		return this.account;
	}

	async connectUniversity() {
		const providerOrSigner = this.useSigner
			? this.provider.getSigner()
			: this.provider;
		if (this.checkContractInfo(environment.UniversityAddress, University))
			this.universityContractInstance = new ethers.Contract(
				environment.UniversityAddress,
				University.abi,
				providerOrSigner
			);
	}

	async connectUniversityFund() {
		const providerOrSigner = this.useSigner
			? this.provider.getSigner()
			: this.provider;
		if (
			this.checkContractInfo(
				environment.UniversityFundAddress,
				UniversityFund
			)
		)
			this.universityFundContractInstance = new ethers.Contract(
				environment.UniversityFundAddress,
				UniversityFund.abi,
				providerOrSigner
			);
	}

	async connectClassroom(address: string) {
		const providerOrSigner = this.useSigner
			? this.provider.getSigner()
			: this.provider;
		if (this.checkContractInfo(address, Classroom))
			this.classroomContractInstance = new ethers.Contract(
				address,
				Classroom.abi,
				providerOrSigner
			);
	}

	async connectStudent() {
		const providerOrSigner = this.useSigner
			? this.provider.getSigner()
			: this.provider;
		const smartContractAddress = await this.getStudentSmartContract();
		if (!smartContractAddress) throw 'Student not registered';
		if (this.checkContractInfo(smartContractAddress, Student))
			this.studentContractInstance = new ethers.Contract(
				smartContractAddress,
				Student.abi,
				providerOrSigner
			);
	}

	async connectStudentApplication(smartContractAddress: string) {
		const providerOrSigner = this.useSigner
			? this.provider.getSigner()
			: this.provider;
		if (this.checkContractInfo(smartContractAddress, StudentApplication))
			this.studentApplicationContractInstance = new ethers.Contract(
				smartContractAddress,
				StudentApplication.abi,
				providerOrSigner
			);
	}

	public checkContractInfo(address: string, file: any): boolean {
		if (!address || address.length < 40)
			throw new Error('invalid contract address!');
		if (!Classroom || !Classroom.abi)
			throw new Error(
				'invalid contract json, try to run truffle compile!'
			);
		if (this.provider) return true;
		else {
			console.warn('try to connect with portis!');
			this.provider = new ethers.providers.JsonRpcProvider(
				'http://localhost:8545'
			);
		}
		return false;
	}

	// View Token info

	public async getDAIBalance(address: string) {
		const val = await this.DAIContract.balanceOf(address);
		return val;
	}

	public async getLINKBalance(address: string) {
		const val = await this.LINKContract.balanceOf(address);
		return val;
	}

	// View Student info

	public async isStudentRegistred(): Promise<boolean> {
		const studentAdress = await this.getStudentSmartContract();
		if (!studentAdress) return false;
		const check = await this.universityContractInstance.studentIsRegistered(
			studentAdress
		);
		return check;
	}

	public async getStudentSmartContract() {
		try {
			const studentSmartContract = await this.universityContractInstance.myStudentAddress();
			return studentSmartContract;
		} catch (err) {
			console.warn('Student address not found: ' + err.toString());
		}
	}

	public async getStudentName() {
		const answer = await this.studentContractInstance.name();
		const val = ethers.utils.parseBytes32String(answer);
		return val;
	}

	public async getScore() {
		const val = await this.studentContractInstance.score();
		return val;
	}

	public async getApplications() {
		const applications = await this.universityContractInstance.viewMyApplications();
		return applications;
	}

	// View Classroom info

	public async getClassroomOwner() {
		const answer = await this.universityContractInstance.owner();
		return answer;
	}

	public async viewMyApplication() {
		const answer = await this.classroomContractInstance.viewMyApplication();
		return answer;
	}

	// view Student info

	public async viewMyStudentApplication(addressClassroom: string) {
		const answer = await this.studentContractInstance.viewMyApplication(
			addressClassroom
		);
		return answer;
	}

	public async viewMyApplicationState(classroomAddress: string) {
		const answer = await this.studentContractInstance.viewMyApplicationState(
			classroomAddress
		);
		return answer;
	}

	// view Student application info

	public async viewApplicationClassroomAddress() {
		const answer = await this.studentApplicationContractInstance.classroomAddress();
		return answer;
	}

	// View University info

	public async getUniversityOwner() {
		const answer = await this.universityContractInstance.owner();
		return answer;
	}

	public async getUniversityName() {
		const answer = await this.universityContractInstance.name();
		const val = ethers.utils.parseBytes32String(answer);
		return val;
	}

	public async getUniversityCut() {
		const answer = await this.universityContractInstance.cut();
		const val = answer / 1e4;
		return val;
	}

	public async getUniversityFunds() {
		const answer = await this.universityContractInstance.endowmentLocked();
		const val = ethers.utils.formatEther(answer);
		return val;
	}

	public async getUniversityBudget() {
		const answer = await this.universityContractInstance.operationalBudget();
		const val = ethers.utils.formatEther(answer);
		return val;
	}

	public async getUniversityDonations() {
		const answer = await this.universityContractInstance.donationsReceived();
		const val = ethers.utils.formatEther(answer);
		return val;
	}

	public async getUniversityRevenue() {
		const answer = await this.universityContractInstance.revenueReceived();
		const val = ethers.utils.formatEther(answer);
		return val;
	}

	public async getUniversityReturns() {
		const answer = await this.universityContractInstance.returnsReceived();
		const val = ethers.utils.formatEther(answer);
		return val;
	}

	public async getUniversityFund() {
		const answer = await this.universityContractInstance.universityFund();
		return answer;
	}

	public async getUniversityParams() {
		let text = '';
		text = text + (await this.universityContractInstance.daiToken()) + ',';
		text = text + (await this.universityContractInstance.cDAI()) + ',';
		text = text + (await this.universityContractInstance.relayHub()) + ',';
		text =
			text +
			(await this.universityContractInstance.classroomFactory()) +
			',';
		text =
			text +
			(await this.universityContractInstance.studentFactory()) +
			',';
		text =
			text +
			(await this.universityContractInstance.studentApplicationFactory()) +
			',';
		text =
			text + (await this.universityContractInstance.ensContract()) + ',';
		text =
			text +
			(await this.universityContractInstance.ensTestRegistrar()) +
			',';
		text =
			text +
			(await this.universityContractInstance.ensPublicResolver()) +
			',';
		text =
			text +
			(await this.universityContractInstance.ensReverseRegistrar());
		return text;
	}

	public async listRoles(
		role: string,
		contract = this.universityContractInstance
	) {
		let list: Array<GenericUser> = [];
		const roleBytes =
			role == 'DEFAULT_ADMIN_ROLE'
				? ethers.utils.formatBytes32String('')
				: ethers.utils.solidityKeccak256(['string'], [role]);
		const size = await contract.getRoleMemberCount(roleBytes);
		let index = 0;
		while (index < size) {
			const member = await contract.getRoleMember(roleBytes, index);
			list.push(new GenericUser(index, member));
			index++;
		}
		return list;
	}

	async getClassroomCount() {
		const roleBytes = ethers.utils.solidityKeccak256(
			['string'],
			['CLASSROOM_PROFESSOR_ROLE']
		);
		return await this.universityContractInstance.getRoleMemberCount(
			roleBytes
		);
	}

	async getClassroomInfo(index) {
		let title,
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
			owner;
		const roleBytes = ethers.utils.solidityKeccak256(
			['string'],
			['CLASSROOM_PROFESSOR_ROLE']
		);
		smartcontract = await this.universityContractInstance.getRoleMember(
			roleBytes,
			index
		);
		let classroomContractInstance = new ethers.Contract(
			smartcontract,
			Classroom.abi,
			this.provider
		);
		const answer = await classroomContractInstance.name();
		title = ethers.utils.parseBytes32String(answer);
		const priceWei = await classroomContractInstance.entryPrice();
		price = ethers.utils.formatEther(priceWei);
		minScore = await classroomContractInstance.minScore();
		cutPrincipal = await classroomContractInstance.principalCut();
		cutPool = await classroomContractInstance.poolCut();
		isOpen = await classroomContractInstance.openForApplication();
		isEmpty = await classroomContractInstance.isClassroomEmpty();
		isActive = await classroomContractInstance.classroomActive();
		isFinished = await classroomContractInstance.courseFinished();
		duration = await classroomContractInstance.duration();
		startDate = await classroomContractInstance.startDate();
		finishDate =
			startDate.toNumber() > 0
				? startDate.toNumber() + duration.toNumber()
				: 0;
		addressChallenge = await classroomContractInstance.challengeAddress();
		owner = await classroomContractInstance.owner();
		return [
			title,
			smartcontract,
			startDate.toNumber(),
			finishDate,
			duration.toNumber(),
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
		];
	}

	// Signed interactions with University contract

	public async setUniversityParams(params: string) {
		const paramsArray = params.split(',');
		await this.universityContractInstance.updateAddresses(...paramsArray);
	}

	async revokeRole(role: string, address: string) {
		if (role == 'DEFAULT_ADMIN_ROLE') return;
		const roleBytes = ethers.utils.solidityKeccak256(['string'], [role]);
		const transaction = await this.universityContractInstance.revokeRole(
			roleBytes,
			address
		);
		return transaction;
	}

	async grantRole(role: string, address: string) {
		const roleBytes =
			role == 'DEFAULT_ADMIN_ROLE'
				? ethers.utils.formatBytes32String('')
				: ethers.utils.solidityKeccak256(['string'], [role]);
		const transaction = await this.universityContractInstance.grantRole(
			roleBytes,
			address
		);
		return transaction;
	}

	public async studentSelfRegister(_name: string, gsn: boolean = false) {
		const name = ethers.utils.formatBytes32String(_name);
		const register = gsn
			? await this.universityContractInstance.studentSelfRegisterGSN(name)
			: await this.universityContractInstance.studentSelfRegister(name);
		return register;
	}

	public async studentUpdateName(newName: string) {
		const name = ethers.utils.formatBytes32String(newName);
		const register = await this.studentContractInstance.changeName(name);
		return register;
	}

	async createClassroom(
		_Owner: string,
		_Name: string,
		_Price: string,
		_Cutfromprincipal: number,
		_Cutfromsuccesspool: number,
		_Minimumscore: number,
		_Duration: number,
		_Challengeaddress: string
	) {
		await this.universityContractInstance.newClassRoom(
			_Owner,
			ethers.utils.formatBytes32String(_Name),
			Math.round(_Cutfromprincipal * 1e4),
			Math.round(_Cutfromsuccesspool * 1e4),
			Math.round(_Minimumscore),
			ethers.utils.parseEther(_Price),
			Math.round(_Duration * 60 * 60 * 24),
			_Challengeaddress
		);
	}

	async approveDAI(
		input: number,
		address: string = this.universityContractInstance.address
	) {
		const val = ethers.utils.parseEther(input.toString());
		const tx = await this.DAIContract.approve(address, val);
		return tx;
	}

	async donateDAI(input: number) {
		const val = ethers.utils.parseEther(input.toString());
		const tx = await this.universityContractInstance.donateDAI(val);
		return tx;
	}

	async grantFundAdmin(address: string) {
		const role = ethers.utils.solidityKeccak256(
			['string'],
			['FUNDS_MANAGER_ROLE']
		);
		await this.universityContractInstance.grantRoleFund(role, address);
	}

	async applyFunds(input: number) {
		const val = ethers.utils.parseEther(input.toString());
		const tx = await this.universityContractInstance.applyFunds(val);
		return tx;
	}

	async recoverFunds(input: number) {
		const val = ethers.utils.parseEther(input.toString());
		const tx = await this.universityContractInstance.recoverFunds(val);
		return tx;
	}

	// ENS Signed actions

	async registerInRegistrar(label: string) {
		const tx = await this.universityContractInstance.registerInRegistrar(
			ethers.utils.solidityKeccak256(['string'], [label]),
			environment.UniversityAddress
		);
	}

	async setResolver(node: string) {
		const tx = await this.universityContractInstance.setResolver(
			node,
			environment.ENSPulbicResolverAddress
		);
	}

	async setAddr(node: string, address: string) {
		const tx = await this.universityContractInstance.setAddressInResolver(
			node,
			address
		);
	}

	async setReverse(name: string) {
		const tx = await this.universityContractInstance.registerInReverseRegistrar(
			name
		);
	}

	public async setTxRecord(_node, key, text) {
		const tx = await this.universityContractInstance.setTextInResolver(
			_node,
			key,
			text,
			environment.ENSPulbicResolverAddress
		);
	}

	public async claimSubnodeClassroom(_node, label, owner, classroom) {
		const tx = await this.universityContractInstance.claimSubnodeClassroom(
			_node,
			ethers.utils.solidityKeccak256(['string'], [label]),
			owner,
			environment.ENSPulbicResolverAddress,
			0,
			classroom
		);
	}

	public async claimSubnodeStudent(_node, label, owner, student) {
		const tx = await this.universityContractInstance.claimSubnodeStudent(
			_node,
			ethers.utils.solidityKeccak256(['string'], [label]),
			owner,
			environment.ENSPulbicResolverAddress,
			0,
			student
		);
	}

	// Student actions

	public async applyToClassroom(classroomAddress: string) {
		const application = await this.studentContractInstance.applyToClassroom(
			classroomAddress
		);
		return application;
	}

	public async setAnswerSecret(classroomAddress: string, secret: string) {
		const secret32 = ethers.utils.formatBytes32String(secret);
		const answer = await this.studentContractInstance.setAnswerSecret(
			classroomAddress,
			secret32
		);
		return answer;
	}

	public async withdrawAllResultsFromClassroom(
		classroomAddress: string,
		studentAddress: string
	) {
		const withdraw = await this.studentContractInstance.withdrawAllResultsFromClassroom(
			classroomAddress,
			studentAddress
		);
		return withdraw;
	}

	public async payEntryPrice() {
		const tx = await this.studentApplicationContractInstance.payEntryPrice();
		return tx;
	}

	// Uniswap trades

	public async uniswapETHForDAI(
		units: string | number,
		addressReceiver: string,
		timestampsToWait: number = 60
	) {
		const route_buyDai = [environment.WETHAddress, environment.DAIAddress];
		const val = ethers.utils.parseEther(units.toString());
		const balanceEther = await this.provider.getBalance(this.getAddress());
		const etherVal = balanceEther.div(2);
		const tx = this.UniswapRouter.swapETHForExactTokens(
			val,
			route_buyDai,
			addressReceiver,
			timestampsToWait,
			{ value: etherVal }
		);
		return tx;
	}

	public async uniswapDAIForETH(
		units: string | number,
		addressReceiver: string,
		timestampsToWait: number = 60
	) {
		const route_sellDai = [environment.DAIAddress, environment.WETHAddress];
		const val = ethers.utils.parseEther(units.toString());
		const tx = this.UniswapRouter.swapExactTokensForETH(
			val,
			0,
			route_sellDai,
			addressReceiver,
			timestampsToWait
		);
		return tx;
	}

	// Direct contract interation

	public async balanceOfERC20(addressERC20: string, address: string) {
		const providerOrSigner = this.useSigner
			? this.provider.getSigner()
			: this.provider;
		const erc20 = new ethers.Contract(
			addressERC20,
			ERC20.abi,
			providerOrSigner
		);
		return await erc20.balanceOf(address);
	}

	public async transferERC20(
		addressERC20: string,
		address: string,
		val: number
	) {
		const erc20 = new ethers.Contract(
			addressERC20,
			ERC20.abi,
			this.provider.getSigner()
		);
		return await erc20.transfer(
			address,
			ethers.utils.parseEther(val.toString())
		);
	}
}
