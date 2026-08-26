const {proxyEdge}=require('./_common');
const ACTIONS=new Set(['prepare_upload','product_image','download_url','delete']);
exports.handler=(event)=>proxyEdge(event,'clinic-files',ACTIONS,128*1024);
