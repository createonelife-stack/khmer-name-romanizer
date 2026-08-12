/* =========================================================
   Khmer → Latin romanization engine
   (two series: អឃោសៈ=1 / ឃោសៈ=2 ; coda-aware ; variants ; exceptions)
   ========================================================= */

// ករណី​លើកលែង​តាម​ពាក្យ / ឃ្លា (ពាក្យ​ដែល​អាន​មិន​តាម​ក្បួន)
const KH_ROMAN_FIX = {
  'ឧត្តម': 'OTDAM',
  'វណ្ណ': 'VAN',
  'វ៉ាន់': 'VAN',
  'វណ្ណរិទ្ធ': 'VANRIT',
  'វ៉ាន់រិទ្ធ': 'VANRIT',
  'វណ្ណា': 'VANA',
  'វ៉ាន់ណា': 'VANA',
  'សុវណ្ណារិទ្ធ': 'SOVANARIT',
  'សុវ៉ាន់ណារិទ្ធ': 'SOVANARIT',
  'សុវ៉ាន់ណារិទ': 'SOVANARIT',
  'សុវណ្ណា': 'SOVANA',
  'សុវ៉ាន់ណា': 'SOVANA',
  'រស្មី': 'RAKSMEY',
  'មករា': 'MAKARA',
  'គាវណ្ណ': 'KEAVAN',
  'សំណាង': 'SAMNANG',
  'សុខ': 'SOKH',
  'សាវតា': 'SAVDA',
  'សាវដា': 'SAVDA',
  'ជ័យ': 'CHEY',
  'ជៃ': 'CHEY',
  'សុវណ្ណភូមិ': 'SOVANPHUOM',
  'សិរី': 'SEREY',
  'សិរ៉ី': 'SEREY',
  'ពុទ្ធិ': 'PUTHI',
  'ពុធិ': 'PUTHI',
  'ពិសិដ្ឋ': 'PISETH',
  'វង្ស': 'VONG',
  'វង្សា': 'VONGSA',
  'សុវណ្ណ': 'SOVAN',
  'ពេជ្យ': 'PICH',
  'ពិច': 'PICH',
  'ពេជ្រសិរី': 'PECHSEREY',
  'ពិចសិរី': 'PECHSEREY'
};

function _romanizeKhmer(text, opt) {
  if (!text) return '';
  opt = opt || {};
  const EA = opt.ea || 'ea';            // ស្រៈ ា ស៊េរី​ឃោសៈ (ea ឬ a)
  const ORV = opt.or || 'or';           // ស្រៈ​ដើម​ស៊េរី​ឃោសៈ (or ឬ o)
  const IN1 = opt.drop1st ? '' : 'a';   // ស្រៈ​ដើម​ស៊េរី​អឃោសៈ
  // ព្យញ្ជនៈ [base, series]  series 1 = អឃោសៈ, 2 = ឃោសៈ
  const C = {
    'ក':['k',1],'ខ':['kh',1],'គ':['k',2],'ឃ':['kh',2],'ង':['ng',2],
    'ច':['ch',1],'ឆ':['chh',1],'ជ':['ch',2],'ឈ':['chh',2],'ញ':['nh',2],
    'ដ':['d',1],'ឋ':['th',1],'ឌ':['d',2],'ឍ':['th',2],'ណ':['n',1],
    'ត':['t',1],'ថ':['th',1],'ទ':['t',2],'ធ':['th',2],'ន':['n',2],
    'ប':['b',1],'ផ':['ph',1],'ព':['p',2],'ភ':['ph',2],'ម':['m',2],
    'យ':['y',2],'រ':['r',2],'ល':['l',2],'វ':['v',2],
    'ស':['s',1],'ហ':['h',1],'ឡ':['l',1],'អ':['',1]
  };
  const V2c = { 'ុំ':['om','um'],'ាំ':['am','oam'],'ុះ':['os','ous'],'េះ':['es','es'],'ោះ':['as','uos'],'័យ':['ai','ai'] };
  const V1c = {
    'ា':['a',EA],'ិ':['e','i'],'ី':['ey','y'],'ឹ':['oe','oe'],'ឺ':['eu','eu'],
    'ុ':['o','u'],'ូ':['o','uo'],'ួ':['uo','uo'],'ើ':['oeu','oeu'],'ឿ':['oeur','oeur'],
    'ៀ':['ie','ie'],'េ':['e','e'],'ែ':['e','e'],'ៃ':['ai','ey'],'ោ':['or','o'],'ៅ':['ao','eou'],
    'ំ':['am','aum'],'ះ':['as','eah'],'ៈ':['ak','ak']
  };
  const IND = { 'ឥ':'e','ឦ':'ey','ឧ':'u','ឩ':'u','ឪ':'ov','ឫ':'roek','ឬ':'reu','ឭ':'loek','ឮ':'leu','ឯ':'e','ឰ':'ai','ឱ':'or','ឲ':'or','ឳ':'ao' };
  const COENG = '្';
  const chars = Array.from(text);
  const isCons = ch => Object.prototype.hasOwnProperty.call(C, ch);
  const moreConsInWord = (idx) => { for (let j = idx; j < chars.length; j++) { if (/\s/.test(chars[j])) return false; if (isCons(chars[j])) return true; } return false; };
  const pick = (pair, series) => series === 1 ? pair[0] : pair[1];
  const CODA = opt.inherent !== 'always'; // true = ព្យញ្ជនៈ​តាម​ក្រោយ​ស្រៈ ⇒ coda
  let out = '', i = 0, lastV = false;
  while (i < chars.length) {
    const ch = chars[i];
    if (isCons(ch)) {
      let base = C[ch][0], series = C[ch][1];
      i++;
      let sub = '';
      while (chars[i] === COENG && isCons(chars[i + 1])) {
        let isFinalSub = true;
        for (let j = i + 2; j < chars.length; j++) {
          if (/\s/.test(chars[j])) break;
          if (chars[j] !== '៍' && chars[j] !== 'ៗ') { isFinalSub = false; break; }
        }
        if (!isFinalSub) sub += C[chars[i + 1]][0];
        i += 2;
      }
      if (chars[i] === '៍') { i++; continue; }        // toandakhiat = silent
      if (chars[i] === '៌') i++;
      if (chars[i] === '៉') { series = 1; i++; }       // musikatoan → អឃោសៈ
      else if (chars[i] === '៊') { series = 2; i++; }  // triisap → ឃោសៈ
      if (chars[i] === '័' && chars[i + 1] !== 'យ') i++;
      let vowel = null;
      const two = (chars[i] || '') + (chars[i + 1] || '');
      if (V2c[two]) { vowel = pick(V2c[two], series); i += 2; }
      else if (V1c[chars[i]]) { vowel = pick(V1c[chars[i]], series); i++; }
      let coda = false;
      if (chars[i] === '់') { i++; coda = true; }       // bantoc ⇒ coda
      if (chars[i] === 'ៗ') i++;
      let seg = base + sub;
      if (vowel != null) { seg += vowel; lastV = true; }
      else if (coda) { lastV = false; }
      else if (CODA && lastV) { lastV = false; }                                        // coda (no inherent)
      else if (moreConsInWord(i)) { seg += (series === 1 ? IN1 : ORV); lastV = true; }  // onset inherent
      else { lastV = false; }
      out += seg;
    } else if (IND[ch] != null) { out += IND[ch]; i++; lastV = true; }
    else if (/\s/.test(ch)) { out += ' '; i++; lastV = false; }
    else { i++; }
  }
  return out.replace(/\s+/g, ' ').trim().toUpperCase();
}

