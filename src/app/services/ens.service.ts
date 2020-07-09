import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import * as ENSRegistry from '../../../build/contracts/ENSRegistry.json';
import * as ENSRegistrar from '../../../build/contracts/ENSRegistrar.json';
import * as ENSReverseRegistrar from '../../../build/contracts/ENSReverseRegistrar.json';
import * as ENSPublicResolver from '../../../build/contracts/ENSPublicResolver.json';
import * as ethers from 'ethers';

@Injectable({
	providedIn: 'root',
})
export class ENSService {
	provider: any;
	ens: any;
	domain = environment.ENSDomain;
	name = environment.ENSUniversityName;
	registrarContract: any;
	reverseRegistrarContract: any;
	reverseResolverContract: any;
	resolverContract: any;
	address: any;
	node = ethers.utils.namehash(this.name + this.domain);

	constructor() {}

	public getNode(name: string): string{
		return ethers.utils.namehash(name);
	}

	public getSubNode(label: string): string{
		return this.getNode(label + '.' + this.name + this.domain);
	}

	public async configureProvider(service, setupAccount = true) {
		this.provider = service;
		this.ens = new ethers.Contract(
			environment.ENSRegistryAddress,
			ENSRegistry.abi,
			setupAccount ? this.provider.getSigner() : this.provider
		);
		this.registrarContract = new ethers.Contract(
			environment.ENSRegistrarAddress,
			ENSRegistrar.abi,
			setupAccount ? this.provider.getSigner() : this.provider
		);
		this.reverseRegistrarContract = new ethers.Contract(
			environment.ENSReverseRegistrarAddress,
			ENSReverseRegistrar.abi,
			setupAccount ? this.provider.getSigner() : this.provider
		);
		await this.reverseRegistrarContract.deployed();
		const reverseResolverAddress = await this.reverseRegistrarContract.defaultResolver();
		this.reverseResolverContract = new ethers.Contract(
			reverseResolverAddress,
			ENSPublicResolver.abi,
			setupAccount ? this.provider.getSigner() : this.provider
		);
		this.resolverContract = new ethers.Contract(
			environment.ENSPulbicResolverAddress,
			ENSPublicResolver.abi,
			setupAccount ? this.provider.getSigner() : this.provider
		);
		await this.resolverContract.deployed();
		if (setupAccount)
			this.provider.listAccounts().then((addresses) => {
				this.address = addresses[0];
			});
	}

	public async registeredTimeToLive(): Promise<Date> {
		const ttl = await this.registrarContract.expiryTimes(
			ethers.utils.formatBytes32String(name)
		);
		return new Date(ttl * 1000);
	}

	public async setName(name: string, address: string) {
		await this.resolverContract.setAddr(
			ethers.utils.namehash(name + this.domain),
			address
		);
	}

	public async setAddr(node: string, address: string) {
		await this.resolverContract.setAddr(node,
			address
		);
	}

	public async registerRecord(label: string, owner: string) {
		return await this.ens.register(ethers.utils.namehash(label), owner);
	}

	public async setSubnodeRecord(label: string, owner: string, resolver = environment.ENSPulbicResolverAddress, ttl = 0, _node = this.node) {
		return await this.ens.setSubnodeRecord(_node, ethers.utils.formatBytes32String(label), owner, resolver, ttl)
	}

	public async hasRecord(node: string): Promise<boolean> {
		return await this.ens.recordExists(node);
	}

	public async lookupAddress(address: string): Promise<string> {
		const node = await this.reverseRegistrarContract.node(address);
		const name = await this.reverseResolverContract.name(node);
		return name;
	}

	public async lookupAddressNode(address: string): Promise<string> {
		return await this.reverseRegistrarContract.node(address);
	}

	public async lookupNodeAddress(node: string): Promise<string> {
		return await this.resolverContract.addr(node);
	}

	public async getResolverContract(node: string, sign: boolean) {
		if (node === this.node) return this.resolverContract;
		const address = await this.ens.resolver(node);
		const contract = new ethers.Contract(
			address,
			ENSPublicResolver.abi,
			sign ? this.provider.getSigner() : this.provider
		);
		await contract.deployed();
		return contract;
	}

	public async setTxRecord(key, text, _node = this.node) {
		const contract = await this.getResolverContract(_node, true);
		return await contract.setText(_node, key, text);
	}

	public async getTxRecord(_node, key): Promise<string> {
		const contract = await this.getResolverContract(_node, false);
		return await contract.text(_node, key);
	}

	public async getTxEmail(_node = this.node): Promise<string> {
		return await this.getTxRecord(_node, 'email');
	}

	public async getTxURL(_node = this.node): Promise<string> {
		return await this.getTxRecord(_node, 'url');
	}

	public async getTxAvatar(_node = this.node): Promise<string> {
		return await this.getTxRecord(_node, 'avatar');
	}

	public async getTxDescription(_node = this.node): Promise<string> {
		return await this.getTxRecord(_node, 'description');
	}

	public async getTxNotice(_node = this.node): Promise<string> {
		return await this.getTxRecord(_node, 'notice');
	}

	public async getTxKeywordsString(_node = this.node): Promise<string> {
		return await this.getTxRecord(_node, 'keywords');
	}

	public async getTxKeywordsArray(_node = this.node): Promise<Array<string>> {
		const val = await this.getTxKeywordsString(_node);
		return val.split(',');
	}

	public async checkENSRecord(_node = this.node): Promise<boolean> {
		return await this.ens.recordExists(_node);
	}

	public async getTTL() {
		return '';
		//TODO:
	}
}
