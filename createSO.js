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
            
            if(internalid){
            	findAddressInCustomer(internalid,context.addressbook);
            }
            
	 		return internalid;
 		}
 		//get item internal id
 		function getItemIds(items,taxcode){
 			try{
 				var columns = ['internalid','name','displayname','internalid'];
	 			var newItems = [];
	 			for(var i = 0;i < items.length;i++){
	 				var itemSearch = search.create({
		 				type:search.Type.ITEM,
		 				title:'Find item id',
		 				columns:columns,
		 				filters:[['name','is',items[i].item]]
		 			});

		 			var results = itemSearch.run().getRange({start: 0, end: 1000});
		 			log.debug ({
		                title: 'Finding items',
		                details: results.length
		            });

		            var internalid = searchResults(results,columns);
		            log.debug ({
		                title: 'item id',
		                details: internalid
		            });
		            newItems.push({
		            	item:internalid,
		            	quantity:items[i].quantity,
		            	taxcode:taxcode,
		            	price:items[i].price,
		            	rate:items[i].rate
		            })
	 			}

	            return newItems;
 			}
 			catch(err){
 				log.error({
					title:err.name + ' error getting item ids',
					details:err
				});
 			}
 			
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
			   columns:columns
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
				 setCustomerDefaults(rec);

				rec.save();
 			}

 		}
 		//get tax internal id
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
			//handle outside canada
			if(!internalid){
				internalid = 4288;
			}
			log.debug ({
                title: 'Tax result',
                details: internalid
            });
	 		return internalid;
		 }
 		//get shipping internalId
 		function getShipping(shipString){
 			var columns = ['itemid','description','internalid'];
 			var taxSearch = search.create({
 				type:'shipitem',
 				title:'Find shipping',
 				columns:columns,
 				filters:[['description','contains',shipString]]
 			});

 			var results = taxSearch.run().getRange({start: 0, end: 1000});
 			log.debug ({
                title: 'Finding Shipping results',
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
 				log.debug ({
	                title: 'item data ',
	                details: 'data: ' + JSON.stringify(itemData)
	            });
	 			for (var i = 0; i < itemData.length; i++) {
	 				var singleItemData = itemData[i];
	 				log.debug ({
		                title: 'add item ',
		                details: 'data: ' + JSON.stringify(singleItemData)
		            });
	 				for (var itemField in singleItemData) {
	 					
						if(singleItemData.hasOwnProperty(itemField)){
							log.debug ({
				                title: 'add sublist ' + subId + itemField,
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
					details:err
				});
 			}
 			
		}
		//set category and price level if empty, default to retail and online price
		function setCustomerDefaults(rec){
			 var category = rec.getValue({
				fieldId: 'category'
			 });
			 var pricelevel = rec.getValue({
				 fieldId:'pricelevel'
			 });

			 if(!category){
				 rec.setValue('category',2);
			 }
			 if(!pricelevel){
				rec.setValue('pricelevel',5);
			 }

			 log.debug ({
				title: 'Customer cat/price',
				details: category + '|' + pricelevel
			});

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
		 //add shipping and billing address to SO
		 function createAddressSO(addressType,addressData,rec){
			try{
				log.debug ({
					title: 'Create Address SO',
					details: addressType
				});

				var addressSubrecord = rec.getSubrecord({
				   fieldId: addressType
			   });
			   
			   for(var addressField in addressData){
				   addressSubrecord.setValue({
					   fieldId: addressField,
					   value: addressData[addressField]
				   })
			   }

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
						if(fldName !== 'recordtype' && fldName !== 'items' && fldName !== 'extraData' && fldName !== 'addressbook' && fldName !== 'shippingaddress' && fldName !== 'billingaddress'){
							rec.setValue(fldName,context[fldName]);
						}
						else if(fldName === 'items'){
							createItem(context[fldName],rec,'item');
						}
						else if(fldName === 'addressbook'){
							createAddress(context[fldName],rec);
						}
						else if(fldName === 'shippingaddress'){
							createAddressSO(fldName,context[fldName],rec);
						}
						else if(fldName === 'billingaddress'){
							
							createAddressSO(fldName,context[fldName],rec);
						}

					}
				}
				var recordId = rec.save();
	            return String(recordId);
 			}
 			catch(err){
 				log.error({
					title:err.name + ' error creating ' + context.recordtype,
					details:err
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
 				var taxcode = getTax(context.order.extraData.taxProvince);
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
	            	//return customerId;
	            }

				context.order.items = getItemIds(context.order.items,taxcode);
				context.order.shippingtaxcode = taxcode;
				context.order.handlingtaxcode = taxcode;
	            //pass in shopify code
	            var shipMethod = getShipping(context.order.shipmethod);
	            if(shipMethod){
	            	context.order.shipmethod = shipMethod;
	            }
	            //set to blank to still create order on NS
	            //if ship method blank on NS then need to create ship method
	            else{
	            	log.debug ({
		                title: 'Shipping Method cannot be found',
		                details: context.order.shipmethod
		            });
	            	context.order.shipmethod = "";
	            	context.order.shippingcost = "";
	            }
	            log.debug ({
	                title: 'New Items',
	                details: context.order.items
	            });

				var recordId = createRecord(context.order,false);
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