function _applyFix(text, opt) {
  if (!text || !text.trim()) return '';
  let whole = text.trim().replace(/\s+/g, ' ');
  whole = whole.replace(/លម្អង/g, 'លំអង');
  whole = whole.replace(/ពេជ្រ/g, 'ពិច');
  if (KH_ROMAN_FIX[whole]) return KH_ROMAN_FIX[whole].toUpperCase();
  return whole.split(' ').map(w => KH_ROMAN_FIX[w] || _romanizeKhmer(w, opt)).join(' ').toUpperCase();
}

function romanizeKhmer(text) { return _applyFix(text, { ea: 'a', or: 'or', drop1st: false }); }

function romanizeKhmerVariants(text) {
  if (!text || !text.trim()) return [];
  const opts = [
    { ea: 'a', or: 'or', drop1st: false, inherent: 'coda' },
    { ea: 'a', or: 'or', drop1st: false, inherent: 'always' },
    { ea: 'a', or: 'o', drop1st: false, inherent: 'always' },
    { ea: 'a', or: 'o', drop1st: false, inherent: 'coda' },
    { ea: 'ea', or: 'or', drop1st: false, inherent: 'coda' }
  ];
  const seen = new Set(), res = [];
  opts.forEach(o => { const v = _applyFix(text, o); if (v && !seen.has(v)) { seen.add(v); res.push(v); } });
  return res;
}

/* =========================================================
   UI
   ========================================================= */
const $ = id => document.getElementById(id);
const input = $('kh-input');
const output = $('latin-output');
const variantsBox = $('variants');
const copyBtn = $('copy-btn');

function render() {
  const text = input.value;
  const main = romanizeKhmer(text);
  output.textContent = main || '—';
  output.classList.toggle('empty', !main);
  // variants
  const vs = romanizeKhmerVariants(text);
  variantsBox.innerHTML = '';
  const vTitle = document.getElementById('variants-title');
  if (vTitle) vTitle.style.display = (vs.length > 1) ? '' : 'none';
  if (vs.length > 1) {
    vs.forEach(v => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (v === main ? ' active' : '');
      chip.textContent = v;
      chip.onclick = () => {
        output.textContent = v;
        output.classList.remove('empty');
        [...variantsBox.children].forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      };
      variantsBox.appendChild(chip);
    });
  }
}

input.addEventListener('input', render);

copyBtn.addEventListener('click', async () => {
  const val = output.textContent.trim();
  if (!val || val === '—') return;
  try {
    await navigator.clipboard.writeText(val);
    copyBtn.classList.add('copied');
    copyBtn.textContent = '✓ បាន​ចម្លង';
    setTimeout(() => { copyBtn.classList.remove('copied'); copyBtn.textContent = '📋 ចម្លង'; }, 1400);
  } catch (e) {
    // fallback
    const r = document.createRange(); r.selectNode(output);
    window.getSelection().removeAllRanges(); window.getSelection().addRange(r);
    document.execCommand('copy'); window.getSelection().removeAllRanges();
  }
});

$('clear-btn').addEventListener('click', () => { input.value = ''; render(); input.focus(); });

// drawer (mobile menu)
const drawer = $('drawer'), scrim = $('scrim');
function openDrawer() { drawer.classList.add('open'); scrim.classList.add('show'); }
function closeDrawer() { drawer.classList.remove('open'); scrim.classList.remove('show'); }
$('menu-btn').addEventListener('click', openDrawer);
scrim.addEventListener('click', closeDrawer);
$('drawer-close').addEventListener('click', closeDrawer);

// examples in drawer → fill
document.querySelectorAll('[data-ex]').forEach(el => {
  el.addEventListener('click', () => { input.value = el.getAttribute('data-ex'); render(); closeDrawer(); input.focus(); });
});

render();
