const {proxyEdge}=require('./_common');
const ACTIONS=new Set(['bootstrap','changes_since']);
exports.handler=(event)=>proxyEdge(event,'clinic-sync',ACTIONS,512*1024);
