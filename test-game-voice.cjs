const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');
const qa=path.resolve(__dirname,'../06_KIEM_THU/V3');
const url=process.argv[2]||pathToFileURL(path.resolve(__dirname,'index.html')).href;
(async()=>{
  for(const channel of process.env.STAR_TEST_BROWSER?[process.env.STAR_TEST_BROWSER]:['chrome','msedge']){
    const browser=await chromium.launch({channel,headless:true,args:['--disable-quic','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    try{
      const ctx=await browser.newContext({hasTouch:true,offline:url.startsWith('file:'),viewport:{width:1366,height:768}});
      const page=await ctx.newPage();
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('requestfailed',req=>{if(req.failure()?.errorText!=='net::ERR_ABORTED')errors.push(req.url());});
      await page.goto(url,{waitUntil:'commit',timeout:45000});
      await page.waitForFunction(()=>!!window.space&&typeof begin==='function',null,{timeout:60000});
      assert.equal(await page.evaluate(()=>new Promise(resolve=>{
        const clip=new Audio('assets/audio/ngoc-linh/ask-5.mp3');
        const timeout=setTimeout(()=>resolve(false),10000);
        clip.onloadedmetadata=()=>{clearTimeout(timeout);resolve(clip.duration>0);};
        clip.onerror=()=>{clearTimeout(timeout);resolve(false);};
      })),true);
      const click=id=>page.locator(id).tap();
      await click('#listen');
      await page.waitForFunction(()=>activeAudio.currentSrc.endsWith('/welcome.mp3')&&!activeAudio.paused);
      await page.waitForFunction(()=>activeAudio.currentSrc.endsWith('/instructions.mp3')&&!activeAudio.paused);
      await click('[data-level="1"]');
      await page.waitForFunction(()=>activeAudio.currentSrc.endsWith('/ask-1.mp3')&&!activeAudio.paused);
      await click('#star');
      await page.waitForFunction(()=>activeAudio.currentSrc.endsWith('/number-1.mp3')&&!activeAudio.paused);
      await click('#mute');
      assert.equal(await page.evaluate(()=>activeAudio.paused),true);
      await click('#mute');
      await click('#listen');
      await page.waitForFunction(()=>activeAudio.currentSrc.endsWith('/ask-1.mp3')&&!activeAudio.paused);
      await click('#even');
      assert.match(await page.locator('#feedback').innerText(),/chọn lại/);
      await click('#help');
      assert.equal(await page.locator('#ten .cell').count(),10);
      assert.equal(await page.locator('#ten .filled').count(),1);
      assert.equal(await page.locator('#ten .leftover').count(),1);
      await click('#close');
      const touch=await ctx.newCDPSession(page);
      const point=async id=>{const b=await page.locator(id).boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2};};
      await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[await point('#star')]});
      await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[await point('#odd')]});
      await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      assert.match(await page.locator('#feedback').innerText(),/Đúng rồi/);
      await click('#next');
      for(let n=2;n<=10;n++){
        assert.equal(Number(await page.locator('#number').innerText()),n);

        await click('#help');
        assert.equal(await page.locator('#ten .filled').count(),n);
        for(let p=0;p<Math.floor(n/2);p++)await click('#step');
        assert.equal(await page.locator('#ten .leftover').count(),n%2);
        await click('#close');
        await click(n%2?'#odd':'#even');
        await click('#next');
      }
      await page.locator('#victory').waitFor({state:'visible'});
      await click('#replay');
      await click('#mute');
      assert.equal(await page.locator('#number').innerText(),'1');
      for(const level of [2,3]){
        await click('#levels');
        await click('[data-level="'+level+'"]');
        const values=[];
        for(let i=0;i<10;i++){
          await page.waitForFunction(i=>document.getElementById('progress').textContent===(i+1)+' / 10',i);
          const n=Number(await page.locator('#number').innerText());
          values.push(n);
          await click(n%2?'#odd':'#even');
          if(level===2)await click('#next');
        }
        assert.deepEqual(values.sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9,10]);
        await page.locator('#victory').waitFor({state:'visible'});
      }
      await page.setViewportSize({width:1920,height:1080});
      await click('#fullscreen');
      await page.waitForFunction(()=>!!document.fullscreenElement);
      assert.deepEqual(errors,[]);
      console.log(channel+': WebGL, 3 levels, 30 rounds, 10 frames, wrong answer, touch drag, replay and fullscreen passed.');
    }finally{await browser.close();}
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
