import { apiFetch } from "@/services/apiClient";
import { create } from "zustand";
import { ownerToken } from "@/services/commerce.api";
export interface Notice { id:string; type:"booking"|"order"|"promotion"|"system"; tone?:"success"|"warning"; title:string; message:string; createdAt:string; isRead:boolean; read:boolean; action?:{label:string;route:string} }
const base=('/api/commerce').replace(/\/commerce\/?$/, '')+'/notifications';
async function request(path='',method='GET') {
  const response=await apiFetch(base+path,{method,headers:{Authorization:`Bearer ${ownerToken()}`},signal:AbortSignal.timeout(20000)});
  const data=await response.json();if(!response.ok) throw new Error(data.error || 'Chưa cập nhật được thông báo.');return data;
}
interface State { notifications:Notice[]; loading:boolean; busy:boolean; error:string; load:()=>Promise<void>; markAllRead:()=>Promise<boolean>; markOneRead:(id:string)=>Promise<boolean>; remove:(id:string)=>Promise<boolean> }
export const useNotificationStore=create<State>((set,get)=>{
  let revision=0;
  async function mutate(path:string,method:string,update:(list:Notice[])=>Notice[]) {
    if(get().busy)return false;
    revision++;const previous=get().notifications;set({busy:true,error:'',notifications:update(previous)});
    try{await request(path,method);return true;}catch(error){set({notifications:previous,error:error instanceof Error?error.message:'Chưa kết nối được với nhà hàng.'});return false;}finally{revision++;set({busy:false});}
  }
  return {notifications:[],loading:false,busy:false,error:'',
    load:async()=>{if(get().loading||get().busy)return;const version=revision;set({loading:true,error:''});try{const data=await request();if(version===revision)set({notifications:data.map((n:Notice)=>({...n,read:n.isRead}))});}catch{set({error:'Chưa tải được thông báo. Vui lòng thử lại.'});}finally{set({loading:false});}},
    markAllRead:()=>mutate('/read-all','PUT',list=>list.map(n=>({...n,isRead:true,read:true}))),
    markOneRead:id=>mutate('/'+encodeURIComponent(id)+'/read','PUT',list=>list.map(n=>n.id===id?{...n,isRead:true,read:true}:n)),
    remove:id=>mutate('/'+encodeURIComponent(id),'DELETE',list=>list.filter(n=>n.id!==id)),
  };
});
