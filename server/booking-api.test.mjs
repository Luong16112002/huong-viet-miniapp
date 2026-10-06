import test from 'node:test';
import assert from 'node:assert/strict';
import { checkBookingAvailability } from './booking-api.mjs';
const now=new Date('2026-09-20T03:00:00Z');
const input={date:'2026-09-20',time:'18:30',guests:2,area:'trong_nha'};
test('valid schedule stays unconfirmed without table inventory',()=>{const result=checkBookingAvailability(input,now);assert.equal(result.available,null);assert.equal(result.canRequest,true);});
test('past time rejected with later alternatives',()=>{const result=checkBookingAvailability({...input,time:'10:00'},now);assert.equal(result.available,false);assert.ok(result.alternatives.includes('10:30'));});
test('reject invalid calendar dates, time, guests and area',()=>{for(const change of [{date:'2026-09-31'},{time:'22:00'},{guests:21},{guests:0},{area:'invented'},{date:'2027-01-01'}])assert.throws(()=>checkBookingAvailability({...input,...change},now));});
