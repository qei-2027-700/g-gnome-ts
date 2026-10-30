import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toggleCamera} from './camera-mode.ts';
import {defaults,validateSettings} from '../settings.ts';
test('C selects only rear view, Z selects only diagonal and repeat returns first person',()=>{
 assert.equal(toggleCamera(0,'rear'),2);assert.equal(toggleCamera(1,'rear'),2);assert.equal(toggleCamera(2,'rear'),0);
 assert.equal(toggleCamera(0,'diagonal'),1);assert.equal(toggleCamera(2,'diagonal'),1);assert.equal(toggleCamera(1,'diagonal'),0);
 const settings=defaults();assert.equal(settings.bindings.camera,'KeyC');assert.equal(settings.bindings.cameraDiagonal,'KeyZ');delete settings.bindings.cameraDiagonal;assert.equal(validateSettings(settings).bindings.cameraDiagonal,'KeyZ');
});
