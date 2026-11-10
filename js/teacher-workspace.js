import {appConfirm} from './app-dialog.js';
async function confirmAdditionalReview(duplicates){return (await appConfirm(new Set(duplicates.map(row=>row.userId)).size+' selected student(s) already have a published review for this mission. Passing practice does not close a review. Create an additional review round? Existing reviews and explanations will be kept.'));}
import {auth} from './firebase-config.js';
import {renderTeacherHelp,renderTeacherReflectionQueue} from './student-feedback.js';
import {onAuthStateChanged,sendPasswordResetEmail,updateProfile} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {assignmentDueInput, assignmentProgressState, publishedDetails, assignmentDueMillis,publicationVersion,reviewLearningStages,reviewInterventionSummary} from './teacher-class-policy.js';
import {followupQuizEvidence,quizSupportSignals,quizSupportLabel} from './teacher-support-policy.js';
import {summarizeQuizTopics} from './teacher-quiz-insights.js';
import {learningEvidenceGuide,learningReportRows,classroomReportRows,downloadLearningReport,printLearningReport} from './teacher-report-export.js';
import {loadTeacherAccountSettings,saveTeacherAccountAvatar,newTeacherPublicationId,loadTeacherDashboard,loadTeacherClasses, createTeacherClass, editTeacherClass, setTeacherClassStatus, rotateTeacherCode, loadTeacherClass,loadTeacherClassRoster,loadTeacherStudentBatch, loadTeacherStudent, loadTeacherRosterNames, loadTeacherMissions, loadTeacherAssignmentProgress, saveTeacherPublication,createTeacherReviews,loadTeacherReadiness, loadTeacherFeedback, sendTeacherFeedback, loadTeacherSupportNotes, saveTeacherSupportNote, removeTeacherClassMember} from './teacher-class-client.js?v=20261105-class-management';

const $ = id => document.getElementById(id);
function clearStudentReport(){const report=$('studentReport');report.replaceChildren();document.body.classList.remove('student-report-focused');delete report.dataset.userId;for(const row of document.querySelectorAll('#teacherRoster tr[data-user-id]')){row.dataset.reportOpen='false';row.querySelector('button[data-report-open]')?.setAttribute('aria-expanded','false');}}
const teacherRoutes = {overview:'teacher-dashboard.html',classes:'teacher-classes.html',students:'teacher-students.html',announcements:'teacher-announcements.html',assignments:'teacher-assignments.html',settings:'teacher-settings.html'};
const routeName = document.body.dataset.teacherPage || 'overview';
const routeParameters = new URLSearchParams(location.search);
const classroomDetailPage=location.pathname.endsWith('/teacher-classroom.html');
if(classroomDetailPage)document.body.classList.add('classroom-detail-page');
else if(routeName==='classes')document.body.classList.add('classroom-directory-page');
function classroomURL(id){const url=new URL('teacher-classroom.html',location.href);url.searchParams.set('class',id);return url.href;}
function goToClassroom(id){const link=document.createElement('a');link.href=classroomURL(id);link.hidden=true;document.body.append(link);link.click();link.remove();}
function teacherRouteURL(name, parameters = {}) {
    const destination = new URL(teacherRoutes[name], location.href);
    if (selected && !['overview','settings'].includes(name)) destination.searchParams.set('class', selected);
    if(name==='students'&&selected){if(rosterQuery)destination.searchParams.set('search',rosterQuery);if(rosterPage)destination.searchParams.set('rosterPage',String(rosterPage));}
    for (const [key, value] of Object.entries(parameters)) if (value) destination.searchParams.set(key, value);
    return destination.href;
}
async function navigateTeacherPage(name, parameters) {
    if (!(await allowDiscard())) return;
    rememberEdits();
    const link = document.createElement('a'); link.href = teacherRouteURL(name, parameters);
    link.hidden = true; document.body.append(link); link.click(); link.remove();
}
const classNavigation = document.querySelector('.teacher-tabs');
$('yourClassesTitle').before(classNavigation);
// Navigation stays in the sidebar; class selection belongs to the page toolbar.
const classPicker = document.createElement('details');
classPicker.id = 'teacherClassPicker'; classPicker.className = 'teacher-class-picker';
const pickerHeading = document.createElement('summary'); pickerHeading.id = 'teacherClassPickerLabel';
pickerHeading.textContent = 'Choose or create a class'; classPicker.append(pickerHeading);
const sidebar = $('teacherSidebar');
// A fixed sidebar must not descend from the animated main element. CSS
// transforms create a containing block and otherwise shift it over the page.
document.body.prepend(sidebar);
for (const child of [...sidebar.children]) if (!child.matches('.teacher-brand, .teacher-tabs')) classPicker.append(child);
document.querySelector('.teacher-layout').before(classPicker);
const refreshControl = $('refreshTeacher').closest('.teacher-actions');
refreshControl.classList.add('teacher-refresh');
document.querySelector('.teacher-topbar').append(refreshControl);
const sidebarNote = document.createElement('p'); sidebarNote.className = 'teacher-sidebar-note';
const classManagement = document.createElement('section');
classManagement.id = 'teacher-classes'; classManagement.hidden = true;
const classManagementTitle = document.createElement('h3'); classManagementTitle.textContent = 'Manage this class';
classManagement.append(classManagementTitle, $('activeClassTools'), $('archiveClass').closest('.teacher-actions'));
const classOverview = node('section',null,null,'teacher-class-overview');
classManagementTitle.after(classOverview);
const classSettings=classManagement.querySelector('.teacher-settings');classManagement.append(classSettings);
const classSafety=node('details',null,classManagement,'teacher-class-safety');node('summary','Class status and archiving',classSafety);node('p','Archiving closes this class to new activity. Students keep their own learning progress and rewards.',classSafety,'teacher-note');classSafety.append(classManagement.querySelector('#archiveClass').closest('.teacher-actions'));
const classCreation=$('createClassForm').closest('details');classCreation.classList.add('teacher-class-creation');classCreation.querySelector('summary').textContent='Create a new classroom';
classPicker.querySelector('h2').textContent='Your classroom collection';
if(routeName==='classes'){
    document.body.classList.add('classrooms-clean-layout');classPicker.classList.add('classroom-collection-refined');
    classPicker.querySelector('p.teacher-note').textContent='Open a classroom to manage its students, learning activities, and invitations.';
    $('teacherClasses').after(classCreation);
    const workspace=node('section',null,classManagement,'classroom-workspace');workspace.hidden=true;workspace.setAttribute('aria-label','Selected classroom');workspace.append(classOverview,classManagement.querySelector('#activeClassTools'),classSettings,classSafety);
    classSettings.classList.add('class-management-control');classSafety.classList.add('class-management-control');
    const editIntro=node('p','Update the name and description students see in My Class. Your students and learning activities stay in this classroom.',null,'class-control-description');classSettings.querySelector('summary').after(editIntro);
    classSettings.querySelector('#editClassDescription').closest('label').firstChild.textContent='Description (optional)';
    const editForm=classSettings.querySelector('#editClassForm'),editActions=node('div',null,editForm,'teacher-actions class-edit-actions');editActions.append(editForm.querySelector('button[type=submit]'));editActions.firstChild.textContent='Save class details';
    const cancelEdit=node('button','Cancel changes',editActions);cancelEdit.type='button';cancelEdit.addEventListener('click',()=>{if(!detail)return;$('editClassName').value=detail.classroom.name;$('editClassDescription').value=detail.classroom.description||'';rememberEdits(['editClassForm']);classSettings.open=false;});
    classSafety.querySelector('summary').textContent='Archive or restore classroom';
    const consequences=node('ul',null,classSafety,'class-archive-effects');for(const text of ['New students cannot join an archived classroom.','Publishing and classroom activity are paused.','Student learning progress and rewards are preserved.','You can restore the classroom later.'])node('li',text,consequences);classSafety.querySelector('.teacher-actions').before(consequences);
    const inviteTools=workspace.querySelector('#activeClassTools');workspace.after(inviteTools);inviteTools.classList.add('separate-class-invitation');
    const invitation=inviteTools.querySelector('.teacher-invitation'),inviteSummary=invitation.querySelector('summary');
    const invitationIntro=invitation.querySelector('h3+p');invitationIntro.textContent='Create a class code and share it with your students. They join from My Class using their own student account.';invitationIntro.classList.add('invite-introduction');
    const codePanel=node('section',null,invitation,'invite-code-panel');codePanel.setAttribute('aria-label','Class invitation code');
    const codeHeading=node('div',null,codePanel,'invite-code-heading');node('span','CLASS INVITATION',codeHeading,'eyebrow');node('span','',codeHeading,'invite-class-name');
    codePanel.append(invitation.querySelector('#teacherJoinCode'),invitation.querySelector('#teacherCodeExpiry'));
    const oldActions=invitation.querySelector('.teacher-actions'),shareActions=node('div',null,codePanel,'teacher-actions invite-share-actions');shareActions.append(oldActions.querySelector('#rotateTeacherCode'),oldActions.querySelector('#copyTeacherCode'));
    const howTo=node('section',null,invitation,'invite-how-to');node('h4','How students join',howTo);const steps=node('ol',null,howTo);
    for(const [title,copy] of [['Create a code','Generate one when you are ready to welcome students.'],['Share with your class','Copy the code and send it through your usual classroom channel.'],['Students join','They open My Class, enter the code, and select Join Class.']]){const step=node('li',null,steps);node('strong',title,step);node('p',copy,step);}
    const settings=node('details',null,invitation,'invite-access-settings');node('summary','Manage invitation access',settings);node('p','New codes last 7 days. Replacing or revoking a code stops new students using the old code. Students who already joined stay in the class.',settings,'teacher-note');settings.append(oldActions.querySelector('#revokeTeacherCode'));oldActions.remove();
    for(const paragraph of [...invitation.children].filter(child=>child.tagName==='P'&&child!==invitationIntro))paragraph.remove();
    const layout=node('div',null,invitation,'invite-sharing-layout');layout.append(codePanel,howTo);invitationIntro.after(layout);invitation.append(settings);
    const trigger=classCreation.querySelector('summary');trigger.replaceChildren();node('span','',trigger,'create-class-icon').setAttribute('aria-hidden','true');const copy=node('span',null,trigger,'create-class-trigger-copy');node('strong','Create a new classroom',copy);node('span','Set up a class and invite your students.',copy);node('span','',trigger,'create-class-chevron').setAttribute('aria-hidden','true');
    const createForm=$('createClassForm');const intro=node('p','Give your classroom a clear name. You can add students with an invitation code after creating it.',null,'create-class-intro');createForm.prepend(intro);
    $('newClassName').placeholder='Example: Grade 5 - Sampaguita';$('newClassDescription').placeholder='What will this class explore together?';$('newClassDescription').rows=3;
    const helper=node('p','A short description helps students recognize their class. Optional, up to 500 characters.',null,'create-class-helper');$('newClassDescription').closest('label').after(helper);
    createForm.querySelector('[type="submit"],button').textContent='Create classroom';
    button('Close form',createForm,()=>{classCreation.open=false;if(routeName==='classes'&&!classroomDetailPage)$('directoryCreateClassroom')?.focus();else trigger.focus();}).classList.add('create-class-close');
}
const invitationSummary=classManagement.querySelector('.teacher-invitation>summary');invitationSummary.textContent='Invite students to this class';
if(routeName==='classes'){const copy=node('span',null,invitationSummary,'invite-title-copy');invitationSummary.firstChild.remove();node('span','GROW YOUR CLASSROOM',copy,'eyebrow');node('strong','Invite students to this class',copy);node('span','',invitationSummary,'invite-panel-chevron').setAttribute('aria-hidden','true');}
$('teacher-overview').after(classManagement);
const classroomSettingsPanel=classroomDetailPage?node('section',null,classManagement,'classroom-settings-panel'):null;if(classroomSettingsPanel){node('span','CLASSROOM SETTINGS',classroomSettingsPanel,'eyebrow');node('h3','Manage this classroom',classroomSettingsPanel);node('p','Update classroom information or change its status when your class is ready.',classroomSettingsPanel,'teacher-note');classroomSettingsPanel.append(classSettings,classSafety);}
const dashboardFeed = document.createElement('div'); dashboardFeed.id = 'teacherDashboardFeed'; dashboardFeed.className = 'teacher-dashboard-feed';
$('teacher-overview').append(dashboardFeed);
const assignmentShortcut = button('Write Announcement', document.querySelector('.teacher-intro'), async () => {
    if (!detail) { (await tab('classes')); return; }
    (await tab('announcements')); $('announcementForm').querySelector('input').focus();
}, false);
assignmentShortcut.classList.add('teacher-heading-action'); assignmentShortcut.hidden = true;
$('teacher-overview').prepend($('teacherClassSummary'));
const logoutControl = document.querySelector('.logout-button');
sidebarNote.append(logoutControl); sidebar.append(sidebarNote);
const navigationIcons = {settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 3v2m0 14v2M3 12h2m14 0h2M6 6l1.5 1.5m9 9L18 18M6 18l1.5-1.5m9-9L18 6',overview:'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',students:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-4',announcements:'M4 10h4l12-6v16l-12-6H4v-4ZM8 14l2 7H6l-2-7',assignments:'M4 3h13a3 3 0 0 1 3 3v15H6a2 2 0 0 1-2-2V3Zm0 14h16M8 7h8M8 11h6'};
for (const control of classNavigation.querySelectorAll('[data-teacher-tab]')) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('aria-hidden','true');
    const shape = document.createElementNS('http://www.w3.org/2000/svg','path'); shape.setAttribute('d', control.dataset.teacherTab === 'classes' ? 'M3 21h18M5 21V9l7-6 7 6v12M9 21v-6h6v6M9 10h6' : navigationIcons[control.dataset.teacherTab]);
    svg.append(shape); control.prepend(svg);
}
function closeTeacherMenu() {
    $('teacherSidebar').classList.remove('is-open');
    $('teacherMenuToggle').setAttribute('aria-expanded', 'false');
}
$('teacherMenuToggle').addEventListener('click', () => {
    const open = $('teacherSidebar').classList.toggle('is-open');
    $('teacherMenuToggle').setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeTeacherMenu(); });
let classes = [], selected = null, detail = null, missions = [], epoch = 0, busy = false;
let activeTab = routeName, workspaceReady = false;
let classListLoaded = false;
let sectionAnimation = null;
const sectionNames = ['overview', 'classes', 'students', 'announcements', 'assignments','settings'];
const accountSettings=node('section',null,$('teacher-overview').parentElement,'teacher-account-settings');accountSettings.id='teacher-settings';accountSettings.hidden=true;

let teacherAccountData=null,accountNameBaseline='',profileSaving=false;
const accountHero=node('header',null,accountSettings,'account-profile-header');const accountAvatar=node('span','T',accountHero,'account-profile-avatar');accountAvatar.setAttribute('aria-hidden','true');const accountHeroCopy=node('div',null,accountHero);node('span','YOUR TEACHING SPACE',accountHeroCopy,'eyebrow');const accountHeroName=node('h2','Your account',accountHeroCopy);node('p','Personalize your profile and make your workspace comfortable.',accountHeroCopy,'teacher-note');
const accountNav=node('nav',null,accountSettings,'account-section-nav');accountNav.setAttribute('aria-label','Account settings sections');for(const [id,label]of [['account-profile','Profile'],['account-security','Security'],['account-display','Display'],['account-verification','Verification']])node('a',label,accountNav).href='#'+id;
function accountPanel(id,label,title,copy){const panel=node('section',null,accountSettings,'teacher-panel account-settings-card');panel.id=id;node('span',label,panel,'eyebrow');node('h2',title,panel);node('p',copy,panel,'teacher-note');return panel;}
const accountCard=accountPanel('account-profile','YOUR PROFILE','Make it yours','Your preferred name changes how your account is greeted. Your approved application details stay separate.');
const nameForm=node('form',null,accountCard);nameForm.id='teacherPreferredNameForm';const nameLabel=node('label','Preferred display name',nameForm);const preferredName=node('input',null,nameLabel);preferredName.id='teacherPreferredName';preferredName.name='displayName';preferredName.required=true;preferredName.maxLength=60;preferredName.autocomplete='nickname';const nameActions=node('div',null,nameForm,'teacher-actions');const nameSave=node('button','Save display name',nameActions);nameSave.type='submit';button('Cancel changes',nameActions,()=>{preferredName.value=accountNameBaseline;nameStatus.textContent='Changes cancelled.';});const nameStatus=node('p','',nameForm,'teacher-note');nameStatus.setAttribute('role','status');
nameForm.addEventListener('submit',async event=>{event.preventDefault();const user=auth.currentUser,value=preferredName.value.trim();if(!user||profileSaving)return;if(!value||value.length>60){nameStatus.textContent='Enter a name using 1 to 60 characters.';return;}profileSaving=true;nameSave.disabled=preferredName.disabled=true;nameStatus.textContent='Saving your display name...';try{await updateProfile(user,{displayName:value});if(auth.currentUser!==user)return;accountNameBaseline=value;preferredName.value=value;accountHeroName.textContent=value;accountHeroTitle.textContent='Account settings';$('teacherAccountname').textContent=value;renderAccountAvatar();nameStatus.textContent='Display name saved.';}catch(error){if(auth.currentUser===user)nameStatus.textContent='Your name could not be confirmed as saved. Your text is kept. Check your connection before trying again.';}finally{profileSaving=false;if(auth.currentUser===user)nameSave.disabled=preferredName.disabled=false;}});
const avatarLabel=node('label','Profile avatar',accountCard),avatarSelect=node('select',null,avatarLabel);avatarSelect.id='teacherAvatarChoice';avatarSelect.disabled=true;const avatarSave=button('Save avatar',accountCard,async()=>{const user=auth.currentUser;if(!user||!teacherAccountData)return;avatarSave.disabled=avatarSelect.disabled=true;avatarStatus.textContent='Saving your avatar...';const id=avatarSelect.value;try{await saveTeacherAccountAvatar(id);if(auth.currentUser!==user)return;teacherAccountData.profile.avatarId=id;renderAccountAvatar();avatarStatus.textContent='Avatar saved.';}catch(error){if(auth.currentUser===user)avatarStatus.textContent='Your avatar could not be confirmed as saved. Your selection is kept; try again when connected.';}finally{if(auth.currentUser===user)avatarSave.disabled=avatarSelect.disabled=false;}});avatarSave.disabled=true;const avatarStatus=node('p','Avatar choices load from the available collection.',accountCard,'teacher-note');avatarStatus.setAttribute('role','status');
const securityCard=accountPanel('account-security','ACCOUNT SECURITY','Password and access','Send a reset link to your sign-in email. Your current password is never displayed.');
const identityList=node('dl',null,securityCard,'teacher-account-identity');for(const [key,label]of [['name','Display name'],['email','Sign-in email'],['role','Account role'],['verified','Email verification']]){const entry=node('div',null,identityList);node('dt',label,entry);node('dd','Loading...',entry).id='teacherAccount'+key;}
const resetPassword=button('Send password-reset email',securityCard,async()=>{const user=auth.currentUser;if(!user?.email||resetPassword.dataset.sent==='true')return;resetPassword.disabled=true;accountSecurityStatus.textContent='Sending your reset link...';try{await sendPasswordResetEmail(auth,user.email);if(auth.currentUser!==user)return;resetPassword.dataset.sent='true';accountSecurityStatus.textContent='Password-reset email sent. Check your inbox and spam folder. You can continue using your teaching space.';}catch(error){if(auth.currentUser!==user)return;accountSecurityStatus.textContent=error.code==='auth/too-many-requests'?'Too many requests. Wait before trying again. No automatic retry was sent.':'The reset email could not be sent. Check your connection and try again. No automatic retry was sent.';resetPassword.disabled=false;}});resetPassword.id='teacherPasswordReset';
const accountSecurityStatus=node('p','',securityCard,'teacher-note');accountSecurityStatus.id='teacherAccountSecurityStatus';accountSecurityStatus.setAttribute('role','status');
const displayPanel=accountPanel('account-display','YOUR COMFORT','Display preferences','Changes apply immediately. These preferences are shared by this browser, not stored in your teacher account.');
const preferenceStatus=node('p','',displayPanel,'teacher-note');preferenceStatus.setAttribute('role','status');
for(const [key,title,copy]of [['motion','Reduce motion','Use calmer transitions and fewer animations.'],['contrast','Higher contrast','Make text and controls easier to distinguish.']]){const row=node('div',null,displayPanel,'account-preference-row'),copyBox=node('div',null,row);node('strong',title,copyBox);node('p',copy,copyBox,'teacher-note');const control=button('Off',row,()=>{queueMicrotask(()=>{let saved=false;try{saved=localStorage.getItem(key==='motion'?'lakbay-reduce-motion':'lakbay-high-contrast')===(control.getAttribute('aria-checked')==='true'?'on':'off');}catch{}preferenceStatus.textContent=saved?'Preference saved on this browser.':'Preference applied for this visit. Browser storage is unavailable.';});});control.dataset.preferenceSwitch=key;control.setAttribute('role','switch');let enabled=false;try{enabled=localStorage.getItem(key==='motion'?'lakbay-reduce-motion':'lakbay-high-contrast')==='on';}catch{}control.setAttribute('aria-checked',String(enabled));control.setAttribute('aria-label',title);control.textContent='';node('span',enabled?'On':'Off',control).dataset.switchState='';}
const sizeLabel=node('label','Text size',displayPanel),sizeChoice=node('select',null,sizeLabel);sizeChoice.dataset.readingSize='';for(const [value,label]of [['standard','Standard'],['large','Large'],['larger','Extra large']])node('option',label,sizeChoice).value=value;try{sizeChoice.value=localStorage.getItem('lakbay-reading-size')||'standard';}catch{}sizeChoice.addEventListener('change',()=>{queueMicrotask(()=>{let saved=false;try{saved=localStorage.getItem('lakbay-reading-size')===sizeChoice.value;}catch{}preferenceStatus.textContent=saved?'Text size saved on this browser.':'Text size applied for this visit. Browser storage is unavailable.';});});
const surfaceLabel=node('label','Reading surface',displayPanel),surfaceChoice=node('select',null,surfaceLabel);for(const [value,label]of [['dark','Deep navy'],['paper','Soft navy']])node('option',label,surfaceChoice).value=value;try{surfaceChoice.value=localStorage.getItem('lakbay.reading-surface')==='dark'?'dark':'paper';}catch{}surfaceChoice.addEventListener('change',()=>{document.body.classList.toggle('paper-reading',surfaceChoice.value==='paper');try{localStorage.setItem('lakbay.reading-surface',surfaceChoice.value);preferenceStatus.textContent='Reading surface saved on this browser.';}catch{preferenceStatus.textContent='Reading surface applied for this visit. Browser storage is unavailable.';}});
const sample=node('div',null,displayPanel,'account-reading-preview');node('strong','A comfortable space to teach',sample);node('p','Guide your learners through the people, places, and stories of Philippine history.',sample);
const verificationPanel=accountPanel('account-verification','TEACHER VERIFICATION','Your approved details','Your verification details establish access to classroom tools. Changing a preferred name does not change your approved application.');const verificationStatus=node('p','Checking your application...',verificationPanel,'account-verification-status');verificationStatus.setAttribute('role','status');const verificationDetails=node('dl',null,verificationPanel,'teacher-account-identity');const applicationLink=node('a','View teacher application',verificationPanel,'account-settings-link');applicationLink.href='teacher-application.html';node('p','To correct approved details, review your application first. Resubmitting changed credentials may require another review.',verificationPanel,'teacher-note');
const accountHelp=accountPanel('account-help','ACCOUNT HELP','Find the right setting','Forgot your password? Use the reset email above. Classroom names and invitation codes are managed separately.');accountHelp.classList.add('account-settings-help');const classHelpLink=node('a',null,accountHelp,'account-settings-link');classHelpLink.href='teacher-classes.html';node('strong','Manage classrooms',classHelpLink);node('span','Edit class names, manage invitations, or archive a classroom.',classHelpLink);
function renderAccountAvatar(){const avatar=teacherAccountData?.avatars.find(item=>item.id===teacherAccountData.profile.avatarId);accountAvatar.textContent=avatar?.kind==='emoji'?avatar.icon:Array.from(auth.currentUser?.displayName||'Teacher')[0].toUpperCase();}
async function loadAccountDetails(){const user=auth.currentUser;avatarSave.disabled=avatarSelect.disabled=true;try{const data=await loadTeacherAccountSettings();if(auth.currentUser!==user)return;teacherAccountData=data;avatarSelect.replaceChildren();for(const avatar of data.avatars)node('option',avatar.name||avatar.id,avatarSelect).value=avatar.id;if(data.avatars.some(a=>a.id===data.profile.avatarId))avatarSelect.value=data.profile.avatarId;else if(data.avatars.some(a=>a.kind==='initials'))avatarSelect.value=data.avatars.find(a=>a.kind==='initials').id;avatarSave.disabled=avatarSelect.disabled=!data.avatars.length;avatarStatus.textContent=data.avatarUnavailable?'Avatar choices could not load. Your current avatar has not changed. Refresh account details to retry.':data.avatars.length?'Choose an avatar, then save your choice.':'No avatars are available yet. Your initials remain visible.';renderAccountAvatar();renderAvatarGrid();accountHeroBadge.textContent=data.application?.status==='approved'&&data.application.revision===data.profile.teacherVerifiedRevision?'Verified teacher':'Teacher account';verificationStatus.textContent=data.application?.status==='approved'&&data.application.revision===data.profile.teacherVerifiedRevision?'Approved teacher':'Verification needs attention';verificationStatus.dataset.state=data.application?.status==='approved'?'approved':'pending';verificationDetails.replaceChildren();for(const [label,value]of [['Approved name',data.application?.legalName||[data.profile.firstName,data.profile.lastName].filter(Boolean).join(' ')],['School or affiliation',data.application?.institution]]){if(typeof value==='string'&&value.trim()){const row=node('div',null,verificationDetails);node('dt',label,row);node('dd',value,row);}}}catch(error){if(auth.currentUser!==user)return;avatarStatus.textContent='Avatar choices could not load. Your current selection has not changed.';verificationStatus.textContent='Verification details could not refresh. Try again when connected.';}}
button('Refresh account details',verificationPanel,()=>loadAccountDetails());
function renderTeacherAccount(){const user=auth.currentUser;teacherAccountData=null;accountNameBaseline=user?.displayName||'';preferredName.value=accountNameBaseline;accountHeroName.textContent=user?.displayName||'Your teaching account';accountHeroTitle.textContent='Account settings';$('teacherAccountname').textContent=user?.displayName||'No display name provided';$('teacherAccountemail').textContent=user?.email||'Email unavailable';$('teacherAccountrole').textContent='Teacher';$('teacherAccountverified').textContent=user?.emailVerified?'Verified':'Not verified';delete resetPassword.dataset.sent;resetPassword.disabled=!user?.email;accountSecurityStatus.textContent='';renderAccountAvatar();loadAccountDetails();}
window.addEventListener('beforeunload',event=>{if(routeName==='settings'&&(profileSaving||preferredName.value.trim()!==accountNameBaseline)){event.preventDefault();event.returnValue='';}});

