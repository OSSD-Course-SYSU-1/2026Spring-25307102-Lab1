const CHUNK = 16384;
let ws = null;
let myId = null;
let myRoom = null;
let pcs = {};
let dcs = {};
let peers = [];
let pending = [];
let recvItems = [];
let shareUrl = "";

// ========== Pages ==========
const home = document.getElementById("home-page");
const room = document.getElementById("room-page");

function show(p) { home.classList.toggle("active",p==="home"); room.classList.toggle("active",p==="room"); }

function toast(m) {
  const t = document.createElement("div");
  t.className="toast"; t.textContent=m;
  document.body.appendChild(t); setTimeout(()=>t.remove(),2500);
}

// ========== WebSocket ==========
function connect() {
  const proto = location.protocol==="https:"?"wss:":"ws:";
  ws = new WebSocket(`${proto}//${location.host}/ws`);
  ws.onmessage = e => { try { handle(JSON.parse(e.data)); } catch(_){} };
  ws.onclose = () => setTimeout(connect,3000);
}
function send(m) { if(ws&&ws.readyState===WebSocket.OPEN) ws.send(JSON.stringify(m)); }

function handle(msg) {
  switch(msg.type) {
    case "room-created":
    case "room-joined":
      myRoom = msg.roomId; myId = msg.deviceId;
      document.getElementById("room-code").textContent = myRoom;
      show("room");
      showShareLink(myRoom);
      if(msg.devices) setPeers(msg.devices);
      break;
    case "device-joined":
      toast(`${msg.device.name} 已连接`);
      if(msg.devices) setPeers(msg.devices);
      break;
    case "device-left":
      toast(`${msg.device?msg.device.name:"设备"} 已断开`);
      if(msg.device) { closePC(msg.device.id); }
      if(msg.devices) setPeers(msg.devices);
      break;
    case "devices-list":
      setPeers(msg.devices);
      break;
    case "webrtc-offer": handleOffer(msg.fromId, msg.data); break;
    case "webrtc-answer": handleAnswer(msg.fromId, msg.data); break;
    case "webrtc-ice-candidate": handleICE(msg.fromId, msg.data); break;
    case "error": toast(msg.message); break;
  }
}

// ========== Room ==========
async function showShareLink(roomId) {
  let url = `http://${location.hostname}:${location.port||3000}/?room=${roomId}`;
  try {
    const r = await fetch("/api/ip");
    const d = await r.json();
    if(d.ip&&d.ip!=="127.0.0.1") url = `http://${d.ip}:${d.port}/?room=${roomId}`;
    shareUrl = url;
  } catch(_){}
  // Show QR and link
  const area = document.getElementById("qr-inline");
  const area2 = document.getElementById("qr-area");
  const target = area || area2;
  target.classList.remove("hidden");
  target.innerHTML = `<div style="text-align:center;margin-top:8px">
    <img src="/qrcode?data=${encodeURIComponent(url)}" style="width:80px;height:80px;border-radius:8px;background:#fff;padding:4px">
    <p style="font-size:10px;color:#4facfe;word-break:break-all;margin-top:4px">${url}</p>
    <button onclick="copyLink()" class="btn text" style="font-size:11px">复制链接</button>
  </div>`;
}

function copyLink() { navigator.clipboard.writeText(shareUrl).then(()=>toast("已复制")); }

function setPeers(list) {
  peers = list||[];
  const cont = document.getElementById("peer-list");
  if(peers.length===0) { cont.innerHTML='<div class="device-empty">等待其他设备...</div>'; return; }
  cont.innerHTML = peers.map(p => `<div class="device-card connected"><div class="device-icon"></div><span>${p.name}</span><span style="margin-left:auto;font-size:11px;color:#4caf50">在线</span></div>`).join("");
  connectAll();
}

// ========== WebRTC ==========
// Polite peer pattern: larger device ID yields on collision, preventing dual-offer deadlock
function closePC(id) { if(pcs[id]){pcs[id].close();delete pcs[id];} delete dcs[id]; }

function connectAll() {
  peers.forEach(p => { if(!pcs[p.id]) makePC(p.id); });
  document.getElementById("btn-send").disabled = false;
}

function makePC(targetId) {
  if(pcs[targetId]) return pcs[targetId];
  const isPolite = myId > targetId; // larger ID yields on collision
  const pc = new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]});
  pcs[targetId] = pc;
  pc.onicecandidate = e => { if(e.candidate) send({type:"webrtc-ice-candidate",targetId,data:e.candidate}); };
  pc.ondatachannel = e => setupDC(targetId, e.channel);
  // Only the impolite peer creates the DataChannel (avoids duplicate channels)
  if(!isPolite) {
    const ch = pc.createDataChannel("transfer",{ordered:true});
    setupDC(targetId, ch);
  }
  pc.createOffer().then(async offer => {
    try {
      await pc.setLocalDescription(offer);
      send({type:"webrtc-offer",targetId,data:offer});
    } catch(e) {
      console.error("makePC offer error:", e);
    }
  });
  return pc;
}

