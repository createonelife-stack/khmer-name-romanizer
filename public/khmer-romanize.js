/*
 * khmer-romanize.js
 * Statistical-style Khmer name Romanization (grapheme / conventional-spelling engine).
 *
 * Approach follows Ding et al., "Statistical Khmer Name Romanization" (PACLING 2017):
 *   - character/grapheme-level processing on the Khmer side
 *   - inherent-vowel insertion for "bare" consonants
 *   - two consonant registers (a-series / o-series) with series shifters
 *   - COENG (U+17D2) treated as a silent stacking operator
 *   - special stacked HA-clusters for non-native consonants (Z, F)
 *
 * Works in browser and Node (CommonJS + global).
 */
(function (root) {
  "use strict";

  // ---- Khmer Unicode landmarks ----------------------------------------
  const COENG = "្";          // stacking operator (subscript former)
  const ANUSVARA = "ំ";       // ំ  nasal ending -> m
  const VISARGA = "ះ";        // ះ  aspiration ending -> h
  const YUUKALEA = "ៈ";       // ៈ
  const BANTOC = "់";         // ់  shortens vowel
  const MUUS = "៉";           // ៉  muusikatoan: shift o-series -> a-series
  const TRIISAP = "៊";        // ៊  triisap: shift a-series -> o-series
  const ROBAT = "៌";          // ៌  historical r (usually silent)
  const TOAND = "៍";          // ៍  toandakhiat: silences its consonant
  const KAKABAT = "៎";        // ៎
  const AHSDA = "៏";          // ៏
  const SAMYOK = "័";         // ័  samyok sannya
  const isCons = (c) => c >= "ក" && c <= "អ";
  const isDepV = (c) => c >= "ា" && c <= "ៅ";
  const isIndepV = (c) => c >= "ឣ" && c <= "឵";

  // ---- Base consonants: roman onset + inherent register ----------------
  // s = series: 'a' (1st) or 'o' (2nd)
  const CONS = {
    "ក": { r: "k",  s: "a" }, // ក
    "ខ": { r: "kh", s: "a" }, // ខ
    "គ": { r: "k",  s: "o" }, // គ
    "ឃ": { r: "kh", s: "o" }, // ឃ
    "ង": { r: "ng", s: "o" }, // ង
    "ច": { r: "ch", s: "a" }, // ច
    "ឆ": { r: "chh",s: "a" }, // ឆ
    "ជ": { r: "ch", s: "o" }, // ជ
    "ឈ": { r: "chh",s: "o" }, // ឈ
    "ញ": { r: "nh", s: "o" }, // ញ
    "ដ": { r: "d",  s: "a" }, // ដ
    "ឋ": { r: "th", s: "a" }, // ឋ
    "ឌ": { r: "d",  s: "o" }, // ឌ
    "ឍ": { r: "th", s: "o" }, // ឍ
    "ណ": { r: "n",  s: "a" }, // ណ
    "ត": { r: "t",  s: "a" }, // ត
    "ថ": { r: "th", s: "a" }, // ថ
    "ទ": { r: "t",  s: "o" }, // ទ
    "ធ": { r: "th", s: "o" }, // ធ
    "ន": { r: "n",  s: "o" }, // ន
    "ប": { r: "b",  s: "a" }, // ប  (also p as coda)
    "ផ": { r: "ph", s: "a" }, // ផ
    "ព": { r: "p",  s: "o" }, // ព
    "ភ": { r: "ph", s: "o" }, // ភ
    "ម": { r: "m",  s: "o" }, // ម
    "យ": { r: "y",  s: "o" }, // យ
    "រ": { r: "r",  s: "o" }, // រ
    "ល": { r: "l",  s: "o" }, // ល
    "វ": { r: "v",  s: "o" }, // វ
    "ឝ": { r: "s",  s: "o" }, // ឝ (rare)
    "ឞ": { r: "s",  s: "o" }, // ឞ (rare)
    "ស": { r: "s",  s: "a" }, // ស
    "ហ": { r: "h",  s: "a" }, // ហ
    "ឡ": { r: "l",  s: "a" }, // ឡ
    "អ": { r: "",   s: "a" }, // អ  glottal (silent onset, carries vowel)
  };

  // Consonant sound when acting as a syllable-final CODA (conventional).
  // Modified to adhere to user's new rules (e.g. ខ/ឃ coda -> k)
  const CODA = {
    "ក": "k", "ខ": "k", "គ": "k", "ឃ": "k", "ង": "ng",
    "ច": "ch","ឆ": "ch","ជ": "ch","ឈ": "ch","ញ": "nh",
    "ដ": "t", "ឋ": "t", "ឌ": "t", "ឍ": "t", "ណ": "n",
    "ត": "t", "ថ": "t", "ទ": "t", "ធ": "t", "ន": "n",
    "ប": "p", "ផ": "p", "ព": "p", "ភ": "p", "ម": "m",
    "យ": "y", "រ": "", "ល": "l", "វ": "v", "ស": "s",
    "ហ": "h", "ឡ": "l", "អ": "",
  };

  // ---- Dependent vowels: reading by register ---------------------------
  const DEPV = {
    "ា": { a: "a",    o: "ea"  },  // A / EA
    "ិ": { a: "i",    o: "i"   },  // I
    "ី": { a: "ey",   o: "y"   },  // a-series(អឃោសៈ)->ey, o-series(ឃោសៈ)->y
    "ឹ": { a: "oe",   o: "oe"  },  // OE
    "ឺ": { a: "eu",   o: "eu"  },  // EU
    "ុ": { a: "o",    o: "u"   },  // O / U
    "ូ": { a: "ou",   o: "u"   },  // OU / U
    "ួ": { a: "uo",   o: "uo"  },  // UO
    "ើ": { a: "oeu",  o: "oeu" },  // OEU
    "ឿ": { a: "oeur", o: "oeur"},  // OEUR
    "ៀ": { a: "ie",   o: "ie"  },  // IE
    "េ": { a: "e",    o: "e"   },  // E
    "ែ": { a: "e",    o: "e"   },  // E
    "ៃ": { a: "ai",   o: "ey"  },  // kept per your samyok lessons
    "ោ": { a: "or",   o: "or"  },  // OR
    "ៅ": { a: "ao",   o: "ao"  },  // AO
  };

  const INHERENT = { a: "a", o: "u" };
  const INDEP = {
    "ឣ": "", "ឤ": "", "ឥ": "e", "ឦ": "ei", "ឧ": "u",
    "ឩ": "u", "ឪ": "u", "ឫ": "rue", "ឬ": "rue",
    "ឭ": "lue", "ឮ": "lue", "ឯ": "e", "ឰ": "ai",
    "ឱ": "ao", "ឲ": "ao", "ឳ": "au", "ឨ": "ou",
  };

  // ---- Exact-match lexicon (frequent names) ----------------------------
  const LEXICON = {
    "សុខ": "Sokh",          // Added rule for H with Sokh Samnang
    "សុភា": "Sophea",
    "ដារ៉ា": "Dara",
    "ចាន់": "Chan",
    "វិចិត៍": "Vichet",
    "រតនា": "Ratana",
    "ពិសិដ់": "Piseth",
    "សោភា": "Sophea",
    "មុនី": "Muni",
    "នារី": "Nari",
    "សេង": "Seng",
    "ចាន់ទា": "Chanda",
    "មង្គល": "Mongkol",
    "សុភមង្គល": "Sophak Mongkol",
    "ថ្មី": "Thmey", "សម័យ": "Samai",
    
    // User requested specifically:
    "ជ័យ": "Chey",
    "សំណាង": "Samnang",
    "វណ្ណរិទ្ធ": "Vanrit",
    "វណ្ណា": "Vana",
    "សុវណ្ណារិទ្ធ": "Sovanarit",
    "សុវណ្ណា": "Sovana",
    "សុវណ្ណ": "Sovan",
  };

  const LEARNED = {};
  const LEARNED_PHRASE = {};
  const norm = (s) => (s || "").trim().replace(/\s+/g, " ");

  function learn(khmer, roman) {
    khmer = norm(khmer); roman = norm(roman);
    if (!khmer) return;
    if (!roman) { forget(khmer); return; }
    const kws = khmer.split(" "), rws = roman.split(" ");
    if (kws.length > 1 && kws.length === rws.length) {
      for (let i = 0; i < kws.length; i++) LEARNED[kws[i]] = rws[i];
    } else if (kws.length === 1) {
      LEARNED[kws[0]] = roman;
    } else {
      LEARNED_PHRASE[khmer] = roman;
    }
  }
  function forget(khmer) {
    khmer = norm(khmer);
    delete LEARNED_PHRASE[khmer];
    khmer.split(" ").forEach((w) => { delete LEARNED[w]; });
  }
  function loadLearned(obj) {
    if (!obj || typeof obj !== "object") return 0;
    if (obj.words || obj.phrases) {
      Object.assign(LEARNED, obj.words || {});
      Object.assign(LEARNED_PHRASE, obj.phrases || {});
    } else {
      for (const k in obj) learn(k, obj[k]);
    }
    return Object.keys(LEARNED).length + Object.keys(LEARNED_PHRASE).length;
  }
  function clearLearned() {
    for (const k in LEARNED) delete LEARNED[k];
    for (const k in LEARNED_PHRASE) delete LEARNED_PHRASE[k];
  }

  function normalizeSamyokYa(word) {
    return word
      .replace(/ម័យ/g, "ម៉ៃ")
      .replace(/ល័យ/g, "ឡៃ")
      .replace(/([ក-អ])័យ/g, "$1ៃ");
  }

  function normalizeCompound(word) {
    return word.replace(/([ក-អ])\1/g, "$1ៈ$1");
  }

  const OBS_GROUP = {};
  [["ក","ខ","គ","ឃ"], ["ច","ឆ","ជ","ឈ"], ["ដ","ឋ","ឌ","ឍ"],
   ["ត","ថ","ទ","ធ"], ["ប","ផ","ព","ភ"], ["ស"], ["ហ"]]
    .forEach((g, i) => g.forEach((c) => { OBS_GROUP[c] = i; }));
  const NUCLEUS_CH = "ាិីឹឺុូួើឿៀេែៃោៅ័ំះៈ";

  function normalizeStack(word) {
    const re = new RegExp("([ក-អ]?)([ក-អ])្([ក-អ])(?=[" + NUCLEUS_CH + "])", "g");
    return word.replace(re, (m, prev, c1, c2) => {
      if (OBS_GROUP[c1] === undefined || OBS_GROUP[c1] !== OBS_GROUP[c2]) return m;
      return prev ? prev + "ៈ" + c2 : c2;
    });
  }

  function clusterize(word) {
    word = normalizeCompound(normalizeSamyokYa(normalizeStack(word)));
    const out = [];
    let i = 0;
    const n = word.length;
    while (i < n) {
      const c = word[i];
      if (isCons(c) || isIndepV(c) || c === "អ") {
        const cl = { base: c, indep: isIndepV(c), subs: [], vowels: [], marks: [] };
        i++;
        while (i < n && word[i] === COENG && i + 1 < n) {
          cl.subs.push(word[i + 1]);
          i += 2;
        }
        while (i < n) {
          const d = word[i];
          if (isDepV(d)) { cl.vowels.push(d); i++; }
          else if (d === ANUSVARA || d === VISARGA || d === YUUKALEA ||
                   d === BANTOC || d === MUUS || d === TRIISAP || d === ROBAT ||
                   d === TOAND || d === KAKABAT || d === AHSDA || d === SAMYOK) {
            cl.marks.push(d); i++;
          } else break;
        }
        out.push(cl);
      } else {
        out.push({ base: c, indep: false, subs: [], vowels: [], marks: [], raw: true });
        i++;
      }
    }
    return out;
  }

  const SONORANT_SUB = { "រ":1, "ល":1, "វ":1, "យ":1, "ម":1, "ន":1, "ង":1, "ញ":1 };
  function register(cl) {
    let s = (CONS[cl.base] && CONS[cl.base].s) || "a";
    if (cl.subs.length) {
      const sub = cl.subs[cl.subs.length - 1];
      if (!SONORANT_SUB[sub] && CONS[sub]) s = CONS[sub].s;
    }
    for (const m of cl.marks) {
      if (m === MUUS) s = "a";
      else if (m === TRIISAP) s = "o";
    }
    return s;
  }

  function onset(cl) {
    const base = cl.base;
    if (base === "ហ" && cl.subs.length === 1) {
      if (cl.subs[0] === "ស") return "z";
      if (cl.subs[0] === "វ") return "f";
    }
    let r = CONS[base] ? CONS[base].r : "";
    for (const sub of cl.subs) {
      if (sub === "ហ") continue;
      if (sub === base) continue;
      r += CONS[sub] ? CONS[sub].r : "";
    }
    return r;
  }

  function romanizeCluster(cl, asCoda, shortA) {
    if (cl.raw) return "";
    if (cl.indep) {
      return INDEP[cl.base] != null ? INDEP[cl.base] : "";
    }

    const s = register(cl);
    let cons = onset(cl);
    if (cl.marks.includes(MUUS) && cl.base === "ប") cons = "p"; // Rule: ប៉ -> p

    if (cl.marks.includes(TOAND)) return "";

    const hasYuu = cl.marks.includes(YUUKALEA);
    let vowel = "";
    if (cl.vowels.length) {
      for (const v of cl.vowels) {
        const map = DEPV[v];
        vowel += map ? map[s] : "";
      }
    } else if (hasYuu) {
      vowel = "a";
    } else if (!asCoda) {
      vowel = shortA ? "a" : INHERENT[s];
    }

    let ending = "";
    let doubleFinal = false;
    let addH = false;
    
    for (const m of cl.marks) {
      if (m === ANUSVARA) {
        if (!vowel) vowel = (s === "a" ? "a" : "u");
        ending += "m";
      } else if (m === VISARGA) {
        ending += "h";
      } else if (m === YUUKALEA) {
        ending += "k";
      } else if (m === SAMYOK) {
        if (!vowel) vowel = "a";
      } else if (m === BANTOC) {
        // User rule: Duplicate final consonant for Bantoc
        doubleFinal = true;
        // User rule: if Bantoc is on ត (ត់) add H
        if (cl.base === "ត" || cl.base === "ទ") {
           addH = true;
           doubleFinal = false;
        }
      }
    }

    if (asCoda) {
      let codaR = CODA[cl.base] != null ? CODA[cl.base] : cons;
      if (cl.base === "ខ" || cl.base === "ឃ") codaR = "k"; // User rule Kh coda -> k
      
      let finalRes = codaR + ending;
      if (doubleFinal) finalRes += codaR;
      if (addH) finalRes += "h";
      return finalRes;
    }
    return cons + vowel + ending;
  }

  // Model fallback omitted since files are lost.
  let MODEL = null;
  function setModel(m) { MODEL = m; }
  
  function orthoVariants(phrase) {
    const words = phrase.split(" "), out = [];
    const wordVars = (w) => { const v = []; let m;
      if ((m = w.match(/([bcdfghjklmnpqrstvz])$/i))) v.push(w + m[1]);
      if ((m = w.match(/([bcdfghjklmnpqrstvz])\1$/i))) v.push(w.slice(0, -1));
      if (/[ktp]$/i.test(w)) v.push(w + "h");
      if (/h$/i.test(w)) v.push(w.slice(0, -1));
      return v;
    };
    for (let i = 0; i < words.length; i++) for (const wv of wordVars(words[i])) {
      const c = words.slice(); c[i] = wv; out.push(c.join(" "));
    }
    return out;
  }
  function vowelVariants(phrase) {
    const out = [];
    for (const [re, ch] of [[/i/g, "e"], [/e/g, "i"], [/o/g, "u"], [/u/g, "o"],
                            [/t(?!h)/g, "d"], [/d/g, "t"], [/p(?!h)/g, "b"], [/b/g, "p"]]) {
      const v = phrase.replace(re, ch); if (v !== phrase) out.push(v);
    }
    return out;
  }
  const titlePhrase = (s) => s.split(" ").map(titleCase).join(" ");
  const cleanCand = (s) => s && !/\{/.test(s) && !/(.)\1\1/i.test(s);
  
  function romanizeCandidates(name, k) {
    k = k || 6; const out = [];
    const add = (s) => { if (!cleanCand(s)) return; s = titlePhrase(s); if (s && !out.includes(s)) out.push(s); };
    const primary = romanize(name, { titleCase: true });
    add(primary);
    vowelVariants(primary).forEach(add);
    orthoVariants(primary).forEach(add);
    return out.slice(0, k);
  }

  function romanizeWord(word) {
    if (LEARNED[word] != null) return LEARNED[word];
    if (LEXICON[word]) return LEXICON[word];

    const cls = clusterize(word);
    const hasNucleus = (cl) => cl.indep || cl.vowels.length > 0 ||
      cl.marks.includes(ANUSVARA) || cl.marks.includes(VISARGA) ||
      cl.marks.includes(YUUKALEA);

    let out = "";
    for (let i = 0; i < cls.length; i++) {
      const cl = cls[i];
      const isLast = i === cls.length - 1;
      const next = cls[i + 1];
      let asCoda = false;
      if (i > 0 && !hasNucleus(cl)) {
        asCoda = isLast || hasNucleus(next);
      }
      const nextGem = next && next.subs.length > 0 && next.base === next.subs[0];
      const shortA = !asCoda && !hasNucleus(cl) && !!next &&
                     (nextGem || (i + 2 === cls.length && next.subs.length > 0 && !hasNucleus(next)));
      out += romanizeCluster(cl, asCoda, shortA);
    }
    return out;
  }

  function titleCase(w) {
    if (!w) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }

  function romanize(name, opts) {
    opts = opts || {};
    if (!name) return "";
    const phrase = LEARNED_PHRASE[norm(name)];
    if (phrase != null) return phrase;
    const words = name.split(/(\s+)/);
    let res = words.map((w) => {
      if (!w.trim()) return w;
      return romanizeWord(w);
    });
    const joined = res.join("");
    return opts.titleCase ? titlePhrase(joined) : joined;
  }

  const API = { romanize, romanizeCandidates, romanizeWord, setModel, hasModel: () => !!MODEL, loadLearned, clearLearned };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.KhmerRomanize = API;
})(this);
