'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const coreSource = html.match(/\/\* CORE_START:[^]*?\*\/([\s\S]*?)\/\* CORE_END \*\//)?.[1];
assert.ok(coreSource, 'Production core markers must exist');
const core = vm.runInNewContext(coreSource + '\nCore;', {});
let passed = 0;
function test(description, fn) {
  try { fn(); passed++; console.log('PASS', description); }
  catch (error) { console.error('FAIL', description); throw error; }
}
test('18 distinct modern types', () => assert.equal(new Set(core.TYPES).size, 18));
test('Fire against Grass is 2×', () => assert.equal(core.multiplier('Fire', ['Grass']), 2));
test('Water against Grass is ½×', () => assert.equal(core.multiplier('Water', ['Grass']), .5));
test('Fire/Water offense treats attacks separately', () => {
  const actual = core.offense(['Fire','Water'], ['Grass']);
  assert.equal(actual[0].mult, 2);assert.equal(actual[1].mult,.5);
});
test('Fire against Water is ½× (not incorrectly floored at 1×)', () => assert.equal(core.bestAttack(['Fire'], ['Water']).mult, .5));
test('Normal against Ghost is 0×, even when best available', () => assert.equal(core.bestAttack(['Normal'], ['Ghost']).mult, 0));
test('No available attacks gives null, not fictitious neutral hit', () => assert.equal(core.bestAttack([], ['Water']).mult, null));
test('Flying/Steel takes 2× Electric because Steel is neutral', () => assert.equal(core.multiplier('Electric',['Flying','Steel']),2));
test('Fire/Steel takes 4× Ground', () => assert.equal(core.multiplier('Ground',['Fire','Steel']),4));
test('Water/Ground is immune to Electric', () => assert.equal(core.multiplier('Electric',['Water','Ground']),0));
test('Bug against Dark/Psychic is 4×', () => assert.equal(core.multiplier('Bug',['Dark','Psychic']),4));
test('Fire/Water defenses multiply resistances independently', () => assert.equal(core.multiplier('Ice',['Fire','Water']),.25));
test('Immune takes precedence over weakness', () => assert.equal(core.multiplier('Ground',['Electric','Flying']),0));
test('Unknown type does not silently become neutral', () => assert.equal(core.multiplier('Mystery',['Water']),null));
test('Case insensitive type normalization', () => assert.equal(core.multiplier('fire',['GRASS']),2));
test('Duplicate attacking type does not double-count', () => assert.equal(core.offense(['Fire','Fire'],['Grass']).length,1));
test('Defensive mapping accounts for all attack types', () => assert.equal(core.defense(['Steel','Fairy']).length,18));
test('Migration preserves up to six unique Pokémon and four moves', () => {
  const arr=[{id:25,name:' Pikachu ',types:['Electric'],moves:['Thunder Bolt','Thunder Bolt','Quick Attack','Tackle','Surf','Extra']},
   {id:25,name:'Duplicated'},{id:'6',name:'Charizard',types:['Fire','Flying'],moves:[]},
   ...Array.from({length:8},(_,i)=>({id:i+100,name:'Test'}))];
  const result=core.sanitizeTeam(arr);
  assert.equal(result.length,6);assert.equal(result[0].name,'Pikachu');
  assert.equal(result[0].moves.join(','),'thunder-bolt,quick-attack,tackle,surf');
  assert.equal(result[1].id,6);
});
test('Migration rejects invalid records',()=>assert.equal(core.sanitizeTeam([null,{id:0},{id:-1},{id:'abc'},{}]).length,0));
test('Fixed-power, variable-power and status moves do not count as coverage',()=>{
  const team=[{id:1,types:['Normal'],moves:['splash','dragon-rage','tackle','unknown']}];
  const meta={'splash':{type:'Normal',damageClass:'status',power:null},'dragon-rage':{type:'Dragon',damageClass:'special',power:null},'tackle':{type:'Normal',damageClass:'physical',power:40}};
  const result=core.coverage(team,meta);assert.equal(result.attackTypes.join(','),'Normal');assert.equal(result.targets.length,171);assert.equal(result.covered,0);
});
test('Team coverage correctly identifies resisting and immune switch-ins',()=>{
  const result=core.coverage([{id:1,types:['Water','Ground'],moves:[]},{id:2,types:['Grass'],moves:[]}],{});
  const electric=result.defensives.find(row=>row.type==='Electric');assert.equal(electric.immune,1);assert.equal(electric.resist,1);
});
test('Team coverage counts super-effective options against dual typings',()=>{
  const result=core.coverage([{id:1,types:['Fire'],moves:['flamethrower']}],{'flamethrower':{type:'Fire',damageClass:'special',power:90}});
  assert.equal(result.targets.find(row=>row.types.join('/')==='Grass/Steel')?.best,4);
  assert.equal(result.targets.find(row=>row.types.join('/')==='Water')?.best,.5);
});
console.log(`\n${passed} core regression tests passed.`);
