const {proxyEdge}=require('./_proxy');
const ACTIONS=new Set(['list','save']);
module.exports=(req,res)=>proxyEdge(req,res,'clinic-ops',ACTIONS,1024*1024);
