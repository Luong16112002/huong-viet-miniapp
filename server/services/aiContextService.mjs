import { createHash } from "node:crypto";
import { prepareChat, normalize } from "../chef-engine.mjs";
import { priceCart } from "../cart-pricing.mjs";
import { checkBookingAvailability } from "../booking-api.mjs";
import { isDrink } from "../food-enrichment.mjs";
const project = (r, keys) =>
  Object.fromEntries(
    keys.filter((k) => r[k] !== undefined).map((k) => [k, r[k]]),
  );
const foodKeys = [
  "imageUrl",
  "id",
  "name",
  "price",
  "unit",
  "category",
  "description",
  "ingredients",
  "ingredientsSource",
  "ingredientsComplete",
  "spicyLevel",
  "allergens",
  "servingSize",
  "suitableFor",
  "notSuitableFor",
  "suitableForChildren",
  "childNotes",
  "customizations",
  "pairings",
  "drinkPairings",
  "available",
  "features",
];
export function ownerFromAuthorization(header) {
  const token = String(header || "").replace(/^Bearer /, "");
  return /^[a-f0-9]{64}$/.test(token)
    ? createHash("sha256").update(token).digest("hex")
    : null;
}
export function detectIntent(message, memory = {}) {
  const s = normalize(message);
  if (/nut.*dat|dat.*(o dau|the nao|cach nao)|(?:xem|mo|vao)\s+gio(?:\s+hang|\s+o dau|$)|xem don(?:\s|$)|mo don|dung ma|nhap ma|(?:xem|mo).*uu dai|(?:xem|mo).*thuc don|them.*gio|(?:xem|mo) mon/.test(s)) return "APP_ACTION";
  if (
    /don (hang|cua)|lich su don|da (dat|goi) mon|don.*(o dau|trang thai|giao)/.test(
      s,
    )
  )
    return "ORDER_STATUS";
  if (/voucher|uu dai|giam gia|khuyen mai|ma nao|ma.*dung/.test(s)) return "PROMOTION";
  if (/gio hang/.test(s)) return "CART";
  if (/da dat ban|toi.*dat ban.*(chua|may gio)|ban cua|lich (hen|dat)|booking.*(status|trang thai)/.test(s)) return "BOOKING_STATUS";
  if (/con.*ban|ban.*(trong|con|khong)|san vuon.*con|co ban|het ban/.test(s)) return "TABLE_AVAILABILITY";
  if (/dat ban|booking|giu ban/.test(s)) return "BOOKING_CREATE";
  if (memory.lastIntent === "TABLE_AVAILABILITY" && /\d|trong nha|san vuon|phong rieng|hom nay|ngay mai/.test(s)) return "TABLE_AVAILABILITY";
  if (/\b(com|pho|bun|lau|chao)\b/.test(s) && /^(?:nha hang\s+)?(?:co|ban)\s/.test(s) && !/nguyen lieu|thanh phan|gom|di ung|cay|gia|bao nhieu|ngan sach/.test(s)) return "FOOD_CATEGORY";
  if (/nguyen lieu|thanh phan|gom.*(gi|nhung)/.test(s)) return "FOOD_INGREDIENTS";
  if (/di ung/.test(s)) return "FOOD_ALLERGY";
  if (
    /dia chi|o dau|mo cua|dong cua|gio hoat dong|so dien thoai|lien he|dich vu/.test(
      s,
    )
  )
    return "RESTAURANT_INFO";
  if (/do uong|uong (kem|gi)|nuoc.*(kem|hop)/.test(s)) return "DRINK_PAIRING";
  if (/ngan sach|\d+\s*(trieu|tr|k|nghin|ngan)\b/.test(s))
    return "BUDGET_RECOMMENDATION";
  if (
    /bao nhieu|gia |thanh phan|nguyen lieu|cay|di ung|tre em|cho be|mon nay|mon do|an kem|hop voi ai/.test(
      s,
    )
  )
    return "FOOD_INFO";
  if (/tu van|goi y|mon|an |nguoi|khach|khau vi/.test(s))
    return "FOOD_RECOMMENDATION";
  if (
    memory.lastIntent === "TABLE_AVAILABILITY" &&
    /\d|trong nha|san vuon|phong rieng|hom nay|ngay mai/.test(s)
  )
    return "TABLE_AVAILABILITY";
  return "GENERAL";
}
export function createAIContextService({
  menu,
  foods,
  commerce,
  restaurant,
  vouchers,
  now = () => Date.now(),
}) {
  const sessions = new Map();
  const available = () =>
    foods
      .list()
      .filter(
        (p) => p.available !== false && p.availability !== false && !p.deleted,
      );
  const service = {
    getRestaurantContext() {
      const r = restaurant();
      return {
        name: r.name,
        description: r.description,
        openingHours: r.openHours,
        address: r.address,
        phone: r.phone,
        services: ["ăn tại nhà hàng", "giao hàng", "tự đến lấy", "đặt bàn"],
      };
    },
    getMenuContext(input) {
      return prepareChat(input, available()).candidates.map((p) =>
        project(p, foodKeys),
      );
    },
    getFoodContext(id) {
      const p = available().find((p) => String(p.id) === String(id));
      return p ? project(p, foodKeys) : null;
    },
    getDrinkContext() {
      return available()
        .filter((p) => p.categoryId === "drink" || isDrink(p.name))
        .slice(0, 20)
        .map((p) => project(p, foodKeys));
    },
    getAvailableTablesContext(filters) {
      const needs = ["date", "time", "guests"].filter(k => !filters[k]);
      if (needs.length) return { needs, filters };
      const areas = filters.area ? [filters.area] : ["indoor", "garden", "private", "floor1", "floor2"];
      const query = f => {
        const check = checkBookingAvailability(f, new Date(now()));
        if (!check.canRequest) return { tables: [], message: check.message };
        return { tables: commerce.availableTables(f) };
      };
      try {
        let message;
        const tables = areas.flatMap(area => {
          const result = query({...filters, area});
          message ||= result.message;
          return result.tables;
        });
        const areaCounts = Object.fromEntries(areas.map(area => [area, tables.filter(t => t.area === area).length]));
        const alternatives = [];
        if (!tables.length) {
          const minutes = Number(filters.time.slice(0,2))*60 + Number(filters.time.slice(3));
          for (let m = minutes + 30; m <= 21*60 && alternatives.length < 3; m += 30) {
            const time = `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
            const count = areas.reduce((n, area) => n + query({...filters, time, area}).tables.length, 0);
            if (count) alternatives.push({ time, count });
          }
        }
        const rankedTables = tables.map(t => ({...t, score: Math.abs(t.capacity - filters.guests) + (filters.area && t.area !== filters.area ? 5 : 0)}))
          .sort((a,b) => a.score - b.score || String(a.id).localeCompare(String(b.id))).slice(0,5);
        return { filters, count: tables.length, areaCounts, tables: rankedTables, alternatives, message, checkedAt: new Date(now()).toISOString(), durationMinutes:120 };
      } catch {
        return { invalid: true, message: "Bạn vui lòng chọn ngày trong 30 ngày tới, giờ từ 10:00 đến 21:00 theo bước 30 phút, 1–20 khách và khu vực hợp lệ nhé." };
      }
    },
    getBookingContext(owner) {
      return owner
        ? commerce
            .aiRecords(owner, "reservation")
            .map((r) => ({
              id: r.id,
              bookingCode: r.code,
              date: r.date,
              time: r.time,
              guests: r.guests,
              area: r.area,
              table: r.tableId || null,
              status: r.status,
            }))
        : null;
    },
    getOrderContext(owner) {
      return owner
        ? commerce
            .aiRecords(owner, "order")
            .map((r) => ({
              id: r.id,
              orderCode: r.orderCode,
              status: r.state,
              type: r.deliveryType,
              items: r.items.map((i) =>
                project(i, ["name", "quantity", "price"]),
              ),
              total: r.totalAmount,
              createdAt: r.createdAt,
              timeline: (r.timeline || [])
                .slice(-8)
                .map((e) => project(e, ["at", "status", "label"])),
            }))
        : null;
    },
    getCartContext(owner, snapshot) {
      if (!snapshot || !Array.isArray(snapshot.items))
        return { known: false, message: "Chưa nhận được giỏ hàng hiện tại." };
      if (!snapshot.items.length)
        return { known: true, items: [], subtotal: 0, itemCount: 0 };
      try {
        const quote = priceCart(menu, {
          items: snapshot.items,
          deliveryType: ["pickup", "delivery", "dinein"].includes(
            snapshot.deliveryType,
          )
            ? snapshot.deliveryType
            : "pickup",
        });
        return {
          known: true,
          source: "Giỏ hàng trên thiết bị, giá kiểm tra tại nhà hàng",
          items: quote.lines.map((i) => ({
            ...i,
            servingSize:
              service.getFoodContext(i.productId)?.servingSize || null,
          })),
          subtotal: quote.subtotal,
          itemCount: quote.lines.reduce((s, i) => s + i.quantity, 0),
        };
      } catch {
        return {
          known: false,
          message:
            "Giỏ hàng có món hoặc tùy chọn đã thay đổi, cần cập nhật lại.",
        };
      }
    },
    getPromotionContext(owner, cart) {
      const profile = service.getCustomerContext(owner);
      return vouchers
        .filter(
          (v) =>
            v.enabled === true &&
            !v.deleted &&
            Number.isFinite(v.amount) && v.amount > 0 &&
            (!v.memberTiers?.length || v.memberTiers.includes(profile.memberTier)) &&
            (!v.userIds?.length || v.userIds.includes(owner)) &&
            cart?.known === true && cart.itemCount > 0 && cart.subtotal >= (v.minSubtotal || 0) &&
            (!v.startsAt || Date.parse(v.startsAt) <= now()) &&
            (!v.expiresAt || Date.parse(v.expiresAt) > now()),
        )
        .slice(0, 30)
        .map((v) => ({
          code: v.code,
          title: v.name || v.title || `Giảm ${v.amount}đ`,
          amount: v.amount,
          minSubtotal: v.minSubtotal || 0,
          expiry: v.expiresAt || null,
          eligible: cart?.known
            ? cart.itemCount > 0 && cart.subtotal >= (v.minSubtotal || 0)
            : null,
          discount: cart?.known ? Math.min(cart.subtotal, v.amount) : null,
        }));
    },
    getCustomerContext(owner) {
      return { historyAvailable: !!owner, memberPoints: null, memberTier: null };
    },
    getRecommendationsContext(input) {
      return service.getMenuContext(input);
    },
    build(input, authorization) {
      const owner = ownerFromAuthorization(authorization),
        sessionId = /^[a-zA-Z0-9-]{8,80}$/.test(input.sessionId || "")
          ? input.sessionId
          : null,
        sessionKey = owner && sessionId ? owner + ":" + sessionId : null;
      for (const [k, v] of sessions) if (v.expires < now()) sessions.delete(k);
      const memory = sessionKey ? sessions.get(sessionKey)?.memory || {} : {};
      const history = (
        Array.isArray(input.history)
          ? input.history
          : memory.recentMessages || []
      )
        .filter(
          (t) =>
            t &&
            ["user", "model", "assistant"].includes(t.role) &&
            typeof t.text === "string",
        )
        .slice(-10)
        .map((t) => ({ ...t, text: t.text.slice(0, 1500) }));
      const prepared = prepareChat(
        { ...input, history, context: { ...memory, ...input.context } },
        available(),
      );
      if (prepared.context.people && prepared.context.budget) {
        const options = [];
        for (
          let offset = 0;
          offset < Math.min(3, prepared.candidates.length);
          offset++
        ) {
          const items = [];
          let total = 0;
          for (const p of [
            ...prepared.candidates.slice(offset),
            ...prepared.candidates.slice(0, offset),
          ]) {
            if (items.length >= 4) break;
            const servings =
              Number(String(p.servingSize || "").match(/\d+/)?.[0]) || 1;
            const quantity = Math.max(
              1,
              Math.min(20, Math.ceil(prepared.context.people / servings)),
            );
            if (total + p.price * quantity > prepared.context.budget) continue;
            items.push({
              id: p.id,
              name: p.name,
              quantity,
              unitPrice: p.price,
              lineTotal: p.price * quantity,
            });
            total += p.price * quantity;
          }
          if (items.length)
            options.push({
              items,
              total,
              remaining: prepared.context.budget - total,
            });
        }
        prepared.context.calculatedCombos = options;
      }
      const intent = detectIntent(input.message, {...memory, ...input.context}),
        text = normalize(input.message);
      const named = available()
        .filter((p) => text.includes(normalize(p.name)))
        .sort((a, b) => b.name.length - a.name.length)[0];
      const currentFoodId =
        named?.id ||
        input.foodId ||
        input.context?.currentFoodId ||
        memory.currentFoodId;
      const food = service.getFoodContext(currentFoodId),
        context = {},
        sources = [],
        actions = [];
      const add = (key, value) => {
        context[key] = value;
        sources.push(key);
      };
      if (intent === "APP_ACTION") {
        const remembered = {...memory, ...input.context};
        const booking = /ban/.test(text) || (/nut.*dat/.test(text) && (/BOOKING|TABLE/.test(remembered.lastIntent || "") || remembered.lastActionTarget === "OPEN_BOOKING" || !!remembered.bookingFilters?.time));
        if (booking) actions.push({type:"OPEN_BOOKING",label:"Đặt bàn ngay"});
        else if (/gio/.test(text) && !/them/.test(text)) actions.push({type:"OPEN_CART",label:"Mở giỏ hàng"});
        else if (/don(?:\s|$)/.test(text) && !/thuc don/.test(text)) actions.push({type:"OPEN_ORDERS",label:"Xem đơn hàng"});
        else if (/ma|uu dai/.test(text)) actions.push({type:"OPEN_PROMOTIONS",label:"Xem ưu đãi"},{type:"OPEN_CART",label:"Dùng mã trong giỏ hàng"});
        else if (/them.*gio/.test(text) && food) actions.push({type:"ADD_TO_CART",id:food.id,label:"Thêm " + food.name});
        else if (/(?:xem|mo) mon/.test(text) && food) actions.push({type:"OPEN_FOOD",id:food.id,label:"Xem " + food.name});
        else if (/mon|thuc don/.test(text)) actions.push({type:"OPEN_MENU",label:"Mở thực đơn"});
        else actions.push({type:"OPEN_BOOKING",label:"Đặt bàn ngay"},{type:"OPEN_MENU",label:"Đặt món"});
        add("appActions", actions);
        add("appRoutes", {OPEN_BOOKING:"/reservation",OPEN_MENU:"/menu",OPEN_CART:"/cart",OPEN_ORDERS:"/order",OPEN_PROMOTIONS:"/promotions",OPEN_FOOD:"/product/:id",ADD_TO_CART:"sheet chọn món, xác nhận thêm vào giỏ"});
        if (food && actions.some(a=>a.id)) add("food",food);
      } else if (intent === "ORDER_STATUS") {
        const orders = service.getOrderContext(owner);
        const code = text.match(/hv-[a-z0-9-]+/i)?.[0];
        add(
          "orders",
          code && orders
            ? orders.filter((o) => normalize(o.orderCode) === code)
            : orders,
        );
        add("customer", service.getCustomerContext(owner));
        for (const o of context.orders || [])
          actions.push({
            type: "OPEN_ORDER",
            id: o.id,
            label: "Xem đơn #" + o.orderCode,
          });
      } else if (["BOOKING_CREATE", "BOOKING_STATUS"].includes(intent)) {
        add("bookings", service.getBookingContext(owner));
        actions.push(
          { type: "BOOK_TABLE", label: "Đặt bàn" },
          { type: "OPEN_BOOKINGS", label: "Lịch đặt bàn" },
        );
      } else if (intent === "TABLE_AVAILABILITY") {
        const selected = {...memory, ...input.context};
        const previous = memory.bookingFilters || {},
          f = { ...previous, ...input.context?.bookingFilters,
            ...Object.fromEntries(Object.entries({date:selected.selectedDate,time:selected.selectedTime,guests:selected.selectedGuests,area:selected.selectedArea}).filter(([,v])=>v !== undefined && v !== null)),
            ...input.bookingFilters };
        const date = text.match(/\b(\d{4}-\d{2}-\d{2})\b/),
          day = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/),
          time = text.match(/\b([01]?\d|2[0-3])(?::|h)([0-5]\d)?\b/);
        if (date) f.date = date[1];
        else if (day)
          f.date = `${day[3] || new Date(now()).getFullYear()}-${day[2].padStart(2, "0")}-${day[1].padStart(2, "0")}`;
        else if (/hom nay|ngay mai/.test(text))
          f.date = new Intl.DateTimeFormat("sv-SE", {
            timeZone: "Asia/Ho_Chi_Minh",
          }).format(new Date(now() + (/ngay mai/.test(text) ? 86400000 : 0)));
        if (time) f.time = time[1].padStart(2, "0") + ":" + (time[2] || "00");
        f.guests = Number(text.match(/(\d+)\s*(?:nguoi|khach)/)?.[1]) || f.guests || prepared.context.people;
        if (/trong nha/.test(text)) f.area = "indoor";
        else if (/san vuon/.test(text)) f.area = "garden";
        else if (/phong rieng|private/.test(text)) f.area = "private";
        else if (/tang [12]/.test(text))
          f.area = /tang 2/.test(text) ? "floor2" : "floor1";
        
        add("availability", service.getAvailableTablesContext(f));
        memory.bookingFilters = f;
        const a = context.availability;
        const labels = {indoor:"Trong nhà",garden:"Sân vườn",private:"Phòng riêng",floor1:"Tầng 1",floor2:"Tầng 2"};
        add("calendar", {today:new Intl.DateTimeFormat("sv-SE", {timeZone:"Asia/Ho_Chi_Minh"}).format(new Date(now())),tomorrow:new Intl.DateTimeFormat("sv-SE", {timeZone:"Asia/Ho_Chi_Minh"}).format(new Date(now()+86400000))});
        if (!a.needs && !a.invalid) {
          if (!f.area) for (const [area,count] of Object.entries(a.areaCounts).filter(([,n])=>n>0).slice(0,4)) {
            if (count > 0) actions.push({type:"SELECT_AREA",value:area,label:labels[area]});
          }
          actions.push({ type: "OPEN_BOOKING", label: "Đặt bàn" });
          if (f.area && a.count > 0) {
            actions.splice(0,actions.length,...a.tables.slice(0,4).map(t=>({type:"SELECT_TABLE",id:t.id,label:"Chọn " + (t.code || t.id),bookingFilters:{...f,area:t.area}})),{type:"OPEN_BOOKING",label:"Đặt bàn"});
          }
        }
      } else if (intent === "FOOD_CATEGORY") {
        const category = text.match(/\b(com|pho|bun|lau|chao)\b/)?.[1];
        const matches = available().filter(p => normalize(p.category || "") === category || normalize(p.name).startsWith(category + " "));
        add("foodCategory", {name:category,count:matches.length,items:matches.slice(0,5).map(p=>project(p,foodKeys))});
        for (const p of matches.slice(0,2)) actions.push({type:"OPEN_FOOD",id:p.id,label:"Xem " + p.name}, {type:"ADD_TO_CART",id:p.id,label:"Thêm " + p.name});
      } else if (intent === "CART" || intent === "PROMOTION") {
        const cart = service.getCartContext(owner, input.cart);
        add("cart", cart);
        if (intent === "PROMOTION")
          add("promotions", service.getPromotionContext(owner, cart));
        actions.push({ type: "OPEN_CART", label: "Xem giỏ hàng" });
        if (intent === "PROMOTION")
          actions.push({ type: "OPEN_PROMOTIONS", label: "Xem ưu đãi" });
      } else if (intent === "RESTAURANT_INFO")
        add("restaurant", service.getRestaurantContext());
      else if (["FOOD_INFO", "FOOD_INGREDIENTS", "FOOD_ALLERGY", "DRINK_PAIRING"].includes(intent)) {
        add("food", food);
        if (!food)
          add(
            "matchingFoods",
            service.getMenuContext({ ...input, history: [] }).slice(0, 5),
          );
        if (intent === "DRINK_PAIRING")
          add("drinks", service.getDrinkContext());
        if (/an kem|mon kem/.test(text))
          add(
            "sideDishes",
            available()
              .filter(
                (p) =>
                  p.categoryId === "starter" ||
                  /khai vi|mon kem/.test(normalize(p.category)),
              )
              .slice(0, 12)
              .map((p) => project(p, foodKeys)),
          );
        if (food)
          actions.push({
            type: "OPEN_FOOD",
            id: food.id,
            label: "Xem " + food.name,
          });
      } else if (intent !== "GENERAL") {
        add(
          "menu",
          prepared.candidates.map((p) => project(p, foodKeys)),
        );
        add("preferences", prepared.context);
      } else
        add("services", [
          "Tư vấn món",
          "Đặt bàn",
          "Kiểm tra đơn hàng",
          "Ưu đãi",
          "Thông tin nhà hàng",
        ]);
      const next = {
        ...prepared.context,
        currentFoodId: food?.id || null,
        lastIntent: intent,
        lastActionTarget: intent === "APP_ACTION" ? actions[0]?.type : memory.lastActionTarget,
        bookingFilters: memory.bookingFilters || input.context?.bookingFilters,
        recentMessages: [
          ...history,
          { role: "user", text: input.message.slice(0, 1500) },
        ].slice(-10),
      };
      if (sessionKey) {
        if (sessions.size >= 1000 && !sessions.has(sessionKey))
          sessions.delete(sessions.keys().next().value);
        sessions.set(sessionKey, { memory: next, expires: now() + 1800000 });
      }
      return {
        intent,
        context,
        sources,
        actions: actions.slice(0, 5),
        prepared,
        memory: next,
        food,
        history,
      };
    },
  };
  Object.assign(service, {
    getRestaurantInfo: service.getRestaurantContext,
    getMenuItems: () => available().map(p => project(p, foodKeys)),
    getFoodById: service.getFoodContext,
    getFoodByName: name => { const p = available().find(p => normalize(p.name) === normalize(name)); return p ? project(p, foodKeys) : null; },
    getDrinks: service.getDrinkContext,
    getPromotions: service.getPromotionContext,
    getCart: service.getCartContext,
    getOrders: service.getOrderContext,
    getBookings: service.getBookingContext,
    getAvailableTables: service.getAvailableTablesContext,
    getCustomerProfile: service.getCustomerContext,
    rememberReply(input, authorization, reply) {
      const key = ownerFromAuthorization(authorization) + ":" + input.sessionId;
      const session = sessions.get(key);
      if (session) session.memory.recentMessages = [...session.memory.recentMessages, {role:"model", text:reply.slice(0,1500)}].slice(-10);
    },
  });
  return service;
}
