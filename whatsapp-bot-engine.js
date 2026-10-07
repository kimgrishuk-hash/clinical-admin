(function(root){
'use strict';
const menu=['בקשת תור','חיסונים וטיפולים','בירור מחיר','שעות וכתובת','מקרה דחוף','נציגת המרפאה'];
const defaults={name:'המרפאה של ד״ר לזר',phone:'052-215-5032',hours:'',address:'',prices:''};
const normalize=s=>String(s||'').trim().replace(/\s+/g,' ');
function create(config={}){return {config:{...defaults,...config},stage:'menu',request:{},handoff:false,priority:'normal'};}
function greeting(state){return `שלום 👋 הגעתם ל${state.config.name}. זהו עוזר אוטומטי. במה אפשר לעזור?\n`+menu.map((x,i)=>`${i+1}. ${x}`).join('\n');}
function handoff(state,text,priority='normal'){state.stage='human';state.handoff=true;state.priority=priority;return {text,handoff:true,priority};}
function receive(state,input){
 const text=normalize(input);if(!text)return {text:'אנא כתבו הודעה או בחרו אפשרות.'};
 // Explicit requests for a person or urgent routing always override form collection.
 if(/^(5|מקרה דחוף)$/.test(text)||/דחוף|חירום|לא נושם|לא נושמת|קשיי נשימה|התמוטט|פרכוס|הרעל|דימום רב/.test(text))return handoff(state,`אם מדובר במצב דחוף, התקשרו עכשיו למרפאה: ${state.config.phone}. אם אין מענה, פנו למוקד חירום וטרינרי. אל תמתינו לתשובה בצ׳אט.\nבהדגמה הפנייה מסומנת כדחופה בלבד; אין צוות שמקבל אותה.`, 'urgent');
 if(/^(6|נציגת המרפאה)$/.test(text)||/נציג|אנושי|בן אדם|רופא|רפואי|תרופה|מינון/.test(text))return handoff(state,'בהדגמה הפנייה ממתינה לנציגה. הבוט הושהה בשיחה הזאת. ניתן לנסות תשובה ידנית בצד הצוות.');
 if(state.handoff)return {text:null,handoff:true};
 if(/^(תפריט|התחלה|ביטול|0)$/.test(text)){state.stage='menu';state.request={};return {text:greeting(state)};}
 const prompts={owner:['owner','מה שם חיית המחמד, והאם מדובר בכלב, חתול או חיה אחרת?','pet'],pet:['pet','מה סיבת הבקשה לתור?','reason'],reason:['reason','איזה יום ושעה נוחים לכם? זו בקשה בלבד, בכפוף לאישור המרפאה.','time']};
 if(prompts[state.stage]){const [key,prompt,next]=prompts[state.stage];state.request[key]=text;state.stage=next;return {text:prompt};}
 if(state.stage==='time'){state.request.time=text;const request={...state.request};const r=handoff(state,'בקשת התור נרשמה בהדגמה וממתינה לאישור צוות. לא נקבע תור ביומן המרפאה.');return {...r,request};}
 if(text==='1'||/תור/.test(text)){state.stage='owner';return {text:'נאסוף בקשה לתור. אפשר לכתוב ״ביטול״ בכל שלב.\nמה שמכם?'};}
 if(text==='2'||text===menu[1]||/חיסון|טיפול/.test(text))return handoff(state,'צוות המרפאה יעזור בבירור החיסון או הטיפול המתאים. בהדגמה הפנייה ממתינה לצוות.');
 if(text==='3'||/מחיר|עלות/.test(text)){if(state.config.prices)return {text:`מידע למחירים שאושר לצורך הניסוי:\n${state.config.prices}\nמחיר סופי ייקבע על ידי המרפאה בהתאם לטיפול. לקבלת הצעת מחיר אישית בחרו 6.`};return handoff(state,'עדיין לא הוגדר מחירון מאושר לבוט. בהדגמה הבירור ממתין לצוות.');}
 if(text==='4'||/שעות|כתובת|פתוח|איפה/.test(text))return {text:`שעות פעילות: ${state.config.hours||'טרם הוזנו לניסוי'}\nכתובת: ${state.config.address||'טרם הוזנה לניסוי'}\nטלפון: ${state.config.phone}`};
 return {text:greeting(state)};
}
const api={create,receive,greeting,menu,defaults};
if(typeof module==='object'&&module.exports)module.exports=api;else root.ClinicWhatsAppBot=api;
})(typeof window!=='undefined'?window:globalThis);
