import type {Scene} from '@babylonjs/core/scene.js';
import {RawTexture} from '@babylonjs/core/Materials/Textures/rawTexture.js';
import {Texture} from '@babylonjs/core/Materials/Textures/texture.js';
// Procedural mottled metal approximates the launch image; original texture pixels are unavailable.
export function weatheredArmor(scene:Scene){
 const size=128,pixels=new Uint8Array(size*size*3);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const n=Math.sin(x*127.1+y*311.7)*43758.5453,grain=n-Math.floor(n),patch=Math.sin(x*.14+Math.sin(y*.11)*3)*Math.cos(y*.16),rust=patch>.45;
  const color=rust?[105+grain*18,96+grain*16,82+grain*13]:[143+patch*24+grain*20,140+patch*22+grain*19,128+patch*20+grain*17];
  pixels.set(color,3*(y*size+x));
 }
 const texture=RawTexture.CreateRGBTexture(pixels,size,size,scene,true,false,Texture.NEAREST_SAMPLINGMODE);texture.name='union-weathered-armor';texture.uScale=2;texture.vScale=2;return texture;
}

// Fine vertical wear for the Meson photo; keep the HAWC's mottled finish separate.
export function mesonWeatheredArmor(scene:Scene,navy=false){
 const width=128,height=256,pixels=new Uint8Array(width*height*3);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const n=Math.sin(x*127.1+y*311.7)*43758.5453,grain=n-Math.floor(n);
  const streak=Math.sin(x*.7+Math.sin(y*.045)*.3)*7+Math.sin(x*2.2)*3;
  const value=navy?205+(grain-.5)*17:153+streak+(grain-.5)*35;
  const seam=!navy&&x%32<1?-18:0;pixels.set([value+seam,value+seam,value+seam],3*(y*width+x));
 }
 const texture=RawTexture.CreateRGBTexture(pixels,width,height,scene,true,false,Texture.NEAREST_SAMPLINGMODE);texture.name=navy?'meson-navy-wear':'meson-metal-streaks';return texture;
}
