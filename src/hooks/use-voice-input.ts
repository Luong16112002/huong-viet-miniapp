import { requireDiagnostics } from "@/services/diagnostics";
import { apiFetch } from "@/services/apiClient";
﻿import { useEffect, useRef, useState } from 'react';
const failure='Không nhận được giọng nói. Bạn có thể thử lại hoặc nhập bằng bàn phím.';
const denied='Bạn chưa cho phép dùng micro. Hãy bật quyền Micro cho Zalo trong Cài đặt điện thoại (hoặc quyền Micro của trang trong trình duyệt), rồi thử lại.';
export function useVoiceInput(onTranscript?: (text:string)=>void){
 const [phase,setPhase]=useState<'idle'|'permission'|'listening'|'processing'>('idle');
 const [transcript,setTranscript]=useState(''),[error,setError]=useState('');
 const callback=useRef(onTranscript);callback.current=onTranscript;
 const session=useRef(0),active=useRef(false),recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),timer=useRef<ReturnType<typeof setTimeout>>(),request=useRef<AbortController|null>(null);
 const cleanup=()=>{clearTimeout(timer.current);stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;};
 const stopListening=()=>{if(recorder.current?.state==='recording')recorder.current.stop();};
 useEffect(()=>()=>{session.current++;active.current=false;request.current?.abort();if(recorder.current){recorder.current.onstop=null;recorder.current.ondataavailable=null;if(recorder.current.state==='recording')recorder.current.stop();}cleanup();},[]);
 const startListening=async()=>{
  if(active.current)return;active.current=true;const id=++session.current;setError('');setTranscript('');setPhase('permission');
  const fail=(e:unknown)=>{if(id!==session.current)return;console.error('[VOICE ERROR]',e instanceof Error?e.name:'VoiceError');cleanup();active.current=false;setPhase('idle');setError(e instanceof DOMException&&['NotAllowedError','PermissionDeniedError'].includes(e.name)?denied:e instanceof Error&&e.message.startsWith('Micro')?e.message:failure);};
  try{
   const Recognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
   console.log('[VOICE] supported:',!!Recognition);if(!Recognition)console.warn('SpeechRecognition is not supported');
   // Use audio capture consistently: SpeechRecognition is unreliable inside Zalo WebView.
   if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw new Error('Micro chưa được môi trường này hỗ trợ. Hãy cập nhật Zalo hoặc dùng micro trên bàn phím. Nếu mở bằng trình duyệt, hãy dùng HTTPS.');
   let permission='prompt';try{permission=(await navigator.permissions.query({name:'microphone' as PermissionName})).state;}catch{/* WebView may not expose Permissions API. getUserMedia requests permission. */}
   console.log('[VOICE] permission:',permission);if(permission==='denied')throw new DOMException('Denied','NotAllowedError');
   const media=await navigator.mediaDevices.getUserMedia({audio:true});if(id!==session.current){media.getTracks().forEach(t=>t.stop());return;}stream.current=media;console.log('[VOICE] permission: granted');
   const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));
   const r=new MediaRecorder(media,mime?{mimeType:mime}:undefined);recorder.current=r;const chunks:Blob[]=[];
   r.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};r.onerror=()=>{r.onstop=null;fail(new Error('Recording failed'))};
   r.onstop=async()=>{
    cleanup();if(id!==session.current)return;setPhase('processing');
    try{
     await requireDiagnostics();
     const audio=new Blob(chunks,{type:r.mimeType||mime||'audio/webm'});if(audio.size<100||audio.size>4*1024*1024)throw new Error('Empty or oversized audio');
     const bytes=new Uint8Array(await audio.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
     const controller=new AbortController();request.current=controller;timer.current=setTimeout(()=>controller.abort(),15000);
     const base='/api/ai/chat';const endpoint=base.replace(/\/(chat|gemini)\/?$/,'/transcribe');
     const response=await apiFetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audio:btoa(binary),mimeType:audio.type.split(';')[0]}),signal:controller.signal});
     const data=await response.json();if(!response.ok||typeof data.transcript!=='string'||!data.transcript.trim())throw new Error('Transcription failed');
     if(id!==session.current)return;const text=data.transcript.trim();if(import.meta.env.DEV)console.log('[VOICE] transcript:',text);setTranscript(text);callback.current?.(text);setPhase('idle');active.current=false;
    }catch(e){fail(e)}finally{clearTimeout(timer.current);}
   };
   r.start();setPhase('listening');timer.current=setTimeout(stopListening,12000);
  }catch(e){fail(e)}
 };
 return {isListening:phase==='listening',isProcessing:phase==='processing',isRequestingPermission:phase==='permission',transcript,error,startListening,stopListening};
}
