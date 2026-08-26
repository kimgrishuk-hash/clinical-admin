const {proxyEdge}=require('./_common');
const ACTIONS=new Set(['list','create','update','qty_adjust','delete','price_list','price_create','price_update','price_delete','quote_list','quote_save','quote_delete']);
exports.handler=(event)=>proxyEdge(event,'clinic-api',ACTIONS,768*1024);
