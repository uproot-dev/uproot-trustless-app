import { Injectable } from '@angular/core';
//import Web3 from 'web3';
import * as ethers from 'ethers';
import { environment } from '../../environments/environment';
import { baseClientService } from './baseClient.service';
import Web3 from 'web3';

const web3 = new Web3(Web3.givenProvider);

declare let window: any;
declare let ethereum: any;

@Injectable({
	providedIn: 'root',
})
export class MetamaskService extends baseClientService {
	public networkName: any;

	constructor() {
		super();
		const provider = new ethers.providers.Web3Provider(window.ethereum);
		window.ethereum.enable();
		this.useSigner = true;
		this.setupProvider(provider);
		console.log('Connected to metamask');
	}

	showPortis(){

	}
}
