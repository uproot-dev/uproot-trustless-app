// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
	production: false,
	connectMetamskForTests: false,
	UniversityAddress: '0xa03E45a84E253aE34C1298615cC3d140Bc69ECc9',
	InfuraKey: '50d52dadc1054facbb36bd19254da96e',
	network: 'ropsten',
	ENSRegistryAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
	ENSRegistrarAddress: '0x09B5bd82f3351A4c8437FC6D7772A9E6cd5D25A1', //TestRegistrar
	ENSPulbicResolverAddress: '0x42D63ae25990889E35F215bC95884039Ba354115', //TestResolver
	ENSReverseRegistrarAddress: '0x6F628b68b30Dc3c17f345c9dbBb1E483c2b7aE5c',
	ENSUniversityName: 'university',
	ENSDomain: '.test',
	WETHAddress: '0xc778417e063141139fce010982780140aa0cd5ab',
	DAIAddress: '0xf80A32A835F79D7787E8a8ee5721D0fEaFd78108',
	CompoundDAIAddress: '0x6ce27497a64fffb5517aa4aee908b1e7eb63b9ff',
	AaveDAIAddress: '0xcB1Fe6F440c49E9290c3eb7f158534c2dC374201',
	UniswapRouter: '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a',
	LINKAddress: '0x20fe562d797a42dcb3399062ae9546cd06f63280',
	ChainlinkOracleRandom: '0xc99B3D447826532722E41bc36e644ba3479E4365',
	ChainlinkRequestIdRandom: '0x243e52d19ebc4098bfc30d9d7117b91a00000000000000000000000000000000',
	ChainlinkOraclePaymentRandom: 1,
	ChainlinkOracleTimestamp: '0xc99B3D447826532722E41bc36e644ba3479E4365',
	ChainlinkRequestIdTimestamp: '0x2ebb1c1a4b1e4229adac24ee0b5f784f00000000000000000000000000000000',
	ChainlinkOraclePaymentTimestamp: 1,
	AaveLendingPoolAddressesProvider : '0x1c8756FD2B28e9426CDBDcC7E3c4d64fa9A54728',
	DefaultGasRelayHub: "0xEF46DD512bCD36619a6531Ca84B188b47D85124b",
	DefaultTestPaymaster: "0x663946D7Ea17FEd07BF1420559F9FB73d85B5B03",
	DefaultStakeManager: "0x41c7C7c1Bf501e2F43b51c200FEeEC87540AC925",
	UniversityFundAddress: "0x630991655036A034Ff4eB99daEc449661988404C",
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
 import 'zone.js/dist/zone-error';  // Included with Angular CLI.
