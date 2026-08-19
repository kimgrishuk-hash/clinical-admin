const {proxyEdge}=require('./_proxy');
const ACTIONS=new Set(['list','create','comment','close','reopen','delete']);
module.exports=(req,res)=>proxyEdge(req,res,'clinic-tasks',ACTIONS,512*1024);
