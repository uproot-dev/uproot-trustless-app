import { Component, OnInit } from '@angular/core';
import { Globals } from '../app.globals';
import { InfuraService } from '../services/infura.service';
import { environment } from 'src/environments/environment';
import { ValueConverter } from '@angular/compiler/src/render3/view/template';
import { ethers } from 'ethers';
import { promise } from 'protractor';

@Component({
	selector: 'fund',
	templateUrl: './fund.component.html',
	styleUrls: ['./fund.component.css'],
})
export class FundComponent implements OnInit {
	constructor(public globals: Globals) {}

	userIsFundManager = false;

	assetsData = {
		DAI: 0,
		ETH: 0,
		USDC: 0,
		TUSD: 0,
		USDT: 0,
		BUSD: 0,
		LEND: 0,
		BAT: 0,
		KNC: 0,
		LINK: 0,
		MANA: 0,
		MKR: 0,
		REP: 0,
		WBTC: 0,
		ZRX: 0,
	};

	addressERC20 = {
		DAI: '0xf80A32A835F79D7787E8a8ee5721D0fEaFd78108',
		ETH: '0x0000000000000000000000000000000000000000',
		USDC: '0x851dEf71f0e6A903375C1e536Bd9ff1684BAD802',
		TUSD: '0xa51EE1845C13Cb03FcA998304b00EcC407fc1F92',
		USDT: '0xB404c51BBC10dcBE948077F18a4B8E553D160084',
		BUSD: '0xFA6adcFf6A90c11f31Bc9bb59eC0a6efB38381C6',
		LEND: '0x217b896620AfF6518B9862160606695607A63442',
		BAT: '0x85B24b3517E3aC7bf72a14516160541A60cFF19d',
		KNC: '0xCe4aA1dE3091033Ba74FA2Ad951f6adc5E5cF361',
		LINK: '0x1a906E71FF9e28d8E01460639EB8CF0a6f0e2486',
		MANA: '0x78b1F763857C8645E46eAdD9540882905ff32Db7',
		MKR: '0x2eA9df3bABe04451c9C3B06a2c844587c59d9C37',
		REP: '0xBeb13523503d35F9b3708ca577CdCCAdbFB236bD',
		WBTC: '0xa0E54Ab6AA5f0bf1D62EC3526436F3c05b3348A0',
		ZRX: '0x02d7055704EfF050323A2E5ee4ba05DB2A588959',
	};

	investmentData = {
		cDAI: 0,
		aDAI: 0,
	};

	investmentResultsData = {
		'Compound Underlying DAI': 0,
		'Aave Underlying DAI': 0,
	};

	compoundColateral = 0;

	compoundBorrowData = {
		DAI: 0,
		ETH: 0,
		USDC: 0,
		TUSD: 0,
		USDT: 0,
		BUSD: 0,
		LEND: 0,
		BAT: 0,
		KNC: 0,
		LINK: 0,
		MANA: 0,
		MKR: 0,
		REP: 0,
		WBTC: 0,
		ZRX: 0,
	};

	aaveColateral = 0;

	aaveBorrowData = {
		DAI: 0,
		ETH: 0,
		USDC: 0,
		TUSD: 0,
		USDT: 0,
		BUSD: 0,
		LEND: 0,
		BAT: 0,
		KNC: 0,
		LINK: 0,
		MANA: 0,
		MKR: 0,
		REP: 0,
		WBTC: 0,
		ZRX: 0,
	};

	uniswapData = {
		'ETH-DAI': 0,
		'DAI-USDC': 0,
		'DAI-TUSD': 0,
		'DAI-USDT': 0,
		'DAI-BUSD': 0,
		'DAI-LEND': 0,
		'DAI-BAT': 0,
		'DAI-KNC': 0,
		'DAI-LINK': 0,
		'DAI-MANA': 0,
		'DAI-MKR': 0,
		'DAI-REP': 0,
		'DAI-WBTC': 0,
		'DAI-ZRX': 0,
	};

