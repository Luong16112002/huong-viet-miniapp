import { randomUUID, createHash } from 'node:crypto';
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export const reviewTags=['Món ăn ngon','Phục vụ tốt','Không gian đẹp','Giá hợp lý','Sạch sẽ','Giao nhanh','Cần cải thiện'];
export function validateReview(input,menu){
 if(!input||typeof input!=='object'||Array.isArray(input))fail('Dữ liệu đánh giá không hợp lệ.');
 if(!Number.isInteger(input.rating)||input.rating<1||input.rating>5)fail('Vui lòng chọn từ 1 đến 5 sao.');
 const content=typeof input.content==='string'?input.content.trim():'';
 if(content.length<10||content.length>1000)fail('Nội dung cần từ 10 đến 1.000 ký tự.');
 const tags=input.tags??[];if(!Array.isArray(tags)||tags.length>7||tags.some(t=>!reviewTags.includes(t)))fail('Chủ đề đánh giá không hợp lệ.');
 const images=input.images??[];if(!Array.isArray(images)||images.length>3)fail('Chỉ được đính kèm tối đa 3 ảnh.');
 for(const image of images){if(typeof image!=='string'||image.length>420000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image))fail('Ảnh không hợp lệ hoặc quá lớn.');const [header,data]=image.split(',');const bytes=Buffer.from(data,'base64');const valid=header.includes('jpeg')?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:header.includes('png')?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';if(!valid)fail('Định dạng ảnh không hợp lệ.');}
 const criteria=input.criteria??{};if(!criteria||typeof criteria!=='object'||Array.isArray(criteria)||Object.entries(criteria).some(([k,v])=>!['food','service','space','price'].includes(k)||!Number.isInteger(v)||v<1||v>5))fail('Điểm tiêu chí phải từ 1 đến 5 sao.');
 const product=input.foodId==null?null:menu.find(p=>p.id===input.foodId);if(input.foodId!=null&&!product)fail('Món ăn không tồn tại.');
 return {rating:input.rating,content,tags:[...new Set(tags)],images,criteria,foodId:product?.id??null,foodName:product?.name||'Trải nghiệm tại Hương Việt'};
}
export function createReviewRoutes(db,menu){
 db.exec('CREATE TABLE IF NOT EXISTS personal_reviews (id TEXT PRIMARY KEY, owner TEXT NOT NULL, request_key TEXT NOT NULL, fingerprint TEXT NOT NULL, data TEXT NOT NULL, UNIQUE(owner,request_key));');
 return async(req,res,send,owner,path)=>{
  const match=path.match(/^\/api\/commerce\/reviews(?:\/([^/]+)(?:\/(update|delete))?)?$/);if(!match)return false;
  const [,id,action]=match;
  if(req.method==='GET'&&!id){send(res,200,db.prepare('SELECT data FROM personal_reviews WHERE owner=? ORDER BY rowid DESC').all(owner).map(r=>JSON.parse(r.data)));return true;}
  if(req.method!=='POST')fail('Phương thức không được hỗ trợ.',405);
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>1400000)fail('Ảnh đính kèm quá lớn.',413);}
  let input;try{input=JSON.parse(raw);}catch{fail('Dữ liệu không hợp lệ.');}
  if(id){const row=db.prepare('SELECT data FROM personal_reviews WHERE id=? AND owner=?').get(id,owner);if(!row)fail('Không tìm thấy đánh giá.',404);
   if(action==='delete'){db.prepare('DELETE FROM personal_reviews WHERE id=? AND owner=?').run(id,owner);send(res,200,{success:true});return true;}
   if(action!=='update')fail('Không tìm thấy thao tác.',404);
   const old=JSON.parse(row.data);const review={...old,...validateReview(input,menu),updatedAt:new Date().toISOString()};db.prepare('UPDATE personal_reviews SET data=? WHERE id=? AND owner=?').run(JSON.stringify(review),id,owner);send(res,200,review);return true;
  }
  const key=req.headers['idempotency-key'];if(typeof key!=='string'||!/^[\w-]{16,80}$/.test(key))fail('Thiếu mã yêu cầu.');
  const validated=validateReview(input,menu);const fingerprint=createHash('sha256').update(JSON.stringify(validated)).digest('hex');const existing=db.prepare('SELECT data,fingerprint FROM personal_reviews WHERE owner=? AND request_key=?').get(owner,key);
  if(existing){if(existing.fingerprint!==fingerprint)fail('Mã yêu cầu đã được sử dụng.');send(res,200,JSON.parse(existing.data));return true;}
  const now=new Date().toISOString();const review={...validated,id:randomUUID(),createdAt:now,updatedAt:now};db.prepare('INSERT INTO personal_reviews VALUES (?,?,?,?,?)').run(review.id,owner,key,fingerprint,JSON.stringify(review));send(res,201,review);return true;
 };
}
