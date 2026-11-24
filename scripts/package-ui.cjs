require('ts-node').register({transpileOnly:true,compilerOptions:{module:'commonjs'}});
const path=require('path');
const webpack=require('webpack');
const config=require('../forge.config.ts').default;
const Generator=require('@electron-forge/plugin-webpack/dist/WebpackConfig').default;
(async()=>{
const plugin=config.plugins[0];
const gen=new Generator(plugin.config,process.cwd(),true);
const configs=await gen.getRendererConfig(plugin.config.renderer.entryPoints.filter(e=>e.html));
for(const c of configs) c.output.path=path.resolve('release/renderer-updated');
webpack(configs,(err,stats)=>{if(err||stats.hasErrors()){console.error(err||stats.toString({all:false,errors:true}));process.exitCode=1;}else console.log(stats.toString({all:false,timings:true,errors:true}));});
})();