function setupDC(targetId, ch) {
  dcs[targetId] = ch;
  let buf = null;
  ch.onopen = () => console.log(`DC open ${targetId}`);
  ch.onmessage = e => {
    if(typeof e.data==="string") {
      try {
        const m = JSON.parse(e.data);
        if(m.type==="file-start") { buf={meta:m,chunks:[],got:0}; addRecv(m); }
        else if(m.type==="file-chunk"&&buf&&m.fileId===buf.meta.fileId) {
          const bytes = Uint8Array.from(atob(m.data),c=>c.charCodeAt(0));
          buf.chunks.push(bytes); buf.got+=bytes.length;
          updateRecv(m.fileId,buf);
        }
        else if(m.type==="file-end"&&buf&&m.fileId===buf.meta.fileId) {
          const blob = new Blob(buf.chunks,{type:buf.meta.fileType||"application/octet-stream"});
          download(blob,buf.meta.fileName);
          doneRecv(m.fileId); buf=null; toast("收到: "+m.fileName);
        }
      } catch(_){}
    }
  };
}

async function handleOffer(fromId, offer) {
  const isPolite = myId > fromId; // larger ID yields on collision
  if(pcs[fromId]) {
    if(isPolite) {
      // Polite peer: roll back our connection, accept incoming offer
      closePC(fromId);
    } else {
      // Impolite peer: ignore incoming offer (we already have an offer in flight)
      return;
    }
  }
  const pc = new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]});
  pcs[fromId]=pc;
  pc.onicecandidate = e => { if(e.candidate) send({type:"webrtc-ice-candidate",targetId:fromId,data:e.candidate}); };
  pc.ondatachannel = e => setupDC(fromId, e.channel);
  try {
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const ans = await pc.createAnswer();
    await pc.setLocalDescription(ans);
    send({type:"webrtc-answer",targetId:fromId,data:ans});
  } catch(e) {
    console.error("handleOffer error:", e);
  }
}

async function handleAnswer(fromId, ans) {
  try {
    if(pcs[fromId] && pcs[fromId].signalingState === "have-local-offer") {
      await pcs[fromId].setRemoteDescription(new RTCSessionDescription(ans));
    }
  } catch(e) {
    console.error("handleAnswer error:", e);
  }
}

async function handleICE(fromId, cand) {
  try {
    if(pcs[fromId]&&cand) await pcs[fromId].addIceCandidate(new RTCIceCandidate(cand));
  } catch(e) {
    console.error("handleICE error:", e);
  }
}

// ========== Send ==========
async function doSend(files) {
  if(peers.length===0) { toast("无连接设备"); return; }
  showProg("传输中...",0,"");
  for(const file of files) {
    for(const peer of peers) {
      const dc = dcs[peer.id];
      if(!dc||dc.readyState!=="open") { makePC(peer.id); await waitDC(peer.id); }
      await sendFile(peer.id, file);
    }
  }
  updateProg(100,"完成");
  setTimeout(hideProg,1500);
}

function waitDC(id) {
  return new Promise(res=>{
    let n=0;
    const t=setInterval(()=>{n++;const d=dcs[id];if(d&&d.readyState==="open"){clearInterval(t);res();} if(n>80){clearInterval(t);res();}},200);
  });
}

async function sendFile(targetId, file) {
  const dc = dcs[targetId];
  if(!dc||dc.readyState!=="open") return;
  const fid = Date.now().toString(36)+Math.random().toString(36).slice(2);
  dc.send(JSON.stringify({type:"file-start",fileId:fid,fileName:file.name,fileSize:file.size,fileType:file.type||"application/octet-stream"}));
  const total = Math.ceil(file.size/CHUNK);
  for(let i=0;i<total;i++) {
    const start=i*CHUNK, end=Math.min(start+CHUNK,file.size);
    const buf = await file.slice(start,end).arrayBuffer();
    const b64 = btoa(String.fromCharCode.apply(null,new Uint8Array(buf)));
    dc.send(JSON.stringify({type:"file-chunk",fileId:fid,index:i,data:b64}));
    updateProg(Math.round(((i+1)/total)*100),file.name);
    if(i%5===0) await new Promise(r=>setTimeout(r,5));
  }
  dc.send(JSON.stringify({type:"file-end",fileId:fid,fileName:file.name}));
}

