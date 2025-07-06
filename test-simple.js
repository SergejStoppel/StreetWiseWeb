const puppeteer = require('puppeteer');

async function testPuppeteer() {
  console.log('Testing Puppeteer configuration...\n');
  
  let browser;
  let page;
  
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-features=VizDisplayCompositor',
        '--disable-ipc-flooding-protection',
        '--disable-backgrounding-occluded-windows',
        '--disable-background-media-strategy',
        '--disable-web-security',
        '--window-size=1920,1080'
      ],
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      timeout: 60000,
      ignoreHTTPSErrors: true
    });
    
    console.log('✓ Browser launched successfully');
    
    console.log('Creating new page...');
    page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✓ Page created successfully');
    
    console.log('Navigating to example.com...');
    await page.goto('https://example.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log('✓ Navigation successful');
    
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    const url = await page.url();
    console.log(`Page URL: ${url}`);
    
    console.log('\n✓ Puppeteer is working correctly!');
    
  } catch (error) {
    console.error('✗ Puppeteer test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

testPuppeteer();