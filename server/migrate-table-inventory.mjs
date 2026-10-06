import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tablePrefixes, tableCode, capacityForNumber, canonicalArea } from './table-policy.mjs';

export function migrateInventory(db, { dryRun = true } = {}) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const old = db.prepare('SELECT data FROM restaurant_tables ORDER BY id').all().map(r=>JSON.parse(r.data));
    const records = db.prepare('SELECT id,data FROM records').all().map(r=>({...r,value:JSON.parse(r.data)}));
    const targets = Object.keys(tablePrefixes).flatMap(area=>Array.from({length:100},(_,i)=>({id:tableCode(area,i+1),code:tableCode(area,i+1),name:`Bàn ${String(i+1).padStart(3,'0')}`,area,capacity:capacityForNumber(i+1),status:'AVAILABLE',active:true})));
    const used = new Set(), mapping = new Map();
    if (old.length > 500) throw Error('Inventory exceeds 500 tables; manual reconciliation required.');
    // Preserve standard IDs first; allocate legacy IDs one-to-one, never merge tables.
    old.sort((a,b)=>Number(targets.some(t=>t.id===b.id))-Number(targets.some(t=>t.id===a.id)) || a.id.localeCompare(b.id));
    for (const row of old) {
      const linked=records.filter(r=>r.value.tableId===row.id || r.value.tableNumber===row.id);
      const guests=Math.max(1,...linked.filter(r=>['pending','confirmed','checked_in'].includes(r.value.status)).map(r=>Number(r.value.guests)||1));
      let target=targets.find(t=>t.id===row.id && !used.has(t.id));
      if (target && target.capacity<guests) throw Error(`Capacity conflict for ${row.id}; migration rolled back.`);
      if (!target) {
        const n=/^T(\d+)$/.exec(row.id)?.[1];
        const preferred=n ? (Number(n)<=100?tableCode('indoor',Number(n)):Number(n)<=200?tableCode('floor1',Number(n)-100):null) : null;
        target=targets.find(t=>t.id===preferred&&!used.has(t.id)&&t.capacity>=guests)
          || targets.find(t=>t.area===canonicalArea(row.area)&&!used.has(t.id)&&t.capacity>=guests)
          || targets.find(t=>!used.has(t.id)&&t.capacity>=guests);
      }
      if(!target) throw Error(`No safe destination for ${row.id}`);
      used.add(target.id); mapping.set(row.id,target);
      Object.assign(target,{...row,...target,status:row.status||'AVAILABLE',active:true});
    }
    let updatedRecords=0;
    for(const record of records){
      const r=record.value, id=r.tableId||r.tableNumber;
      if(!id) continue;
      const target=mapping.get(id);
      if(!target) throw Error(`Unresolved table reference in record ${record.id}`);
      if(r.tableId && r.tableNumber && r.tableId!==r.tableNumber) throw Error(`Inconsistent table reference in ${record.id}`);
      const before=JSON.stringify(r);
      if(r.tableId) r.tableId=target.id;
      if(r.tableNumber) r.tableNumber=target.id;
      if(r.tableName) r.tableName=target.name;
      if(r.area) r.area=target.area;
      if(JSON.stringify(r)!==before){updatedRecords++;if(!dryRun) db.prepare('UPDATE records SET data=? WHERE id=?').run(JSON.stringify(r),record.id);}
    }
    if(!dryRun){
      // All references have been rewritten in this same transaction.
      db.exec('DELETE FROM restaurant_tables');
      const insert=db.prepare('INSERT INTO restaurant_tables(id,data) VALUES(?,?)');
      for(const t of targets) insert.run(t.id,JSON.stringify(t));
      db.exec('CREATE TABLE IF NOT EXISTS table_migrations(old_id TEXT PRIMARY KEY,new_id TEXT NOT NULL)');
      for(const [oldId,t] of mapping) if(oldId!==t.id) db.prepare('INSERT OR REPLACE INTO table_migrations VALUES(?,?)').run(oldId,t.id);
    }
    const result={before:old.length,total:targets.length,updatedRecords,areas:Object.fromEntries(Object.keys(tablePrefixes).map(area=>[area,targets.filter(t=>t.area===area).length])),dryRun};
    db.exec(dryRun?'ROLLBACK':'COMMIT');return result;
  }catch(e){db.exec('ROLLBACK');throw e;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const env=fileURLToPath(new URL('./.env',import.meta.url));if(existsSync(env))process.loadEnvFile(env);
 const filename=process.env.COMMERCE_DB_PATH||fileURLToPath(new URL('./data/commerce.sqlite',import.meta.url));
 const db=new DatabaseSync(filename);
 try{
  const apply=process.argv.includes('--apply');
  if(apply){const backup=filename+'.before-table-migration-'+Date.now()+'.sqlite';mkdirSync(dirname(backup),{recursive:true});db.prepare('VACUUM INTO ?').run(backup);console.log('Backup:',backup);}
  console.log(JSON.stringify(migrateInventory(db,{dryRun:!apply})));
 }catch(e){console.error(e.message);process.exitCode=1;}finally{db.close();}
}
