import { apiFetch } from "@/services/apiClient";
﻿import './promotions.css';
import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {useSnackbar} from 'zmp-ui';
import {useCartDraft} from '@/stores/cart-draft.store';
import {useCartStore} from '@/stores/cart.store';
import {quoteCart} from '@/services/cart.api';
import {PromotionHeader,PromotionHeroBanner,PromotionTabs,RecommendedFoodsSection} from './promotion-components';
import {VoucherSection,VoucherDetailSheet,type Voucher} from './voucher-components';
export default function PromotionsPage(){const navigate=useNavigate(),{openSnackbar}=useSnackbar(),draft=useCartDraft(),items=useCartStore(s=>s.items);const [filter,setFilter]=useState('Tất cả'),[copied,setCopied]=useState(''),[selected,setSelected]=useState<Voucher|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const query=useQuery({queryKey:['active-vouchers'],queryFn:async()=>{const base=('/api/commerce').replace(/\/commerce\/?$/,'');const r=await apiFetch(base+'/vouchers',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Chưa tải được ưu đãi');const data=await r.json();if(!Array.isArray(data))throw Error('Dữ liệu không hợp lệ');return data as Voucher[];},staleTime:60000});
 const copy=async(v:Voucher)=>{try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(v.code);else{const el=document.createElement('textarea');el.value=v.code;el.style.position='fixed';el.style.opacity='0';(document.querySelector('dialog[open]')||document.body).appendChild(el);el.select();const ok=document.execCommand('copy');el.remove();if(!ok)throw Error('Copy failed')}setCopied(v.code);openSnackbar({text:'Đã sao chép mã ưu đãi',type:'success'});}catch{openSnackbar({text:'Chưa sao chép được. Bạn có thể ghi lại mã '+v.code,type:'warning'});}};
 const use=async()=>{if(!selected||busy)return;setBusy(true);setError('');try{if(items.length)await quoteCart(items,draft.deliveryType,selected.code);draft.update({voucherCode:selected.code});navigate(items.length?'/cart':'/menu');}catch(e){setError(e instanceof Error?e.message:'Chưa áp dụng được mã.')}finally{setBusy(false)}};
 return <div className="pv-page"><PromotionHeader/><main><PromotionHeroBanner count={query.data?.length??0}/><PromotionTabs value={filter} set={setFilter}/>{filter!=='Món ăn'&&(query.isPending?<div className="pv-loading" role="status">Đang tải ưu đãi…</div>:query.isError?<div className="pv-empty"><p>Chưa tải được ưu đãi. Vui lòng thử lại.</p><button onClick={()=>query.refetch()}>Thử lại</button></div>:<VoucherSection vouchers={query.data||[]} copied={copied} onOpen={v=>{setSelected(v);setError('')}} onCopy={copy}/>)}{filter!=='Voucher'&&<RecommendedFoodsSection/>}</main>{selected&&<VoucherDetailSheet voucher={selected} close={()=>setSelected(null)} copy={()=>void copy(selected)} use={()=>void use()} busy={busy} error={error}/>}</div>
}
