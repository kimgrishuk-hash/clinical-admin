const {proxyEdge}=require('./_common');
const ACTIONS=new Set(['list','get','create','update','comment','comment_update','comment_delete','close','reopen','delete']);
exports.handler=(event)=>proxyEdge(event,'clinic-tasks',ACTIONS,512*1024);
