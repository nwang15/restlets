/**
 *@NApiVersion 2.0
 *@NScriptType RESTlet
 */

 define(['N/record','N/search'],function(record,search){
 		//find customer by email then return netsuite id
 		function checkForCustomer(email){
            var columns = ['internalid','entityid','email','category','pricelevel'];
 			var customerSearch = search.create({
 				type:search.Type.CUSTOMER,
 				title:'Find duplicate customer',
 				columns:columns,
 				filters:[['email','is',email]]
 			});

 			var results = customerSearch.run().getRange({start: 0, end: 1000});
 			log.debug ({
                title: 'Finding customer',
                details: results.length
            });
            var internalid = searchResults(results,columns);
            log.debug ({
                title: 'customer id',
                details: internalid
            });
	 		return internalid;
 		}

 		function getItemId(context){

 		}

 		function getTax(province){
 			var columns = ['itemid','internalid','state'];
 			var taxSearch = search.create({
 				type:search.Type.TAX_GROUP,
 				title:'Find tax group',
 				columns:columns,
 				filters:[['description','contains',province]]
 			});

 			var results = taxSearch.run().getRange({start: 0, end: 1000});
 			log.debug ({
                title: 'Finding tax results',
                details: results.length
            });

            var internalid = searchResults(results,columns);

	 		return internalid;
 		}
 		//search for internalId in results use first result
 		function searchResults(results,columns){
 			if(results.length  > 0){
 				
 				var data = '';
 				var internalid;
				for (var k = 0; k < columns.length; k++) {
					var columnData = results[0].getValue({
	            		name:columns[k]
	            	});

            		data = data + columnData + '|';
       
            	if(columns[k].name === 'internalid'){
	            		log.debug({
			                title: 'Found internalid',
			                details: columnData
			        	});
						internalid = columnData;
					}
				}

	        	log.debug({
	                title: 'Data',
	                details: data
	        	});

	        	return internalid;     

	 		}

	 		else{
	 			return false;
	 		}
 		}
 		//create sublist item
 		function createItem(itemData,rec,subId){
 			var lineCount = 0;
 			for (var i = 0; i < itemData.length; i++) {
 				var singleItemData = itemData[i];
 				for (var itemField in singleItemData) {
					if(singleItemData.hasOwnProperty(itemField)){
						rec.setSublistValue({
							sublistId:subId,
							fieldId:itemField,
							line:lineCount,
							value:singleItemData[itemField]
						});
					}
				}
				lineCount++;
 			}
 		}

 		function createRecord(context){
 			try{
 				var rec = record.create({
	            	type:context.recordtype
	            });

				for (var fldName in context) {
					if(context.hasOwnProperty(fldName)){
						if(fldName !== 'recordtype' && fldName !== 'items' && fldName !== 'extraData'){
							rec.setValue(fldName,context[fldName]);
						}
						else if(fldName === 'items'){
							createItem(context[fldName],rec,'item');
						}
					}
				}
				var recordId = rec.save();
	            return String(recordId);
 			}
 			catch(err){
 				log.error({
					title:err.name + ' error creating ' + context.recordtype,
					details:err.message
				});
 			}
 			
 		}

 		function createSO(context) {
 			log.debug ({
                title: 'create SO start',
                details: 'before creating data'
            });
 			try{

 				var customerId = checkForCustomer(context.order.email);
 				
 				log.debug ({
	                title: 'Create data',
	                details: context
	            });
 				getTax(context.order.extraData.taxProvince);
 				if(customerId){
 					log.debug ({
		                title: 'Customer exists',
		                details: customerId
		            });
	            	context.order.entity = customerId;
	            }

	            else{
	            	log.debug ({
		                title: 'Customer does not exist',
		                details: customerId
		            });
	            	customerId = createRecord(context.customer);
	            	context.order.entity = customerId;
	            	//return customerId;
	            }
	            
				var recordId = createRecord(context.order);
	            var returnString = 'Customer Id: ' + customerId + ' recordId: ' + recordId;
	            return returnString;
 			}
 			catch(err){
 				log.error({
					title:err.name,
					details:err.message
				});
 			}
 			
        }
 	return{
 		post:createSO
 	};
 });