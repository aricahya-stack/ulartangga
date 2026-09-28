import * as pc from 'playcanvas';
import type { CameraController } from '../scene/CameraController';

/** A dedicated transparent DOM overlay keeps the normal game page out of the XR compositor. */
export function installAR(app:pc.Application,camera:CameraController,status:(s:string)=>void){
  const button=document.createElement('button');
  button.id='ar-btn';button.type='button';button.textContent='📱 Mulai AR';
  document.querySelector('.control-panel')?.append(button);

  const xr=app.xr;
  let mode:'none'|'xr'|'camera'='none';
  let anchor:pc.Entity|null=null;
  let movedEntities:pc.Entity[]=[];
  let overlay:HTMLElement|null=null;
  let movedDom:Array<{node:HTMLElement;parent:Node;next:Node|null}>=[];
  let video:HTMLVideoElement|null=null;
  let fallbackReason:string|null=null;

  const restoreDom=()=>{
    for(const {node,parent,next} of movedDom){
      parent.insertBefore(node,next?.parentNode===parent?next:null);
    }
    movedDom=[];
    overlay?.remove();overlay=null;
  };
  const restoreScene=()=>{
    for(const entity of movedEntities)app.root.addChild(entity);
    movedEntities=[];anchor?.destroy();anchor=null;
    if(camera.entity.camera)camera.entity.camera.clearColor=new pc.Color(.08,.11,.16,1);
    camera.restoreOverview();
  };
  const stopCamera=()=>{
    const stream=video?.srcObject as MediaStream|null;
    stream?.getTracks().forEach(track=>track.stop());
    video?.remove();video=null;
    document.body.classList.remove('camera-preview');
    if(camera.entity.camera)camera.entity.camera.clearColor=new pc.Color(.08,.11,.16,1);
    button.textContent='📱 Mulai AR';mode='none';
  };
  const startCameraPreview=async(reason:string)=>{
    if(!navigator.mediaDevices?.getUserMedia){status(`${reason} Kamera browser tidak tersedia.`);return;}
    button.disabled=true;
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'}}});
      video=document.createElement('video');
      video.id='ar-camera-video';video.autoplay=true;video.playsInline=true;video.muted=true;
      video.srcObject=stream;
      document.querySelector('.scene-panel')?.prepend(video);
      await video.play();
      mode='camera';document.body.classList.add('camera-preview');
      if(camera.entity.camera)camera.entity.camera.clearColor=new pc.Color(0,0,0,0);
      button.textContent='Tutup Kamera';
      status(`${reason} Pratinjau kamera aktif; papan belum terlacak pada permukaan nyata.`);
    }catch(error){
      stopCamera();status(`${reason} Kamera browser gagal dibuka: ${error instanceof Error?error.message:String(error)}`);
    }finally{button.disabled=false;}
  };
  if(xr){
    xr.on('end',()=>{
      if(mode!=='xr')return;
      restoreDom();restoreScene();document.body.classList.remove('ar-active');
      button.textContent='📱 Mulai AR';mode='none';
      const reason=fallbackReason;fallbackReason=null;
      if(reason)void startCameraPreview(reason);
      else status('AR ditutup.');
    });
    xr.on('start',()=>{
      if(mode!=='xr')return;
      if(!xr.domOverlay.available){
        fallbackReason='Perangkat ini tidak menyediakan tombol HTML saat WebXR aktif.';
        xr.end();
      }else status('WebXR AR aktif. Arahkan kamera ke depan; gunakan tombol Kamera bila tampilan tetap hitam.');
    });
  }
  const startXR=()=>{
    if(!xr?.supported || !xr.isAvailable(pc.XRTYPE_AR) || !xr.domOverlay.supported){
      void startCameraPreview('WebXR AR dengan kontrol permainan tidak tersedia.');return;
    }
    const scenePanel=document.querySelector<HTMLElement>('.scene-panel');
    if(!scenePanel || !camera.entity.camera)return;
    mode='xr';
    anchor=new pc.Entity('AR Board Anchor');app.root.addChild(anchor);
    movedEntities=app.root.children.filter((entity):entity is pc.Entity=>entity!==camera.entity&&entity!==anchor);
    for(const entity of movedEntities)anchor.addChild(entity);
    anchor.setLocalPosition(0,1.15,-1.35);anchor.setLocalScale(.075,.075,.075);
    camera.entity.camera.clearColor=new pc.Color(0,0,0,0);
    camera.entity.setPosition(0,1.5,0);

    overlay=document.createElement('div');overlay.id='ar-dom-overlay';
    const fallback=document.createElement('button');fallback.type='button';fallback.id='ar-fallback-btn';
    fallback.textContent='Kamera hitam? Tampilkan kamera';
    fallback.addEventListener('click',()=>{
      fallbackReason='WebXR menampilkan layar hitam pada perangkat ini.';xr.end();
    });
    overlay.append(fallback);
    for(const selector of ['.control-panel','#question-overlay','#win-overlay','#portal-status']){
      const node=document.querySelector<HTMLElement>(selector);
      if(!node?.parentNode)continue;
      movedDom.push({node,parent:node.parentNode,next:node.nextSibling});overlay.append(node);
    }
    document.body.append(overlay);
    overlay.addEventListener('beforexrselect',event=>{
      if((event.target as Element).closest('button,input,select,.question-card'))event.preventDefault();
    });
    document.body.classList.add('ar-active');
    xr.domOverlay.root=overlay;
    try{
      xr.start(camera.entity.camera,pc.XRTYPE_AR,pc.XRSPACE_LOCALFLOOR,{callback:(error)=>{
        if(error){
          const reason=`WebXR gagal memulai: ${error.message}.`;
          if(xr.active){fallbackReason=reason;xr.end();}
          else{
            restoreDom();restoreScene();document.body.classList.remove('ar-active');
            mode='none';void startCameraPreview(reason);
          }
        }
      }});
      button.textContent='Tutup AR';
    }catch(error){
      restoreDom();restoreScene();document.body.classList.remove('ar-active');mode='none';
      void startCameraPreview(`WebXR gagal memulai: ${String(error)}.`);
    }
  };
  button.addEventListener('click',()=>{
    if(mode==='camera'){stopCamera();return;}
    if(mode==='xr'){xr?.end();return;}
    startXR();
  });
}
