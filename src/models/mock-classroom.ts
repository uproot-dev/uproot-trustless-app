import { Classroom } from './classroom.model';

const date1 = Date.now()/1000;
const date2 = Date.now()/1000 + 24*60*60*10;
export const CLASSROOMS: Classroom[] = [
  new Classroom( 1, "Learn Solidity", "smartcontract", date1 , date2,10, 400, 0, 0.2*1e2, 0.5*1e2, true, true, false, false, "NONE", ""),
  new Classroom( 2, "Learn Dapp", "smartcontract", date1, date2,10, 300, 0, 0.2*1e2, 0.5*1e2, true, false, false, false, "NONE", ""),
  new Classroom( 3, "Learn Defi", "smartcontract", date1, date2,10, 300, 0, 0.2*1e2, 0.5*1e2, true, false, false, false, "NONE", ""),
  new Classroom( 4, "Learn Ethereum", "smartcontract", date1, date2,10, 500, 0, 0.2*1e2, 0.5*1e2, false, true, false, false, "NONE", ""),
  new Classroom( 5, "Learn Blockchain", "smartcontract", date1, date2,10, 200, 0, 0.2*1e2, 0.5*1e2, false, false, false, false, "NONE", ""),
];
