import * as pc from 'playcanvas';
import type { CameraController } from '../scene/CameraController';
export function installAR(app:pc.Application,camera:CameraController,status:(s:string)=>void){
  if(!app.xr) return;
  const xr=app.xr;
  const button=document.createElement('button');button.id='ar-btn';button.textContent='📱 Mulai AR';
  document.querySelector('.control-panel')?.append(button);
  let moved:pc.Entity[]=[];
  let anchor:pc.Entity|null=null;
  const stop=()=>{
    for(const entity of moved) app.root.addChild(entity);
    moved=[];anchor?.destroy();anchor=null;
    camera.entity.camera!.clearColor=new pc.Color(.08,.11,.16,1);
    camera.restoreOverview();button.textContent='📱 Mulai AR';
    document.body.classList.remove('ar-active');
  };
  xr.on('end',stop);
  button.addEventListener('click',()=>{
    if(xr.active){xr.end();return;}
    if(!xr.supported || !xr.isAvailable(pc.XRTYPE_AR)){
      status('WebXR AR tidak tersedia pada perangkat/browser ini. Coba Chrome Android dengan ARCore melalui HTTPS.');return;
    }
    anchor=new pc.Entity('AR Board Anchor');app.root.addChild(anchor);
    moved=app.root.children.filter((el):el is pc.Entity=>el!==camera.entity && el!==anchor);
    for(const entity of moved) anchor.addChild(entity);
    anchor.setLocalPosition(0,0,-1.25);anchor.setLocalScale(.075,.075,.075);
    camera.entity.setPosition(0,1.5,0);
    camera.entity.camera!.clearColor=new pc.Color(0,0,0,0);
    xr.domOverlay.root=document.body;
    try{
      xr.start(camera.entity.camera!,pc.XRTYPE_AR,pc.XRSPACE_LOCALFLOOR,{callback:(err)=>{
        if(err){stop();status(`Gagal memulai AR: ${err.message}`);}
      }});
      document.body.classList.add('ar-active');button.textContent='Tutup AR';
    }catch(e){stop();status(`Gagal memulai AR: ${String(e)}`);}
  });
  document.addEventListener('beforexrselect',e=>{if((e.target as Element).closest('button,input,select,.question-card'))e.preventDefault();});
}
