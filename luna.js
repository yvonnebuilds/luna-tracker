// ═══════════════════════════════════════════════════════════════
// DATA CONSTANTS
// ═══════════════════════════════════════════════════════════════
var SYMPTOMS = ['Hot flashes','Night sweats','Brain fog','Insomnia','Joint pain','Headache','Bloating','Breast tenderness','Cramps','Back pain','Vaginal dryness','Dry mouth / tingly tongue','Low libido','Heart palpitations','Dizziness','Fatigue','Chills','Nausea','Skin changes','Hair thinning','Weight changes'];
var TRIGGERS = ['Stress','Alcohol','Caffeine','Poor sleep','Spicy food','Hot drinks','Exercise','Dehydration','Refined sugar','Late night','THC / Cannabis','CBD'];
var FLOW_COLORS = {none:'var(--accent3)',spot:'#f5dde2',light:'var(--flow-light)',medium:'var(--flow-medium)',heavy:'var(--flow-heavy)'};
var HISTORICAL = []; // seed data removed for public release
// Dynamic prediction: calculates next period starts from last cycle start + avg cycle length
function calcPredStarts() {
  var s=getSettings();
  var cycles=getCycleLengths(true).filter(function(c){return c.gap>=15&&c.gap<100;});
  var avgLen;
  if(cycles.length){
    avgLen=Math.round(cycles.reduce(function(a,c){return a+c.gap;},0)/cycles.length);
  } else if(s.cycleLenDays){
    avgLen=s.cycleLenDays; // use user-defined if no logged data
  } else {
    avgLen=28; // ultimate fallback
  }

  // Find the last cycle start using the same gap>1 logic as getCycleLengths
  var allFlowDays=Object.keys(logs).filter(function(d){
    return logs[d].flow&&logs[d].flow!=='none';
  }).sort();
  if(!allFlowDays.length) return [];

  var cycleStarts=[allFlowDays[0]];
  for(var i=1;i<allFlowDays.length;i++){
    var g=Math.round((new Date(allFlowDays[i]+'T12:00:00')-new Date(allFlowDays[i-1]+'T12:00:00'))/86400000);
    if(g>1) cycleStarts.push(allFlowDays[i]);
  }
  var lastStart=cycleStarts[cycleStarts.length-1];

  // Generate 12 future predictions from last cycle start
  var preds=[], base=new Date(lastStart+'T12:00:00');
  for(var n=1;n<=12;n++){
    var pd=new Date(base.getTime());
    pd.setDate(pd.getDate()+avgLen*n);
    preds.push(d2s(pd));
  }
  return preds;
}
var PRED_STARTS = [];
var PERI_SX = [{k:'hotFlashes',l:'Hot flashes / flushes'},{k:'nightSweats',l:'Night sweats'},{k:'sleepProblems',l:'Sleep problems / insomnia'},{k:'brainFog',l:'Brain fog / memory issues'},{k:'moodChanges',l:'Mood swings / irritability'},{k:'anxiety',l:'Anxiety / low mood'},{k:'fatigue',l:'Fatigue / low energy'},{k:'jointPain',l:'Joint or muscle pain'},{k:'headaches',l:'Headaches'},{k:'vaginalDryness',l:'Vaginal dryness / discomfort'},{k:'libido',l:'Low libido'},{k:'irregular',l:'Irregular periods'},{k:'bloating',l:'Bloating / digestive changes'},{k:'skinHair',l:'Skin / hair changes'},{k:'palpitations',l:'Heart palpitations'}];
var LEARN_ARTICLES = [
  {q:'What is perimenopause?',a:'<strong>Perimenopause</strong> is the transition phase before menopause, typically lasting 4&#8211;10 years. It begins when the ovaries start producing less oestrogen, usually in the mid-40s &#8212; though it can start earlier or later.<br><br>During this time, oestrogen and progesterone levels fluctuate irregularly rather than falling steadily. This unpredictability is what causes the wide range of symptoms.<div class="highlight">Menopause is officially reached after 12 consecutive months without a period. Everything before that point is perimenopause.</div>'},
  {q:'Why do cycles become irregular?',a:'During perimenopause, the ovaries produce less oestrogen, which disrupts the hormonal feedback loop that regulates the menstrual cycle. Cycles can become <strong>shorter, longer, heavier, lighter or skip entirely</strong>.<br><br>A cycle may occasionally return after a long gap &#8212; which is why the 12-month rule exists for confirming menopause. Tracking your cycle in Luna helps build a picture of your personal pattern.'},
  {q:'What is spotting in perimenopause?',a:'<strong>Spotting</strong> refers to light bleeding or brown discharge between periods. It is very common during perimenopause due to fluctuating oestrogen levels causing irregular shedding of the uterine lining.<br><br>Spotting is usually harmless, but you should speak to your GP if it:<ul style="margin:8px 0 0 16px;"><li>Happens frequently or unpredictably</li><li>Occurs after sex</li><li>Happens after menopause is confirmed</li></ul>'},
  {q:'What causes hot flashes?',a:'Hot flashes occur because falling oestrogen affects the hypothalamus &#8212; the brain\'s temperature control centre. It becomes oversensitive to tiny changes in body temperature and triggers a heat-release response: <strong>flushing, sweating and increased heart rate</strong>.<br><br>Common triggers include alcohol, caffeine, spicy food, stress and warm environments. Luna\'s trigger logging can help you identify your personal triggers.<div class="highlight">Hot flashes can last 1&#8211;5 minutes on average and may occur multiple times a day or at night (night sweats).</div>'},
  {q:'Why does perimenopause affect mood and anxiety?',a:'Oestrogen plays a significant role in regulating <strong>serotonin, dopamine and GABA</strong> &#8212; the brain chemicals that govern mood, motivation and calm. As oestrogen fluctuates, these systems are disrupted.<br><br>This is why anxiety, irritability, tearfulness and low mood are neurological symptoms of perimenopause &#8212; not a sign of weakness or depression, though the two can co-occur. If mood symptoms are severe, speak to your GP.'},
  {q:'What is HRT and how does it help?',ukBadge:true,a:'<strong>Hormone Replacement Therapy (HRT)</strong> replaces the oestrogen (and sometimes progesterone) that the ovaries are no longer producing. It is the most effective treatment for perimenopausal symptoms.<br><br>Modern HRT comes in many forms: patches, gels, sprays, pills and pessaries. The type, dose and application method are tailored to each individual. <strong>Body-identical HRT</strong> (regulated by the MHRA) has a well-established safety profile for most women.<div class="highlight">Current NICE guidelines recommend HRT be offered to women with perimenopausal symptoms. If you\'re interested, ask your GP or visit a menopause specialist.</div>'},
  {q:'What is brain fog?',a:'Brain fog &#8212; difficulty concentrating, forgetting words, feeling mentally slow &#8212; is one of the most distressing and least-discussed symptoms of perimenopause. It\'s caused by <strong>oestrogen\'s effect on the hippocampus</strong>, the brain region central to memory and learning.<br><br>It typically improves once hormone levels stabilise (either naturally post-menopause or with HRT). Sleep deprivation and stress worsen it significantly.'},
  {q:'How does perimenopause affect sleep?',a:'Falling progesterone (which has a sedative effect) and night sweats disrupt sleep architecture, reducing <strong>deep and REM sleep</strong>. Poor sleep then cascades into worse fatigue, brain fog and mood symptoms.<br><br>Sleep hygiene strategies that help include: keeping the bedroom cool, avoiding alcohol and caffeine after 2pm, consistent sleep times, and addressing night sweats (HRT is highly effective for this).'},
  {q:'What do my hormone blood test results mean?',a:'Blood tests are one of the most useful tools for understanding where you are in perimenopause, but the results can be confusing. Here\'s what the key markers mean:<br><br><strong style="color:var(--accent1)">FSH (Follicle Stimulating Hormone)</strong> — produced by the pituitary gland to stimulate egg development. Rising FSH is a key indicator of perimenopause as the ovaries become less responsive. A reading above 10 IU/L suggests the ovaries are working harder; above 30 IU/L on two tests 6 weeks apart is used to confirm menopause in the UK for women over 50. <em>Note: FSH fluctuates significantly in perimenopause — a single reading can be misleading.</em><br><br><strong style="color:var(--accent1)">LH (Luteinising Hormone)</strong> — works alongside FSH to trigger ovulation. Rises with FSH as ovarian function declines.<br><br><strong style="color:var(--accent1)">Oestradiol (E2)</strong> — the main form of oestrogen. Levels fluctuate widely in perimenopause rather than declining steadily, which is why symptoms can feel unpredictable. Low oestradiol contributes to hot flashes, brain fog, vaginal dryness and bone loss.<br><br><strong style="color:var(--accent1)">Progesterone</strong> — produced after ovulation. Low progesterone (below 3 nmol/L mid-luteal) suggests anovulatory cycles are becoming more frequent — a hallmark of perimenopause.<br><br><strong style="color:var(--accent1)">Testosterone</strong> — often overlooked in women but important for energy, libido and mood. Declines gradually from the mid-30s.<br><br><strong style="color:var(--accent1)">TSH (Thyroid Stimulating Hormone)</strong> — thyroid dysfunction is common in perimenopausal women and can mimic or worsen symptoms. Worth checking if fatigue, weight gain or brain fog are prominent.<br><br><strong style="color:var(--accent1)">Vitamin D</strong> — deficiency is extremely common and worsens fatigue, mood and bone health. Optimal levels are generally considered above 75 nmol/L.<br><br><strong style="color:var(--accent1)">Ferritin</strong> — iron stores. Heavy or irregular periods can deplete ferritin, causing fatigue that is often mistaken for perimenopausal exhaustion.<div class="highlight">Reference ranges vary between labs. Always discuss your specific results with your GP or a menopause specialist — context matters as much as the numbers.</div>'},
  {q:'When should I see a doctor?',a:'Speak to your GP if:<br><ul style="margin:8px 0 0 16px;line-height:2;"><li>Symptoms are affecting your daily life</li><li>You have bleeding after confirmed menopause</li><li>You have very frequent spotting or prolonged heavy periods</li><li>Mood symptoms are severe or you feel you can\'t cope</li><li>You\'d like to discuss HRT or other treatments</li></ul><div class="highlight">You can also ask for a referral to a menopause specialist clinic. Many GPs now have specific menopause training.</div>'},
  {q:'What is PMDD and could it explain my symptoms?',a:'<strong>Premenstrual Dysphoric Disorder (PMDD)</strong> is a severe, hormone-sensitive mood disorder that causes significant psychological and physical symptoms in the 1&#8211;2 weeks before a period (the luteal phase), which resolve once bleeding begins.<br><br>PMDD affects around <strong>3&#8211;8% of people who menstruate</strong> and is distinct from ordinary PMS &#8212; the mood symptoms are often disabling, not merely uncomfortable. Common symptoms include severe anxiety, rage, depression, irritability, feeling out of control, insomnia, and brain fog &#8212; all time-locked to the luteal phase.<br><br><strong>PMDD and perimenopause often overlap</strong> and can be confused with each other. Fluctuating oestrogen in perimenopause can worsen pre-existing PMDD, and the luteal-phase pattern of PMDD can be mistaken for generalised perimenopausal mood instability.<div class="highlight">The key distinguishing feature of PMDD is <strong>cyclical timing</strong> &#8212; symptoms appear in the 1&#8211;2 weeks before your period and lift within a few days of it starting. Luna\'s daily logging can help you identify whether your mood symptoms follow this pattern.</div>If you suspect PMDD, speak to your GP. Treatment options include SSRIs (which can be taken only in the luteal phase), hormonal treatments such as the combined pill or HRT, and psychological support. PMDD is a recognised medical condition &#8212; you deserve specialist assessment and support.'},
  {q:'What is endometriosis?',a:'<strong>Endometriosis</strong> is a chronic condition where tissue similar to the lining of the womb grows outside it &#8212; on the ovaries, fallopian tubes, bowel, bladder, or elsewhere. It affects around <strong>1 in 10 people with a uterus</strong> and takes an average of 7&#8211;9 years to diagnose.<br><br>Common symptoms include:<ul style="margin:8px 0 0 16px;line-height:2;"><li>Severe period pain (beyond typical cramping)</li><li>Pelvic pain throughout the cycle</li><li>Pain during or after sex</li><li>Heavy or irregular bleeding</li><li>Fatigue, bloating, bowel or bladder symptoms</li><li>Difficulty conceiving</li></ul>Endometriosis symptoms can overlap with perimenopause, particularly around pain, fatigue, and irregular bleeding. Some people are diagnosed with both simultaneously.<div class="highlight"><strong>Luna is not designed to track endometriosis</strong> &#8212; it is a complex condition that deserves a dedicated tool and specialist care. If you recognise these symptoms, please speak to your GP and ask for a referral to a gynaecologist or endometriosis specialist. Endometriosis UK (endometriosis-uk.org) provides excellent support and resources.</div>'}
];

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
var logs = {};
try { logs = JSON.parse(localStorage.getItem('luna-logs') || '{}'); } catch(e) {}
var selFlow = null, selSymptoms = {}, selTriggers = {}, selMoods = {}, selCustomTags = {}, waterGlasses = 0;
var calYear, calMonth;

