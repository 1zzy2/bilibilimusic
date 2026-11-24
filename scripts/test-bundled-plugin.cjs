require('ts-node').register({transpileOnly:true,compilerOptions:{module:'commonjs'}});
const fs=require('fs'), os=require('os'), path=require('path'), Module=require('module'), assert=require('assert/strict');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'musicfree-bundle-test-'));const original=Module._load;
Module._load=function(id,...args){
if(id==='electron')return {app:{getPath:()=>root},ipcMain:{handle(){},on(){}}};
if(id==='./plugin')return {Plugin:class {constructor(code,p){const m={exports:{}};Function('module','exports','require',code)(m,m.exports,require);this.instance=m.exports;this.name=this.instance.platform;this.hash=this.name;this.path=p;}}};
if(id==='./internal-plugins/local-plugin')return {};
if(id==='@/common/void-callback')return {__esModule:true,default:()=>{}};
if(id==='@/common/constant')return {};
if(id==='@/common/normalize-util')return {addRandomHash:x=>x};
if(id==='@shared/app-config/main')return {__esModule:true,default:{getConfig:k=>k==='private.defaultBilibiliInitialized' && process.env.TEST_FRESH !== '1',setConfig(){}}};
if(id==='@/common/get-resource-path')return {__esModule:true,default:p=>path.resolve('res',p)};
if(id==='@shared/logger/main')return {__esModule:true,default:{logError:(...x)=>console.error(...x)}};
if(id==='nanoid')return {nanoid:()=>Math.random().toString(36).slice(2)};
return original.call(this,id,...args);};
(async()=>{const manager=require('../src/shared/plugin-manager/main/index.ts').default;await manager.setup({});assert(manager.plugins.some(p=>p.name==='bilibili'),'Bilibili must install even with stale initialized flag');console.log('Bilibili stale-flag recovery passed');})().catch(e=>{console.error(e.message);process.exitCode=1});
