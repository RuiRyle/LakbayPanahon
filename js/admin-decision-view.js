const decisionDate = new Intl.DateTimeFormat('en-PH', {dateStyle:'long',timeZone:'Asia/Manila'});
const decisionTime = new Intl.DateTimeFormat('en-PH', {timeStyle:'short',timeZone:'Asia/Manila'});

export function accountStatusLabel(status) {
    return {active:'Active',pending:'Pending',inactive:'Inactive'}[status] || 'Unavailable';
}

function hasClearAccessOutcome(record) {
    return record.previousStatus !== record.status && ['active','inactive'].includes(record.status);
}

export function describeAdminDecision(record, review) {
    if (review) return {
        label:{approved:'Qualifications approved',declined:'Application declined',needs_changes:'Changes requested'}[review.decision],
        tone:{approved:'active',declined:'inactive',needs_changes:'review'}[review.decision],
        type:'review', workflow:'Teacher qualification review'
    };
    if (hasClearAccessOutcome(record)) return {
        label:record.status === 'active' ? 'Access activated' : 'Access deactivated',
        tone:record.status, type:record.status, workflow:'Account access'
    };
    return {label:'Review decision recorded',tone:'review',type:'review',workflow:'Review outcome unavailable'};
}

export function decisionAccessSummary(record) {
    const previous = accountStatusLabel(record.previousStatus);
    const result = accountStatusLabel(record.status);
    if (previous === 'Unavailable' || result === 'Unavailable') return 'Account status unavailable';
    return previous === result ? 'Access stayed ' + result.toLowerCase() : previous + ' → ' + result;
}

