/**
 *@NApiVersion 2.0
 *@NScriptType RESTlet
 */

 define(['N/record'],function(record){
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