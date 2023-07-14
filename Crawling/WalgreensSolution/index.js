const puppeteer = require('puppeteer');
//const ReturnData = require('./datatemplate.js');

(async function(){
    const browser = await puppeteer.launch({ headless: false});
    const page = await browser.newPage();
    const baseURL = "http://www.Walgreens.com";

    page.goto(baseURL);
    await page.waitForNavigation();
    await setupJquerry(page);
    let householdScraper = new CategoryScraper(page, "Household & Pet Essentials")
    await householdScraper.scrape(10);
})();

async function setupJquerry(page){
    await page.addScriptTag({url: "https://ajax.googleapis.com/ajax/libs/jquery/3.7.0/jquery.min.js"});
}


class CategoryScraper{
    outData = [];
    category;
    page;

    constructor(page, category){
        this.category = category;
        this.page = page;
    }

    async scrape(count){
        await this.navigateToProductList(this.page);
        for(let i=1; i<=count;i++){
            //click into a product
            await this.page.locator(`#productSection .product-container>li.card__product:nth-of-type(${i}) a:first-of-type`).click();
            await this.page.waitForNavigation();
            
            //Pass control to product scraper
            this.outData.push(await this.scrapeProductPage());
            console.log(this.outData);
            await this.page.goBack();
        }
    }

    async navigateToProductList(){

        await this.page.locator('a.menu-trigger').click();
        await this.page.locator('#menu-shop-products>a').click();
        await this.page.locator(`#menu-shop-products li>a[data-element-name="${this.category}"]`).click();
        await this.page.locator(`#menu-shop-products li>.show-next-lvl .right-links li>a[data-element-name="Shop ${this.category}"]`).click();
        
        //TODO:Need to scroll to element, not doing it by default
        await this.page.locator('#category_Link>li:last-of-type>a').click();
        await this.page.waitForNavigation();
    }

    async scrapeProductPage(){
        return "Scraped page";
    }
}

class ReturnDataTemplate {
    
    id = null;
    productName = null;
    listPrice = null;
    description = null;
    productDimensions = null;
    imageURLs = null;
    productUPC = null;
    sourceURL = null;

    clearEmtpy(){

    }

    getData(){
        this.clearEmtpy();
        return {
            id,
            productName,
            listPrice,
            description,
            productDimensions,
            imageURLs,
            productUPC,
            sourceURL
        }
    }
}