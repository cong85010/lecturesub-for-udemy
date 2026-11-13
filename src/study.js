(() => {
  const app=globalThis.CCUdemy, $=selector=>document.querySelector(selector);
  let items=[], current, draft, card=0, mode='questions', busy=false;
  const status=(text,error=false)=>{ $('#status').textContent=text; $('#status').dataset.error=String(error); };
  function library() {
    $('#empty').hidden=items.length>0;
    $('#library').replaceChildren();
    if (draft && !items.some(item=>item.url===draft.url)) {
      const button=document.createElement('button');button.textContent=`${draft.title} · Chưa tạo`;
      button.setAttribute('aria-current',String(!current));button.disabled=busy;
      button.addEventListener('click',()=>{current=undefined;card=0;render();status('');});
      $('#library').append(button);
    }
    for(const item of items) {
      const button=document.createElement('button');button.textContent=item.title;
      button.setAttribute('aria-current',String(item.url===current?.url));
      button.disabled=busy;
      button.addEventListener('click',()=>{current=item;card=0;render();status('');});$('#library').append(button);
    }
  }
  function renderCard() {
    const cards=current.deck.flashcards, value=cards[card];
    $('#counter').textContent=`Thẻ ${card+1} / ${cards.length}`;
    $('#front').textContent=value.front;$('#back-text').textContent=value.back;$('#card-quote').textContent=value.quote;
    $('#back').hidden=true;$('#flip').hidden=false;$('#grading').hidden=true;
    $('#previous').disabled=card===0;$('#next').disabled=card===cards.length-1;
    const progress=current.progress?.[card];
    $('#due-info').textContent=progress?.due>Date.now()?`Ôn lại: ${new Date(progress.due).toLocaleDateString('vi-VN')}`:'Thẻ này đang đến lượt ôn.';
  }
  function render() {
    library();$('#setup').hidden=!!current || !draft;$('#pack').hidden=!current;
    const lesson=current || draft;
    if(!lesson) return;
    $('#title').textContent=lesson.title;$('#course').textContent=lesson.course;
    if(!current) {$('#capture-info').textContent=`Đã đọc ${draft.transcript.length.toLocaleString('vi-VN')} ký tự transcript. Chỉ tạo bộ ôn khi anh sẵn sàng.`;return;}
    $('#source').href=current.url;
    $('#questions').replaceChildren();
    current.deck.questions.forEach((value,index)=>{
      const article=document.createElement('article');article.className='question';
      const heading=document.createElement('h2');heading.textContent=`${index+1}. ${value.question}`;
      const answer=document.createElement('textarea');answer.setAttribute('aria-label',`Câu trả lời của anh cho câu ${index+1}`);answer.placeholder='Thử giải thích bằng lời của anh…';
      const detail=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p'),quote=document.createElement('blockquote');
      summary.textContent='Xem đáp án và dẫn chứng';text.textContent=value.answer;quote.textContent=value.quote;
      detail.append(summary,text,quote);article.append(heading,answer,detail);$('#questions').append(article);
    });
    setMode(mode);renderCard();
  }
  function setMode(value) {
    mode=value;$('#questions').hidden=value!=='questions';$('#cards').hidden=value!=='cards';
    $('#questions-view').setAttribute('aria-pressed',String(value==='questions'));$('#cards-view').setAttribute('aria-pressed',String(value==='cards'));
  }
  $('#questions-view').addEventListener('click',()=>setMode('questions'));
  $('#cards-view').addEventListener('click',()=>setMode('cards'));
  $('#consent').addEventListener('change',()=>{$('#generate').disabled=busy || !$('#consent').checked;});
  $('#generate').addEventListener('click',async()=>{
    if(busy || !draft || !$('#consent').checked) return;
    busy=true;$('#generate').disabled=true;$('#consent').disabled=true;library();status('DeepSeek đang tạo câu hỏi và flashcard…');
    try {
      current=await app.call('study.generate',{lesson:draft,consent:true});
      items=await app.call('study.list');card=0;render();status('Đã lưu bộ ôn trên máy này. Anh có thể ôn lại mà không cần gọi AI.');
    } catch(error) {status(error.message,true);}
    finally {busy=false;$('#generate').disabled=!$('#consent').checked;$('#consent').disabled=false;library();}
  });
  $('#flip').addEventListener('click',()=>{$('#back').hidden=false;$('#flip').hidden=true;$('#grading').hidden=false;});
  $('#previous').addEventListener('click',()=>{if(card>0){card--;renderCard();}});
  $('#next').addEventListener('click',()=>{if(card<current.deck.flashcards.length-1){card++;renderCard();}});
  async function grade(remembered) {
    if(busy) return;
    busy=true;$('#again').disabled=true;$('#remember').disabled=true;$('#previous').disabled=true;$('#next').disabled=true;library();
    try {
      current=await app.call('study.grade',{url:current.url,index:card,remembered});
      items=items.map(item=>item.url===current.url?current:item);
      if(card<current.deck.flashcards.length-1) card++;
      renderCard();status(remembered?'Đã lưu lịch ôn lại.':'Đã đánh dấu cần ôn lại.');
    }catch(error){status(error.message,true);renderCard();}
    finally{busy=false;$('#again').disabled=false;$('#remember').disabled=false;library();}
  }
  $('#again').addEventListener('click',()=>grade(false));$('#remember').addEventListener('click',()=>grade(true));
  (async()=>{
    try {
      items=await app.call('study.list');
      const id=new URL(location.href).searchParams.get('draft');
      if(id) {draft=await app.call('study.getDraft',{id});current=items.find(item=>item.url===draft.url);}
      else current=items[0];
      render();
    }catch(error){library();status(error.message,true);}
  })();
})();
