const {proxyEdge}=require('./_proxy');
const ACTIONS=new Set(['list','create','update','qty_adjust','delete','price_list','price_create','price_update','price_delete','quote_list','quote_save','quote_delete']);
module.exports=(req,res)=>proxyEdge(req,res,'clinic-api',ACTIONS,768*1024);
