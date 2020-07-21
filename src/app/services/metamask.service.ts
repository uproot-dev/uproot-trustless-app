import { Injectable } from '@angular/core';
//import Web3 from 'web3';
import * as ethers from 'ethers';
import { environment } from '../../environments/environment';
import { baseClientService } from './baseClient.service';
import Web3 from 'web3';

const web3 = new Web3(Web3.givenProvider);

@Injectable({
	providedIn: 'root',
})
export class MetamaskService extends baseClientService {
	public networkName: any;

	constructor() {
		super();
		this.useSigner = true;
	}

	showWallet(){

	}
}