// Settings show one focused panel while keeping unsaved form values in the DOM.
const accountBody=node('div',null,accountSettings,'account-settings-body'),accountPanels=node('div',null,accountBody,'account-settings-panels');accountBody.prepend(accountNav);accountNav.replaceChildren();accountNav.setAttribute('role','tablist');accountNav.setAttribute('aria-label','Account settings sections');
const accountPanelMap=new Map([['account-profile',accountCard],['account-security',securityCard],['account-display',displayPanel],['account-verification',verificationPanel],['account-help',accountHelp]]);
let accountPanelAnimation=null;
function selectAccountPanel(id,focus=false){if(!accountPanelMap.has(id))id='account-profile';for(const [key,panel]of accountPanelMap){const active=key===id;panel.hidden=!active;const tab=$('tab-'+key);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();}accountPanelAnimation?.cancel();if(routeName==='settings'&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.body.classList.contains('lakbay-reduce-motion'))accountPanelAnimation=accountPanelMap.get(id).animate([{opacity:.35},{opacity:1}],{duration:180,easing:'ease-out'});}
for(const [index,[id,panel]]of [...accountPanelMap].entries()){accountPanels.append(panel);panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','tab-'+id);const control=button(['Profile','Security','Appearance','Verification','Help'][index],accountNav,()=>{selectAccountPanel(id);if(routeName==='settings')history.replaceState(null,'','#'+id);});control.id='tab-'+id;control.setAttribute('role','tab');control.setAttribute('aria-controls',id);control.addEventListener('keydown',event=>{const keys=[...accountPanelMap.keys()],current=keys.indexOf(id);let next;if(['ArrowDown','ArrowRight'].includes(event.key))next=(current+1)%keys.length;else if(['ArrowUp','ArrowLeft'].includes(event.key))next=(current-1+keys.length)%keys.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=keys.length-1;else return;event.preventDefault();selectAccountPanel(keys[next],true);});}
const accountNavigationMedia=matchMedia('(max-width:650px)');const setAccountOrientation=()=>accountNav.setAttribute('aria-orientation','horizontal');setAccountOrientation();accountNavigationMedia.addEventListener('change',setAccountOrientation);
selectAccountPanel(location.hash.slice(1));window.addEventListener('hashchange',()=>{if(routeName==='settings')selectAccountPanel(location.hash.slice(1));});
accountHeroCopy.querySelector('.eyebrow').textContent='ACCOUNT SETTINGS';const accountHeroTitle=node('h1',accountHeroName.textContent,null);accountHeroName.hidden=true;accountHeroName.after(accountHeroTitle);accountHeroTitle.id='accountHeroTitle';
const accountHeroBadge=node('span','Teacher account',accountHero,'account-identity-badge');
for(const key of ['name','role'])$('teacherAccount'+key).parentElement.hidden=true;
const avatarGrid=node('div',null,accountCard,'account-avatar-grid');avatarGrid.setAttribute('role','group');avatarGrid.setAttribute('aria-label','Choose your profile avatar');avatarLabel.after(avatarGrid);avatarLabel.classList.add('account-backing-control');
function syncAvatarGrid(){const disabled=avatarSelect.disabled;for(const control of avatarGrid.querySelectorAll('button')){control.disabled=disabled;control.setAttribute('aria-pressed',String(control.dataset.avatarId===avatarSelect.value));}}
function renderAvatarGrid(){avatarGrid.replaceChildren();for(const item of teacherAccountData?.avatars||[]){const control=button('',avatarGrid,()=>{avatarSelect.value=item.id;syncAvatarGrid();avatarStatus.textContent='Avatar selected. Save avatar to keep your choice.';});control.dataset.avatarId=item.id;control.setAttribute('aria-label',item.name||'Initials');node('span',item.kind==='emoji'?item.icon:Array.from(auth.currentUser?.displayName||'Teacher')[0].toUpperCase(),control,'account-avatar-choice-icon').setAttribute('aria-hidden','true');node('span',item.name||'Initials',control,'account-avatar-choice-name');}syncAvatarGrid();}
new MutationObserver(syncAvatarGrid).observe(avatarSelect,{attributes:true,attributeFilter:['disabled']});
const surfaceCards=node('div',null,displayPanel,'account-surface-options');surfaceCards.setAttribute('role','group');surfaceCards.setAttribute('aria-label','Reading surface');surfaceLabel.after(surfaceCards);surfaceLabel.classList.add('account-backing-control');
function syncSurfaceCards(){for(const control of surfaceCards.querySelectorAll('button'))control.setAttribute('aria-pressed',String(control.dataset.surface===surfaceChoice.value));}
for(const [value,title,copy]of [['dark','Deep Navy','A rich, focused workspace'],['paper','Soft Navy','A gentler reading surface']]){const control=button('',surfaceCards,()=>{surfaceChoice.value=value;surfaceChoice.dispatchEvent(new Event('change',{bubbles:true}));syncSurfaceCards();});control.dataset.surface=value;const preview=node('span',null,control,'account-surface-sample');preview.setAttribute('aria-hidden','true');node('i','',preview);node('i','',preview);node('i','',preview);node('strong',title,control);node('span',copy,control);}
surfaceChoice.addEventListener('change',syncSurfaceCards);syncSurfaceCards();
const avatarCaption=node('h3','Choose your avatar',null);avatarGrid.before(avatarCaption);avatarSave.classList.add('account-avatar-save');

// Form rows use a shared label/control grid rather than stacked nested cards.
accountHeroTitle.textContent='Account settings';accountHeroCopy.querySelector('.eyebrow').textContent='YOUR WORKSPACE';accountHeroCopy.querySelector('p').textContent='Your profile, security, and workspace preferences.';
accountHeroName.hidden=false;accountHeroName.classList.add('account-header-name');const accountHeaderIdentity=node('div',null,accountHero,'account-header-identity');const accountHeaderIdentityCopy=node('div',null,accountHeaderIdentity);accountHeaderIdentity.prepend(accountAvatar);accountHeaderIdentityCopy.append(accountHeroName,accountHeroBadge);
accountNav.before(accountHero);accountSettings.prepend(accountHero);accountSettings.classList.add('account-editor-layout');
accountCard.querySelector('h2').textContent='Profile details';accountCard.querySelector(':scope>.teacher-note').textContent='Choose how your account appears. Your approved teacher information stays separate.';
securityCard.querySelector('h2').textContent='Sign-in & security';displayPanel.querySelector('h2').textContent='Workspace appearance';verificationPanel.querySelector('h2').textContent='Teacher verification';
function settingRow(parent,title,copy){const row=node('section',null,parent,'account-setting-row'),label=node('div',null,row,'account-setting-label');node('h3',title,label);node('p',copy,label,'teacher-note');const controls=node('div',null,row,'account-setting-controls');return controls;}
const profileNameControls=settingRow(accountCard,'Display name','Use a name your learners recognize.');profileNameControls.append(nameForm);nameLabel.classList.add('account-field-label');nameLabel.firstChild.textContent='Preferred name';preferredName.placeholder='Enter your preferred name';
const profileAvatarControls=settingRow(accountCard,'Profile avatar','Pick a symbol for your teaching account.');avatarCaption.remove();profileAvatarControls.append(avatarLabel,avatarGrid,avatarSave,avatarStatus);
const nameActionStatus=node('div',null,nameForm,'account-action-feedback');nameActionStatus.append(nameStatus);nameActions.append(nameActionStatus);
const securityResetControls=settingRow(securityCard,'Password','We will email you a link to choose a new password.');securityResetControls.append(resetPassword,accountSecurityStatus);
const emptySections = new Map();
for (const name of ['students', 'announcements', 'assignments']) {
    const section = $('teacher-' + name);
    const content = node('div', null, null, 'teacher-section-content');
    content.append(...section.childNodes);
    const empty = node('div', null, section, 'teacher-empty-state');
    node('span', 'CHOOSE YOUR CLASSROOM', empty, 'eyebrow');
    node('h3', {students:'See your students’ learning', announcements:'Keep your class informed', assignments:'Guide the next discovery'}[name], empty);
    node('p', 'Choose or create a class to ' + {students:'view joined students and their learning reports.',announcements:'write and publish announcements for your students.',assignments:'choose a history mission and add instructions.'}[name], empty);
    button('Go to My Classes', empty, async () => (await tab('classes')), false);
    section.append(content); emptySections.set(name, {empty, content});
}
let rosterPage = 0;
let rosterQuery = '';
const names = new Map();
const assignmentRecipientLabel=node('label','Receiving class',null),assignmentRecipient=node('select',null,assignmentRecipientLabel);
assignmentRecipient.id='assignmentRecipient';assignmentRecipient.name='recipientClassId';$('assignmentForm').prepend(assignmentRecipientLabel);
const assignmentRecipientHelp=node('p','Prepare the mission and instructions, then choose a receiving class before saving.',null,'teacher-note');assignmentRecipientLabel.after(assignmentRecipientHelp);
document.querySelector('#teacher-assignments .teacher-editor-card h3').textContent='Plan a class goal or personal review';
document.querySelector('#teacher-assignments .teacher-editor-card>p').textContent='Choose the teaching purpose, select a topic, and explain what students should learn. Check readiness before publishing.';
document.querySelector('#teacher-assignments .teacher-library-card h3').textContent='Class goals and personal reviews';
assignmentRecipient.addEventListener('change',renderAssignmentPreview);
const purposeLabel=node('label','Teaching purpose',null),assignmentPurpose=node('select',null,purposeLabel);
assignmentPurpose.name='assignmentType';assignmentPurpose.id='assignmentPurpose';
node('option','Class learning goal — work toward a shared topic',assignmentPurpose).value='class-goal';
node('option','Targeted review — revisit a topic with selected students',assignmentPurpose).value='targeted-review';
assignmentRecipientLabel.after(purposeLabel);
const topicLabel=node('label','Review focus',null),reviewTopic=node('select',null,topicLabel);reviewTopic.name='reviewTopic';reviewTopic.id='reviewTopic';purposeLabel.after(topicLabel);topicLabel.hidden=true;
const reflectionLabel=node('label','Short understanding question',null),reflectionQuestion=node('textarea',null,reflectionLabel);reflectionQuestion.name='reflectionQuestion';reflectionQuestion.maxLength=500;reflectionQuestion.rows=2;reflectionQuestion.placeholder='Explain one idea you understand better now and a clue supporting it.';topicLabel.after(reflectionLabel);reflectionLabel.hidden=true;
function renderReviewFocus(){const mission=missions.find(m=>m.id===$('assignmentMission').value),old=reviewTopic.value;topicLabel.hidden=reflectionLabel.hidden=assignmentPurpose.value!=='targeted-review';reviewTopic.replaceChildren();node('option','Whole lesson',reviewTopic).value='';for(const topic of mission?.reviewTopics||[])node('option',topic.label,reviewTopic).value=topic.key;if((mission?.reviewTopics||[]).some(t=>t.key===old))reviewTopic.value=old;const locked=!!detail?.assignments.find(a=>a.id===$('assignmentForm').dataset.recordId)?.assignedAt;reviewTopic.disabled=reflectionQuestion.disabled=locked;}
assignmentPurpose.addEventListener('change',renderReviewFocus);$('assignmentMission').addEventListener('change',renderReviewFocus);
const reviewPicker=node('details',null,null,'teacher-review-picker');node('summary','Choose students for this review',reviewPicker);purposeLabel.after(reviewPicker);reviewPicker.hidden=true;
const reviewSelection=node('p','',reviewPicker,'teacher-note'),reviewList=node('div',null,reviewPicker,'teacher-review-students');
const reviewTargets=new Set();let reviewPage=0,reviewLoad=0;
const reviewHidden=node('input',null,$('assignmentForm'));reviewHidden.type='hidden';reviewHidden.name='reviewTargets';reviewHidden.value='[]';
function syncReviewTargets(){reviewHidden.value=JSON.stringify([...reviewTargets]);reviewSelection.textContent=reviewTargets.size+' selected (up to 10 per review). Select students based on their learning evidence, not class rank.';}
async function renderReviewTargets(){
 reviewPicker.hidden=assignmentPurpose.value!=='targeted-review';if(reviewPicker.hidden)return;
 syncReviewTargets();const request=++reviewLoad,classId=assignmentRecipient.value;reviewList.replaceChildren();
 if(!classId){node('p','Choose a class first.',reviewList,'teacher-note');return;}
 if($('assignmentForm').dataset.recordId){node('p','This review keeps its original student and mission. Create a new review to choose another.',reviewList,'teacher-note');return;}
 node('p','Loading class members...',reviewList,'teacher-note');
 try{const record=detail?.classroom.id===classId?detail:await loadTeacherClass(classId);if(request!==reviewLoad||classId!==assignmentRecipient.value)return;
 reviewPage=Math.min(reviewPage,Math.max(0,Math.ceil(record.members.length/20)-1));const members=record.members.slice(reviewPage*20,(reviewPage+1)*20);
 const roster=await loadTeacherRosterNames(classId,members.map(m=>m.userId));if(request!==reviewLoad||classId!==assignmentRecipient.value)return;reviewList.replaceChildren();
 if(!members.length)node('p','No students have joined this class yet.',reviewList,'teacher-note');
 for(const member of members){const label=node('label',null,reviewList,'teacher-review-student'),check=node('input',null,label);check.type='checkbox';check.checked=reviewTargets.has(member.userId);node('span',roster.find(r=>r.userId===member.userId)?.name||'Student account '+member.userId.slice(-8),label);check.addEventListener('change',()=>{if(check.checked&&reviewTargets.size>=10){check.checked=false;reviewSelection.textContent='Choose up to 10 students at a time.';return;}if(check.checked)reviewTargets.add(member.userId);else reviewTargets.delete(member.userId);syncReviewTargets();reviewHidden.dispatchEvent(new Event('input',{bubbles:true}));});}
 const actions=node('div',null,reviewList,'teacher-actions');if(reviewPage>0)button('Previous students',actions,()=>{reviewPage--;renderReviewTargets();});if((reviewPage+1)*20<record.members.length)button('Next students',actions,()=>{reviewPage++;renderReviewTargets();});node('p','Showing '+members.length+' of '+record.members.length+' students. Selections stay when changing groups.',reviewList,'teacher-note');
 }catch{if(request===reviewLoad){reviewList.replaceChildren();node('p','Student names could not load.',reviewList,'teacher-note');button('Retry student list',reviewList,renderReviewTargets);}}
}
assignmentPurpose.addEventListener('change',()=>{reviewPage=0;renderReviewTargets();renderAssignmentPreview();});
assignmentRecipient.addEventListener('change',()=>{reviewTargets.clear();reviewPage=0;syncReviewTargets();renderReviewTargets();});
$('assignmentForm').addEventListener('reset',()=>{reviewLoad++;reviewTargets.clear();syncReviewTargets();assignmentPurpose.disabled=false;$('assignmentMission').disabled=false;reviewPicker.hidden=true;topicLabel.hidden=reflectionLabel.hidden=true;reviewTopic.disabled=reflectionQuestion.disabled=false;});
function renderAssignmentRecipients(){
    const previous=assignmentRecipient.value,editing=Boolean($('assignmentForm').dataset.recordId);
    assignmentRecipient.replaceChildren();node('option','Choose a receiving class',assignmentRecipient).value='';
    for(const classroom of classes.filter(c=>c.status==='active'))node('option',classroom.name,assignmentRecipient).value=classroom.id;
    assignmentRecipient.value=routeName==='assignments'&&detail?.classroom.status==='active'?selected:editing?selected:classes.some(c=>c.id===previous&&c.status==='active')?previous:detail?.classroom.status==='active'?selected:'';
    assignmentRecipient.disabled=busy||editing;
    assignmentRecipientHelp.textContent=classes.some(c=>c.status==='active')?'Changing the recipient keeps your selected mission, instructions and due date.':'You can prepare an assignment now. Create or restore a class before saving or publishing. Unsent instructions stay on this page until you leave or reset them.';
}
const announcementRecipientLabel=node('label','Receiving class',null);
const announcementRecipient=node('select',null,announcementRecipientLabel);announcementRecipient.id='announcementRecipient';announcementRecipient.name='recipientClassId';
$('announcementForm').prepend(announcementRecipientLabel);
const announcementRecipientHelp=node('p','Compose your message first, then choose one active class before saving or publishing.',null,'teacher-note');
announcementRecipientLabel.after(announcementRecipientHelp);
announcementRecipient.addEventListener('change',renderAnnouncementPreview);
const announcementContext=node('section',null,null,'announcement-context');const announcementContextCopy=node('div',null,announcementContext);node('span','CLASSROOM MESSAGES',announcementContextCopy,'eyebrow');const announcementContextTitle=node('h2','Choose a classroom',announcementContextCopy);const announcementContextNote=node('p','Write a message now, or choose a class to see its saved posts.',announcementContextCopy);const announcementViewLabel=node('label','Classroom',announcementContext);const announcementClassView=node('select',null,announcementViewLabel);announcementClassView.id='announcementClassView';$('teacher-announcements').prepend(announcementContext);
announcementClassView.addEventListener('change',async ()=>{if(!announcementClassView.value)return;if(busy||!(await allowDiscard())){announcementClassView.value=selected||'';return;}announcementPage=0;const classId=announcementClassView.value;task(async ()=>(await openClass(classId)));});
function renderAnnouncementRecipients() {
    announcementClassView.replaceChildren();node('option','Choose a classroom',announcementClassView).value='';for(const classroom of classes)node('option',classroom.name+(classroom.status==='archived'?' (archived)':''),announcementClassView).value=classroom.id;announcementClassView.value=detail?.classroom.id||'';announcementClassView.disabled=busy||!workspaceReady;
    announcementContextTitle.textContent=detail?.classroom.name||'Choose a classroom';announcementContextNote.textContent=detail?(detail.classroom.status==='active'?'Write a message for this classroom and manage its saved posts.':'Archived classroom: saved posts are read-only. Choose an active class to publish.'):'Prepare a message now. Choose a classroom to browse its saved posts.';
    const previous=announcementRecipient.value;
    announcementRecipient.replaceChildren();node('option','Choose a receiving class',announcementRecipient).value='';
    for(const classroom of classes.filter(c=>c.status==='active'))node('option',classroom.name,announcementRecipient).value=classroom.id;
    const editing=Boolean($('announcementForm').dataset.recordId);
    announcementRecipient.value=routeName==='announcements'&&detail?.classroom.status==='active'?selected:editing?selected:previous&&classes.some(c=>c.id===previous&&c.status==='active')?previous:detail?.classroom.status==='active'?selected:'';
    announcementRecipient.disabled=busy||editing;announcementRecipientLabel.hidden=routeName==='announcements'&&detail?.classroom.status==='active';
    announcementRecipientHelp.textContent=routeName==='announcements'&&detail?.classroom.status==='active'?'For '+detail.classroom.name+'. Drafts stay private until you publish.':classes.some(c=>c.status==='active')?'Choose one active receiving class. Changing this selection keeps your message text.':'You can compose a message now. Create or restore a class before saving or publishing. Unsent text stays on this page until you leave or reset it.';
}
const lessonCatalog=node('details',null,null,'teacher-lesson-catalog');lessonCatalog.id='teacherLessonCatalog';
node('summary','Browse history lessons',lessonCatalog);
node('p','Explore the existing missions and learning goals. Browsing does not assign a lesson or change student progress. Choose a class when you are ready to prepare an assignment.',lessonCatalog,'teacher-note');
const catalogSearchLabel=node('label','Find a lesson',lessonCatalog),catalogSearch=node('input',null,catalogSearchLabel);
catalogSearch.type='search';catalogSearch.placeholder='Search by mission, chapter or learning goal';catalogSearch.maxLength=200;
const catalogChapterLabel=node('label','Chapter',lessonCatalog),catalogChapter=node('select',null,catalogChapterLabel);
const catalogResults=node('div',null,lessonCatalog);catalogResults.id='teacherCatalogResults';catalogResults.setAttribute('aria-live','polite');
$('teacher-assignments').prepend(lessonCatalog);
let catalogPage=0,catalogInitialized=false;
function renderLessonCatalog(reset=false) {
    if(reset){catalogSearch.value='';catalogChapter.replaceChildren();node('option','All chapters',catalogChapter).value='';
        const chapters=new Map();for(const item of missions)chapters.set(item.chapterId,item.chapterTitle||item.chapterId);
        for(const [id,title] of chapters)node('option',title,catalogChapter).value=id;
        catalogPage=0;catalogInitialized=true;
    }
    catalogResults.replaceChildren();
    const term=catalogSearch.value.trim().toLocaleLowerCase();
    const matching=missions.filter(item=>(!catalogChapter.value||item.chapterId===catalogChapter.value)&&(!term||[item.title,item.name,item.chapterTitle,missionGoal(item)].filter(Boolean).join(' ').toLocaleLowerCase().includes(term)));
    catalogPage=Math.min(catalogPage,Math.max(0,Math.ceil(matching.length/8)-1));
    node('p',`${matching.length} matching lessons${matching.length?' · Showing '+(catalogPage*8+1)+'-'+Math.min((catalogPage+1)*8,matching.length):''}.`,catalogResults,'teacher-note');
    if(!matching.length)node('p',missions.length?'No matching lessons. Try another search or choose All chapters.':'No active lessons are available to browse yet.',catalogResults);
    const grid=node('div',null,catalogResults,'teacher-catalog-grid');
    for(const item of matching.slice(catalogPage*8,(catalogPage+1)*8)){
        const card=node('article',null,grid,'teacher-class-card');node('span',item.chapterTitle||item.chapterId,card,'eyebrow');
        node('h3',item.title||item.name||item.id,card);
        node('p',missionGoal(item)||'Learning goal not supplied. Review the lesson before using it in class.',card,'teacher-note');
        const question=item.learningGuide?.question;if(typeof question==='string'&&question.trim())node('p','Discussion prompt: '+question,card);
        button(detail?.classroom.status==='active'?'Prepare Assignment':'Choose a Receiving Class',card,async ()=>{
            if(!(await allowDiscard()))return;
            if(detail?.classroom.status==='active'){
                const form=$('assignmentForm');form.reset();delete form.dataset.recordId;$('assignmentCancel').hidden=true;
                $('assignmentMission').value=item.id;renderAssignmentPreview();rememberEdits(['assignmentForm']);
                if(routeName==='assignments')openAssignmentComposer();else form.scrollIntoView({block:'start',behavior:'smooth'});form.elements.namedItem('instructions').focus();
            }else{
                card.querySelector('.teacher-catalog-class-choices')?.remove();
                const choices=node('div',null,card,'teacher-catalog-class-choices');
                if(!classes.some(c=>c.status==='active')){node('p','Create a class to publish this mission. You can keep browsing without one.',choices,'teacher-note');const link=node('a','Create a Class',choices,'teacher-class-link');link.href=teacherRoutes.classes;return;}
                node('p','Prepare this mission for:',choices,'teacher-note');
                for(const classroom of classes.filter(c=>c.status==='active')){const link=node('a',classroom.name,choices,'teacher-class-link');const url=new URL(teacherRoutes.assignments,location.href);url.searchParams.set('class',classroom.id);url.searchParams.set('mission',item.id);link.href=url.href;}
            }
        });
    }
    const navigation=node('div',null,catalogResults,'teacher-actions');
    if(catalogPage>0)button('Previous Lessons',navigation,()=>{catalogPage--;renderLessonCatalog();});
    if((catalogPage+1)*8<matching.length)button('Next Lessons',navigation,()=>{catalogPage++;renderLessonCatalog();});
}
catalogSearch.addEventListener('input',()=>{catalogPage=0;renderLessonCatalog();});
catalogChapter.addEventListener('change',()=>{catalogPage=0;renderLessonCatalog();});
const studentClassToolbar=node('div',null,null,'teacher-student-class-toolbar');
const studentClassLabel=node('label','View students in',studentClassToolbar);
const studentClassFilter=node('select',null,studentClassLabel);studentClassFilter.id='teacherStudentClassFilter';
const rosterContext=node('div',null,studentClassToolbar,'teacher-roster-context');node('span','LEARNING AT A GLANCE',rosterContext,'eyebrow');const rosterContextTitle=node('h2','Choose a classroom',rosterContext);const rosterContextNote=node('p','Open a class to view its roster, support requests, and individual learning reports.',rosterContext,'teacher-note');studentClassToolbar.prepend(rosterContext);
const glanceClassStatus=node('span','',rosterContext,'glance-class-status');
const rosterMetrics=node('div',null,studentClassToolbar,'progress-class-metrics');rosterMetrics.hidden=true;rosterMetrics.setAttribute('aria-label','Selected classroom summary');
if(routeName==='students')document.querySelector('.teacher-intro').classList.add('student-progress-hero');
const allClassRoster=node('section',null,null,'teacher-all-class-roster');allClassRoster.id='teacherAllClassRoster';
$('teacher-students').prepend(studentClassToolbar,allClassRoster);
const studentListPanel=node('section',null,null,'student-list-panel');studentListPanel.id='studentListPanel';studentListPanel.setAttribute('aria-label','Classroom student list');const studentListHeader=node('header',null,studentListPanel,'student-list-panel-heading');const studentListCopy=node('div',null,studentListHeader);node('span','CLASS ROSTER',studentListCopy,'eyebrow');node('h3','Your students',studentListCopy);node('p','Choose a student to review their learning and offer guidance.',studentListCopy,'teacher-note');const studentListTotal=node('span','',studentListHeader,'student-list-total');$('rosterSearchForm').before(studentListPanel);studentListPanel.append($('rosterSearchForm'),$('rosterSearchStatus'),$('teacherRoster'));
const classReportPanel=node('section',null,studentListPanel,'classroom-report-tools');node('h4','Class learning snapshot',classReportPanel);node('p','Prepare an up-to-date summary for every current student. Records load only when you request the report.',classReportPanel,'teacher-note');
const classReportStatus=node('p','',classReportPanel,'teacher-note');classReportStatus.setAttribute('role','status');const classReportResults=node('div',null,classReportPanel,'classroom-report-results');
const classReportPrepare=button('Prepare class report',classReportPanel,()=>{const classId=selected;if(!classId||busy)return;const generation=epoch;task(async()=>{
    classReportResults.setAttribute('aria-busy','true');classReportStatus.textContent='Checking current classroom membership...';
    try{
    const fresh=await loadTeacherClassRoster(classId);if(generation!==epoch)return;if(fresh.classroom.status!=='active')throw Error('Restore this class before preparing a learning report.');
    const students=[];for(let offset=0;offset<fresh.members.length;offset+=20){const group=fresh.members.slice(offset,offset+20);const results=await loadTeacherStudentBatch(classId,group.map(member=>member.userId));if(generation!==epoch)return;results.forEach((result,index)=>students.push({name:names.get(group[index].userId)||'Student account '+group[index].userId.slice(-8),report:result.status==='fulfilled'?result.value:null}));classReportStatus.textContent='Checked '+students.length+' of '+fresh.members.length+' students...';}
    const unavailable=students.filter(student=>!student.report).length,rows=classroomReportRows({className:fresh.classroom.name,students,missions});
    classReportResults.replaceChildren();
    classReportStatus.textContent=students.length+' current students checked. '+unavailable+' unavailable. Generated '+new Date().toLocaleString('en-PH',{timeZone:'Asia/Manila'})+' (Philippine time).';
    node('p','Unavailable records are left blank in the export. Quiz results are practice evidence, not official grades. Refresh this report after new student activity.',classReportResults,'teacher-note');
    if(students.length){table(classReportResults,'Class learning snapshot',['Student','Records','Completed missions','Latest quiz score'],rows.slice(7).map(row=>[row[0],row[1],row[1]==='Available'?row[2]+' / '+row[3]:'Unavailable',row[4]==='Unavailable'||row[4]===''?'Unavailable':row[4]+'%']));button('Download class CSV',classReportResults,()=>downloadLearningReport(rows,'lakbay-class-learning-report.csv'));}
    }catch(error){if(generation===epoch)classReportStatus.textContent='Could not refresh the class report. The previous snapshot, if shown, is unchanged and may be out of date. Try Prepare class report again.';throw error;}finally{if(generation===epoch)classReportResults.setAttribute('aria-busy','false');}
},'Class report preparation finished.');});
classReportResults.before(classReportPrepare);

let allRosterRequest=0;
studentClassFilter.addEventListener('change',async ()=>{
    if(busy||!(await allowDiscard())){studentClassFilter.value=detail?.classroom.id||'all';return;}
    if(studentClassFilter.value==='all'){
        detail=null;selected=null;clearStudentReport();
        const url=new URL(location.href);url.searchParams.delete('class');url.searchParams.delete('student');history.replaceState(null,'',url.href);
        (await tab('students'));applyArchiveState();
    }else {const classId=studentClassFilter.value;task(async ()=>(await openClass(classId)));}
});
function renderStudentClassFilter() {
    studentClassToolbar.dataset.view=detail?'roster':'directory';
    studentClassFilter.replaceChildren();node('option','All active classes',studentClassFilter).value='all';
    for(const classroom of classes)node('option',classroom.name+(classroom.status==='archived'?' (archived)':''),studentClassFilter).value=classroom.id;
    studentClassFilter.value=detail?.classroom.id||'all';
    rosterContextTitle.textContent=detail?.classroom.name||'Start with a classroom';
    glanceClassStatus.textContent=detail?(detail.classroom.status==='active'?'Active classroom':'Archived classroom'):'';glanceClassStatus.dataset.status=detail?.classroom.status||'';
    rosterContextNote.textContent=detail?'Open a student report to see saved learning evidence and choose a helpful next step.':'Choose a classroom to see its students, learning reports, and private follow-ups.';
    rosterMetrics.hidden=!detail;rosterMetrics.replaceChildren();
    if(detail)for(const [value,label,note,icon]of [[detail.members.length,'Joined students','Members of this classroom','students'],[detail.assignments.filter(a=>a.status==='published'&&a.assignmentType!=='targeted-review').length,'Class activities','Published learning goals','assignments'],[detail.assignments.filter(a=>a.status==='published'&&a.assignmentType==='targeted-review').length,'Personal reviews','Published individual practice','review']]){
        const item=node('div',null,rosterMetrics);item.dataset.glanceMetric=icon;const emblem=node('span',null,item,'glance-metric-icon');emblem.setAttribute('aria-hidden','true');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');const shape=document.createElementNS('http://www.w3.org/2000/svg','path');shape.setAttribute('d',icon==='review'?'M12 3 3 7v6c0 5 9 8 9 8s9-3 9-8V7l-9-4Zm-4 9 3 3 5-6':navigationIcons[icon]);svg.append(shape);emblem.append(svg);node('strong',String(value),item);node('span',label,item,'glance-metric-label');node('small',note,item,'glance-metric-note');
    }
}
function renderAllClassRoster() {
    ++allRosterRequest;allClassRoster.replaceChildren();
    const heading=node('header',null,allClassRoster,'progress-directory-heading');node('span','01 / CHOOSE A CLASSROOM',heading,'eyebrow');node('h3','Which class are you checking today?',heading);
    const active=classes.filter(c=>c.status==='active');
    if(!active.length){node('p','Create or restore a class, then invite students to see them here.',allClassRoster,'teacher-note');button('Go to My Classes',allClassRoster,async ()=>(await tab('classes')));return;}
    node('p','Choose a classroom, then open a student report. Questions and support tools are available inside each class.',heading,'teacher-note');
    const searchLabel=node('label','Find a classroom',allClassRoster,'progress-class-search');const search=node('input',null,searchLabel);search.type='search';search.placeholder='Type a classroom name';search.setAttribute('aria-controls','teacherAllClassRoster');const searchStatus=node('p',active.length+' classrooms',searchLabel,'teacher-note');searchStatus.setAttribute('role','status');search.addEventListener('input',()=>{let count=0;for(const card of allClassRoster.querySelectorAll('.progress-class-choice')){card.hidden=!card.dataset.className.includes(search.value.trim().toLocaleLowerCase());if(!card.hidden)count++;}searchStatus.textContent=count?count+' matching classroom'+(count===1?'':'s'):'No classrooms match. Try another name.';});
    for(const classroom of active){
        const card=node('article',null,allClassRoster,'teacher-class-card progress-class-choice');card.dataset.className=classroom.name.toLocaleLowerCase();const header=node('div',null,card,'progress-class-choice-heading');node('span',classroom.name.slice(0,1).toLocaleUpperCase(),header,'progress-class-emblem').setAttribute('aria-hidden','true');const identity=node('div',null,header);node('span','CLASSROOM',identity,'eyebrow');node('h4',classroom.name,identity);
        node('p',classroom.description||'View students, discuss their learning, and plan support.',card,'teacher-note');const open=node('a','Open student list',card,'progress-open-class');const destination=new URL(teacherRoutes.students,location.href);destination.searchParams.set('class',classroom.id);open.href=destination.href;open.setAttribute('aria-label','View students in '+classroom.name);
        const preview=node('details',null,card,'progress-roster-preview');node('summary','Preview student list',preview);
        const output=node('div',null,preview);output.setAttribute('aria-live','polite');
        const controls=node('div',null,preview,'teacher-actions');let page=0,members=null;
        const request=allRosterRequest;
        const load=()=>task(async()=>{
            const generation=epoch,current=()=>generation===epoch&&request===allRosterRequest&&card.isConnected;
            output.replaceChildren();node('p','Loading joined students...',output,'teacher-note');
            try{
                const data=await loadTeacherClass(classroom.id);if(!current())return;
                members=data.members;page=Math.min(page,Math.max(0,Math.ceil(members.length/20)-1));
                const group=members.slice(page*20,(page+1)*20);
                const identities=group.length?await loadTeacherRosterNames(classroom.id,group.map(m=>m.userId)):[];if(!current())return;
                output.replaceChildren();
                if(!members.length)node('p','No students have joined this class yet.',output,'teacher-note');
                else node('p',`Students ${page*20+1}-${page*20+group.length} of ${members.length} in this class.`,output,'teacher-note');
                for(const member of group){
                    const row=node('div',null,output,'teacher-dashboard-entry');
                    const identity=identities.find(item=>item.userId===member.userId);
                    const name=identity?.name||'Name unavailable · Account '+member.userId.slice(-8);node('strong',name,row);
                    const link=node('a','View Learning Report',row,'teacher-class-link');
                    const url=new URL(teacherRoutes.students,location.href);url.searchParams.set('class',classroom.id);url.searchParams.set('student',member.userId);link.href=url.href;
                    link.setAttribute('aria-label','View learning report for '+name+' in '+classroom.name);
                }
                controls.replaceChildren();button('Refresh Students',controls,load);
                if(page>0)button('Previous Students',controls,()=>{page--;load();});
                if((page+1)*20<members.length)button('Next Students',controls,()=>{page++;load();});
            }catch(error){if(current()){output.replaceChildren();node('p','Students could not load. Retry this class; other class views remain available.',output,'teacher-note');}throw error;}
        });
        button('Load Students',controls,load);
    }
}
const publicationWrites=new Map();
const formBaselines = new Map();
let pendingClassroomChange=null;
const classroomRecovery=node('section',null,null,'teacher-change-recovery');classroomRecovery.id='teacherClassroomRecovery';classroomRecovery.hidden=true;classroomRecovery.setAttribute('aria-label','Classroom change recovery');const classroomRecoveryText=node('p','',classroomRecovery);classroomRecoveryText.setAttribute('role','status');$('teacherStatus').after(classroomRecovery);
button('Check classroom status',classroomRecovery,()=>{if(!pendingClassroomChange||busy)return;const pending=pendingClassroomChange;task(async()=>{await refresh(pending.classId);pendingClassroomChange=null;classroomRecovery.hidden=true;if(pending.draft){$('editClassName').value=pending.draft.name;$('editClassDescription').value=pending.draft.description;}applyArchiveState();},'Current classroom state loaded. Check the saved details before making another change.');});
function runClassroomChange(work,success,preserveClassEdits=false){if(pendingClassroomChange||busy)return;const classId=selected,draft=preserveClassEdits?{name:$('editClassName').value,description:$('editClassDescription').value}:null;let committed=false;
    return task(async()=>{try{await work();committed=true;}catch(error){if(!['failed-precondition','permission-denied','unauthenticated','invalid-argument'].includes(String(error.code||'').replace(/^firestore\//,''))){pendingClassroomChange={classId,draft};classroomRecovery.hidden=false;classroomRecoveryText.textContent='The change could not be confirmed. Do not repeat it yet. Check classroom status first; no automatic retry was sent.';}throw error;}
        try{await refresh(classId);}catch{pendingClassroomChange={classId,draft};classroomRecovery.hidden=false;classroomRecoveryText.textContent=success+' The change was saved, but the view could not refresh. Check classroom status before making another change.';}
    },()=>pendingClassroomChange?(committed?'Change saved. Use Check classroom status to refresh the view.':'Check classroom status before retrying.'):success);
}
const editForms = ['createClassForm', 'editClassForm', 'announcementForm', 'assignmentForm','teacherFeedbackForm','teacherSupportForm'];
const formSignature = form => JSON.stringify([...form.querySelectorAll('input, textarea, select')].map(input => [input.name || input.id, input.value]));
function rememberEdits(ids = editForms) { for (const id of ids) if ($(id)) formBaselines.set(id, formSignature($(id))); for(const kind of ['announcement','assignment'])syncPublicationIndicators(kind); }
function hasUnsavedEdits() { return !!pendingClassroomChange || editForms.some(id => $(id) && formBaselines.has(id) && formSignature($(id)) !== formBaselines.get(id)) || !!document.querySelector('.teacher-help-request form[data-sending=true]') || [...document.querySelectorAll('.teacher-help-request textarea')].some(input=>!input.disabled&&input.value.trim()); }
async function allowDiscard() {
    if(pendingClassroomChange){message('Check classroom status before switching or making another change.',true);return false;}
    if(routeName==='settings'&&(profileSaving||preferredName.value.trim()!==accountNameBaseline)){if(profileSaving){message('Wait for your profile save to finish.',true);return false;}if(!(await appConfirm('Leave without saving your display name?')))return false;}
    if([...publicationWrites.values()].some(attempt=>attempt.uncertain)){message('Check save status before switching classrooms or refreshing. The previous save may already have reached the server.',true);return false;}
    if (!hasUnsavedEdits()) return true;
    const discard = (await appConfirm('You have unsaved class details, instructions or messages. Discard those edits and continue?'));
    if (!discard) message('Your unsaved edits are still here. Save or cancel editing before switching or refreshing.');
    return discard;
}
window.addEventListener('beforeunload', event => {
    if (hasUnsavedEdits()) { event.preventDefault(); event.returnValue = ''; }
});
function node(tag, text, parent, className) {
    const el = document.createElement(tag); if (text != null) el.textContent = text;
    if (className) el.className = className;
    parent?.append(el); return el;
}
function button(text, parent, callback, secondary = true) {
    const el = node('button', text, parent, secondary ? 'secondary' : ''); el.type = 'button'; el.addEventListener('click', callback); return el;
}
const statusActions=node('div',null,null,'teacher-status-actions');statusActions.id='teacherStatusActions';statusActions.hidden=true;$('teacherStatus').after(statusActions);
button('Reload Workspace',statusActions,async ()=>{if(busy||!(await allowDiscard()))return;location.reload();});
function message(text, error = false, state = '') {
    const status=$('teacherStatus');status.textContent=text;status.dataset.error=String(error);
    status.dataset.state=state||(error?'error':text?'info':'idle');
    statusActions.hidden=!error;
}
function operationError(error) {
    const code=String(error?.code||'').replace(/^firestore\//,'');
    if(code==='permission-denied')return 'Access was denied. Your account, class membership or server permissions may have changed. Refresh and try again.';
    if(['unavailable','deadline-exceeded','network-request-failed'].includes(code))return 'The service could not be reached. Your unsaved text is still here. Check your connection, then retry the action. No automatic retry was sent.';
    if(code==='resource-exhausted')return 'The service usage limit was reached. Your unsaved text is still here. Try again later. No automatic retry was sent.';
    if(code==='unauthenticated')return 'Your session could not be verified. Reload the workspace to check access again. Unsaved changes require confirmation before leaving.';
    return error?.message||'Unable to complete this action. Your unsaved text is still here. Retry when ready.';
}
function date(value) {
    try { return new Intl.DateTimeFormat('en-PH', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila'}).format(value.toDate()); }
    catch { return 'Date unavailable'; }
}
async function task(work, success = '') {
    if (busy) return;
    busy = true; const generation = epoch; $('teacher-main').setAttribute('aria-busy', 'true');
    $('teacherStatus').dataset.busy = 'true';
    applyArchiveState();
    $('refreshTeacher').disabled = true;
    document.querySelectorAll('#teacher-main button, #teacher-main input, #teacher-main textarea, #teacher-main select').forEach(el => el.disabled = true);
    message('Working... Please wait.',false,'loading');
    try { await work(); if (generation === epoch){const text=typeof success==='function'?success():success;if(text)message(text,false,'success');else if($('teacherStatus').dataset.state==='loading')message('',false,'idle');} }
    catch (error) {
        if (generation === epoch) {
            message(operationError(error),true);for(const kind of ['announcement','assignment']){const form=$(kind+'Form');if(form?.closest('dialog')?.open){form.dataset.operationError=operationError(error);syncPublicationIndicators(kind);}}
        }
    } finally {
        if (generation === epoch) {
            busy = false; $('teacher-main').setAttribute('aria-busy', 'false');
            $('teacherStatus').dataset.busy = 'false';
            document.body.classList.remove('workspace-loading');
            $('teacherContentLoading').hidden = true;
            $('refreshTeacher').disabled = false;
            document.querySelectorAll('#teacher-main button, #teacher-main input, #teacher-main textarea, #teacher-main select').forEach(el => el.disabled = false);
            applyArchiveState();syncPublicationIndicators('announcement');syncPublicationIndicators('assignment');
            statusActions.querySelectorAll('button').forEach(control=>control.disabled=false);
        }
    }
}
function applyArchiveState() {
    syncPublicationIndicators('announcement');syncPublicationIndicators('assignment');
    const classroomWorkspace=classManagement.querySelector('.classroom-workspace');if(classroomWorkspace)classroomWorkspace.hidden=!detail;
    document.querySelectorAll('[data-teacher-tab]').forEach(control => {
        control.setAttribute('aria-disabled', String(!workspaceReady || busy));
        control.tabIndex = !workspaceReady || busy ? -1 : 0;
    });
    const archived = detail?.classroom.status === 'archived';
    $('activeClassTools').hidden = !detail || archived;
    classSettings.hidden=!detail||archived;classSafety.hidden=!detail;
    $('archiveNote').hidden = !archived;
    $('assignmentForm').hidden = !workspaceReady;
    assignmentRecipient.disabled=busy||Boolean($('assignmentForm').dataset.recordId);syncAssignmentBoard();
    assignmentPurpose.disabled=busy||Boolean($('assignmentForm').dataset.recordId);reviewTopic.disabled=reflectionQuestion.disabled=busy||!!detail?.assignments.find(a=>a.id===$('assignmentForm').dataset.recordId)?.assignedAt;
    $('assignmentMission').disabled=busy||(Boolean($('assignmentForm').dataset.recordId)&&assignmentPurpose.value==='targeted-review');
    $('announcementForm').hidden = !workspaceReady;
    announcementRecipient.disabled=busy||Boolean($('announcementForm').dataset.recordId);announcementClassView.disabled=busy||!workspaceReady;syncAnnouncementTabs();
    $('archiveClass').textContent = archived ? 'Restore Class' : 'Archive Class';
    $('archiveClass').closest('.teacher-actions').hidden = !detail;
    if(detail){const shareable=detail.classroom.status==='active'&&detail.invitation?.status==='active'&&detail.invitation.expiresAt?.toMillis()>Date.now();$('copyTeacherCode').disabled=busy||!shareable;$('revokeTeacherCode').disabled=busy||!shareable;}
    assignmentShortcut.hidden = !workspaceReady || !detail || archived || activeTab !== 'overview';
    if(pendingClassroomChange)document.querySelectorAll('#archiveClass,#rotateTeacherCode,#revokeTeacherCode,#editClassForm button,#announcementList button,#assignmentList button,#announcementForm button[type=submit],#assignmentForm button[type=submit]').forEach(control=>control.disabled=true);
}
function renderClassroomWorkspaceNavigation(name){
    $('teacherClassroomNavigation')?.remove();if(!detail||!['classes','students','assignments','announcements'].includes(name)||(name==='classes'&&!classroomDetailPage))return;
    const nav=node('nav',null,null,'classroom-workspace-nav');nav.id='teacherClassroomNavigation';nav.setAttribute('aria-label','Selected classroom workspace');const copy=node('div',null,nav,'classroom-workspace-context');node('span','WORKING IN',copy,'eyebrow');node('strong',detail.classroom.name,copy);const links=node('div',null,nav,'classroom-workspace-links');for(const [key,label]of [['classes','Overview'],['students','Students'],['assignments','Activities'],['announcements','Announcements']]){const link=node('a',label,links);link.href=key==='classes'?classroomURL(selected):teacherRouteURL(key);if(key===name)link.setAttribute('aria-current','page');}document.querySelector('.teacher-intro').after(nav);
}
async function tab(name, parameters = {}) {
    if (!sectionNames.includes(name)) return;
    if (workspaceReady && name !== routeName) {
        (await navigateTeacherPage(name, parameters));
        return;
    }
    renderClassroomWorkspaceNavigation(name);
    const changed = activeTab !== name;
    activeTab = name;
    assignmentShortcut.hidden = !workspaceReady || !detail || detail?.classroom.status === 'archived' || name !== 'overview';
    assignmentShortcut.textContent = detail ? 'Write Announcement' : classes.length ? 'Choose a Class' : 'Create Your First Class';
    closeTeacherMenu();
    const headings = {overview:['Teacher Dashboard', 'Your classes, student follow-ups, and teaching priorities in one place.'],classes:['My Classes', 'Organize your classroom, invite students, and manage class details.'],students:['Student Progress', 'Understand student learning, respond to questions, and guide the next step.'],announcements:['Class announcements', 'Prepare clear messages and choose when students can see them.'],assignments:['Assigned missions', 'Choose a lesson and guide your class through its learning goal.'],settings:['Account settings','Manage your sign-in and find the settings for your teaching space.']};
    document.querySelector('.teacher-intro h1').textContent = headings[name][0];
    document.querySelector('.teacher-intro p').textContent = headings[name][1];
    $('teacherPageTitle').textContent = {overview:'Teacher Dashboard',classes:'My Classes',students:'Student Progress',announcements:'Announcements',assignments:'Assigned Missions',settings:'Account Settings'}[name];
    $('teacherClassSummary').hidden = !detail || name !== 'overview';
    document.querySelector('.teacher-intro').classList.add('teacher-intro-compact');
    if (name === 'classes') classPicker.open = true;
    else classPicker.open = false;
    classPicker.hidden=name==='settings'||name==='overview'&&!detail;
    $('teacherWelcome').hidden = !!detail || name !== 'overview';
    if (!detail && name === 'overview' && workspaceReady) renderEmptyDashboard();
    $('teacherClassDetail').hidden = !detail && name === 'overview';
    $('selectedClassTitle').hidden = true;
    $('classState').hidden = true;
    classManagementTitle.hidden = true;
    if(name==='classes'&&classListLoaded){const heading=$('teacherClassPickerLabel');heading.replaceChildren();const copy=node('span',null,heading,'class-collection-heading-copy');node('strong','Your classrooms',copy);node('span','Choose the class you want to work with.',copy);node('span',classes.filter(c=>c.status==='active').length+' active',heading,'class-collection-count');node('span','',heading,'class-collection-toggle').setAttribute('aria-hidden','true');}
    for (const {empty, content} of emptySections.values()) {
        empty.hidden = !!detail; content.hidden = !detail;
    }
    if(name==='classes'){
        if(classroomSettingsPanel){classroomSettingsPanel.hidden=!detail;classManagement.append(classManagement.querySelector('.classroom-workspace'),$('activeClassTools'),classroomSettingsPanel);}
        classPicker.hidden=classroomDetailPage;
        const backId='teacherClassroomBack';let back=$(backId);
        if(classroomDetailPage){if(!back){back=node('a','Back to My Classes',null,'classroom-back-link');back.id=backId;back.href=teacherRoutes.classes;document.querySelector('.teacher-intro').before(back);}document.querySelector('.teacher-intro h1').textContent=detail?.classroom.name||'Classroom';document.querySelector('.teacher-intro p').textContent=detail?'Manage this classroom, share its invitation, and open teaching tools.':classListLoaded?'This classroom is unavailable. Return to My Classes and choose a classroom you own.':'Loading classroom details...';$('teacherPageTitle').textContent='Classroom details';}
    }
    renderStudentClassFilter();
    allClassRoster.hidden=name!=='students'||!!detail;studentListPanel.hidden=name!=='students'||!detail;
    if(name==='students'&&!detail){emptySections.get('students').empty.hidden=true;renderAllClassRoster();}
    if(name==='students')classPicker.hidden=true;
    if(name==='assignments'){
        classPicker.hidden=true;
        emptySections.get('assignments').empty.hidden=true;
        emptySections.get('assignments').content.hidden=false;$('assignmentForm').hidden=!workspaceReady;
        renderAssignmentRecipients();renderAssignmentPreview();
        if(!detail){$('assignmentList').replaceChildren();$('assignmentSummary').textContent='Prepare an assignment without selecting a class first. Choose a class in the toolbar to review its saved assignments.';}
        renderLessonCatalog(!catalogInitialized);
        lessonCatalog.open=false;
    }
    if(name==='announcements'){
        classPicker.hidden=true;
        emptySections.get('announcements').empty.hidden=true;emptySections.get('announcements').content.hidden=false;
        $('announcementForm').hidden=!workspaceReady;
        renderAnnouncementRecipients();renderAnnouncementPreview();
        if(!detail){$('announcementList').replaceChildren();$('announcementSummary').textContent='Choose a class in the class toolbar to review its saved announcements. You can compose a new message without selecting one first.';}
    }
    for (const section of sectionNames) {
        $('teacher-' + section).hidden = section !== name || (!detail && section === 'overview');
        const control = document.querySelector(`[data-teacher-tab="${section}"]`);
        control.href = teacherRouteURL(section);
        control.setAttribute('aria-pressed', String(section === name));
        if (section === name) control.setAttribute('aria-current', 'page');
        else control.removeAttribute('aria-current');
    }
    if (name === 'classes') {
        if(classPicker.parentElement !== $('teacher-classes')) $('teacher-classes').prepend(classPicker);
    } else document.querySelector('.teacher-layout').before(classPicker);
    $('teacherAllClassesLink')?.remove();
    if(name==='overview'&&detail){const back=node('a','All Classes',null,'teacher-class-link');back.id='teacherAllClassesLink';back.href=teacherRoutes.overview;document.querySelector('.teacher-intro').after(back);}
    sectionAnimation?.cancel(); sectionAnimation = null;
    if (changed && workspaceReady && !matchMedia('(prefers-reduced-motion: reduce)').matches && !document.body.classList.contains('lakbay-reduce-motion')) {
        const target = !detail && name === 'overview' ? $('teacherWelcome') : $('teacher-' + name);
        sectionAnimation = target.animate([{opacity:0, transform:'translateX(12px)'},{opacity:1, transform:'translateX(0)'}], {duration:240, easing:'cubic-bezier(.22,.8,.24,1)'});
    }
}
function renderEmptyDashboard() {
    const root = $('teacherWelcome'); root.replaceChildren();
    root.classList.add('teacher-empty-dashboard');
    const heading = node('h2', 'Your classroom overview', root); heading.id = 'teacherWelcomeTitle';
    const empty = classListLoaded && !classes.length;
    if(classListLoaded){renderAllClassesDashboard(root);return;}
    node('p', empty ? 'Your dashboard is ready. Create your first class to invite students and start seeing their learning activity.' : 'Choose a class to view its students, learning activity and support signals.', root, 'teacher-note');
    const summary = node('div', null, root, 'teacher-summary');
    for (const [label, value, note] of [['Joined students',empty ? '0' : '—','Students appear after joining your class'],['Published missions',empty ? '0' : '—','Assign existing history lessons'],['Quiz average','—','Available after students submit quizzes'],['Quiz activity · 7 days','—','Available after dated quiz submissions']]) {
        const card = node('div', null, summary); node('strong',value,card); node('span',label,card); node('small',note,card);
    }
    const feed = node('div', null, root, 'teacher-dashboard-feed');
    const activity = node('section',null,feed,'teacher-dashboard-card teacher-activity');
    node('h3','Recent learning activity',activity);
    node('p',empty ? 'No classroom activity yet.' : 'Select a class to load recent activity.',activity);
    node('p','Saved quiz submissions and mission completions will appear here when students begin learning.',activity,'teacher-note');
    button(empty ? 'Create Your First Class' : 'Choose a Class',activity,async ()=>(await tab('classes')),false);
    const support = node('section',null,feed,'teacher-dashboard-card teacher-checkins');
    node('h3','Needs attention',support);
    node('p',empty ? 'No student results to review yet.' : 'Student results have not been loaded for a class.',support);
    node('p','After students join, this panel will help you find topics to discuss and open their learning reports.',support,'teacher-note');
}
let overviewPage=0,overviewRequest=0;
function renderAllClassesDashboard(root) {
    root.replaceChildren();root.classList.add('teacher-overview-home');
    const generation=epoch,request=++overviewRequest,current=()=>generation===epoch&&request===overviewRequest&&root.isConnected&&!detail;
    const active=classes.filter(c=>c.status==='active');overviewPage=Math.min(overviewPage,Math.max(0,Math.ceil(active.length/6)-1));
    const visible=active.slice(overviewPage*6,(overviewPage+1)*6);
    const route=(name,classId,parameters={})=>{const url=new URL(teacherRoutes[name],location.href);if(classId)url.searchParams.set('class',classId);for(const [key,value] of Object.entries(parameters))if(value)url.searchParams.set(key,value);return url.href;};
    const action=(parent,label,name,classId,primary=false,parameters={})=>{const link=node('a',label,parent,primary?'overview-button is-primary':'overview-button');link.href=route(name,classId,parameters);return link;};
    const hero=node('header',null,root,'overview-hero');const greeting=node('div',null,hero);node('span','YOUR TEACHING DESK',greeting,'eyebrow');
    const teacherName=(auth.currentUser?.displayName||active.find(c=>c.teacherName)?.teacherName||'').trim();node('h1',teacherName?'Welcome back, '+teacherName+'.':'Your teaching day, in focus.',greeting).id='teacherWelcomeTitle';
    node('p',active.length?'See where your classes are, respond to students, and plan their next discovery.':'Start your classroom, invite students, and guide their history journey.',greeting);
    const heroAside=node('div',null,hero,'overview-hero-aside');node('span',new Intl.DateTimeFormat('en-PH',{weekday:'long',month:'long',day:'numeric',timeZone:'Asia/Manila'}).format(new Date()),heroAside,'overview-date');
    const heroActions=node('div',null,heroAside,'overview-actions');action(heroActions,active.length?'Plan a learning activity':'Create your first class',active.length?'assignments':'classes',active.length===1?active[0].id:null,true);
    const metrics=node('div',null,root,'overview-metrics');metrics.setAttribute('aria-label','Teaching overview summary');
    const iconPaths={classes:'M3 21h18M5 21V9l7-6 7 6v12M9 21v-6h6v6M9 10h6',students:navigationIcons.students,goals:'M5 21V3m0 1h14l-3 4 3 4H5',responses:'M21 11a8 8 0 0 1-8 8H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v4ZM8 8h8M8 12h5'};
    const metric=(label,note,icon)=>{const card=node('article',null,metrics,'overview-metric');card.dataset.metric=icon;const emblem=node('span','',card,'overview-metric-icon');emblem.setAttribute('aria-hidden','true');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',iconPaths[icon]);svg.append(path);emblem.append(svg);const copy=node('div',null,card);node('span',label,copy,'overview-metric-label');const value=node('strong','—',copy);node('small',note,copy);return value;};
    metric('Active classes','Your active learning spaces','classes').textContent=String(active.length);
    const students=metric('Students in view','Across the classrooms below','students'),goals=metric('Class learning goals','Published activities in view','goals'),pending=metric('Needs a response','Questions and explanations','responses');
    const scope=node('p',active.length?'Loading a classroom snapshot…':'No class data yet. Your overview will fill in as students join.',root,'overview-scope');scope.setAttribute('role','status');
    const columns=node('div',null,root,'overview-columns');
    const attention=node('section',null,columns,'overview-panel overview-attention');node('span','MAKE A DIFFERENCE',attention,'eyebrow');const attentionHeading=node('div',null,attention,'overview-panel-heading');node('h3','Needs your guidance',attentionHeading);const attentionCount=node('span','Checking',attentionHeading,'overview-count-pill');node('p','Private questions and explanations, with one clear next action.',attention,'teacher-note');
    const attentionFilters=node('div',null,attention,'attention-filters');attentionFilters.setAttribute('role','group');attentionFilters.setAttribute('aria-label','Filter student follow-ups');const attentionList=node('div',null,attention,'overview-attention-list');const attentionStatus=node('p','',attention,'attention-status');attentionStatus.setAttribute('role','status');
    let attentionItems=[],attentionResults=[],attentionFilter='all',attentionLoaded=false,attentionIncomplete=false,attentionPage=0,attentionClass='all';const attentionButtons=[];
    const attentionClassLabel=node('label','Classroom',attentionFilters,'attention-class-filter'),attentionClassSelect=node('select',null,attentionClassLabel);node('option','All classrooms in view',attentionClassSelect).value='all';for(const classroom of visible)node('option',classroom.name,attentionClassSelect).value=classroom.id;attentionClassSelect.addEventListener('change',()=>{attentionClass=attentionClassSelect.value;attentionPage=0;renderAttention();});const attentionPaging=node('div',null,attention,'attention-paging');
    const inboxLinks=node('details',null,attention,'attention-full-inboxes');node('summary','Open a classroom inbox',inboxLinks);node('p','The dashboard is a limited snapshot. Class inboxes can load more records on demand.',inboxLinks,'teacher-note');for(const classroom of visible){const row=node('div',null,inboxLinks,'attention-class-inbox');node('strong',classroom.name,row);action(row,'Questions','students',classroom.id,false,{followup:'help'});action(row,'Explanations','students',classroom.id,false,{followup:'explanation'});}
    const requestTime=item=>item.row.understanding==='needs-help'?(item.row.understandingAt||item.row.updatedAt):(item.row.submittedAt||item.row.updatedAt);
    const renderAttention=()=>{
        if(!attentionLoaded)return;attentionList.replaceChildren();attentionPaging.replaceChildren();const matching=attentionItems.filter(item=>attentionClass==='all'||item.classroom.id===attentionClass).filter(item=>attentionFilter==='all'||(attentionFilter==='explanations'?!!item.row.reviewId:!item.row.reviewId));
        for(const item of attentionButtons){item.control.disabled=false;item.control.setAttribute('aria-pressed',String(item.value===attentionFilter));}
        attentionPage=Math.min(attentionPage,Math.max(0,Math.ceil(matching.length/4)-1));attentionStatus.textContent=matching.length?'Showing '+(attentionPage*4+1)+'-'+Math.min((attentionPage+1)*4,matching.length)+' of '+matching.length+' matching follow-ups. Oldest dated requests first.':'No pending '+(attentionFilter==='all'?'follow-ups':attentionFilter)+' in this snapshot.';
        if(!matching.length){const empty=node('div',null,attentionList,'attention-empty');node('strong',attentionIncomplete?'Some follow-ups are unavailable':attentionItems.length?'Nothing waiting in this category':'You’re caught up',empty);node('p',attentionIncomplete?'Refresh the dashboard or open Student Progress to check the class.':attentionItems.length?'Try another filter to view the remaining requests.':'No unanswered questions or explanations in this snapshot. Keep checking in with your class.',empty);return;}
        for(const item of matching.slice(attentionPage*4,(attentionPage+1)*4)){
            const record=attentionResults.find(result=>result.classId===item.classroom.id)?.collections,roster=record?.classmates.rows||[],name=roster.find(person=>person.id===item.row.userId)?.displayName||'Student account '+item.row.userId.slice(-8),explanation=!!item.row.reviewId;
            const row=node('article',null,attentionList,'overview-followup attention-card');row.dataset.followupType=explanation?'explanation':'question';const header=node('div',null,row,'attention-student');node('span',name.slice(0,1).toLocaleUpperCase(),header,'attention-avatar').setAttribute('aria-hidden','true');const identity=node('div',null,header);node('strong',name,identity);node('span',item.classroom.name,identity,'overview-row-context');
            node('span',item.kind,row,'overview-followup-kind');const assignmentId=item.row.reviewId||item.row.assignmentId,assignment=[...(record?.classAssignments.rows||[]),...(record?.classReviewAssignments.rows||[])].find(entry=>entry.id===assignmentId);if(assignment)node('h4',assignment.title,row,'attention-lesson');
            const message=explanation?item.row.body:item.row.message;node('p',message?(message.length>170?message.slice(0,167)+'…':message):'This student asked for help with a learning activity.',row,'attention-preview');
            const footer=node('div',null,row,'attention-card-footer'),timestamp=requestTime(item);if(Number.isFinite(timestamp?.toMillis?.())){const time=node('time',date(timestamp),footer);time.dateTime=timestamp.toDate().toISOString();time.title='Saved request time (Philippine time)';}
            action(footer,explanation?'Review explanation':item.row.understanding==='needs-help'?'Give another explanation':'Reply to question','students',item.classroom.id,false,{followup:explanation?'explanation':'help',request:item.row.id}).classList.add('attention-action');
            const evidence=action(footer,'View learning evidence','students',item.classroom.id,false,{student:item.row.userId,fromRequest:item.row.id,fromKind:explanation?'explanation':'help'});evidence.classList.add('attention-evidence');
        }
        if(matching.length>4){const previous=button('Previous requests',attentionPaging,()=>{attentionPage--;renderAttention();});previous.disabled=attentionPage===0;node('span','Page '+(attentionPage+1)+' of '+Math.ceil(matching.length/4),attentionPaging);const next=button('Next requests',attentionPaging,()=>{attentionPage++;renderAttention();});next.disabled=(attentionPage+1)*4>=matching.length;}
    };
    for(const [value,label] of [['all','All follow-ups'],['questions','Questions'],['explanations','Explanations']]){const control=button(label,attentionFilters,()=>{attentionFilter=value;attentionPage=0;renderAttention();});control.disabled=true;control.setAttribute('aria-pressed',String(value==='all'));attentionButtons.push({value,control});}
    const activity=node('section',null,columns,'overview-panel overview-activity');node('span','CLASSROOM PULSE',activity,'eyebrow');const pulseHeading=node('div',null,activity,'pulse-heading');node('h3','What’s happening in your classes',pulseHeading);const pulseCount=node('span','Loading',pulseHeading,'pulse-count');node('p','Follow student check-ins and the learning updates you shared.',activity,'teacher-note');
    const pulseToolbar=node('div',null,activity,'pulse-filters');pulseToolbar.setAttribute('role','group');pulseToolbar.setAttribute('aria-label','Filter classroom activity');
    let pulseEvents=[],pulseFilter='all',pulseLoaded=false;const pulseButtons=[];
    const activityList=node('ol',null,activity,'overview-event-list pulse-timeline');
    const pulseStatus=node('p','',activity,'pulse-status');pulseStatus.setAttribute('role','status');
    const dayKey=value=>new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Manila'}).format(value);
    const renderPulse=()=>{
        if(!pulseLoaded)return;activityList.replaceChildren();const matching=pulseEvents.filter(event=>pulseFilter==='all'||(pulseFilter==='students'?event.label.startsWith('Student '):!event.label.startsWith('Student '))),shown=matching.slice(0,5);pulseCount.textContent=shown.length+' recent';
        for(const item of pulseButtons){item.button.disabled=false;item.button.setAttribute('aria-pressed',String(item.value===pulseFilter));}
        pulseStatus.textContent=matching.length?'Showing '+shown.length+' of '+matching.length+' dated updates in this snapshot.':'No dated updates in this category yet.';
        if(!shown.length){node('li',pulseFilter==='students'?'Student questions and explanations will appear here when they are shared.':'Class goals, reviews, and announcements will appear as you publish them.',activityList,'overview-empty');return;}
        let previousDay='';for(const event of shown){const dateValue=event.at.toDate(),key=dayKey(dateValue);if(key!==previousDay){previousDay=key;const heading=node('li',key===dayKey(new Date())?'Today':new Intl.DateTimeFormat('en-PH',{month:'long',day:'numeric',year:'numeric',timeZone:'Asia/Manila'}).format(dateValue),activityList,'pulse-day');heading.setAttribute('role','presentation');}
            const row=node('li',null,activityList,'pulse-event');const studentEvent=event.label.startsWith('Student ');row.dataset.kind=studentEvent?'student':event.route==='announcements'?'announcement':'teaching';
            const icon=node('span','',row,'pulse-icon');icon.setAttribute('aria-hidden','true');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',studentEvent?iconPaths.responses:event.route==='announcements'?navigationIcons.announcements:iconPaths.goals);svg.append(path);icon.append(svg);
            const copy=node('div',null,row,'pulse-event-copy');node('span',event.label,copy,'overview-row-context');node('strong',event.title,copy);node('span',event.classroom.name,copy,'pulse-class-label');
            action(copy,event.route==='students'?'Open student follow-ups':event.route==='announcements'?'View announcements':'View learning activity',event.route,event.classroom.id,false,event.assignmentId?{assignment:event.assignmentId}:{}).classList.add('pulse-event-link');
            const time=node('time',new Intl.DateTimeFormat('en-PH',{hour:'numeric',minute:'2-digit',timeZone:'Asia/Manila'}).format(dateValue),row);time.dateTime=dateValue.toISOString();time.title=date(event.at)+' (Philippine time)';
        }
    };
    for(const [value,label] of [['all','All activity'],['students','Student check-ins'],['teaching','Teaching updates']]){const control=button(label,pulseToolbar,()=>{pulseFilter=value;renderPulse();});control.setAttribute('aria-pressed',String(value==='all'));control.disabled=true;pulseButtons.push({value,button:control});}
    const classesPanel=node('section',null,root,'overview-panel overview-classrooms');const classHeading=node('div',null,classesPanel,'overview-section-heading');const classHeadingCopy=node('div',null,classHeading);node('span','CONTINUE TEACHING',classHeadingCopy,'eyebrow');node('h3','Your classrooms',classHeadingCopy);node('p','Open a class, guide its learning, or follow up with students.',classHeadingCopy,'teacher-note');action(classHeading,'Manage classes','classes');
    const cards=node('div',null,classesPanel,'overview-class-grid');cards.id='teacherAllClassCards';const classOutputs=new Map();
    for(const classroom of visible){const card=node('article',null,cards,'overview-class-card');card.dataset.classId=classroom.id;const header=node('header',null,card,'room-card-heading');node('span',classroom.name.trim().slice(0,1).toLocaleUpperCase(),header,'overview-class-emblem').setAttribute('aria-hidden','true');const identity=node('div',null,header,'room-card-identity');node('span','ACTIVE CLASS',identity,'overview-class-label');node('h4',classroom.name,identity);
        if(classroom.description)node('p',classroom.description,card,'room-description');
        const stats=node('div',null,card,'room-stat-grid'),values={};for(const [key,label] of [['students','Students'],['goals','Class goals'],['reviews','Personal reviews']]){const stat=node('div',null,stats);stat.dataset.roomStat=key;values[key]=node('strong','—',stat);node('span',label,stat);}
        const result=node('p','Loading classroom snapshot…',card,'overview-class-summary');classOutputs.set(classroom.id,{card,result,values});
        const actions=node('div',null,card,'overview-actions');const open=node('a','Open classroom',actions,'overview-button is-primary');open.href=classroomURL(classroom.id);open.setAttribute('aria-label','Open '+classroom.name);
    }
    if(!active.length){pulseCount.textContent='0 recent';attentionCount.textContent='0 pending';for(const value of [students,goals,pending])value.textContent='0';node('p','No requests yet. Students can ask for help after you publish a learning activity.',attentionList,'overview-empty');node('li','Classroom activity will appear as you and your students begin.',activityList,'overview-empty');node('p','Create a class and share its invitation code. Students keep their personal progress when they join.',cards,'overview-empty');action(cards,'Set up a class','classes',null,true);return;}
    node('p','Checking student follow-ups…',attentionList,'overview-empty');node('li','Loading recent classroom updates…',activityList,'overview-empty');
    if(active.length>6){const pages=node('div',null,classesPanel,'overview-actions');node('p','Class group '+(overviewPage+1)+' of '+Math.ceil(active.length/6),pages,'teacher-note');if(overviewPage>0)button('Previous classes',pages,()=>{overviewPage--;renderAllClassesDashboard(root);});if((overviewPage+1)*6<active.length)button('Next classes',pages,()=>{overviewPage++;renderAllClassesDashboard(root);});}
    const load=async()=>{
      try{const results=await loadTeacherDashboard(visible.map(c=>c.id));if(!current())return;
        const userIds=new Set(),requests=[],events=[];let goalCount=0,reviewCount=0,partial=false,limited=false,memberLimited=false;
        for(const result of results){const classroom=visible.find(c=>c.id===result.classId),output=classOutputs.get(result.classId);if(result.unavailable){partial=true;output.result.textContent='Class summary unavailable. Open the class or refresh to retry.';continue;}
          const collections=result.collections;for(const record of Object.values(collections)){partial||=!!record.unavailable;limited||=!!record.limited;}
          const members=collections.classMembers.rows,memberIds=new Set(members.map(m=>m.userId));memberLimited||=!!collections.classMembers.limited;members.forEach(m=>userIds.add(m.userId));
          const shared=collections.classAssignments.rows.filter(a=>a.status==='published'),reviews=collections.classReviewAssignments.rows.filter(a=>a.status==='published');goalCount+=shared.length;reviewCount+=reviews.length;
          output.values.students.textContent=collections.classMembers.unavailable?'—':String(members.length)+(collections.classMembers.limited?'+':'');output.values.goals.textContent=collections.classAssignments.unavailable?'—':String(shared.length)+(collections.classAssignments.limited?'+':'');output.values.reviews.textContent=collections.classReviewAssignments.unavailable?'—':String(reviews.length)+(collections.classReviewAssignments.limited?'+':'');
          const classPending=collections.classHelpRequests.rows.filter(row=>memberIds.has(row.userId)&&(row.status==='open'||row.understanding==='needs-help')).length+collections.classReviewReflections.rows.filter(row=>memberIds.has(row.userId)&&!row.response).length;
          const classIncomplete=collections.classMembers.unavailable||collections.classHelpRequests.unavailable||collections.classReviewReflections.unavailable;
          output.result.textContent=classIncomplete?'Follow-up status could not be fully checked.':classPending?classPending+' follow-up'+(classPending===1?' needs':'s need')+' your guidance.':'No pending follow-ups in this snapshot.';output.result.dataset.pending=String(!classIncomplete&&classPending>0);
          const eligible=row=>memberIds.has(row.userId);
          for(const row of collections.classHelpRequests.rows){if(eligible(row)&&(row.status==='open'||row.understanding==='needs-help'))requests.push({classroom,row,kind:row.understanding==='needs-help'?'More explanation requested':'Question waiting for a reply'});if(eligible(row))events.push({classroom,label:row.status==='answered'?'Teacher guidance sent':'Student asked for help',title:shared.find(a=>a.id===row.assignmentId)?.title||reviews.find(a=>a.id===row.assignmentId)?.title||'Learning support',at:row.updatedAt,route:'students'});}
          for(const row of collections.classReviewReflections.rows){if(eligible(row)&&!row.response)requests.push({classroom,row,kind:'Understanding check to review'});if(eligible(row))events.push({classroom,label:row.response?'Explanation feedback sent':'Student shared an explanation',title:reviews.find(a=>a.id===row.reviewId)?.title||'Personal review',at:row.response?row.respondedAt:row.submittedAt,route:'students'});}
          for(const item of [...shared,...reviews,...collections.classAnnouncements.rows.filter(a=>a.status==='published')])events.push({classroom,label:item.assignmentType==='targeted-review'?'Personal review published':item.missionId?'Class learning goal shared':'Announcement published',title:item.title,at:item.updatedAt,route:item.missionId?'assignments':'announcements',assignmentId:item.missionId?item.id:null});
        }
        const anyMemberError=results.some(r=>r.unavailable||r.collections?.classMembers.unavailable),anyGoalError=results.some(r=>r.unavailable||r.collections?.classAssignments.unavailable),anyHelpError=results.some(r=>r.unavailable||r.collections?.classMembers.unavailable||r.collections?.classHelpRequests.unavailable||r.collections?.classReviewReflections.unavailable);
        students.textContent=anyMemberError?'—':String(userIds.size)+(memberLimited?'+':'');goals.textContent=anyGoalError?'—':String(goalCount)+(limited?'+':'');pending.textContent=anyHelpError?'—':String(requests.length)+(limited?'+':'');
        scope.textContent='Snapshot: '+new Intl.DateTimeFormat('en-PH',{hour:'numeric',minute:'2-digit',timeZone:'Asia/Manila'}).format(new Date())+' · '+visible.length+' of '+active.length+' active classes · '+reviewCount+' published personal reviews.'+(active.length>6?' Counts cover this class group.':'')+(partial?' Some data could not load; unavailable counts are shown as —.':'')+(limited?' Large lists are limited to 100 records per type per class; + indicates a partial count.':'');
        attentionCount.textContent=anyHelpError?'Unavailable':requests.length+' pending';requests.sort((a,b)=>(requestTime(a)?.toMillis?.()||Infinity)-(requestTime(b)?.toMillis?.()||Infinity));attentionItems=requests;attentionResults=results;attentionIncomplete=anyHelpError;attentionLoaded=true;renderAttention();if(anyHelpError){attentionStatus.textContent+=' Some sources could not load. Refresh or open Student Progress to check.';if(!requests.length)attentionList.replaceChildren(node('p','Follow-ups could not be fully checked. Refresh to retry.',null,'overview-empty'));}
        pulseEvents=events.filter(event=>Number.isFinite(event.at?.toMillis?.())&&event.at.toMillis()<=Date.now()).sort((a,b)=>b.at.toMillis()-a.at.toMillis());pulseLoaded=true;renderPulse();if(partial)pulseStatus.textContent+=' Some sources could not load; refresh to retry.';
      }catch{if(current()){for(const value of [students,goals,pending])value.textContent='—';pulseCount.textContent='Unavailable';attentionCount.textContent='Unavailable';scope.textContent='Classroom summary could not load. Your saved data is unchanged.';attentionList.replaceChildren();node('p','Refresh the dashboard to try again.',attentionList,'overview-empty');activityList.replaceChildren();node('li','Activity unavailable.',activityList,'overview-empty');for(const output of classOutputs.values())output.result.textContent='Summary unavailable.';button('Retry overview',attentionList,()=>renderAllClassesDashboard(root));}}
    };load();
}

function renderOverview() {
    const c = detail.classroom, summary = $('teacherClassSummary'); summary.replaceChildren();
    const published = rows => rows.filter(item => item.status === 'published').length;
    dashboardFeed.replaceChildren();
    const activity = node('section', null, dashboardFeed, 'teacher-dashboard-card teacher-activity');
    activity.id = 'teacherRecentActivity'; node('h3', 'Recent learning activity', activity);
    const activityOutput = node('div', null, activity); activityOutput.id = 'teacherActivityOutput'; activityOutput.setAttribute('aria-live','polite');
    node('p', 'Saved quiz attempts and mission completions will appear when class insights load.', activityOutput, 'teacher-note');
    renderDashboardCheckins();
    const insights=node('section',null,dashboardFeed,'teacher-dashboard-card teacher-quiz-insights');
    insights.id='teacherQuizInsights';node('h3','Quiz review topics',insights);
    node('p','Load class insights to see recorded review topics for this student group.',insights,'teacher-note');
    for (const [heading, items, destination, action] of [
        ['Current assignments', detail.assignments, 'assignments', 'Manage Assigned Missions'],
        ['Recent announcements', detail.announcements, 'announcements', 'Write Announcement']
    ]) {
        const card = node('section', null, dashboardFeed, 'teacher-dashboard-card');
        node('h3', heading, card);
        const recent = items.filter(item => item.status === 'published').sort((a,b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)).slice(0,destination === 'announcements' ? 2 : 3);
        if (!recent.length) node('p', destination === 'assignments' ? 'No missions published yet. Choose a lesson when your class is ready.' : 'No announcements published yet. Share a short reminder with your class.', card, 'teacher-note');
        for (const item of recent) {
            const entry = node('article', null, card, 'teacher-dashboard-entry');
            node('strong', item.title, entry);
            const text = destination === 'assignments' ? missionGoal(missions.find(m => m.id === item.missionId)) || item.instructions : item.body;
            if (text) node('p', text.length > 180 ? text.slice(0,177) + '…' : text, entry);
            if (destination === 'assignments' && c.status === 'active') renderDashboardCompletion(entry, item);
            if (destination === 'assignments' && c.status === 'active') button('View Mission Progress', entry, async () => {
                (await tab('assignments', {assignment: item.id}));
                const saved = [...$('assignmentList').children].find(row => row.dataset.publicationId === item.id);
                saved?.querySelector('[data-assignment-progress]')?.click();
                saved?.scrollIntoView({block:'start', behavior:'smooth'});
            });
        }
        button(action, card, async () => (await tab(destination)));
    }
    for (const [label, count] of [['Joined students', detail.members.length], ['Published missions', published(detail.assignments)]]) {
        const card = node('div', null, summary); node('strong', String(count), card); node('span', label, card);
    }
    for (const [id, label, note] of [['teacherQuizAverage','Quiz average','Latest dated quiz per student and mission'],['teacherQuizActivity','Quiz activity · 7 days','Students with a recent saved quiz']]) {
        const card = node('div', null, summary); node('strong', '—', card).id = id; node('span', label, card); node('small', 'Not loaded · ' + note, card).id = id + 'Note';
    }
    const actions = $('teacherNextActions'); actions.replaceChildren();
    const archived = c.status === 'archived';
    $('teacherNextTitle').textContent = archived ? 'This class is archived' : !detail.members.length ? 'Invite your students' : !published(detail.assignments) ? 'Share a mission to explore' : 'Check in on student learning';
    $('teacherNextDescription').textContent = archived ? 'Restore this class from My Classes to invite students, publish activities and open reports.' : !detail.members.length ? 'Open My Classes to share an invitation code. Students join from My Class and keep their existing progress.' : !published(detail.assignments) ? 'Choose a published mission and explain what students should investigate. Their normal prerequisites still apply.' : 'Open a student report to see saved results and choose a topic to discuss.';
    if (!archived) {
        if (!detail.members.length) button('Invite Students', actions, async () => { (await tab('classes')); document.querySelector('.teacher-invitation').open = true; }, false);
        else if (!published(detail.assignments)) button('Choose a Mission', actions, async () => { (await tab('assignments')); $('assignmentMission').focus(); });
        else button('Find a Student', actions, async () => { (await tab('students')); $('rosterSearch').focus(); });
    }
    else button('Manage Archived Class', actions, async () => (await tab('classes')));
    $('teacherNextActions').closest('.teacher-next').hidden = !archived && !!detail.members.length && !!published(detail.assignments);
}
function renderDashboardActivity(results, batch, total) {
    renderQuizInsights(results,batch.length,total);
    const output = $('teacherActivityOutput'); if (!output) return;
    output.replaceChildren();
    const available = results.filter(r => r.status === 'fulfilled');
    const scope = `${available.length} available student records in this group of ${batch.length}; ${total} joined students in class.`;
    const latestScores = [], active = new Set(), events = [];
    const now = Date.now(), weekStart = now - 7 * 24 * 60 * 60 * 1000;
    results.forEach((result, index) => {
        if (result.status !== 'fulfilled') return;
        const report = result.value, member = batch[index];
        const name = [report.profile?.firstName, report.profile?.lastName].filter(Boolean).join(' ') || names.get(member.userId) || 'Student';
        const signals = quizReviewSignals(report.attempts);
        const latest = new Map();
        for (const attempt of signals.attempts) {
            const time = attempt.completedAt?.toMillis?.();
            if (!attempt.missionId || !Number.isFinite(time) || time <= 0 || time > now) continue;
            if (!latest.has(attempt.missionId)) latest.set(attempt.missionId, attempt);
            if (time >= weekStart) active.add(member.userId);
            events.push({name, missionId:attempt.missionId, time, stamp:attempt.completedAt, label:'Submitted a quiz', score:Number.isFinite(attempt.score) ? attempt.score + '%' : '', kind:'quiz'});
        }
        for (const attempt of latest.values()) if (!signals.ambiguous.has(attempt.missionId) && Number.isFinite(attempt.score) && attempt.score >= 0 && attempt.score <= 100) latestScores.push(attempt.score);
        for (const progress of report.progress) {
            const time = progress.completedAt?.toMillis?.();
            if (progress.completed === true && Number.isFinite(time) && time > 0 && time <= now) events.push({name,missionId:progress.missionId,time,stamp:progress.completedAt,label:'Completed a mission',kind:'completed'});
        }
    });
    $('teacherQuizAverage').textContent = latestScores.length ? Math.round(latestScores.reduce((sum,n)=>sum+n,0)/latestScores.length) + '%' : '—';
    $('teacherQuizAverageNote').textContent = latestScores.length ? `${latestScores.length} latest dated quiz results · loaded group` : available.length ? 'No clear dated quiz scores in this group' : 'Results unavailable';
    $('teacherQuizActivity').textContent = available.length ? active.size + ' / ' + available.length : '—';
    $('teacherQuizActivityNote').textContent = available.length ? 'Saved quizzes in the last 7 days · loaded group' : 'Results unavailable';
    node('p', scope, output, 'teacher-note');
    if (!available.length) { node('p', 'Activity unavailable. Refresh class insights to try again.', output); return; }
    if (!events.length) { node('p', 'No dated quiz submissions or mission completions are available in this group yet.', output); return; }
    const list = node('ul', null, output, 'teacher-activity-list');
    for (const event of events.sort((a,b)=>b.time-a.time).slice(0,6)) {
        const row = node('li', null, list); row.dataset.kind = event.kind;
        const text = node('div', null, row);
        node('strong', event.name, text);
        node('p', event.label + ': ' + (missions.find(m=>m.id===event.missionId)?.title || event.missionId || 'Mission') + (event.score ? ' · ' + event.score : ''), text);
        node('time', date(event.stamp), row).dateTime = new Date(event.time).toISOString();
    }
}
function renderQuizInsights(results,groupSize,total) {
    const host=$('teacherQuizInsights');if(!host)return;
    host.replaceChildren();node('h3','Quiz review topics',host);
    const summary=summarizeQuizTopics(results);
    host.dataset.state=summary.available?(summary.unavailable?'partial':'loaded'):'unavailable';
    node('p',`${summary.available} available student records from this group of ${groupSize}; ${total} joined students in class. ${summary.unavailable} unavailable results.`,host,'teacher-note');
    if(!summary.available){node('p','Quiz insights unavailable. Refresh Check-ins to try again.',host);return;}
    node('p','Current signals count students whose latest clearly dated attempt recorded the topic. Historical counts include earlier attempts and repeat retries. These are diagnostic topic labels, not per-question error rates or proof of unresolved difficulty.',host,'teacher-note');
    if(summary.uncertainMissions)node('p',`${summary.uncertainMissions} student/mission histories have uncertain dates and are excluded from current-signal counts. Their historical topic records remain included.`,host,'teacher-note');
    if(!summary.topics.length){node('p','No review topics were recorded in these available quiz histories. This does not establish mastery.',host);return;}
    const label=node('label','Topic view',host,'teacher-progress-filter'),filter=node('select',null,label);filter.setAttribute('aria-label','Filter quiz review topics');
    node('option','Current signals',filter).value='current';node('option','All recorded topics',filter).value='history';
    const output=node('div',null,host);output.setAttribute('aria-live','polite');
    const show=()=>{
        output.replaceChildren();const rows=summary.topics.filter(t=>filter.value==='history'||t.currentStudents>0);
        if(!rows.length){node('p','No clear current topic signals in this group. Choose All recorded topics to review earlier records.',output);return;}
        table(output,'Review topics in this loaded student group',['Mission','Topic','Students with current signal','Historical attempts'],rows.map(item=>[missions.find(m=>m.id===item.missionId)?.title||item.missionId,String(item.topic).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]+/g,' '),item.currentStudents,item.historicalAttempts]));
    };
    filter.addEventListener('change',show);show();
    button('Open Student Progress',host,async ()=>(await tab('students')));
}
function renderDashboardCompletion(parent, assignment) {
    const host = node('div', null, parent, 'teacher-completion-summary');
    host.dataset.state = 'not-loaded';
    const status = node('p', 'Completion results not loaded.', host, 'teacher-note');
    const classId = selected, members = (assignment.assignmentType==='targeted-review'?detail.members.filter(m=>m.userId===assignment.userId):detail.members).slice(0,20);
    if (!members.length) { status.textContent = 'No students have joined this class yet.'; return; }
    const load = button('Load Completion Summary', host, () => task(async () => {
        const generation = epoch;
        host.dataset.state = 'loading'; status.textContent = 'Loading saved mission completions...';
        try {
            const results = await loadTeacherAssignmentProgress(classId, assignment, members.map(m => m.userId));
            if (generation !== epoch || selected !== classId || !host.isConnected) return;
            const unavailable = results.filter(r => r.unavailable || (r.progress && r.progress.chapterId !== assignment.chapterId)).length;
            const completed = results.filter(r => !r.unavailable && r.progress?.chapterId === assignment.chapterId && r.progress.completed === true).length;
            host.dataset.state = unavailable === results.length ? 'unavailable' : unavailable ? 'partial' : 'loaded';
            status.textContent = unavailable === results.length ? 'Completion results unavailable for this group. Try again.' : `${completed} of ${members.length - unavailable} available student records show completion. ${unavailable} unavailable results. ${assignment.assignmentType==='targeted-review'?'Only new passing results after this review count.':'Earlier independent completion counts.'}`;
            if (detail.members.length > 20) status.textContent += ' This summary covers the first 20 students only; open View Mission Progress for more.';
            load.textContent = 'Refresh Completion Summary';
        } catch (error) {
            if (generation === epoch && selected === classId && host.isConnected) {
                host.dataset.state = 'unavailable'; status.textContent = 'Completion results unavailable. Try again.';
            }
            throw error;
        }
    }));
}
function quizReviewSignals(records) { return quizSupportSignals(records); }

function renderDashboardCheckins() {
    const host = node('section', null, dashboardFeed, 'teacher-dashboard-card teacher-checkins');
    host.id = 'teacherCheckins';
    node('h3', 'Needs attention', host);
    node('p', 'Review signals from saved quizzes. Confirm understanding with the student; later practice may not appear here.', host, 'teacher-note');
    if (detail.classroom.status !== 'active') { node('p', 'Restore this class to read student results.', host); return; }
    if (!detail.members.length) { node('p', 'Check-ins will be available when students join your class.', host); return; }
    const output = node('div', null, host); output.setAttribute('aria-live', 'polite');
    host.dataset.state = 'not-loaded';
    node('p', 'Not checked yet. Load saved results for up to 20 students at a time.', output, 'teacher-note');
    const controls = node('div', null, host, 'teacher-actions');
    const classId = selected, members = [...detail.members];
    let page = 0;
    const load = () => task(async () => {
        const generation = epoch, batch = members.slice(page * 20, (page + 1) * 20);
        host.dataset.state = 'loading';
        if($('teacherQuizInsights')){$('teacherQuizInsights').dataset.state='loading';$('teacherQuizInsights').replaceChildren();node('h3','Quiz review topics',$('teacherQuizInsights'));node('p','Loading this student group’s quiz insights...',$('teacherQuizInsights'),'teacher-note');}
        if ($('teacherActivityOutput')) $('teacherActivityOutput').textContent = 'Loading recent saved learning activity...';
        for (const id of ['teacherQuizAverage','teacherQuizActivity']) { $(id).textContent = '—'; $(id+'Note').textContent = 'Loading this group...'; }
        output.replaceChildren(); node('p', 'Loading saved quiz results...', output);
        const results = [];
        for (let offset = 0; offset < batch.length; offset += 5) {
            results.push(...await Promise.allSettled(batch.slice(offset, offset + 5).map(member => loadTeacherStudent(classId, member.userId))));
            if (generation !== epoch || selected !== classId || !host.isConnected) return;
        }
        output.replaceChildren();
        renderDashboardActivity(results, batch, members.length);
        node('p', `Students ${page * 20 + 1}-${page * 20 + batch.length} of ${members.length}. Results below cover only this group.`, output, 'teacher-note');
        const reviewCount = results.filter(r => r.status === 'fulfilled' && quizReviewSignals(r.value.attempts).review.length).length;
        const unavailableCount = results.filter(r => r.status === 'rejected').length;
        host.dataset.state = unavailableCount === results.length ? 'unavailable' : unavailableCount ? 'partial' : 'loaded';
        node('p', unavailableCount === results.length ? 'Results unavailable for this group. Try Refresh Check-ins.' : `${reviewCount} ${reviewCount === 1 ? 'student' : 'students'} with review signals in this group. ${unavailableCount} unavailable results.`, output, 'teacher-checkin-summary');
        const other = node('details', null, null, 'teacher-report-history');
        node('summary', 'Other results and unavailable records', other);
        results.forEach((result, index) => {
            const member = batch[index];
            const report = result.status === 'fulfilled' ? result.value : null;
            const signals = report ? quizReviewSignals(report.attempts) : null;
            const row = node('article', null, signals?.review.length ? output : other, 'teacher-dashboard-entry');
            const name = [report?.profile?.firstName, report?.profile?.lastName].filter(Boolean).join(' ') || names.get(member.userId) || 'Student account ' + member.userId.slice(-8);
            node('strong', name, row);
            const supportLabel=quizSupportLabel(signals);row.dataset.state=supportLabel.state;
            node('span',supportLabel.label,row,'teacher-result-label');
            node('p',supportLabel.reason,row);
            node('p','Next step: '+supportLabel.next,row,'teacher-note');
            if(signals?.latestAt)node('p','Latest valid quiz record: '+date({toDate:()=>new Date(signals.latestAt)})+' (Philippine time). This is quiz evidence, not last attendance.',row,'teacher-note');
            if (!report) return;
            if (signals.review.length) {
                for(const attempt of signals.review)node('p',(missions.find(m=>m.id===attempt.missionId)?.title||attempt.missionId)+' - recorded '+date(attempt.completedAt)+' (Philippine time)',row,'teacher-note');
                const topics = [...new Set(signals.review.flatMap(a => Array.isArray(a.topicsForReview) ? a.topicsForReview : []))];
                if (topics.length) node('p', 'Discuss: ' + topics.map(value => String(value).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]+/g,' ')).join(', '), row, 'teacher-note');
            }
            if (signals.ambiguous.size) node('p', 'Some attempt dates are unclear. Review the history together.', row, 'teacher-note');
            button('Open Student Report', row, () => task(async () => {
                const current = epoch;
                const fresh = await loadTeacherStudent(classId, member.userId);
                if (current !== epoch || selected !== classId || !host.isConnected) return;
                (await tab('students', {student: member.userId})); (await renderReport(name, fresh));
                $('studentReport').scrollIntoView({block: 'start', behavior: 'smooth'});
            })).setAttribute('aria-label', 'Open student report for ' + name);
        });
        if (other.querySelector('article')) output.append(other);
        controls.replaceChildren();
        button('Refresh Check-ins', controls, load);
        if (page > 0) button('Previous Group', controls, () => { page--; load(); });
        if ((page + 1) * 20 < members.length) button('Next Group', controls, () => { page++; load(); });
    });
    button('Load Student Check-ins', controls, load);
}
const assignmentPreview = node('section', null, null, 'teacher-assignment-preview');
assignmentPreview.id = 'assignmentPreview'; assignmentPreview.setAttribute('aria-label', 'Selected mission preview');
$('assignmentMission').closest('label').after(assignmentPreview);
function missionGoal(mission) {
    const goals = Array.isArray(mission?.learningObjectives) ? mission.learningObjectives.filter(value => typeof value === 'string' && value.trim()) : [];
    return typeof mission?.learningObjective === 'string' && mission.learningObjective.trim() ? mission.learningObjective : goals.join(' ');
}
function renderAssignmentPreview() {
    assignmentPreview.replaceChildren();
    const form = $('assignmentForm'), mission = missions.find(item => item.id === $('assignmentMission').value);
    const published = form.elements.namedItem('status').value === 'published';
    const personal=assignmentPurpose.value==='targeted-review';
    syncAssignmentBoard();
    const briefing=$('assignmentLearningBrief');if(briefing){briefing.replaceChildren();briefing.hidden=!mission;if(mission){node('span','LEARNING PURPOSE',briefing,'eyebrow');node('strong',missionGoal(mission)||'Review the lesson objective before assigning.',briefing);node('p',personal?'For selected students: revisit the topic, save a new passing result, and explain the evidence.':'For the class: prepare for a shared discussion. Students complete earlier lessons first; publishing does not unlock this mission.',briefing,'teacher-note');}}
    form.elements.namedItem('instructions').required=personal;
    const guidanceLabel=form.elements.namedItem('instructions').closest('label');
    if(guidanceLabel.firstChild?.nodeType===3)guidanceLabel.firstChild.textContent=personal?'Review guidance (required)':'Class learning prompt (optional)';
    form.elements.namedItem('instructions').placeholder=personal?'Explain which idea to revisit and what the student should try next.':'Example: Explore early trade. Be ready to explain how communities exchanged goods.';
    const recipient=classes.find(c=>c.id===assignmentRecipient.value&&c.status==='active');
    form.querySelector('[type="submit"]').textContent = published ? (personal?'Assign personal review':'Publish class goal') : 'Save activity draft';
    if (!mission) { node('p', 'Select a mission to preview its chapter and learning goal.', assignmentPreview); return; }
    if(personal){const topic=mission.reviewTopics?.find(t=>t.key===reviewTopic.value);node('p',topic?'Review focus: '+topic.label:'Review focus: whole lesson. Only authored topic-to-scene mappings are offered.',assignmentPreview,'teacher-note');}
    node('span', 'MISSION PREVIEW', assignmentPreview, 'eyebrow');
    node('p',recipient?'For '+recipient.name:'Not addressed yet. Choose a receiving class before saving.',assignmentPreview,'teacher-note');
    node('h4', mission.title || mission.name || mission.id, assignmentPreview);
    node('p', mission.chapterTitle || 'Chapter title unavailable (' + mission.chapterId + ')', assignmentPreview, 'teacher-note');
    node('strong', 'Learning goal', assignmentPreview);
    node('p', missionGoal(mission) || 'A learning objective has not been supplied for this mission. Review the lesson before assigning it.', assignmentPreview);
    const instructions = form.elements.namedItem('instructions').value.trim();
    const due = form.elements.namedItem('dueDate').value;
    node('p', due ? 'Due: ' + due + ' at 11:59 PM (Philippine time).' : 'No due date. Students can work at their own pace.', assignmentPreview, 'teacher-note');
    if (instructions) { node('strong', 'Your guidance to students', assignmentPreview); node('p', instructions, assignmentPreview); }
    node('p',personal?'Personal review: only selected students receive it. A new passing quiz result saved after publication is required; earlier completion does not finish this review.':'Class goal: a shared topic for your next lesson or discussion. A fresh passing quiz opened from this class assignment is required. Solo completion stays separate.',assignmentPreview,'teacher-visibility');
    node('p', published ? (personal?'Published: selected students will see their review in My Class.':'Published: active class members will see this goal in My Class.') : 'Draft: only you can see this activity until you publish it.', assignmentPreview, 'teacher-note');
    const readinessNotice=node('section',null,assignmentPreview,'teacher-assignment-readiness');
    node('strong','Check the learning sequence before setting a deadline',readinessNotice);
    node('p','Students who have not reached this mission will see it as locked, with a route to their next earlier lesson. Publishing does not unlock it. Allow time for prerequisite lessons and chapter checks, or assign an earlier mission first.',readinessNotice,'teacher-note');
    node('p','Check readiness below before choosing the deadline. Results load only when requested, in groups of 20. Reviews use fresh quiz results; class goals require assignment-linked submissions. No duplicate completion rewards are granted.',readinessNotice,'teacher-note');
    const readinessResults=node('div',null,readinessNotice);let readinessPage=0;
    const checkReadiness=async()=>{
      const classId=assignmentRecipient.value,missionId=mission.id,generation=epoch;
      if(!classId){readinessResults.replaceChildren();node('p','Choose a receiving class first.',readinessResults);return;}
      readinessButton.disabled=true;readinessResults.replaceChildren();node('p','Checking saved learning progress...',readinessResults,'teacher-note');
      const current=()=>generation===epoch&&readinessResults.isConnected&&assignmentRecipient.value===classId&&$('assignmentMission').value===missionId;
      try{const record=detail?.classroom.id===classId?detail:await loadTeacherClass(classId);if(!current())return;const members=record.members.slice(readinessPage*20,(readinessPage+1)*20);const results=await loadTeacherReadiness(classId,missionId,members.map(m=>m.userId));if(!current())return;readinessResults.replaceChildren();node('p','Readiness for students '+(members.length?readinessPage*20+1:0)+'–'+Math.min((readinessPage+1)*20,record.members.length)+' of '+record.members.length+'. Refresh after students make progress.',readinessResults,'teacher-note');
      if(!members.length)node('p','No students have joined this class.',readinessResults);else table(readinessResults,'Readiness for this mission',['Student','Learning position','Latest saved score'],results.map(result=>[result.name||'Student account '+result.userId.slice(-8),({complete:'Already completed',ready:'Ready to start',locked:'Earlier learning needed',unavailable:'Content unavailable',unknown:'Could not verify'})[result.state],Number.isFinite(result.latestScore)?result.latestScore+'%':'No result']));
      const actions=node('div',null,readinessResults,'teacher-actions');if(readinessPage>0)button('Previous group',actions,()=>{readinessPage--;checkReadiness();});if((readinessPage+1)*20<record.members.length)button('Next group',actions,()=>{readinessPage++;checkReadiness();});
      }catch{if(current()){readinessResults.replaceChildren();node('p','Readiness could not be verified. Retry before choosing a deadline.',readinessResults);}}finally{if(readinessButton.isConnected)readinessButton.disabled=false;}
    };
    const readinessButton=button('Check student readiness',readinessNotice,checkReadiness);
}
$('assignmentForm').addEventListener('input', renderAssignmentPreview);
$('assignmentForm').addEventListener('change', renderAssignmentPreview);
const announcementPreview = node('section', null, null, 'teacher-assignment-preview');
announcementPreview.id = 'announcementPreview'; announcementPreview.setAttribute('aria-label', 'Announcement message preview');
const announcementPreviewToggle=node('details',null,null,'announcement-preview-toggle');node('summary','Preview student message',announcementPreviewToggle);announcementPreviewToggle.append(announcementPreview);$('announcementForm').querySelector('.teacher-actions').before(announcementPreviewToggle);
const announcementCount=node('small','0 / 3000 characters',null,'announcement-character-count');announcementCount.id='announcementCharacterCount';$('announcementForm').elements.namedItem('body').after(announcementCount);$('announcementForm').elements.namedItem('body').setAttribute('aria-describedby',announcementCount.id);
let announcementPage=0;
const announcementFilterLabel=node('label','Show messages',null,'announcement-list-filter');const announcementFilter=node('select',null,announcementFilterLabel);announcementFilter.id='announcementFilter';for(const [value,label]of [['all','All messages'],['published','Published'],['draft','Drafts']])node('option',label,announcementFilter).value=value;$('announcementList').before(announcementFilterLabel);announcementFilter.addEventListener('change',()=>{announcementPage=0;if(detail)renderPublications('announcement');});
const announcementTabs=node('div',null,null,'announcement-filter-tabs');announcementTabs.setAttribute('role','group');announcementTabs.setAttribute('aria-label','Filter saved announcements');const announcementTabButtons=new Map();for(const [value,label]of [['all','All posts'],['published','Published'],['draft','Drafts']]){const control=button(label,announcementTabs,()=>{announcementFilter.value=value;announcementFilter.dispatchEvent(new Event('change'));});control.dataset.filter=value;announcementTabButtons.set(value,control);}announcementFilterLabel.after(announcementTabs);
if(routeName==='announcements')for(const panel of document.querySelectorAll('#teacher-announcements .teacher-editor-card,#teacher-announcements .teacher-library-card')){const header=node('header',null,null,'announcement-panel-header');for(const child of [...panel.children])if(child.matches('.eyebrow,h3,p.teacher-note'))header.append(child);panel.prepend(header);}

if(routeName==='announcements'){
    const editor=$('announcementForm').closest('.teacher-editor-card');editor.querySelector('.announcement-panel-header>.teacher-note').textContent='Write an update. Save a draft or publish it to your class.';
    const visibility=$('announcementForm').elements.namedItem('status').closest('label'),options=node('div',null,null,'announcement-compose-options');visibility.before(options);options.append(visibility,announcementPreviewToggle);announcementPreviewToggle.querySelector('summary').textContent='Preview message';
}
let announcementDialog=null,announcementNewButton=null,announcementCloseButton=null,announcementReturnFocus=null;
function openAnnouncementComposer(){if(routeName!=='announcements'||busy||!workspaceReady)return;announcementReturnFocus=announcementNewButton;if(!announcementDialog.open)announcementDialog.showModal();$('announcementForm').closest('.teacher-editor-card').dispatchEvent(new Event('announcement-edit-start',{bubbles:true}));$('announcementForm').elements.namedItem('title').focus({preventScroll:true});}
function closeAnnouncementComposer(keepText=true){if(!announcementDialog?.open||busy)return;announcementDialog.close();const destination=announcementReturnFocus?.isConnected?announcementReturnFocus:announcementNewButton;destination?.focus({preventScroll:true});if(keepText&&($('announcementForm').elements.namedItem('title').value.trim()||$('announcementForm').elements.namedItem('body').value.trim()))message('Message closed. Your unsent text is kept on this page.');syncAnnouncementTabs();syncPublicationIndicators('announcement');}
if(routeName==='announcements'){
    document.body.classList.add('announcement-board-page');const hero=document.querySelector('.teacher-intro');hero.append(announcementContext);
    const editor=$('announcementForm').closest('.teacher-editor-card'),library=document.querySelector('#teacher-announcements .teacher-library-card');
    announcementDialog=node('dialog',null,$('teacher-announcements'),'announcement-compose-dialog');announcementDialog.id='announcementComposeDialog';editor.querySelector('h3').id='announcementComposeTitle';announcementDialog.setAttribute('aria-labelledby','announcementComposeTitle');announcementDialog.append(editor);
    announcementCloseButton=button('Close',editor,()=>closeAnnouncementComposer());announcementCloseButton.classList.add('announcement-compose-close');announcementCloseButton.setAttribute('aria-label','Close message and keep unsent text');editor.querySelector('.announcement-panel-header').append(announcementCloseButton);
    announcementNewButton=button('New announcement',library.querySelector('.announcement-panel-header'),openAnnouncementComposer,false);announcementNewButton.id='announcementNew';announcementNewButton.setAttribute('aria-haspopup','dialog');announcementNewButton.setAttribute('aria-controls',announcementDialog.id);
    announcementDialog.addEventListener('cancel',event=>{event.preventDefault();closeAnnouncementComposer();});
    announcementFilter.value='published';
}
function syncAnnouncementTabs(){
    if(announcementNewButton){const form=$('announcementForm');announcementNewButton.textContent=form.dataset.recordId?'Continue editing':form.elements.namedItem('title').value.trim()||form.elements.namedItem('body').value.trim()?'Resume message':'New announcement';announcementNewButton.disabled=busy||!workspaceReady||detail?.classroom.status==='archived';announcementCloseButton.disabled=busy;}
for(const [value,control]of announcementTabButtons){const rows=detail?.announcements||[];control.textContent=({all:'All posts',published:'Published',draft:'Drafts'})[value]+' ('+(value==='all'?rows.length:rows.filter(row=>row.status===value).length)+')';control.setAttribute('aria-pressed',String(announcementFilter.value===value));control.disabled=!detail||busy;}}
function renderAnnouncementPreview() {
    const form = $('announcementForm'), published = form.elements.namedItem('status').value === 'published';
    const editing = Boolean(form.dataset.recordId);
    const editor=form.closest('.teacher-editor-card');if(editor.dataset.editing!==String(editing)){editor.dataset.editing=String(editing);if(editing)editor.dispatchEvent(new Event('announcement-edit-start',{bubbles:true}));}
    syncAnnouncementTabs();
    announcementCount.textContent=form.elements.namedItem('body').value.length+' / 3000 characters';
    form.closest('.teacher-editor-card').querySelector('h3').textContent=editing?'Edit announcement':'New announcement';
    form.querySelector('[type="submit"]').textContent = published ? editing ? 'Update Published Announcement' : 'Publish Announcement to Class' : 'Save Announcement Draft';
    announcementPreview.replaceChildren();
    node('span', 'STUDENT MESSAGE PREVIEW', announcementPreview, 'eyebrow');
    const recipient=classes.find(c=>c.id===announcementRecipient.value&&c.status==='active');
    node('p',recipient?'For '+recipient.name:'Message not addressed yet. Choose a receiving class before saving or publishing.',announcementPreview,'teacher-note');
    node('h4', form.elements.namedItem('title').value.trim() || 'Your announcement title', announcementPreview);
    node('p', form.elements.namedItem('body').value.trim() || 'Write a message to preview it here. Line breaks are preserved.', announcementPreview);
    node('p', published ? editing ? 'Saving updates the message visible to active members in My Class.' : 'Publishing makes this message visible to active members in My Class.' : 'Draft: hidden from students until you publish it.', announcementPreview, 'teacher-visibility');
    if (editing) node('p', 'Editing this saved announcement. Cancel Edit leaves the saved message unchanged.', announcementPreview, 'teacher-note');
}
$('announcementForm').elements.namedItem('title').placeholder='Give your message a clear title';$('announcementForm').elements.namedItem('body').placeholder='Share a reminder, learning prompt, or an update for your class.';
$('announcementForm').addEventListener('input', renderAnnouncementPreview);
$('announcementForm').addEventListener('change', renderAnnouncementPreview);
let directoryPage=0;
function setupClassDirectory(){
    if($('classroomDirectoryFilters'))return;
    const hero=document.querySelector('.teacher-intro');hero.classList.add('classroom-directory-hero');hero.querySelector('h1').textContent='My Classes';hero.querySelector('p').textContent='Find a classroom, open its workspace, and keep your teaching organized.';
    const heroActions=node('div',null,hero,'directory-hero-actions');
    const create=button('Create classroom',heroActions,()=>{classCreation.open=true;classCreation.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('newClassName').focus({preventScroll:true});},false);create.id='directoryCreateClassroom';classCreation.id='classroomCreatePanel';create.setAttribute('aria-controls','classroomCreatePanel');create.setAttribute('aria-expanded',String(classCreation.open));classCreation.addEventListener('toggle',()=>create.setAttribute('aria-expanded',String(classCreation.open)));
    node('span','Set up a space for your learners.',heroActions,'directory-action-help');
    const filters=node('div',null,null,'classroom-directory-filters');filters.id='classroomDirectoryFilters';
    const searchLabel=node('label','Find a classroom',filters),search=node('input',null,searchLabel);search.type='search';search.id='classroomDirectorySearch';search.placeholder='Search by class name';
    const statusLabel=node('label','Show',filters),state=node('select',null,statusLabel);state.id='classroomDirectoryState';for(const [value,label] of [['active','Active classrooms'],['archived','Archived classrooms'],['all','All classrooms']])node('option',label,state).value=value;
    const resultCount=node('span','',filters,'directory-result-count');resultCount.id='directoryResultCount';
    $('teacherClasses').before(classCreation,filters);const empty=node('section',null,null,'classroom-directory-empty');empty.id='classroomDirectoryEmpty';empty.hidden=true;filters.after(empty);
    const pager=node('nav',null,null,'classroom-directory-pagination');pager.id='classroomDirectoryPagination';pager.setAttribute('aria-label','Classroom pages');$('teacherClasses').after(pager);
    for(const control of [search,state])control.addEventListener('input',()=>{directoryPage=0;renderClassDirectory();});
    classPicker.querySelector('summary').addEventListener('click',event=>event.preventDefault());
}
function renderClassDirectory(){
    if(routeName!=='classes'||classroomDetailPage||!$('classroomDirectoryFilters'))return;
    const query=$('classroomDirectorySearch').value.trim().toLocaleLowerCase(),state=$('classroomDirectoryState').value,cards=[...$('teacherClasses').querySelectorAll('.teacher-class-card')];
    const matches=cards.filter(card=>(state==='all'||(card.dataset.archived==='true'?'archived':'active')===state)&&card.querySelector('.classroom-card-name').textContent.toLocaleLowerCase().includes(query));
    directoryPage=Math.min(directoryPage,Math.max(0,Math.ceil(matches.length/12)-1));
    $('directoryResultCount').textContent=matches.length+' matching classroom'+(matches.length===1?'':'s');
    for(const card of cards)card.hidden=true;for(const card of matches.slice(directoryPage*12,directoryPage*12+12))card.hidden=false;
    for(const group of $('teacherClasses').querySelectorAll('.teacher-class-group')){group.hidden=![...group.querySelectorAll('.teacher-class-card')].some(card=>!card.hidden);if(group.tagName==='DETAILS')group.open=true;}
    const empty=$('classroomDirectoryEmpty');empty.hidden=matches.length>0;empty.replaceChildren();
    if(!matches.length){node('span',classes.length?'FIND YOUR CLASSROOM':'A NEW CHAPTER',empty,'eyebrow');node('h3',classes.length?'No classrooms match your search.':'Your first classroom starts here.',empty);node('p',classes.length?'Try another name or switch the classroom filter.':'Create a classroom, share its invitation, and start learning together.',empty);button(classes.length?'Clear filters':'Create your first classroom',empty,()=>{if(!classes.length){$('directoryCreateClassroom').click();return;}$('classroomDirectorySearch').value='';$('classroomDirectoryState').value='active';directoryPage=0;renderClassDirectory();});}
    const pager=$('classroomDirectoryPagination');pager.replaceChildren();const results=node('p',matches.length?('Showing '+(directoryPage*12+1)+' - '+Math.min((directoryPage+1)*12,matches.length)+' of '+matches.length+' classrooms'):'No matching classrooms',pager,'teacher-note');results.setAttribute('role','status');results.setAttribute('aria-live','polite');
    if(directoryPage>0)button('Previous',pager,()=>{directoryPage--;renderClassDirectory();});if((directoryPage+1)*12<matches.length)button('Next',pager,()=>{directoryPage++;renderClassDirectory();});
}
async function refresh(classId = selected || (routeName === 'classes'&&!classroomDetailPage ? null : routeParameters.get('class'))) {
    if(routeName==='classes'){const workspace=classManagement.querySelector('.classroom-workspace'),invitation=$('activeClassTools');classManagement.append(workspace,invitation);}
    classListLoaded = false;
    $('teacherContentLoading').hidden = false;
    detail = null;
    $('teacherClassDetail').hidden = true; clearStudentReport();
    const generation = epoch, next = await loadTeacherClasses();
    if (generation !== epoch) return;
    classes = next.sort((a, b) => a.name.localeCompare(b.name));
    classListLoaded = true;
    classPicker.open = !classes.length;
    const list = $('teacherClasses'); list.replaceChildren();
    if(routeName==='classes'&&!classroomDetailPage)setupClassDirectory();
    if (!classes.length&&!(routeName==='classes'&&!classroomDetailPage)) node('p', 'No classes yet. Create your first class below.', list);
    for (const archived of [false, true]) {
        const group = classes.filter(c => (c.status === 'archived') === archived);
        if (!group.length) continue;
        const section = node(archived ? 'details' : 'section', null, list, 'teacher-class-group');
        node(archived ? 'summary' : 'h3', `${archived ? 'Archived' : 'Active'} classes (${group.length})`, section);
        if (archived) section.open = group.some(c => c.id === classId);
        const cards = node('div', null, section, 'teacher-class-cards');
        for (const classroom of group) {
            const card = node('article', null, cards, 'teacher-class-card');
            card.dataset.classId=classroom.id;card.dataset.selected=String(classroom.id===classId);card.dataset.archived=String(archived);
            node('span',classroom.name.replace(/^grade\s*/i,'').split(/[\s-]+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toLocaleUpperCase(),card,'teacher-class-initial').setAttribute('aria-hidden','true');
            node('span', archived ? 'Archived' : 'Active', card, 'teacher-class-badge');
            let el;
            if(routeName==='classes'){
                el=node('a',classroom.name,card,'classroom-card-toggle secondary');el.href=classroomURL(classroom.id);el.setAttribute('aria-label','Open classroom '+classroom.name);el.dataset.classId=classroom.id;node('h3',classroom.name,card,'classroom-card-name');node('p',classroom.description||'Students, learning activities, and classroom updates in one place.',card,'directory-card-description');node('span','Open classroom',card,'teacher-class-card-hint');
            }else{
                el=button(classroom.name,card,async ()=>{if(!(await allowDiscard()))return;task(async ()=>(await openClass(classroom.id)));});el.dataset.classId=classroom.id;el.setAttribute('aria-label','Open class '+classroom.name);el.setAttribute('aria-pressed',String(classroom.id===classId));
            }
            if(classroom.description&&routeName!=='classes')node('p',classroom.description,card,'teacher-note');
            else if(routeName!=='classes')node('p','View students and manage learning activities.',card,'teacher-note');
        }
    }
    renderClassDirectory();
    if (classId && classes.some(c => c.id === classId)) await openClass(classId);
    else { selected = null; detail = null; classOverview.replaceChildren();applyArchiveState(); $('teacherClassPickerLabel').textContent = 'Choose or create a class'; (await tab(activeTab)); classPicker.open = activeTab === 'classes'; }
}
async function openClass(classId) {
    for(const kind of ['announcement','assignment']){const notice=$(kind+'SaveNotice');if(notice)notice.hidden=true;}
    assignmentPage=0;
    assignmentFilter.value = 'all';
    $('teacherContentLoading').hidden = false;
    detail = null;
    applyArchiveState();
    for (const kind of ['announcement', 'assignment']) {
        $(kind + 'Form').reset(); delete $(kind + 'Form').dataset.recordId;delete $(kind + 'Form').dataset.operationError;
        $(kind + 'Cancel').hidden = true;
    }
    clearStudentReport();
    $('teacherClassDetail').hidden = true;
    const generation=epoch,next=await loadTeacherClass(classId);
    if (generation !== epoch) return;
    const changedClass = selected !== classId;
    detail = next; selected = classId;
    if(routeName==='classes'){classManagement.append(classManagement.querySelector('.classroom-workspace'),$('activeClassTools'));classSettings.open=classSafety.open=false;}
    const currentURL = new URL(location.href);
    currentURL.searchParams.set('class', classId);
    if (changedClass && routeParameters.get('class') !== classId) {
        currentURL.searchParams.delete('student'); currentURL.searchParams.delete('assignment');
        currentURL.searchParams.delete('search');currentURL.searchParams.delete('rosterPage');for(const key of ['followup','request','fromRequest','fromKind'])currentURL.searchParams.delete(key);$('teacherFollowupContext')?.remove();
    }
    history.replaceState(null, '', currentURL.href);
    const c = detail.classroom;
    classOverview.replaceChildren();
    const identity=node('header',null,classOverview,'active-room-identity');node('span',c.name.trim().slice(0,1).toLocaleUpperCase(),identity,'active-room-emblem').setAttribute('aria-hidden','true');const identityCopy=node('div',null,identity);node('span',c.status==='active'?'ACTIVE CLASSROOM':'ARCHIVED CLASSROOM',identityCopy,'eyebrow');node('h2',classroomDetailPage?'Classroom overview':c.name,identityCopy);
    node('p',c.description||'A shared space for history lessons, classroom updates, and student support.',classOverview,'teacher-note');
    const classStats=node('div',null,classOverview,'teacher-class-stats');
    for(const [value,label] of [[detail.members.length,'Joined students'],[detail.assignments.filter(a=>a.status==='published').length,'Learning activities'],[detail.announcements.filter(a=>a.status==='published').length,'Announcements']]){const stat=node('div',null,classStats);node('strong',String(value),stat);node('span',label,stat);}
    node('span','TEACHING TOOLS',classOverview,'active-room-tools-label');const classActions=node('div',null,classOverview,'teacher-actions active-room-actions');
    for(const [label,description,destination,icon] of [['View students','Review progress and respond to questions.','students','students'],['Plan learning activity','Set a class goal or a personal review.','assignments','assignments'],['Post announcement','Share a reminder or learning prompt.','announcements','announcements']]){const control=button('',classActions,async ()=>(await tab(destination)));const emblem=node('span',null,control,'active-room-action-icon');emblem.setAttribute('aria-hidden','true');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');const shape=document.createElementNS('http://www.w3.org/2000/svg','path');shape.setAttribute('d',navigationIcons[icon]);svg.append(shape);emblem.append(svg);const copy=node('span',null,control,'active-room-action-copy');node('strong',label,copy);node('span',description,copy);node('span','→',control,'active-room-action-arrow').setAttribute('aria-hidden','true');}
    document.querySelector('.teacher-invitation').open=routeName==='classes'&&c.status==='active';
    for(const card of document.querySelectorAll('.teacher-class-card[data-class-id]')){card.dataset.selected='false';}
    $('teacherClassPickerLabel').textContent = `${c.name} · ${c.status === 'archived' ? 'Archived' : 'Active'} · Change class`;
    classPicker.open = routeName === 'classes';
    $('selectedClassTitle').textContent = c.name;
    $('classState').textContent = c.status === 'archived' ? 'Archived class' : 'Active class';
    $('editClassName').value = c.name; $('editClassDescription').value = c.description || '';
    const inviteActive = detail.invitation?.status === 'active' && detail.invitation.expiresAt?.toMillis() > Date.now() && c.status === 'active';
    const invitePanel=document.querySelector('.teacher-invitation');invitePanel.dataset.codeState=inviteActive?'ready':'empty';
    const inviteClassName=invitePanel.querySelector('.invite-class-name');if(inviteClassName)inviteClassName.textContent=c.name;const inviteTitle=invitePanel.querySelector('.invite-title-copy>strong');if(inviteTitle)inviteTitle.textContent='Invite students to '+c.name;const inviteIntro=invitePanel.querySelector('.invite-introduction');if(inviteIntro)inviteIntro.textContent='This code joins '+c.name+' only. Share it with students in this classroom; codes for your other classrooms are separate.';
    $('rotateTeacherCode').textContent=inviteActive?'Replace invitation code':'Generate class code';
    let inviteState=invitePanel.querySelector('.active-room-code-state');if(!inviteState){inviteState=node('p',null,invitePanel,'active-room-code-state');$('teacherJoinCode').before(inviteState);}inviteState.textContent=inviteActive?'Invitation ready to share':'Create an invitation when students are ready to join';
    $('teacherJoinCode').textContent = inviteActive ? c.currentJoinCode : 'No active code';
    $('teacherCodeExpiry').textContent = inviteActive ? `Expires ${date(detail.invitation.expiresAt)} (Philippine time)` : 'Generate a code when you are ready to invite students.';
    $('rosterCount').textContent = `${detail.members.length} joined ${detail.members.length === 1 ? 'student' : 'students'}`;
    if(routeName==='classes'){
        // Classroom management does not need student profiles, reports, or
        // publication editors from the other teacher pages.
        (await tab('classes'));applyArchiveState();
        rememberEdits(['editClassForm','announcementForm','assignmentForm']);
        return;
    }
    if(routeName==='announcements'){
        renderPublications('announcement');renderAnnouncementRecipients();renderAnnouncementPreview();(await tab('announcements'));applyArchiveState();rememberEdits(['editClassForm','announcementForm','assignmentForm']);return;
    }
    const rosterURL=new URL(location.href);
    rosterQuery=routeName==='students'?(rosterURL.searchParams.get('search')||'').slice(0,200).trim().toLocaleLowerCase():'';
    const requestedPage=Number(rosterURL.searchParams.get('rosterPage'));
    rosterPage=routeName==='students'&&Number.isSafeInteger(requestedPage)&&requestedPage>=0?Math.min(requestedPage,Math.max(0,Math.ceil(detail.members.length/20)-1)):0;
    $('rosterSearchForm').reset();$('rosterSearch').value=rosterQuery;$('rosterSearchStatus').textContent='';names.clear();await loadRosterNames();
    if(rosterQuery&&detail.classroom.status==='active')for(let offset=0;offset<detail.members.length;offset+=20){
        const ids=detail.members.slice(offset,offset+20).map(m=>m.userId).filter(id=>!names.has(id));
        if(ids.length){const results=await loadTeacherRosterNames(classId,ids);if(generation!==epoch)return;for(const item of results)if(item.name)names.set(item.userId,item.name);}
    }
    rosterPage=Math.min(rosterPage,Math.max(0,Math.ceil(visibleMembers().length/20)-1));
    if (generation !== epoch) return;
    renderRoster(); renderPublications('announcement'); renderPublications('assignment'); renderOverview();renderAssignmentRecipients(); renderAssignmentPreview(); renderAnnouncementRecipients();renderAnnouncementPreview();
    document.querySelectorAll('#teacherClasses button').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.classId === classId)));
    (await tab(activeTab)); applyArchiveState();
    rememberEdits(['editClassForm', 'announcementForm', 'assignmentForm']);
}
async function loadRosterNames() {
    if (detail.classroom.status !== 'active') return;
    const generation = epoch;
    const ids=detail.members.slice(rosterPage*20,(rosterPage+1)*20).map(member=>member.userId).filter(id=>!names.has(id));
    if(!ids.length)return;
    const results = await loadTeacherRosterNames(selected,ids);
    if (generation !== epoch) return;
    for (const item of results) {
        if (item.name) names.set(item.userId,item.name);
        else names.delete(item.userId);
    }
}
function visibleMembers() {
    return detail.members.filter(member => !rosterQuery || (names.get(member.userId) || '').toLocaleLowerCase().includes(rosterQuery));
}
function renderRoster() {
    if(routeName==='students'&&selected){const url=new URL(location.href);if(rosterQuery)url.searchParams.set('search',rosterQuery);else url.searchParams.delete('search');if(rosterPage)url.searchParams.set('rosterPage',String(rosterPage));else url.searchParams.delete('rosterPage');history.replaceState(null,'',url.href);}
    const root = $('teacherRoster'); root.replaceChildren();classReportResults.replaceChildren();classReportStatus.textContent='';classReportPanel.hidden=detail.classroom.status!=='active'||!detail.members.length;
    if(routeName==='students')studentListTotal.textContent=detail.members.length+' student'+(detail.members.length===1?'':'s');
    $('rosterSearchForm').hidden = detail.classroom.status !== 'active' || !detail.members.length;
    if (detail.classroom.status !== 'active') { $('rosterSearchStatus').textContent = ''; node('p', 'Restore this class to open student reports.', root);const settings=node('a','Open classroom settings',root,'progress-open-class');settings.href=classroomURL(selected);return; }
    let followupArea=null;
    if(routeName==='students'&&detail.members.length){
        followupArea=document.createElement('section');followupArea.className='teacher-student-followups';node('span','SUPPORT AND FOLLOW UP',followupArea,'eyebrow');node('h3','Help each student take the next step',followupArea);node('p','Open the area you need. Questions, explanations, and review evidence stay separate from grades.',followupArea,'teacher-note');
        const helpEpoch=epoch,helpClass=selected;
        renderTeacherHelp(followupArea,{...detail.classroom,assignmentTitles:Object.fromEntries(detail.assignments.map(item=>[item.id,item.title]))},detail.members,id=>names.get(id)||'Student account '+id.slice(-8),()=>epoch===helpEpoch&&selected===helpClass);
        renderTeacherReflectionQueue(followupArea,{...detail.classroom,assignmentTitles:Object.fromEntries(detail.assignments.map(item=>[item.id,item.title]))},detail.members,id=>names.get(id)||'Student account '+id.slice(-8),()=>epoch===helpEpoch&&selected===helpClass);
        renderReviewOutcomes(followupArea);
    }
    if (!detail.members.length) {
        node('h4', 'Your class is ready for its first student', root);
        node('p', 'Share the invitation code. Students join from My Class, and their learning progress stays with their account.', root);
        const invite=node('a','Invite students to this classroom',root,'progress-open-class');invite.href=classroomURL(selected);
    }
    const members = visibleMembers();
    if (rosterQuery) {
        const unavailable = detail.members.filter(member => !names.has(member.userId)).length;
        $('rosterSearchStatus').textContent = `${members.length} matching ${members.length === 1 ? 'student' : 'students'}.` + (unavailable ? ` ${unavailable} names could not be loaded. Refresh and search again to retry.` : '');
        if (!members.length) node('p', 'No loaded student names match. Try part of a name or choose Show All Students.', root);
    }
    if (members.length > 20) {
        const navigation=node('nav',null,root,'progress-roster-pagination');navigation.setAttribute('aria-label','Student list pages');
        node('p', `Students ${rosterPage * 20 + 1}–${Math.min((rosterPage + 1) * 20, members.length)} of ${members.length}`, navigation);
        const actions = node('div', null, navigation, 'teacher-actions');
        const change = delta => task(async () => { rosterPage += delta; if (!rosterQuery) await loadRosterNames(); renderRoster();const pageNotice=$('teacherRoster').querySelector('.progress-roster-pagination p');if(pageNotice){pageNotice.tabIndex=-1;pageNotice.focus({preventScroll:true});} });
        if (rosterPage > 0) button('Previous Students', actions, () => change(-1));
        if ((rosterPage + 1) * 20 < members.length) button('Next Students', actions, () => change(1));
    }
    if (!members.length) {if(followupArea)root.append(followupArea);return;}
    const wrap = node('div', null, root, 'teacher-table-wrap teacher-roster-table');
    const roster = node('table', null, wrap);
    node('caption', 'Joined students and learning reports', roster);
    const headings = node('tr', null, node('thead', null, roster));
    for (const heading of ['Student', 'Learning report']) node('th', heading, headings).scope = 'col';
    const rows = node('tbody', null, roster);
    members.slice(rosterPage * 20, (rosterPage + 1) * 20).forEach(member => {
        const row = node('tr', null, rows);
        row.dataset.userId=member.userId;row.dataset.reportOpen=String($('studentReport').dataset.userId===member.userId&&!!$('studentReport').children.length);
        const identity = node('td', null, row);
        const identityWrap=node('div',null,identity,'teacher-roster-identity');node('span',(names.get(member.userId)||'S').slice(0,1).toLocaleUpperCase(),identityWrap,'teacher-roster-avatar').setAttribute('aria-hidden','true');const identityCopy=node('div',null,identityWrap);identityWrap.querySelector('.teacher-roster-avatar').dataset.tone=String([...member.userId].reduce((n,c)=>n+c.charCodeAt(0),0)%3);
        node('strong', names.get(member.userId) || `Name unavailable · Account ${member.userId.slice(-8)}`, identityCopy);
        if(!names.has(member.userId))node('p','Name unavailable. Refresh to try again.',identityCopy,'teacher-note');
        const actionCell=node('td',null,row);const rowActions=node('div',null,actionCell,'roster-row-actions');const reportButton = button('View report', rowActions, () => task(async () => {
            if (!(await allowDiscard())) return;
            const generation = epoch; clearStudentReport();
            const report = await loadTeacherStudent(selected, member.userId);
            if (generation !== epoch) return;
            const name = [report.profile?.firstName, report.profile?.lastName].filter(Boolean).join(' ') || 'Student';
            names.set(member.userId, name); renderRoster(); (await renderReport(name, report));
            $('studentReport').scrollIntoView({block: 'start', behavior: 'smooth'});
        }));
        reportButton.setAttribute('aria-label', 'View learning report for ' + (names.get(member.userId) || 'account ' + member.userId.slice(-8)));
        reportButton.dataset.reportOpen=member.userId;reportButton.setAttribute('aria-controls','studentReport');reportButton.setAttribute('aria-expanded',row.dataset.reportOpen);
        const management=node('details',null,rowActions,'teacher-member-management');
        const more=node('summary','More',management);more.setAttribute('aria-label','Membership actions for '+(names.get(member.userId)||'this student'));management.addEventListener('toggle',()=>{if(management.open)for(const other of root.querySelectorAll('.teacher-member-management[open]'))if(other!==management)other.open=false;});
        const remove=button('Remove from Class',management,async ()=>{
            if(busy||!(await allowDiscard()))return;
            const classId=selected,studentName=names.get(member.userId)||'this student';
            if(!(await appConfirm(`Remove ${studentName} from ${detail.classroom.name}? They will lose access to this class’s announcements, assignments and feedback. Their personal learning progress and rewards stay saved. They can join again with an active invitation code; rotate or revoke the code in My Classes if needed.`)))return;
            rememberEdits();
            task(async()=>{
                await removeTeacherClassMember(classId,member.userId);
                clearStudentReport();
                await refresh(classId);
            },'Student removed from this class. Personal learning progress and rewards were preserved.');
        });
        remove.classList.add('teacher-remove-member');remove.setAttribute('aria-label','Remove '+(names.get(member.userId)||'account '+member.userId.slice(-8))+' from this class');
    });
    if(followupArea)root.append(followupArea);
}
$('rosterSearchForm').addEventListener('submit', async event => {
    event.preventDefault();
    if(!(await allowDiscard()))return;
    task(async () => {
        if (!detail || detail.classroom.status !== 'active') return;
        const generation = epoch, classId = selected;
        const query = $('rosterSearch').value.trim().toLocaleLowerCase();
        if (query) for (let offset = 0; offset < detail.members.length; offset += 20) {
            const ids = detail.members.slice(offset, offset + 20).map(member => member.userId).filter(id => !names.has(id));
            if (!ids.length) continue;
            message(`Loading student names: ${Math.min(offset + 20, detail.members.length)} of ${detail.members.length}...`);
            const results = await loadTeacherRosterNames(classId, ids);
            if (generation !== epoch || selected !== classId) return;
            for (const item of results) if (item.name) names.set(item.userId, item.name);
        }
        rosterQuery = query; rosterPage = 0; clearStudentReport();
        if (!query) { $('rosterSearchStatus').textContent = ''; await loadRosterNames(); }
        if (generation === epoch) renderRoster();
    });
});
$('clearRosterSearch').addEventListener('click', async () => {
    if(!(await allowDiscard()))return;
    $('rosterSearch').value = '';rememberEdits();$('rosterSearchForm').requestSubmit();
});
function table(parent, caption, headings, rows) {
    const wrap = node('div', null, parent, 'teacher-table-wrap'), table = node('table', null, wrap);
    node('caption', caption, table);
    const head = node('tr', null, node('thead', null, table));
    headings.forEach(label => node('th', label, head).scope = 'col');
    const body = node('tbody', null, table);
    rows.forEach(values => { const row = node('tr', null, body); values.forEach(value => node('td', String(value), row)); });
}
async function focusTeacherGuidance(root,missionId){
    const form=root.querySelector('#teacherFeedbackForm'),panel=form?.closest('.teacher-report-tool');
    if(!form||!panel)return;
    const select=form.elements.namedItem('missionId'),body=form.elements.namedItem('body');
    if(select?.value&&select.value!==missionId&&body?.value.trim()&&!(await appConfirm('Use your unsent guidance for this different mission? Cancel to finish the original message. Your text will be kept.')))return;
    panel.open=true;if(select){select.value=missionId;select.dispatchEvent(new Event('change',{bubbles:true}));}
    panel.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});body?.focus({preventScroll:true});
}
async function prepareEvidenceReview(classId,userId,missionId,topic=''){
    if(routeName!=='assignments'||selected!==classId||detail?.classroom.status!=='active'||!detail.members.some(member=>member.userId===userId))throw Error('This student is no longer available in the selected class. Refresh the class before planning a review.');
    const mission=missions.find(item=>item.id===missionId);if(!mission)throw Error('This mission is no longer available. Choose an available lesson.');
    if(topic&&!mission.reviewTopics?.some(item=>item.key===topic))throw Error('This review topic is no longer mapped to the lesson. Choose a topic from the current planner.');
    if(!(await allowDiscard()))return;
    const generation=epoch,form=$('assignmentForm');form.reset();delete form.dataset.recordId;delete form.dataset.expectedPublicationVersion;
    assignmentRecipient.value=classId;$('assignmentMission').value=missionId;assignmentPurpose.value='targeted-review';reviewTargets.clear();reviewTargets.add(userId);reviewPage=Math.floor(detail.members.findIndex(member=>member.userId===userId)/20);syncReviewTargets();renderReviewFocus();reviewTopic.value=topic;form.elements.namedItem('status').value='draft';
    await renderReviewTargets();if(generation!==epoch||selected!==classId)return;
    renderAssignmentPreview();form.dispatchEvent(new Event('input',{bubbles:true}));openAssignmentComposer();
    message('Review prepared for one student in '+detail.classroom.name+'. Nothing has been sent. Add your guidance, check the focus, then save a draft or publish.');
}
function renderStudentLearningJourney(root,name,report,snapshot,support) {
    const catalog=[...missions].sort((a,b)=>(a.chapterOrder??999)-(b.chapterOrder??999)||(a.order??999)-(b.order??999));
    const signals=quizReviewSignals(report.attempts.filter(a=>catalog.some(m=>m.id===a.missionId&&m.chapterId===a.chapterId)));
    for(const attempt of signals.attempts)if(attempt.completedAt?.toMillis?.()>Date.now())signals.ambiguous.add(attempt.missionId);
    const reviewIds=new Set(signals.review.filter(a=>!signals.ambiguous.has(a.missionId)).map(a=>a.missionId));
    const completedIds=new Set(catalog.filter(m=>report.progress.some(p=>p.missionId===m.id&&p.chapterId===m.chapterId&&p.completed===true)).map(m=>m.id));
    const hero=node('header',null,null,'learning-profile');
    const avatar=node('span',name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join(''),hero,'learning-profile-avatar');avatar.setAttribute('aria-hidden','true');
    const identity=node('div',null,hero,'learning-profile-identity');
    for(const element of [...root.children])if(element.matches('.eyebrow,h3,.progress-report-class'))identity.append(element);
    const validDates=[...report.progress.map(p=>p.completedAt),...report.attempts.map(a=>a.completedAt)].filter(t=>Number.isFinite(t?.toMillis?.())&&t.toMillis()>0&&t.toMillis()<=Date.now()).sort((a,b)=>b.toMillis()-a.toMillis());
    node('p',validDates.length?'Latest saved learning: '+date(validDates[0]):'No dated learning activity saved yet',identity,'learning-profile-date');
    const coverage=node('div',null,hero,'learning-coverage');
    const percent=catalog.length?Math.round(completedIds.size/catalog.length*100):0;
    const ring=node('div',null,coverage,'learning-coverage-ring');ring.style.setProperty('--coverage',percent+'%');ring.setAttribute('role','img');ring.setAttribute('aria-label',completedIds.size+' of '+catalog.length+' current catalog missions completed');node('strong',catalog.length?percent+'%':'—',ring);
    const coverageCopy=node('div',null,coverage);node('strong',completedIds.size+' / '+catalog.length+' missions',coverageCopy);node('span','Current catalog completed',coverageCopy);node('small','Completion, not a mastery score',coverageCopy);
    snapshot.before(hero);
    const evidenceGuide=node('details',null,null,'learning-evidence-guide');
    node('summary','What does this learning evidence tell us?',evidenceGuide);
    node('p','Use these signals together to plan support. This report does not calculate a mastery or learning-gain score.',evidenceGuide,'teacher-note');
    const definitions=node('dl',null,evidenceGuide);
    for(const entry of learningEvidenceGuide){node('dt',entry.label,definitions);node('dd',entry.meaning+' Next step: '+entry.next,definitions);}
    hero.after(evidenceGuide);
    const journey=node('section',null,null,'learning-journey');
    const heading=node('header',null,journey,'learning-journey-heading');node('span','THEIR HISTORY JOURNEY',heading,'eyebrow');node('h4','See the learning behind the numbers',heading);node('p','Explore each mission, compare saved attempts, and choose what to discuss next.',heading);
    const filters=node('div',null,journey,'learning-journey-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label','Filter mission learning evidence');
    const summary=node('p','',journey,'learning-journey-summary');summary.setAttribute('role','status');
    const grid=node('div',null,journey,'learning-mission-grid'),paging=node('nav',null,journey,'learning-journey-paging');paging.setAttribute('aria-label','Mission evidence pages');
    const evidenceIds=new Set([...report.progress.map(p=>p.missionId),...report.attempts.map(a=>a.missionId)]);
    let filter=evidenceIds.size?'evidence':'all',page=0;
    const controls=new Map();
    const guide=async id=>(await focusTeacherGuidance(root,id));
    const render=()=>{
        grid.replaceChildren();paging.replaceChildren();for(const [key,control]of controls)control.setAttribute('aria-pressed',String(key===filter));
        const visible=catalog.filter(m=>filter==='all'||filter==='completed'&&completedIds.has(m.id)||filter==='review'&&reviewIds.has(m.id)||filter==='evidence'&&evidenceIds.has(m.id));
        summary.textContent=visible.length+' matching mission'+(visible.length===1?'':'s')+'. Saved evidence is a starting point for discussion.';
        if(!visible.length)node('p',catalog.length?'No missions match this view. Choose All missions to explore the learning path.':'The mission catalog is unavailable. Saved learning history remains below.',grid,'learning-journey-empty');
        for(const mission of visible.slice(page*6,page*6+6)){
            const history=signals.attempts.filter(a=>a.missionId===mission.id&&a.chapterId===mission.chapterId),uncertain=signals.ambiguous.has(mission.id),latest=uncertain?null:history[0];
            const done=completedIds.has(mission.id),review=reviewIds.has(mission.id),state=review?'review':done?'completed':evidenceIds.has(mission.id)?'started':'unrecorded';
            const card=node('article',null,grid,'learning-mission-card');card.dataset.learningState=state;card.dataset.missionId=mission.id;
            const top=node('div',null,card,'learning-mission-top');node('span',done&&review?'Completed / discuss together':({review:'Discuss together',completed:'Completed',started:'Learning started',unrecorded:'No saved evidence'})[state],top,'learning-state');node('span',done?'✓':review?'?':'↗',top,'learning-mission-symbol').setAttribute('aria-hidden','true');
            node('span',mission.chapterTitle||'History mission',card,'learning-mission-chapter');node('h5',mission.title||mission.name||mission.id,card);
            if(missionGoal(mission))node('p',missionGoal(mission),card,'learning-mission-goal');
            const evidence=node('div',null,card,'learning-mission-evidence');node('strong',uncertain?'Check dates':Number.isFinite(latest?.score)?latest.score+'%':'—',evidence);node('span',uncertain?'Latest attempt cannot be determined':latest?'Latest saved quiz score':history.length?'No dated quiz score':'No quiz attempt recorded',evidence);
            if(latest)node('small',date(latest.completedAt),card,'learning-mission-date');
            if(review){const topics=latest?.topicsForReview?.map(t=>String(t).replace(/[-_]+/g,' '));node('p',topics?.length?'Talk about: '+topics.join(', '):'Ask the student to explain a clue, then revisit the lesson together.',card,'learning-mission-prompt');}
            if(history.length){const attempts=node('details',null,card,'learning-attempts');node('summary','See saved attempts ('+history.length+')',attempts);node('p','Up to four dated attempts, oldest to newest. Questions may differ; scores alone do not establish mastery.',attempts);for(const attempt of [...history].filter(a=>Number.isFinite(a.completedAt?.toMillis?.())&&a.completedAt.toMillis()>0&&a.completedAt.toMillis()<=Date.now()).slice(0,4).reverse()){const row=node('div',null,attempts,'learning-score-row');node('span',date(attempt.completedAt),row);const track=node('span',null,row,'learning-score-track');const fill=node('span',null,track);fill.style.width=Number.isFinite(attempt.score)?Math.max(0,Math.min(100,attempt.score))+'%':'0%';track.setAttribute('aria-hidden','true');node('strong',Number.isFinite(attempt.score)?attempt.score+'%':'Unavailable',row);}}
            if(root.querySelector('#teacherFeedbackForm'))button('Plan guidance →',card,async ()=>(await guide(mission.id))).classList.add('learning-guide-action');
        }
        if(visible.length>6){node('span','Page '+(page+1)+' of '+Math.ceil(visible.length/6),paging);if(page)button('Previous missions',paging,()=>{page--;render();});if((page+1)*6<visible.length)button('Next missions',paging,()=>{page++;render();});}
    };
    for(const [key,label]of [['evidence','With evidence'],['completed','Completed'],['review','Review signals'],['all','All missions']]){const control=button(label,filters,()=>{filter=key;page=0;render();});controls.set(key,control);}
    snapshot.after(journey);const checkin=node('details',null,null,'learning-checkin');node('summary','Suggested teaching conversation',checkin);support.before(checkin);checkin.append(support);render();
}
async function renderReport(name, report) {
    const root = $('studentReport');
    if (root.querySelector('#teacherFeedbackForm') && !(await allowDiscard())) return;
    document.body.classList.add('student-report-focused');root.replaceChildren();node('span','INDIVIDUAL LEARNING REPORT',root,'eyebrow'); node('h3', `${name}'s learning`, root);
    root.dataset.userId=report.userId||'';for(const row of document.querySelectorAll('#teacherRoster tr[data-user-id]')){const open=row.dataset.userId===report.userId;row.dataset.reportOpen=String(open);row.querySelector('button[data-report-open]')?.setAttribute('aria-expanded',String(open));}node('p',detail?.classroom.name||'Student learning records',root,'progress-report-class');
    if (report.userId && detail?.classroom.status==='active') {
        const actions=node('div',null,root,'teacher-actions teacher-report-exports');
        const classId=selected,generation=epoch,className=detail.classroom.name;
        const exportReport=kind=>task(async()=>{
            const fresh=await loadTeacherStudent(classId,report.userId);
            if(generation!==epoch||selected!==classId||!root.isConnected||!root.querySelector('.teacher-report-exports')?.isSameNode(actions))return;
            const rows=learningReportRows({studentName:[fresh.profile?.firstName,fresh.profile?.lastName].filter(Boolean).join(' ')||name,className,report:fresh,missions});
            if(kind==='csv')downloadLearningReport(rows);else printLearningReport(rows);
        },'Learning report prepared from freshly loaded records.');
        button('Download CSV',actions,()=>exportReport('csv'));
        button('Print Learning Report',actions,()=>exportReport('print'));
    }
    const returnButton=button('Back to Student List', root, async () => { if (!(await allowDiscard())) return; const returningUser=root.dataset.userId;clearStudentReport(); $('teacherRoster').scrollIntoView({block:'start', behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}); const returningButton=[...$('teacherRoster').querySelectorAll('button[data-report-open]')].find(button=>button.dataset.reportOpen===returningUser);if(returningButton)returningButton.focus({preventScroll:true});else if (!$('rosterSearchForm').hidden) $('rosterSearch').focus(); });
    returnButton.classList.add('teacher-report-return');root.prepend(returnButton);
    if (report.userId && detail?.members.some(m=>m.userId===report.userId)) {(await renderTeacherSupport(root,report.userId,report.attempts));renderTeacherFeedback(root,report.userId,name);}
    const completed = report.progress.filter((p,index,rows) => p.completed === true && missions.some(m=>m.id===p.missionId&&m.chapterId===p.chapterId) && rows.findIndex(item=>item.completed===true&&item.missionId===p.missionId&&item.chapterId===p.chapterId)===index);
    const snapshot=node('section',null,root,'teacher-report-snapshot');snapshot.setAttribute('aria-label','Learning snapshot');
    for(const [value,label] of [[completed.length,'Completed missions'],[report.attempts.length,'Saved quiz attempts'],[quizReviewSignals(report.attempts).review.length,'Missions with review signals']]){const card=node('div',null,snapshot);node('strong',String(value),card);node('span',label,card);}
    const recordCounts=node('p', `${completed.length} completed ${completed.length===1?'mission':'missions'} · ${report.attempts.length} saved quiz ${report.attempts.length===1?'attempt':'attempts'}`, root,'teacher-note');
    node('p', 'Use these saved learning records alongside classroom discussion and the explanations the student shares.', root, 'teacher-note');
    const title = id => missions.find(m => m.id === id)?.title || missions.find(m => m.id === id)?.name || id || 'Unknown mission';
    const topicLabel = value => String(value).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    const topics = attempt => Array.isArray(attempt.topicsForReview) && attempt.topicsForReview.length ? attempt.topicsForReview.map(topicLabel).join(', ') : 'None recorded';
    const completionHistory = node('details', null, root, 'teacher-report-history');
    node('summary', 'Completed missions (' + completed.length + ')', completionHistory);
    if (completed.length) table(completionHistory, 'Completed missions', ['Mission', 'Best score', 'Completed'], completed.map(p => [title(p.missionId), Number.isFinite(p.bestScore) ? p.bestScore + '%' : 'Unavailable', date(p.completedAt)]));
    else node('p', 'No completed missions are saved yet.', root);
    const {attempts, ambiguous, review} = quizReviewSignals(report.attempts);
    const topicCounts=new Map();
    for(const attempt of attempts)for(const topic of new Set(Array.isArray(attempt.topicsForReview)?attempt.topicsForReview:[]))topicCounts.set(topic,(topicCounts.get(topic)||0)+1);
    if(topicCounts.size){
        const recurring=node('section',null,root,'teacher-report-topics');node('h4','Recorded review topics',recurring);
        node('p','Counts show how many saved attempts recorded each topic. They include past attempts and do not mean the topic is still unresolved; use the latest-result check-in below.',recurring,'teacher-note');
        table(recurring,'Topics recorded across quiz history',['Topic','Saved attempts'],[...topicCounts].sort((a,b)=>b[1]-a[1]).map(([topic,count])=>[topicLabel(topic),count]));
    }
    const support = node('section', null, root, 'teacher-next'); node('h4', 'Plan a learning check-in', support);
    const supportStatus=quizSupportLabel(quizReviewSignals(report.attempts));node('p',supportStatus.label+': '+supportStatus.reason,support,'teacher-note');
    if (review.length) {
        node('p', 'These missions have a review signal in their latest saved attempt. Ask the student what they understand before deciding what support to give.', support);
        const list = node('ul', null, support);
        for (const attempt of review) {
            const item = node('li', null, list);
            node('strong', title(attempt.missionId), item);
            node('p','Evidence recorded: '+date(attempt.completedAt)+' (Philippine time). Saved quiz evidence; check with the student before choosing support.',item,'teacher-note');
            node('p', attempt.topicsForReview?.length ? 'Discuss: ' + topics(attempt) : 'Revisit the lesson and try again.', item);
            const mission = missions.find(m => m.id === attempt.missionId);
            if (missionGoal(mission)) node('p', 'Lesson goal: ' + missionGoal(mission), item, 'teacher-note');
            if(mission&&report.userId&&detail?.classroom.status==='active'){
                const actions=node('div',null,item,'teacher-actions teacher-evidence-actions');
                button('Write guidance',actions,async ()=>(await focusTeacherGuidance(root,mission.id)));
                const mapped=[...new Set((attempt.topicsForReview||[]).filter(topic=>typeof topic==='string'&&topic.trim()).map(topic=>topic.trim()))];
                const reviewLink=node('a','Plan personal review',actions,'teacher-class-link');reviewLink.href=teacherRouteURL('assignments',{planReview:'1',student:report.userId,mission:mission.id,...(mapped.length===1?{reviewTopic:mapped[0]}:{})});
                node('p','Guidance stays private. Planning a review does not send it; confirm the student, focus and instructions first.',item,'teacher-note');
            }
            node('p', typeof mission?.learningGuide?.question === 'string' && mission.learningGuide.question.trim() ? 'Ask: ' + mission.learningGuide.question : 'Ask: What happened, and which clue supports your explanation?', item);
            node('p', 'Have the student revisit this mission from My Journey, explain a clue in their own words, then use the available review or retry.', item, 'teacher-note');
        }
    } else node('p', attempts.length ? 'No clear current review signal is available. Ask the student to explain one historical idea and the clue supporting it.' : 'No quiz evidence is available yet. Help the student start an available mission, then return to this report.', support);
    if (ambiguous.size) node('p', 'Some attempts have missing, future or identical timestamps, so their latest result cannot be determined. Check the attempt history with the student.', support, 'teacher-note');
    if (attempts.length) {
        const comparison = node('section', null, root, 'teacher-report-comparison');
        node('h4', 'Recent results by mission', comparison);
        node('p', 'Compare the two most recent dated attempts. Questions can differ between attempts; score changes alone do not establish mastery or learning gains. Topic names below are formatted from saved topic IDs.', comparison, 'teacher-note');
        const missionIds = [...new Set(attempts.map(a => a.missionId).filter(Boolean))];
        table(comparison, 'Latest and previous quiz results', ['Mission', 'Latest score', 'Previous score', 'Change'], missionIds.map(id => {
            const history = attempts.filter(a => a.missionId === id);
            const first = history[0], previous = history[1];
            const uncertain = ambiguous.has(id) || (previous && (!Number.isFinite(previous.completedAt?.toMillis?.()) || history[2]?.completedAt?.toMillis?.() === previous.completedAt?.toMillis?.()));
            const score = a => Number.isFinite(a?.score) ? a.score + '%' : 'Unavailable';
            const delta = first?.score - previous?.score;
            return [title(id), uncertain ? 'Order unavailable' : score(first), uncertain ? 'Order unavailable' : previous ? score(previous) : 'No previous attempt', uncertain ? 'Check attempt dates' : previous && Number.isFinite(first.score) && Number.isFinite(previous.score) ? (delta > 0 ? '+' : '') + delta + ' percentage points' : 'Not enough evidence'];
        }));
        const history = node('details', null, root, 'teacher-report-history');
        node('summary', 'All saved quiz attempts (' + attempts.length + ')', history);
        table(history, 'Quiz attempts (dated newest first; missing dates last)', ['Mission', 'Submitted (Philippine time)', 'Score', 'Result', 'Topics to revisit'], attempts.map(a => [title(a.missionId), date(a.completedAt), Number.isFinite(a.score) ? a.score + '%' : 'Unavailable', a.passed === true ? 'Passed' : a.passed === false ? 'Review and retry' : 'Unavailable', topics(a)]));
    }
    else node('p', 'No quiz attempts are saved yet.', root);
    // Keep the useful teaching summary first; editing tools and records follow.
    root.prepend(returnButton);(root.querySelector('.progress-report-class')||root.querySelector('h3')).after(snapshot);snapshot.after(support);
    const feedbackPanel=root.querySelector('.teacher-feedback-panel');
    if(feedbackPanel){const feedbackDetails=node('details',null,root,'teacher-report-tool');node('summary','Send guidance to the student',feedbackDetails);feedbackDetails.append(feedbackPanel);}
    const privatePanel=root.querySelector('.teacher-support-panel');if(privatePanel)root.append(privatePanel);
    const records=node('details',null,root,'teacher-report-records');node('summary','Learning history and score details',records);
    records.append(recordCounts);
    for(const element of [...root.children])if(element.matches('.teacher-report-history,.teacher-report-comparison,.teacher-report-topics'))records.append(element);
    const exports=root.querySelector('.teacher-report-exports');
    if(exports){const tools=node('details',null,root,'teacher-report-tool');node('summary','Print or download learning records',tools);tools.append(exports);node('p','Exports contain fresh learning records only. Private notes and feedback messages are excluded.',tools,'teacher-note');}
    renderStudentLearningJourney(root,name,report,snapshot,support);
    const reportHeading=root.querySelector('.learning-profile h3')||root.querySelector('h3');if(reportHeading){reportHeading.tabIndex=-1;reportHeading.focus({preventScroll:true});}
}
function renderReviewOutcomeCard(parent,review,result,classId){
    const item=node('article',null,parent,'teacher-dashboard-entry');node('strong',names.get(review.userId)||'Student account '+review.userId.slice(-8),item);node('p',review.title,item);
    if(review.reviewTopic)node('p','Review focus: '+review.reviewTopic.replace(/[-_]+/g,' '),item,'teacher-note');
    const stages=result?.progress?.reviewStages||reviewLearningStages(null,null,{requested:!!review.reflectionQuestion,reflectionAvailable:false});
    const steps=node('ol',null,item,'teacher-review-stages');for(const [key,title,label]of [['practice','Practice',stages.practiceLabel],['explanation','Explanation',stages.explanationLabel],['guidance','Teacher guidance',stages.guidanceLabel]]){const step=node('li',null,steps);step.dataset.reviewStage=key;step.dataset.state=stages[key];node('strong',title,step);node('span',label,step);}const intervention=result?.progress?.reviewIntervention||reviewInterventionSummary(result?.progress?.reviewEvidence,stages);node('p',intervention.next,item,'teacher-review-next-step');
    const timeline=node('details',null,item,'teacher-review-intervention');timeline.dataset.state=intervention.state;node('summary','Before, support and follow-up',timeline);
    const timelineList=node('dl',null,timeline);for(const [title,copy]of [['Before',intervention.before],['Support',intervention.support],['Follow-up',intervention.after]]){node('dt',title,timelineList);node('dd',copy,timelineList);}node('p',intervention.limit,timeline,'teacher-note');
    if(stages.explanation==='shared'){const respond=node('a',stages.guidance==='sent'?'Read explanation and guidance':'Respond to explanation',item,'teacher-class-link');respond.href=teacherRouteURL('students',{followup:'explanation',request:review.id});}const link=node('a','Open review evidence',item,'teacher-class-link');
    const url=new URL(teacherRoutes.assignments,location.href);url.searchParams.set('class',classId);url.searchParams.set('assignment',review.id);link.href=url.href;
}
function renderReviewOutcomes(parent){
 const classId=selected,generation=epoch,reviews=detail.assignments.filter(a=>a.assignmentType==='targeted-review'&&a.status==='published'&&detail.members.some(m=>m.userId===a.userId));
 if(!reviews.length)return;
 const host=node('details',null,parent,'teacher-help-inbox');node('summary','Review outcomes to acknowledge',host);node('p','Load fresh quiz evidence to see which reviews reached their passing goal. A passing score and an explanation are separate signals.',host,'teacher-note');const content=node('div',null,host);let page=0,busy=false;
 const load=async()=>{if(busy)return;busy=true;loadButton.disabled=true;content.replaceChildren();node('p','Checking this group of reviews...',content,'teacher-note');try{const group=reviews.slice(page*10,(page+1)*10),results=[];for(const review of group){const result=(await loadTeacherAssignmentProgress(classId,review,[review.userId]))[0];if(generation!==epoch||selected!==classId||!host.isConnected)return;results.push({review,result});}content.replaceChildren();node('p','Reviews '+(page*10+1)+'–'+Math.min((page+1)*10,reviews.length)+' of '+reviews.length+'. Results loaded now.',content,'teacher-note');for(const {review,result} of results){renderReviewOutcomeCard(content,review,result,classId);}const actions=node('div',null,content,'teacher-actions');if(page>0)button('Previous reviews',actions,()=>{page--;load();});if((page+1)*10<reviews.length)button('Next reviews',actions,()=>{page++;load();});}catch{if(host.isConnected){content.replaceChildren();node('p','Review outcomes could not load. Try again.',content,'teacher-note');}}finally{busy=false;if(host.isConnected)loadButton.disabled=false;}};
 const loadButton=button('Check review outcomes',host,load);
}
async function renderTeacherSupport(parent,userId,attempts) {
    const host=node('details',null,parent,'teacher-support-panel');host.id='teacherPrivateFollowup';
    node('summary','Private teacher follow-up',host);
    node('p','Only you can read these notes. Use Planned or Discussed to record your next action. These statuses do not change the student’s review signals or learning results.',host,'teacher-note');
    const classId=selected,generation=epoch,current=()=>generation===epoch&&selected===classId&&host.isConnected;
    const notice=node('p','Loading private follow-ups...',host,'teacher-note');notice.setAttribute('role','status');
    const form=node('form',null,host);form.id='teacherSupportForm';form.hidden=true;
    const missionLabel=node('label','Mission',form),mission=node('select',null,missionLabel);mission.name='missionId';mission.required=true;
    node('option','Choose a mission',mission).value='';for(const item of missions)node('option',item.title||item.name||item.id,mission).value=item.id;
    const statusLabel=node('label','Follow-up status',form),status=node('select',null,statusLabel);status.name='status';
    node('option','Follow-up planned',status).value='planned';node('option','Discussed with student',status).value='discussed';
    const noteLabel=node('label','Private note',form),note=node('textarea',null,noteLabel);note.name='note';note.maxLength=1500;note.required=true;note.placeholder='Plan a short discussion about the evidence the student used.';
    const save=node('button','Save Private Follow-up',form);save.type='submit';
    const history=node('div',null,host,'teacher-support-history');history.setAttribute('aria-live','polite');
    let rows=[],loaded=false,lastMission='';
    const dirty=()=>formBaselines.has(form.id)&&formSignature(form)!==formBaselines.get(form.id);
    const discard=async ()=>!dirty()||(await appConfirm('Discard unsaved changes to this private follow-up?'));
    const selectMission=async id=>{
        mission.value=lastMission;
        if(!(await discard()))return;
        const saved=rows.find(item=>item.missionId===id);
        mission.value=id;lastMission=id;status.value=saved?.status||'planned';note.value=saved?.note||'';
        save.textContent=saved?'Update Private Follow-up':'Save Private Follow-up';rememberEdits(['teacherSupportForm']);
    };
    mission.addEventListener('change',async ()=>(await selectMission(mission.value)));
    const load=async()=>{
        notice.textContent='Loading private follow-ups...';loaded=false;
        try{
            const records=await loadTeacherSupportNotes(classId,userId);if(!current())return;
            rows=records;loaded=true;form.hidden=false;history.replaceChildren();
            notice.textContent=rows.length?'Private to your teacher account. Quiz evidence is from the report you opened; reopen the report to check for later attempts.':'No private follow-up recorded yet.';
            for(const item of rows.sort((a,b)=>(b.updatedAt?.toMillis?.()||0)-(a.updatedAt?.toMillis?.()||0))){
                const row=node('article',null,history,'teacher-dashboard-entry');
                node('strong',missions.find(m=>m.id===item.missionId)?.title||item.missionId,row);
                node('p',(item.status==='discussed'?'Discussed':'Follow-up planned')+' · '+date(item.statusAt),row,'teacher-support-state');
                node('p',item.note,row,'class-feedback-body');
                node('p','Note updated '+date(item.updatedAt),row,'teacher-note');
                const evidence=followupQuizEvidence(item,attempts);
                if(!evidence.available)node('p','Follow-up date unavailable. Compare the attempt history manually.',row,'teacher-note');
                else if(!evidence.attempts.length)node('p','No dated quiz attempts are saved after this follow-up status yet. This does not establish understanding or inactivity.',row,'teacher-note');
                else {
                    node('p',`${evidence.attempts.length} saved quiz attempts after this status change. Questions can differ; scores do not prove that the discussion caused learning gains.`,row,'teacher-note');
                    table(row,'Recent quiz evidence after follow-up',['Submitted','Score','Saved result'],evidence.attempts.slice(0,3).map(a=>[date(a.completedAt),Number.isFinite(a.score)?a.score+'%':'Unavailable',a.passed===true?'Passed':a.passed===false?'Review suggested':'Unavailable']));
                }
                if(evidence.uncertain)node('p','Some attempt dates are missing, identical or in the future. A definite latest result cannot be inferred.',row,'teacher-note');
                button('Edit Follow-up',row,async ()=>{(await selectMission(item.missionId));host.open=true;note.focus();});
            }
            if(!dirty())(await selectMission(lastMission));
        }catch{
            if(!current())return;
            notice.textContent='Private follow-ups could not load. Your learning report and student feedback remain available.';
            history.replaceChildren();button('Retry Private Follow-ups',history,async ()=>{if((await discard()))(await load());});
        }
    };
    button('Reload Private Follow-ups',host,async ()=>{if((await discard())){form.reset();lastMission='';rememberEdits(['teacherSupportForm']);(await load());}});
    form.addEventListener('submit',event=>{
        event.preventDefault();if(!current()||!loaded){message('Load private follow-ups before saving.',true);return;}
        const missionId=mission.value,noteText=note.value,nextStatus=status.value,revision=rows.find(item=>item.missionId===missionId)?.revision||0;
        task(async()=>{
            await saveTeacherSupportNote(classId,userId,missionId,nextStatus,noteText,revision);if(!current())return;
            form.reset();lastMission='';rememberEdits(['teacherSupportForm']);await load();host.open=true;
        },'Private follow-up saved. It is not visible to the student.');
    });
    rememberEdits(['teacherSupportForm']);(await load());
}
function renderTeacherFeedback(parent,userId,name) {
    const host=node('section',null,parent,'teacher-feedback-panel');
    node('h4','Give '+name+' a next step',host);
    node('p','Send short, encouraging guidance for one mission. This message is visible to the student; keep private notes out of it. Updating a mission’s feedback replaces its previous message and resets the read acknowledgement.',host,'teacher-note');
    const classId=selected,generation=epoch;
    const current=()=>generation===epoch&&selected===classId&&host.isConnected;
    const form=node('form',null,host);form.id='teacherFeedbackForm';
    const missionLabel=node('label','Mission',form),mission=node('select',null,missionLabel);mission.name='missionId';mission.required=true;
    node('option','Choose a mission',mission).value='';
    for(const item of missions)node('option',item.title||item.name||item.id,mission).value=item.id;
    const label=node('label','Your guidance',form),body=node('textarea',null,label);body.name='body';body.required=true;body.maxLength=1500;body.placeholder='Revisit the boat-building clue. How did boats help communities trade? Explain one connection in your own words.';
    const encouragement=node('details',null,form,'teacher-encouragement');node('summary','Write private encouragement',encouragement);node('p','Choose a starting point, then personalize it with something you observed. Messages do not change scores or rewards.',encouragement,'teacher-note');
    for(const [title,prompt] of [['Recognize effort','You kept working on this topic. Which clue helped you move forward?'],['Recognize improvement','Your new explanation shows progress. Keep connecting your ideas to historical clues.'],['Recognize reasoning','You supported your explanation with a clue. Tell me how that clue connects to your idea.']])button(title,encouragement,async ()=>{if(body.value.trim()&&!(await appConfirm('Replace your current unsent guidance with this starting point?')))return;body.value=prompt;body.dispatchEvent(new Event('input',{bubbles:true}));body.focus();});
    const submit=node('button','Send Feedback',form);submit.type='submit';
    const history=node('div',null,host);history.setAttribute('aria-live','polite');
    const load=async()=>{
        history.replaceChildren();node('p','Loading sent feedback...',history,'teacher-note');
        try{
            const rows=await loadTeacherFeedback(classId,userId);if(!current())return;
            history.replaceChildren();node('h4','Sent feedback',history);
            if(!rows.length)node('p','No feedback has been sent to this student yet.',history,'teacher-note');
            for(const item of rows.sort((a,b)=>(b.updatedAt?.toMillis?.()||0)-(a.updatedAt?.toMillis?.()||0))){
                const row=node('article',null,history,'teacher-dashboard-entry');
                node('strong',missions.find(m=>m.id===item.missionId)?.title||item.missionId,row);
                node('p',item.body,row,'class-feedback-body');
                node('p','Updated '+date(item.updatedAt)+' · '+(item.readAt?'Marked read '+date(item.readAt):'Not yet marked as read'),row,'teacher-note');
            }
        }catch{if(current()){history.replaceChildren();node('p','Sent feedback could not load. Refresh to retry; your learning report is still available.',history,'teacher-note');button('Retry Feedback',history,load);}}
    };
    form.addEventListener('submit',event=>{
        event.preventDefault();if(!current())return;
        const missionId=mission.value,message=body.value;
        task(async()=>{
            await sendTeacherFeedback(classId,userId,missionId,message);
            if(!current())return;
            form.reset();rememberEdits(['teacherFeedbackForm']);await load();
        },'Feedback sent. '+name+" can read it in My Class > Overview > Your teacher's guidance.");
    });
    rememberEdits(['teacherFeedbackForm']);load();
}
let assignmentPage=0;
const assignmentFilterLabel = node('label','Show assignments',null,'teacher-progress-filter');
const assignmentFilter = node('select',null,assignmentFilterLabel);
assignmentFilter.id = 'teacherAssignmentFilter';
for (const [value,label] of [['all','All saved assignments'],['published','Published to students'],['draft','Drafts'],['closed','Closed activities'],['withdrawn','Withdrawn activities'],['past-due','Published · due date passed']]) node('option',label,assignmentFilter).value=value;
$('assignmentList').before(assignmentFilterLabel);
assignmentFilter.addEventListener('change',()=>{assignmentPage=0; if (detail) renderPublications('assignment'); });

let assignmentDialog=null,assignmentNew=null,assignmentClose=null,assignmentClassView=null,assignmentPurposeFilter=null;
function openAssignmentComposer(){if(routeName!=='assignments'||busy||!workspaceReady)return;if(!assignmentDialog.open)assignmentDialog.showModal();$('assignmentMission').focus({preventScroll:true});assignmentDialog.dispatchEvent(new Event('assignment-compose-open',{bubbles:true}));}
function closeAssignmentComposer(){if(!assignmentDialog?.open||busy)return;assignmentDialog.close();assignmentNew.focus({preventScroll:true});syncAssignmentBoard();syncPublicationIndicators('assignment');}
function syncAssignmentBoard(){
    if(routeName!=='assignments'||!assignmentNew)return;
    const form=$('assignmentForm');assignmentNew.textContent=form.dataset.recordId?'Continue editing':form.elements.namedItem('missionId').value||form.elements.namedItem('instructions').value.trim()?'Resume activity':'Plan an activity';assignmentNew.disabled=busy||!workspaceReady||detail?.classroom.status==='archived';assignmentClose.disabled=busy;
    assignmentClassView.replaceChildren();node('option','Choose a classroom',assignmentClassView).value='';for(const classroom of classes)node('option',classroom.name+(classroom.status==='archived'?' (archived)':''),assignmentClassView).value=classroom.id;assignmentClassView.value=detail?.classroom.id||'';assignmentClassView.disabled=busy||!workspaceReady;
    assignmentRecipientLabel.hidden=detail?.classroom.status==='active';if(detail?.classroom.status==='active'){assignmentRecipient.value=selected;assignmentRecipientHelp.textContent='For '+detail.classroom.name+'. Published activities appear in My Class.';}
    const personal=assignmentPurpose.value==='targeted-review';document.getElementById('assignmentPurposeNote').textContent=personal?'Personal review: selected students revisit a topic. A new passing quiz result and their explanation help you check understanding.':'Class goal: guide everyone toward a shared topic or discussion. Earlier completion counts; students keep their normal lesson sequence.';
}
if(routeName==='assignments'){
    document.body.classList.add('assignment-board-page');const hero=document.querySelector('.teacher-intro');hero.querySelector('h1').textContent='Learning activities';hero.querySelector('p').textContent='Give your class a shared goal, or help individual students revisit a topic.';
    const classLabel=node('label','Classroom',hero,'assignment-class-context');assignmentClassView=node('select',null,classLabel);assignmentClassView.id='assignmentClassView';assignmentClassView.addEventListener('change',async ()=>{if(!assignmentClassView.value)return;if(busy||!(await allowDiscard())){assignmentClassView.value=selected||'';return;}const classId=assignmentClassView.value;task(async ()=>(await openClass(classId)));});
    const editor=$('assignmentForm').closest('.teacher-editor-card'),library=$('assignmentList').closest('.teacher-library-card');
    const boardHeader=node('header',null,null,'assignment-board-heading');for(const child of [...library.children])if(child.matches('.eyebrow,h3,p.teacher-note'))boardHeader.append(child);library.prepend(boardHeader);assignmentNew=button('Plan an activity',boardHeader,openAssignmentComposer,false);assignmentNew.id='assignmentNew';assignmentNew.setAttribute('aria-haspopup','dialog');assignmentNew.setAttribute('aria-controls','assignmentComposeDialog');
    assignmentDialog=node('dialog',null,$('teacher-assignments'),'assignment-compose-dialog');assignmentDialog.id='assignmentComposeDialog';editor.querySelector('h3').id='assignmentComposeTitle';assignmentDialog.setAttribute('aria-labelledby','assignmentComposeTitle');assignmentDialog.append(editor);assignmentClose=button('Close',editor,closeAssignmentComposer);assignmentClose.classList.add('assignment-compose-close');assignmentClose.setAttribute('aria-label','Close activity and keep unsaved work');assignmentDialog.addEventListener('cancel',event=>{event.preventDefault();closeAssignmentComposer();});
    const purposeNote=node('p','',null,'assignment-purpose-note');purposeNote.id='assignmentPurposeNote';purposeLabel.after(purposeNote);
    const briefing=node('section',null,null,'assignment-learning-brief');briefing.id='assignmentLearningBrief';briefing.setAttribute('aria-label','Activity learning brief');const preview=node('details',null,null,'assignment-preview-toggle');node('summary','Lesson preview and readiness check',preview);assignmentPreview.before(preview);preview.append(assignmentPreview);preview.before(briefing);
    const due=$('assignmentForm').elements.namedItem('dueDate').closest('label'),visibility=$('assignmentForm').elements.namedItem('status').closest('label'),options=node('div',null,null,'assignment-compose-options');due.before(options);options.append(due,visibility);
    const toolbar=node('div',null,null,'assignment-board-filters');assignmentFilterLabel.before(toolbar);toolbar.append(assignmentFilterLabel);const purpose=node('label','Teaching purpose',toolbar);assignmentPurposeFilter=node('select',null,purpose);assignmentPurposeFilter.id='assignmentPurposeFilter';for(const [value,label]of [['all','All activities'],['class-goal','Class goals'],['targeted-review','Personal reviews']])node('option',label,assignmentPurposeFilter).value=value;assignmentPurposeFilter.addEventListener('change',()=>{assignmentPage=0;if(detail)renderPublications('assignment');});
}

function syncPublicationIndicators(kind){
    const form=$(kind+'Form'),state=$(kind+'FormState'),unsent=$(kind+'Unsent');if(!form||!state)return;
    const dirty=formBaselines.has(form.id)&&formSignature(form)!==formBaselines.get(form.id),dialog=form.closest('dialog');
    const pending=publicationWrites.get(kind),uncertain=pending?.uncertain===true;const error=form.dataset.operationError;const text=uncertain?'Save not confirmed. Check save status before submitting again. Your text is kept.':error?error:dirty?'Unsaved changes. Save to keep these edits.':form.dataset.recordId?'Saved record open for editing.':'Not saved yet. Students cannot see this work.';
    if(state.textContent!==text)state.textContent=text;state.dataset.state=uncertain||error?'error':dirty?'unsaved':'idle';const draft=form.querySelector('.publication-save-draft');if(draft)draft.hidden=form.elements.namedItem('status').value!=='published';const check=$(kind+'CheckSave');if(check){check.hidden=!uncertain;check.disabled=busy;}if(uncertain)for(const control of form.querySelectorAll('input,select,textarea,button[type=submit],.publication-save-draft'))control.disabled=true;
    unsent.hidden=!dirty||!!dialog?.open;
    for(const control of document.querySelectorAll('[data-discard-publication="'+kind+'"]')){control.hidden=!dirty;control.disabled=busy;}
}
function showPublicationSuccess(kind,values,recipientCount=1){const notice=$(kind+'SaveNotice');if(!notice)return;notice.querySelectorAll('.publication-refresh').forEach(node=>node.remove());notice.hidden=false;notice.dataset.state='success';const classroom=classes.find(c=>c.id===selected)?.name||'the selected classroom';notice.querySelector('p').textContent=values.status==='draft'?'Draft saved for '+classroom+'. Hidden from students.':kind==='assignment'&&values.assignmentType==='targeted-review'?'Personal review published for '+recipientCount+' student'+(recipientCount===1?'':'s')+' in '+classroom+'. Students can find it in My Class > Activities.':(kind==='announcement'?'Announcement':'Class goal')+' published to '+classroom+'. Students can see it in My Class.';}
if(['announcements','assignments'].includes(routeName)){
    const kind=routeName==='announcements'?'announcement':'assignment',form=$(kind+'Form'),library=$(kind+'List').closest('.teacher-library-card'),noun=kind==='announcement'?'message':'activity';
    const notice=node('section',null,null,'publication-save-notice');notice.id=kind+'SaveNotice';notice.hidden=true;node('p','',notice).setAttribute('role','status');button('Dismiss',notice,()=>{notice.hidden=true;}).setAttribute('aria-label','Dismiss save confirmation');library.querySelector('header').after(notice);
    const unsent=node('section',null,null,'publication-unsent');unsent.id=kind+'Unsent';unsent.hidden=true;node('p','You have unsaved '+noun+' changes on this page. Use Resume to continue.',unsent);notice.after(unsent);
    const state=node('p','',null,'publication-form-state');state.id=kind+'FormState';state.setAttribute('role','status');form.querySelector('.teacher-actions').before(state);
    const checkSave=button('Check save status',form.querySelector('.teacher-actions'),()=>checkPublicationSave(kind));checkSave.id=kind+'CheckSave';checkSave.hidden=true;
    const discard=async ()=>{if(busy)return;if(publicationWrites.get(kind)?.uncertain){message('Check save status before discarding. The previous save may already have reached the server.',true);return;}if(!(await appConfirm('Discard unsaved '+noun+' changes? Your saved records stay unchanged.')))return;$(kind+'Cancel').click();$(kind==='announcement'?'announcementNew':'assignmentNew')?.focus({preventScroll:true});};
    const actions=form.querySelector('.teacher-actions'),saveDraft=button('Save draft',actions,()=>{form.elements.namedItem('status').value='draft';form.dispatchEvent(new Event('change',{bubbles:true}));form.requestSubmit();});saveDraft.classList.add('publication-save-draft');
    for(const host of [actions,unsent]){const control=button('Discard changes',host,discard);control.dataset.discardPublication=kind;control.classList.add('publication-discard');}
    form.addEventListener('reset',()=>{delete form.dataset.expectedPublicationVersion;publicationWrites.delete(kind);delete form.dataset.operationError;});
    for(const eventName of ['input','change'])form.addEventListener(eventName,()=>{delete form.dataset.operationError;const notice=$(kind+'SaveNotice');if(notice)notice.hidden=true;syncPublicationIndicators(kind);});
}

async function finishPublicationSave(kind,attempt){
    const form=$(kind+'Form'),className=classes.find(c=>c.id===attempt.classId)?.name||'your classroom';
    publicationWrites.delete(kind);form.reset();delete form.dataset.recordId;delete form.dataset.operationError;$(kind+'Cancel').hidden=true;rememberEdits([form.id]);
    const dialog=form.closest('dialog');if(dialog?.open)dialog.close();
    let refreshError=null;try{await refresh(attempt.classId);}catch(error){refreshError=error;}
    if(kind==='announcement'){renderAnnouncementRecipients();renderAnnouncementPreview();announcementFilter.value=attempt.values.status;announcementPage=0;}else{renderAssignmentRecipients();renderAssignmentPreview();assignmentFilter.value=attempt.values.status;assignmentPage=0;}
    const root=$(kind+'List');if(!refreshError&&detail?.classroom.id===attempt.classId)renderPublications(kind);else{root.replaceChildren();node('p','Your save was confirmed. This list could not refresh; refresh the saved list to view it.',root,'teacher-note');}
    rememberEdits([form.id]);showPublicationSuccess(kind,attempt.values,attempt.targets?.length||1);
    const notice=$(kind+'SaveNotice');if(refreshError&&notice){notice.dataset.state='refresh-needed';notice.querySelector('p').textContent='Saved successfully for '+className+'. The list could not refresh. Do not submit again; refresh the saved list.';const retry=button('Refresh saved list',notice,async ()=>{if(!(await allowDiscard()))return;task(async()=>{await refresh(attempt.classId);notice.hidden=true;},'Saved list refreshed.');});retry.classList.add('publication-refresh');}
    $(kind==='announcement'?'announcementNew':'assignmentNew')?.focus({preventScroll:true});return refreshError;
}
function checkPublicationSave(kind){const attempt=publicationWrites.get(kind);if(!attempt||busy)return;task(async()=>{
    const loaded=await loadTeacherClass(attempt.classId),rows=kind==='announcement'?loaded.announcements:loaded.assignments,found=attempt.ids.filter(id=>rows.some(row=>row.id===id));
    const expected=publishedDetails(kind,attempt.values);
    if(kind==='assignment'){
        if(attempt.values.assignmentType==='targeted-review')for(const key of ['reviewTopic','reviewSceneId','reflectionQuestion'])expected[key]=String(attempt.values[key]||'').trim();
        expected.dueAt=assignmentDueMillis(attempt.values.dueDate);
    }
    const matches=attempt.ids.every((id,index)=>{const row=rows.find(item=>item.id===id);return row&&Object.entries(expected).every(([key,value])=>key==='dueAt'?(row.dueAt?.toMillis?.()??null)===value:row[key]===value)&&(!attempt.targets||row.userId===attempt.targets[index]);});
    if(found.length===attempt.ids.length&&matches){await finishPublicationSave(kind,attempt);message('Save confirmed. Your record was not submitted again.');}
    else if(!found.length||(attempt.recordId&&found.length===1&&!matches)){attempt.uncertain=false;delete $(kind+'Form').dataset.operationError;if($(kind+'FormState'))$(kind+'FormState').textContent='Your changes were not confirmed in the saved record. Your text is kept; you may try saving again.';message('No saved record found. Your text is kept; you may try saving again.');}
    else throw Error('Some saved records were found. Do not submit again. Refresh the classroom to check these activities.');
});}
function renderPublications(kind) {
    const root = $(kind + 'List'); root.replaceChildren();if(kind==='announcement')syncAnnouncementTabs();
    const rows = kind === 'announcement' ? detail.announcements : detail.assignments;
    if (kind === 'announcement') $('announcementSummary').textContent = `${rows.filter(item => item.status === 'published').length} published · ${rows.filter(item => item.status === 'draft').length} drafts. Only published messages appear in My Class.`;
    if (kind === 'assignment') $('assignmentSummary').textContent = `${rows.filter(item => item.status === 'published').length} published · ${rows.filter(item => item.status === 'draft').length} drafts | ${rows.filter(item=>item.status==='closed').length} closed | ${rows.filter(item=>item.status==='withdrawn').length} withdrawn. Ended activities stay in student history.`;
    if (!rows.length) node('p', kind === 'announcement' ? 'No messages yet. Write a welcome, a reminder, or a question to start a class discussion.' : 'No assigned missions yet.', root);
    const filteredRows = kind === 'assignment' ? rows.filter(item=>!assignmentPurposeFilter||assignmentPurposeFilter.value==='all'||(item.assignmentType||'class-goal')===assignmentPurposeFilter.value).filter(item => assignmentFilter.value === 'all' || assignmentFilter.value === item.status || (assignmentFilter.value === 'past-due' && item.status === 'published' && Number.isFinite(item.dueAt?.toMillis?.()) && item.dueAt.toMillis() < Date.now())) : rows.filter(item=>announcementFilter.value==='all'||item.status===announcementFilter.value);
    if (kind==='announcement'&&rows.length&&!filteredRows.length)node('p','No messages match this filter. Choose All messages to see everything saved for this class.',root,'teacher-note');
    if (kind==='assignment'&&rows.length && !filteredRows.length) node('p','No assignments match this filter. Choose All saved assignments to see the full list.',root,'teacher-note');
    const sortedPublications=[...filteredRows].sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
    if(kind==='assignment')assignmentPage=Math.min(assignmentPage,Math.max(0,Math.ceil(sortedPublications.length/6)-1));
    if(kind==='announcement')announcementPage=Math.min(announcementPage,Math.max(0,Math.ceil(sortedPublications.length/5)-1));
    (kind==='announcement'?sortedPublications.slice(announcementPage*5,announcementPage*5+5):sortedPublications.slice(assignmentPage*6,assignmentPage*6+6)).forEach(item => {
        const row = node('article', null, root, 'teacher-item');
        row.dataset.publicationId = item.id;row.dataset.publicationStatus=item.status;row.dataset.activityPurpose=item.assignmentType||'class-goal';
        node('span',kind==='assignment'?(item.assignmentType==='targeted-review'?'PERSONAL REVIEW':'CLASS LEARNING GOAL'):item.status==='published'?'PUBLISHED':'PRIVATE DRAFT',row,'eyebrow');
        if(item.assignmentType==='targeted-review')node('p','For '+(names.get(item.userId)||'student account '+item.userId.slice(-8)),row,'teacher-note');
        node('h3', item.title, row); node('p', item.status === 'published' ? (kind==='announcement'?'Published to this class':item.assignmentType==='targeted-review'?'Private review for this student':'Shared learning goal for this class') : kind==='assignment'&&item.status==='closed'?'Closed - finished; earlier results and messages remain readable':kind==='assignment'&&item.status==='withdrawn'?'Withdrawn - cancelled and no longer required':'Draft - visible only to you', row, 'teacher-note');
        if (kind === 'assignment') {
            const mission = missions.find(m => m.id === item.missionId);
            node('p', mission?.chapterTitle || 'Chapter title unavailable (' + item.chapterId + ')', row, 'teacher-note');
            if (missionGoal(mission)) node('p', 'Learning goal: ' + missionGoal(mission), row);
            if (!mission) node('p', 'This mission is no longer in the available catalog. Choose an available mission when editing.', row, 'teacher-note');
            node('p', item.dueAt?.toMillis?.() ? 'Due ' + date(item.dueAt) + ' (Philippine time)' + (item.status==='published'&&item.dueAt.toMillis() < Date.now() ? ' · Due date passed' : '') : 'No due date', row, 'teacher-deadline');
        }
        if(kind==='announcement'||item.instructions)node('p',kind==='announcement'?item.body:item.instructions,row);
        if (item.publishedAt) node('p', date(item.publishedAt) + ' (Philippine time)', row, 'teacher-note');
        if (detail.classroom.status === 'active') {
            const actions = node('div', null, row, 'teacher-actions');
            if (kind === 'assignment' && ['published','closed','withdrawn'].includes(item.status)) {
                const progressHost = node('section', null, row, 'teacher-assignment-progress');progressHost.hidden=true;
                progressHost.setAttribute('aria-label', 'Student progress for ' + item.title);
                let page = 0;
                const classId = selected;
                const loadPage = () => task(async () => {
                    const generation = epoch;progressHost.hidden=false;
                    progressHost.replaceChildren(); node('p', 'Loading saved student completions...', progressHost);
                    const recipients=item.assignmentType==='targeted-review'?detail.members.filter(m=>m.userId===item.userId):detail.members;
                    const members = recipients.slice(page * 20, (page + 1) * 20);
                    try {
                        const [results, roster] = await Promise.all([
                            loadTeacherAssignmentProgress(classId, item, members.map(m => m.userId)),
                            loadTeacherRosterNames(classId, members.map(m => m.userId))
                        ]);
                        if (generation !== epoch || selected !== classId || !progressHost.isConnected) return;
                        progressHost.replaceChildren();
                        node('h4', 'Saved mission progress', progressHost);
                        node('p',item.assignmentType==='targeted-review'?'This review needs a new passing quiz result saved after publication. Historical mission completion does not finish it.':'Class goal: earlier independent completion counts. Students may need earlier lessons or chapter checks before they can start.',progressHost,'teacher-note');
                        node('p','Report scope: current active members in the loaded classroom roster. '+members.length+' shown of '+recipients.length+' eligible recipient(s). Former members are excluded; shared goals also include students who joined after publication. Unavailable results are not zero scores. Refresh the classroom to update membership.',progressHost,'teacher-note');
                        if (!members.length) { node('p', item.assignmentType==='targeted-review'?'The intended student is not a current active member. This review is preserved, but there is no eligible recipient in this report.':'No active members are in the loaded classroom roster. Invite students from My Classes.', progressHost); return; }
                        const completed = results.filter(r => r.progress?.completed === true && r.progress.chapterId === item.chapterId).length;
                        node('p', item.assignmentType==='targeted-review'?`${completed} of ${members.length} displayed students reached the practice passing goal. Explanation and teacher guidance are tracked separately.`:`${completed} of ${members.length} displayed students submitted a passing quiz for this class assignment. Personal completion is shown separately.`, progressHost);
                        const filterLabel = node('label', 'Show students', progressHost, 'teacher-progress-filter');
                        const filter = node('select', null, filterLabel); filter.setAttribute('aria-label','Filter students by mission completion');
                        for (const [value,label] of [['all','All students in this group'],['completed',item.assignmentType==='targeted-review'?'Practice passed':'Completed'],['incomplete',item.assignmentType==='targeted-review'?'No passing result yet':'Not yet completed'],['unavailable','Unavailable results']]) node('option',label,filter).value=value;
                        const filtered = node('div',null,progressHost);
                        const progressRows = results.map(result => {
                            const record = result.progress;
                            const state = assignmentProgressState(record,item,result.unavailable);
                            const done = state.status === 'completed';
                            const name = roster.find(r => r.userId === result.userId)?.name || 'Name unavailable · Account ' + result.userId.slice(-8);
                            const evidence=record?.reviewEvidence,stages=record?.reviewStages||reviewLearningStages(evidence,null,{requested:!!item.reflectionQuestion,reflectionAvailable:false});
                            return {state,values:[name,item.assignmentType==='targeted-review'?stages.practiceLabel:state.label,Number.isFinite(record?.bestScore)?record.bestScore+'%':'No result',state.timing,...(item.assignmentType!=='targeted-review'?[record?.priorSoloCompleted?'Completed personally':'No personal completion']:[]),...(item.assignmentType==='targeted-review'?[stages.explanationLabel,stages.guidanceLabel,evidence?.baseline!=null?evidence.baseline+'%':'No baseline',evidence?.change!=null?(evidence.change>0?'+':'')+evidence.change+' percentage points':'Not enough evidence']:[])]};
                        });
                        const show = () => {
                            filtered.replaceChildren();
                            const visible = progressRows.filter(row=>filter.value === 'all' || row.state.status === filter.value);
                            node('p',`${visible.length} matching students in this loaded group. Filters apply to this group of ${members.length}, not the whole class.`,filtered,'teacher-note');
                            if (visible.length) table(filtered, `Students ${page * 20 + 1}–${page * 20 + members.length} of ${recipients.length}`, ['Student',item.assignmentType==='targeted-review'?'Practice result':'Mission status',item.assignmentType==='targeted-review'?'Latest review score':'Best score','Deadline status',...(item.assignmentType!=='targeted-review'?['Personal journey']:[]),...(item.assignmentType==='targeted-review'?['Student explanation','Teacher guidance','Before review','Score change']:[])],visible.map(row=>row.values));
                            else node('p','No students match this filter in the loaded group.',filtered);
                        };
                        filter.addEventListener('change',show); show();
                        const navigation = node('div', null, progressHost, 'teacher-actions');button('Refresh Progress',navigation,loadPage);
                        if (page > 0) button('Previous Students', navigation, () => { page--; loadPage(); });
                        if ((page + 1) * 20 < recipients.length) button('Next Students', navigation, () => { page++; loadPage(); });
                    } catch (error) {
                        if (generation === epoch && selected === classId) { progressHost.replaceChildren(); node('p', 'Progress could not be loaded. Refresh the class and try again.', progressHost); }
                        throw error;
                    }
                });
                button('View Student Progress', actions, () => { loadPage(); }, false).dataset.assignmentProgress = 'true';
            }
            if(kind!=='assignment'||!['closed','withdrawn'].includes(item.status)){
            button('Edit', actions, async () => {
                if(!(await allowDiscard()))return;
                const form = $(kind + 'Form'); form.dataset.recordId = item.id;form.dataset.expectedPublicationVersion=publicationVersion(item);form.dataset.assignmentType=item.assignmentType||'class-goal';
                for (const field of ['title', 'body', 'instructions', 'missionId', 'status']) {
                    const input = form.elements.namedItem(field);
                    if (input) input.value = item[field] || '';
                }
                if (kind === 'assignment') {form.elements.namedItem('dueDate').value = assignmentDueInput(item.dueAt);assignmentPurpose.value=item.assignmentType||'class-goal';assignmentPurpose.disabled=true;reviewTargets.clear();if(item.userId)reviewTargets.add(item.userId);syncReviewTargets();$('assignmentMission').disabled=item.assignmentType==='targeted-review';renderReviewTargets();renderReviewFocus();reviewTopic.value=item.reviewTopic||'';reflectionQuestion.value=item.reflectionQuestion||'';}
                $(kind + 'Cancel').hidden = false;
                if(kind==='announcement'){renderAnnouncementRecipients();announcementRecipient.value=selected;announcementRecipient.disabled=true;}
                rememberEdits([kind + 'Form']);
                if (kind === 'assignment') {renderAssignmentRecipients();assignmentRecipient.value=selected;assignmentRecipient.disabled=true;renderAssignmentPreview();}
                else {renderAnnouncementPreview();openAnnouncementComposer();}
                if(kind==='assignment')openAssignmentComposer();
                if((kind!=='announcement'||routeName!=='announcements')&&(kind!=='assignment'||routeName!=='assignments'))form.scrollIntoView({block:'center', behavior:'smooth'});
                form.querySelector('input, select, textarea').focus();
                message('Editing this classroom item. Save your changes or cancel.');
            });
            button(item.status === 'published' ? 'Move to Draft' : 'Publish', actions, async () => {if(!(await allowDiscard()))return;runClassroomChange(()=>saveTeacherPublication(selected,kind,{...item,expectedVersion:publicationVersion(item),status:item.status==='published'?'draft':'published'},item.id,null,confirmAdditionalReview),'Classroom item updated.');});
            }
            if(kind==='assignment'&&item.status==='published')for(const [nextStatus,label,explanation]of [['closed','Close activity','Finish this activity? Students can read its history and existing replies, but cannot send new requests or explanations. Earlier results and personal learning are kept.'],['withdrawn','Withdraw activity','Cancel this activity? It will no longer be required. Students can read its history and replies. Personal learning and rewards are unchanged.']])button(label,actions,async ()=>{if(!(await allowDiscard())||!(await appConfirm(explanation)))return;runClassroomChange(()=>saveTeacherPublication(selected,'assignment',{...item,status:nextStatus,expectedVersion:publicationVersion(item)},item.id),label==='Close activity'?'Activity closed. Earlier results and messages are preserved.':'Activity withdrawn. It is no longer required.');});
            if(kind==='assignment'&&['closed','withdrawn'].includes(item.status))node('p',(item.endedAt?'Ended '+date(item.endedAt)+'. ':'')+'This activity is read-only. Create a new activity to assign the lesson again.',row,'teacher-note');
        }
    });
    if(kind==='assignment'&&sortedPublications.length>6){const paging=node('nav',null,root,'assignment-paging');paging.setAttribute('aria-label','Saved activity pages');node('span','Page '+(assignmentPage+1)+' of '+Math.ceil(sortedPublications.length/6),paging);if(assignmentPage)button('Previous activities',paging,()=>{assignmentPage--;renderPublications('assignment');});if((assignmentPage+1)*6<sortedPublications.length)button('Next activities',paging,()=>{assignmentPage++;renderPublications('assignment');});}
    if(kind==='announcement'&&sortedPublications.length>5){const paging=node('nav',null,root,'announcement-paging');paging.setAttribute('aria-label','Saved announcement pages');node('span','Page '+(announcementPage+1)+' of '+Math.ceil(sortedPublications.length/5),paging);if(announcementPage)button('Previous posts',paging,()=>{announcementPage--;renderPublications('announcement');});if((announcementPage+1)*5<sortedPublications.length)button('Next posts',paging,()=>{announcementPage++;renderPublications('announcement');});}
}
document.querySelectorAll('[data-teacher-tab]').forEach(el => el.addEventListener('click', async event => {
    if (event.defaultPrevented) return;
    event.preventDefault();
    if (!workspaceReady || busy || !(await allowDiscard())) { event.preventDefault(); return; }
    rememberEdits();
    if(el.href)window.location.assign(el.href);
}));
$('refreshTeacher').addEventListener('click', async () => { if ((await allowDiscard())) task(async () => (await refresh()), 'Classes refreshed.'); });
$('createClassForm').addEventListener('submit', event => {
    event.preventDefault(); const name = $('newClassName').value, description = $('newClassDescription').value;
    task(async () => { const id=await createTeacherClass(name,description);$('createClassForm').reset();rememberEdits(['createClassForm']);goToClassroom(id); },'Class created. Opening your classroom...');
});
$('editClassForm').addEventListener('submit', event => {
    event.preventDefault(); const name = $('editClassName').value, description = $('editClassDescription').value;
    runClassroomChange(()=>editTeacherClass(selected,name,description),'Class details saved.',true);
});
$('archiveClass').addEventListener('click',()=>{const archived=detail?.classroom.status==='archived';runClassroomChange(()=>setTeacherClassStatus(selected,archived?'active':'archived'),'Class status updated. Student progress is preserved.');});
$('rotateTeacherCode').addEventListener('click',()=>runClassroomChange(()=>rotateTeacherCode(selected),'New code generated. Previous codes no longer admit students.'));
$('revokeTeacherCode').addEventListener('click',()=>runClassroomChange(()=>rotateTeacherCode(selected,true),'Invitation revoked. Existing students keep their membership and progress.'));
$('copyTeacherCode').addEventListener('click', () => task(async () => {
    if (!detail?.classroom.currentJoinCode || detail.invitation?.expiresAt?.toMillis() <= Date.now()) throw Error('Generate an active invitation first.');
    await navigator.clipboard.writeText(detail.classroom.currentJoinCode);
}, 'Invitation code copied.'));
for (const kind of ['announcement', 'assignment']) $(kind + 'Form').addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget, values = Object.fromEntries(new FormData(form)), recordId = form.dataset.recordId || null;
    if(recordId)values.expectedVersion=form.dataset.expectedPublicationVersion||'';
    const recipientControl=kind==='announcement'?announcementRecipient:assignmentRecipient;
    const targetClass=recordId?selected:recipientControl.value;
    if(!classes.some(c=>c.id===targetClass&&c.status==='active')){message('Choose an active receiving class before saving or publishing. Your '+(kind==='announcement'?'message':'assignment instructions')+' is still here.',true);recipientControl.focus();return;}
    if (kind === 'assignment') {
        values.missionId=$('assignmentMission').value;
        const mission = missions.find(m => m.id === values.missionId);
        if (!mission) { message('Choose a mission.', true); return; }
        values.chapterId = mission.chapterId;
        values.title = mission.title || mission.name || mission.id;
        values.assignmentType=assignmentPurpose.value;values.userId=[...reviewTargets][0];
        if(values.assignmentType==='targeted-review'){values.reviewTopic=reviewTopic.value;values.reviewSceneId=mission.reviewTopics?.find(t=>t.key===values.reviewTopic)?.sceneId||'';values.reflectionQuestion=reflectionQuestion.value.trim()||'Explain one idea you understand better now and a clue supporting it.';const original=recordId?detail?.assignments.find(a=>a.id===recordId):null;if(original?.assignedAt){values.reviewTopic=original.reviewTopic||'';values.reviewSceneId=original.reviewSceneId||'';values.reflectionQuestion=original.reflectionQuestion||'';}}
        if(values.assignmentType==='targeted-review'&&!reviewTargets.size){message('Choose at least one student for the review. Your instructions are preserved.',true);return;}
    }
    if(publicationWrites.get(kind)?.uncertain){checkPublicationSave(kind);return;}
    const targets=kind==='assignment'&&values.assignmentType==='targeted-review'&&!recordId?[...reviewTargets]:null;
    let attempt=publicationWrites.get(kind);const scope=JSON.stringify([targetClass,recordId,targets?.slice().sort()||null]);
    if(!attempt||attempt.scope!==scope){const ids=recordId?[recordId]:targets?targets.map(()=>newTeacherPublicationId()):[newTeacherPublicationId()];attempt={classId:targetClass,recordId,ids,scope,values:{...values},targets};publicationWrites.set(kind,attempt);}else attempt.values={...values};
    let refreshFailed=false;
    task(async()=>{try{if(targets)await createTeacherReviews(targetClass,values,targets,Object.fromEntries(targets.map(uid=>[uid,attempt.ids[attempt.targets.indexOf(uid)]])),confirmAdditionalReview);else await saveTeacherPublication(targetClass,kind,values,recordId,recordId?null:attempt.ids[0],confirmAdditionalReview);}catch(error){attempt.uncertain=!['permission-denied','invalid-argument','failed-precondition','unauthenticated'].includes(String(error.code||'').replace(/^firestore\//,''));throw error;}refreshFailed=!!(await finishPublicationSave(kind,attempt));},()=>refreshFailed?'Saved successfully. Refresh the list to view your record.':values.status==='draft'?'Draft saved. Students cannot see it.':'Published to the receiving class.');
});
for (const kind of ['announcement','assignment']) $(kind + 'Cancel').addEventListener('click', () => {
    if(publicationWrites.get(kind)?.uncertain){message('Check save status before cancelling this save.',true);return;}
    $(kind + 'Form').reset(); delete $(kind + 'Form').dataset.recordId;
    rememberEdits([kind + 'Form']);
    $(kind + 'Cancel').hidden = true; if (kind === 'assignment') {renderAssignmentRecipients();renderAssignmentPreview();} else {renderAnnouncementRecipients();renderAnnouncementPreview();} rememberEdits([kind+'Form']);if(kind==='announcement')closeAnnouncementComposer(false);if(kind==='assignment')closeAssignmentComposer();message('Editing cancelled.');
});
async function clearWorkspace() {
    pendingClassroomChange=null;classroomRecovery.hidden=true;
    teacherAccountData=null;accountNameBaseline='';preferredName.value='';nameStatus.textContent='';accountHeroName.textContent='Your account';accountHeroTitle.textContent='Account settings';accountHeroBadge.textContent='Teacher account';avatarGrid.replaceChildren();accountAvatar.textContent='T';verificationDetails.replaceChildren();verificationStatus.textContent='Checking your application...';delete verificationStatus.dataset.state;avatarSelect.replaceChildren();avatarSave.disabled=avatarSelect.disabled=true;for(const key of ['name','email','role','verified'])$('teacherAccount'+key).textContent='Loading...';
    $('teacherFollowupContext')?.remove();publicationWrites.clear();if(announcementDialog?.open)announcementDialog.close();if(assignmentDialog?.open)assignmentDialog.close();for(const kind of ['announcement','assignment']){const notice=$(kind+'SaveNotice');if(notice)notice.hidden=true;}
    message('Checking classroom access...',false,'loading');
    catalogInitialized=false;catalogResults.replaceChildren();catalogSearch.value='';catalogChapter.replaceChildren();
    ++allRosterRequest;allClassRoster.replaceChildren();studentClassFilter.replaceChildren();
    classOverview.replaceChildren();
    document.querySelectorAll('.teacher-print-frame').forEach(frame=>frame.remove());
    assignmentFilter.value = 'all';
    classListLoaded = false;
    sectionAnimation?.cancel(); sectionAnimation = null;
    document.body.classList.add('workspace-loading');
    $('teacherStatus').dataset.busy = 'false';
    $('teacherContentLoading').hidden = true;
    workspaceReady = false; activeTab = routeName;
    ++epoch; busy = false; selected = null; detail = null; classes = []; missions = []; names.clear(); rosterQuery = ''; rosterPage = 0;
    $('teacher-main').setAttribute('aria-busy', 'false');
    $('rosterSearchForm').reset(); $('rosterSearchStatus').textContent = '';
    $('teacherClasses').replaceChildren(); $('teacherClassDetail').hidden = true; clearStudentReport();
    $('teacherWelcome').hidden = false; $('teacherClassSummary').replaceChildren(); $('teacherNextActions').replaceChildren(); $('teacherNextTitle').textContent = ''; $('teacherNextDescription').textContent = '';
    $('announcementList').replaceChildren(); $('assignmentList').replaceChildren(); $('assignmentMission').replaceChildren();
    for (const id of ['createClassForm', 'editClassForm', 'announcementForm', 'assignmentForm']) $(id).reset();
    $('assignmentSummary').textContent = ''; renderAssignmentPreview();
    $('announcementSummary').textContent = ''; renderAnnouncementPreview();
    dashboardFeed.replaceChildren();
    $('teacherClassPickerLabel').textContent = 'Choose or create a class'; classPicker.open = true;
    rememberEdits();
    (await tab(routeName)); applyArchiveState();
}
window.addEventListener('pagehide', clearWorkspace);
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
onAuthStateChanged(auth, async user => {
    (await clearWorkspace());
    if (!user) return;
    task(async () => {
        const generation = epoch;
        if(routeName==='settings'){workspaceReady=true;renderTeacherAccount();(await tab('settings'));return;}
        // Classroom management has no mission picker; avoid reading the full
        // lesson/story catalog just to show the directory or class details.
        const needsCatalog=routeName!=='classes'&&routeName!=='announcements'&&(routeName!=='overview'||!!routeParameters.get('class'));
        const next = needsCatalog?await loadTeacherMissions({includeReviewTopics:routeName!=='students'}):[];
        if (generation !== epoch) return;
        missions = next.sort((a, b) => (a.chapterOrder ?? Number.MAX_SAFE_INTEGER) - (b.chapterOrder ?? Number.MAX_SAFE_INTEGER) || String(a.chapterId).localeCompare(String(b.chapterId), undefined, {numeric:true}) || (a.order || 0) - (b.order || 0));
        workspaceReady = true;
        node('option', 'Choose a mission', $('assignmentMission')).value = '';
        missions.forEach(m => node('option', `${m.chapterTitle || m.chapterId} · ${m.title || m.name || m.id}`, $('assignmentMission')).value = m.id);
        renderLessonCatalog(true);
        await refresh();
    }, ['overview','classes','students','settings'].includes(routeName)?'':'Choose a class or create your first one.').then(async () => {
        if (!detail || !auth.currentUser) return;
        if(routeName==='students'&&(routeParameters.has('followup')||routeParameters.has('fromRequest'))){
            const context=node('section',null,null,'teacher-followup-context');context.id='teacherFollowupContext';context.setAttribute('aria-label','Follow-up navigation');document.querySelector('.teacher-intro').after(context);const contextCopy=node('div',null,context);node('span','TEACHING FOLLOW-UP',contextCopy,'eyebrow');node('h2',routeParameters.has('fromRequest')?'Review the learning evidence':'Respond to your student',contextCopy);node('p','',contextCopy,'teacher-note').id='teacherFollowupContextStatus';const actions=node('div',null,context,'teacher-actions');const back=node('a','Back to dashboard',actions,'teacher-class-link');back.href=teacherRoutes.overview;
            if(routeParameters.has('fromRequest')){const backToRequest=node('a','Return to student request',actions,'teacher-class-link');backToRequest.href=teacherRouteURL('students',{followup:routeParameters.get('fromKind'),request:routeParameters.get('fromRequest')});$('teacherFollowupContextStatus').textContent='Use the saved evidence to plan your guidance, then return to the student request.';}
        }
        if(routeName==='students'&&['help','explanation'].includes(routeParameters.get('followup'))){
            const kind=routeParameters.get('followup'),requestId=routeParameters.get('request'),host=[...document.querySelectorAll('[data-followup-kind]')].find(element=>element.dataset.followupKind===kind);
            if(host){let didReveal=false;const reveal=()=>{if(!requestId){if($('teacherFollowupContextStatus'))$('teacherFollowupContextStatus').textContent='Browse this classroom inbox. Load more records as needed; counts describe only the records loaded.';return;}const item=[...host.querySelectorAll('[data-followup-id]')].find(element=>element.dataset.followupId===requestId);if(!item){if(host.dataset.followupsLoaded!=='true')return;if($('teacherFollowupContextStatus'))$('teacherFollowupContextStatus').textContent='This request is not in the loaded inbox. It may have changed or the student may have left. Check the current class requests below.';return;}item.classList.add('teacher-followup-target');if($('teacherFollowupContextStatus'))$('teacherFollowupContextStatus').textContent='You are viewing the selected student request. Your reply stays private to this student.';if(item.dataset.followupUserId&&!item.querySelector('.followup-evidence-link')){const evidence=node('a','View learning evidence',item,'teacher-class-link followup-evidence-link');evidence.href=teacherRouteURL('students',{student:item.dataset.followupUserId,fromKind:kind,fromRequest:requestId});}if(didReveal)return;didReveal=true;item.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});const focus=item.querySelector('textarea')||item.querySelector('h4');if(focus){if(focus.tagName==='H4')focus.tabIndex=-1;focus.focus({preventScroll:true});}};host.addEventListener('followups:loaded',reveal);host.addEventListener('followups:updated',()=>{if($('teacherFollowupContextStatus'))$('teacherFollowupContextStatus').textContent='Guidance sent. The student can read it in My Class. Return to the dashboard for your next follow-up.';});host.open=true;if(requestId)host.dispatchEvent(new CustomEvent('followups:target',{detail:{id:requestId}}));host.scrollIntoView({block:'start',behavior:'instant'});reveal();}
        }
        if (routeName === 'overview' && detail.classroom.status === 'active' && detail.members.length) $('teacherCheckins')?.querySelector('button')?.click();
        const assignmentId = routeParameters.get('assignment'), studentId = routeParameters.get('student');
        if (routeName === 'assignments' && assignmentId) {
            const row = [...$('assignmentList').children].find(item => item.dataset.publicationId === assignmentId);
            row?.querySelector('[data-assignment-progress]')?.click();
            row?.scrollIntoView({block:'start', behavior:'smooth'});
        }
        if(routeName==='assignments'&&routeParameters.get('planReview')==='1'){try{await prepareEvidenceReview(selected,studentId,routeParameters.get('mission'),routeParameters.get('reviewTopic')||'');}catch(error){message(error.message,true);}}
        else if(routeName==='assignments'&&routeParameters.get('mission')&&missions.some(m=>m.id===routeParameters.get('mission'))){$('assignmentMission').value=routeParameters.get('mission');renderAssignmentPreview();rememberEdits(['assignmentForm']);openAssignmentComposer();}
        if (routeName === 'students' && studentId && detail.members.some(member => member.userId === studentId)) task(async () => {
            const generation = epoch, classId = selected;
            const report = await loadTeacherStudent(classId, studentId);
            if (generation !== epoch || classId !== selected) return;
            (await renderReport([report.profile?.firstName, report.profile?.lastName].filter(Boolean).join(' ') || 'Student', report));
            $('studentReport').scrollIntoView({block:'start', behavior:'smooth'});
        });
    });
});

// One-time viewport motion never controls data loading or disclosure state.
function initializeTeacherPageMotion(){
    if(!['overview','classes','students','announcements','assignments'].includes(routeName)||!('IntersectionObserver' in window))return;
    const preference=matchMedia('(prefers-reduced-motion: reduce)'),seen=new WeakSet(),running=new Set();
    const disabled=()=>preference.matches||document.body.classList.contains('lakbay-reduce-motion');
    const selector=routeName==='students'?'.student-progress-hero,.progress-class-choice,.teacher-student-class-toolbar,.progress-class-metrics>div,.student-list-panel-heading,.teacher-roster-table tbody tr,.teacher-student-followups,.learning-profile,.learning-profile-avatar,.teacher-report-snapshot>div,.learning-mission-card,.learning-coverage-ring,.learning-score-track>span':routeName==='assignments'?'.teacher-intro,.teacher-library-card,#assignmentList .teacher-item':routeName==='announcements'?'.teacher-intro,.announcement-context,.teacher-editor-card,.teacher-library-card,#announcementList .teacher-item':'.overview-hero,.overview-metric,.overview-panel:not(.overview-classrooms),.attention-card,.pulse-event,.overview-class-card,.teacher-class-card,.teacher-class-overview,.teacher-invitation,.teacher-class-creation';
    const stop=()=>{if(disabled())for(const animation of running)animation.cancel();};
    const play=(element,delay=0)=>{
        if(disabled()||!element.isConnected||typeof element.animate!=='function'||element.closest('.classroom-expanded-content'))return;
        let frames=[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],duration=480;
        if(element.matches('.learning-coverage-ring')){frames=[{'--coverage':'0%'},{'--coverage':element.style.getPropertyValue('--coverage')}];duration=1100;}
        else if(element.matches('.learning-score-track>span')){frames=[{transform:'scaleX(0)'},{transform:'scaleX(1)'}];duration=700;}
        else if(element.matches('.learning-profile-avatar')){frames=[{opacity:.3,transform:'scale(.85) rotate(-8deg)'},{opacity:1,transform:'scale(1) rotate(0deg)'}];duration=650;}
        else if(element.matches('tr'))frames=[{opacity:.35},{opacity:1}];
        const animation=element.animate(frames,{duration,delay:routeName==='students'?Math.min(delay,140):delay,easing:'cubic-bezier(.2,.75,.25,1)',fill:'backwards'});
        running.add(animation);animation.finished.catch(()=>{}).finally(()=>running.delete(animation));
    };
    const observer=new IntersectionObserver(entries=>{let stagger=0;for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);play(entry.target,Math.min(stagger++*65,260));}},{threshold:.06});
    const register=root=>{if(!(root instanceof Element))return;for(const element of [root,...root.querySelectorAll(selector)]){if(!element.matches(selector)||seen.has(element))continue;seen.add(element);element.dataset.teacherMotion='ready';if(!disabled())observer.observe(element);}};
    const mutations=new MutationObserver(records=>{for(const record of records){for(const removed of record.removedNodes)if(removed instanceof Element)for(const element of [removed,...removed.querySelectorAll(selector)])observer.unobserve(element);for(const added of record.addedNodes)register(added);}});
    mutations.observe($('teacher-main'),{childList:true,subtree:true});register($('teacher-main'));
    const disclose=event=>{
        const panel=event.target;if(!['students','announcements','assignments'].includes(routeName)||!(panel instanceof HTMLDetailsElement)||!panel.open||disabled())return;
        if(panel.matches('.assignment-preview-toggle')){play(assignmentPreview);return;}
        if(panel.matches('.announcement-preview-toggle')){play($('announcementPreview'));return;}
        if(panel.matches('.learning-attempts')){let delay=0;for(const bar of panel.querySelectorAll('.learning-score-track>span')){observer.unobserve(bar);for(const active of bar.getAnimations())active.cancel();play(bar,delay);delay+=70;}}
        else if(panel.matches('.learning-checkin,.teacher-report-tool,.teacher-support-panel,.teacher-report-records,.teacher-help-inbox'))for(const content of [...panel.children].filter(child=>child.tagName!=='SUMMARY').slice(0,3))play(content);
    };
    $('teacher-main').addEventListener('toggle',disclose,true);
    const editing=event=>{if(['announcements','assignments'].includes(routeName)&&!disabled())play(event.target);};$('teacher-main').addEventListener('announcement-edit-start',editing);$('teacher-main').addEventListener('assignment-compose-open',editing);
    preference.addEventListener('change',stop);
    const settings=new MutationObserver(stop);settings.observe(document.body,{attributes:true,attributeFilter:['class']});
    window.addEventListener('pagehide',()=>{observer.disconnect();mutations.disconnect();settings.disconnect();$('teacher-main').removeEventListener('toggle',disclose,true);$('teacher-main').removeEventListener('announcement-edit-start',editing);$('teacher-main').removeEventListener('assignment-compose-open',editing);for(const animation of running)animation.cancel();},{once:true});
}
initializeTeacherPageMotion();
