import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync } from 'node:fs';
import { HOTPOT_IMAGES, migrateFoodImages, normalizeFoodImage, normalizeOrderImages } from './food-images.mjs';
import { createAdminCatalog } from './admin-catalog.mjs';

test('hotpot migration updates persistent foods and overrides, preserves edits, and runs once', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE foods(id TEXT PRIMARY KEY,data TEXT); CREATE TABLE admin_catalog(kind TEXT,id TEXT,data TEXT,PRIMARY KEY(kind,id))');
    const menu = Object.keys(HOTPOT_IMAGES).map((name, i) => ({ id: i + 121, name, category: 'Món chính', price: 199000, available: true, image: {} }));
    for (const food of menu) db.prepare('INSERT INTO foods VALUES(?,?)').run(String(food.id), JSON.stringify(food));
    db.prepare('INSERT INTO admin_catalog VALUES(?,?,?)').run('menu','121',JSON.stringify({...menu[0],price:215000,available:false,description:'Giữ mô tả đã sửa'}));
    const result = migrateFoodImages(db, menu);
    assert.equal(result.migrated, true);
    for (const table of ['foods','admin_catalog']) for (const row of db.prepare(`SELECT data FROM ${table}`).all()) {
      const food = JSON.parse(row.data);
      assert.equal(food.imageUrl, HOTPOT_IMAGES[food.name]);
      for (const key of ['image','imageURL','thumbnail','photo']) assert.equal(Object.hasOwn(food,key), false);
      const file = new URL(`../src/public${food.imageUrl}`, import.meta.url);
      assert.ok(existsSync(file));
      assert.equal(readFileSync(file).subarray(0,2).toString('hex'),'ffd8');
    }
    const override=JSON.parse(db.prepare("SELECT data FROM admin_catalog WHERE id='121'").get().data);
    assert.equal(override.price,215000); assert.equal(override.available,false); assert.equal(override.description,'Giữ mô tả đã sửa');
    const catalog=createAdminCatalog(db,menu,[]);
    catalog.apply('menu',catalog.change('menu','121','PUT',{imageUrl:'/images/custom.jpg'}));
    assert.equal(migrateFoodImages(db,menu).migrated,false);
    const reloaded=[];const restarted=createAdminCatalog(db,reloaded,[]);
    assert.equal(restarted.list('menu').find(food=>food.id===121).imageUrl,'/images/custom.jpg');
    assert.throws(()=>catalog.change('menu','121','PUT',{imageUrl:'javascript:bad'}), /Ảnh phải/);
    catalog.apply('menu',catalog.change('menu','121','PUT',{image:'/images/legacy-client.jpg'}));
    assert.equal(catalog.list('menu').find(food=>food.id===121).imageUrl,'/images/legacy-client.jpg');
  } finally {db.close();}
});

test('legacy image fields normalize without hiding a valid imageUrl; old orders use current menu image', () => {
  assert.equal(normalizeFoodImage({imageUrl:'/primary.jpg',image:'/legacy.jpg'}).imageUrl,'/primary.jpg');
  assert.equal(normalizeFoodImage({image:{},thumbnail:'/thumb.jpg'}).imageUrl,'/thumb.jpg');
  assert.equal(normalizeFoodImage({imageURL:'/old.jpg'}).imageUrl,'/old.jpg');
  const order={id:'order',totalAmount:199000,items:[{productId:121,name:'Lẩu nấm rau củ',quantity:1,price:199000,image:'/stale.jpg'}]};
  const result=normalizeOrderImages(order,[{id:121,imageUrl:HOTPOT_IMAGES['Lẩu nấm rau củ']}]);
  assert.equal(result.items[0].imageUrl,HOTPOT_IMAGES['Lẩu nấm rau củ']);
  assert.equal(result.items[0].image,undefined);assert.equal(result.totalAmount,order.totalAmount);
});
