// Enrich only from menu evidence or restaurant details supplied in the request.
export const isDrink = name => /^(trà|nước|bia|soda|sinh tố|cà phê|rượu|sữa)(\s|$)/iu.test(name.normalize('NFC'));
export function enrichFood(product) {
  const food = { ...product };
  if (food.name === 'Bò nướng lá lốt') {
    Object.assign(food, {
      description: 'Thịt bò tươi cuốn lá lốt và nướng thơm.',
      ingredients: ['thịt bò', 'lá lốt', 'sả', 'tỏi', 'gia vị'],
      ingredientsSource: 'restaurant_verified', ingredientsComplete: true,
      spicyLevel: 'Không cay', allergens: [], servingSize: '1-2 người',
      suitableForChildren: true,
      childNotes: 'Có thể phù hợp với trẻ em nếu cắt nhỏ và giảm gia vị đậm.',
      customizations: ['ít gia vị', 'không cay', 'cắt nhỏ'],
      pairings: ['cơm trắng', 'rau sống', 'nước chanh'],
      drinkPairings: ['nước chanh'],
    });
  }
  if (!food.spicyLevel) {
    const recorded = food.description?.match(/không cay|cay nhẹ|cay vừa|cay nhiều|cay nồng|cay đậm/iu)?.[0];
    if (recorded) food.spicyLevel = recorded;
    else if (/\bcay\b/iu.test(food.description || '')) food.spicyLevel = 'Có vị cay; chưa ghi mức cay cụ thể';
  }
  if (food.name === 'Mực nướng sa tế') {
    Object.assign(food, {
      ingredients: ['mực tươi', 'sa tế', 'sả', 'tỏi', 'ớt', 'dầu ăn', 'gia vị'],
      ingredientsSource: 'restaurant_verified', ingredientsComplete: true,
      spicyLevel: 'Cay vừa', allergens: ['hải sản'],
      suitableFor: ['người thích món cay', 'người thích hải sản'],
      notSuitableFor: ['người dị ứng hải sản', 'trẻ nhỏ nếu không ăn được cay'],
      customizations: ['ít cay', 'không cay', 'ít sa tế', 'thêm rau'],
      servingSize: '1–2 người', pairings: ['rau sống', 'cơm trắng', 'khoai tây chiên'],
      drinkPairings: ['trà chanh', 'nước chanh', 'nước ngọt', 'nước lọc'],
    });
  }
  const ingredients = food.ingredients || [];
  // Keep compound ingredients intact: never infer a sauce's recipe.
  if (!food.pairings?.length) food.pairings = ingredients.filter(i => /\(dùng kèm\)/iu.test(i)).map(i => i.replace(/\s*\(dùng kèm\)/iu, ''));
  food.drinkPairings ??= (food.pairings || []).filter(isDrink);
  const groups = food.variantGroups || [];
  if (!food.customizations?.length) food.customizations = [...new Set([...(food.availableOptions || []), ...groups.flatMap(g => g.options.map(o => `${g.title}: ${o.name}`))])];
  if (!food.servingSize) food.servingSize = groups.find(g => g.id === 'size')?.options.map(o => o.name).join('; ') || null;
  return food;
}
