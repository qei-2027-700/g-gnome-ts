import {test} from 'node:test';
import assert from 'node:assert/strict';
import {closeGameTab} from './tab-exit.ts';
test('confirmed exit calls close in the user gesture and reports only a refused close',()=>{
 for(const allowed of [true,false]){
  let blocked=0,calls=0,check:(()=>void)|undefined;
  const host={closed:false,close(){calls++;this.closed=allowed;}};
  closeGameTab(host,()=>blocked++,callback=>{check=callback;});
  assert.equal(calls,1);assert.equal(blocked,0);check!();assert.equal(blocked,allowed?0:1);
 }
});
test('browser close exceptions use the same visible fallback',()=>{
 let blocked=0;closeGameTab({closed:false,close(){throw new Error('Not allowed');}},()=>blocked++);assert.equal(blocked,1);
});
