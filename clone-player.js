(() => {
  const box=document.createElement('section');
  box.className='panel';box.style.cssText='max-width:1100px;margin:24px auto 0';
  box.innerHTML=`<h3 style="margin-top:0">Listen in Luke’s voice</h3><p class="small">Narrated with your local Chatterbox voice clone. Audio is generated ahead of time, so your Windows computer does not need to stay on.</p><div class="row"><button id="clone-start" class="primary">Play selected section</button><label><input id="clone-all" type="checkbox" checked>Continue through remaining sections</label><label>Speed <select id="clone-speed" aria-label="Narration speed"><option value="0.85">0.85×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option></select></label></div><p id="clone-status" class="small" role="status">Select a section below, then press Play.</p><audio id="clone-audio" controls preload="metadata" src="audio/section-1.mp3" style="width:100%" aria-label="Luke voice narration"></audio>`;
  document.querySelector('main').before(box);
  const audio=box.querySelector('audio'),status=box.querySelector('#clone-status');let playingUnit=-1;
  async function playSection(i) {
    if(window.speechSynthesis)window.speechSynthesis.cancel();
    playingUnit=i;unitIndex=i;hideLesson=false;view='learn';render();
    audio.src=`audio/section-${i+1}.mp3`;audio.playbackRate=+box.querySelector('#clone-speed').value;
    status.textContent=`Section ${i+1} of ${DATA.units.length}: ${DATA.units[i].title}`;
    try {await audio.play();}catch(e){status.textContent='Press the audio player’s Play button to begin. If unavailable, refresh after deployment.';}
  }
  box.querySelector('#clone-start').onclick=()=>playSection(unitIndex);
  box.querySelector('#clone-speed').onchange=e=>audio.playbackRate=+e.target.value;
  audio.onended=()=>{if(box.querySelector('#clone-all').checked&&playingUnit<DATA.units.length-1)playSection(playingUnit+1);else status.textContent='Finished. Try explaining what you heard without looking.';};
  audio.onerror=()=>status.textContent='This narration could not load. Refresh the page or try again.';
  window.addEventListener('pagehide',()=>audio.pause());
})();
