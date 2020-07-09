import { Injectable } from '@angular/core';
import Portis from '@portis/web3';
//import Web3 from 'web3';
import * as ethers from 'ethers';
import { environment } from '../../environments/environment';

import * as University from '../../../build/contracts/University.json';
import { Student } from 'src/models/student.model';
import { baseClientService } from './baseClient.service';

declare let window: any;
declare let ethereum: any;

@Injectable({
	providedIn: 'root',
})
export class PortisService extends baseClientService {
	public universityName: any;
	public account: any;

	public email: any;
	public loginAddress: any;
	public students: Student[] = [];

	portis = new Portis('2910345a-33c7-46e4-a5d3-6178db3c692d', 'ropsten', {
		scope: ['email'],
	});

	constructor() {
		super();
		this.useSigner = true;
	}

	async initPortis() {
		const provider = new ethers.providers.Web3Provider(
			this.portis.provider
		);
		await this.portis.provider.enable();
		await this.setupProvider(provider);
		this.networkName = await this.provider.getNetwork();
		const address = await this.getAddress();
		if (address === '') {
			console.warn('Not Connected!');
			return false;
		} else {
			console.log('Connected with Portis!');
			this.portis.onLogout(() => {
				console.log('User logged out');
				window.location.reload();
			  });
			this.portis.onActiveWalletChanged(walletAddress => {
				console.log('Active wallet address:', walletAddress);
				window.location.reload();
			  });
			return true;
		}
	}

	showPortis() {
		this.portis.showPortis();
	}
}
