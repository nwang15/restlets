/**
 *@NApiVersion 2.0
 *@NScriptType RESTlet
 */

 define([],function(){
 	function getRequest(){
 		try{
 			log.debug ({
                title: 'Before return',
                details: 'before return'
            });
 			return 'yup'
 		}
 		catch(err){
 			log.error({
				title:err.name,
				details:err.message
			});
 		}
 		
 	}
 	return{
 		get:getRequest
 	}
 })