const crypto=require('node:crypto');
function createHostingConfig(htmlSources=[]){
 const hashes=new Set();
 for(const html of htmlSources)for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(!/\bsrc\s*=/i.test(match[1])&&match[2].trim())hashes.add("'sha256-"+crypto.createHash('sha256').update(match[2]).digest('base64')+"'");
 }
 const csp=["default-src 'self'",
  "script-src 'self' https://www.gstatic.com https://www.google.com https://www.recaptcha.net "+[...hashes].join(' '),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com","img-src 'self' data: https:","media-src 'self' blob:",
  "connect-src 'self' https://*.googleapis.com https://www.google.com https://www.recaptcha.net https://lakbaypanahon-1797e.firebaseapp.com",
  "frame-src 'self' https://www.google.com https://www.recaptcha.net https://recaptcha.google.com https://lakbaypanahon-1797e.firebaseapp.com",
  "worker-src 'self' blob:","object-src 'none'","base-uri 'self'","form-action 'self'","frame-ancestors 'self'","upgrade-insecure-requests"].join('; ');
 return {hosting:{site:'lakbaypanahon-1797e',public:'public',ignore:['firebase.json','**/.*','**/node_modules/**'],
  headers:[{source:'**',headers:[
   {key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'SAMEORIGIN'},
   {key:'Referrer-Policy',value:'no-referrer'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=(), payment=(), usb=()'},
   {key:'Content-Security-Policy',value:csp}]},
   {source:'**/*.html',headers:[{key:'Cache-Control',value:'no-store'}]},
   {source:'/',headers:[{key:'Cache-Control',value:'no-store'}]},
   {source:'**/*.{js,css}',headers:[{key:'Cache-Control',value:'no-cache'}]},
   {source:'assets/**',headers:[{key:'Cache-Control',value:'public, max-age=86400'}]}]}};
}
module.exports={createHostingConfig};
