/**
 *@NApiVersion 2.0
 *@NScriptType RESTlet
 */

define(['N/record','N/search','N/encode','./shopify-calls.js','./k-p.js'],function(record,search,encode,shopify,keys){

    function filterResults(results,filterBy,filterColumn){
        for(var i = 0;i < results.length;i++){
            var columnData = results[i].getValue({
                name:filterColumn
            });
            log.debug ({
                title: 'Filter Results Item and shopify item',
                details: columnData + '|' + filterBy
            });
            if(columnData === filterBy){
                return i;
            }
        }

        return 0;
    }

     //search for internalId in results use first result
     //filter by and filter column for getting a specific result from results
     function searchResults(results,columns,filterBy,filterColumn,searchColumn){
        var resultIndex = 0;
        if(filterBy && filterColumn){
            resultIndex = filterResults(results,filterBy,filterColumn);
        }

         if(results.length  > 0){
             
            var data = '';
            var searchData;
            for (var k = 0; k < columns.length; k++) {
                var columnData = results[resultIndex].getValue({
                    name:columns[k]
                });

                data = data + columnData + '|';
   
                if(columns[k].name === searchColumn){
                    log.debug({
                        title: 'Found search column | ' + columns[k].name + '|' + columns[k],
                        details: columnData
                    });
                    searchData = columnData;
                }
            }

            log.debug({
                title: 'Data',
                details: data
            });

            return searchData;     

         }

         else{
             return false;
         }
     }

    function searchProducts(productData){
        var nsData = [];
        var columns = ['name','quantityonhand'];
        for(var i = 0;i < productData.length;i++){
            var product = {};
            product.variants = [];
            for(var k = 0;k < productData[i].variants.length;k++){
                var shopifyVariant = productData[i].variants[k];
                var itemCode = shopifyVariant.sku;
                var variant = {};
                if(itemCode){
                    var itemSearch = search.create({
                        type:search.Type.ITEM,
                        title:'Find item id',
                        columns:columns,
                        filters:[['name','is',itemCode]]
                    });
                    var results = itemSearch.run().getRange({start: 0, end: 1000});
                    log.debug ({
                        title: 'Finding items | ' + itemCode + '|' + i,
                        details: results.length
                    });

                    var itemQuantity = searchResults(results,columns,itemCode,'name','quantityonhand');
                    
                    variant.variantId = shopifyVariant.id;
                    variant.inventory_quantity = itemQuantity;
                    product.variants.push(variant);
                }
                
            }
            product.productId = productData[i].id;
            
            nsData.push(product);
        }

        return nsData;
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

        
        try{      
            var productData = shopify.getAllProductsSync(options,['id','variants']);

            log.debug ({
                title: 'Product Data',
                details: productData.length
            });

            var nsData = searchProducts(productData);

            log.debug ({
                title: 'NS Data',
                details: nsData.length
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