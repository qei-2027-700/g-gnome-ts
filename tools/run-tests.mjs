import {readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,relative} from 'node:path';
import {spawnSync} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
function discover(directory){
 return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
  const path=resolve(directory,entry.name);
  return entry.isDirectory()?discover(path):entry.isFile()&&entry.name.endsWith('.test.ts')?[relative(root,path)]:[];
 });
}
const tests=discover(resolve(root,'src')).sort();
if(!tests.length)throw new Error('No tests discovered under src/');
const result=spawnSync(process.execPath,['--experimental-transform-types','--test',...process.argv.slice(2),...tests],{cwd:root,stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
