const puppeteer = require('puppeteer');
const fs = require('fs');

(async function(){
    const browser = await puppeteer.launch({ headless: true});
    const page = await browser.newPage();
    const baseURL = "http://www.Walgreens.com";

    page.goto(baseURL);
    await page.waitForNavigation();
    await page.addScriptTag({url: "https://ajax.googleapis.com/ajax/libs/jquery/3.7.0/jquery.min.js"});
    console.log("Page set up.");

    let householdScraper = new Walgreens_CategoryScraper(page, "Household & Pet Essentials");
    await householdScraper.scrape(15);
    await page.close();

    householdScraper.outData.forEach((dataTemplate)=>Walgreens_DataCleaner.cleanAll(dataTemplate));

    console.log("Writing data to file");
    fs.writeFile(`./${householdScraper.category}_Data.json`, JSON.stringify({products: householdScraper.outData},undefined,4), err =>{if(err) console.log(err|null)});
})();


class Walgreens_CategoryScraper{
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
            let data = await this.scrapeProductPage(this.page);
            this.outData.push(data);

            await this.page.goBack();
        }
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

    async scrapeProductPage(page){
        console.log(`Scraping ${this.category} product page.`);
        let pageJSON = await page.evaluate(function(){
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
        return new Walgreens_Template(pageJSON);
    }
}

class Walgreens_DataCleaner{
    static cleanAll(obj){
        Walgreens_DataCleaner.clean_productName(obj);
        Walgreens_DataCleaner.clean_listPrice(obj);
        Walgreens_DataCleaner.clean_description(obj);
        Walgreens_DataCleaner.clean_productDimensions(obj);
        Walgreens_DataCleaner.clean_imageURLs(obj);
        Walgreens_DataCleaner.clean_productUPC(obj);
    }

    static clean_productName(obj){
         
    }
    static clean_listPrice(obj){
        const key = 'listPrice';

        let raw = obj[key];
        let out = [];
        //Match all substrings that start with $ followed by digits
        let matches = raw.match(/([$]\d*)+/g);
        for(var s of matches){
            let formatted = s.slice(1,-2)+"."+s.slice(-2);
            out.push(formatted);
        }
        if(out.length > 0)
            obj[key] = out;

    }
    static clean_description(obj){

    }
    static clean_productDimensions(obj){
        const key = 'productDimensions';

        let raw = obj[key];
        let out = "";
        let unit = raw.match(/(inches)|(feet)/g);
        //Match all substrings that are a series of digits that may contain a period
        let matches = raw.match(/(\d+.?\d*)+/g);
        out = matches.join(" x ");
        out += ` ${unit}`;
        obj[key] = out;
    }
    static clean_imageURLs(obj){

    }
    static clean_productUPC(obj){

    }
}

class Walgreens_Template{
    productName = null;
    listPrice = null;
    description = null;
    productDimensions = null;
    imageURLs = null;
    productUPC = null;

    constructor(obj){
        for(var key in obj){
            if(this[key] !== undefined){
                this[key] = obj[key];
            }
        }
    }
}