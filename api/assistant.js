const {proxyEdge}=require('./_proxy');
const ACTIONS=new Set(['reminders_list','reminder_save','reminder_done','reminder_snooze','reminder_delete','inbox_list','inbox_update','connection_status']);
module.exports=(req,res)=>proxyEdge(req,res,'clinic-assistant',ACTIONS,512*1024);
