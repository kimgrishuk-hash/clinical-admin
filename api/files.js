const {proxyEdge}=require('./_proxy');
const ACTIONS=new Set(['prepare_upload','product_image','download_url','delete']);
module.exports=(req,res)=>proxyEdge(req,res,'clinic-files',ACTIONS,128*1024);
