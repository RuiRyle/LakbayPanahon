// Independent of the Firebase module graph: never leave a blank startup screen.
(() => {
    const shell=document.getElementById('adminLoading');
    if(!shell)return;
    const message=document.getElementById('adminLoadingMessage');
    const retry=document.getElementById('adminLoadingRetry');
    let timer;
    function sync(){
        const ready=document.body.classList.contains('authenticated')&&!document.body.classList.contains('workspace-loading');
        shell.hidden=ready;
        if(ready){clearTimeout(timer);retry.hidden=true;}
    }
    retry.addEventListener('click',()=>window.location.reload());
    timer=window.setTimeout(()=>{
        if(shell.hidden)return;
        message.textContent='Opening this workspace is taking longer than expected. Check your connection and reload to try again.';
        retry.hidden=false;
    },10000);
    new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
    sync();
})();
