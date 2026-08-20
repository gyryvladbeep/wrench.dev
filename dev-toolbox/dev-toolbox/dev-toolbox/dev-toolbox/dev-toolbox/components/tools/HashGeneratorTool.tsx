"use client";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { ToolShell } from "./ToolShell";
import { Skeleton } from "@/components/ui/Skeleton";

function md5(s: string): string {
  function sa(x:number,y:number){const l=(x&0xffff)+(y&0xffff);return(((x>>16)+(y>>16)+(l>>16))<<16)|(l&0xffff);}
  function br(n:number,s:number){return(n<<s)|(n>>>(32-s));}
  function cm(q:number,a:number,b:number,x:number,s:number,t:number){return sa(br(sa(sa(a,q),sa(x,t)),s),b);}
  function ff(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cm((b&c)|(~b&d),a,b,x,s,t);}
  function gg(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cm((b&d)|(c&~d),a,b,x,s,t);}
  function hh(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cm(b^c^d,a,b,x,s,t);}
  function ii(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cm(c^(b|~d),a,b,x,s,t);}
  function bl(x:number[],len:number):number[]{x[len>>5]|=0x80<<(len%32);x[(((len+64)>>>9)<<4)+14]=len;let i,oa,ob,oc,od,a=1732584193,b=-271733879,c=-1732584194,d=271733878;for(i=0;i<x.length;i+=16){oa=a;ob=b;oc=c;od=d;a=ff(a,b,c,d,x[i],7,-680876936);d=ff(d,a,b,c,x[i+1],12,-389564586);c=ff(c,d,a,b,x[i+2],17,606105819);b=ff(b,c,d,a,x[i+3],22,-1044525330);a=ff(a,b,c,d,x[i+4],7,-176418897);d=ff(d,a,b,c,x[i+5],12,1200080426);c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983);a=ff(a,b,c,d,x[i+8],7,1770035416);d=ff(d,a,b,c,x[i+9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,-42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329);a=gg(a,b,c,d,x[i+1],5,-165796510);d=gg(d,a,b,c,x[i+6],9,-1069501632);c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i],20,-373897302);a=gg(a,b,c,d,x[i+5],5,-701558691);d=gg(d,a,b,c,x[i+10],9,38016083);c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848);a=gg(a,b,c,d,x[i+9],5,568446438);d=gg(d,a,b,c,x[i+14],9,-1019803690);c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501);a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);a=hh(a,b,c,d,x[i+5],4,-378558);d=hh(d,a,b,c,x[i+8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556);a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640);a=hh(a,b,c,d,x[i+13],4,681279174);d=hh(d,a,b,c,x[i],11,-358537222);c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189);a=hh(a,b,c,d,x[i+9],4,-640364487);d=hh(d,a,b,c,x[i+12],11,-421815835);c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651);a=ii(a,b,c,d,x[i],6,-198630844);d=ii(d,a,b,c,x[i+7],10,1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055);a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);c=ii(c,d,a,b,x[i+10],15,-1051523);b=ii(b,c,d,a,x[i+1],21,-2054922799);a=ii(a,b,c,d,x[i+8],6,1873313359);d=ii(d,a,b,c,x[i+15],10,-30611744);c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649);a=ii(a,b,c,d,x[i+4],6,-145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+2],15,718787259);b=ii(b,c,d,a,x[i+9],21,-343485551);a=sa(a,oa);b=sa(b,ob);c=sa(c,oc);d=sa(d,od);}return[a,b,c,d];}
  function s2b(s:string):number[]{const b:number[]=[],m=(1<<8)-1;for(let i=0;i<s.length*8;i+=8)b[i>>5]|=(s.charCodeAt(i/8)&m)<<(i%32);return b;}
  function b2h(b:number[]):string{const h="0123456789abcdef";let r="";for(let i=0;i<b.length*4;i++)r+=h[(b[i>>2]>>((i%4)*8+4))&0xf]+h[(b[i>>2]>>((i%4)*8))&0xf];return r;}
  const u=unescape(encodeURIComponent(s));return b2h(bl(s2b(u),u.length*8));
}
async function sha(algo:string,s:string):Promise<string>{
  const buf=await crypto.subtle.digest(algo,new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

const ALGOS=[{id:"MD5",label:"MD5",bits:"128-bit"},{id:"SHA-1",label:"SHA-1",bits:"160-bit"},{id:"SHA-256",label:"SHA-256",bits:"256-bit"},{id:"SHA-512",label:"SHA-512",bits:"512-bit"}] as const;

export function HashGeneratorTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState("Hello, Wrench!");
  const [hashes, setHashes] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);
  const isRu = dict.common.copy==="Копировать";

  useEffect(()=>{
    if(!input){setHashes({});return;}
    setLoading(true);
    (async()=>{
      const r:Record<string,string>={};
      r["MD5"]=md5(input);r["SHA-1"]=await sha("SHA-1",input);r["SHA-256"]=await sha("SHA-256",input);r["SHA-512"]=await sha("SHA-512",input);
      setHashes(r);setLoading(false);
    })();
  },[input]);

  return (
    <ToolShell onClear={()=>{setInput("");setHashes({});}}>
      <div>
        <label className="input-label">{isRu?"Входной текст":"Input text"}</label>
        <textarea value={input} onChange={(e)=>setInput(e.target.value)} rows={4} spellCheck={false}
          placeholder={isRu?"Введите или вставьте текст…":"Type or paste text to hash…"}
          className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none"/>
      </div>
      <div className="mt-4 space-y-2">
        {ALGOS.map(({id,label,bits})=>(
          <div key={id} className="code-surface rounded-[10px] p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-primary">{label}</span>
                <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-text-muted">{bits}</span>
              </div>
              <CopyButton value={hashes[id]??""} iconOnly/>
            </div>
            {loading?<Skeleton className="h-4 w-full"/>:<p className="break-all font-mono text-sm text-text-primary">{hashes[id]??"—"}</p>}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-text-muted">{isRu?"SHA-хэши вычисляются через Web Crypto API. MD5 — на чистом JS. Данные не передаются.":"SHA hashes use Web Crypto API. MD5 is pure JS. No data uploaded."}</p>
    </ToolShell>
  );
}
