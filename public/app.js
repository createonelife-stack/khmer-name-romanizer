const $ = id => document.getElementById(id);
const input = $('kh-input');
const output = $('latin-output');
const variantsBox = $('variants');
const variantsWrap = $('variants-wrap');
const copyBtn = $('copyBtn');

function render() {
  const text = input.value.trim();
  if (!text) {
    output.textContent = '—';
    output.classList.add('empty');
    variantsBox.innerHTML = '';
    variantsWrap.style.display = 'none';
    return;
  }
  
  if (window.KhmerRomanize) {
    const cands = KhmerRomanize.romanizeCandidates(text, 6);
    if (cands.length > 0) {
      output.textContent = cands[0];
      output.classList.remove('empty');
      variantsBox.innerHTML = '';
      if (cands.length > 1) {
        variantsWrap.style.display = 'block';
        cands.forEach(v => {
          const chip = document.createElement('button');
          chip.className = 'chip' + (v === cands[0] ? ' active' : '');
          chip.textContent = v;
          chip.onclick = () => {
            output.textContent = v;
            [...variantsBox.children].forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
          };
          variantsBox.appendChild(chip);
        });
      } else {
        variantsWrap.style.display = 'none';
      }
    }
  }
}

input.addEventListener('input', render);

copyBtn.addEventListener('click', async () => {
  const val = output.textContent.trim();
  if (!val || val === '—') return;
  try {
    await navigator.clipboard.writeText(val);
    showToast();
  } catch (e) {
    const r = document.createRange(); r.selectNode(output);
    window.getSelection().removeAllRanges(); window.getSelection().addRange(r);
    document.execCommand('copy'); window.getSelection().removeAllRanges();
    showToast();
  }
});

function showToast() {
  const toast = $('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

$('clearBtn').addEventListener('click', () => { input.value = ''; render(); input.focus(); });

// Theme Logic
const themeBtn = $('themeBtn');
const moonIcon = $('moon-icon');
const sunIcon = $('sun-icon');
let currentTheme = localStorage.getItem('theme') || 'light';
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (theme === 'dark') { moonIcon.style.display = 'none'; sunIcon.style.display = 'block'; }
  else { moonIcon.style.display = 'block'; sunIcon.style.display = 'none'; }
}
applyTheme(currentTheme);
themeBtn.addEventListener('click', () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(currentTheme);
});

// Examples
const EXAMPLES = ["សុខ សំណាង","ដារ៉ា","ចាន់ រតនា","សំណាង","ស្រី មុំ","វិចិត្រ", "សុវណ្ណារិទ្ធ", "ជ័យ"];
const exWrap = $('examples');
if (exWrap && window.KhmerRomanize) {
  EXAMPLES.forEach(k => {
    const c = document.createElement('button'); c.className = 'chip';
    c.innerHTML = k + '<small>' + KhmerRomanize.romanize(k) + '</small>';
    c.onclick = () => { input.value = k; input.focus(); render(); };
    exWrap.appendChild(c);
  });
}

// On-screen keyboard
const CONS_ROWS = [
  "ក ខ គ ឃ ង ច ឆ ជ ឈ ញ",
  "ដ ឋ ឌ ឍ ណ ត ថ ទ ធ ន",
  "ប ផ ព ភ ម យ រ ល វ ស",
  "ហ ឡ អ"
];
const VOWELS = "ា ិ ី ឹ ឺ ុ ូ ួ ើ ឿ ៀ េ ែ ៃ ោ ៅ ំ ះ ់ ៉ ៊".split(" ");
const kbd = $('kbd');
if (kbd) {
  function insert(txt) {
    const s = input.selectionStart, e = input.selectionEnd, v = input.value;
    input.value = v.slice(0, s) + txt + v.slice(e);
    const p = s + txt.length; input.setSelectionRange(p, p);
    input.focus(); render();
  }
  function makeKey(ch, cls) {
    const k = document.createElement("div"); k.className = "key" + (cls ? " " + cls : "");
    k.textContent = ch; return k;
  }
  CONS_ROWS.forEach(row => {
    const r = document.createElement("div"); r.className = "row";
    row.split(" ").forEach(ch => { const k = makeKey(ch); k.onclick = () => insert(ch); r.appendChild(k); });
    kbd.appendChild(r);
  });
  const vr = document.createElement("div"); vr.className = "row";
  const vl = document.createElement("div"); vl.className = "lbl"; vl.textContent = "ស្រៈ និង​សញ្ញា"; vr.appendChild(vl);
  VOWELS.forEach(ch => { const k = makeKey(ch); k.onclick = () => insert(ch); vr.appendChild(k); });
  kbd.appendChild(vr);
  const or_ = document.createElement("div"); or_.className = "row";
  const opLbl = document.createElement("div"); opLbl.className = "lbl"; opLbl.textContent = "ផ្សេងៗ"; or_.appendChild(opLbl);
  const coeng = makeKey("្", "wide"); coeng.onclick = () => insert("្"); or_.appendChild(coeng);
  const sp = makeKey("ចន្លោះ", "wide"); sp.onclick = () => insert(" "); or_.appendChild(sp);
  const bs = makeKey("⌫ លុប", "wide"); bs.onclick = () => {
    const s = input.selectionStart, e = input.selectionEnd, v = input.value;
    if (s === e && s > 0) { input.value = v.slice(0, s - 1) + v.slice(e); input.setSelectionRange(s - 1, s - 1); }
    else { input.value = v.slice(0, s) + v.slice(e); input.setSelectionRange(s, s); }
    input.focus(); render();
  };
  or_.appendChild(bs);
  kbd.appendChild(or_);
}

render();