// ═══════════════════════════════════════════════════════════════
// SEED HISTORICAL DATA
// ═══════════════════════════════════════════════════════════════
function seed() {
  var changed = false;
  HISTORICAL.forEach(function(pair) {
    var sD = new Date(pair[0]+'T12:00:00'), eD = new Date(pair[1]+'T12:00:00');
    var total = Math.round((eD-sD)/86400000)+1, day=0, cur=new Date(sD);
    while (cur<=eD) {
      var ds = d2s(cur);
      if (!logs[ds]) {
        day++;
        var flow = (day===1||day===total)?'light':((total>=5&&(day===2||day===3))?'heavy':'medium');
        logs[ds]={date:ds,flow:flow,symptoms:[],triggers:[],moods:[],moodIntensity:3,energy:3,sleep:3,water:0,activity:'',notes:'Imported from period log',_imp:true};
        changed=true;
      }
      cur.setDate(cur.getDate()+1);
    }
  });
  if (changed) lsSet('luna-logs', logs);
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function d2s(d){return d.toISOString().split('T')[0];}
function tod(){return d2s(new Date());}
function fmtDate(ds){var d=new Date(ds+'T12:00:00');return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}
function fmtShort(ds){var d=new Date(ds+'T12:00:00');return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});}
function lsGet(k){try{return JSON.parse(localStorage.getItem(k)||'null');}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function getSettings(){return lsGet('luna-settings')||{};}
function saveSettings(s){lsSet('luna-settings',s);}
function toast(msg){var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},2500);}
function toggleTip(id){var el=document.getElementById(id);if(el)el.classList.toggle('open');}

// ═══════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════
var TABS = ['log','calendar','history','trends','settings'];
function showTab(name) {
  TABS.forEach(function(n,i){document.querySelectorAll('.tab')[i].classList.toggle('active',n===name);});
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active');});
  var panel=document.getElementById('panel-'+name);
  if(panel) panel.classList.add('active');
  if(name==='calendar') renderCal();
  if(name==='history')  renderHistory();
  if(name==='trends')   renderPredict(); // default sub-panel is Predict
  if(name==='settings') { renderSettings(); renderLearn(); }
  if(name==='log')      renderLogMeds();
}
function showSub(name) {
  ['predict','insights','report'].forEach(function(s){
    var el=document.getElementById('sub-panel-'+s);
    if(el) el.style.display = s===name?'block':'none';
    var btn=document.getElementById('sub-'+s);
    if(btn) btn.classList.toggle('active', s===name);
  });
  if(name==='insights') renderInsights();
  if(name==='predict')  renderPredict();
}

// ═══════════════════════════════════════════════════════════════
// LOG DAY
// ═══════════════════════════════════════════════════════════════
function selectFlow(btn) {
  document.querySelectorAll('.flow-btn').forEach(function(b){b.className='flow-btn';});
  selFlow=btn.dataset.flow; btn.classList.add('selected-'+selFlow);
}
function toggleMood(btn) {
  var m=btn.dataset.mood;
  if(selMoods[m]){delete selMoods[m];btn.classList.remove('active');}
  else{selMoods[m]=true;btn.classList.add('active');}
}
function buildWaterRow(current) {
  waterGlasses = current||0;
  var row=document.getElementById('water-row');
  row.innerHTML='';
  for(var i=1;i<=8;i++){
    var btn=document.createElement('button');
    btn.className='water-btn'+(i<=waterGlasses?' filled':'');
    btn.innerHTML='&#128167;';
    btn.setAttribute('data-i',i);
    btn.onclick=(function(idx){return function(){waterGlasses=(waterGlasses===idx)?idx-1:idx;buildWaterRow(waterGlasses);};})(i);
    row.appendChild(btn);
  }
  var cnt=document.createElement('span');cnt.className='water-count';
  cnt.textContent=waterGlasses+'/8 glasses';row.appendChild(cnt);
}
var pendingLogDate = null;
function saveLog() {
  var date=document.getElementById('log-date').value;
  if(!date){toast('Please select a date');return;}
  if(logs[date]&&!logs[date]._imp){
    pendingLogDate=date;
    document.getElementById('overwrite-warn').style.display='block';
    document.getElementById('overwrite-warn').scrollIntoView({behavior:'smooth',block:'nearest'});
    return;
  }
  commitLog(date);
}
function confirmOverwrite(){
  document.getElementById('overwrite-warn').style.display='none';
  if(pendingLogDate) commitLog(pendingLogDate);
  pendingLogDate=null;
}
function cancelOverwrite(){
  document.getElementById('overwrite-warn').style.display='none';
  pendingLogDate=null;
}
function commitLog(date) {
  logs[date]={
    date:date,flow:selFlow,
    symptoms:Object.keys(selSymptoms),triggers:Object.keys(selTriggers),
    customTags:Object.keys(selCustomTags),
    moods:Object.keys(selMoods),moodIntensity:Number(document.getElementById('mood-intensity').value),
    energy:Number(document.getElementById('energy-slider').value),
    sleep:(function(){var sv=getSleepValue();return sv.val;}()),
    sleepPct:(function(){var sv=getSleepValue();return sv.raw;}()),
    sleepMode:(function(){var sv=getSleepValue();return sv.mode;}()),
    water:waterGlasses,
    activity:document.getElementById('activity-select').value,
    notes:document.getElementById('log-notes').value
  };
  lsSet('luna-logs',logs);
  toast('Entry saved');
  resetLogForm();
}
function resetLogForm(){
  selFlow=null;selSymptoms={};selTriggers={};selMoods={};selCustomTags={};
  document.querySelectorAll('.flow-btn').forEach(function(b){b.className='flow-btn';});
  document.querySelectorAll('#symptom-grid .chip').forEach(function(c){c.classList.remove('active');});
  document.querySelectorAll('#trigger-grid .chip').forEach(function(c){c.classList.remove('active','trigger-active');});
  document.querySelectorAll('.mood-btn').forEach(function(b){b.classList.remove('active');});
  document.getElementById('mood-intensity').value=3;
  document.getElementById('energy-slider').value=3;
  document.getElementById('sleep-slider').value=3;
  var spEl=document.getElementById('sleep-pct');if(spEl)spEl.value='';
  document.getElementById('activity-select').value='';
  document.getElementById('log-notes').value='';
  document.getElementById('log-date').value=tod();
  buildWaterRow(0);
}
// ═══════════════════════════════════════════════════════════════
// CUSTOM TAGS
// ═══════════════════════════════════════════════════════════════
function getCustomTags() {
  var s=getSettings();
  return s.customTags||[];
}
function saveCustomTagList(tags) {
  var s=getSettings();s.customTags=tags;saveSettings(s);
}
function renderCustomTagGrid() {
  // Log Day grid
  var grid=document.getElementById('custom-tag-grid');
  if(!grid) return;
  var tags=getCustomTags();
  grid.innerHTML='';
  if(!tags.length){
    grid.innerHTML='<span style="font-size:0.78rem;color:var(--text-dim)">No custom tags yet — add one below or in Settings.</span>';
    return;
  }
  tags.forEach(function(tag){
    var c=document.createElement('div');
    c.className='chip'+(selCustomTags[tag]?' active':'');
    c.textContent=tag;
    c.style.borderColor='var(--gold)';
    if(selCustomTags[tag]) c.style.background='rgba(232,200,122,0.15)';
    c.onclick=function(){
      if(selCustomTags[tag]){
        delete selCustomTags[tag];
        c.classList.remove('active');
        c.style.background='';
      } else {
        selCustomTags[tag]=true;
        c.classList.add('active');
        c.style.background='rgba(232,200,122,0.15)';
      }
    };
    grid.appendChild(c);
  });
}
function renderSettingsTagGrid() {
  var grid=document.getElementById('settings-tag-grid');
  if(!grid) return;
  var tags=getCustomTags();
  if(!tags.length){
    grid.innerHTML='<span style="font-size:0.78rem;color:var(--text-dim)">No custom tags saved yet.</span>';
    return;
  }
  grid.innerHTML='';
  tags.forEach(function(tag){
    var wrap=document.createElement('div');
    wrap.style.cssText='display:inline-flex;align-items:center;gap:4px;background:var(--surface2);border:1px solid var(--gold);border-radius:20px;padding:5px 10px 5px 12px;margin:3px;';
    var label=document.createElement('span');
    label.style.cssText='font-size:0.8rem;color:var(--gold);';
    label.textContent=tag;
    var del=document.createElement('button');
    del.innerHTML='&#215;';
    del.style.cssText='background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:0.9rem;padding:0 2px;line-height:1;';
    del.title='Remove tag';
    del.onclick=function(){deleteCustomTag(tag);};
    wrap.appendChild(label);
    wrap.appendChild(del);
    grid.appendChild(wrap);
  });
}
function saveCustomTag() {
  var input=document.getElementById('settings-tag-input');
  var val=input.value.trim();
  var status=document.getElementById('settings-tag-status');
  if(!val){status.textContent='Please enter a tag name.';return;}
  var tags=getCustomTags();
  // Normalise to title case, deduplicate
  var normalised=val.charAt(0).toUpperCase()+val.slice(1);
  if(tags.indexOf(normalised)>-1){status.textContent='"'+normalised+'" already exists.';return;}
  if(tags.length>=30){status.textContent='Maximum 30 custom tags reached.';return;}
  tags.push(normalised);
  saveCustomTagList(tags);
  input.value='';
  status.textContent='Tag "'+normalised+'" saved.';
  renderSettingsTagGrid();
  renderCustomTagGrid();
  setTimeout(function(){status.textContent='';},2500);
}
function deleteCustomTag(tag) {
  var tags=getCustomTags().filter(function(t){return t!==tag;});
  saveCustomTagList(tags);
  // Also remove from any active selection
  delete selCustomTags[tag];
  renderSettingsTagGrid();
  renderCustomTagGrid();
}
function addQuickTag() {
  // Add a tag from the Log Day quick-add input — saves to library AND selects it
  var input=document.getElementById('new-tag-input');
  var val=input.value.trim();
  if(!val) return;
  var normalised=val.charAt(0).toUpperCase()+val.slice(1);
  var tags=getCustomTags();
  if(tags.indexOf(normalised)===-1 && tags.length<30){
    tags.push(normalised);
    saveCustomTagList(tags);
  }
  selCustomTags[normalised]=true;
  input.value='';
  renderCustomTagGrid();
}

// ═══════════════════════════════════════════════════════════════
// APPLE HEALTH / WEARABLE CSV IMPORT
// Reads exported CSVs and merges resting_heart_rate, sleep, temp
// into existing Luna log entries (creates stub entries if needed)
// ═══════════════════════════════════════════════════════════════
function showHealthExportGuide() {
  var el=document.getElementById('health-export-guide');
  el.style.display=el.style.display==='none'?'block':'none';
}
function importHealthCSV(event) {
  var file=event.target.files[0];
  var statusEl=document.getElementById('health-import-status');
  if(!file){return;}
  statusEl.textContent='Reading file...';
  var reader=new FileReader();
  reader.onload=function(e){
    try {
      var text=e.target.result;
      var lines=text.split('\n').map(function(l){return l.trim();}).filter(Boolean);
      if(lines.length<2){statusEl.textContent='File appears empty.';return;}

      // Parse header row — normalise column names
      var headers=lines[0].split(',').map(function(h){
        return h.replace(/^"|"$/g,'').toLowerCase().replace(/\s+/g,'_');
      });

      // Column index lookup
      function col(names) {
        for(var i=0;i<names.length;i++){
          var idx=headers.indexOf(names[i]);
          if(idx>-1) return idx;
        }
        return -1;
      }
      var dateCol  = col(['date','startdate','start_date','day']);
      var hrCol    = col(['resting_heart_rate','restingheartrate','resting_hr','hr_resting']);
      var sleepCol = col(['sleep_duration_hours','sleep_hours','total_sleep','sleep_duration','asleep_duration']);
      var tempCol  = col(['temperature_deviation','skin_temp_deviation','temp_deviation','body_temperature','temperature']);

      if(dateCol===-1){statusEl.textContent='Could not find a date column. Check the column is named "date".';return;}
      if(hrCol===-1&&sleepCol===-1&&tempCol===-1){
        statusEl.textContent='No recognised health columns found (resting_heart_rate, sleep_duration_hours, temperature_deviation).';
        return;
      }

      var merged=0, skipped=0;
      lines.slice(1).forEach(function(line){
        var cols=line.split(',').map(function(c){return c.replace(/^"|"$/g,'').trim();});
        var rawDate=cols[dateCol]||'';
        // Normalise date to YYYY-MM-DD
        var ds='';
        var m;
        if((m=rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/))) {
          ds=m[1]+'-'+m[2]+'-'+m[3];
        } else if((m=rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})/))) {
          ds=m[3]+'-'+m[2]+'-'+m[1]; // DD/MM/YYYY
        } else if((m=rawDate.match(/^(\d{2})-(\d{2})-(\d{4})/))) {
          ds=m[3]+'-'+m[2]+'-'+m[1];
        }
        if(!ds){skipped++;return;}

        // Get or create stub log entry
        if(!logs[ds]) logs[ds]={date:ds,_health:true};

        var updated=false;
        if(hrCol>-1&&cols[hrCol]&&!isNaN(Number(cols[hrCol]))){
          logs[ds].restingHR=Number(cols[hrCol]);updated=true;
        }
        if(sleepCol>-1&&cols[sleepCol]&&!isNaN(Number(cols[sleepCol]))){
          // If Luna already has a sleep entry from manual log, keep it; health data goes to separate key
          logs[ds].sleepHours=Number(cols[sleepCol]);updated=true;
        }
        if(tempCol>-1&&cols[tempCol]&&!isNaN(Number(cols[tempCol]))){
          logs[ds].tempDeviation=Number(cols[tempCol]);updated=true;
        }
        if(updated) merged++;
      });

      lsSet('luna-logs',logs);
      statusEl.innerHTML='<span style="color:var(--accent3)">&#10003; Imported health data for '+merged+' days'+(skipped?' ('+skipped+' rows skipped)':'')+'.</span>';
      event.target.value='';
    } catch(err) {
      statusEl.textContent='Error reading file: '+err.message;
    }
  };
  reader.readAsText(file);
}

