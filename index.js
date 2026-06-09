// Kelime Oyunları — basit online liderlik sunucusu (bağımlılıksız Node http)
// Çalıştır: node server/index.js   (PORT env ile port verilebilir)
// Uçlar:
//   GET  /api/top?limit=50           -> { entries:[{nick,score}] }
//   POST /api/score  {device,nick,score} -> en yüksek skoru saklar
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8787;
const FILE = path.join(__dirname, 'leaderboard.json');

function load(){ try{ return JSON.parse(fs.readFileSync(FILE,'utf8')); }catch(e){ return {entries:{}}; } }
function save(d){ try{ fs.writeFileSync(FILE, JSON.stringify(d)); }catch(e){} }
let db = load();

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
}
function json(res,code,obj){ cors(res); res.writeHead(code,{'Content-Type':'application/json'}); res.end(JSON.stringify(obj)); }

const server = http.createServer((req,res)=>{
  if(req.method==='OPTIONS'){ cors(res); res.writeHead(204); return res.end(); }
  const u = new URL(req.url, 'http://x');

  if(req.method==='GET' && u.pathname==='/api/top'){
    const limit = Math.min(200, parseInt(u.searchParams.get('limit')||'50',10));
    const entries = Object.values(db.entries)
      .sort((a,b)=>b.score-a.score)
      .slice(0,limit)
      .map(e=>({nick:e.nick, score:e.score}));
    return json(res,200,{entries, total:Object.keys(db.entries).length});
  }

  if(req.method==='POST' && u.pathname==='/api/score'){
    let body=''; req.on('data',c=>{ body+=c; if(body.length>2000) req.destroy(); });
    req.on('end',()=>{
      try{
        const d = JSON.parse(body||'{}');
        const device = String(d.device||'').slice(0,64);
        let nick = String(d.nick||'Oyuncu').slice(0,20).replace(/[<>]/g,'');
        const score = Math.max(0, Math.min(1e9, parseInt(d.score,10)||0));
        if(!device) return json(res,400,{error:'device gerekli'});
        const prev = db.entries[device];
        if(!prev || score>=prev.score){ db.entries[device]={nick,score,ts:Date.now()}; save(db); }
        else if(prev.nick!==nick){ prev.nick=nick; save(db); }
        // sıralamayı hesapla
        const sorted=Object.values(db.entries).sort((a,b)=>b.score-a.score);
        const best=db.entries[device].score;
        const rank=sorted.findIndex(e=>e.score===best)+1;
        return json(res,200,{ok:true,rank,total:sorted.length});
      }catch(e){ return json(res,400,{error:'geçersiz istek'}); }
    });
    return;
  }

  if(u.pathname==='/' || u.pathname==='/health') return json(res,200,{ok:true,service:'kelime-liderlik'});
  json(res,404,{error:'bulunamadı'});
});

server.listen(PORT, ()=>console.log('Liderlik sunucusu çalışıyor: http://localhost:'+PORT));