	ngOnInit(): void {
		if (!this.globals.service) {
			this.globals.service = new InfuraService();
			this.globals.ensService.configureProvider(
				this.globals.service.provider,
				false
			);
			console.log('Connected to infura');
		}
		this.delay(1000).then(() => {
			this.refreshInfo();
			setInterval(() => {
				this.refreshInfo();
			}, 10000);
		});
	}

	delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	refreshInfo() {
		this.getRoleMembers('FUNDS_MANAGER_ROLE').then((result) => {
			if (
				result &&
				result.find(
					(element) => element.address == this.globals.address
				)
			)
				this.userIsFundManager = true;
		});
		for (let key in this.addressERC20) {
			let erc20Address = this.addressERC20[key];
			this.balanceOf(
				erc20Address,
				environment.UniversityFundAddress
			).then(
				(val) =>
					(this.assetsData[key] = Number(
						ethers.utils.formatEther(val)
					))
			);
		}
		this.globals.service.ADAIContract.balanceOf(
			environment.UniversityFundAddress
		).then((balance) => (this.investmentData.aDAI = balance / 1e18));
		this.globals.service.ADAIContract.principalBalanceOf(
			environment.UniversityFundAddress
		).then(
			(balance) =>
				(this.investmentResultsData['Aave Underlying DAI'] =
					balance / 1e18)
		);
		this.globals.service.CDAIContract.balanceOf(
			environment.UniversityFundAddress
		).then((balance) => (this.investmentData.cDAI = balance / 1e8));
		this.globals.service.CDAIContract.balanceOfUnderlying(
			environment.UniversityFundAddress
		).then(
			(balance) =>
				(this.investmentResultsData['Compound Underlying DAI'] =
					balance / 1e8)
		);
	}

	async getRoleMembers(role: string) {
		return await this.globals.service.listRoles(
			role,
			this.globals.service.universityFundContractInstance
		);
	}

	operationSize: string;

	setOperationSize(value: string) {
		this.operationSize = value;
	}

	async balanceOf(erc20Address: string, address: string): Promise<number> {
		if (erc20Address == this.globals.ADDR0)
			return this.globals.service.provider.getBalance(address);
		return this.globals.service.balanceOfERC20(erc20Address, address);
	}

	async withdrawToken(identifier: string, value: string) {
		const erc20Address = this.addressERC20[identifier];
		if (erc20Address == this.globals.ADDR0) return;
		const tx = await this.globals.service.transferERC20(
			erc20Address,
			this.globals.address,
			Number(value)
		);
	}

	async deposit(identifier: string, value: string) {
		const val = ethers.utils.parseEther(value);
		let tx;
		if (identifier == 'aDAI') {
			tx = await this.globals.service.universityFundContractInstance.applyFundsAave(
				val,
				{ gasLimit: 850000 }
			);
		} else if (identifier == 'cDAI') {
			tx = await this.globals.service.universityFundContractInstance.applyFundsCompound(
				val,
				{ gasLimit: 850000 }
			);
		}
		await tx.wait();
	}

	async redeem(identifier: string, value: string) {
		const val = ethers.utils.parseEther(value);
		let tx;
		if (identifier == 'aDAI') {
			tx = await this.globals.service.universityFundContractInstance.recoverFundsAave(
				val,
				{ gasLimit: 850000 }
			);
		} else if (identifier == 'cDAI') {
			tx = await this.globals.service.universityFundContractInstance.recoverFundsCompound(
				val,
				{ gasLimit: 850000 }
			);
		}
		await tx.wait();
	}

	enterMarket(identifier: string, val: string, compound: boolean) {
		//TODO:
	}

	exitMarket(identifier: string, val: string, compound: boolean) {
		//TODO:
	}

	borrow(identifier: string, value: string) {
		//TODO:
	}

	repay(identifier: string, value: string) {
		//TODO:
	}

	provide(identifier: string, value: string) {
		//TODO:
	}

	remove(identifier: string, value: string) {
		//TODO:
	}

	swap(identifier: string, value: string, swapA_B: boolean) {
		//TODO:
	}
}
