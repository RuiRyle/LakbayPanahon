// Presentation of the administrator-owned snapshot; never invent account identities.
export function mountDecisionRecords(host, records, {moreAvailable=false,onHistory=()=>{},isCurrent=()=>true,resolveAccount=null,resolveReview=null}={}) {
    const mountToken=Symbol('decision-view');host.decisionMount=mountToken;const current=()=>isCurrent()&&host.decisionMount===mountToken;const profiles=new Map(),reviews=new Map();
    host.replaceChildren();host.className='decision-workspace';
    const el=(tag,value,parent,cls)=>{const n=document.createElement(tag);if(value!==null&&value!==undefined)n.textContent=value;if(cls)n.className=cls;parent?.append(n);return n;};
    const accountIdentity=r=>{const p=profiles.get(r.userId);return {name:p?[p.firstName,p.lastName].filter(Boolean).join(' ')||p.email||r.userId:r.userId||'Account unavailable',email:p?.email||'Account ID: '+(r.userId||'Unavailable'),role:p?.role==='teacher'?'Teacher':p?.role==='student'?'Student':'Not available'};};
    const initials=r=>{const p=profiles.get(r.userId);return p?[p.firstName,p.lastName].filter(Boolean).map(n=>Array.from(n)[0]).slice(0,2).join('').toUpperCase()||'ID':'ID';};
    const qualification=r=>reviews.get(r.id);
    const workflow=r=>qualification(r)?'Teacher qualification review':r.previousStatus===r.status?'Review outcome unavailable':'Account access';
    const action=r=>qualification(r)?({approved:'Qualifications approved',declined:'Application declined',needs_changes:'Changes requested'}[qualification(r).decision]):r.previousStatus===r.status?'Recorded review':r.status==='active'?'Access activated':r.status==='inactive'?'Access deactivated':'Access changed';
    const tone=r=>r.previousStatus===r.status?'review':r.status==='active'?'active':r.status==='inactive'?'inactive':'review';
    const date=r=>{try{return new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(r.createdAt.toDate());}catch{return 'Date unavailable';}};
    const banner=el('header',null,host,'decision-banner');
    el('span','ADMINISTRATION ARCHIVE',banner,'decision-banner-kicker');
    el('h2','Decision Records',banner);
    el('p','Review saved decisions for teacher qualifications and account access.',banner);
    const landscape=el('div',null,banner,'decision-banner-landscape');landscape.setAttribute('aria-hidden','true');
    landscape.innerHTML='<svg viewBox="0 0 400 120" focusable="false"><g stroke="#e1c16f" opacity=".25"><path d="M220 110 100 0m120 110L155 0m65 110L200 0m20 110L245 0m-25 110L300 0m-80 110L370 25"/></g><circle cx="220" cy="110" r="45" fill="#e0bc65" opacity=".7"/><path d="M0 120V100l60-30 80 25 95-35 85 35 80-20v45Z" fill="#21435d"/><path d="m0 120 100-25 80 20 110-28 110 20v13Z" fill="#0c263e"/><g fill="#173b55" stroke="#6e8da5" opacity=".65"><path d="M337 120V53h28v67m-33-67 19-20 19 20ZM346 33V23h10v10m-5-10V13m-4 107v-23a4 4 0 0 1 8 0v23m-8-52v14h8V68a4 4 0 0 0-8 0Z"/></g></svg>';
    const summary=el('div',null,host,'decision-summary');
    const statIcons={total:'M12 3 2 8l10 5 10-5-10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',active:'m5 12 4 4L19 6',inactive:'m6 6 12 12M18 6 6 18',review:'M12 8v5m0 3v1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18'};
    for(const [label,value,kind,note]of [['Loaded records',records.length,'total','Your saved decisions'],['Access activated',records.filter(r=>tone(r)==='active').length,'active','Account access granted'],['Access deactivated',records.filter(r=>tone(r)==='inactive').length,'inactive','Account access restricted'],['Other reviews',records.filter(r=>tone(r)==='review').length,'review','Qualification and other saved reviews']]){
        const card=el('div',null,summary,'decision-stat');card.dataset.tone=kind;const icon=el('span',null,card,'decision-stat-icon');icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24"><path d="'+statIcons[kind]+'"/></svg>';const copy=el('div',null,card);el('strong',String(value),copy);el('span',label,copy);el('small',note,copy);
    }
    el('p','Your account-access decisions · up to 10 loaded in document order'+(moreAvailable?' · more records available through account history.':'.')+' Summary and filters apply to this loaded snapshot.',host,'decision-scope');
    const layout=el('div',null,host,'decision-layout'),list=el('section',null,layout,'decision-list-panel'),detail=el('section',null,layout,'decision-detail-panel');
    detail.setAttribute('aria-label','Selected decision details');detail.setAttribute('aria-live','polite');
    const header=el('header',null,list,'decision-panel-header');el('h3','All Decision Records',header);
    const exportButton=el('button','↓ Export',header,'decision-export');exportButton.type='button';exportButton.textContent='Export CSV';
    const filters=el('div',null,list,'decision-filters');
    const searchLabel=el('label','Search records',filters),search=el('input',null,searchLabel);search.type='search';search.placeholder='Name, email, account ID or reason';search.setAttribute('aria-label','Search loaded decision records');search.maxLength=200;
    const actionLabel=el('label','Action',filters),select=el('select',null,actionLabel);
    for(const [value,label]of [['all','All actions'],['active','Activated'],['inactive','Deactivated'],['review','Other reviews']]){const option=el('option',label,select);option.value=value;}
    const roleLabel=el('label','Current role',filters),roleSelect=el('select',null,roleLabel);for(const [value,label]of [['all','All roles'],['Teacher','Teachers'],['Student','Students']]){const option=el('option',label,roleSelect);option.value=value;}
    const dateLabel=el('label','Saved date',filters),dateSelect=el('select',null,dateLabel);for(const [value,label]of [['all','All dates'],['7','Last 7 days'],['30','Last 30 days']]){const option=el('option',label,dateSelect);option.value=value;}
    const reset=el('button','Reset filters',list,'decision-reset');reset.type='button';reset.hidden=true;
    const table=el('div',null,list,'decision-table');table.setAttribute('role','list');table.setAttribute('aria-label','Decision records');
    const footer=el('div',null,list,'decision-pagination'),count=el('span','',footer),previous=el('button','← Previous',footer),next=el('button','Next →',footer);previous.type=next.type='button';previous.textContent='Previous';next.textContent='Next';
    let page=0,selected=null,filtered=[];
    function details(record){
        detail.replaceChildren();el('h3','Decision details',detail,'decision-detail-title');
        if(!record){el('div','\u25c7',detail,'decision-detail-empty-icon').setAttribute('aria-hidden','true');el('h4','Choose a record',detail);el('p','Select a decision to see its status change, reason and saved audit details.',detail);return;}
        const identity=el('div',null,detail,'decision-identity');el('span','ID',identity,'decision-avatar').setAttribute('aria-hidden','true');const name=el('div',null,identity);el('h4',accountIdentity(record).name,name);el('p',accountIdentity(record).email,name,'decision-account-id');identity.querySelector('.decision-avatar').textContent=initials(record);
        const badge=el('span',action(record),detail,'decision-badge');badge.dataset.tone=tone(record);
        const fields=el('dl',null,detail,'decision-fields');
        for(const [label,value]of [['Workflow',workflow(record)],['Application revision',qualification(record)?String(qualification(record).revision):'Not applicable or unavailable'],['Current role',accountIdentity(record).role],['Action',action(record)],['Previous status',record.previousStatus||'Unavailable'],['New status',record.status||'Unavailable'],['Decided by',record.actorId||'Unavailable'],['Date & time',date(record)+' (PH)'],['Record ID',record.id||'Unavailable']]){el('dt',label,fields);el('dd',value,fields);}
        const reason=el('section',null,detail,'decision-reason');el('h4','Reason for decision',reason);el('p',record.reason||'No reason available in this record.',reason);
        const history=el('button','↶ View full account history',detail,'decision-history');history.textContent='View full account history';history.type='button';history.disabled=!record.userId;
        history.addEventListener('click',()=>{if(current()&&record.userId)onHistory(record);});
    }
    function draw(){
        if(!current())return;
        const term=search.value.trim().toLocaleLowerCase();
        filtered=records.filter(r=>{let saved=NaN;try{saved=r.createdAt.toDate().getTime();}catch{}return(select.value==='all'||tone(r)===select.value)&&(roleSelect.value==='all'||accountIdentity(r).role===roleSelect.value)&&(dateSelect.value==='all'||Number.isFinite(saved)&&saved<=Date.now()&&saved>=Date.now()-Number(dateSelect.value)*86400000)&&[accountIdentity(r).name,accountIdentity(r).email,action(r),workflow(r),qualification(r)?.decision,r.userId,r.reason,r.actorId,r.status].some(value=>String(value||'').toLocaleLowerCase().includes(term));});
        reset.hidden=!term&&select.value==='all'&&roleSelect.value==='all'&&dateSelect.value==='all';
        page=Math.min(page,Math.max(0,Math.ceil(filtered.length/5)-1));table.replaceChildren();
        const headings=el('div',null,table,'decision-table-heading');for(const title of ['Account / Applicant','Action','Role','Saved (PH)',''])el('span',title,headings);
        for(const record of filtered.slice(page*5,page*5+5)){
            const row=el('button',null,table,'decision-row');row.type='button';row.setAttribute('aria-pressed',String(selected===record));row.setAttribute('aria-label',action(record)+' for account '+record.userId);
            const account=el('span',null,row,'decision-row-account');el('span','ID',account,'decision-avatar').setAttribute('aria-hidden','true');const copy=el('span',null,account);el('strong',accountIdentity(record).name,copy);el('small',accountIdentity(record).email,copy);account.querySelector('.decision-avatar').textContent=initials(record);
            const badge=el('span',action(record),row,'decision-badge');badge.dataset.tone=tone(record);el('span',accountIdentity(record).role,row,'decision-row-role');el('span',date(record),row,'decision-row-date');el('span','\u203a',row,'decision-row-chevron').setAttribute('aria-hidden','true');
            row.addEventListener('click',()=>{if(!current())return;selected=record;draw();details(record);table.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});});
        }
        if(!filtered.length)el('p',records.length?'No records match these filters.':'No account-access decisions have been recorded by your administrator account.',table,'decision-empty');
        count.setAttribute('role','status');count.textContent=filtered.length?'Showing '+(page*5+1)+' - '+Math.min(page*5+5,filtered.length)+' of '+filtered.length+' loaded':'0 records';previous.disabled=page===0;next.disabled=(page+1)*5>=filtered.length;exportButton.disabled=!filtered.length;
        if(selected&&!filtered.includes(selected)){selected=null;details(null);}
    }
    search.addEventListener('input',()=>{page=0;draw();});select.addEventListener('change',()=>{page=0;draw();});roleSelect.addEventListener('change',()=>{page=0;draw();});dateSelect.addEventListener('change',()=>{page=0;draw();});reset.addEventListener('click',()=>{search.value='';select.value=roleSelect.value=dateSelect.value='all';page=0;draw();search.focus();});previous.addEventListener('click',()=>{page--;draw();});next.addEventListener('click',()=>{page++;draw();});
    exportButton.addEventListener('click',()=>{
        if(!current()||!filtered.length)return;
        const cell=value=>'"'+String(value??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
        const rows=[['Record ID','Account ID','Workflow','Application revision','Action','Previous status','New status','Administrator ID','Date (PH)','Reason'],...filtered.map(r=>[r.id,r.userId,workflow(r),qualification(r)?.revision||'',action(r),r.previousStatus,r.status,r.actorId,date(r),r.reason])];
        const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
        const a=document.createElement('a');a.href=url;a.download='lakbaypanahon-loaded-decision-records.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    details(null);draw();
    if(resolveAccount||resolveReview){const status=el('p','Loading account identities and paired review records...',host,'decision-identity-scope');status.setAttribute('role','status');Promise.all([
        ...(resolveAccount?[...new Set(records.map(r=>r.userId).filter(Boolean))].map(async uid=>{try{const result=await resolveAccount(uid);if(current())profiles.set(uid,result.profile||result);}catch{}}):[]),
        ...(resolveReview?records.map(async record=>{try{const review=await resolveReview(record);if(current()&&review)reviews.set(record.id,review);}catch{}}):[])
    ]).then(()=>{if(!current())return;status.textContent='Names, emails and roles reflect current account profiles. Saved decisions and reasons remain unchanged. Qualification outcomes are shown only when a matching review record is available. '+(records.some(r=>!profiles.has(r.userId))?'Some profiles are unavailable; their account IDs are shown.':'');draw();details(selected);});}

}