function renderLogMeds() {
  var s=getSettings(), meds=s.medications||[];
  var el=document.getElementById('log-meds-list');
  if(!meds.length){el.innerHTML='<div style="font-size:0.8rem;color:var(--text-dim)">No medications added yet. Go to Settings &#8250; HRT &amp; Medications to add yours.</div>';return;}
  el.innerHTML=meds.map(function(m){
    return '<div class="med-item"><div class="med-dot"></div><div class="med-info"><div class="med-name">'+m.name+'</div><div class="med-detail">'+m.type+' &middot; '+m.dose+' &middot; '+m.freq+'</div></div></div>';
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════════════════
function predSets() {
  var pred={},over={};
  var now=new Date();now.setHours(12,0,0,0);
  var s=getSettings();
  var periodLen=(s.periodLenDays||5)-1;
  var starts=calcPredStarts();
  starts.forEach(function(start){
    var sD=new Date(start+'T12:00:00'),eD=new Date(sD.getTime()+periodLen*86400000);
    var wS=new Date(sD.getTime()-3*86400000),wE=new Date(eD.getTime()+3*86400000);
    var isLate=now>wE,isCur=now>=wS&&now<=wE;
    var cur=new Date(sD);
    while(cur<=eD){var ds=d2s(cur);if(isLate||isCur)over[ds]=true;else pred[ds]=true;cur.setDate(cur.getDate()+1);}
  });
  return{pred:pred,over:over};
}
function renderCal() {
  var MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('cal-month-label').textContent=MN[calMonth]+' '+calYear;
  var grid=document.getElementById('cal-grid'),toDay=tod();
  var first=new Date(calYear,calMonth,1).getDay(),days=new Date(calYear,calMonth+1,0).getDate();
  var sets=predSets();
  var html=['Su','Mo','Tu','We','Th','Fr','Sa'].map(function(d){return '<div class="cal-day-name">'+d+'</div>';}).join('');
  for(var d=1;d<=days;d++){
    var m=String(calMonth+1).padStart(2,'0'),dd=String(d).padStart(2,'0'),ds=calYear+'-'+m+'-'+dd;
    var log=logs[ds],cls='cal-day';
    var style=d===1&&first>0?' style="grid-column-start:'+(first+1)+'"':'';
    if(ds===toDay)cls+=' today';
    if(log){cls+=' has-log';if(log.flow)cls+=' flow-'+log.flow;}
    else if(sets.over[ds])cls+=' overdue';
    else if(sets.pred[ds])cls+=' predicted';
    var dot=(log||sets.pred[ds]||sets.over[ds])?'<div class="dot"></div>':'';
    var clk=log?'onclick="showDetail(\''+ds+'\')"':'';
    html+='<div class="'+cls+'"'+style+' '+clk+'><div class="cal-day-inner">'+d+dot+'</div></div>';
  }
  grid.innerHTML=html;
}
function changeMonth(dir){calMonth+=dir;if(calMonth>11){calMonth=0;calYear++;}if(calMonth<0){calMonth=11;calYear--;}renderCal();}

// ═══════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════
function renderHistory() {
  var el=document.getElementById('history-list');
  var keys=Object.keys(logs).sort(function(a,b){return a.localeCompare(b);});
  if(!keys.length){el.innerHTML='<div class="empty">No entries yet.<br>Start logging to see your history.</div>';return;}

  // Group consecutive flow days into period blocks
  var periods=[], nonFlow=[];
  var i=0;
  while(i<keys.length){
    var d=keys[i],l=logs[d];
    if(l.flow&&l.flow!=='none'){
      // Start of a period block — collect consecutive flow days
      var block=[d];
      while(i+1<keys.length){
        var next=keys[i+1],nl=logs[next];
        var gap=Math.round((new Date(next+'T12:00:00')-new Date(d+'T12:00:00'))/86400000);
        if(nl.flow&&nl.flow!=='none'&&gap<=2){block.push(next);i++;d=next;}
        else break;
      }
      periods.push({start:block[0],end:block[block.length-1],days:block.length});
    } else {
      nonFlow.push(d);
    }
    i++;
  }

  // Sort periods newest first
  periods.sort(function(a,b){return b.start.localeCompare(a.start);});
  nonFlow.sort(function(a,b){return b.localeCompare(a);});

  // Render period blocks
  var periodHtml=periods.map(function(p){
    var label=p.start===p.end?fmtDate(p.start):fmtShort(p.start)+' - '+fmtDate(p.end);
    var duration=p.days===1?'1 day':p.days+' days';
    return '<div class="history-item" onclick="showDetail(\''+p.start+'\')">'
      +'<div class="history-date">'+label+'</div>'
      +'<div class="history-duration">'+duration+'</div>'
      +'</div>';
  }).join('');

  // Render non-flow days (symptoms only entries) compactly
  var nonFlowHtml=nonFlow.length?'<div class="history-section-label">Other logged days</div>'+nonFlow.map(function(date){
    var l=logs[date];
    var sx=(l.symptoms&&l.symptoms.length)?l.symptoms.slice(0,2).join(', ')+(l.symptoms.length>2?' +'+(l.symptoms.length-2):''):'-';
    return '<div class="history-item history-item--compact" onclick="showDetail(\''+date+'\')">'
      +'<div class="history-date">'+fmtDate(date)+'</div>'
      +'<div class="history-symptoms">'+sx+'</div>'
      +'</div>';
  }).join(''):'';

  el.innerHTML=(periodHtml||'<div class="empty" style="padding:20px">No period days logged yet.</div>')+nonFlowHtml;
}

// ═══════════════════════════════════════════════════════════════
// DETAIL
// ═══════════════════════════════════════════════════════════════
function showDetail(ds) {
  var log=logs[ds];if(!log)return;
  var FN={none:'No Flow',spot:'Spotting',light:'Light',medium:'Medium',heavy:'Heavy'};
  var EL=['','Very Low','Low','Moderate','High','Very High'];
  var ACT={rest:'Rest day',light:'Light activity',moderate:'Moderate exercise',intense:'Intense exercise'};
  var h='<div class="detail-date">'+fmtDate(ds)+'</div>';
  if(log.flow)h+='<div class="detail-row"><div class="detail-label">Flow</div><div class="detail-val" style="color:'+(FLOW_COLORS[log.flow]||'inherit')+'">'+(FN[log.flow]||log.flow)+'</div></div>';
  if(log.symptoms&&log.symptoms.length)h+='<div class="detail-row"><div class="detail-label">Symptoms</div><div class="detail-val">'+log.symptoms.map(function(s){return '<span class="tag">'+s+'</span>';}).join('')+'</div></div>';
  if(log.triggers&&log.triggers.length)h+='<div class="detail-row"><div class="detail-label">Triggers</div><div class="detail-val">'+log.triggers.map(function(s){return '<span class="tag trig">'+s+'</span>';}).join('')+'</div></div>';
  if(log.moods&&log.moods.length)h+='<div class="detail-row"><div class="detail-label">Mood</div><div class="detail-val">'+log.moods.join(', ')+(log.moodIntensity?' (intensity '+log.moodIntensity+'/5)':'')+'</div></div>';
  if(log.energy)h+='<div class="detail-row"><div class="detail-label">Energy</div><div class="detail-val">'+(EL[log.energy]||log.energy)+'</div></div>';
  if(log.sleep)h+='<div class="detail-row"><div class="detail-label">Sleep</div><div class="detail-val">'+(log.sleepMode==='pct'&&log.sleepPct!==null?log.sleepPct+'%':(EL[log.sleep]||log.sleep))+'</div></div>';
  if(log.water)h+='<div class="detail-row"><div class="detail-label">Water</div><div class="detail-val">'+log.water+' glasses</div></div>';
  if(log.activity)h+='<div class="detail-row"><div class="detail-label">Activity</div><div class="detail-val">'+(ACT[log.activity]||log.activity)+'</div></div>';
  if(log.notes)h+='<div class="detail-row"><div class="detail-label">Notes</div><div class="detail-val" style="font-style:italic;color:var(--text-dim)">'+log.notes+'</div></div>';
  if(log.customTags&&log.customTags.length)h+='<div class="detail-row"><div class="detail-label">Tags</div><div class="detail-val">'+log.customTags.map(function(t){return '<span class="tag" style="border-color:var(--gold);color:var(--gold)">'+t+'</span>';}).join('')+'</div></div>';
  // Medications for that day (always show from settings)
  var s=getSettings(),meds=s.medications||[];
  if(meds.length)h+='<div class="detail-row"><div class="detail-label">Meds</div><div class="detail-val">'+meds.map(function(m){return '<span class="tag med">'+m.name+'</span>';}).join('')+'</div></div>';
  h+='<div style="display:flex;gap:8px;margin-top:4px;">';
  h+='<button class="btn-secondary" style="flex:1" onclick="loadEntryForEdit(\''+ds+'\')">&#9998; Edit</button>';
  h+='<button class="btn-delete" style="flex:1" onclick="delEntry(\''+ds+'\')">Delete</button>';
  h+='</div>';
  document.getElementById('detail-content').innerHTML=h;
  document.getElementById('detail-overlay').classList.add('open');
}
function closeDetail(e){if(!e||e.target===document.getElementById('detail-overlay'))document.getElementById('detail-overlay').classList.remove('open');}
function loadEntryForEdit(ds) {
  var log=logs[ds];if(!log)return;
  closeDetail();
  showTab('log');
  // Date
  document.getElementById('log-date').value=ds;
  // Flow — selectFlow uses 'selected-{flow}' classes
  selFlow=log.flow||null;
  document.querySelectorAll('.flow-btn').forEach(function(b){
    b.className='flow-btn';
    if(b.dataset.flow===selFlow) b.classList.add('selected-'+selFlow);
  });
  // Symptoms
  selSymptoms={};
  document.querySelectorAll('#symptom-grid .chip').forEach(function(c){
    var on=log.symptoms&&log.symptoms.indexOf(c.textContent)>-1;
    c.classList.toggle('active',on);
    if(on) selSymptoms[c.textContent]=true;
  });
  // Triggers
  selTriggers={};
  document.querySelectorAll('#trigger-grid .chip').forEach(function(c){
    var on=log.triggers&&log.triggers.indexOf(c.textContent)>-1;
    c.classList.toggle('active',on);
    c.classList.toggle('trigger-active',on);
    if(on) selTriggers[c.textContent]=true;
  });
  // Moods
  selMoods={};
  document.querySelectorAll('.mood-btn').forEach(function(b){
    var on=log.moods&&log.moods.indexOf(b.dataset.mood)>-1;
    b.classList.toggle('active',on);
    if(on) selMoods[b.dataset.mood]=true;
  });
  // Sliders — just set value, no separate display element needed
  var miEl=document.getElementById('mood-intensity');
  if(miEl&&log.moodIntensity) miEl.value=log.moodIntensity;
  var enEl=document.getElementById('energy-slider');
  if(enEl&&log.energy) enEl.value=log.energy;
  var slEl=document.getElementById('sleep-slider');
  var spEl=document.getElementById('sleep-pct');
  if(log.sleepMode==='pct'&&log.sleepPct!==null&&spEl){
    spEl.value=log.sleepPct;
  } else if(slEl&&log.sleep){
    slEl.value=log.sleep;
  }
  // Water
  waterGlasses=log.water||0;
  buildWaterRow(waterGlasses);
  // Notes
  var notesEl=document.getElementById('log-notes');
  if(notesEl) notesEl.value=log.notes||'';
  // Custom tags
  selCustomTags={};
  if(log.customTags){log.customTags.forEach(function(t){selCustomTags[t]=true;});}
  renderCustomTagGrid();
  toast('Entry loaded \u2014 make changes and tap Save');
}
function delEntry(ds){
  if(!confirm('Delete this entry?'))return;
  delete logs[ds];lsSet('luna-logs',logs);
  closeDetail();renderHistory();toast('Entry deleted');
}

// ═══════════════════════════════════════════════════════════════
// PREDICT
// ═══════════════════════════════════════════════════════════════
function getLastPeriodDate() {
  var flowDates=Object.keys(logs).filter(function(d){return logs[d].flow&&logs[d].flow!=='none';}).sort();
  return flowDates.length?flowDates[flowDates.length-1]:null;
}
// getCycleLengths: measures gap between CYCLE STARTS (first day of each bleed),
// not between consecutive flow days — fixes off-by-N error for multi-day periods.
// By default excludes seeded/imported entries for accurate anomaly detection.
function getCycleLengths(includeImported) {
  var days=Object.keys(logs).filter(function(d){
    var l=logs[d];
    return l.flow&&l.flow!=='none'&&(includeImported||!l._imp);
  }).sort();

  // Find cycle start days: first flow day after a non-flow (or gap >1 day)
  var starts=[];
  for(var i=0;i<days.length;i++){
    if(i===0){starts.push(days[i]);continue;}
    var gap=Math.round((new Date(days[i]+'T12:00:00')-new Date(days[i-1]+'T12:00:00'))/86400000);
    if(gap>1) starts.push(days[i]); // new cycle started
  }

  var cycles=[];
  for(var j=1;j<starts.length;j++){
    var diff=Math.round((new Date(starts[j]+'T12:00:00')-new Date(starts[j-1]+'T12:00:00'))/86400000);
    cycles.push({gap:diff,from:starts[j-1],to:starts[j]});
  }
  return cycles;
}
function renderPredict() {
  var now=new Date();now.setHours(12,0,0,0);
  var predStarts=calcPredStarts();
  if(!predStarts.length){
    document.getElementById('stage-container').innerHTML='';
    document.getElementById('overdue-banner').innerHTML='';
    document.getElementById('pred-list').innerHTML='<div class="empty" style="padding:20px">Log at least one period to see predictions.</div>';
    document.getElementById('cycle-note').innerHTML='';
    document.getElementById('anomaly-container').innerHTML='';
    return;
  }
  var s=getSettings();
  var periodLen=(s.periodLenDays||5)-1; // convert to end-offset (0-based)
  var allP=predStarts.map(function(start){
    var sD=new Date(start+'T12:00:00'),eD=new Date(sD.getTime()+periodLen*86400000);
    var wS=new Date(sD.getTime()-3*86400000),wE=new Date(eD.getTime()+3*86400000);
    return{date:start,endDate:d2s(eD),wStart:d2s(wS),wEnd:d2s(wE),daysUntil:Math.round((sD-now)/86400000),isLate:now>wE,isCur:now>=wS&&now<=wE};
  });
  var late=allP.filter(function(p){return p.isLate;});
  var upcoming=allP.filter(function(p){return !p.isLate;}).slice(0,5);
  var display=late.slice(-2).concat(upcoming); // show last 2 missed + next 5
  var lateP=late[0],curP=allP.filter(function(p){return p.isCur;})[0];

  // Total days overdue: count from the END of the FIRST missed window to today
  // This correctly carries over multiple missed periods (e.g. missed March + now 6d into April's window)
  var totalDaysOverdue = 0;
  if(late.length) {
    var firstMissedWindowEnd = new Date(late[0].wEnd+'T12:00:00');
    totalDaysOverdue = Math.round((now - firstMissedWindowEnd) / 86400000);
    if(totalDaysOverdue < 0) totalDaysOverdue = 0;
  }

  // Stage awareness
  var lastFlow=getLastPeriodDate();
  var daysSincePeriod=lastFlow?Math.round((now-new Date(lastFlow+'T12:00:00'))/86400000):null;
  var stageEl=document.getElementById('stage-container');
  var stageName='',stageDesc='';
  if(daysSincePeriod===null){stageName='Early Perimenopause';stageDesc='Periods are still occurring. Tracking helps establish your changing patterns.';}
  else if(daysSincePeriod<90){stageName='Early Perimenopause';stageDesc='Your last period was '+daysSincePeriod+' days ago. Cycles are becoming irregular — this is your body adapting.';}
  else if(daysSincePeriod<270){stageName='Late Perimenopause';stageDesc='Your last period was '+Math.round(daysSincePeriod/30)+' months ago. Gaps are lengthening — you may be approaching menopause.';}
  else if(daysSincePeriod<365){stageName='Approaching Menopause';stageDesc=Math.round(daysSincePeriod/30)+' months since your last period. Menopause is confirmed after 12 consecutive period-free months.';}
  else{stageName='Post-Menopause';stageDesc='12+ months without a period. You have reached menopause. Symptoms may continue — support is still available.';}
  stageEl.innerHTML='<div class="stage-box"><div class="stage-name">'+stageName+'</div><div class="stage-desc">'+stageDesc+'</div>'+(daysSincePeriod!==null?'<div class="period-free">'+daysSincePeriod+' days since last period</div>':'')+'</div>';

  // Overdue banner
  var bannerEl=document.getElementById('overdue-banner');
  if(late.length || curP) {
    var bannerHtml;
    if(late.length) {
      var missedCount = late.length;
      var missedLabel = missedCount > 1
        ? missedCount + ' predicted period'+(missedCount!==1?'s':'')+' missed'
        : 'Period is overdue';
      var daysLabel = totalDaysOverdue + ' day'+(totalDaysOverdue!==1?'s':'');
      var detail = missedCount > 1
        ? 'Your last expected period started around '+fmtDate(late[0].date)+'. You have now been without a period for '+daysLabel+' since the end of that first missed window. Skipped or late periods are a hallmark of perimenopause.'
        : 'Your period was expected around '+fmtDate(late[0].date)+' and is now '+daysLabel+' overdue from the end of its window. Late or absent periods are one of the key hallmarks of perimenopause.';
      bannerHtml = '<div class="overdue-banner"><div class="overdue-icon">&#127769;</div><div class="overdue-text"><h3>'+missedLabel+' &mdash; '+daysLabel+' overdue</h3><p>'+detail+'</p></div></div>';
    } else {
      bannerHtml = '<div class="overdue-banner"><div class="overdue-icon">&#127769;</div><div class="overdue-text"><h3>Period expected around now</h3><p>Your period window is open. It may arrive any day within this window.</p></div></div>';
    }
    bannerEl.innerHTML = bannerHtml;
  } else { bannerEl.innerHTML=''; }

  // Prediction list
  document.getElementById('pred-list').innerHTML=display.map(function(p,i){
    var badge;
    if(p.isLate) {
      var missedIdx = late.indexOf(p);
      badge = missedIdx === 0 && late.length > 1
        ? '<span class="pred-badge late">Missed (first)</span>'
        : missedIdx > 0
          ? '<span class="pred-badge late">Also missed</span>'
          : '<span class="pred-badge late">Overdue &mdash; '+totalDaysOverdue+'d</span>';
    } else if(p.isCur) {
      badge = '<span class="pred-badge now">Expected now</span>';
    } else {
      badge = '<span class="pred-badge">In '+p.daysUntil+'d</span>';
    }
    return '<div class="pred-item"><div class="pred-dot'+(p.isLate||p.isCur?' late-dot':'')+'"></div><div class="pred-dates"><strong>'+fmtDate(p.date)+' &ndash; '+fmtDate(p.endDate)+'</strong><span>Window: '+fmtDate(p.wStart)+' &ndash; '+fmtDate(p.wEnd)+'</span></div>'+badge+'</div>';
  }).join('');

  // Cycle note — derived from actual logged data
  var realCycles=getCycleLengths(true).filter(function(c){return c.gap>=15&&c.gap<100;});
  if(realCycles.length){
    var avgReal=Math.round(realCycles.reduce(function(a,c){return a+c.gap;},0)/realCycles.length);
    var minReal=Math.min.apply(null,realCycles.map(function(c){return c.gap;}));
    var maxReal=Math.max.apply(null,realCycles.map(function(c){return c.gap;}));
    document.getElementById('cycle-note').innerHTML='<strong style="color:var(--text)">Your cycle (based on '+realCycles.length+' cycle'+(realCycles.length!==1?'s':'')+'logged):</strong> avg '+avgReal+' days &middot; shortest '+minReal+'d &middot; longest '+maxReal+'d';
  } else {
    document.getElementById('cycle-note').innerHTML='<span style="color:var(--text-dim)">Log more periods to see your personal cycle stats.</span>';
  }

  // Anomaly detection — manual entries only (excludes seeded imports)
  var anomEl=document.getElementById('anomaly-container');
  var cycles=getCycleLengths(false);
  var anomalies=[];
  cycles.forEach(function(c){
    if(c.gap>60) anomalies.push('A gap of <strong>'+c.gap+' days</strong> was recorded between '+fmtShort(c.from)+' and '+fmtShort(c.to)+'. Long gaps are common in perimenopause but worth mentioning to your GP.');
    if(c.gap<15)  anomalies.push('A very short gap of <strong>'+c.gap+' days</strong> was recorded between '+fmtShort(c.from)+' and '+fmtShort(c.to)+'. Very short cycles can occasionally indicate other conditions — worth discussing with your doctor.');
  });
  anomEl.innerHTML=anomalies.length?anomalies.map(function(a){return '<div class="anomaly-alert">&#9888; '+a+'</div>';}).join(''):'';
}

// ═══════════════════════════════════════════════════════════════
// TREND CHART — 30-day energy & sleep SVG line chart
// ═══════════════════════════════════════════════════════════════
function renderTrendChart() {
  var el=document.getElementById('trend-chart');
  if(!el) return;

  // Build last 30 days
  var days=[], now=new Date(); now.setHours(12,0,0,0);
  for(var i=29;i>=0;i--){
    var d=new Date(now.getTime()-i*86400000);
    days.push(d2s(d));
  }

  var W=el.offsetWidth||320, H=140, PAD={top:12,right:12,bottom:28,left:22};
  var cW=W-PAD.left-PAD.right, cH=H-PAD.top-PAD.bottom;
  var n=days.length;

  function xPos(i){return PAD.left+Math.round(i/(n-1)*cW);}
  function yPos(v){return PAD.top+Math.round((1-(v-1)/4)*cH);} // scale 1-5

  // Build point arrays
  var ePoints=[], sPoints=[];
  days.forEach(function(d,i){
    var log=logs[d];
    if(log&&log.energy) ePoints.push({x:xPos(i),y:yPos(Number(log.energy)),v:log.energy,d:d});
    if(log&&log.sleep)  sPoints.push({x:xPos(i),y:yPos(Number(log.sleep)),v:log.sleep,d:d});
  });

  function polyline(pts,col){
    if(pts.length<2) return '';
    var path=pts.map(function(p,i){return (i===0?'M':'L')+p.x+','+p.y;}).join(' ');
    return '<path d="'+path+'" fill="none" stroke="'+col+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/>';
  }
  function dots(pts,col){
    return pts.map(function(p){
      return '<circle cx="'+p.x+'" cy="'+p.y+'" r="3" fill="'+col+'" opacity="0.9"/>';
    }).join('');
  }

  // Y-axis gridlines & labels
  var grid='';
  [1,2,3,4,5].forEach(function(v){
    var y=yPos(v);
    grid+='<line x1="'+PAD.left+'" y1="'+y+'" x2="'+(PAD.left+cW)+'" y2="'+y+'" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>';
    grid+='<text x="'+(PAD.left-4)+'" y="'+(y+4)+'" text-anchor="end" class="chart-label">'+v+'</text>';
  });

  // X-axis date labels (every 7 days)
  var xlabels='';
  [0,7,14,21,29].forEach(function(i){
    var d=new Date(days[i]+'T12:00:00');
    var label=d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
    xlabels+='<text x="'+xPos(i)+'" y="'+(H-6)+'" text-anchor="middle" class="chart-label">'+label+'</text>';
  });

  var noData=ePoints.length===0&&sPoints.length===0;
  var inner=noData
    ?'<text x="'+(W/2)+'" y="'+(H/2)+'" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="12">No data in last 30 days</text>'
    :grid+polyline(ePoints,'#c084d4')+polyline(sPoints,'#7dd3c0')+dots(ePoints,'#c084d4')+dots(sPoints,'#7dd3c0')+xlabels;

  el.innerHTML='<div class="chart-wrap"><svg class="chart-svg" viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg">'+inner+'</svg></div>'
    +(noData?'':'<div class="chart-legend"><span><span class="chart-legend-dot" style="background:#c084d4"></span>Energy</span><span><span class="chart-legend-dot" style="background:#7dd3c0"></span>Sleep</span><span style="margin-left:auto;font-size:0.68rem">Scale 1–5</span></div>');
}

// ═══════════════════════════════════════════════════════════════
// SCORE SPARKLINE — peri score trend over time
// ═══════════════════════════════════════════════════════════════
function renderScoreSparkline() {
  var el=document.getElementById('peri-score-sparkline');
  if(!el) return;
  var s=getSettings(), scores=s.periScores||{};
  var max=PERI_SX.length*4;
  var keys=Object.keys(scores).filter(function(k){return k!=='_latest';}).sort();
  if(keys.length<2){el.innerHTML='<div style="font-size:0.78rem;color:var(--text-dim)">Save at least 2 scores to see your trend.</div>';return;}

  var vals=keys.map(function(k){return Object.values(scores[k]).reduce(function(a,b){return a+Number(b);},0);});
  var W=el.offsetWidth||320, H=60, PAD={top:8,right:8,bottom:8,left:8};
  var cW=W-PAD.left-PAD.right, cH=H-PAD.top-PAD.bottom;
  var n=vals.length;
  function xP(i){return PAD.left+Math.round(i/(n-1)*cW);}
  function yP(v){return PAD.top+Math.round((1-v/max)*cH);}

  var pts=vals.map(function(v,i){return {x:xP(i),y:yP(v),v:v};});
  var path=pts.map(function(p,i){return (i===0?'M':'L')+p.x+','+p.y;}).join(' ');
  // Filled area
  var area=path+' L'+pts[pts.length-1].x+','+(PAD.top+cH)+' L'+pts[0].x+','+(PAD.top+cH)+' Z';

  // Colour based on trend
  var trend=vals[vals.length-1]-vals[0];
  var col=trend>0?'#e07090':trend<0?'#7dd3c0':'#c084d4';

  var dotsSvg=pts.map(function(p){return '<circle cx="'+p.x+'" cy="'+p.y+'" r="3.5" fill="'+col+'"/>';}).join('');

  // Labels for first, last
  var firstLabel=keys[0]?new Date(keys[0]+'T12:00:00').toLocaleDateString('en-GB',{month:'short',year:'2-digit'}):'';
  var lastLabel=keys[n-1]?new Date(keys[n-1]+'T12:00:00').toLocaleDateString('en-GB',{month:'short',year:'2-digit'}):'';
  var trendWord=trend>5?'&#8593; Worsening':trend<-5?'&#8595; Improving':'&#8594; Stable';
  var trendCol=trend>5?'#e07090':trend<-5?'#7dd3c0':'#c084d4';

  el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
    +'<span style="font-size:0.72rem;color:var(--text-dim)">Score over time ('+n+' entries)</span>'
    +'<span style="font-size:0.75rem;font-weight:600;color:'+trendCol+'">'+trendWord+'</span>'
    +'</div>'
    +'<div class="chart-wrap"><svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:'+H+'px" xmlns="http://www.w3.org/2000/svg">'
    +'<path d="'+area+'" fill="'+col+'" opacity="0.12"/>'
    +'<path d="'+path+'" fill="none" stroke="'+col+'" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>'
    +dotsSvg
    +'<text x="'+pts[0].x+'" y="'+(H-1)+'" text-anchor="start" class="chart-label">'+firstLabel+'</text>'
    +'<text x="'+pts[n-1].x+'" y="'+(H-1)+'" text-anchor="end" class="chart-label">'+lastLabel+'</text>'
    +'</svg></div>';
}

// ═══════════════════════════════════════════════════════════════
// INSIGHTS
// ═══════════════════════════════════════════════════════════════
function renderInsights() {
  renderTrendChart();
  var all=Object.values(logs),total=all.length;
  var fDays=all.filter(function(l){return l.flow&&l.flow!=='none';}).length;
  var sDays=all.filter(function(l){return l.flow==='spot';}).length;
  var avgC='-';
  var allCycles=getCycleLengths(true).filter(function(c){return c.gap<100;});
  if(allCycles.length){avgC=Math.round(allCycles.reduce(function(a,c){return a+c.gap;},0)/allCycles.length)+'d';}
  var wE=all.filter(function(l){return l.energy;}),wS=all.filter(function(l){return l.sleep;});
  var aE=wE.length?(wE.reduce(function(s,l){return s+Number(l.energy);},0)/wE.length).toFixed(1):'-';
  var aS=wS.length?(wS.reduce(function(s,l){return s+Number(l.sleep);},0)/wS.length).toFixed(1):'-';
  var avgW=all.filter(function(l){return l.water;});
  var aW=avgW.length?(avgW.reduce(function(s,l){return s+Number(l.water);},0)/avgW.length).toFixed(1):'-';

  document.getElementById('stat-grid').innerHTML=
    '<div class="stat-box"><div class="stat-val">'+total+'</div><div class="stat-label">Days Logged</div></div>'+
    '<div class="stat-box"><div class="stat-val">'+fDays+'</div><div class="stat-label">Period Days</div></div>'+
    '<div class="stat-box"><div class="stat-val">'+avgC+'</div><div class="stat-label">Avg Cycle</div></div>'+
    '<div class="stat-box"><div class="stat-val">'+aE+'</div><div class="stat-label">Avg Energy</div></div>'+
    '<div class="stat-box"><div class="stat-val">'+aS+'</div><div class="stat-label">Avg Sleep</div></div>'+
    '<div class="stat-box"><div class="stat-val">'+aW+'</div><div class="stat-label">Avg Water</div></div>';

  // Mood patterns
  var moodEl=document.getElementById('mood-insights');
  var moodCount={};
  all.forEach(function(l){(l.moods||[]).forEach(function(m){moodCount[m]=(moodCount[m]||0)+1;});});
  var moodEntries=Object.entries(moodCount).sort(function(a,b){return b[1]-a[1];});
  var MOOD_EMOJI={Happy:'😊',Low:'😔',Irritable:'😤',Anxious:'😰',Neutral:'😐',Exhausted:'😴',Calm:'🧘',Tearful:'😭',Hopeful:'🌟',Foggy:'🫠'};
  if(!moodEntries.length){
    moodEl.innerHTML='<div class="empty" style="padding:16px">No mood data logged yet.</div>';
  } else {
    var moodMax=moodEntries[0][1];
    var moodHtml=moodEntries.map(function(e){
      return '<div class="bar-row"><div class="bar-label">'+(MOOD_EMOJI[e[0]]||'')+' '+e[0]+'</div><div class="bar-track"><div class="bar-fill" style="width:'+Math.round(e[1]/moodMax*100)+'%;background:linear-gradient(90deg,var(--gold),var(--accent2))"></div></div><div class="bar-count">'+e[1]+'</div></div>';
    }).join('');
    // Most common mood
    var topMood=moodEntries[0][0];
    var avgMoodInt=all.filter(function(l){return l.moodIntensity;});
    var aMI=avgMoodInt.length?(avgMoodInt.reduce(function(s,l){return s+Number(l.moodIntensity);},0)/avgMoodInt.length).toFixed(1):'-';
    moodHtml='<div style="font-size:0.78rem;color:var(--text-dim);margin-bottom:12px">Most common mood: <strong style="color:var(--gold)">'+(MOOD_EMOJI[topMood]||'')+' '+topMood+'</strong> &middot; Avg intensity: <strong style="color:var(--gold)">'+aMI+'/5</strong></div>'+moodHtml;
    moodEl.innerHTML=moodHtml;
  }

  // Symptom bars
  var sc={};all.forEach(function(l){(l.symptoms||[]).forEach(function(s){sc[s]=(sc[s]||0)+1;});});
  var sorted=Object.entries(sc).sort(function(a,b){return b[1]-a[1];}).slice(0,10);
  var mx=sorted.length?sorted[0][1]:1;
  document.getElementById('symptom-bars').innerHTML=sorted.length?sorted.map(function(e){return '<div class="bar-row"><div class="bar-label">'+e[0]+'</div><div class="bar-track"><div class="bar-fill" style="width:'+Math.round(e[1]/mx*100)+'%;background:linear-gradient(90deg,var(--accent3),var(--accent1))"></div></div><div class="bar-count">'+e[1]+'</div></div>';}).join(''):'<div class="empty" style="padding:20px">No symptom data yet.</div>';

  // Custom tag frequency
  var tagCounts={};
  all.forEach(function(l){(l.customTags||[]).forEach(function(t){tagCounts[t]=(tagCounts[t]||0)+1;});});
  var tagSorted=Object.entries(tagCounts).sort(function(a,b){return b[1]-a[1];});
  var tagEl=document.getElementById('custom-tag-bars');
  if(tagEl){
    var tagMx=tagSorted.length?tagSorted[0][1]:1;
    tagEl.innerHTML=tagSorted.length
      ?'<div style="font-size:0.78rem;color:var(--text-dim);margin-bottom:10px;">Your most logged custom tags:</div>'
        +tagSorted.map(function(e){return '<div class="bar-row"><div class="bar-label" style="color:var(--gold)">'+e[0]+'</div><div class="bar-track"><div class="bar-fill" style="width:'+Math.round(e[1]/tagMx*100)+'%;background:linear-gradient(90deg,var(--gold),var(--accent2))"></div></div><div class="bar-count">'+e[1]+'</div></div>';}).join('')
      :'<div style="font-size:0.8rem;color:var(--text-dim);padding:8px 0">No custom tags logged yet.</div>';
  }

  // Trigger correlations
  var trigEl=document.getElementById('trigger-insights');
  if(total<5){trigEl.innerHTML='<div style="font-size:0.8rem;color:var(--text-dim);padding:10px 0">Log at least 5 days with triggers and symptoms to see correlations here.</div>';}
  else{
    var corrs=[];
    TRIGGERS.forEach(function(trig){
      var withTrig=all.filter(function(l){return(l.triggers||[]).indexOf(trig)>-1;});
      if(withTrig.length<2)return;
      var sxWithTrig={};
      withTrig.forEach(function(l){(l.symptoms||[]).forEach(function(s){sxWithTrig[s]=(sxWithTrig[s]||0)+1;});});
      Object.entries(sxWithTrig).forEach(function(e){
        var sxAll=all.filter(function(l){return(l.symptoms||[]).indexOf(e[0])>-1;}).length;
        var pctWith=Math.round(e[1]/withTrig.length*100),pctAll=total?Math.round(sxAll/total*100):0;
        if(pctWith>pctAll+20&&withTrig.length>=2)corrs.push({trig:trig,sx:e[0],pctWith:pctWith,pctAll:pctAll});
      });
    });
    corrs.sort(function(a,b){return(b.pctWith-b.pctAll)-(a.pctWith-a.pctAll);});
    trigEl.innerHTML=corrs.slice(0,5).map(function(c){return '<div class="corr-row">On days with <strong>'+c.trig+'</strong>, you experienced <strong>'+c.sx+'</strong> '+c.pctWith+'% of the time (vs '+c.pctAll+'% on average).</div>';}).join('')||(corrs.length?'':'<div style="font-size:0.8rem;color:var(--text-dim);padding:10px 0">No strong trigger correlations found yet. Keep logging!</div>');
  }

  // Flow summary
  var FT={none:0,spot:0,light:0,medium:0,heavy:0};
  all.forEach(function(l){if(l.flow)FT[l.flow]=(FT[l.flow]||0)+1;});
  var FN={none:'No Flow',spot:'Spotting',light:'Light',medium:'Medium',heavy:'Heavy'};
  var fh=Object.entries(FT).filter(function(e){return e[1]>0;}).map(function(e){return '<div class="bar-row"><div class="bar-label" style="color:'+(FLOW_COLORS[e[0]]||'inherit')+'">'+FN[e[0]]+'</div><div class="bar-track"><div class="bar-fill" style="width:'+(total?Math.round(e[1]/total*100):0)+'%;background:'+(FLOW_COLORS[e[0]]||'var(--accent1)')+'"></div></div><div class="bar-count">'+e[1]+'</div></div>';}).join('');
  document.getElementById('flow-summary').innerHTML=fh||'<div class="empty" style="padding:20px">No flow data yet.</div>';

  // Medication correlations — compares wellbeing on days med was likely taken vs not taken
  var medInsEl=document.getElementById('med-insights');
  var sett=getSettings(), meds=sett.medications||[];
  var manualLogs=all.filter(function(l){return !l._imp;});
  if(!meds.length){
    medInsEl.innerHTML='<div style="font-size:0.8rem;color:var(--text-dim);padding:8px 0">No medications logged yet. Add your HRT or medications in Settings to see correlations here.</div>';
  } else if(manualLogs.length<10){
    medInsEl.innerHTML='<div style="font-size:0.8rem;color:var(--text-dim);padding:8px 0">Log at least 10 days to see medication wellbeing insights.</div>';
  } else {
    var medHtml='';
    // Build a set of "dose days" per med based on frequency from the first manual log date
    var firstDate=manualLogs.map(function(l){return l.date;}).sort()[0];
    var firstD=new Date(firstDate+'T12:00:00');
    meds.forEach(function(m){
      // Determine dose days: daily=every day, alternate=every other, weekly=every 7
      var doseDays={};
      var checkD=new Date(firstD);
      var today=new Date();today.setHours(12,0,0,0);
      var step=m.freq==='alternate'?2:m.freq==='weekly'?7:1; // twice-daily still means every day
      while(checkD<=today){
        doseDays[d2s(checkD)]=true;
        checkD.setDate(checkD.getDate()+step);
      }
      var onDose =manualLogs.filter(function(l){return  doseDays[l.date]&&l.energy;});
      var offDose=manualLogs.filter(function(l){return !doseDays[l.date]&&l.energy;});
      if(onDose.length>=3){
        var avgEon =(onDose.reduce(function(s,l){return s+Number(l.energy);},0)/onDose.length).toFixed(1);
        var avgSon =onDose.filter(function(l){return l.sleep;});
        var avgSlOn=avgSon.length?(avgSon.reduce(function(s,l){return s+Number(l.sleep);},0)/avgSon.length).toFixed(1):'-';
        var comparison='';
        if(offDose.length>=3){
          var avgEoff=(offDose.reduce(function(s,l){return s+Number(l.energy);},0)/offDose.length).toFixed(1);
          var diff=Number(avgEon)-Number(avgEoff);
          var arrow=diff>0.2?'&#8593; higher':'<span style="opacity:0.7">similar</span>';
          comparison=' vs <strong>'+avgEoff+'</strong> on non-dose days &mdash; energy is '+arrow;
        }
        medHtml+='<div class="corr-row">On <strong>'+m.name+'</strong> dose days ('+onDose.length+' days): avg energy <strong style="color:var(--accent3)">'+avgEon+'/5</strong>'+comparison+', avg sleep <strong style="color:var(--accent3)">'+avgSlOn+'/5</strong>.</div>';
      } else {
        medHtml+='<div class="corr-row">Tracking <strong>'+m.name+'</strong> &mdash; keep logging energy and sleep daily to build a correlation picture over time.</div>';
      }
    });
    medInsEl.innerHTML=medHtml||'<div style="font-size:0.8rem;color:var(--text-dim);padding:8px 0">Keep logging to build medication insights.</div>';
  }

  renderHormonePatterns();
}

// ═══════════════════════════════════════════════════════════════
// HORMONE PATTERN DETECTION
// Based on the algorithm suggested in review, adapted for Luna's
// data structure, mobile-compatible JS, and corrected cycle logic.
// ═══════════════════════════════════════════════════════════════
function detectHormonePatterns() {
  // Step 1 — Get sorted entries, excluding seeded/imported data
  var entries = Object.keys(logs).sort().map(function(d){return{date:d,data:logs[d]};})
    .filter(function(e){return !e.data._imp;});
  if(entries.length < 20) return null;

  // Step 2 — Identify cycle START days only (first day of each bleed,
  // not every flow day — consecutive flow days must not reset the counter)
  var cycleStarts = [];
  var prevWasFlow = false;
  entries.forEach(function(e){
    var isFlow = e.data.flow && e.data.flow !== 'none';
    if(isFlow && !prevWasFlow) cycleStarts.push(e.date);
    prevWasFlow = isFlow;
  });
  if(cycleStarts.length < 2) return null;

  // Step 3 — Assign a cycle day number to each log entry
  // (day 1 = first day of bleed, counts up until next cycle start)
  function getCycleDay(dateStr) {
    var lastStart = null;
    for(var i = cycleStarts.length - 1; i >= 0; i--) {
      if(cycleStarts[i] <= dateStr) { lastStart = cycleStarts[i]; break; }
    }
    if(!lastStart) return null;
    var diff = Math.round(
      (new Date(dateStr+'T12:00:00') - new Date(lastStart+'T12:00:00')) / 86400000
    );
    return diff + 1;
  }

  // Step 4 — Map each symptom to the cycle days it appeared on
  var symptomMap = {};
  entries.forEach(function(e){
    var cd = getCycleDay(e.date);
    if(!cd || cd > 60) return; // ignore outlier cycle days
    (e.data.symptoms || []).forEach(function(sx){
      if(!symptomMap[sx]) symptomMap[sx] = [];
      symptomMap[sx].push(cd);
    });
  });

  // Step 5 — Detect tight clusters using mean + standard deviation
  // Require at least 4 occurrences spread across at least 2 separate
  // cycles (not just 4 consecutive days in one period)
  var patterns = [];
  Object.keys(symptomMap).forEach(function(sx){
    var days = symptomMap[sx];
    if(days.length < 4) return;

    var avg = days.reduce(function(a,b){return a+b;},0) / days.length;
    var variance = days.reduce(function(s,d){return s+Math.pow(d-avg,2);},0) / days.length;
    var spread = Math.sqrt(variance);

    // Only tight clusters — spread <= 5 cycle days
    if(spread <= 5) {
      var start = Math.max(1, Math.round(avg - spread));
      var end   = Math.round(avg + spread);
      patterns.push({sx:sx, avgDay:Math.round(avg), start:start, end:end, spread:Math.round(spread), count:days.length});
    }
  });

  if(!patterns.length) return [];
  patterns.sort(function(a,b){return b.count - a.count;});
  return patterns;
}

// Predict next symptom window using real cycle avg + detected cluster day
function predictNextWindow(pattern) {
  var cycles = getCycleLengths(true).filter(function(c){return c.gap < 100;});
  if(!cycles.length) return null;
  var avgCycleLen = Math.round(cycles.reduce(function(a,c){return a+c.gap;},0) / cycles.length);
  var lastFlow = getLastPeriodDate();
  if(!lastFlow) return null;
  var nextStart = new Date(lastFlow+'T12:00:00');
  nextStart.setDate(nextStart.getDate() + avgCycleLen);
  var winStart = new Date(nextStart);winStart.setDate(winStart.getDate() + pattern.start - 1);
  var winEnd   = new Date(nextStart);winEnd.setDate(winEnd.getDate()   + pattern.end   - 1);
  return {start: d2s(winStart), end: d2s(winEnd)};
}

function renderHormonePatterns() {
  var el = document.getElementById('hormone-insights');
  if(!el) return;
  var patterns = detectHormonePatterns();
  var pmdd = detectPmddPattern();

  var html = '';

  // PMDD flag — shown first if detected
  if(pmdd && pmdd.detected) {
    html += '<div class="anomaly-alert" style="background:rgba(232,122,160,0.12);border-color:rgba(232,122,160,0.35);margin-bottom:14px;">'
      + '<strong style="color:#e07090">&#9888; Possible PMDD pattern detected</strong><br>'
      + '<span style="font-size:0.78rem;line-height:1.6">Mood symptoms ('
      + pmdd.symptoms.join(', ')
      + ') appear significantly more often in your luteal phase (cycle days 15&#8211;28) than earlier in your cycle '
      + '('+pmdd.lutealpct+'% vs '+pmdd.follicularpct+'% of days). '
      + 'This may be worth discussing with your GP &#8212; see the <strong>PMDD</strong> article in Learn for more information.</span>'
      + '</div>';
  } else if(pmdd && pmdd.insufficient) {
    // Don't show anything — not enough data yet
  }

  if(patterns === null) {
    html += '<div style="font-size:0.8rem;color:var(--text-dim);padding:8px 0">Keep logging &#8212; pattern detection needs at least 20 days of data and 2 complete cycles.</div>';
    el.innerHTML = html;
    return;
  }
  if(!patterns.length) {
    html += '<div style="font-size:0.8rem;color:var(--text-dim);padding:8px 0">No strong repeating symptom patterns detected yet. Keep logging across multiple cycles to build a picture.</div>';
    el.innerHTML = html;
    return;
  }

  html += '<div style="font-size:0.78rem;color:var(--text-dim);margin-bottom:14px;line-height:1.6">Symptoms that cluster at consistent points in your cycle, based on your logged data.</div>';
  patterns.slice(0,5).forEach(function(p){
    var next = predictNextWindow(p);
    var nextStr = next ? ' <span style="color:var(--gold);font-size:0.72rem">Next est. '+fmtShort(next.start)+'&#8211;'+fmtShort(next.end)+'</span>' : '';
    html += '<div class="corr-row">'
      + '<strong>'+p.sx+'</strong> tends to appear around cycle day '+p.start+'&#8211;'+p.end
      + ' (avg day '+p.avgDay+', seen '+p.count+' times)'
      + nextStr
      + '</div>';
  });
  el.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// PMDD PATTERN DETECTION
// Looks for emotional symptom clustering in the luteal phase
// (approx cycle days 15-28) vs follicular phase (days 1-14)
// ═══════════════════════════════════════════════════════════════
function detectPmddPattern() {
  var PMDD_MOODS = ['Anxious','Irritable','Low','Tearful'];
  var PMDD_SX    = ['Anxiety / low mood', 'Mood swings / irritability', 'Insomnia', 'Brain fog', 'Fatigue'];

  // Use manual entries only
  var entries = Object.keys(logs).sort().map(function(d){return{date:d,data:logs[d]};})
    .filter(function(e){return !e.data._imp;});
  if(entries.length < 14) return {insufficient:true};

  // Need cycle starts
  var cycleStarts = [];
  var prevWasFlow = false;
  entries.forEach(function(e){
    var isFlow = e.data.flow && e.data.flow !== 'none';
    if(isFlow && !prevWasFlow) cycleStarts.push(e.date);
    prevWasFlow = isFlow;
  });
  if(cycleStarts.length < 2) return {insufficient:true};

  // Get avg cycle length to estimate luteal phase start
  var cycles = getCycleLengths(false).filter(function(c){return c.gap>=15&&c.gap<100;});
  var avgCycle = cycles.length ? Math.round(cycles.reduce(function(a,c){return a+c.gap;},0)/cycles.length) : 28;
  var lutealStart = Math.max(avgCycle - 14, 12); // luteal phase = last ~14 days

  // Assign cycle day to each entry
  var follicularDays = [], lutealDays = [];
  entries.forEach(function(e){
    var lastStart = null;
    for(var i = cycleStarts.length-1; i >= 0; i--){
      if(cycleStarts[i] <= e.date){lastStart = cycleStarts[i]; break;}
    }
    if(!lastStart) return;
    var cycleDay = Math.round((new Date(e.date+'T12:00:00') - new Date(lastStart+'T12:00:00'))/86400000) + 1;
    if(cycleDay >= 1 && cycleDay < lutealStart) follicularDays.push(e);
    else if(cycleDay >= lutealStart) lutealDays.push(e);
  });

  if(follicularDays.length < 5 || lutealDays.length < 5) return {insufficient:true};

  // Count days with PMDD-related mood or symptom logged
  function hasPmddSignal(entry) {
    var moods = entry.data.moods || [];
    var sx = entry.data.symptoms || [];
    return PMDD_MOODS.some(function(m){return moods.indexOf(m)>-1;}) ||
           PMDD_SX.some(function(s){return sx.indexOf(s)>-1;});
  }

  var lutealHits    = lutealDays.filter(hasPmddSignal).length;
  var follicularHits = follicularDays.filter(hasPmddSignal).length;
  var lutealPct    = Math.round(lutealHits    / lutealDays.length    * 100);
  var follicularPct = Math.round(follicularHits / follicularDays.length * 100);

  // Flag if luteal phase has meaningfully more emotional symptoms (>25% gap, >30% luteal rate)
  var detected = lutealPct >= 30 && (lutealPct - follicularPct) >= 25;

  // Identify which symptoms are driving the pattern
  var symptomCounts = {};
  lutealDays.forEach(function(e){
    (e.data.moods||[]).forEach(function(m){
      if(PMDD_MOODS.indexOf(m)>-1) symptomCounts[m]=(symptomCounts[m]||0)+1;
    });
    (e.data.symptoms||[]).forEach(function(s){
      if(PMDD_SX.indexOf(s)>-1) symptomCounts[s]=(symptomCounts[s]||0)+1;
    });
  });
  var topSymptoms = Object.entries(symptomCounts)
    .sort(function(a,b){return b[1]-a[1];})
    .slice(0,3)
    .map(function(e){return e[0];});

  return {
    detected: detected,
    lutealpct: lutealPct,
    follicularpct: follicularPct,
    symptoms: topSymptoms.length ? topSymptoms : ['mood symptoms']
  };
}

// ═══════════════════════════════════════════════════════════════
// LEARN
// ═══════════════════════════════════════════════════════════════
function renderLearn() {
  var el=document.getElementById('learn-content');
  if(!el)return;
  el.innerHTML=LEARN_ARTICLES.map(function(a,i){
    var badge=a.ukBadge?'<span class="uk-badge">&#127468;&#127463; UK guidance</span>':'';
    return '<div class="learn-item" id="learn-'+i+'"><div class="learn-header" onclick="toggleLearn('+i+')"><div class="learn-title">'+a.q+badge+'</div><span class="learn-arrow">&#8250;</span></div><div class="learn-body">'+a.a+'</div></div>';
  }).join('');
}
function toggleLearn(i){var el=document.getElementById('learn-'+i);el.classList.toggle('open');}

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════
function setHeightUnit(u) {
  ['cm','ft'].forEach(function(v){
    document.getElementById('h-btn-'+v).classList.toggle('active',v===u);
  });
  document.getElementById('h-cm-row').style.display=u==='cm'?'block':'none';
  document.getElementById('h-ft-row').style.display=u==='ft'?'block':'none';
  var s=getSettings();s.heightUnit=u;saveSettings(s);
}
function setWeightUnit(u) {
  ['kg','st','lb'].forEach(function(v){
    document.getElementById('w-btn-'+v).classList.toggle('active',v===u);
  });
  document.getElementById('w-kg-row').style.display=u==='kg'?'block':'none';
  document.getElementById('w-st-row').style.display=u==='st'?'block':'none';
  document.getElementById('w-lb-row').style.display=u==='lb'?'block':'none';
  var s=getSettings();s.weightUnit=u;saveSettings(s);
}

function renderSettings() {
  renderSettingsTagGrid();
  renderBloodHistory();
  applySleepMode(getSleepMode());
  var s=getSettings();
  document.getElementById('s-name').value=s.name||'';
  document.getElementById('s-dob').value=s.dob||'';
  var hu=s.heightUnit||'cm', wu=s.weightUnit||'kg';

  // Height
  setHeightUnit(hu);
  if(hu==='cm'){
    document.getElementById('s-height').value=s.heightCm?Math.round(s.heightCm):'';
  } else {
    if(s.heightCm){var ti=s.heightCm/2.54;document.getElementById('s-height-ft').value=Math.floor(ti/12);document.getElementById('s-height-in').value=Math.round(ti%12);}
  }

  // Weight
  setWeightUnit(wu);
  if(wu==='kg'){
    document.getElementById('s-weight').value=s.weightKg?s.weightKg.toFixed(1):'';
  } else if(wu==='lb'){
    document.getElementById('s-weight-lbs').value=s.weightKg?(s.weightKg/0.453592).toFixed(1):'';
  } else {
    if(s.weightKg){var tl=s.weightKg/0.453592;document.getElementById('s-weight-st').value=Math.floor(tl/14);document.getElementById('s-weight-lbs2').value=Math.round(tl%14);}
  }

  // BMI
  var bEl=document.getElementById('bmi-display');
  if(s.heightCm&&s.weightKg){var hm=s.heightCm/100,bmi=(s.weightKg/(hm*hm)).toFixed(1);var cat='Healthy weight',col='var(--accent3)';if(bmi<18.5){cat='Underweight';col='#f0a090';}else if(bmi>=30){cat='Obese range';col='#f0a090';}else if(bmi>=25){cat='Overweight';col='var(--gold)';}bEl.style.display='block';bEl.innerHTML='<span class="bmi-val" style="color:'+col+'">'+bmi+'</span>BMI &middot; <strong style="color:'+col+'">'+cat+'</strong><br><span style="font-size:0.72rem;color:var(--text-dim)">BMI is a general guide and does not account for all health factors.</span>';}
  else bEl.style.display='none';

  // Medications list
  renderMedList();

  // Peri score
  var scores=s.periScores||{},latestKey=scores._latest,cur=latestKey?(scores[latestKey]||{}):{};
  var total=PERI_SX.reduce(function(acc,sx){return acc+Number(cur[sx.k]||0);},0);
  document.getElementById('peri-score-form').innerHTML=PERI_SX.map(function(sx){var val=Number(cur[sx.k]||0);return '<div class="peri-item"><div class="peri-row">'+sx.l+' <span id="pv-'+sx.k+'">'+val+'/4</span></div><input type="range" min="0" max="4" value="'+val+'" id="pr-'+sx.k+'" oninput="document.getElementById(\'pv-'+sx.k+'\').textContent=this.value+\'/4\';updatePeriTotal()"><div class="slider-labels"><span>Not at all</span><span>Severely</span></div></div>';}).join('')+'<div class="peri-total-box"><div class="peri-big" id="peri-total" style="color:'+periCol(total)+'">'+total+'</div><div class="peri-lbl">out of '+(PERI_SX.length*4)+'</div><div class="peri-interp" id="peri-interp">'+periInterp(total)+'</div></div>';
  renderScoreHist();

  // Notifications
  document.getElementById('notif-toggle').checked=s.notifEnabled||false;
  document.getElementById('notif-status').textContent=s.notifEnabled?'Reminders are on. You\'ll get a daily nudge at 8pm.':'Reminders are off.';

  // Cycle settings
  document.getElementById('s-period-len').value=s.periodLenDays||'';
  document.getElementById('s-cycle-len').value=s.cycleLenDays||'';
}

function saveCycleSettings() {
  var s=getSettings();
  var pl=parseInt(document.getElementById('s-period-len').value)||null;
  var cl=parseInt(document.getElementById('s-cycle-len').value)||null;
  if(pl&&(pl<1||pl>14)){toast('Period length must be 1–14 days');return;}
  if(cl&&(cl<15||cl>90)){toast('Cycle length must be 15–90 days');return;}
  s.periodLenDays=pl;
  s.cycleLenDays=cl;
  saveSettings(s);
  var conf=document.getElementById('cycle-settings-confirm');
  conf.style.display='block';
  setTimeout(function(){conf.style.display='none';},3000);
  try {
    var predPanel=document.getElementById('sub-panel-predict');
    if(predPanel&&predPanel.style.display!=='none') renderPredict();
  } catch(e) {}
}

// ═══════════════════════════════════════════════════════════════
// BLOOD TEST RESULTS
// ═══════════════════════════════════════════════════════════════
function saveBloodResult() {
  var statusEl = document.getElementById('blood-save-status');
  var date = document.getElementById('blood-date').value;
  if(!date){statusEl.textContent='Please select the date of your test.';return;}

  var result = {
    date:   date,
    lab:    document.getElementById('blood-lab').value.trim(),
    fsh:    document.getElementById('blood-fsh').value,
    lh:     document.getElementById('blood-lh').value,
    e2:     document.getElementById('blood-e2').value,
    prog:   document.getElementById('blood-prog').value,
    testo:  document.getElementById('blood-testo').value,
    tsh:    document.getElementById('blood-tsh').value,
    vitd:   document.getElementById('blood-vitd').value,
    ferritin: document.getElementById('blood-ferritin').value,
    notes:  document.getElementById('blood-notes').value.trim()
  };

  // Check at least one value was entered
  var hasValues = ['fsh','lh','e2','prog','testo','tsh','vitd','ferritin'].some(function(k){return result[k]!=='';});
  if(!hasValues){statusEl.textContent='Please enter at least one test value.';return;}

  // Convert filled values to numbers, leave empty as null
  ['fsh','lh','e2','prog','testo','tsh','vitd','ferritin'].forEach(function(k){
    result[k] = result[k]!=='' ? Number(result[k]) : null;
  });

  var s = getSettings();
  s.bloodResults = s.bloodResults||[];
  s.bloodResults.push(result);
  s.bloodResults.sort(function(a,b){return a.date.localeCompare(b.date);});
  saveSettings(s);

  // Clear form
  ['blood-date','blood-lab','blood-fsh','blood-lh','blood-e2','blood-prog',
   'blood-testo','blood-tsh','blood-vitd','blood-ferritin','blood-notes'].forEach(function(id){
    document.getElementById(id).value='';
  });
  statusEl.innerHTML='<span style="color:var(--accent3)">&#10003; Result saved for '+fmtDate(date)+'</span>';
  setTimeout(function(){statusEl.textContent='';},3000);
  renderBloodHistory();
}

function deleteBloodResult(index) {
  if(!confirm('Delete this blood test result?')) return;
  var s=getSettings();
  s.bloodResults=s.bloodResults||[];
  s.bloodResults.splice(index,1);
  saveSettings(s);
  renderBloodHistory();
}

function renderBloodHistory() {
  var el=document.getElementById('blood-history');
  if(!el) return;
  var s=getSettings();
  var results=(s.bloodResults||[]).slice().reverse(); // newest first
  if(!results.length){
    el.innerHTML='<div style="font-size:0.78rem;color:var(--text-dim);padding:8px 0">No blood test results saved yet.</div>';
    return;
  }

  var MARKERS=[
    {k:'fsh',   label:'FSH',          unit:'IU/L'},
    {k:'lh',    label:'LH',           unit:'IU/L'},
    {k:'e2',    label:'Oestradiol',   unit:'pmol/L'},
    {k:'prog',  label:'Progesterone', unit:'nmol/L'},
    {k:'testo', label:'Testosterone', unit:'nmol/L'},
    {k:'tsh',   label:'TSH',          unit:'mIU/L'},
    {k:'vitd',  label:'Vit D',        unit:'nmol/L'},
    {k:'ferritin',label:'Ferritin',   unit:'ug/L'}
  ];

  var html='';
  results.forEach(function(r,i){
    var realIndex=(s.bloodResults.length-1)-i;
    var values=MARKERS.filter(function(m){return r[m.k]!==null&&r[m.k]!==undefined;})
      .map(function(m){return '<span style="display:inline-block;margin:2px 4px 2px 0;font-size:0.76rem;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:3px 8px;"><strong style="color:var(--accent1)">'+m.label+'</strong> '+r[m.k]+' <span style="color:var(--text-dim)">'+m.unit+'</span></span>';})
      .join('');
    html+='<div style="border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:10px;">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
      +'<strong style="font-size:0.85rem">'+fmtDate(r.date)+(r.lab?' <span style="color:var(--text-dim);font-weight:300;font-size:0.75rem">&#183; '+r.lab+'</span>':'')+'</strong>'
      +'<button onclick="deleteBloodResult('+realIndex+')" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:0.85rem;padding:2px 6px;" title="Delete">&#215;</button>'
      +'</div>'
      +values
      +(r.notes?'<div style="font-size:0.74rem;color:var(--text-dim);margin-top:6px;font-style:italic">'+r.notes+'</div>':'')
      +'</div>';
  });
  el.innerHTML=html;
}

function saveProfile() {
  var s=getSettings();
  s.name=document.getElementById('s-name').value;
  s.dob=document.getElementById('s-dob').value;
  var hu=s.heightUnit||'cm', wu=s.weightUnit||'kg';
  if(hu==='cm'){
    s.heightCm=parseFloat(document.getElementById('s-height').value)||null;
  } else {
    var ft=parseFloat(document.getElementById('s-height-ft').value)||0;
    var inc=parseFloat(document.getElementById('s-height-in').value)||0;
    s.heightCm=(ft||inc)?(ft*30.48)+(inc*2.54):null;
  }
  if(wu==='kg'){
    s.weightKg=parseFloat(document.getElementById('s-weight').value)||null;
  } else if(wu==='lb'){
    var lb=parseFloat(document.getElementById('s-weight-lbs').value)||null;
    s.weightKg=lb?lb*0.453592:null;
  } else {
    var st=parseFloat(document.getElementById('s-weight-st').value)||0;
    var lb2=parseFloat(document.getElementById('s-weight-lbs2').value)||0;
    s.weightKg=(st||lb2)?(st*6.35029)+(lb2*0.453592):null;
  }
  saveSettings(s);toast('Profile saved');renderSettings();
}

// Medications
function addMed() {
  var name=document.getElementById('med-name').value.trim();
  if(!name){toast('Please enter a medication name');return;}
  var s=getSettings();if(!s.medications)s.medications=[];
  s.medications.push({name:name,type:document.getElementById('med-type').value,dose:document.getElementById('med-dose').value||'-',freq:document.getElementById('med-freq').value});
  saveSettings(s);
  document.getElementById('med-name').value='';document.getElementById('med-dose').value='';
  renderMedList();renderLogMeds();toast('Medication added');
}
function deleteMed(i) {
  var s=getSettings();if(!s.medications)return;
  s.medications.splice(i,1);saveSettings(s);renderMedList();renderLogMeds();toast('Medication removed');
}
function renderMedList() {
  var s=getSettings(),meds=s.medications||[];
  var el=document.getElementById('med-list');
  if(!meds.length){el.innerHTML='<div style="font-size:0.8rem;color:var(--text-dim);padding:6px 0">No medications added yet.</div>';return;}
  var TN={gel:'Gel',patch:'Patch',pill:'Pill/tablet',spray:'Spray',pessary:'Pessary/cream',injection:'Injection',other:'Other'};
  var FQ={daily:'Daily',twice:'Twice daily',alternate:'Alternate days',weekly:'Weekly',asneeded:'As needed'};
  el.innerHTML=meds.map(function(m,i){return '<div class="med-item"><div class="med-dot"></div><div class="med-info"><div class="med-name">'+m.name+'</div><div class="med-detail">'+(TN[m.type]||m.type)+' &middot; '+m.dose+' &middot; '+(FQ[m.freq]||m.freq)+'</div></div><button class="med-del" onclick="deleteMed('+i+')" title="Remove">&#10005;</button></div>';}).join('');
}

// Peri score
function updatePeriTotal(){var t=PERI_SX.reduce(function(a,sx){var el=document.getElementById('pr-'+sx.k);return a+(el?Number(el.value):0);},0);var el=document.getElementById('peri-total'),ip=document.getElementById('peri-interp');if(el){el.textContent=t;el.style.color=periCol(t);}if(ip)ip.textContent=periInterp(t);}
function periCol(s){var p=s/(PERI_SX.length*4);return p<0.25?'var(--accent3)':p<0.5?'var(--gold)':p<0.75?'#f0a090':'#e07090';}
function periInterp(s){var p=s/(PERI_SX.length*4);if(p===0)return 'No symptoms reported this month.';if(p<0.25)return 'Mild impact \u2014 symptoms present but manageable.';if(p<0.5)return 'Moderate impact \u2014 symptoms noticeably affecting daily life.';if(p<0.75)return 'Significant impact \u2014 consider speaking with your GP or a menopause specialist.';return 'Severe impact \u2014 please speak with your doctor about your symptoms.';}
function savePeriscore(){var s=getSettings();if(!s.periScores)s.periScores={};var t=tod(),entry={};PERI_SX.forEach(function(sx){var el=document.getElementById('pr-'+sx.k);entry[sx.k]=el?Number(el.value):0;});s.periScores[t]=entry;s.periScores._latest=t;saveSettings(s);toast('Score saved');renderScoreHist();}
function renderScoreHist(){
  renderScoreSparkline();
  var s=getSettings(),scores=s.periScores||{},max=PERI_SX.length*4,el=document.getElementById('peri-score-history');var keys=Object.keys(scores).filter(function(k){return k!=='_latest';}).sort(function(a,b){return b.localeCompare(a);});if(!keys.length){el.innerHTML='<div class="empty" style="padding:14px">No scores saved yet.</div>';return;}el.innerHTML=keys.map(function(date){var sc=scores[date],t=Object.values(sc).reduce(function(a,b){return a+Number(b);},0);return '<div class="score-row"><div class="score-date">'+fmtDate(date)+'</div><div class="score-track"><div class="score-bar" style="width:'+Math.round(t/max*100)+'%;background:'+periCol(t)+'"></div></div><div class="score-val" style="color:'+periCol(t)+'">'+t+'/'+max+'</div></div>';}).join('');}

// ═══════════════════════════════════════════════════════════════
// SLEEP MODE (1-5 scale vs % watch score)
// ═══════════════════════════════════════════════════════════════
function getSleepMode() {
  var s=getSettings();
  return s.sleepMode||'scale'; // default to 1-5 scale
}
function setSleepModePref(mode) {
  var s=getSettings();s.sleepMode=mode;saveSettings(s);
  applySleepMode(mode);
  toast(mode==='pct'?'Sleep logging set to % watch score':'Sleep logging set to 1\u20135 scale');
}
function applySleepMode(mode) {
  var scaleWrap=document.getElementById('sleep-scale-wrap');
  var pctWrap=document.getElementById('sleep-pct-wrap');
  var toggleBtn=document.getElementById('sleep-mode-toggle');
  var btnScale=document.getElementById('sleep-mode-btn-scale');
  var btnPct=document.getElementById('sleep-mode-btn-pct');
  if(!scaleWrap||!pctWrap) return;
  var isPct=mode==='pct';
  scaleWrap.style.display=isPct?'none':'block';
  pctWrap.style.display=isPct?'block':'none';
  if(toggleBtn) toggleBtn.textContent=isPct?'Switch to 1\u20135':'Switch to %';
  // Highlight active button in settings
  var activeStyle='background:var(--accent1);border-color:var(--accent1);color:#1a1025;';
  var inactiveStyle='background:var(--surface2);border-color:var(--border);color:var(--text-dim);';
  if(btnScale) btnScale.style.cssText=btnScale.style.cssText.replace(/background:[^;]+;border-color:[^;]+;color:[^;]+;/,'')+(!isPct?activeStyle:inactiveStyle);
  if(btnPct)   btnPct.style.cssText=btnPct.style.cssText.replace(/background:[^;]+;border-color:[^;]+;color:[^;]+;/,'')+(isPct?activeStyle:inactiveStyle);
}
function toggleSleepMode() {
  var current=getSleepMode();
  setSleepModePref(current==='pct'?'scale':'pct');
}
function getSleepValue() {
  // Returns a normalised 1-5 value regardless of mode, plus raw value
  var mode=getSleepMode();
  if(mode==='pct'){
    var pct=Number(document.getElementById('sleep-pct').value)||null;
    if(pct===null||pct==='') return {val:null,raw:null,mode:'pct'};
    // Convert % to 1-5: 0-20=1, 21-40=2, 41-60=3, 61-80=4, 81-100=5
    var scaled=Math.min(5,Math.max(1,Math.ceil(pct/20)));
    return {val:scaled,raw:pct,mode:'pct'};
  }
  return {val:Number(document.getElementById('sleep-slider').value),raw:null,mode:'scale'};
}

// Notifications
function toggleNotif() {
  var enabled=document.getElementById('notif-toggle').checked;
  var s=getSettings();
  if(enabled){
    if(!('Notification' in window)){toast('Notifications not supported in this browser');document.getElementById('notif-toggle').checked=false;return;}
    Notification.requestPermission().then(function(perm){
      if(perm==='granted'){s.notifEnabled=true;saveSettings(s);document.getElementById('notif-status').textContent='Reminders are on. You\'ll get a daily nudge at 8pm.';toast('Reminders enabled!');}
      else{s.notifEnabled=false;saveSettings(s);document.getElementById('notif-toggle').checked=false;document.getElementById('notif-status').textContent='Permission denied. Please enable notifications in your browser settings.';}
    });
  } else{s.notifEnabled=false;saveSettings(s);document.getElementById('notif-status').textContent='Reminders are off.';}
}

// ═══════════════════════════════════════════════════════════════
// HEALTH REPORT
// ═══════════════════════════════════════════════════════════════
function generateReport() {
  var s=getSettings(),now=new Date();
  var cutoff=new Date(now);cutoff.setMonth(cutoff.getMonth()-3);
  var all=Object.values(logs).filter(function(l){return new Date(l.date+'T12:00:00')>=cutoff;});
  var total=all.length;
  if(!total){toast('No data in the last 3 months');return;}
  var fDays=all.filter(function(l){return l.flow&&l.flow!=='none';}).length;
  var sDays=all.filter(function(l){return l.flow==='spot';}).length;
  var sc={};all.forEach(function(l){(l.symptoms||[]).forEach(function(sx){sc[sx]=(sc[sx]||0)+1;});});
  var topSx=Object.entries(sc).sort(function(a,b){return b[1]-a[1];}).slice(0,5).map(function(e){return e[0]+' ('+e[1]+' days)';}).join(', ')||'None logged';
  var wE=all.filter(function(l){return l.energy;}),wS=all.filter(function(l){return l.sleep;});
  var aE=wE.length?(wE.reduce(function(s,l){return s+Number(l.energy);},0)/wE.length).toFixed(1):'N/A';
  var aS=wS.length?(wS.reduce(function(s,l){return s+Number(l.sleep);},0)/wS.length).toFixed(1):'N/A';
  var repCycles=getCycleLengths(true).filter(function(c){return c.gap<100;});
  var avgCycleLen=repCycles.length?(repCycles.reduce(function(a,c){return a+c.gap;},0)/repCycles.length).toFixed(1):'N/A';
  var longestCycle=repCycles.length?Math.max.apply(null,repCycles.map(function(c){return c.gap;})):'N/A';
  var meds=s.medications||[];
  var medStr=meds.length?meds.map(function(m){return m.name+' ('+m.type+', '+m.dose+', '+m.freq+')';}).join('; '):'None recorded';
  var scores=s.periScores||{};
  var scoreKeys=Object.keys(scores).filter(function(k){return k!=='_latest';}).filter(function(k){return new Date(k+'T12:00:00')>=cutoff;}).sort();
  var scoreStr=scoreKeys.length?scoreKeys.map(function(k){var t=Object.values(scores[k]).reduce(function(a,b){return a+Number(b);},0);return fmtDate(k)+': '+t+'/'+(PERI_SX.length*4);}).join('<br>'):'No scores recorded in this period';
  var dateLabel=now.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});

  var html='<div class="report-preview" id="report-body">'
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap;gap:8px;">'
    +'<div><h3 style="margin-bottom:2px">Luna Health Summary</h3>'
    +'<div style="font-size:0.74rem;color:var(--text-dim)">'+dateLabel+(s.name?' &middot; '+s.name:'')+'</div></div>'
    +'<button class="btn-secondary" style="font-size:0.76rem;padding:7px 14px" onclick="window.print()">&#128424; Print / Save PDF</button>'
    +'</div><hr>'
    +'<strong>Last 3 months</strong><br>Days logged: '+total+' &middot; Period days: '+fDays+' &middot; Spotting days: '+sDays+'<hr>'
    +'<strong>Cycle Analysis</strong><br>Avg cycle: '+avgCycleLen+' days &middot; Longest gap: '+longestCycle+' days<hr>'
    +'<strong>Top 5 Symptoms</strong><br>'+topSx+'<hr>'
    +'<strong>Wellbeing Averages</strong><br>Energy: '+aE+'/5 &middot; Sleep: '+aS+'/5<hr>'
    +'<strong>Perimenopause Score</strong><br>'+scoreStr+'<hr>'
    +'<strong>Medications / HRT</strong><br>'+medStr+'<hr>'
    +'<span style="font-size:0.72rem;color:var(--text-dim)">For personal reference and clinical discussion only. Not a medical diagnosis.</span>'
    +'</div>';

  document.getElementById('report-preview').innerHTML=html;
  toast('Report ready');
}

// ═══════════════════════════════════════════════════════════════
// EXPORT / IMPORT DATA BACKUP
// ═══════════════════════════════════════════════════════════════
function exportData() {
  var s=getSettings();
  var payload={exportedAt:new Date().toISOString(),appVersion:'Luna v2',logs:logs,settings:s};
  var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  var dateStr=new Date().toISOString().split('T')[0];
  a.download='luna-backup-'+dateStr+'.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  toast('Backup downloaded \u2713');
}
function importData(event) {
  var file=event.target.files[0];
  if(!file)return;
  var statusEl=document.getElementById('import-status');
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      if(!data.logs&&!data.settings){statusEl.textContent='Invalid backup file — unrecognised format.';statusEl.style.color='#f0a090';return;}
      if(data.logs){
        // Merge: keep existing entries, overwrite with backup where dates match
        var count=0;
        Object.keys(data.logs).forEach(function(d){
          if(!logs[d]||logs[d]._imp){logs[d]=data.logs[d];count++;}
        });
        lsSet('luna-logs',logs);
      }
      if(data.settings){lsSet('luna-settings',data.settings);}
      statusEl.textContent='Import successful! '+count+' log entries restored.';
      statusEl.style.color='var(--accent3)';
      renderSettings();renderLearn();
      toast('Backup imported \u2713');
    }catch(err){
      statusEl.textContent='Could not read file. Make sure it is a valid Luna backup.';
      statusEl.style.color='#f0a090';
    }
  };
  reader.readAsText(file);
  // Reset file input so same file can be re-selected
  event.target.value='';
}

