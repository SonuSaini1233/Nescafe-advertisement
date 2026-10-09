const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9222;
  const tempDir = process.env.TEMP + '\\cdp-profile-' + Date.now();

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--no-first-run',
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  // Get WebSocket debugger URL for the page target
  http.get(`http://localhost:${port}/json/list`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      const list = JSON.parse(data);
      const pageTarget = list.find(t => t.type === 'page') || list[0];
      const wsUrl = pageTarget.webSocketDebuggerUrl;
      console.log('Page Target WS URL:', wsUrl);

      // Node 24 has native global WebSocket!
      runWithNativeWS(wsUrl, chrome);
    });
  }).on('error', (err) => {
    console.error('Failed to connect to Chrome debug port:', err);
    chrome.kill();
  });
}

function runWithNativeWS(wsUrl, chrome) {
  const ws = new WebSocket(wsUrl);
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
    console.log('Connected to CDP WebSocket');
    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Wait 2.5 seconds for images and canvas to initialize
    await new Promise(r => setTimeout(r, 2500));

    // Capture Full Page Screenshot
    console.log('Capturing full page screenshot...');
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true
    });

    const buffer = Buffer.from(result.data, 'base64');
    fs.writeFileSync('full_page_preview.png', buffer);
    console.log(`Saved full_page_preview.png (${buffer.length} bytes)`);

    // Also scroll down to Product Experience section and capture
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('product-experience').scrollIntoView({ behavior: 'instant' });
      `
    });
    await new Promise(r => setTimeout(r, 500));
    const prodShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('product_experience_preview.png', Buffer.from(prodShot.data, 'base64'));
    console.log('Saved product_experience_preview.png');

    // Scroll to Sensory Section
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('sensory-section').scrollIntoView({ behavior: 'instant' });
      `
    });
    await new Promise(r => setTimeout(r, 500));
    const sensoryShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('sensory_section_preview.png', Buffer.from(sensoryShot.data, 'base64'));
    console.log('Saved sensory_section_preview.png');

    // Scroll to Story Section
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('story-section').scrollIntoView({ behavior: 'instant' });
      `
    });
    await new Promise(r => setTimeout(r, 500));
    const storyShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('story_section_preview.png', Buffer.from(storyShot.data, 'base64'));
    console.log('Saved story_section_preview.png');

    // Scroll to Variants Section
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('variants-section').scrollIntoView({ behavior: 'instant' });
      `
    });
    await new Promise(r => setTimeout(r, 500));
    const variantsShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('variants_section_preview.png', Buffer.from(variantsShot.data, 'base64'));
    console.log('Saved variants_section_preview.png');

    // Scroll to Atelier Studio
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('atelier-studio').scrollIntoView({ behavior: 'instant' });
      `
    });
    await new Promise(r => setTimeout(r, 500));
    const atelierShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('atelier_studio_preview.png', Buffer.from(atelierShot.data, 'base64'));
    console.log('Saved atelier_studio_preview.png');

    // Scroll to Reservation Section
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('reservation-section').scrollIntoView({ behavior: 'instant' });
      `
    });
    await new Promise(r => setTimeout(r, 500));
    const ctaShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('cta_section_preview.png', Buffer.from(ctaShot.data, 'base64'));
    console.log('Saved cta_section_preview.png');

    ws.close();
    chrome.kill();
    process.exit(0);
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      const { resolve, reject } = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
