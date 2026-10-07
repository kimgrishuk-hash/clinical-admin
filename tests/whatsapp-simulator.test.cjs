const assert=require('node:assert/strict');const bot=require('../whatsapp-bot-core.js');
let s=bot.create();function send(t){const r=bot.respond(s,t);s=r.state;return r;}
assert.equal(send('').choices.length,5);send('1');send('דנה');send('לולה כלבה');send('בדיקה');const end=send('יום חמישי');assert.equal(s.handoff,true);assert.equal(s.details.owner,'דנה');assert.match(end.reply,/אינו תור מאושר/);assert.match(send('תפריט').reply,/מושהה/);
s=bot.create();send('1');send('דנה');send('קושי בנשימה');assert.equal(s.priority,'urgent');assert.equal(s.handoff,true);
s=bot.create();send('2');send('מה מינון התרופה?');assert.equal(s.handoff,true);assert.match(send('שלום').reply,/ממתינה/);
s=bot.create();assert.match(send('3').reply,/עדיין לא הוגדרו/);assert.match(bot.respond(bot.create(),'3',{hours:'9–15',address:'כתובת לבדיקה'}).reply,/9–15/);
s=bot.create();assert.equal(bot.menu.some(x=>x.includes('מחיר')),false);send('כמה עולה עיקור');assert.equal(s.handoff,true);
s=bot.create();send('5');assert.equal(s.handoff,true);
console.log('PASS: appointment, urgent override, medical handoff, prices, hours, paused bot');
