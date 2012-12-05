// JavaScript Document
(function($) {
	
	$.zoomrow = {};
	
	$.zoomrow.constants = {
		IMAGE:'image',
		LOADINGMSG:'Cargando recurso: ',
		ERRORMSG:'Error al cargar : ',
		ERRORTIMEOUTMSG:'Descartado por TIMEOUT',
	}
	
	$.zoomrow.settings = {
		timeout:1000,
		items:[],
		onComplete:function(){},
		onCompleteItem:function(){},
		loadMessage:$.zoomrow.constants.LOADINGMSG,
		errorMessage:$.zoomrow.constants.ERRORMSG,
		sizeResource:false,
		target:$('body'),
		templateSection: "<section><header><h3>${title}</h3></header><article><div class='content' style='display:none;'></div></article><footer style='display:none;'></footer></section>",
		templateListImages: "<div class='zoomrow-reel'><ul class='zoomrow-images'>{{each data}}<li class='zoomrow-img'><div><span class='loading-white zoomrow-loading'/></div></li>{{/each}}</ul></div>",
		templateImage: "{{if status === 'success'}}<img src='${file.src}' name='' class='zoomrow-image zoomrow-blind' alt='${file.name}' srchd='${file.srchd}'/>{{else}} <span class='zoomrow-notFound'/> {{/if}}"
	}
	
	$.zoomrow.package = {
		file:function(){
			this.type='';
			this.src='';
			this.data='';
			this.order='';
			return {type:this.type,src:this.src,data:this.data};
		},
		responseObject:function(){
			this.errorFiles = [];
			this.successFiles = [];
			return true;
		}
	}
	$.zoomrow.private = {
		settings:{
			_countItemsOrder:0,
			_regExpExtensionImg: /\.(png|jpg|gif)/i,
			_flag:null,
			_finalQueue:[],
			_section:null
		},
		constants:{
			HEAD:'head',
			TIMEOUT:'timeout',
			SUCCESS:'success',
			ERROR:'error',
			COMPLETE: 'complete'
		}
	}
	
	$.zoomrow.methods = {
		init : function(options) {
			
			$.extend($.zoomrow.settings, options);
			$.zoomrow.private.settings._countItemsOrder = 0;
			$.zoomrow.private.settings._finalQueue = [];
			$.zoomrow.private.settings._section = null;

			$.zoomrow.private.settings._flag = $.zoomrow.methods.createFlag();


			if(typeof $.zoomrow.settings.items === 'object'){
				
				$.zoomrow.methods.createInterface($.zoomrow.settings.items);
			}
			
		},
		createInterface:function(elements){

			$.template( "imagesListTemplate", $.zoomrow.settings.templateListImages);
			$.template( "templateSection", $.zoomrow.settings.templateSection);


			var data = {data:elements.pics.thumbs};
			var sectionHTML= $.zoomrow.private.settings._section = $.tmpl('templateSection',{title:''});
			var responseHTML = $.tmpl('imagesListTemplate',data);
			
			$('article',sectionHTML).append(responseHTML);
			$('article div.content',sectionHTML).append('<p></p>');

			sectionHTML.appendTo($.zoomrow.settings.target);
			$.zoomrow.methods.loadQueue();
		},
		loadQueue:function(section){
			var inOrder = $.zoomrow.settings.inOrderLoad;
			var limit = $.zoomrow.settings.items.pics.thumbs.length;
			var element = {thumb:$.zoomrow.settings.items.pics.thumbs[$.zoomrow.private.settings._countItemsOrder], fullsize:$.zoomrow.settings.items.pics.fullSize[$.zoomrow.private.settings._countItemsOrder]};
			var order = '';
			
			$.zoomrow.private.settings._countItemsOrder++;
			
			if( $.zoomrow.private.settings._countItemsOrder <= limit){
				$.zoomrow.methods.validateType(element,'');
			}else{
				$.zoomrow.methods.complete();
			}
			
		},
		createFlag:function(){
			if(!$.zoomrow.settings.flag){
				$('body').append('<div class="flag" id="flag"></div>');
				$.zoomrow.settings.flag = '#flag';
			}
			
			return $($.zoomrow.settings.flag);
		},
		validateType:function(value,size){

				var type = null;
				if($.zoomrow.private.settings._regExpExtensionImg.test(value.thumb)){
					type = $.zoomrow.constants.IMAGE;
				}else{
					type = $.zoomrow.constants.UNKNOWN;
				}
				
				switch(type){
					case $.zoomrow.constants.IMAGE:
						$.zoomrow.methods.loadImage(value,size);
						break;
					case $.zoomrow.constants.UNKNOWN:
						//console.log($.preloader.constants.UNKNOWN);
						$.zoomrow.methods.dispatchEventPreload();
						break;
				}
				
				return type;
		},
		loadImage:function(value,size){
			var idresource = 'resource-'+$.zoomrow.private.settings._countItemsOrder;
			$.zoomrow.private.settings._flag.append('<span class="loading" id="'+idresource+'">'+$.zoomrow.settings.loadMessage + ': '+value.thumb+' : '+size+'<br></span>');
			//console.log('loadImage');
			var counter = $.zoomrow.private.settings._countItemsOrder;
			var flag = $('#resource-'+counter);
			
			var newImage =  new Image();
			$(newImage).attr('src', value.thumb);
			$(newImage).attr('id', 'pr-'+counter);
			$(newImage).attr('idresource', idresource);
			
			var file = new $.zoomrow.package.file();
			file.type = $.zoomrow.constants.IMAGE;
			file.src = newImage.src;
			file.srchd = value.fullsize;
			file.data = $(newImage)
			file.order = counter;
			
			$(newImage).load(function(params){
				$.zoomrow.methods.completeItem(file,$.zoomrow.private.constants.SUCCESS);
				var flag = $(this).attr('idresource');
				$('#'+flag).remove();
			});
			$(newImage).error(function(){
				$.zoomrow.methods.rewriteFlag(flag);
				$.zoomrow.methods.completeItem(file,$.zoomrow.private.constants.ERROR);
			});
			
		},
		loadFullSizeImage:function(h, src, target){
			
			if(!target.hasClass('added-zoom-image')){

				var newImage =  new Image();
				$(newImage).attr('src', src);
				$(newImage).addClass('zoomrow-zoom');
				$(newImage).attr('height',h);

				target.addClass('added-zoom-image');

				$(newImage).load(function(params){
					return $(newImage).appendTo(target);
				});
			}else{
				$('[src="'+src+'"]').fadeIn();
			}
			
		},
		completeItem:function(file,status){
			$.zoomrow.private.settings._finalQueue.push({file:file, status:status});
			$.zoomrow.methods.loadQueue();
		},
		complete:function(){
			var section = $.zoomrow.private.settings._section;
			$.template( "image", $.zoomrow.settings.templateImage);
			$('.zoomrow-img div',section).each(function(index, value){
				var responseHTML = $.tmpl('image',$.zoomrow.private.settings._finalQueue[index]);
				var _this = $(this);

				//responseHTML.addClass('zoomrow-blind');
				_this.append(responseHTML);

				$('img',_this).animate({opacity:1});
				$('.zoomrow-loading',_this).remove();
			})
		
			$.zoomrow.methods.setDraggableStatus(section);
			
			section.bind('click',function(){
				var seccThis = $(this);
				$('ul',seccThis).css('width','auto');
				seccThis.animate({left:'0px'},1000, function(){});
				if(!seccThis.hasClass('zoom-finished')){
					seccThis.find('.zoomrow-reel img').animate({height:'370px'}, 1000, function() {
				    	var __this = $(this);
				    	var srchd = __this.attr('srchd');
				    	seccThis.addClass('zoom-finished');
				    	$.zoomrow.methods.setDraggableStatus(seccThis);
				    	$.zoomrow.methods.loadFullSizeImage(seccThis.height(),srchd, __this.parent());
				    	
				  	});
				}else{
					seccThis.find('.zoomrow-reel img').animate({height:'98px'}, 1000, function() {
						var __this = $(this);
				    	seccThis.removeClass('zoom-finished');
				    	$.zoomrow.methods.setDraggableStatus(seccThis);
				    	$('.zoomrow-zoom',__this.parent()).fadeOut();
				  	});
				}
				
			})

			$.zoomrow.settings.items = [];
			$.zoomrow.settings.onComplete();

		},
		setDraggableStatus:function(section){
			var widthPanel = 0;
			$('li',section).each(function(i,val){
				widthPanel = widthPanel + $(val).width();
			});

			var wLimit = parseInt(widthPanel - $($.zoomrow.settings.target).width()) * (-1);

			section.draggable({ axis: "x", drag: function( event, ui ) {
				if(ui.position.left > 0){
					ui.position.left = 0;
				}else if(ui.position.left < wLimit){
					ui.position.left = wLimit;
				};
			} });

			$('ul',section).width(widthPanel);
		}
	};
	
	$.zrow = $.fn.zrow = function(method) {
		if(typeof method != 'object' && method) {
			return $.zoomrow.methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if( typeof method === 'object' || !method || method == undefined) {
			return $.zoomrow.methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.tooltip');
		}
	};
})(jQuery);