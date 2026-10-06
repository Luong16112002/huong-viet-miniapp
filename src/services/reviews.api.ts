import { commerceRequest } from "./commerce.api";
export const reviewTags=['Món ăn ngon','Phục vụ tốt','Không gian đẹp','Giá hợp lý','Sạch sẽ','Giao nhanh','Cần cải thiện'];
export interface ReviewDraft {rating:number;content:string;foodId:number|null;tags:string[];images:string[];criteria:Partial<Record<'food'|'service'|'space'|'price',number>>}
export interface Review extends ReviewDraft {id:string;foodName:string;createdAt:string;updatedAt:string;local?:boolean}
export const reviewService={list:()=>commerceRequest<Review[]>('reviews'),save:(draft:ReviewDraft,id?:string,key?:string)=>commerceRequest<Review>(id?`reviews/${encodeURIComponent(id)}/update`:'reviews',draft,key),remove:(id:string)=>commerceRequest<{success:boolean}>(`reviews/${encodeURIComponent(id)}/delete`,{})};
