# Khmer Name Romanizer 🇰🇭 → 🔤

កម្មវិធី​បម្លែង​ឈ្មោះ​ខ្មែរ​ជា​អក្សរ​ឡាតាំង (អង់គ្លេស) — responsive សម្រាប់​ទូរស័ព្ទ។
Standalone (HTML/CSS/JS + Node.js) · **zero dependencies** · Railway-ready.

## រចនាសម្ព័ន្ធ
```
khmer-name-romanizer/
├── package.json      (start script)
├── server.js         (Node static server — គ្មាន dependency)
├── README.md
└── public/
    ├── index.html
    ├── style.css
    └── app.js        (romanization engine + UI)
```

## ដំណើរការ​ក្នុង​កុំព្យូទ័រ (local)
```
node server.js
```
បើក http://localhost:3000

## Deploy ទៅ Railway

**វិធីទី ១ — GitHub (ណែនាំ)**
1. បង្កើត repo ថ្មី​លើ GitHub រួច upload folder នេះ​ទាំងអស់ (រួម​ទាំង `public/`)។
2. ចូល https://railway.app → **New Project** → **Deploy from GitHub repo** → ជ្រើស repo នេះ។
3. Railway ស្គាល់​ Node ដោយ​ស្វ័យប្រវត្តិ ហើយ​រត់ `npm start` (= `node server.js`)។
4. ចូល **Settings → Networking → Generate Domain** ដើម្បី​បាន URL សាធារណៈ។

**វិធីទី ២ — Railway CLI**
```
npm i -g @railway/cli
railway login
railway init
railway up
```

> ចំណាំ៖ កម្មវិធី​ស្តាប់​លើ `process.env.PORT` (Railway ផ្តល់​ដោយ​ស្វ័យប្រវត្តិ) — មិន​ចាំបាច់​កំណត់​អ្វី​បន្ថែម​ទេ។

## ក្បួន Romanization
- ២ ស៊េរី​សម្លេង៖ អឃោសៈ / ឃោសៈ (ស្រៈ​ប្តូរ​តាម​ស៊េរី)
- ស្គាល់​ព្យញ្ជនៈ​បិទ (coda) · shifter ៉/៊ · បន្តក់ · ស្រៈ​ពេញ​តួ
- ជម្រើស​ច្រើន (variants) + បញ្ជី​ករណី​លើកលែង (`KH_ROMAN_FIX` ក្នុង `public/app.js`)

ដើម្បី​បន្ថែម​ពាក្យ​ពិសេស សូម​កែ `KH_ROMAN_FIX` ក្នុង `public/app.js`៖
```js
const KH_ROMAN_FIX = {
  'ឧត្តម': 'OTDAM',
  'ឈ្មោះថ្មី': 'NEW NAME'
};
```