export function mountDecisionRecords(host, initialRecords, {
    moreAvailable=false,onHistory=()=>{},isCurrent=()=>true,resolveAccount=null,resolveReview=null,
    resolveDetails=null,initialRecordId=null
}={}) {
    const mountToken = Symbol('decision-view');
    host.decisionMount = mountToken;
    const current = () => isCurrent() && host.decisionMount === mountToken;
    const profiles = new Map();
    const reviews = new Map();
    const restored = host.decisionState;
    const pageSize = 5;
    let records = initialRecords;
    let page = restored?.page ?? Math.max(0,Math.floor(records.findIndex(record=>record.id===initialRecordId)/pageSize));
    let selected = restored ? restored.selected : initialRecordId;
    let filtered = [];
    let activeRow = null;
    let resolving = false;
    let detailsRequest = 0;
    let focusInitial = !restored && Boolean(initialRecordId);

    host.replaceChildren();
    host.className = 'decision-workspace';
    const el = (tag,value,parent,cls) => {
        const node = document.createElement(tag);
        if (value !== null) node.textContent = value;
        if (cls) node.className = cls;
        parent?.append(node);
        return node;
    };
    const action = record => describeAdminDecision(record,reviews.get(record.id));
    const identity = record => {
        const profile = profiles.get(record.userId);
        const name = [profile?.firstName,profile?.lastName].filter(Boolean).join(' ');
        const studentId = profile?.role === 'student' && /^LP-[A-F0-9]{12}$/.test(profile.studentId || '') ? profile.studentId : '';
        return {
            name:name || profile?.email || studentId || record.userId || 'Account unavailable',
            contact:profile?.email || studentId,
            role:{teacher:'Teacher',student:'Student'}[profile?.role] || '',
            initials:name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>Array.from(part)[0]).join('').toUpperCase() || 'ID'
        };
    };
    const savedDate = record => {
        try {
            const date = record.createdAt.toDate();
            return Number.isFinite(date.getTime()) ? date : null;
        } catch { return null; }
    };
    const dayLabel = date => date ? decisionDate.format(date) : 'Date unavailable';
    const savedTime = (record,parent,full=false) => {
        const date = savedDate(record);
        const label = date ? (full ? dayLabel(date) + ' · ' : '') + decisionTime.format(date) : 'Time unavailable';
        const time = el('time',label,parent,full?'decision-detail-date':'decision-row-date');
        if (date) time.dateTime = date.toISOString();
        return time;
    };
    const badge = (record,parent) => {
        const outcome = action(record);
        const item = el('span',outcome.label,parent,'decision-badge');
        item.dataset.tone = outcome.tone;
        return item;
    };

    const banner = el('header',null,host,'decision-banner');
    el('h1','Decision Records',banner);
    el('p','Track the reviews and account changes you’ve saved.',banner);
    const list = el('section',null,host,'decision-list-panel');
    const header = el('header',null,list,'decision-panel-header');
    const heading = el('div',null,header);
    el('h3','Recent activity',heading);
    const scope = el('p','Shows up to 10 of your decisions, newest first. Times are in the Philippines.',heading,'decision-scope');
    scope.id = 'adminDecisionListScope';
    const exportButton = el('button','Export CSV',header,'decision-export');
    exportButton.type = 'button';

    const filters = el('div',null,list,'decision-filters');
    filters.setAttribute('role','group');
    filters.setAttribute('aria-label','Find recent decisions');
    filters.setAttribute('aria-describedby',scope.id);
    const searchLabel = el('label','Search records',filters);
    const search = el('input',null,searchLabel);
    search.type = 'search';
    search.placeholder = 'Name, email, ID, reason';
    search.maxLength = 200;
    const advanced = el('details',null,filters,'decision-advanced');
    el('summary','Filters',advanced);
    const advancedFields = el('div',null,advanced,'decision-advanced-fields');
    const filter = (label, options) => {
        const select = el('select',null,el('label',label,advancedFields));
        for (const [value,title] of options) el('option',title,select).value = value;
        return select;
    };
    const type = filter('Action',[['all','All actions'],['active','Access activated'],['inactive','Access deactivated'],['review','Review decisions']]);
    const role = filter('Current role',[['all','All roles'],['Teacher','Teachers'],['Student','Students']]);
    const date = filter('Saved date',[['all','All dates'],['7','Last 7 days'],['30','Last 30 days']]);
    const reset = el('button','Clear filters',advancedFields,'decision-reset');
    reset.type = 'button';

    if (restored) {
        search.value = restored.search;
        type.value = restored.type;
        role.value = restored.role;
        date.value = restored.date;
        advanced.open = restored.advanced;
    }

    const status = el('p','',list,'decision-identity-scope');
    status.setAttribute('role','status');
    const table = el('div',null,list,'decision-table');
    const footer = el('div',null,list,'decision-pagination');
    const count = el('span','',footer);
    count.setAttribute('role','status');
    const buttons = el('div',null,footer,'decision-page-buttons');
    const previous = el('button','Previous',buttons);
    const next = el('button','Next',buttons);
    previous.type = next.type = 'button';

    const detail = el('section',null,null,'decision-detail-panel');
    detail.id = 'adminDecisionDetail';
    detail.setAttribute('aria-label','Selected decision details');

    function saveView() {
        host.decisionState = {search:search.value,type:type.value,role:role.value,date:date.value,advanced:advanced.open,page,selected};
    }

    function openDetail(record, row, focus=false) {
        activeRow?.setAttribute('aria-expanded','false');
        activeRow?.removeAttribute('aria-controls');
        activeRow = row;
        row.setAttribute('aria-expanded','true');
        row.setAttribute('aria-controls',detail.id);
        detail.replaceChildren();
        row.after(detail);
        const account = identity(record);
        const detailHeader = el('div',null,detail,'decision-detail-header');
        const title = el('h4','Decision details',detailHeader,'decision-detail-title');
        title.tabIndex = -1;
        const close = el('button','Close details',detailHeader,'decision-detail-back');
        close.type = 'button';
        close.addEventListener('click',()=>{
            if (!current()) return;
            clearSelection();
            saveView();
            row.focus();
        });
        const change = el('div',null,detail,'decision-access');
        const changeCopy = el('div',null,change);
        el('span','Account access at the time',changeCopy,'decision-field-label');
        el('strong',decisionAccessSummary(record),changeCopy);
        savedTime(record,change,true);
        const reason = el('section',null,detail,'decision-reason');
        el('h4','Saved reason',reason);
        el('p',record.reason || 'No reason was recorded.',reason);

        const detailActions = el('div',null,detail,'decision-detail-actions');
        const history = el('button','Open account history',detailActions,'decision-history');
        history.type = 'button';
        history.disabled = !record.userId;
        history.addEventListener('click',()=>{if(current() && record.userId)onHistory(record);});
        const audit = el('details',null,detailActions,'decision-audit');
        el('summary','Audit details',audit);
        const fields = el('dl',null,audit,'decision-fields');
        const review = reviews.get(record.id);
        for (const [label,value] of [
            ['Record type',action(record).workflow],['Current role',account.role || 'Unavailable'],
            ['Application revision',review && String(review.revision)],['Administrator ID',record.actorId || 'Unavailable'],
            ['Account ID',record.userId || 'Unavailable'],['Record ID',record.id || 'Unavailable']
        ]) {
            if (value) { el('dt',label,fields);el('dd',value,fields); }
        }
        if (focus) focusDetail();
    }
    function focusDetail() {
        const title = detail.querySelector('.decision-detail-title');
        title.focus({preventScroll:true});
        title.scrollIntoView({block:'nearest'});
    }

    function clearSelection() {
        selected = null;
        activeRow?.setAttribute('aria-expanded','false');
        activeRow?.removeAttribute('aria-controls');
        activeRow = null;
        detail.remove();
    }

    function detailDependentFilters() {
        return (resolveAccount||resolveDetails) && (search.value.trim() || role.value!=='all')
            || (resolveReview||resolveDetails) && type.value!=='all';
    }
    function draw(keepSelected=false) {
        if (!current()) return;
        const term = search.value.trim().toLocaleLowerCase();
        const now = Date.now();
        reset.hidden = !term && [type,role,date].every(control=>control.value==='all');
        if (resolving && detailDependentFilters()) {
            table.replaceChildren();
            count.textContent = '';
            buttons.hidden = exportButton.disabled = true;
            saveView();
            return;
        }
        filtered = records.filter(record=>{
            const account = identity(record);
            const outcome = action(record);
            const saved = savedDate(record)?.getTime();
            return (type.value==='all' || type.value===outcome.type)
                && (role.value==='all' || role.value===account.role)
                && (date.value==='all' || saved<=now && saved>=now-Number(date.value)*86400000)
                && [account.name,account.contact,account.role,record.userId,record.id,record.reason,outcome.label,record.status]
                    .some(value=>String(value||'').toLocaleLowerCase().includes(term));
        });
        if (keepSelected && selected) {
            const index = filtered.findIndex(record=>record.id===selected);
            if (index>=0) page=Math.floor(index/pageSize);
        }
        page = Math.min(page,Math.max(0,Math.ceil(filtered.length/pageSize)-1));
        const offset = page*pageSize;
        const visible = filtered.slice(offset,offset+pageSize);
        if (!visible.some(record=>record.id===selected)) clearSelection();
        table.replaceChildren();
        let group;
        let day;
        for (const record of visible) {
            const date = dayLabel(savedDate(record));
            if (date !== day) {
                group = el('ol',null,table,'decision-day');
                group.setAttribute('role','list');
                group.setAttribute('aria-label',date);
                const groupTitle = el('h4',date,null,'decision-day-title');
                group.before(groupTitle);
                day = date;
            }
            const account = identity(record);
            const card = el('li',null,group,'decision-entry');
            const row = el('button',null,card,'decision-row');
            row.type = 'button';
            row.dataset.recordId = record.id;
            row.setAttribute('aria-expanded','false');
            row.setAttribute('aria-label',action(record).label+' for '+account.name);
            const person = el('span',null,row,'decision-row-account');
            el('span',account.initials,person,'decision-avatar').setAttribute('aria-hidden','true');
            const copy = el('span',null,person,'decision-row-name');
            el('strong',account.name,copy);
            if (account.contact && account.contact !== account.name) el('small',account.contact,copy);
            const outcome = el('span',null,row,'decision-row-outcome');
            badge(record,outcome);
            if (record.reason) el('small',record.reason,outcome,'decision-row-reason');
            const timing = el('span',null,row,'decision-row-timing');
            savedTime(record,timing);
            el('span','›',timing,'decision-row-chevron').setAttribute('aria-hidden','true');
            row.addEventListener('click',()=>{
                if (!current()) return;
                if (selected===record.id) clearSelection();
                else { selected=record.id;openDetail(record,row,true); }
                saveView();
            });
            if (selected===record.id) openDetail(record,row);
        }
        if (!filtered.length) el('p',records.length?'No records match your search or filters.':'Your saved reviews and account changes will appear here.',table,'decision-empty');
        count.textContent = filtered.length ? (offset+1)+'–'+Math.min(offset+pageSize,filtered.length)+' of '+filtered.length+(filtered.length===1?' record':' records') : '0 records';
        buttons.hidden = filtered.length <= pageSize;
        previous.disabled = page===0;
        next.disabled = offset+pageSize>=filtered.length;
        exportButton.disabled = resolving || !filtered.length;
        saveView();
        if (focusInitial && !resolving) {
            focusInitial = false;
            if (detail.isConnected) focusDetail();
        }
    }

    function filterChanged() { page=0;draw(); }
    search.addEventListener('input',filterChanged);
    for (const control of [type,role,date]) control.addEventListener('change',filterChanged);
    advanced.addEventListener('toggle',()=>{if(current())saveView();});
    reset.addEventListener('click',()=>{
        search.value='';
        type.value=role.value=date.value='all';
        filterChanged();
        search.focus();
    });
    for (const [button, direction] of [[previous,-1],[next,1]]) button.addEventListener('click',()=>{
        if (!current() || button.disabled) return;
        page+=direction;
        draw();
        (button.disabled ? table.querySelector('.decision-row') : button)?.focus({preventScroll:!button.disabled});
    });

    exportButton.addEventListener('click',()=>{
        if (!current() || exportButton.disabled) return;
        const cell = value => '"'+String(value??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
        const rows = [['Record ID','Account ID','Workflow','Application revision','Action','Previous status','New status','Administrator ID','Date (PH)','Reason']];
        for (const record of filtered) {
            const outcome = action(record);
            const date = savedDate(record);
            rows.push([record.id,record.userId,outcome.workflow,reviews.get(record.id)?.revision,outcome.label,record.previousStatus,record.status,record.actorId,date ? dayLabel(date)+' '+decisionTime.format(date) : 'Date unavailable',record.reason]);
        }
        const csv = new Blob(['\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
        const url = URL.createObjectURL(csv);
        const link = document.createElement('a');
        link.href=url;
        link.download='lakbaypanahon-decision-records.csv';
        link.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
    });

    const more = el('p','Open an account’s history for older decisions.',list,'decision-more-note');
    function redraw() {
        const focused = document.activeElement;
        const focusedId = focused?.closest('.decision-row')?.dataset.recordId;
        const focusedInDetail = detail.contains(focused);
        const controlIndex = [...detail.querySelectorAll('button,summary')].indexOf(focused);
        const auditOpen = detail.querySelector('.decision-audit')?.open;
        draw(true);
        if (auditOpen && detail.isConnected) detail.querySelector('.decision-audit').open=true;
        if (focusedInDetail) (detail.isConnected
            ? detail.querySelectorAll('button,summary')[controlIndex] || detail.querySelector('.decision-detail-title')
            : search).focus({preventScroll:true});
        if (focusedId) ([...table.querySelectorAll('.decision-row')].find(row=>row.dataset.recordId===focusedId)||search).focus({preventScroll:true});
    }
    function update(nextRecords, hasMore, initial=false) {
        if (!current()) return;
        records=nextRecords;
        more.hidden=!hasMore;
        const request=++detailsRequest;
        const userIds=[...new Set(records.map(record=>record.userId).filter(Boolean))];
        const unresolvedUsers=(resolveAccount||resolveDetails) ? userIds.filter(uid=>!profiles.has(uid)) : [];
        const unresolvedReviews=(resolveReview||resolveDetails) ? records.filter(record=>!reviews.has(record.id)) : [];
        resolving=Boolean(unresolvedUsers.length||unresolvedReviews.length);
        if (!resolving) {
            status.textContent='';
            redraw();
            return;
        }
        status.textContent=initial?'Loading account details…':'';
        if (initial || !detailDependentFilters()) redraw();
        else exportButton.disabled=true;
        const enrichAccount = async uid => {
            try {const result=await resolveAccount(uid);return [uid,result?.profile||result];} catch {return [uid,null];}
        };
        const enrichReview = async record => {
            try {return [record.id,await resolveReview(record)];} catch {return [record.id,null];}
        };
        const details=resolveDetails
            ? resolveDetails(unresolvedUsers,unresolvedReviews)
            : Promise.all([Promise.all(unresolvedUsers.map(enrichAccount)),Promise.all(unresolvedReviews.map(enrichReview))])
                .then(([profiles,reviews])=>({profiles,reviews}));
        details.catch(()=>({profiles:[],reviews:[]})).then(resolved=>{
            if (!current() || request!==detailsRequest) return;
            resolving = false;
            for (const [uid,profile] of resolved.profiles) profiles.set(uid,profile);
            for (const [id,review] of resolved.reviews) reviews.set(id,review);
            for (const uid of profiles.keys()) if (!userIds.includes(uid)) profiles.delete(uid);
            const visibleIds=new Set(records.map(record=>record.id));
            for (const id of reviews.keys()) if (!visibleIds.has(id)) reviews.delete(id);
            status.textContent = (resolveAccount||resolveDetails) && userIds.some(uid=>!profiles.get(uid))
                ? 'Account IDs are shown where names are unavailable.' : '';
            redraw();
        });
    }
    update(initialRecords,moreAvailable,true);
    return {update};
}
