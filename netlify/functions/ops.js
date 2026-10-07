const {proxyEdge}=require('./_common');
const ACTIONS=new Set(['list','save','bot_context']);
exports.handler=(event)=>proxyEdge(event,'clinic-ops',ACTIONS,1024*1024);
