const puppeteer = require('puppeteer');
const fs = require('fs');

(async function(){
    const browser = await puppeteer.launch({ headless: true});
    const page = await browser.newPage();
    const baseURL = "http://www.Walgreens.com";

    page.goto(baseURL);
    await page.waitForNavigation();
    await setupJquerry(page);
    console.log("Page set up.");

    let householdScraper = new CategoryScraper(page, "Household & Pet Essentials");
    await householdScraper.scrape(10);
    await page.close();
    
    // let otherPage = await browser.newPage();
    // await otherPage.goto(baseURL);
    // let beautyScraper = new CategoryScraper(otherPage, "Beauty");
    // await beautyScraper.scrape(1);

    console.log("Writing data to file");
    fs.writeFile(`./${householdScraper.category}_Data.json`, JSON.stringify({products: householdScraper.outData},undefined,4), err =>{if(err) console.log(err|null)});
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
        console.log("Beginning scrape.");
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
        console.log('Navigating to shop page.');
        await this.page.locator('a.menu-trigger').click();
        await this.page.locator('#menu-shop-products> a').click();
        await Promise.all( [this.page.locator(`#menu-shop-products li> a[data-element-name="${this.category}"]`).click(),
                            new Promise(r=> setTimeout(r,2000))]);
        await this.page.evaluate(function(){
            $('.default-dropdown.menu-dropdown.show').scrollTop(500);
        });
        //Element has trouble being scrolled to, instead is directly handled by JQuery
        await this.page.locator(`#menu-shop-products li> .show-next-lvl .right-links li> a[data-element-name="Shop ${this.category}"]`).click();
        
        await this.page.locator('#category_Link>li:last-of-type>a').click();
        await this.page.waitForNavigation();
    }

    async scrapeProductPage(){
        console.log(`Scraping ${this.category} page.`);
        let pageJSON = await this.page.evaluate(function(){
            let productName = $('#productTitle')[0].innerText;
            
            let priceBox = $('.regular-price span.product__price');
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