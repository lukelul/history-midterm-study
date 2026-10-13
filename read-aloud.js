// Speech stays in the browser; no API key or audio upload is required.
(() => {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  let voices = [], selected = localStorage.getItem('his-voice') || '', rate = Number(localStorage.getItem('his-rate')) || 0.95;
  let queue = [], position = 0, active = false, paused = false, token = 0, current;
  let status = 'Choose a voice, then press Play. Voice quality depends on your browser and device.';
  const english = () => voices.filter(v => /^en([-_]|$)/i.test(v.lang));
  function updateVoices() {
    voices = synth.getVoices();
    if (!voices.some(v => v.voiceURI === selected)) {
      const ranked = english().sort((a,b) => score(b)-score(a));
      selected = (ranked[0] || voices[0])?.voiceURI || '';
    }
    mount();
  }
  function score(v) { return (/natural|neural|premium|enhanced/i.test(v.name)?100:0)+(/aria|jenny|samantha|google us english/i.test(v.name)?30:0)+(/en-US/i.test(v.lang)?10:0); }
  function chunks(text) { return (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[text]).flatMap(s => s.length<240?[s]:s.match(/.{1,220}(?:\s|$)|\S+/g)||[s]); }
  function section(i) {
    const u=DATA.units[i];
    return [u.title,u.question,...u.story,'Causes. '+u.causes,'Consequences and significance. '+u.result,'A mistake to avoid. '+u.pitfall,'People and concepts.',...u.terms.map(t=>t.join('. ')),'Sequence of events.',...u.sequence.map(t=>t.join('. '))].flatMap(chunks).map(text=>({text,unit:i}));
  }
  function stop() { token++; active=false; paused=false; synth.cancel(); current=null; status='Stopped.'; mount(); }
  function speak() {
    if (!active || position>=queue.length) { active=false; paused=false; status='Finished. Try explaining what you heard without looking.'; mount(); return; }
    const item=queue[position], generation=token;
    if(unitIndex!==item.unit) { unitIndex=item.unit; hideLesson=false; render(); }
    status=`Reading section ${item.unit+1} of ${DATA.units.length} · passage ${position+1} of ${queue.length}`;
    mount();
    current=new SpeechSynthesisUtterance(item.text.trim());
    current.voice=voices.find(v=>v.voiceURI===selected)||null;
    current.lang=current.voice?.lang||'en-US'; current.rate=rate;
    current.onend=()=>{if(generation===token&&active){position++;speak();}};
    current.onerror=e=>{if(generation===token&&e.error!=='canceled'&&e.error!=='interrupted'){active=false;status='Voice unavailable. Choose another voice and press Play. ('+e.error+')';mount();}};
    synth.speak(current);
  }
  function mount() {
    let box=document.getElementById('read-aloud');
    if(!box && view==='learn') {box=document.createElement('section');box.id='read-aloud';box.className='panel';box.style.margin='16px 0';document.querySelector('.lesson-title')?.after(box);}
    if(!box)return;
    box.innerHTML=`<h3 style="margin-top:0">Listen to the sections</h3><div class="row"><label>Voice <select id="speech-voice" aria-label="Reading voice">${(english().length?english():voices).map(v=>`<option value="${esc(v.voiceURI)}" ${v.voiceURI===selected?'selected':''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')||'<option>Browser default</option>'}</select></label><label>Speed <select id="speech-rate">${[0.75,0.85,0.95,1,1.15,1.3].map(r=>`<option ${r===rate?'selected':''} value="${r}">${r}×</option>`).join('')}</select></label><label><input id="speech-all" type="checkbox" ${all?'checked':''}>Continue through remaining sections</label></div><div class="row" style="margin-top:12px"><button id="speech-play" class="primary">${active?(paused?'Resume':'Pause'):'Play this section'}</button><button id="speech-stop" ${active?'':'disabled'}>Stop</button><button id="speech-restart">Restart section</button></div><p class="small" role="status" aria-live="polite">${esc(status)}</p><p class="small">Reads the explanation, causes, significance, concepts, and timeline. Select a Natural or Neural voice when available. Keep this tab open while listening.</p>`;
    document.getElementById('speech-voice').onchange=e=>{selected=e.target.value;localStorage.setItem('his-voice',selected);if(active){token++;synth.cancel();paused=false;speak();}};
    document.getElementById('speech-rate').onchange=e=>{rate=+e.target.value;localStorage.setItem('his-rate',rate);if(active){token++;synth.cancel();paused=false;speak();}};
    document.getElementById('speech-all').onchange=e=>{all=e.target.checked;};
    document.getElementById('speech-play').onclick=()=>{if(active){paused=!paused;paused?synth.pause():synth.resume();status=paused?'Paused.':`Reading section ${unitIndex+1}`;mount();}else start();};
    document.getElementById('speech-stop').onclick=stop;
    document.getElementById('speech-restart').onclick=()=>{stop();start();};
  }
  let all=false;
  function start() { token++;synth.cancel();queue=(all?DATA.units.map((_,i)=>i).slice(unitIndex):[unitIndex]).flatMap(section);position=0;active=true;paused=false;speak(); }
  const originalRender=render;
  render=function(){originalRender();mount();};
  synth.addEventListener('voiceschanged',updateVoices);
  window.addEventListener('pagehide',()=>synth.cancel());
  updateVoices();
})();
