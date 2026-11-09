// Local-only admin-policy overlay. Accepted rule artifacts remain byte-for-byte intact.
const fs=require('node:fs'),path=require('node:path');
function separateActivation(source){
 const before="request.resource.data.status == (getAfter(/databases/$(database)/documents/teacherApplications/$(userId)).data.status == 'approved' ? 'active' : resource.data.status == 'inactive' ? 'inactive' : 'pending')";
 if(source.split(before).length!==2)throw Error('Expected one teacher approval status constraint.');
 return source.replace(before,before.replace("? 'active' :","? resource.data.status :"));
}
function prepare(){const root=path.resolve(__dirname,'..'),folder=path.join(root,'build/local-admin-rules');fs.mkdirSync(folder,{recursive:true});const file=path.join(folder,'firestore.rules');fs.writeFileSync(file,separateActivation(fs.readFileSync(path.join(root,'firestore.assessment.rules'),'utf8')));return file;}
module.exports={separateActivation,prepare};
if(require.main===module)console.log(prepare());
