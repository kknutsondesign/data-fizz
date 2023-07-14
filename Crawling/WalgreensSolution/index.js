const puppeteer = require('puppeteer');

(async function(){
    const browser = await puppeteer.launch({ headless: false});
    const page = await browser.newPage();
    const baseURL = "http://www.Walgreens.com";

    page.goto(baseURL);
    await page.waitForNavigation();
    await setupJquerry(page);
    
    let householdScraper = new CategoryScraper(page, "Household & Pet Essentials");
    await householdScraper.scrape(15);
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
        await this.navigateToProductList();
        for (let i=1; i<=count;i++){
            //click into a product
            await this.page.locator(`#productSection .product-container>li.card__product:nth-of-type(${i}) a:first-of-type`).click();
            await this.page.waitForNavigation();
            
            //Pass control to product scraper
            let data = await this.scrapeProductPage();
            this.outData.push(data);

            await this.page.goBack();
        }
        console.log(this.outData);
    }

    async navigateToProductList(){

        await this.page.locator('a.menu-trigger').click();
        await this.page.locator('#menu-shop-products> a').click();
        await this.page.locator(`#menu-shop-products li> a[data-element-name="${this.category}"]`).click();
        await this.page.locator(`#menu-shop-products li> .show-next-lvl .right-links li> a[data-element-name="Shop ${this.category}"]`).click();
        
        //TODO:Need to scroll to element, not doing it by default
        await this.page.locator('#category_Link>li:last-of-type>a').click();
        await this.page.waitForNavigation();
    }

    async scrapeProductPage(){
        let pageJSON = await this.page.evaluate(function(){
            let productName = $('#productTitle')[0].innerText;
            
            let priceBox = $('.regular-price span.product__price');
            //priceBox.children('span+sup').prepend('.')
            let listPrice = priceBox.children().text();

            let description = $('#prodDesc>.inner').text();
            let productDimensions = $('.universal-product-inches').text();
            let productUPC = $('#prodSpecCont tr:last-of-type>td').text();

            let imageURLs = [];
            let thumbnails = $('#thumbnailImages').find('button');
            for(var button of thumbnails){
                button.click();
                imageURLs.push($('#productImg').attr('src'));
            }

            //return sorted data object
            return {
                productName,
                listPrice,
                description,
                productDimensions,
                imageURLs,
                productUPC
            };
        });
        return pageJSON;
    }
}