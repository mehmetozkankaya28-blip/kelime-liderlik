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

  if(u.pathname==='/gizlilik' || u.pathname==='/privacy'){
    cors(res); res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    return res.end(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gizlilik Politikası — Kelime Oyunları</title>
<style>body{font-family:system-ui,Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 18px;line-height:1.6;color:#222}h1{color:#16213e}h2{margin-top:26px}</style></head><body>
<h1>Gizlilik Politikası — Kelime Oyunları</h1>
<p>Son güncelleme: 2026. Bu politika "Kelime Oyunları" uygulamasının kişisel verileri nasıl işlediğini açıklar.</p>
<h2>Toplanan veriler</h2>
<p>Uygulama; oyun ilerlemen, altın, istatistikler ve ayarları yalnızca <b>cihazında</b> (yerel depolama) saklar. Hesap açman gerekmez.</p>
<h2>Liderlik</h2>
<p>Liderliğe katıldığında yalnızca seçtiğin <b>takma ad</b>, <b>oyun puanın</b> ve rastgele oluşturulmuş anonim bir <b>cihaz kimliği</b> sunucumuza gönderilir. Ad, e-posta, konum, rehber gibi kişisel/hassas bilgiler toplanmaz.</p>
<h2>Üçüncü taraflar</h2>
<p>Veriler üçüncü taraflarla paylaşılmaz, satılmaz. Reklam ve takip teknolojisi kullanılmaz.</p>
<h2>Çocuklar</h2>
<p>Uygulama her yaşa uygundur ve çocuklardan bilerek kişisel veri toplamaz.</p>
<h2>Veri silme</h2>
<p>Uygulama içinden <i>Ayarlar → İlerlemeyi Sıfırla</i> ile tüm yerel verini silebilirsin. Liderlik kaydının silinmesi için bu sayfadaki iletişim adresinden talepte bulunabilirsin.</p>
<h2>İletişim</h2>
<p>Sorular için: <i>(buraya kendi e-posta adresini yaz)</i></p>
</body></html>`);
  }
  if(u.pathname==='/' || u.pathname==='/health') return json(res,200,{ok:true,service:'kelime-liderlik'});
  json(res,404,{error:'bulunamadı'});
});

server.listen(PORT, ()=>console.log('Liderlik sunucusu çalışıyor: http://localhost:'+PORT));
