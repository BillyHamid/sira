"use client";

import { useEffect, useRef } from "react";

export function ImmersiveScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};
    async function initialize() {
      const [THREE, { RoundedBoxGeometry }, { ImprovedNoise }, { RoomEnvironment }] = await Promise.all([
        import("three"), import("three/addons/geometries/RoundedBoxGeometry.js"),
        import("three/addons/math/ImprovedNoise.js"), import("three/addons/environments/RoomEnvironment.js"),
      ]);
      if (disposed) return;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.25 : 1.5));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = .85;
      host!.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#bac1c9");
      scene.fog = new THREE.FogExp2("#bac1c9", .018);
      const camera = new THREE.PerspectiveCamera(43, 1, .1, 140);
      const generator = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const environment = generator.fromScene(room, .04);
      scene.environment = environment.texture;
      room.dispose(); generator.dispose();
      const hemisphere = new THREE.HemisphereLight(0xe8edf7, 0x59616f, .9); scene.add(hemisphere);
      const sun = new THREE.DirectionalLight(0xfff7eb, 3);
      sun.position.set(-9, 12, 6); sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.left = -9; sun.shadow.camera.right = 9;
      sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -9;
      sun.shadow.normalBias = .035; sun.shadow.bias = -.0002;
      scene.add(sun);
      const rim = new THREE.DirectionalLight(0xadc9ee, 2); rim.position.set(7, 6, -9); scene.add(rim);
      const noise = new ImprovedNoise();
      function elevation(x: number, z: number) {
        const radius = Math.hypot(x, z);
        const amplitude = THREE.MathUtils.smoothstep(radius, 3, 12);
        return amplitude * (Math.abs(noise.noise(x*.12,z*.12,2.4))*5.2 + noise.noise(x*.35,z*.35,7)*1.15 + noise.noise(x*1.1,z*1.1,3)*.27)
          + Math.max(0, radius - 10)*.09 - .2;
      }
      const terrainGeometry = new THREE.PlaneGeometry(95, 95, 220, 220);
      terrainGeometry.rotateX(-Math.PI/2);
      const positions = terrainGeometry.attributes.position;
      for (let i=0;i<positions.count;i++) positions.setY(i,elevation(positions.getX(i),positions.getZ(i)));
      terrainGeometry.computeVertexNormals();
      const textureCanvas = document.createElement("canvas"); textureCanvas.width = textureCanvas.height = 256;
      const textureContext = textureCanvas.getContext("2d")!;
      const image = textureContext.createImageData(256,256);
      for (let i=0;i<256*256;i++) { const x=i%256,y=Math.floor(i/256);const n=128+noise.noise(x*.3,y*.3,4)*65; image.data[i*4]=image.data[i*4+1]=image.data[i*4+2]=n;image.data[i*4+3]=255; }
      textureContext.putImageData(image,0,0);
      const texture = new THREE.CanvasTexture(textureCanvas); texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(22,22);
      const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x535e6c, roughness:.96, envMapIntensity:.35, bumpMap:texture, bumpScale:.3 });
      const ground = new THREE.Mesh(terrainGeometry,groundMaterial);ground.receiveShadow=true;scene.add(ground);
      const rockGeometry = new THREE.IcosahedronGeometry(1,1);
      const rockMaterial = new THREE.MeshStandardMaterial({color:0x626e7e,roughness:1,envMapIntensity:.25,bumpMap:texture,bumpScale:.12,flatShading:true});
      const rocks = new THREE.InstancedMesh(rockGeometry,rockMaterial,160);
      const transform = new THREE.Object3D();
      for(let i=0;i<160;i++) {
        const angle=i*2.39996;const radius=4+Math.sqrt(i)*1.1;
        const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
        const size=.12+Math.abs(noise.noise(i*.17,6,2))*.85;
        transform.position.set(x,elevation(x,z)+size*.15,z);
        transform.rotation.set(i*.38,i*.62,i*.27);transform.scale.set(size*1.3,size*.65,size);
        transform.updateMatrix();rocks.setMatrixAt(i,transform.matrix);
      }
      rocks.castShadow=true;rocks.receiveShadow=true;scene.add(rocks);
      const monument = new THREE.Group(); monument.position.set(.7,1.4,0);monument.rotation.y=.16;scene.add(monument);
      const blockGeometry = new RoundedBoxGeometry(.96,.96,.96,3,.075);
      const stone = new THREE.MeshPhysicalMaterial({ color:0x737f91, roughness:.58, envMapIntensity:.5, metalness:.12, clearcoat:.3, clearcoatRoughness:.28,bumpMap:texture,bumpScale:.035 });
      for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) for(let z=-1;z<=1;z++) {
        if(x===0&&y===0&&z===0) continue;
        const block=new THREE.Mesh(blockGeometry,stone);block.position.set(x,y,z);block.castShadow=true;block.receiveShadow=true;monument.add(block);
      }
      // Une fine arête bleue reprend la signature du logo BOX.
      const accentGeometry=new THREE.BoxGeometry(2.8,.018,.018);
      const accentMaterial=new THREE.MeshStandardMaterial({color:0x6faed4,emissive:0x38566b,emissiveIntensity:.3});
      const accent=new THREE.Mesh(accentGeometry,accentMaterial);accent.position.set(0,1.48,1.46);monument.add(accent);
      const particleGeometry=new THREE.BufferGeometry();const particlePositions=new Float32Array(120*3);
      for(let i=0;i<120;i++){particlePositions[i*3]=noise.noise(i*.7,1,1)*35;particlePositions[i*3+1]=2+(i%19)*.65;particlePositions[i*3+2]=noise.noise(i*.9,2,1)*35;}
      particleGeometry.setAttribute("position",new THREE.BufferAttribute(particlePositions,3));
      const particleMaterial=new THREE.PointsMaterial({color:0xf1f5ff,size:.025,transparent:true,opacity:.5,depthWrite:false});
      const particles=new THREE.Points(particleGeometry,particleMaterial);scene.add(particles);
      const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
      let pointerX=0,pointerY=0,currentX=0,currentY=0,frame=0,last=0,visible=true,needsRender=true;
      let revealStart=performance.now()+1100;
      const reveal=()=>{revealStart=performance.now();needsRender=true;};
      const resize=()=>{const width=host!.clientWidth,height=host!.clientHeight;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();needsRender=true;};
      const pointer=(event:PointerEvent)=>{const rect=host!.getBoundingClientRect();pointerX=(event.clientX-rect.left)/rect.width-.5;pointerY=(event.clientY-rect.top)/rect.height-.5;};
      const draw=(time:number)=>{
        frame=requestAnimationFrame(draw);
        if(document.hidden||!visible||time-last<33) return;
        if(reduced.matches&&!needsRender)return;
        last=time;currentX+=(pointerX-currentX)*.035;currentY+=(pointerY-currentY)*.035;
        const phase=reduced.matches?0:Math.sin(time*.00012)*.11;
        const angle=.68+phase+(reduced.matches?0:currentX*.16);
        const progress=reduced.matches?1:THREE.MathUtils.clamp((time-revealStart)/2600,0,1);
        const arrival=1-Math.pow(1-progress,3);
        const distance=(host!.clientWidth<700?15:12)+(1-arrival)*5;
        camera.position.set(Math.sin(angle)*distance,6.1+(1-arrival)*2.5+(reduced.matches?0:currentY*.7),Math.cos(angle)*distance);
        camera.lookAt(.4,.5,0);
        if(!reduced.matches)particles.rotation.y=time*.000015;
        renderer.render(scene,camera);
        needsRender=false;
      };
      const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;},{threshold:.01});observer.observe(host!);
      resize();frame=requestAnimationFrame(draw);host!.dataset.scene="webgl";
      window.addEventListener("resize",resize);host!.addEventListener("pointermove",pointer);
      window.addEventListener("box-scene-reveal",reveal);
      cleanup=()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("resize",resize);window.removeEventListener("box-scene-reveal",reveal);host!.removeEventListener("pointermove",pointer);
        terrainGeometry.dispose();rockGeometry.dispose();rockMaterial.dispose();blockGeometry.dispose();accentGeometry.dispose();particleGeometry.dispose();groundMaterial.dispose();stone.dispose();accentMaterial.dispose();particleMaterial.dispose();texture.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();};
    }
    initialize().catch((error)=>{console.error("[scene 3D]",error);if(host&&!disposed)host.dataset.scene="fallback";});
    return ()=>{disposed=true;cleanup();};
  }, []);
  return <div ref={hostRef} aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-[#cbd2dc] to-[#7f8b9b]" />;
}
