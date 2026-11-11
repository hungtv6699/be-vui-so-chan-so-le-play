'use strict';
const get = id => document.getElementById(id);
const board = get('board');
let mode = -1;
let round = 0;
let selected = null;
let completed = new Set();
let audio = true;
let pointer = null;

const kind = n => n % 2 ? 'lẻ' : 'chẵn';
const numbers = Array.from({length:10}, (_, i) => i + 1);
const icons = ['🐰','🌳','🏡','🎨','🧩','👋','🥚','🍎'];
function say(text) {
  if (!audio || !window.speechSynthesis) return;
  const voice = speechSynthesis.getVoices().find(item => item.localService && /^vi/i.test(item.lang));
  if (!voice) return;
  speechSynthesis.cancel();
  const line = new SpeechSynthesisUtterance(text);
  line.lang = 'vi-VN';
  line.voice = voice;
  line.rate = .84;
  speechSynthesis.speak(line);
}
function feedback(text) {
  get('feedback').textContent = text;
  say(text);
}
function button(label, action, css = '') {
  const node = document.createElement('button');
  node.textContent = label;
  node.className = css;
  node.onclick = () => { if (!node.disabled) action(node); };
  board.append(node);
  return node;
}
function prompt(text) { get('prompt').textContent = text; }
function reset(nextMode = mode, nextRound = 0) {
  mode = nextMode;
  round = nextRound;
  selected = null;
  pointer = null;
  completed = new Set();
  get('feedback').textContent = '';
  render();
}
function advance() { reset(mode, round + 1); }
function finish(text) {
  button('Tiếp tục', advance, 'done');
  feedback(text);
}
function mark(node, css = 'done') {
  node.classList.remove('active');
  node.classList.add(css);
  node.disabled = true;
}
function target(label, value, answer) {
  const node = button(label, () => answer(value), 'target');
  node.dropAnswer = () => answer(value);
}
function draggable(node, value) {
  node.classList.add('drag');
  node.onpointerdown = event => {
    if (pointer || event.button !== 0) return;
    pointer = {id:event.pointerId, x:event.clientX, y:event.clientY, node, value};
    node.setPointerCapture(event.pointerId);
  };
}
document.addEventListener('pointercancel', event => {
  if (pointer?.id === event.pointerId) pointer = null;
});
document.addEventListener('pointerup', event => {
  if (pointer?.id !== event.pointerId) return;
  const start = pointer;
  pointer = null;
  if (Math.hypot(event.clientX-start.x, event.clientY-start.y) < 12) { select(start.value, start.node); return; }
  const drop = document.elementFromPoint(event.clientX,event.clientY)?.closest('button');
  if (!drop?.dropAnswer) return;
  select(start.value,start.node);
  drop.dropAnswer();


});
function select(value, node) {
  selected?.node.classList.remove('active');
  selected = {value,node};
  node.classList.add('active');
}
function render() {
  board.replaceChildren();
  board.className = '';
  get('hero').classList.toggle('is-home', mode < 0);
  if (mode < 0) {
    get('title').textContent = 'Bé vui cùng số chẵn – số lẻ';
    prompt('Chọn một trò chơi');
    board.className = 'menu';
    const link = document.createElement('a');
    link.className = 'module';
    link.href = 'ghep-doi.html';
    link.textContent = 'Bé cùng ghép đôi';
    board.append(link);
    QUESTIONS.forEach(([name], i) => button(icons[i]+' '+name, () => { reset(i); say(get('prompt').textContent); },'module'));
    return;
  }
  const [name, instruction, type, data] = QUESTIONS[mode];
  get('title').textContent = icons[mode]+' '+name;
  prompt(instruction);

  if (type === 'pair') {
    const count = data[round % data.length];
    prompt('Có '+count+' bạn thỏ. Chạm hai bạn để tạo một đôi.');
    Array.from({length:count}, (_,i) => {
      const node = button('🐰', () => {
        if (!selected) { select(i,node); return; }
        if (selected.node === node) return;
        mark(selected.node);
        mark(node);
        selected = null;
        completed.add(i);
        if (completed.size === Math.floor(count/2)) finish(count % 2 ? 'Còn một bạn thỏ chưa có đôi.' : 'Bạn thỏ nào cũng có đôi.');
      },'token rabbit');
      node.setAttribute('aria-label','Thỏ '+(i+1));
      return node;
    });
    return;
  }
  if (type === 'sort' || type === 'mark') {
    data.forEach(n => draggable(button(String(n), node => select(n,node),'token'), n));
    const answer = label => {
      if (!selected) { feedback('Bé chọn một thẻ số nhé.'); return; }
      if (kind(selected.value) !== label) { feedback('Bé thử ghép đôi số hạt bằng số trên thẻ rồi chọn lại nhé.'); return; }
      completed.add(selected.value);
      mark(selected.node,type === 'mark' ? label === 'chẵn' ? 'circled' : 'painted' : 'done');
      selected = null;
      if (completed.size === data.length) finish('Bé đã làm xong tất cả các thẻ!');
      else feedback('Đúng rồi!');
    };
    ['chẵn','lẻ'].forEach(label => target(type === 'mark' ? label === 'chẵn' ? 'Khoanh' : 'Tô màu' : icons[mode]+' Số '+label,label,answer));
    return;
  }
  if (type === 'maze') {
    const path = [0,1,4,5,8];
    const grid = data[round % data.length];
    let position = 0;
    prompt('Bắt đầu ở góc trên bên trái. Bước sang ô kề cạnh có số '+kind(grid[0])+'.');
    board.className = 'maze';
    grid.forEach((n,i) => button(String(n), node => {
      if (i !== path[position]) { feedback('Bé tìm ô kề cạnh mang số '+kind(grid[0])+' nhé.'); return; }
      mark(node);
      position++;
      if (position === path.length) finish('Bé đã tới đích!');
      else feedback('Đúng rồi! Bé tìm ô tiếp theo.');
    },'token'));
    return;
  }
  if (type === 'next') {
    const sequence = data[round % data.length];
    const step = 1 + Math.floor(round / data.length) % 3;
    const answer = sequence[step + 1];
    prompt(sequence.slice(0, step+1).join(', ')+' … Số nào tiếp theo?');
    [answer-1,answer,answer+1].filter(n=>n>=1&&n<=10).forEach(n => button(String(n),node=>{
      if (completed.size) return;
      if (n !== answer) { feedback('Bé đọc lại dãy rồi thử tiếp nhé.'); return; }
      completed.add(n);
      mark(node);
      finish('Đúng rồi! Số tiếp theo là '+answer+'.');
    },'token'));
    return;
  }
  if (type === 'egg') {
    const label = round % 2 ? 'lẻ' : 'chẵn';
    prompt('Mở những quả trứng có số '+label+'.');
    data.forEach(n=>button('🥚 '+n,node=>{
      if (kind(n)!==label) { feedback('Bé thử tìm một quả trứng khác nhé.'); return; }
      mark(node);
      node.textContent='🐣 '+n;
      completed.add(n);
      if(completed.size===5) finish('Năm quả trứng đã nở!');
      else feedback('Đúng rồi!');
    },'token'));
    return;
  }
  const answer = data[round % data.length];
  prompt('Nhóm nào có '+answer+' quả táo?');
  const options = [answer,answer === 10 ? 1 : answer+1,answer < 3 ? answer+2 : answer-2].sort((a,b)=>a-b);
  options.forEach(n=>{
    const node = button('',()=>{
      if (completed.size) return;
      if(n!==answer){feedback('Bé đếm lại từng quả nhé.');return;}
      completed.add(n);
      mark(node);
      finish('Đúng rồi! Có '+n+' quả táo.');
    },'token');
    const apples = document.createElement('span');
    apples.className='apples';
    for(let i=0;i<n;i++){
      const apple = document.createElement('span');
      apple.textContent='🍎';
      apples.append(apple);
    }
    node.append(apples);
  });
}
get('home').onclick = () => reset(-1);
get('restart').onclick = () => reset(mode,round);
get('read').onclick = () => {
  const message = get('prompt').textContent;
  if (!window.speechSynthesis?.getVoices().some(item=>item.localService&&/^vi/i.test(item.lang))) {
    get('feedback').textContent='Máy chưa có giọng tiếng Việt ngoại tuyến. Cô đọc câu hỏi giúp bé nhé.';
    return;
  }
  say(message);
};
get('sound').onclick = () => {
  audio = !audio;
  get('sound').setAttribute('aria-pressed',String(audio));
  if (!audio) window.speechSynthesis?.cancel();
};
get('full').onclick = async () => {
  try {
    if(document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { get('feedback').textContent='Trình duyệt chưa cho phép mở toàn màn hình.'; }
};
render();



