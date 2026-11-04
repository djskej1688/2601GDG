/* Original procedural ribbon study. No PDB, pocket or private research data.
 * All geometry is invented artwork, not a verified biological structure.
 * Native WebGL supplies depth-tested smooth surfaces and a same-surface ASCII resolve.
 */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
  const mix = (a,b,t) => a+(b-a)*t;
  const ease = (a,b,x) => { const t=clamp((x-a)/(b-a)); return t*t*(3-2*t); };
  const add = (a,b) => a.map((v,i)=>v+b[i]);
  const sub = (a,b) => a.map((v,i)=>v-b[i]);
  const mul = (a,n) => a.map(v=>v*n);
  const dot = (a,b) => a.reduce((sum,v,i)=>sum+v*b[i],0);
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit = a => mul(a,1/(Math.hypot(...a)||1));
  const lerp = (a,b,t) => a.map((v,i)=>mix(v,b[i],t));
  const cubic = (a,b,c,d,t) => {const s=1-t;return a.map((v,i)=>s*s*s*v+3*s*s*t*b[i]+3*s*t*t*c[i]+t*t*t*d[i]);};
  const PHASES = Object.freeze([
    Object.freeze({id:'silhouette',label:'01 / FIELD',name:'ASCII surface resolving',index:0,start:0,end:4}),
    Object.freeze({id:'rotation',label:'02 / FORM',name:'Rotating ribbon study',index:1,start:4,end:10}),
    Object.freeze({id:'macro',label:'03 / CLOSE',name:'Cinematic close-up',index:2,start:10,end:16}),
    Object.freeze({id:'slide',label:'04 / PASSAGE',name:'Lateral camera movement',index:3,start:16,end:20}),
    Object.freeze({id:'return',label:'05 / RETURN',name:'Return to the whole form',index:4,start:20,end:24})
  ]);
  const VERTEX = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat3 uRotation;
    uniform float uScale;
    uniform float uAspect;
    uniform vec2 uPan;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main(){
      vec3 p=uRotation*aPosition;
      vPosition=p;
      vNormal=uRotation*aNormal;
      float w=4.2-p.z;
      gl_Position=vec4(p.x*uScale/uAspect+uPan.x*w,p.y*uScale+uPan.y*w,
        1.020202*w-0.2020202,w);
    }`;
  const MATERIAL = `
    precision highp float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main(){
      vec3 n=normalize(vNormal);
      vec3 eye=normalize(vec3(0.0,0.0,4.2)-vPosition);
      vec3 key=normalize(vec3(-0.65,0.8,1.2));
      vec3 fill=normalize(vec3(0.8,-0.2,0.7));
      float light=0.15+0.69*max(0.0,dot(n,key))+0.16*max(0.0,dot(n,fill));
      float spec=pow(max(0.0,dot(n,normalize(key+eye))),36.0)*0.14;
      float rim=pow(1.0-max(0.0,dot(n,eye)),3.0)*0.035;
      float shade=clamp(light+spec+rim,0.0,1.0);
      vec3 gray=vec3(0.75,0.765,0.755)*shade;
      gray+=vec3(0.025,0.024,0.014)*max(0.0,n.y)*0.35;
      gl_FragColor=vec4(pow(gray,vec3(0.85)),1.0);
    }`;
  const QUAD = `
    attribute vec2 aPosition;
    varying vec2 vUV;
    void main(){vUV=aPosition*0.5+0.5;gl_Position=vec4(aPosition,0.0,1.0);}`;
  const RESOLVE = `
    precision highp float;
    uniform sampler2D uScene;
    uniform sampler2D uGlyphs;
    uniform sampler2D uDistances;
    uniform vec2 uResolution;
    uniform float uCell;
    uniform float uProgress;
    uniform float uTime;
    varying vec2 vUV;
    float hash(vec2 v){return fract(sin(dot(v,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 v){
      vec2 i=floor(v),f=fract(v);f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),
        mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);
    }
    float ink(float glyph,vec2 q){
      q=clamp(q,vec2(0.025),vec2(0.975));
      return texture2D(uGlyphs,vec2((glyph+q.x)/12.0,1.0-q.y)).a;
    }
    void main(){
      vec3 bg=vec3(0.008,0.018,0.012);
      vec4 surface=texture2D(uScene,vUV);
      if(uProgress>=0.999){gl_FragColor=vec4(mix(bg,surface.rgb,surface.a),1.0);return;}
      vec2 pixel=vUV*uResolution;
      vec2 stepSize=vec2(uCell,uCell*1.35);
      vec2 cell=floor(pixel/stepSize);
      vec2 center=(cell+0.5)*stepSize/uResolution;
      vec4 sampleColor=texture2D(uScene,center);
      float lum=dot(sampleColor.rgb,vec3(0.299,0.587,0.114));
      float glyph=floor(clamp(lum*1.37,0.0,0.999)*12.0);
      vec2 q=fract(pixel/stepSize);
      float flicker=0.96+0.04*hash(cell+floor(uTime*5.0));
      vec3 ascii=mix(bg,vec3(0.33+lum*0.46),ink(glyph,q)*sampleColor.a*flicker);
      if(uProgress<=0.00001){gl_FragColor=vec4(ascii,1.0);return;}
      if(surface.a<0.001&&sampleColor.a<0.001){gl_FragColor=vec4(bg,1.0);return;}
      // Static contours, delays and speeds: only each mark's radius increases.
      // The distance atlas is measured from actual glyph ink, so growth starts
      // on the original strokes and may cross cells into neighboring islands.
      float ripples=noise(pixel/uCell*0.72)*0.20+noise(pixel/uCell*2.4)*0.085;
      float growth=0.0;
      for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
        vec2 neighbor=cell+vec2(float(x),float(y));
        vec2 at=(neighbor+0.5)*stepSize/uResolution;
        vec4 seedColor=texture2D(uScene,at);
        float seedLum=dot(seedColor.rgb,vec3(0.299,0.587,0.114));
        float mark=floor(clamp(seedLum*1.37,0.0,0.999)*12.0);
        float id=hash(neighbor+vec2(17.1,83.7));
        float cluster=noise(neighbor*0.15+vec2(7.1,2.6));
        float delay=0.025+id*0.30+cluster*0.20;
        float finish=min(0.985,delay+0.34+hash(neighbor+vec2(47.2,11.8))*0.58);
        float age=clamp((uProgress-delay)/(finish-delay),0.0,1.0);
        if(age>0.0){
          vec2 local=q-vec2(float(x),float(y));
          vec2 atlasUV=(local+1.5)/4.0;
          float distanceToInk=texture2D(uDistances,vec2((mark+atlasUV.x)/12.0,1.0-atlasUV.y)).r*2.0;
          vec2 direction=(local-0.5)*vec2(1.0,1.35);
          direction/=max(0.001,length(direction));
          float angle=id*6.2831853;
          vec2 axis=vec2(cos(angle),sin(angle));
          float anisotropy=0.115*pow(dot(direction,axis),2.0);
          float distortedDistance=distanceToInk*(1.0+ripples+anisotropy);
          float speedProfile=0.65+hash(neighbor+vec2(9.6,31.2))*1.35;
          float radius=1.18*pow(age,speedProfile);
          float edge=0.45/uCell;
          float island=(1.0-smoothstep(radius-edge,radius+edge,distortedDistance));
          growth=max(growth,island);
        }
      }
      // The union of growing ink islands reveals exact surface color locally.
      // There is no global opacity interpolation or synchronized cell filling.
      vec3 resolved=mix(bg,surface.rgb,surface.a);
      gl_FragColor=vec4(mix(ascii,resolved,growth),1.0);
    }`;

  class ProteinFilm {
    constructor(canvas, options={}) {
      this.canvas=canvas;
      this._duration=Number.isFinite(options.duration)&&options.duration>0?options.duration:24;
      this._time=0;this._playing=false;this._destroyed=false;this._raf=0;
      this._anchor=0;this._lastDraw=-Infinity;this._lastPhase='';this._ended=false;
      this._reduced=!!options.reducedMotion;
      this._callbacks={onTime:options.onTime,onPhase:options.onPhase,onEnd:options.onEnd,onError:options.onError};
      this._cssWidth=0;this._cssHeight=0;this.available=false;this.error=null;
      this.artStatus='Original procedural visual study; not a verified protein or pocket model.';
      try{this.gl=canvas?.getContext?.('webgl',{alpha:false,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});}catch(_){this.gl=null;}
      if(!this.gl){this._fail('WebGL is unavailable for the ribbon film.');return;}
      this._doc=canvas.ownerDocument||document;
      try{this._buildGeometry();this._buildRenderer();}catch(error){this._fail(error.message);return;}
      this.available=true;
      this._tick=this._tick.bind(this);
      this._handleVisibility=()=>{if(this._doc.hidden&&this._playing)this.pause();};
      this._doc.addEventListener('visibilitychange',this._handleVisibility);
      this._contextLost=event=>{event.preventDefault();this.pause();this._fail('The film graphics context was interrupted.');};
      canvas.addEventListener('webglcontextlost',this._contextLost);
      this.resize();
      if(!this.available)return;
      if(typeof ResizeObserver!=='undefined'){this._observer=new ResizeObserver(()=>this.resize());this._observer.observe(canvas);}
      canvas.dataset.filmState='paused';this._notify();
    }
    get duration(){return this._duration;}
    get currentTime(){return this._time;}
    get playing(){return this._playing;}
    get reducedMotion(){return this._reduced;}
    get phase(){const t=this._time/this._duration*24;const p=PHASES.find(v=>t<v.end)||PHASES[4];return {...p,start:p.start*this._duration/24,end:p.end*this._duration/24,reducedMotion:this._reduced,artistic:true};}
    _fail(message){this.available=false;this.error=message;if(this.canvas?.dataset)this.canvas.dataset.filmState='unavailable';this._call('onError',message);}
    play(){
      if(!this.available||this._destroyed||this._playing)return false;
      if(this._time>=this._duration)this._time=0;
      this._ended=false;this._playing=true;this._anchor=performance.now()-this._time*1000;this._lastDraw=-Infinity;
      this.canvas.dataset.filmState='playing';this._notify();this._raf=requestAnimationFrame(this._tick);return true;
    }
    pause(){
      if(this._destroyed)return;
      if(this._playing)this._time=clamp((performance.now()-this._anchor)/1000,0,this._duration);
      this._playing=false;cancelAnimationFrame(this._raf);this._raf=0;
      if(this.available){this.canvas.dataset.filmState=this._time>=this._duration?'ended':'paused';this._draw();}this._notify();
    }
    seek(seconds){
      if(this._destroyed)return;
      const value=Number(seconds);this._time=clamp(Number.isFinite(value)?value:0,0,this._duration);this._ended=false;
      if(this._playing)this._anchor=performance.now()-this._time*1000;
      if(this._time>=this._duration&&this._playing){this._playing=false;cancelAnimationFrame(this._raf);this._raf=0;}
      if(this.available){this.canvas.dataset.filmState=this._playing?'playing':this._time>=this._duration?'ended':'paused';this._draw();}this._notify();
    }
    setReducedMotion(value){this._reduced=!!value;if(this._reduced)this.pause();else if(this.available&&!this._destroyed){this._draw();this._notify();}return this._reduced;}
    resize(){
      if(!this.available||this._destroyed)return;
      const rect=this.canvas.getBoundingClientRect();
      const width=Math.max(1,Math.round(rect.width||this._cssWidth||640)),height=Math.max(1,Math.round(rect.height||this._cssHeight||480));
      const dpr=Math.min(2,Math.max(1,globalThis.devicePixelRatio||1));
      if(width===this._cssWidth&&height===this._cssHeight&&dpr===this._dpr)return;
      this._cssWidth=width;this._cssHeight=height;this._dpr=dpr;this._mobile=width<700;this._fps=this._mobile?24:30;
      this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);
      this._makeTarget();this._draw();
    }
    destroy(){
      if(this._destroyed)return;
      this._playing=false;cancelAnimationFrame(this._raf);this._raf=0;this._observer?.disconnect();
      this._doc?.removeEventListener('visibilitychange',this._handleVisibility);this.canvas?.removeEventListener?.('webglcontextlost',this._contextLost);
      if(this.gl){const gl=this.gl;for(const b of [this._meshBuffer,this._quadBuffer])if(b)gl.deleteBuffer(b);for(const p of [this._materialProgram,this._resolveProgram])if(p)gl.deleteProgram(p);for(const t of [this._sceneTexture,this._glyphTexture,this._distanceTexture])if(t)gl.deleteTexture(t);if(this._depth)gl.deleteRenderbuffer(this._depth);if(this._framebuffer)gl.deleteFramebuffer(this._framebuffer);}
      if(this.canvas?.dataset)this.canvas.dataset.filmState='destroyed';this._destroyed=true;this._callbacks={};
    }
    _call(name,...args){if(typeof this._callbacks[name]==='function')try{this._callbacks[name](...args);}catch(error){console.warn(`ProteinFilm ${name} callback:`,error);}}
    _notify(){if(this._destroyed)return;const phase=this.phase,key=phase.id+(this._reduced?':reduced':'');if(key!==this._lastPhase){this._lastPhase=key;this._call('onPhase',phase);}this._call('onTime',this._time,this._duration,phase);}
    _tick(now){
      if(!this._playing||this._destroyed)return;
      this._time=clamp((now-this._anchor)/1000,0,this._duration);
      const frameInterval=1000/this._fps,elapsed=now-this._lastDraw;
      if(elapsed>=frameInterval||this._time>=this._duration){this._draw();this._lastDraw=Number.isFinite(this._lastDraw)?now-elapsed%frameInterval:now;}
      const ended=this._time>=this._duration;
      if(ended){this._playing=false;this._raf=0;this.canvas.dataset.filmState='ended';}this._notify();
      if(ended){if(!this._ended){this._ended=true;this._call('onEnd');}return;}if(this._playing)this._raf=requestAnimationFrame(this._tick);
    }

    _buildGeometry(){
      const output=[];
      const addVertex=(p,n)=>output.push(...p,...n);
      const sweep=(points,widths,thickness,directions=null,sides=12)=>{
        const rings=[];
        for(let i=0;i<points.length;i++){
          const tangent=unit(sub(points[Math.min(i+1,points.length-1)],points[Math.max(0,i-1)]));
          const hint=directions?directions[i]:cross(tangent,Math.abs(tangent[1])<.92?[0,1,0]:[1,0,0]);
          const across=unit(sub(hint,mul(tangent,dot(hint,tangent))));
          const normal=unit(cross(tangent,across)),ring=[];
          const half=Math.max(.001,widths[i]*.5),depth=typeof thickness==='number'?thickness:thickness[i];
          for(let j=0;j<sides;j++){
            const angle=j/sides*TAU,c=Math.cos(angle),s=Math.sin(angle);
            ring.push({p:add(points[i],add(mul(across,c*half),mul(normal,s*depth))),n:unit(add(mul(across,c/half),mul(normal,s/depth)))});
          }
          rings.push(ring);
        }
        for(let i=0;i<rings.length-1;i++)for(let j=0;j<sides;j++){
          const a=rings[i][j],b=rings[i+1][j],c=rings[i+1][(j+1)%sides],d=rings[i][(j+1)%sides];
          [a,b,c,a,c,d].forEach(v=>addVertex(v.p,v.n));
        }
        return {start:points[0],end:points[points.length-1],first:points[1],last:points[points.length-2]};
      };
      const helices=[];
      const specs=[
        {c:[-.49,-.06,.04],a:[.04,1,.13],l:.73,r:.115,turns:2.6,p:.1},
        {c:[.37,.36,-.05],a:[-.22,.92,-.32],l:.64,r:.12,turns:2.3,p:1.2},
        {c:[.28,-.29,.16],a:[-.55,.82,.3],l:.63,r:.115,turns:2.4,p:.4},
        {c:[-.04,-.61,.08],a:[.85,-.45,.25],l:.63,r:.115,turns:2.25,p:.8},
        {c:[-.14,.29,-.29],a:[.56,.8,-.2],l:.55,r:.105,turns:2.1,p:2.4}
      ];
      for(const spec of specs){
        const axis=unit(spec.a),side=unit(cross(axis,[0,0,1])),other=unit(cross(axis,side));
        const points=[],widths=[],dirs=[],steps=180;
        for(let i=0;i<=steps;i++){
          const u=i/steps,theta=u*TAU*spec.turns+spec.p;
          const radial=add(mul(side,Math.cos(theta)),mul(other,Math.sin(theta)));
          const p=add(spec.c,add(mul(axis,(u-.5)*spec.l),mul(radial,spec.r)));
          const around=add(mul(side,-Math.sin(theta)),mul(other,Math.cos(theta)));
          const tangent=unit(add(mul(axis,spec.l),mul(around,TAU*spec.turns*spec.r)));
          const widthDir=unit(sub(axis,mul(tangent,dot(axis,tangent))));
          const taper=.75+.25*Math.sin(Math.PI*u);
          points.push(p);dirs.push(widthDir);widths.push(.185*taper);
        }
        helices.push(sweep(points,widths,.007,dirs,12));
      }
      const strands=[];
      for(let strand=0;strand<4;strand++){
        const points=[],dirs=[],widths=[];
        const reverse=strand%2===1;
        for(let i=0;i<=90;i++){
          const u=i/90,v=reverse?1-u:u;
          const bottoms=[-.44,-.38,-.51,-.35],tops=[.59,.72,.54,.62];
          const y=mix(bottoms[strand],tops[strand],v),x=(strand-1.5)*.126+Math.sin((v-.2)*Math.PI*1.4)*.13;
          const z=-.035+Math.sin(v*Math.PI*1.4+strand*.6)*.18+(strand-1.5)*.035;
          points.push([x,y,z]);
          const twist=(v-.5)*2.4+(strand-1.5)*.22;
          dirs.push([Math.cos(twist),-.14,Math.sin(twist)]);
          const width=u<.73?.118:u<.77?mix(.118,.22,(u-.73)/.04):.22*(1-u)/.23;
          widths.push(Math.max(.003,width));
        }
        strands.push(sweep(points,widths,.0065,dirs,10));
      }
      const loop=(start,end,bend1,bend2)=>{
        const points=[],widths=[];for(let i=0;i<=80;i++){points.push(cubic(start,bend1,bend2,end,i/80));widths.push(.027);}
        return sweep(points,widths,.0135,null,8);
      };
      // Nearby sections are joined with rounded backbone-like curves.
      loop(helices[0].end,strands[0].start,[-.62,.52,.13],[-.42,-.53,.25]);
      loop(strands[0].end,strands[1].start,[-.34,1.03,.02],[.08,.93,-.06]);
      loop(strands[1].end,helices[3].start,[-.23,-.58,.24],[-.48,-.65,.23]);
      loop(helices[3].end,helices[2].start,[.42,-.92,.22],[.68,-.65,.14]);
      loop(helices[2].end,helices[1].start,[.67,.20,.20],[.68,.07,-.1]);
      loop(helices[1].end,strands[3].start,[.58,.88,-.05],[.15,.76,.05]);
      loop(strands[3].end,strands[2].start,[.26,-.61,-.05],[-.04,-.59,-.12]);
      loop(strands[2].end,helices[4].start,[.02,.78,-.2],[-.35,.56,-.35]);
      loop(helices[4].end,helices[0].start,[-.47,.68,-.29],[-.70,-.42,-.06]);
      this._meshData=new Float32Array(output);this._vertexCount=output.length/6;
      this.geometryInfo=Object.freeze({helices:5,betaStrands:4,roundedLoops:9,vertices:this._vertexCount,source:'Original invented geometry; no biological dataset.'});
    }
    _program(vertex,fragment){
      const gl=this.gl;
      const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(error);}return s;};
      const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment),p=gl.createProgram();
      gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;
    }
    _buildRenderer(){
      const gl=this.gl;this._materialProgram=this._program(VERTEX,MATERIAL);this._resolveProgram=this._program(QUAD,RESOLVE);
      this._meshBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this._meshBuffer);gl.bufferData(gl.ARRAY_BUFFER,this._meshData,gl.STATIC_DRAW);
      this._quadBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this._quadBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      this._materialLocations={};this._resolveLocations={};
      for(const name of ['uRotation','uScale','uAspect','uPan'])this._materialLocations[name]=gl.getUniformLocation(this._materialProgram,name);
      for(const name of ['uScene','uGlyphs','uDistances','uResolution','uCell','uProgress','uTime'])this._resolveLocations[name]=gl.getUniformLocation(this._resolveProgram,name);
      this._position=gl.getAttribLocation(this._materialProgram,'aPosition');this._normal=gl.getAttribLocation(this._materialProgram,'aNormal');this._quadPosition=gl.getAttribLocation(this._resolveProgram,'aPosition');
      const atlas=this._doc.createElement('canvas');atlas.width=12*24;atlas.height=32;
      const context=atlas.getContext('2d');if(!context)throw new Error('A glyph canvas is unavailable.');
      context.clearRect(0,0,atlas.width,atlas.height);context.font='24px "Courier New", monospace';context.fillStyle='#ffffff';context.textAlign='center';context.textBaseline='middle';
      const glyphs='.:_-+=1%#@MW';
      for(let i=0;i<12;i++)context.fillText(glyphs[i],i*24+12,16);
      this._glyphTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this._glyphTexture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
      this._buildGlyphDistances(atlas);
    }
    _buildGlyphDistances(atlas){
      // Padded glyph-distance fields support outward growth across cell edges.
      // A two-pass chamfer transform is sufficient at the tiny displayed scale.
      const gl=this.gl,tileW=96,tileH=128,output=new Uint8Array(tileW*12*tileH*4);
      const temp=this._doc.createElement('canvas');temp.width=tileW;temp.height=tileH;
      const context=temp.getContext('2d'),diagonal=Math.SQRT2;
      for(let glyph=0;glyph<12;glyph++){
        context.clearRect(0,0,tileW,tileH);context.drawImage(atlas,glyph*24,0,24,32,36,48,24,32);
        const pixels=context.getImageData(0,0,tileW,tileH).data,distances=new Float32Array(tileW*tileH);
        for(let i=0;i<distances.length;i++)distances[i]=pixels[i*4+3]>96?0:999;
        for(let y=0;y<tileH;y++)for(let x=0;x<tileW;x++){
          const i=y*tileW+x;let d=distances[i];
          if(x)d=Math.min(d,distances[i-1]+1);if(y)d=Math.min(d,distances[i-tileW]+1);
          if(x&&y)d=Math.min(d,distances[i-tileW-1]+diagonal);if(x+1<tileW&&y)d=Math.min(d,distances[i-tileW+1]+diagonal);distances[i]=d;
        }
        for(let y=tileH-1;y>=0;y--)for(let x=tileW-1;x>=0;x--){
          const i=y*tileW+x;let d=distances[i];
          if(x+1<tileW)d=Math.min(d,distances[i+1]+1);if(y+1<tileH)d=Math.min(d,distances[i+tileW]+1);
          if(x+1<tileW&&y+1<tileH)d=Math.min(d,distances[i+tileW+1]+diagonal);if(x&&y+1<tileH)d=Math.min(d,distances[i+tileW-1]+diagonal);distances[i]=d;
          const value=Math.round(Math.min(1,d/48)*255),at=(y*tileW*12+glyph*tileW+x)*4;
          output[at]=value;output[at+1]=value;output[at+2]=value;output[at+3]=255;
        }
      }
      this._distanceTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this._distanceTexture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,tileW*12,tileH,0,gl.RGBA,gl.UNSIGNED_BYTE,output);
    }
    _makeTarget(){
      const gl=this.gl;if(this._sceneTexture)gl.deleteTexture(this._sceneTexture);if(this._depth)gl.deleteRenderbuffer(this._depth);if(this._framebuffer)gl.deleteFramebuffer(this._framebuffer);
      this._sceneTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this._sceneTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,this.canvas.width,this.canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      this._depth=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,this._depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,this.canvas.width,this.canvas.height);
      this._framebuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this._framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this._sceneTexture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this._depth);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE){this._fail('The film render target is unavailable.');return;}gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    }
    _camera(t){
      let zoom=1,panX=0,panY=0,rx=-.1,ry=-.1+t*.105,rz=-.03;
      if(t<4)ry=-.12+t*.035;
      else if(t<10)ry=.02+(t-4)*.105;
      else if(t<16){const enter=ease(10,10.85,t),cut=ease(12.5,12.85,t);zoom=1+enter*.62+cut*.48;panX=-.15*enter+.05*cut;panY=.08*enter;rz=-.03-.10*enter+.15*cut;ry=.65+(t-10)*.1;}
      else if(t<20){const slide=ease(16,20,t);zoom=2.1-.38*ease(16,16.75,t);panX=mix(-.10,.22,slide);panY=.08-.11*slide;rz=.02-.13*slide;ry=1.25+(t-16)*.07;}
      else{const back=ease(20,23.7,t);zoom=mix(1.72,1,back);panX=mix(.22,0,back);panY=mix(-.03,0,back);rz=mix(-.11,-.03,back);ry=1.53+(t-20)*.09;}
      if(this._reduced){zoom=1;panX=0;panY=0;rx=-.1;ry=.05+t*.018;rz=-.03;}
      return {zoom,panX,panY,rx,ry,rz};
    }
    _rotation(camera){
      const {rx,ry,rz}=camera,sx=Math.sin(rx),cx=Math.cos(rx),sy=Math.sin(ry),cy=Math.cos(ry),sz=Math.sin(rz),cz=Math.cos(rz);
      const apply=(x,y,z)=>{const a=x*cy+z*sy,b=-x*sy+z*cy,c=y*cx-b*sx,d=y*sx+b*cx;return[a*cz-c*sz,a*sz+c*cz,d];};
      return new Float32Array([...apply(1,0,0),...apply(0,1,0),...apply(0,0,1)]);
    }
    _draw(){
      if(!this.available||this._destroyed)return;
      const gl=this.gl,t=this._time/this._duration*24,camera=this._camera(t),aspect=this._cssWidth/this._cssHeight;
      gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.bindFramebuffer(gl.FRAMEBUFFER,this._framebuffer);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);
      gl.useProgram(this._materialProgram);gl.bindBuffer(gl.ARRAY_BUFFER,this._meshBuffer);
      gl.enableVertexAttribArray(this._position);gl.vertexAttribPointer(this._position,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(this._normal);gl.vertexAttribPointer(this._normal,3,gl.FLOAT,false,24,12);
      const m=this._materialLocations;gl.uniformMatrix3fv(m.uRotation,false,this._rotation(camera));gl.uniform1f(m.uScale,3.55*Math.min(1,aspect)*camera.zoom*(this._mobile?1.22:1));gl.uniform1f(m.uAspect,aspect);gl.uniform2f(m.uPan,camera.panX,camera.panY);
      gl.drawArrays(gl.TRIANGLES,0,this._vertexCount);gl.disableVertexAttribArray(this._position);gl.disableVertexAttribArray(this._normal);
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.DEPTH_TEST);gl.useProgram(this._resolveProgram);gl.bindBuffer(gl.ARRAY_BUFFER,this._quadBuffer);gl.enableVertexAttribArray(this._quadPosition);gl.vertexAttribPointer(this._quadPosition,2,gl.FLOAT,false,0,0);
      const r=this._resolveLocations,progress=this._reduced?1:ease(1.35,4,t),cell=this._mobile?4.4:5.7;
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this._sceneTexture);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this._glyphTexture);
      gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this._distanceTexture);
      gl.uniform1i(r.uScene,0);gl.uniform1i(r.uGlyphs,1);gl.uniform1i(r.uDistances,2);gl.uniform2f(r.uResolution,this.canvas.width,this.canvas.height);gl.uniform1f(r.uCell,cell*this._dpr);gl.uniform1f(r.uProgress,progress);gl.uniform1f(r.uTime,this._reduced?0:t);
      gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(this._quadPosition);
    }
  }
  ProteinFilm.PHASES=PHASES;
  ProteinFilm.ART_STATUS='Artistic, procedurally generated protein-inspired form. No verified biological structure or pockets.';
  (typeof window!=='undefined'?window:globalThis).ProteinFilm=ProteinFilm;
})();
