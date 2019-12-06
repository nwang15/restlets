/** 
 * shopify-calls.js
 * @NApiVersion 2.x
 * @NModuleScope Public 
 */


define(['N/https'] , 

    function (https) {    
        function getAllProducts (options,productData) {
            var promise = new Promise(function(resolve,reject){
                if(!productData){
                    productData = [];
                }
                var key = options.keyData.key;
                var pass = options.keyData.pass;
                var url = options.keyData.url;
                var input = key + ":" + pass;
                var authKey = btoa(input);
                setTimeout(function(){
                    log.debug ({
                        title: 'Start Timer 30 sec',
                        details:'will it work?'
                    });
                    productData.push('done timeout');
                    resolve(productData);
                }, 30000);
            });
            
            return promise;
        }
        //take array of arrays and turn it into a single array
        function normalizeArray(productData){
            var normalizedArray = [];

            for(var i = 0;i < productData.length;i++){
                for(var k = 0;k < productData[i].length;k++){
                    var product = productData[i][k];
                    normalizedArray.push(product);
                }
            }

            return normalizedArray;
        }

        function buildFields(fields){
            var fieldString = '&fields=';
            for(var i = 0;i < fields.length;i++){
                if(i !== fields.lenght - 1){
                    fieldString += fields[i] + ',';
                }
                else{
                    fieldString += fields[i];
                } 
            }

            return fieldString;
        }

        function getAllProductsSync (options,fields) {
            try{   
                if(fields){
                    fields = buildFields(fields);
                }
                else{
                    fields = ""
                }
                var page = 1;
                var productData = [];
                var url = options.keyData.url + 'products.json?limit=250&page=' + page + fields;
                var authKey = options.keyData.authKey;

                var header = {
                    Authorization: 'Basic ' + authKey
                };
                var shopifyData = https.get({
                    url:url,
                    headers:header
                });
                log.debug ({
                    title: 'Shopify Data',
                    details: shopifyData
                });
                var parsedBody = JSON.parse(shopifyData.body);
                log.debug ({
                    title: 'Shopify Data parsed',
                    details: parsedBody.products
                });
                productData.push(parsedBody.products);
                while(parsedBody.products.length > 0){
                    page++;
                    url = options.keyData.url + 'products.json?limit=250&page=' + page + fields;
                    shopifyData = https.get({
                        url:url,
                        headers:header
                    });
                    parsedBody = JSON.parse(shopifyData.body);
                    if(parsedBody.products.length > 0){
                        productData.push(parsedBody.products);
                    }
                    //safety stop
                    if(page >= 10){
                        break;
                    }
                }
                var allProducts = normalizeArray(productData);
                return allProducts;
            }
            catch(err){
                log.error({
					title:err.name + ' error getting all product data',
					details:err
				});
            }
            
        }

    return {
        getAllProducts: getAllProducts,
        getAllProductsSync:getAllProductsSync
    }

});