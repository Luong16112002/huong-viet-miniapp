import { normalize } from './chef-engine.mjs';

// Exact, narrow fact queries only. Mixed questions and consultations go to Gemini.
export function foodFacts(food, message, missing) {
  const q = normalize(message).replace(/[?.!,;:]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (/^(gia|gia bao nhieu|gia mon nay|mon nay gia bao nhieu|bao nhieu tien|mon nay bao nhieu tien)$/.test(q))
    return food.name + ' có giá ' + food.price.toLocaleString('vi-VN') + 'đ / ' + food.unit + '.';
  if (/^(thanh phan|nguyen lieu|mon (nay )?(gom (nhung )?gi|co (nhung )?gi)|gom (nhung )?gi|thanh phan (cua )?mon nay)$/.test(q))
    return food.ingredients.length ? food.name + ' gồm ' + food.ingredients.join(', ') + '.' + (food.ingredientsComplete ? '' : ' Danh sách theo mô tả món; gia vị và nước sốt chưa được xác nhận đầy đủ.') : food.description ? 'Theo mô tả thực đơn: ' + food.description + '\nChưa có danh sách nguyên liệu và gia vị đầy đủ.' : missing;
  if (/^((mon nay )?co cay (khong|ko)|do cay|muc do cay|mon nay cay khong)$/.test(q)) {
    const options = food.customizations.filter(s => /cay|sa te/.test(normalize(s)));
    return food.spicyLevel ? food.name + ' có mức độ cay: ' + food.spicyLevel + '.' + (options.length ? ' Bạn có thể chọn ' + options.join(', ') + '.' : '') : missing;
  }
  return null;
}
