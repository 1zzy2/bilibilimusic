const fs=require('fs');const p='src/shared/plugin-manager/main/index.ts';let s=fs.readFileSync(p,'utf8');s='import getResourcePath from "@/common/get-resource-path";\n'+s;s=s.replace('const { data: code } = await _axios.get<string>(defaultBilibiliPlugin.url, {\n                    responseType: "text",\n                    timeout: 5000,\n                });',`let code: string;
                try {
                    code = await fs.readFile(getResourcePath("bundled-plugins/bilibili.js"), "utf8");
                } catch {
                    code = (await _axios.get<string>(defaultBilibiliPlugin.url, {
                        responseType: "text", timeout: 5000,
                    })).data;
                }`);fs.writeFileSync(p,s);
