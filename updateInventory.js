/**
 *@NApiVersion 2.0
 *@NScriptType RESTlet
 */

define(['N/record','N/search','N/encode','./shopify-calls.js','./k-p.js'],function(record,search,encode,shopify,keys){

    function searchProducts(productData){
        var nsData = [];
        for(var i = 0;i < productData.length;i++){
            var itemSearch = search.create({
                type:search.Type.ITEM,
                title:'Find item id',
                columns:columns,
                filters:[['name','is',productData[i].item]]
            });
        }
    }

    function updateInventory(context){
        log.debug ({
            title: 'get inventory data',
            details: context
        });

        var keyData = keys.getKeysU();

        var input = keyData.mesak + ":" + keyData.mesap;
        var authKey = encode.convert({
            string: input,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });
        var options = {
            keyData:{
                authKey:authKey,
                url:keyData.mesaurl
            }
        };

        var productdata = shopify.getAllProductsSync(options,['id','variants'])
        try{               
            log.debug ({
                title: 'Product Data',
                details: productdata.length
            });

            return 'Done getting inventory';
        }
        catch(err){
            log.error({
                title:err.name,
                details:err.message
            });
            
            return err;
        }

    }

    return{
        get:updateInventory
    };
});