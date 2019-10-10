/**
 *@NApiVersion 2.0
 *@NScriptType RESTlet
 */

 define(['N/record','N/search'],function(record){

 	function getCustomerAddress(customer){
 		var currentAddressCount = customer.getLineCount({
	      sublistId: 'addressbook'
	    });

	    log.debug({
            title: 'Address count',
            details: currentAddressCount
        });   

        var subrec = customer.getSublistSubrecord({
	      sublistId: 'addressbook',
	      fieldId: 'addressbookaddress',
	      line:0
	    });

	    var addr1 = subrec.getValue({
	    	fieldId:'addr1'
	    })

	    log.debug({
            title: 'Address 1',
            details: addr1
        });  
 	}

	function getRecord(context) {
		log.debug ({
            title: 'get data start',
            details: 'before getting data'
        });
		try{
			log.debug ({
	            title: 'get data',
	            details: context
	        });
        //return 'test';
			/* return record
        return JSON.stringify(record.load({
            type: context.recordtype,
            id: context.id
        }));
        */
        var rec = record.load({
            type: context.recordtype,
            id: context.id
        })
        /* return fields
        var fields = rec.getFields();
        return fields;
        */
        /*Get Sublists
        var sublists = rec.getSublists();

        return sublists;
		*/
		if(context.recordtype === 'customer'){
			getCustomerAddress(rec);
		}
		
        var sublistFieldsItem = rec.getSublistFields({
        	sublistId: 'item'
        });

        return sublistFieldsItem;
        
		}
		catch(err){
			log.error({
				title:err.name,
				details:err.message
			});
		}
			
    }
 	return{
 		post:getRecord
 	};
 });