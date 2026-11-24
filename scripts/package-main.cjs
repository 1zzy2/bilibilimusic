require('ts-node').register({transpileOnly:true,compilerOptions:{module:'commonjs'}});
const webpack=require('webpack');const path=require('path');
const cfg=require('../forge.config.ts').default;
const Gen=require('@electron-forge/plugin-webpack/dist/WebpackConfig').default;
(async()=>{const g=new Gen(cfg.plugins[0].config,process.cwd(),true);const c=await g.getMainConfig();c.output.path=path.resolve('release/main-updated');webpack(c,(err,stats)=>{if(err||stats.hasErrors()){console.error(err||stats.toString({all:false,errors:true}));process.exitCode=1;}else console.log(stats.toString({all:false,timings:true}));});})();
