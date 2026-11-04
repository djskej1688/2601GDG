(() => {
'use strict';
const body=document.body,stage=document.querySelector('#film-stage');if(!stage)return;
const projects=[
{id:'mechanism',title:'MECHANISM AWARE GRAPHRAG',kind:'protein',description:'입자의 흔적이 회색 단백질 형상으로 드러나고 회전과 확대, 측면 이동으로 이어지는 예술적 시각화',copy:'<p>Mechanism aware GraphRAG는 단백질의 알로스테릭 부위 예측에 GraphRAG를 활용할 수 있는지 탐구하는 연구입니다.</p><p>이 화면은 연구를 소개하기 위한 시각적 습작입니다. 특정 단백질의 구조, 결합 부위 또는 검증된 예측 결과를 재현하지 않습니다.</p>'},
{id:'lattice',title:'개인의 경험을 집합으로 구조화하고 그 관계를 활용해 생성하면, 그 사람에게 의미 있으면서도 예상 밖인 아이디어를 얻을 수 있는가?',kind:'lattice',description:'흩어진 점들이 집합과 관계를 이루고 새로운 연결로 이어지는 격자 연구의 개념적 시각화',copy:'<p>개인의 경험을 집합으로 구조화하고, 집합 사이의 관계를 생성에 활용하는 격자 연구입니다.</p><p>이 제목은 현재 탐구하는 연구 질문입니다. 의미 있으면서 예상 밖인 아이디어를 얻을 수 있다는 결론이나 검증된 성과를 뜻하지 않습니다.</p>'},
{id:'financial',title:'FINANCIAL GRAPHRAG',kind:'financial',description:'문서의 흔적이 세 개의 추상적 그래프로 이어지고 관계를 비교하는 금융 GraphRAG의 개념적 시각화',copy:'<p>비정형 데이터로 예측하는 방법을 알아보다 GraphRAG를 접했습니다. 금융 공시의 수치 질의응답을 출발점으로, 지식 그래프의 품질을 높이면 복잡한 질문에서 벡터 RAG보다 나은 답을 얻을 수 있는지 실험했습니다.</p><p>데이터와 지식 그래프를 다듬고 여러 제공사의 언어 모델로 답변을 평가했습니다. 정답 근거를 제공한 조건에서도 점수가 0으로 나오는 문제를 추적하며 평가 방식을 재검토했습니다. 이후 정답 필드에 연도가 들어간 채점 오류를 수정하면서 초기 결과가 뒤집혔습니다.</p><p>후속 검토에서는 단일 기업 비교의 일부 조건이 실제 벡터 검색이 아니라 제공된 사례 원문을 사용했다는 점도 바로잡았습니다. GraphRAG가 모든 금융 질문에서 더 낫다는 결론은 내리지 않습니다.</p><div class="result-label">REPOSITORY-REPORTED / R15</div><p class="result">0.825 / 0.163</p><p class="scope">Answer Correctness · graph_structured / chunk-level vector retrieval<br>지식 그래프에서 답할 수 있는 정보를 바탕으로 만든 합성 기업 간 비교 질문 80개에서 보고된 값입니다. 이 조건에서 약 5.1배이며, 일반적인 정확도 향상을 의미하지 않습니다. 저장소의 실험 보고를 인용했으며 실험을 독립적으로 재현하지 않았습니다.</p><a href="https://github.com/djskej1688/FinancialGraphRAG" target="_blank" rel="noopener noreferrer">Repository &amp; evaluation notes ↗</a>'}
];
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),toggle=document.querySelector('#film-toggle'),seek=document.querySelector('#film-seek');
const menuButton=document.querySelector('#menu-toggle'),menu=document.querySelector('#mobile-menu'),view=document.querySelector('#view-toggle'),effects=document.querySelector('#effects-toggle'),dialog=document.querySelector('#project-dialog'),info=document.querySelector('#project-info');
let film=null,canvas=document.querySelector('#protein-film'),selected=0,manualPaused=false,holdTimer=0,holdTriggered=false,resizeFrame=0,generation=0;
const format=t=>'00:'+String(Math.floor(t)).padStart(2,'0');
function sync(){if(!film)return;toggle.textContent=film.playing?'PAUSE':'PLAY';toggle.setAttribute('aria-label',film.playing?'Pause film':'Play film');document.querySelector('#film-state').textContent=(film.playing?'PLAYING':'PAUSED')+' / '+String(selected+1).padStart(2,'0')+' OF 03';}
function resizeSoon(){cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>film?.resize());}
function closeMenu(){menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.textContent='Menu';}
menuButton.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.textContent=open?'Close':'Menu';});
function updateInfo(){document.querySelector('#info-title').textContent=projects[selected].title;document.querySelector('#info-copy').innerHTML=projects[selected].copy;}
info.addEventListener('click',()=>{updateInfo();dialog.showModal();});
document.querySelector('#info-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
effects.addEventListener('click',()=>{const enabled=body.classList.toggle('effects-on');effects.setAttribute('aria-pressed',String(enabled));effects.textContent=enabled?'ESC / REMOVE EFFECTS':'ESC / EFFECTS';});
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||dialog.open)return;if(!menu.hidden){closeMenu();menuButton.focus();}else if(!reduce.matches)effects.click();});
function setOverview(value){body.classList.toggle('film-overview',value);view.setAttribute('aria-pressed',String(value));document.querySelector('.carousel-caption').hidden=!value;view.querySelector('.hold-label').textContent=value?'HOLD TO RETURN':'CLICK AND HOLD';resizeSoon();setTimeout(resizeSoon,reduce.matches?0:850);}
function cancelHold(){clearTimeout(holdTimer);holdTimer=0;view.classList.remove('holding');}
view.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();holdTriggered=false;view.setPointerCapture(e.pointerId);view.classList.add('holding');holdTimer=setTimeout(()=>{holdTriggered=true;setOverview(!body.classList.contains('film-overview'));cancelHold();},1700);});
view.addEventListener('pointerup',cancelHold);view.addEventListener('pointercancel',cancelHold);view.addEventListener('lostpointercapture',cancelHold);
view.addEventListener('click',e=>{if(e.detail===0&&!holdTriggered)setOverview(!body.classList.contains('film-overview'));holdTriggered=false;});
function showError(){document.querySelector('#film-error').hidden=false;toggle.disabled=true;seek.disabled=true;document.querySelector('#film-restart').disabled=true;}
function choose(index,updateLocation=true){
 if(index<0||index>=projects.length)index=0;generation++;const thisGeneration=generation;film?.destroy();film=null;selected=index;
 const project=projects[index];body.dataset.activeProject=project.id;document.title=project.title+' · dandellas';
 const fresh=document.createElement('canvas');fresh.id='protein-film';fresh.setAttribute('aria-label',project.description);canvas.replaceWith(fresh);canvas=fresh;
 document.querySelector('#film-error').hidden=true;toggle.disabled=false;seek.disabled=false;document.querySelector('#film-restart').disabled=false;
 document.querySelectorAll('.work-row').forEach((row,i)=>{row.setAttribute('aria-pressed',String(i===index));row.style.setProperty('--progress','0%');});
 document.querySelector('#carousel-title').textContent=project.title;document.querySelector('#carousel-number').textContent=String(index+1).padStart(2,'0')+' / 03';updateInfo();
 if(updateLocation)history.replaceState(null,'','#'+project.id);
 const options={kind:project.kind,duration:24,reducedMotion:reduce.matches,onError(){if(thisGeneration===generation)showError();},
 onTime(time,duration){if(thisGeneration!==generation)return;seek.value=String(time);seek.setAttribute('aria-valuetext',time.toFixed(1)+' / '+duration+' seconds');document.querySelector('#film-time').textContent=format(time);document.querySelectorAll('.work-row')[index].style.setProperty('--progress',time/duration*100+'%');sync();},
 onPhase(phase){if(thisGeneration===generation)document.querySelector('#film-phase').textContent=phase.label;},
 onEnd(){if(thisGeneration!==generation)return;sync();if(!manualPaused&&!reduce.matches)film?.play();}};
 try{film=project.kind==='protein'?new ProteinFilm(canvas,options):new ProjectFilm(canvas,options);if(!film.available)throw Error('Renderer unavailable');film.setReducedMotion(reduce.matches);manualPaused=reduce.matches;if(reduce.matches)film.seek(7);else film.play();sync();}catch{showError();}
}
document.querySelectorAll('.work-row').forEach((row,i)=>row.addEventListener('click',()=>choose(i)));
toggle.addEventListener('click',()=>{if(!film?.available)return;manualPaused=film.playing;film.playing?film.pause():film.play();sync();});
document.querySelector('#film-restart').addEventListener('click',()=>{if(!film?.available)return;manualPaused=false;film.seek(0);film.play();sync();});
seek.addEventListener('input',()=>{film?.seek(Number(seek.value));sync();});
reduce.addEventListener('change',()=>{film?.setReducedMotion(reduce.matches);if(reduce.matches){manualPaused=true;film?.pause();body.classList.remove('effects-on');effects.setAttribute('aria-pressed','false');effects.textContent='ESC / EFFECTS';}sync();resizeSoon();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){manualPaused=true;film?.pause();cancelHold();sync();}});
const observer=new ResizeObserver(resizeSoon);observer.observe(stage);window.addEventListener('resize',resizeSoon);
const full=document.querySelector('#film-fullscreen');if(!document.fullscreenEnabled)full.hidden=true;
full.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen();}catch{full.hidden=true;}resizeSoon();});
document.addEventListener('fullscreenchange',resizeSoon);
window.addEventListener('hashchange',()=>choose(projects.findIndex(p=>p.id===location.hash.slice(1)),false));
choose(projects.findIndex(p=>p.id===(location.hash.slice(1)||body.dataset.project)),false);
window.addEventListener('pagehide',()=>{generation++;cancelHold();cancelAnimationFrame(resizeFrame);observer.disconnect();film?.destroy();},{once:true});
})();
