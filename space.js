/* Three.js models and real-time lighting. */
(() => {
  const canvas = document.getElementById('space');
  if (!window.THREE) return;
  const T = THREE;
  let renderer;
  try { renderer = new T.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true}); }
  catch { return; }
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-7,7,4,-4,.1,60);
  camera.position.z=20;
  scene.add(new T.HemisphereLight(0xe2eaff,0x554b9b,2.4));
  const key=new T.DirectionalLight(0xfff0c5,3);
  key.position.set(-4,7,8);
  scene.add(key);
  const sphere=new T.SphereGeometry(1,36,24);
  const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.43,...extra});
  function shape(parent,geo,color,x,y,z,sx=1,sy=1,sz=1) {
    const mesh=new T.Mesh(geo,material(color));
    mesh.position.set(x,y,z);
    mesh.scale.set(sx,sy,sz);
    parent.add(mesh);
    return mesh;
  }
  function face(parent,base,ring) {
    shape(parent,sphere,base,0,0,0);
    for(const side of [-1,1]){
      shape(parent,sphere,0xfff8e6,side*.32,.18,.9,.21,.26,.13);
      shape(parent,sphere,0x232040,side*.31,.16,1.025,.10,.14,.061);
      shape(parent,sphere,0xffffff,side*.31-.026,.214,1.07,.031,.039,.028);
      shape(parent,sphere,0xff938f,side*.47,-.18,.82,.17,.1,.095);
    }
    shape(parent,sphere,0x352144,0,-.25,.97,.19,.115,.082);
    if(ring){
      const band=shape(parent,new T.TorusGeometry(1.36,.10,16,64),ring,0,0,-.05);
      band.rotation.set(1.14,-.22,.13);
    }
  }
  const even=new T.Group(), odd=new T.Group();
  face(even,0x55c3fd,0xb9e8ff);
  face(odd,0xb58aff,0xf6c7fd);
  scene.add(even,odd);
  const starShape=new T.Shape();
  for(let i=0;i<10;i++){
    const a=Math.PI/2+i*Math.PI/5;
    const r=i%2?.55:1;
    const x=Math.cos(a)*r,y=Math.sin(a)*r;
    if(i===0) starShape.moveTo(x,y); else starShape.lineTo(x,y);
  }
  starShape.closePath();
  const starGeo=new T.ExtrudeGeometry(starShape,{depth:.24,bevelEnabled:true,bevelSize:.085,bevelThickness:.085,bevelSegments:4});
  const star=shape(scene,starGeo,0xffcf47,0,0,1.1);
  const ship=new T.Group();
  shape(ship,sphere,0xf8f4ff,0,0,0,.34,.7,.33);
  shape(ship,sphere,0x4fbfea,0,.12,.3,.19,.22,.11);
  for(const side of [-1,1]){
    const fin=shape(ship,sphere,0xf3658a,side*.29,-.34,0,.17,.27,.14);
    fin.rotation.z=side*.4;
  }
  shape(ship,sphere,0xffaa46,0,-.68,0,.13,.33,.12);
  ship.rotation.z=-.5;
  scene.add(ship);
  const astronaut=new T.Group();
  shape(astronaut,sphere,0xf7efff,0,0,0,.42,.56,.36);
  shape(astronaut,sphere,0xe7e5ff,0,.66,0,.51,.49,.44);
  shape(astronaut,sphere,0x47628e,0,.68,.35,.39,.31,.18);
  shape(astronaut,sphere,0xc2efff,-.14,.80,.49,.13,.07,.022);
  shape(astronaut,sphere,0xffd081,0,.01,.35,.15,.13,.053);
  for(const side of [-1,1]){
    const arm=shape(astronaut,sphere,0xf7efff,side*.43,.02,.015,.17,.38,.16);
    arm.rotation.z=side*.55;
    shape(astronaut,sphere,0xffaabb,side*.19,-.48,.04,.19,.24,.23);
  }
  scene.add(astronaut);
  const points=[];
  let seed=831;
  const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
  for(let i=0;i<430;i++) points.push((rand()-.5)*40,(rand()-.5)*23,-5-rand()*12);
  const sky=new T.BufferGeometry();
  sky.setAttribute('position',new T.Float32BufferAttribute(points,3));
  const stars=new T.Points(sky,new T.PointsMaterial({color:0xcfcdff,size:.06}));
  scene.add(stars);
  const sparkles=Array.from({length:28},(_,i)=>shape(scene,starGeo,i%2?0xffce57:0xff8cc8,0,0,1,.065,.065,.065));
  const state={mode:'welcome',flight:null,drag:null};
  const anchor=(id,width,height)=>{
    const bounds=document.getElementById(id).getBoundingClientRect();
    const base=canvas.getBoundingClientRect();
    const pixelSize=8/height;
    return new T.Vector3((bounds.left+bounds.width/2-base.left-width/2)*pixelSize,(height/2-(bounds.top+bounds.height*.40-base.top))*pixelSize,0);
  };
  window.space={
    setMode(mode){state.mode=mode;state.flight=null;state.drag=null;},
    resetStar(){state.flight=null;state.drag=null;},
    drag(x,y){state.drag={x,y};},
    release(){state.drag=null;},
    launch(target){state.drag=null;state.flight={target,start:performance.now()};}
  };
  function draw(ms) {
    const t=ms/1000;
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(w && h){
      const ratio=Math.min(devicePixelRatio,1.5);
      if(canvas.width!==Math.floor(w*ratio)||canvas.height!==Math.floor(h*ratio)){
        renderer.setPixelRatio(ratio);
        renderer.setSize(w,h,false);
        camera.left=-4*w/h;
        camera.right=4*w/h;
        camera.updateProjectionMatrix();
      }
      const mission=state.mode==='mission';
      const left=mission?anchor('even',w,h):new T.Vector3(4,.8,0);
      const right=mission?anchor('odd',w,h):new T.Vector3(5.6,-1.2,0);
      const middle=mission?anchor('star',w,h):new T.Vector3(5,2.1,1);
      if(mission) middle.y-=document.getElementById('star').getBoundingClientRect().height*.10*8/h;
      even.position.copy(left);
      odd.position.copy(right);
      const radius=mission?Math.min(1.15,w/h*.74):1.05;
      even.scale.setScalar(radius);
      odd.scale.setScalar(radius);
      even.rotation.y=.14*Math.sin(t*1.3);
      odd.rotation.y=.14*Math.sin(t*1.3+1.3);
      star.scale.setScalar(mission?Math.min(1,w/h*.8):.55);
      star.position.copy(middle);
      star.position.z=1.4;
      star.rotation.y=.15*Math.sin(t*2);
      star.rotation.z=.08*Math.sin(t*1.6);
      star.visible=state.mode!=='victory';
      if(state.drag){
        const rect=canvas.getBoundingClientRect();
        star.position.x=(state.drag.x-rect.left-w/2)*8/h;
        star.position.y=(h/2-state.drag.y+rect.top)*8/h;
      }
      if(state.flight){
        const p=Math.min(1,(ms-state.flight.start)/520);
        star.position.lerp(state.flight.target==='even'?left:right,p);
        star.position.y+=Math.sin(p*Math.PI)*.65;
        star.scale.multiplyScalar(1-p*.75);
        star.visible=p<1;
        (state.flight.target==='even'?even:odd).scale.multiplyScalar(1+Math.sin(p*Math.PI)*.13);
      }
      ship.position.set(4.8+Math.sin(t*.27)*1.1,2.72+.19*Math.sin(t*2),-1);
      ship.rotation.z=-.65+.28*Math.sin(t*.27);
      astronaut.visible=!mission;
      astronaut.position.set(3.1+.22*Math.sin(t),-1.30+.28*Math.sin(t*1.6),1);
      astronaut.rotation.z=.19*Math.sin(t*.9);
      stars.rotation.z=t*.005;
      sparkles.forEach((spark,i)=>{
        spark.visible=state.mode==='victory';
        const a=i*2.4+t*.32;
        spark.position.set(Math.cos(a)*(2+i%5*.6),Math.sin(a)*(1+i%4*.65),1);
        spark.rotation.z=t+i;
      });
      renderer.render(scene,camera);
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();


