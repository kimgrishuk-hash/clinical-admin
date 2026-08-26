const {proxyEdge}=require('./_common');
const ACTIONS=new Set(['list','create','comment','close','reopen','delete']);
exports.handler=(event)=>proxyEdge(event,'clinic-tasks',ACTIONS,512*1024);
