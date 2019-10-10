/**
 *@NApiVersion 2.0
 *@NScriptType RESTlet
 */

 define(['N/record','N/search'],function(record,search){
 		//find customer by email then return netsuite id
 		function checkForCustomer(context){
            var columns = ['internalid','entityid','email','category','pricelevel','isperson'];
 			var customerSearch = search.create({
 				type:search.Type.CUSTOMER,
 				title:'Find duplicate customer',
 				columns:columns,
 				filters:[['email','is',context.email]]
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

            findAddressInCustomer(internalid,context.addressbook)

	 		return internalid;
 		}

 		function getItemId(context){

 		}
 		//check if address exists in customer if not add it
 		function findAddressInCustomer(internalid,addressData){
 			var columns = ['internalid','entityid','address1','email']
 			var customerSearchObj = search.create({
			   type: "customer",
			   filters:
			   [
			      ["address.address1","contains",addressData.addr1], 
			      "AND", 
			      ["internalid","is",internalid]
			   ],
			   columns:
			   [
			      search.createColumn({
			         name: "entityid",
			         sort: search.Sort.ASC
			      }),
			      "email",
			      search.createColumn({
			         name: "address1",
			         join: "Address"
			      }),
			      "internalid"
			   ]
			});
 			var results = customerSearchObj.run().getRange({start: 0, end: 1000});
 			var resultLength = results.length;
 			if(resultLength > 0){
 				log.debug ({
	                title: 'Address Exists',
	                details: 'No address created'
	            });
 				return;
 			}
 			else{

 				log.debug ({
	                title: 'Creating address',
	                details: addressData
	            });
 				var rec = record.load({
				    type: 'customer', 
				    id: internalid,
				    isDynamic: true,
				});

 				createAddress(addressData,rec);

				rec.save();
 			}

 		}

 		function getTax(province){
 			var columns = ['itemid','internalid','state','country'];
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
 		
 		function createItem(itemData,rec,subId){
 			try{
 				var lineCount = 0;
	 			for (var i = 0; i < itemData.length; i++) {
	 				var singleItemData = itemData[i];
	 				for (var itemField in singleItemData) {
						if(singleItemData.hasOwnProperty(itemField)){
							log.debug ({
				                title: 'add sublist item ' + subId + itemField,
				                details: 'data: ' + lineCount + singleItemData[itemField]
				            });
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
 			catch(err){
 				log.error({
					title:err.name + ' error creating sublist ' + subId,
					details:err.message
				});
 			}
 			
 		}
 		//this function needs to exist to handle the dynamic mode for customer records
 		function createAddress(addressData,rec){
 			try{
 				rec.selectNewLine({
		        	sublistId: 'addressbook'
		        });
		        var addressSubrecord = rec.getCurrentSublistSubrecord({
			      sublistId: 'addressbook',
			      fieldId: 'addressbookaddress'
			    });
		        
		        for(var addressField in addressData){
		        	addressSubrecord.setValue({
				        fieldId: addressField,
				        value: addressData[addressField]
				    })
		        }
				
				/*
				addressSubrecord.setValue({
			        fieldId: 'addr1',
			        value: addressData.addr1
			    });
				*/
			    rec.commitLine({
			       sublistId: 'addressbook'
			    });
 			}
 			catch(err){
 				log.error({
					title:err.name + ' error creating address ',
					details:err.message
				});
 			}
 			
 		}

 		function createRecord(context,dynamic){
 			try{
 				if(dynamic === undefined){
 					dynamic = false;
 				}
 				var rec = record.create({
	            	type:context.recordtype,
	            	isDynamic:dynamic
	            });

				for (var fldName in context) {
					if(context.hasOwnProperty(fldName)){
                      
						if(fldName !== 'recordtype' && fldName !== 'items' && fldName !== 'extraData' && fldName !== 'addressbook'){
							rec.setValue(fldName,context[fldName]);
						}
						else if(fldName === 'items'){
							createItem(context[fldName],rec,fldName);
						}
						else if(fldName === 'addressbook'){
							createAddress(context[fldName],rec);
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

 				var customerId = checkForCustomer(context.customer);
 				
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
	            	customerId = createRecord(context.customer,true);
	            	context.order.entity = customerId;
	            	return customerId;
	            }
	            
				//var recordId = createRecord(context.order);
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