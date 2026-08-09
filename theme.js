document.addEventListener('DOMContentLoaded',()=>{
  const app=document.getElementById('app');
  if(!app)return;
  const top=app.querySelector('.top');
  const brand=app.querySelector('.brand');
  if(brand)brand.textContent='מערכת צוות המרפאה';
  if(top && !document.querySelector('.staff-hero')){
    const hero=document.createElement('section');
    hero.className='staff-hero';
    hero.innerHTML=`
      <div class="hero-kicker">מערכת פנימית לצוות בלבד</div>
      <h1 class="hero-title">מערכת ניהול המרפאה</h1>
      <p class="hero-sub">מלאי, מחירון, פרוטוקולים וכלי עבודה לצוות — מסודרים במקום אחד, בצורה ברורה ומהירה.</p>
      <div class="hero-badges">
        <span class="hero-badge">🐾 מידע וטרינרי מרוכז</span>
        <span class="hero-badge">✚ גישה פנימית ומאובטחת</span>
        <span class="hero-badge">⚕ עבודה שוטפת לצוות</span>
      </div>`;
    top.insertAdjacentElement('afterend',hero);
  }
  document.title='מערכת ניהול המרפאה';
});
