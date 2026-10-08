const TOPIC_TEXT = {
  'תוצאות בדיקות': 'המייל עוסק בתוצאות בדיקות.',
  'פניות רפואיות': 'המייל כולל פנייה רפואית לבדיקה של הצוות.',
  'תורים וקבלה': 'המייל עוסק בתור או בנושא קבלה.',
  'חשבוניות ותשלומים': 'המייל עוסק בחשבונית או בתשלום.',
  'ספקים והזמנות': 'המייל עוסק בספק, הזמנה או משלוח.',
  'מערכות ופרסום': 'המייל עוסק במערכת או בפרסום.',
  'כללי': 'המייל עוסק בנושא כללי.'
};

export function decodeHtmlEntities(value = '') {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  let text = String(value);
  for (let pass = 0; pass < 3; pass++) {
    const decoded = text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity) => {
      const key = entity.toLowerCase();
      if (key[0] !== '#') return named[key] ?? match;
      const code = key[1] === 'x' ? Number.parseInt(key.slice(2), 16) : Number.parseInt(key.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return match;
      try { return String.fromCodePoint(code); } catch { return match; }
    });
    if (decoded === text) break;
    text = decoded;
  }
  return text;
}

export function classify(subject = '', body = '') {
  const value = `${subject} ${body}`.toLowerCase();
  if (/תוצאות|results|laboratory|lab report|מעבדה|בדיקות דם|בדיקה רפואית|קובץ תוצאות/.test(value)) return { category: 'תוצאות בדיקות', assigned_to: 'רופא/ה' };
  if (/קושי בנשימה|לא מגיב|דחוף|urgent|emergency|כאב|מקיא|הקאות|שלשול|תופעת לוואי|תרופה|מרשם|טיפול רפואי|סימפטום|לא מצליח להשתין|לא מצליחה להשתין|symptom|medication|prescription/.test(value)) return { category: 'פניות רפואיות', assigned_to: 'רופא/ה' };
  if (/תור|appointment|schedule|ביטול תור|שינוי תור|קביעת תור|שעות פתיחה|reception/.test(value)) return { category: 'תורים וקבלה', assigned_to: 'קבלה' };
  if (/חשבונית|invoice|receipt|payment|תשלום|העברה בנקאית|זיכוי|חיוב/.test(value)) return { category: 'חשבוניות ותשלומים', assigned_to: 'קבלה' };
  if (/ספק|הזמנה|משלוח|אספקה|supplier|order|delivery|ציוד רפואי/.test(value)) return { category: 'ספקים והזמנות', assigned_to: 'קבלה' };
  if (/פרסום|קמפיין|אתר|מערכת|סיסמה|עדכון אבטחה|security alert|newsletter|unsubscribe|promotion/.test(value)) return { category: 'מערכות ופרסום', assigned_to: 'קבלה' };
  return { category: 'כללי', assigned_to: 'קבלה' };
}

function cleanEmailText(value = '') {
  return String(value)
    .replace(/(?:\r?\n)(?:On .{0,180}wrote:|-----Original Message-----|From: .{0,240}|בתאריך .{0,180}כתב[ה:]?)[\s\S]*$/i, '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, ' ')
    .replace(/confidentiality notice:[\s\S]*$/i, ' ')
    .replace(/this email and any attachments[\s\S]*$/i, ' ')
    .replace(/הודעה זו והקבצים המצורפים[\s\S]*$/i, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function summarySentences(body) {
  const boilerplate = /^(hello|hi|dear|שלום רב|שלום,|היי,|בברכה|בכבוד רב|regards|kind regards|sincerely|תודה מראש|unsubscribe|נשלח מהטלפון)/i;
  return cleanEmailText(body)
    .split(/(?<=[.!?؟])\s+|\n+|(?<=;)\s+/u)
    .map(sentence => sentence.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter(sentence => sentence.length >= 20 && !boilerplate.test(sentence));
}

export function summarizeEmail(category, subject, body, hasAttachments = false) {
  const sentences = summarySentences(body);
  const selected = [];
  for (const sentence of sentences) {
    const normalized = sentence.toLocaleLowerCase();
    if (selected.some(item => item.toLocaleLowerCase() === normalized)) continue;
    selected.push(sentence.slice(0, 200));
    if (selected.length === 2) break;
  }

  const parts = [TOPIC_TEXT[category] || TOPIC_TEXT['כללי']];
  if (selected.length) parts.push(...selected);
  else if (subject?.trim()) parts.push(`לפי נושא המייל, מדובר ב: ${subject.trim().slice(0, 140)}.`);
  if (hasAttachments) parts.push('מצורף קובץ שכדאי לבדוק.');
  return parts.join(' ').slice(0, 480);
}

export function hasAttachment(payload) {
  if (!payload) return false;
  if (payload.filename && (payload.body?.attachmentId || Number(payload.body?.size || 0) > 0)) return true;
  return (payload.parts || []).some(part => hasAttachment(part));
}
