const {proxyEdge}=require('./_common');
const ACTIONS=new Set(['reminders_list','reminder_save','reminder_done','reminder_snooze','reminder_delete','inbox_list','inbox_update','connection_status']);
exports.handler=(event)=>proxyEdge(event,'clinic-assistant',ACTIONS,512*1024);
