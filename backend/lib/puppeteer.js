const launchBrowser = async () => {
	if (process.env.VERCEL) {
		const puppeteerCore = require("puppeteer-core");
		const chromium = require("@sparticuz/chromium");
		return puppeteerCore.launch({
			args: chromium.args,
			defaultViewport: chromium.defaultViewport,
			executablePath: await chromium.executablePath(),
			headless: chromium.headless,
		});
	}

	const puppeteerLocal = require("puppeteer");
	return puppeteerLocal.launch({ headless: "new" });
};

module.exports = { launchBrowser };