// ========== Receive ==========
function addRecv(m) { recvItems.push({...m,pct:0,done:false}); renderRecv(); }
function updateRecv(fid,buf) { const it=recvItems.find(i=>i.fileId===fid); if(it){it.pct=Math.round((buf.got/it.fileSize)*100);renderRecv();} }
function doneRecv(fid) { const it=recvItems.find(i=>i.fileId===fid); if(it){it.done=true;it.pct=100;renderRecv();} }
function download(blob,name) { const u=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=u;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u); }

function renderRecv() {
  const c = document.getElementById("receive-list");
  if(recvItems.length===0){c.innerHTML='<div class="empty-hint">暂无</div>';return;}
  c.innerHTML = recvItems.map(f=>`<div class="file-item"><div class="file-icon">&#x1F4C4;</div><div class="file-info"><div class="file-name">${f.fileName}</div><div class="file-size">${fmt(f.fileSize)}</div></div><div class="file-status ${f.done?'received':'sending'}">${f.done?'已接收':f.pct+'%'}</div></div>`).join("");
}

function fmt(b) { if(b<1024)return b+" B"; if(b<1024*1024)return (b/1024).toFixed(1)+" KB"; return (b/(1024*1024)).toFixed(1)+" MB"; }

// ========== Progress ==========
function showProg(t,pct,f) { document.getElementById("prog-title").textContent=t; document.getElementById("prog-bar").style.width=pct+"%"; document.getElementById("prog-pct").textContent=pct+"%"; document.getElementById("prog-file").textContent=f; document.getElementById("progress-overlay").classList.remove("hidden"); }
function updateProg(pct,f) { document.getElementById("prog-bar").style.width=pct+"%"; document.getElementById("prog-pct").textContent=pct+"%"; if(f)document.getElementById("prog-file").textContent=f; }
function hideProg() { document.getElementById("progress-overlay").classList.add("hidden"); }

// ========== Event Handlers ==========
document.getElementById("btn-create").onclick = () => {
  const name = document.getElementById("dev-name").value.trim()||"Device";
  connect();
  const t = setInterval(()=>{ if(ws&&ws.readyState===WebSocket.OPEN){clearInterval(t);send({type:"create-room",name});} },200);
  setTimeout(()=>clearInterval(t),5000);
};

document.getElementById("btn-join").onclick = () => document.getElementById("join-box").classList.remove("hidden");
document.getElementById("btn-join-no").onclick = () => document.getElementById("join-box").classList.add("hidden");
document.getElementById("btn-join-go").onclick = () => {
  const rid = document.getElementById("room-input").value.trim().toUpperCase();
  if(rid.length!==6){toast("请输入6位房间号");return;}
  const name = document.getElementById("dev-name").value.trim()||"Device";
  connect();
  const t = setInterval(()=>{ if(ws&&ws.readyState===WebSocket.OPEN){clearInterval(t);send({type:"join-room",roomId:rid,name});} },200);
  setTimeout(()=>clearInterval(t),5000);
  document.getElementById("join-box").classList.add("hidden");
};

document.getElementById("btn-leave").onclick = () => {
  Object.values(pcs).forEach(p=>p.close()); pcs={}; dcs={}; peers=[]; recvItems=[]; pending=[];
  if(ws){ws.close();ws=null;} myId=null;myRoom=null; show("home");
};

document.getElementById("drop-zone").onclick = () => document.getElementById("file-input").click();
document.getElementById("file-input").onchange = e => {
  pending = Array.from(e.target.files);
  document.getElementById("send-preview").innerHTML = pending.map(f=>`<div class="file-item"><div class="file-icon">&#x1F4C4;</div><div class="file-info"><div class="file-name">${f.name}</div><div class="file-size">${fmt(f.size)}</div></div></div>`).join("");
  document.getElementById("btn-send").disabled = pending.length===0;
};
document.getElementById("btn-send").onclick = () => { if(pending.length) doSend(pending); };

// Drag & drop
const dz = document.getElementById("drop-zone");
dz.ondragover = e => { e.preventDefault(); dz.style.borderColor="#4facfe"; };
dz.ondragleave = () => { dz.style.borderColor=""; };
dz.ondrop = e => { e.preventDefault(); dz.style.borderColor=""; const dt=new DataTransfer(); Array.from(e.dataTransfer.files).forEach(f=>dt.items.add(f)); document.getElementById("file-input").files=dt.files; document.getElementById("file-input").dispatchEvent(new Event("change")); };

// Pre-fill device name
document.getElementById("dev-name").value = /Mobi|Android/i.test(navigator.userAgent)?"手机":"PC";

// Auto-join from URL
(function(){
  const p = new URLSearchParams(location.search);
  const rid = p.get("room");
  if(rid&&rid.length===6) {
    document.getElementById("room-input").value = rid.toUpperCase();
    document.getElementById("btn-join-go").click();
  }
})();