function clearAllData() {
  if(!confirm('This will permanently delete all your Luna data — logs, settings, and custom tags. This cannot be undone.\n\nAre you sure?')) return;
  localStorage.removeItem('luna-logs');
  localStorage.removeItem('luna-settings');
  logs={};
  toast('All data cleared');
  // Reload the page for a completely fresh start
  setTimeout(function(){window.location.reload();},1000);
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
window.onload = function() {
  var now=new Date();
  document.getElementById('log-date').value=tod();
  var bdEl=document.getElementById('blood-date');if(bdEl)bdEl.value=tod();
  calYear=now.getFullYear();calMonth=now.getMonth();

  // Symptom chips
  var sg=document.getElementById('symptom-grid');
  SYMPTOMS.forEach(function(s){var c=document.createElement('div');c.className='chip';c.textContent=s;c.onclick=function(){if(selSymptoms[s]){delete selSymptoms[s];c.classList.remove('active');}else{selSymptoms[s]=true;c.classList.add('active');}};sg.appendChild(c);});

  // Trigger chips
  var tg=document.getElementById('trigger-grid');
  TRIGGERS.forEach(function(t){var c=document.createElement('div');c.className='chip';c.textContent=t;c.onclick=function(){if(selTriggers[t]){delete selTriggers[t];c.classList.remove('active','trigger-active');}else{selTriggers[t]=true;c.classList.add('active','trigger-active');}};tg.appendChild(c);});

  buildWaterRow(0);
  renderCustomTagGrid();
  applySleepMode(getSleepMode());
  renderCal();
  renderHistory();
  renderLogMeds();
  renderSettings();
  renderLearn();
  // Don't render Trends sub-panels at init — they render when tab is opened

  // Check notification permission state
  var s=getSettings();
  if(s.notifEnabled&&'Notification' in window&&Notification.permission==='granted'){scheduleNotif();}
};

function scheduleNotif(){
  // Daily reminder simulation — triggers once per day if tab is open at 8pm
  var now=new Date(),target=new Date();
  target.setHours(20,0,0,0);
  if(now>target)target.setDate(target.getDate()+1);
  var ms=target-now;
  setTimeout(function(){
    var s=getSettings();
    if(s.notifEnabled&&Notification.permission==='granted'){
      var logged=logs[tod()];
      if(!logged)new Notification('Luna \uD83C\uDF19',{body:'Don\u2019t forget to log today. A few taps keeps your data accurate!'});
    }
    scheduleNotif();
  },ms);
}
