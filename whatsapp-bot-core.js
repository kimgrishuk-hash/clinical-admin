/* Transport-independent bot logic. No network, billing, storage or AI calls. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ClinicWhatsAppBot=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 const menu=['קביעת תור','שאלה רפואית','בירור מחיר','שעות וכתובת','מקרה דחוף','נציגת המרפאה'];
 const urgent=/מקרה דחוף|חירום|לא נושם|לא נושמת|קושי בנשימה|קשיי נשימה|מתעלף|התעלף|פרכוס|פרכוסים|דימום רב|אכל רעל|אכלה רעל|הרעלה|לא מצליח להשתין|לא מצליחה להשתין/;
 function create(){return {stage:'menu',topic:'',details:{},handoff:false,priority:'normal'};}
 function respond(state,input,config={}){
  const s={...state,details:{...state.details}}, text=String(input||'').trim().slice(0,2000);
  const result=(reply,choices=[])=>({state:s,reply,choices});
  const transfer=(topic,priority='normal')=>{s.handoff=true;s.stage='handoff';s.topic=topic;s.priority=priority;};
  const emergency=()=>{transfer('מקרה דחוף','urgent');return result('אם זה מקרה דחוף, התקשרו מיד למרפאה'+(config.phone?' בטלפון '+config.phone:'')+'. אין להמתין לתשובה בצ׳אט. אם אין מענה, פנו למוקד וטרינרי חירום. בפעילות אמיתית הפנייה תסומן כדחופה לצוות.');};
  if(urgent.test(text))return emergency();
  if(s.handoff)return result('השיחה ממתינה לנציגת המרפאה. הבוט מושהה עד שהצוות יטפל בפנייה.');
  if(!text||/^(תפריט|היי|שלום|התחלה|חזרה)$/.test(text)){s.stage='menu';return result(config.greeting||'היי! הגעתם למרפאה הווטרינרית של ד״ר לזר. במה אפשר לעזור?',menu);}
  const choice=menu[Number(text)-1]||text;
  if(choice==='מקרה דחוף')return emergency();
  if(/נציג|רופא|אנושי/.test(choice)){transfer('נציגת המרפאה');return result('בפעילות אמיתית הפנייה תועבר לנציגת המרפאה. מענה יינתן בהתאם לזמינות הצוות.');}
  if(s.stage==='appointment_name'){s.details.owner=text;s.stage='appointment_pet';return result('מה שם בעל החיים והאם מדובר בכלב, חתול או בעל חיים אחר?');}
  if(s.stage==='appointment_pet'){s.details.pet=text;s.stage='appointment_reason';return result('מה סיבת הביקור?');}
  if(s.stage==='appointment_reason'){s.details.reason=text;s.stage='appointment_time';return result('לאיזה יום ושעה תרצו להגיע? הצוות יבדוק זמינות.');}
  if(s.stage==='appointment_time'){s.details.preferredTime=text;transfer('בקשת תור');return result('בקשת התור הושלמה בהדגמה. זה עדיין אינו תור מאושר — הצוות צריך לבדוק זמינות ולשלוח אישור.');}
  if(s.stage==='medical'){s.details.description=text;transfer('שאלה רפואית','high');return result('בפעילות אמיתית השאלה תועבר לצוות הרפואי. הבוט אינו נותן אבחנות, מינונים או אישור לתרופות. במקרה של החמרה או חשש לחירום, התקשרו מיד.');}
  if(s.stage==='price'){s.details.service=text;transfer('בירור מחיר');return result('בפעילות אמיתית הצוות יבדוק את המחיר לשירות המבוקש ויחזור אליכם. עדיין לא הוגדר מחירון מאושר לבוט.');}
  if(choice==='קביעת תור'||/תור|חיסון/.test(choice)){s.topic='בקשת תור';s.stage='appointment_name';return result('בשמחה. מה השם שלכם?');}
  if(choice==='שאלה רפואית'||/רפוא|הקיא|מקיא|שלשול|כואב|תרופה|מינון|אפוקוול/.test(choice)){s.topic='שאלה רפואית';s.stage='medical';return result('מה שם בעל החיים ומה הבעיה? כתבו גם מתי התחילה. השאלה תועבר לצוות הרפואי.');}
  if(choice==='בירור מחיר'||/מחיר|כמה עולה/.test(choice)){s.topic='בירור מחיר';s.stage='price';return result('לאיזה טיפול או שירות תרצו לברר מחיר?');}
  if(choice==='שעות וכתובת'||/שעות|כתובת|פתוח/.test(choice))return result(config.hours&&config.address?'שעות פעילות: '+config.hours+'\nכתובת: '+config.address:'שעות הפעילות והכתובת עדיין לא הוגדרו להדגמה. אפשר לבחור נציגת מרפאה לבירור.',menu);
  return result('לא הצלחתי לזהות את הבקשה. בחרו אפשרות או כתבו “נציגת המרפאה”.',menu);
 }
 return {create,respond,menu};
});
