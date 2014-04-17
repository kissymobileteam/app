/*jshint browser:true,devel:true */

KISSY.add(function(S){

	// "use strict";

	// KISSY 2 YUI3
	S.augment(S.Node,{

		size:function(){
			return this.length;
		},

		get : function(k){
			var self = this;
			var o = {
				'region':function(){
					return {
						'height':self.height(),
						'width':self.width()
					};
				}

			};
			if(k in o){
				return o[k]();
			}
		},

	});

},{
	requires:['node','event']
});
