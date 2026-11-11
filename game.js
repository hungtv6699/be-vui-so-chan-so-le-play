'use strict';
const by=id=>document.getElementById(id);
const names=['Bé tập nhận biết','Nhà du hành tài giỏi','Giải cứu vũ trụ'];
let level=1, order=[], index=0, solved=false, selected=false, muted=false, pointer=null, paired=0;
let scene='welcome';
let generation=0;
const number=()=>order[index];
const star=by('star');
const audio = new Audio();
const welcomeAudio = new Audio('assets/audio/ngoc-linh/' + voiceFiles.welcome);
welcomeAudio.preload = 'metadata';
let activeAudio = audio;
let voiceRequest = 0;

function stopVoice() {
  voiceRequest++;
  activeAudio.pause();
  activeAudio.onended = null;
  activeAudio.onerror = null;
}

function say(...keys) {
  stopVoice();
  if (muted) return;
  const request = voiceRequest;
  function playNext() {
    if (request !== voiceRequest || !keys.length) return;
    const key = keys.shift();
    activeAudio = key === 'welcome' ? welcomeAudio : audio;
    if (activeAudio === audio) {
      audio.src = 'assets/audio/ngoc-linh/' + voiceFiles[key];
    } else {
      welcomeAudio.currentTime = 0;
    }
    activeAudio.onended = playNext;
    activeAudio.onerror = stopVoice;
    activeAudio.play().catch(() => {
      if (request === voiceRequest) stopVoice();
    });
  }
  playNext();
}
function notify(text,key){by('feedback').textContent=text;say(key);}
function screen(name){
  stopVoice();
  generation++;
  scene=name;
  for(const id of ['welcome','mission','victory']) by(id).hidden=id!==name;
  window.space?.setMode(name);
}
function begin(n){
  level=n;
  index=0;
  order=Array.from({length:10},(_,i)=>i+1);
  if(n>1){
    for(let i=order.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [order[i],order[j]]=[order[j],order[i]];
    }
  }
  screen('mission');
  by('level-title').textContent=names[n-1];
  round();
}
function round(){
  generation++;
  solved=false;selected=false;pointer=null;
  window.space?.resetStar();
  star.disabled=false;
  star.classList.remove('selected');
  star.setAttribute('aria-label','Ngôi sao số '+number());
  by('number').textContent=number();
  by('progress').textContent=(index+1)+' / 10';
  by('next').hidden=true;
  by('help').disabled=false;
  notify('Đưa ngôi sao số '+number()+' về đúng hành tinh.','ask-'+number());
}
function next(){
  if(scene!=='mission'||!solved) return;
  index++;
  if(index===10){screen('victory');say('win');return;}
  round();
}
function choose(parity){
  if(solved||scene!=='mission')return;
  if(number()%2!==parity){
    star.classList.remove('shake');
    void star.offsetWidth;
    star.classList.add('shake');
    notify('Bé thử ghép từng đôi rồi chọn lại nhé.','retry');
    return;
  }
  solved=true;
  star.disabled=true;
  by('help').disabled=true;
  window.space?.launch(parity?'odd':'even');
  notify('Đúng rồi! '+number()+' là số '+(parity?'lẻ.':'chẵn.'),'yes-'+number());
  const turn=generation;
  if(level===3){
    setTimeout(()=>{if(turn===generation)next();},muted?850:3100);
  } else {
    setTimeout(()=>{if(turn===generation)by('next').hidden=false;},550);
  }
}
function hint(){
  if(scene!=='mission')return;
  paired=0;
  by('hint').showModal();
  drawHint();
}
function drawHint(){
  const n=number();
  const complete=paired===Math.floor(n/2);
  const grid=by('ten');
  grid.replaceChildren();
  for(let i=0;i<10;i++){
    const cell=document.createElement('span');
    cell.className='cell'+(i<n?' filled':'')+(i<paired*2?' paired':'')+(complete&&n%2&&i===n-1?' leftover':'');
    grid.append(cell);
  }
  const message=complete ? (n%2?'Còn một hạt chưa có đôi.':'Các hạt đều có đôi.') : 'Hai hạt cùng hàng tạo một đôi.';
  by('hint-text').textContent=message;
  by('step').disabled=complete;
  say(complete ? 'hint-'+n : 'row');
}
star.onclick=()=>{
  if (solved || scene !== 'mission') return;
  selected=true;
  star.classList.add('selected');
  say('number-' + number());
};
star.onpointerdown=event=>{
  if(solved||pointer||event.button!==0)return;
  pointer={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
  star.setPointerCapture(event.pointerId);
};
star.onpointermove=event=>{
  if(pointer?.id!==event.pointerId)return;
  if(Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>12)pointer.moved=true;
  if(pointer.moved){
    window.space?.drag(event.clientX,event.clientY);
    by('number').style.transform='translate('+(event.clientX-pointer.x)+'px,'+(event.clientY-pointer.y)+'px)';
  }
};
star.onpointercancel=()=>{pointer=null;by('number').style.transform='';window.space?.release();};
star.onpointerup=event=>{
  if(pointer?.id!==event.pointerId)return;
  by('number').style.transform='';
  const moved=pointer.moved;
  pointer=null;
  window.space?.release();
  if(!moved)return;
  const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.planet');
  if(target)choose(target.id==='odd'?1:0);
};
by('even').onclick=()=>choose(0);
by('odd').onclick=()=>choose(1);
by('next').onclick=next;
by('help').onclick=hint;
by('step').onclick=()=>{paired++;drawHint();};
by('close').onclick=()=>by('hint').close();
by('levels').onclick=()=>{screen('welcome');say('welcome', 'instructions');};
by('other').onclick=()=>{screen('welcome');say('welcome', 'instructions');};
by('replay').onclick=()=>begin(level);
by('hint').addEventListener('close', stopVoice);
by('listen').onclick = () => {
  if (scene === 'welcome') say('welcome', 'instructions');
  else if (scene === 'victory') say('win');
  else if (solved) say('yes-' + number());
  else say('ask-' + number());
};
by('mute').onclick=()=>{
  muted=!muted;
  by('mute').textContent=muted?'Bật tiếng':'Tắt tiếng';
  by('mute').setAttribute('aria-pressed',String(muted));
  if(muted)stopVoice();
};
by('fullscreen').onclick=async()=>{
  try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }catch{by('fullscreen').textContent='Không thể toàn màn hình';}
};
document.querySelectorAll('[data-level]').forEach(button=>button.onclick=()=>begin(Number(button.dataset.level)));
if(!window.space)document.documentElement.classList.add('flat');



