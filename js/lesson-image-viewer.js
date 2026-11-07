// Shared, keyboard-accessible image viewer for lessons and the practice preview.
(() => {
    window.LakbayImageViewer = {
        create({getImage, getCaption}) {
            const dialog=document.createElement('dialog');
            dialog.className='lesson-image-dialog';dialog.setAttribute('aria-label','Enlarged lesson illustration');
            const header=document.createElement('div');header.className='lesson-image-dialog-header';
            const title=document.createElement('strong');title.textContent='Look closer';
            const close=document.createElement('button');close.type='button';close.textContent='Close image';
            const image=document.createElement('img'),caption=document.createElement('p');
            header.append(title,close);dialog.append(header,image,caption);document.body.append(dialog);
            let opener;
            function open(trigger) {
                const original=getImage();
                if(!original || original.hidden || !original.getAttribute('src') || typeof dialog.showModal!=='function')return;
                opener=trigger;
                image.src=original.currentSrc||original.src;image.alt=original.alt;
                caption.textContent=getCaption?.()||'';caption.hidden=!caption.textContent;
                if(!dialog.open)dialog.showModal();
                document.documentElement.classList.add('lesson-viewer-open');close.focus();
            }
            function dismiss(){if(dialog.open)dialog.close();}
            close.addEventListener('click',dismiss);
            dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
            dialog.addEventListener('click',event=>{
                const rect=dialog.getBoundingClientRect();
                if(event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))dismiss();
            });
            dialog.addEventListener('close',()=>{
                if(dialog.open)return;
                document.documentElement.classList.remove('lesson-viewer-open');
                image.removeAttribute('src');
                if(opener?.isConnected&&opener.getClientRects().length)opener.focus({preventScroll:true});
            });
            return {open,close:dismiss,dialog};
        }
    };
})();
