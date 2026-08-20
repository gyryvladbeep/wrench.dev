"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
type T = "success"|"error"|"info";
interface Item { id:string; message:string; type:T; }
interface Ctx  { toast:(m:string,t?:T)=>void; success:(m:string)=>void; error:(m:string)=>void; }
const ToastCtx = createContext<Ctx|null>(null);
const NOOP: Ctx = { toast:()=>{}, success:()=>{}, error:()=>{} };
export function useToast(): Ctx { return useContext(ToastCtx) ?? NOOP; }

function ToastItem({ item, onRemove }: { item:Item; onRemove:(id:string)=>void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t1=setTimeout(()=>setVisible(true),10);
    const t2=setTimeout(()=>setVisible(false),2200);
    const t3=setTimeout(()=>onRemove(item.id),2600);
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[item.id,onRemove]);
  const icons = { success:"✓", error:"✕", info:"ℹ" };
  const cls   = {
    success:"border-accent/40 bg-accent/10 text-accent",
    error:  "border-red-500/40 bg-red-500/10 text-red-400",
    info:   "border-border bg-surface text-text-primary",
  };
  return (
    <div role="status" aria-live="polite"
      className={`flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-sm shadow-lg transition-all duration-300 ${cls[item.type]} ${visible?"translate-y-0 opacity-100":"translate-y-2 opacity-0"}`}>
      <span className="font-bold shrink-0">{icons[item.type]}</span>
      <span>{item.message}</span>
    </div>
  );
}

export function ToastProvider({ children }: { children:React.ReactNode }) {
  const [toasts, setToasts] = useState<Item[]>([]);
  const counter = useRef(0);
  const remove  = useCallback((id:string)=>setToasts(p=>p.filter(t=>t.id!==id)),[]);
  const toast   = useCallback((message:string,type:T="info")=>{
    const id=`t-${++counter.current}`;
    setToasts(p=>[...p.slice(-3),{id,message,type}]);
  },[]);
  const success = useCallback((m:string)=>toast(m,"success"),[toast]);
  const error   = useCallback((m:string)=>toast(m,"error"),[toast]);
  return (
    <ToastCtx.Provider value={{toast,success,error}}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t=><ToastItem key={t.id} item={t} onRemove={remove}/>)}
      </div>
    </ToastCtx.Provider>
  );
}
