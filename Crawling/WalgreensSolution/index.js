const puppeteer = require('puppeteer');
const ReturnData = require('./datatemplate.js');

(async function(){
    const browser = await puppeteer.launch({ headless: false});
    
    const page = await browser.newPage();
    const baseURL = "http://www.Walgreens.com";

    let navigate = async function (category){
        page.goto(baseURL);
        await page.waitForNavigation();
        await setupJquerry(page);
        //await page.addScriptTag({url: "https://ajax.googleapis.com/ajax/libs/jquery/3.7.0/jquery.min.js"});

        await page.locator('a.menu-trigger').click();
        await page.locator('#menu-shop-products>a').click();
        await page.locator('#menu-shop-products li>a[data-element-name="Household & Pet Essentials"]').click();
        await page.locator('#menu-shop-products li>.show-next-lvl .right-links li>a[data-element-name="Shop Household & Pet Essentials"]').click();
        
        //TODO:Need to scroll to element, not doing it by default
        await page.locator('#category_Link>li:last-of-type>a').click();
        
        await page.waitForNavigation();
        await page.locator('.product-card-container li.item.card__product:last-of-type a').click();
        await page.waitForNavigation();
        console.log(await page.evaluate(function(){
            return $('#productTitle')[0].innerText;
        }));
    }

    await navigate("Household & Pet Essentials");
})();

async function setupJquerry(page){
    await page.addScriptTag({url: "https://ajax.googleapis.com/ajax/libs/jquery/3.7.0/jquery.min.js"});
}


class CategoryScraper{
    outData = new ReturnData();
    constructor(category){
        this.category = category;
    }

    async navigate(page){
    }

    async scrape(page){

    }
}