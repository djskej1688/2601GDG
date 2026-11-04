(() => {
  'use strict';
  const data=window.PHOTO_PORTFOLIO;
  const $=selector=>document.querySelector(selector);
  const overview=$('#overview-view'),project=$('#project-view'),indexView=$('#index-view');
  const grid=$('#portfolio-grid'),gallery=$('#gallery'),menu=$('#mobile-menu');
  const returnButton=$('#return-link'),announcement=$('#view-announcement');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  const mobileLayout=matchMedia('(max-width: 700px)');
  const indexGrid=$('#index-overview'),allGrids=[grid,indexGrid];
  const defaultIndexMode=()=>mobileLayout.matches?'overview':'list';
  const groups=Array.isArray(data?.groups)?data.groups.filter(g=>Array.isArray(g.photos)&&g.photos.length):[];
  const photos=new Map(groups.flatMap(g=>g.photos.map(p=>[p.id,p])));
  const groupMap=new Map(groups.map(g=>[String(g.id),g]));
  let currentView='overview',currentGroup=null,currentPhoto=0,indexMode=defaultIndexMode();
  let scrollFrame=0,historyTimer=0,restoring=false;
  let heroIndex=0,heroSlot=0,heroTimer=0,heroPaused=false,heroChanging=false;
  let heroInView=true,heroRequest=0;
  let menuTrigger=null,menuOverflow='';
  const heroPhotos=(Array.isArray(data?.hero)?data.hero:[]).map(id=>photos.get(id)).filter(Boolean);
  const heroFrames=[];
  if('scrollRestoration' in history)history.scrollRestoration='manual';

  if(!groups.length){$('#empty-state').hidden=false;overview.hidden=true;return;}
  const pad=value=>String(value).padStart(2,'0');
  const groupNumber=group=>String(group.id);
  function imageFor(photo,small=false){
    const image=document.createElement('img');image.src=small?(photo.thumb||photo.src):photo.src;
    image.alt=photo.alt||`사진 ${photo.id}`;image.width=photo.width;image.height=photo.height;
    image.loading='lazy';image.decoding='async';return image;
  }
  function setHover(groupId,cell=null,scope=grid){
    if(groupId&&!finePointer.matches)return;
    scope.classList.toggle('is-hovering',!!groupId);
    scope.querySelectorAll('[data-group-cell]').forEach(item=>{item.classList.toggle('is-group-active',item.dataset.groupCell===groupId);item.classList.toggle('is-photo-hovered',item===cell);});
  }
  function buildGallery(container=grid,prefix='photo-link'){
    const fragment=document.createDocumentFragment();
    groups.forEach(group=>{
      const section=document.createElement('section');section.className='photo-group';section.dataset.group=String(group.id);section.setAttribute('aria-label',`사진 묶음 ${group.id}`);
      const heading=document.createElement('h2');heading.className='group-label';heading.dataset.groupCell=String(group.id);heading.textContent=`${groupNumber(group)}.1–${groupNumber(group)}.${group.photos.length}`;section.append(heading);
      group.photos.forEach((photo,position)=>{
        const cell=document.createElement('div');cell.className='photo-cell';cell.dataset.groupCell=String(group.id);
        const button=document.createElement('button');button.type='button';button.className='photo-link';button.id=`${prefix}-${photo.id}`;button.dataset.photo=photo.id;button.dataset.group=String(group.id);button.setAttribute('aria-label',`${photo.alt||'사진'}, 묶음 ${group.id} 열기`);
        const number=document.createElement('span');number.className='photo-number';number.textContent=`${groupNumber(group)}.${position+1}`;number.setAttribute('aria-hidden','true');
        button.append(number,imageFor(photo,true));button.addEventListener('click',()=>navigate('project',{group:String(group.id),photo:position},button));
        button.addEventListener('pointerenter',()=>setHover(String(group.id),cell,container));button.addEventListener('pointerleave',()=>setHover(null,null,container));
        button.addEventListener('focus',()=>{if(finePointer.matches)setHover(String(group.id),null,container);});button.addEventListener('blur',()=>setHover(null,null,container));cell.append(button);section.append(cell);
      });fragment.append(section);
    });container.append(fragment);container.addEventListener('pointerleave',()=>setHover(null,null,container));
  }
  function clearIndexHover(){indexView.classList.remove('is-list-hovered');$('#index-list').querySelectorAll('.is-list-active').forEach(row=>row.classList.remove('is-list-active'));}
  function showIndexHover(group,row){
    if(!finePointer.matches||currentView!=='index'||indexMode!=='list')return;
    const photo=group.photos[0],image=$('#index-hover-image');image.src=photo.src;image.width=photo.width;image.height=photo.height;
    indexView.classList.add('is-list-hovered');$('#index-list').querySelectorAll('.index-row').forEach(item=>item.classList.toggle('is-list-active',item===row));
  }
  function buildIndex(){
    groups.forEach(group=>{
      const row=document.createElement('button');row.type='button';row.className='index-row';row.id=`index-group-${group.id}`;row.setAttribute('aria-label',`사진 묶음 ${group.id}, ${group.photos.length}장`);
      const number=document.createElement('span');number.textContent=String(group.id);const count=document.createElement('span');count.textContent=pad(group.photos.length);row.append(number,count);row.addEventListener('click',()=>navigate('project',{group:String(group.id),photo:0},row));$('#index-list').append(row);
      row.addEventListener('pointerenter',()=>showIndexHover(group,row));row.addEventListener('pointerleave',clearIndexHover);row.addEventListener('focus',()=>showIndexHover(group,row));row.addEventListener('blur',clearIndexHover);
    });
    $('#index-list').addEventListener('pointerleave',clearIndexHover);
  }
  function updateIndex(mode){
    clearIndexHover();
    indexMode=mode==='overview'?'overview':'list';$('#index-list').hidden=indexMode!=='list';$('#index-overview').hidden=indexMode!=='overview';
    indexView.dataset.mode=indexMode;
    document.querySelectorAll('[data-index-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.indexMode===indexMode)));
  }
  function buildProject(group){
    currentGroup=group;currentPhoto=0;$('#project-number').textContent=String(group.id);$('#project-number').setAttribute('aria-label',`사진 묶음 ${group.id}`);
    const container=$('#project-photos'),rail=$('#project-thumbnails');container.replaceChildren();rail.replaceChildren();
    group.photos.forEach((photo,position)=>{
      const figure=document.createElement('figure');figure.className='project-photo';figure.id=`project-photo-${photo.id}`;figure.dataset.position=String(position);figure.tabIndex=-1;
      const image=imageFor(photo);if(position===0){image.loading='eager';image.fetchPriority='high';}figure.append(image);container.append(figure);
      const thumb=document.createElement('button');thumb.type='button';thumb.dataset.position=String(position);thumb.setAttribute('aria-label',`${position+1}번째 사진으로 이동`);thumb.setAttribute('aria-controls',figure.id);thumb.append(imageFor(photo,true));thumb.addEventListener('click',()=>goToPhoto(position));rail.append(thumb);
    });updatePhotoCounter(0);
  }
  function updatePhotoCounter(position){
    if(!currentGroup)return;currentPhoto=position;$('#project-counter').textContent=`${pad(position+1)} / ${pad(currentGroup.photos.length)}`;
    $('#project-thumbnails').querySelectorAll('button').forEach(button=>{if(Number(button.dataset.position)===position)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});
  }
  function photoFromScroll(){
    if(currentView!=='project'||!currentGroup)return;
    if(scrollY<=1){if(currentPhoto!==0)updatePhotoCounter(0);return;}
    if(scrollY+innerHeight>=document.documentElement.scrollHeight-2){const last=currentGroup.photos.length-1;if(currentPhoto!==last)updatePhotoCounter(last);return;}
    const center=innerHeight*.5;let selected=0,best=Infinity;
    document.querySelectorAll('.project-photo').forEach((figure,position)=>{const r=figure.getBoundingClientRect();const distance=center<r.top?r.top-center:center>r.bottom?center-r.bottom:0;if(distance<best){best=distance;selected=position;}});
    if(selected!==currentPhoto)updatePhotoCounter(selected);
  }
  function goToPhoto(position){
    if(!currentGroup)return;const next=Math.min(currentGroup.photos.length-1,Math.max(0,position));
    const figure=document.getElementById(`project-photo-${currentGroup.photos[next].id}`);updatePhotoCounter(next);scrollTo({top:photoScrollTop(figure),behavior:reduce.matches?'auto':'smooth'});
  }
  function photoScrollTop(figure){const r=figure.getBoundingClientRect();const inset=r.height<innerHeight*.7?(innerHeight-r.height)/2:45;return Math.max(0,r.top+scrollY-inset);}
  function saveViewportState(){if(history.state?.portfolio)history.replaceState({...history.state,scroll:scrollY,photo:currentView==='project'?currentPhoto:history.state.photo},'',location.href);}
  function saveCurrent(trigger){
    clearTimeout(historyTimer);
    const previous=history.state?.portfolio?history.state:{};
    history.replaceState({...previous,portfolio:true,view:currentView,group:currentGroup?.id,indexMode,scroll:scrollY,focus:trigger?.id||document.activeElement?.id||null},'',location.href);
  }
  function navigate(view,details={},trigger=null){
    const returnFocus=menu.open?$('#menu-toggle'):trigger;
    if(menu.open)menu.close();saveCurrent(returnFocus);
    const state={portfolio:true,fromApp:true,view,...details,indexMode:view==='index'?defaultIndexMode():indexMode,scroll:0};
    const hash=view==='project'?`#project-${encodeURIComponent(details.group)}`:view==='index'?'#index':'';
    history.pushState(state,'',location.pathname+location.search+hash);renderState(state,false);
  }
  function renderState(state,restore){
    const view=state?.view==='project'&&groupMap.has(String(state.group))?'project':state?.view==='index'?'index':'overview';
    currentView=view;document.body.dataset.view=view;allGrids.forEach(scope=>setHover(null,null,scope));clearIndexHover();
    overview.hidden=view!=='overview';project.hidden=view!=='project';indexView.hidden=view!=='index';
    $('#header-center').hidden=view!=='overview';$('#desktop-nav').hidden=view!=='overview';$('#menu-toggle').hidden=view!=='overview';returnButton.hidden=view==='overview';
    if(view==='project')buildProject(groupMap.get(String(state.group)));
    if(view==='index')updateIndex(state.indexMode||defaultIndexMode());
    syncHero();restoring=true;
    requestAnimationFrame(()=>{
      if(restore){scrollTo({top:Number(state.scroll)||0,behavior:'instant'});if(state.focus)document.getElementById(state.focus)?.focus({preventScroll:true});}
      else{scrollTo({top:state.gallery?gallery.getBoundingClientRect().top+scrollY-45:0,behavior:'instant'});if(view!=='overview')returnButton.focus({preventScroll:true});}
      if(view==='project'&&state.photo>0&&(!restore||!state.scroll)){const figure=document.querySelectorAll('.project-photo')[state.photo];if(figure)scrollTo({top:photoScrollTop(figure),behavior:'instant'});updatePhotoCounter(state.photo);}
      requestAnimationFrame(()=>{restoring=false;photoFromScroll();});
    });
    announcement.textContent=view==='project'?`사진 묶음 ${state.group}, ${currentGroup.photos.length}장.`:view==='index'?'사진 인덱스.':'사진 목록으로 돌아왔어요.';
  }
  function returnToPrevious(){
    if(history.state?.fromApp){saveCurrent(returnButton);history.back();return;}
    const state={portfolio:true,fromApp:false,view:'overview',scroll:0};history.replaceState(state,'',location.pathname+location.search);renderState(state,true);
  }
  function scrollGallery(){
    if(menu.open)menu.close();
    if(currentView!=='overview'){navigate('overview');requestAnimationFrame(()=>gallery.scrollIntoView({behavior:reduce.matches?'auto':'smooth'}));}
    else gallery.scrollIntoView({behavior:reduce.matches?'auto':'smooth'});
  }
  function stateFromLocation(){
    let state={portfolio:true,fromApp:false,view:'overview',scroll:0};
    if(location.hash==='#gallery')state={...state,gallery:true};
    else if(location.hash==='#index')state={...state,view:'index',indexMode:defaultIndexMode()};
    else if(location.hash.startsWith('#project-')){try{const group=decodeURIComponent(location.hash.slice(9));if(groupMap.has(group))state={...state,view:'project',group,photo:0};}catch{}}
    return state;
  }

  function heroCanRun(){return heroPhotos.length>1&&!heroPaused&&!reduce.matches&&!document.hidden&&heroInView&&currentView==='overview'&&!menu.open;}
  function scheduleHero(){clearTimeout(heroTimer);heroTimer=0;if(heroCanRun())heroTimer=setTimeout(()=>changeHero(heroIndex+1),6500);}
  function syncHero(){
    $('#hero-pause').hidden=reduce.matches||heroPhotos.length<2;
    $('#hero-pause').textContent=heroPaused?'Play':'Pause';$('#hero-pause').setAttribute('aria-label',heroPaused?'사진 슬라이드 재생':'사진 슬라이드 일시정지');scheduleHero();
  }
  async function changeHero(next,manual=false){
    if(!heroPhotos.length)return;const request=++heroRequest;heroChanging=true;clearTimeout(heroTimer);
    const position=(next+heroPhotos.length)%heroPhotos.length;const photo=heroPhotos[position];const nextSlot=1-heroSlot;const frame=heroFrames[nextSlot];
    frame.src=photo.src;frame.width=photo.width;frame.height=photo.height;frame.alt=photo.alt||'';
    try{await frame.decode();}catch{if(request===heroRequest){heroChanging=false;scheduleHero();}return;}
    if(request!==heroRequest)return;
    if(!manual&&!heroCanRun()){heroChanging=false;scheduleHero();return;}
    heroFrames[heroSlot].classList.remove('is-current');heroFrames[heroSlot].setAttribute('aria-hidden','true');frame.classList.add('is-current');frame.removeAttribute('aria-hidden');heroSlot=nextSlot;heroIndex=position;heroChanging=false;
    $('#hero-counter').textContent=`${pad(position+1)} / ${pad(heroPhotos.length)}`;scheduleHero();
  }
  function buildHero(){
    if(!heroPhotos.length)return;
    for(let i=0;i<2;i++){const image=document.createElement('img');image.className='hero-image';image.alt='';image.decoding='async';image.setAttribute('aria-hidden','true');if(i===0){image.src=heroPhotos[0].src;image.alt=heroPhotos[0].alt||'';image.width=heroPhotos[0].width;image.height=heroPhotos[0].height;image.fetchPriority='high';image.classList.add('is-current');image.removeAttribute('aria-hidden');}heroFrames.push(image);$('#hero-images').append(image);}
    $('#hero-counter').textContent=`01 / ${pad(heroPhotos.length)}`;$('#hero-controls').hidden=false;
    heroFrames[0].decode().catch(()=>{}).finally(scheduleHero);
  }
  function closeMenu(){if(menu.open)menu.close();}
  $('#menu-toggle').addEventListener('click',()=>{menuTrigger=document.activeElement;menuOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';menu.showModal();$('#menu-close').focus();syncHero();});
  $('#menu-close').addEventListener('click',closeMenu);
  menu.addEventListener('close',()=>{document.documentElement.style.overflow=menuOverflow;menuTrigger?.focus({preventScroll:true});syncHero();});
  menu.addEventListener('click',event=>{if(event.target===menu)menu.close();});
  document.querySelectorAll('[data-gallery]').forEach(button=>button.addEventListener('click',scrollGallery));
  $('.skip-link').addEventListener('click',event=>{event.preventDefault();scrollGallery();gallery.focus({preventScroll:true});});
  document.querySelectorAll('[data-index]').forEach(button=>button.addEventListener('click',()=>navigate('index',{},button)));
  document.querySelectorAll('[data-index-mode]').forEach(button=>button.addEventListener('click',()=>{updateIndex(button.dataset.indexMode);saveCurrent(button);announcement.textContent=indexMode==='list'?'인덱스 목록 보기.':'인덱스 사진 보기.';}));
  returnButton.addEventListener('click',returnToPrevious);
  $('#site-name').addEventListener('click',event=>{event.preventDefault();if(currentView!=='overview')returnToPrevious();else scrollTo({top:0,behavior:reduce.matches?'auto':'smooth'});});
  $('#hero-previous').addEventListener('click',()=>changeHero(heroIndex-1,true));$('#hero-next').addEventListener('click',()=>changeHero(heroIndex+1,true));$('#hero-pause').addEventListener('click',()=>{heroPaused=!heroPaused;syncHero();});
  window.addEventListener('popstate',event=>{clearTimeout(historyTimer);const state=event.state?.portfolio?event.state:stateFromLocation();if(state.gallery&&!event.state?.portfolio)state.scroll=gallery.getBoundingClientRect().top+scrollY-45;renderState(state,true);});
  window.addEventListener('scroll',()=>{if(restoring)return;cancelAnimationFrame(scrollFrame);scrollFrame=requestAnimationFrame(photoFromScroll);clearTimeout(historyTimer);historyTimer=setTimeout(saveViewportState,150);},{passive:true});
  document.addEventListener('keydown',event=>{if(currentView!=='project'||menu.open||event.altKey||event.ctrlKey||event.metaKey)return;if(event.key==='Escape'){event.preventDefault();returnToPrevious();}else if(event.key==='ArrowRight'){event.preventDefault();goToPhoto(currentPhoto+1);}else if(event.key==='ArrowLeft'){event.preventDefault();goToPhoto(currentPhoto-1);}});
  document.addEventListener('visibilitychange',syncHero);reduce.addEventListener('change',syncHero);finePointer.addEventListener('change',()=>{if(!finePointer.matches){allGrids.forEach(scope=>setHover(null,null,scope));clearIndexHover();}});
  new IntersectionObserver(entries=>{heroInView=entries[0].isIntersecting;syncHero();},{threshold:0}).observe($('.photo-hero'));

  buildGallery();buildGallery(indexGrid,'index-photo-link');buildIndex();buildHero();
  const initial=stateFromLocation();
  history.replaceState(initial,'',location.href);renderState(initial,false);
})();
