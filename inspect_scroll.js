const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function inspectScroll() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--user-data-dir=' + process.env.TEMP + '\\cdp-inspect-' + Date.now(),
    '--disable-gpu',
    'http://localhost:3000/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  http.get('http://localhost:9227/json/list', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', async () => {
      const list = JSON.parse(data);
      const pageTarget = list.find(t => t.type === 'page');
      const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);

      let id = 1;
      const callbacks = new Map();
      function send(method, params = {}) {
        return new Promise((resolve, reject) => {
          const msgId = id++;
          callbacks.set(msgId, { resolve, reject });
          ws.send(JSON.stringify({ id: msgId, method, params }));
        });
      }

      ws.onopen = async () => {
        await send('Page.enable');
        await send('Runtime.enable');
        await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
        await new Promise(r => setTimeout(r, 1500));

        // Evaluate layout metrics of hero and sections
        const evalResult = await send('Runtime.evaluate', {
          expression: `
            (() => {
              const hero = document.getElementById('hero-scroller');
              const sticky = document.getElementById('hero-sticky');
              const prod = document.getElementById('product-experience');
              return {
                windowHeight: window.innerHeight,
                heroOffsetTop: hero.offsetTop,
                heroHeight: hero.offsetHeight,
                stickyHeight: sticky.offsetHeight,
                prodOffsetTop: prod.offsetTop,
                documentHeight: document.documentElement.scrollHeight
              };
            })()
          `,
          returnByValue: true
        });

        console.log('Layout Metrics:', evalResult.result.value);

        const captures = [
          { y: 0, file: 'scroll_0.png' },
          { y: 500, file: 'scroll_500.png' },
          { y: 1100, file: 'scroll_1100.png' },
          { y: 1550, file: 'scroll_1550.png' },
          { y: 1900, file: 'scroll_1900.png' },
          { y: 2520, file: 'scroll_2520.png' }
        ];

        for (const cap of captures) {
          await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${cap.y});` });
          await new Promise(r => setTimeout(r, 400));
          let snap = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(cap.file, Buffer.from(snap.data, 'base64'));
        }

        ws.close();
        chrome.kill();
        process.exit(0);
      };

      ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m.id && callbacks.has(m.id)) {
          const { resolve, reject } = callbacks.get(m.id);
          callbacks.delete(m.id);
          if (m.error) reject(m.error); else resolve(m.result);
        }
      };
    });
  });
}

inspectScroll().catch(e => { console.error(e); process.exit(1); });
