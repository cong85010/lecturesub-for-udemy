const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function load() {
  const ctx = vm.createContext({ URL, console });
  const file = require('node:path').join(__dirname, '../src/study-core.js');
  if (fs.existsSync(file)) vm.runInContext(fs.readFileSync(file, 'utf8'), ctx);
  return ctx.CCUdemy || {};
}
const lesson = {url:'https://www.udemy.com/course/test/learn/lecture/1#content',title:'Models',course:'AI',transcript:'LangChain lets you swap models. AWS Bedrock is another provider.'};
const deck = {questions:[{question:'What does LangChain allow?',answer:'Swap models.',quote:'LangChain lets you swap models.'}],flashcards:[{front:'Another provider?',back:'AWS Bedrock.',quote:'AWS Bedrock is another provider.'}]};
test('study identities omit query/hash and reject non-lecture URLs', () => {
  const app = load(); assert.equal(typeof app.studyLesson, 'function');
  assert.equal(app.studyLesson(lesson).url, lesson.url.split('#')[0]);
  assert.throws(()=>app.studyLesson({...lesson,url:'https://evil.test/lecture/1'}));
  assert.throws(()=>app.studyLesson({...lesson,transcript:' '}));
  assert.throws(()=>app.studyLesson({...lesson,transcript:'a'.repeat(60001)}));
});
test('AI output is bounded and requires real source evidence', () => {
  const app=load(); assert.equal(typeof app.studyDeck,'function');
  assert.equal(app.studyDeck(deck,lesson).questions[0].answer,'Swap models.');
  assert.throws(()=>app.studyDeck({...deck,flashcards:[]},lesson));
  assert.throws(()=>app.studyDeck({...deck,questions:[{...deck.questions[0],quote:'invented'}]},lesson));
  assert.throws(()=>app.studyDeck({...deck,questions:[{...deck.questions[0],answer:42}]},lesson));
});
test('remembered cards get a due date; forgotten cards return now', () => {
  const app=load(); assert.equal(typeof app.studyGrade,'function');
  const first=app.studyGrade({},true,1000); assert.equal(first.due,1000+86400000);
  const second=app.studyGrade(first,true,2000); assert.equal(second.due,2000+3*86400000);
  assert.equal(app.studyGrade(second,false,3000).due,3000);
});
function service(fetcher) {
  const ctx=vm.createContext({URL,console,fetch,AbortSignal,crypto:require('node:crypto').webcrypto});
  for(const file of ['study-core.js','study-service.js']) vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../src',file),'utf8'),ctx);
  let data={};const storage={get:async()=>structuredClone(data),set:async value=>{data={...data,...structuredClone(value)};}};
  return ctx.CCUdemy.createStudyService(storage,{fetcher});
}
test('generation requires consent, deduplicates in-flight requests and reuses persisted decks',async()=>{
  let calls=0;
  const app=service(async()=>{calls++;await new Promise(r=>setTimeout(r,5));return {ok:true,json:async()=>deck};});
  await assert.rejects(app.handle({type:'study.generate',lesson}),/đồng ý/);
  const message={type:'study.generate',lesson,consent:true};
  const [a,b]=await Promise.all([app.handle(message),app.handle(message)]);
  assert.equal(calls,1);assert.equal(a.url,b.url);
  await app.handle(message);assert.equal(calls,1);
  const graded=await app.handle({type:'study.grade',url:a.url,index:0,remembered:true});
  assert.equal(graded.progress[0].step,1);
  assert.equal((await app.handle({type:'study.list'})).length,1);
});
test('network and malformed AI failures do not save a deck and can be retried',async()=>{
  let attempts=0;const app=service(async()=>{
    attempts++;if(attempts===1)throw Error('network');
    return {ok:true,json:async()=>attempts===2?{...deck,questions:[]}:deck};
  });
  const message={type:'study.generate',lesson,consent:true};
  await assert.rejects(app.handle(message),/server/);
  await assert.rejects(app.handle(message),/AI/);
  assert.equal((await app.handle({type:'study.list'})).length,0);
  await app.handle(message);assert.equal((await app.handle({type:'study.list'})).length,1);
});
