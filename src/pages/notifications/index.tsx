import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "@/stores/notification-api.store";
import { NotificationHeader, NotificationSummary, NotificationFilterTabs, NotificationEmptyState, NotificationGroup, NotificationCard, groupNotifications } from "./notification-components";
import "./notifications.css";
export default function NotificationsPage(){
  const navigate=useNavigate();const [filter,setFilter]=useState('all');
  const {notifications,loading,busy,error,load,markAllRead,markOneRead,remove}=useNotificationStore();
  useEffect(()=>{void load();const refresh=()=>{if(!document.hidden)void load();};window.addEventListener('focus',refresh);const timer=setInterval(refresh,30000);return()=>{window.removeEventListener('focus',refresh);clearInterval(timer);};},[load]);
  const visible=notifications.filter(n=>filter==='all'||n.type===filter);
  return <div className="notice-page"><NotificationHeader count={notifications.filter(n=>!n.isRead).length} onBack={()=>navigate('/')}/><NotificationSummary count={notifications.filter(n=>!n.isRead).length} busy={busy||loading} onRead={()=>void markAllRead()}/><NotificationFilterTabs value={filter} onChange={setFilter} items={notifications}/>{error&&<div className="notice-error" role="alert">{error}<button onClick={()=>void load()}>Thử lại</button></div>}{loading&&!notifications.length?<div aria-label="Đang tải thông báo" role="status">{[0,1,2].map(i=><div key={i} className="notice-loading"/>)}</div>:!error&&!visible.length?<NotificationEmptyState/>:groupNotifications(visible).map(group=><NotificationGroup key={group.label} label={group.label}>{group.items.map(item=><NotificationCard key={item.id} item={item} busy={busy} onRead={()=>void markOneRead(item.id)} onDelete={()=>void remove(item.id)} onOpen={async()=>{if(!item.isRead&&!(await markOneRead(item.id)))return;const route=item.action?.route;if(route&&/^\/(?:order(?:\/[^/?]+)?|reservation|promotions|profile(?:\/vouchers)?|menu)(?:\?.*)?$/.test(route))navigate(route);}}/>)}</NotificationGroup>)}</div>;
}
