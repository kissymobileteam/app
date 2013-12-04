
/**
 * @file base.js
 * @brief Slide
 * @author jayli, bachi@taobao.com
 * @version 
 * @date 2013-01-08
 */

/*jshint smarttabs:true,browser:true,devel:true,sub:true,evil:true */

KISSY.add(function(S){

	"use strict";

	// $ is $
	var $ = S.Node.all;

	// BSlide构造器
	// TODO BSlide工厂
	var BSlide = function(){
		
		// TODO 如何传参?
		if (!(this instanceof BSlide)) {
			throw new Error('please use "new Slide()"');
		}

		this.init.apply(this,arguments);
	};

	// 扩充BSlide
	S.augment(BSlide,S.Event.Target,{

		// 构造函数
		init:function(selector,config){

			var self = this;

			if(S.isObject(selector)){
				self.con = selector;
			}else if(/^#/i.test(selector)){
				self.con = S.one(selector);
			}else if(S.one("#"+selector)){
				self.con = S.one("#"+selector);
			}else if(S.one(selector)){
				self.con = S.one(selector);
			}else {
				throw new Error('Slide Container Hooker not found');
			}
			//接受参数
			self.buildParam(config);
			//构建事件中心,YUI3需要另外创建事件中心
			// self.buildEventCenter();
			//构造函数
			self.buildHTML();
			//绑定事件
			self.bindEvent();
			
			self.fixSlideSize();

			return this;
		},

		// offset 1,-1
		setWrapperSize:function(offset){
			var self = this;


			if(S.isUndefined(offset)){
				offset = 0;
			}

			self.pannels = self.con.all('.' + self.contentClass + ' div.' + self.pannelClass);
			self.length = self.pannels.length;

			var reHandleSize = {
				'none':function(){
				},
				'hSlide':function(){
					//统一容器和item的宽高及选中默认值
					var animconRegion = self.animcon.get('region');
					self.animwrap.css({
						'width': (self.length+offset) * animconRegion.width / self.colspan + 'px'
					});
				}

			};

			reHandleSize[self.effect]();

			// 如果传入offset 说明仅仅计算wrapper的宽度
			if(!S.isUndefined(offset)){
				self.relocateCurrentTab();
			}

			return this;
		},

		// 添加一个帧，index为添加到的索引，默认添加到最后
		add: function(node,index){
			var self = this;

			if(S.isUndefined(index) || index > self.length){
				index = self.length;
			}

			if(S.isString(node)){
				node = S.one(node);
			}

			/*
			node.css({
				float:'left'	
			});
			*/

			// bugfix pad/phone中避免闪屏
			/*
			 * pad/phone中容器宽度>=641时，dom上的样式改变会有reflow，小于时，没有reflow
			 * 在phone中会比较平滑，不会有闪屏
			 *
			 */
			if(self.transitions){
				node.css({
					visibility:'hidden'
				});
			}

			if(index == self.length){
				// bugfix，防止在webkit中因为设置了backface属性，导致dom操作渲染延迟，slide操作会有闪烁
				setTimeout(function(){
					self.setWrapperSize(1);
				},0);
				node.insertAfter(self.pannels[index - 1]);
			}else{
				node.insertBefore(self.pannels[index]);
			}

			self.setWrapperSize();

			self.fixSlideSize(self.currentTab);

			// S.log(node.offset().top);

			// bugfix pad/phone中避免闪屏
			if(self.transitions){
				node.css({
					visibility:''
				});
			}

			if(self.transitions){
			}

			return this;

			// TODO 添加面板的时候，没有添加导航
		},
		remove:function(index){
			var self = this;

			if(self.length === 1){
				return;
			}

			// 删除当前帧和之前帧时，currentTab需-1
			if(index <= self.currentTab){
				self.currentTab --;
				self.length --;
			}

			// bugfix,防止移动设备中的闪屏
			if(self.transitions){
				self.con.css({
					// display:'none'
					//TODO 2013-05-14 加上visibility后导航宽度100%无法自适应，浏览器bug?，js问题？
					visibility:'hidden'
				});
			}

			S.one(self.pannels[index]).remove();

			self.setWrapperSize();

			// bugfix,防止移动设备中的闪屏
			if(self.transitions){
				self.con.css({
					display:'block',
					visibility:''
				});
			}

			self.fixSlideSize(self.currentTab);

			// TODO 删除面板的时候，没有删除导航
			return this;
		},
		removeLast:function(){
			var self = this;
			self.remove(self.length - 1);
			return self;
		},

		//渲染textarea中的内容，并放在与之相邻的一个div中，若有脚本，执行其中脚本
		renderLazyData:function(textarea){
			var self = this;
			textarea.css('display','none');
			if(textarea.attr('lazy-data')=='1'){
				return ;
			}
			textarea.attr('lazy-data','1');
			var	id = S.stamp(div),
				html = textarea.html().replace(/&lt;/ig,'<').replace(/&gt;/ig,'>'),
				div = S.Node('<div>'+html+'</div>');
			S.DOM.insertBefore(div,textarea);
			//textarea.insertBefore(div);
			S.execScript(html);
		},
		// 绑定函数 ,YUI3需要重新定义这个绑定函数,KISSY不需要
		/*
		on:function(type,foo){
			var self = this;
			self.EventCenter.subscribe(type,foo);
			return this;
		},
		*/

		// 如果是动画效果，则构建Wrap
		buildWrap: function(){
			var self = this;

			self.animwrap = S.Node('<div style="position:absolute;"></div>');
			self.animwrap.html(self.animcon.html());
			self.animcon.html('');
			self.animcon.append(self.animwrap);
			self.pannels = self.con.all('.' + self.contentClass + ' div.' + self.pannelClass);

			return self;

		},

		// 各种动画效果的初始化行为
		// TODO 应当从BSLide中抽取出来
		doEffectInit: function(){

			var self = this;

			var effectInitFn = {
				'none':function(){

					self.pannels = self.con.all('.' + self.contentClass + ' div.' + self.pannelClass);
					self.pannels.css({
						display:'none'	
					});

					self.pannels.item(self.defaultTab).css({
						'display':'block'	
					});

				},
				'hSlide':function(){
					self.buildWrap();
					//统一容器和item的宽高及选中默认值
					var animconRegion = self.animcon.get('region');
					self.pannels.css({
						'float': 'left',
						'overflow': 'hidden'
					});
					self.animwrap.css({
						'width': self.length * animconRegion.width / self.colspan + 'px',
						'overflow': 'hidden',
						'left': -1 * self.defaultTab * animconRegion.width + 'px'
					});
				}

			};

			effectInitFn[self.effect]();

			return this;

		},
		//构建html结构的全局函数
		buildHTML: function() {
            var self = this;
			var con = self.con;
            self.tabs = con.all('.' + self.navClass + ' '+self.triggerSelector);

            var tmp_pannels = con.all('.' + self.contentClass + ' .' + self.pannelClass);
            self.length = tmp_pannels.size();

			if(!con.one('.'+self.navClass)){
				S.Node('<ul class="'+self.navClass+'" style="display:none"></ul>').appendTo(self.con);
			}

            if (self.tabs.size() === 0) {
                //nav.li没有指定，默认指定1234
                var t_con = con.all('.' + self.navClass);
				var t_str = '';
                for (var i = 0; i < self.length; i++) {
                    var t_str_prefix = '';
                    if (i === 0) {
                        t_str_prefix = self.selectedClass;
                    }
                    t_str += '<li class="' + t_str_prefix + '"><a href="javascript:void(0);">' + (i + 1) + '</a></li>';
                }
                t_con.html(t_str);
            }
            self.tabs = con.all('.' + self.navClass + ' '+self.triggerSelector);
            self.animcon = con.one('.' + self.contentClass);
            self.animwrap = null;

			self.doEffectInit();

			self.fixSlideSize(self.currentTab);
            //添加选中的class
			self.hightlightNav(self.getWrappedIndex(self.currentTab));
            //是否自动播放
            if (self.autoSlide === true) {
                self.play();
            }
            return this;
        },
		getCurrentPannel:function(){
			var self = this;
			return S.one(self.pannels[self.currentTab]);
		},


		// 重新渲染slide内页(pannels)的宽度
		renderWidth:function(){
			var self = this;
			//有可能animcon没有定义宽度
			var width = self.animcon.get('region').width;
			if(self.effect == 'hSlide'){
				width /= self.colspan;
			}
			self.pannels.css({
				width:width + 'px'
			});
			return this;
		},
		
		//重新渲染slide内页(pannels)的高度
		renderHeight :function(){
			var self = this;
			//有可能animcon没有定义高度
			var height = self.animcon.get('region').height;
			self.pannels.css({
				height:height + 'px'
			});
			return this;
		},

		//当当前帧的位置不正确时，重新定位当前帧到正确的位置,无动画
		relocateCurrentTab:function(index){
			var self = this;
			if(S.isUndefined(index)){
				index = self.currentTab;
			}
			if(self.effect != 'hSlide'){
				return;
			}

			if(self.transitions){
				self.animwrap.css({
					'-webkit-transition-duration': '0s',
					'-webkit-transform':'translate3d('+(-1 * index * self.animcon.get('region').width)+'px,0,0)',
					'-webkit-backface-visibility':'hidden'
				});
			}else{
				self.animwrap.css({
					left: -1 * index * self.animcon.get('region').width
					
				});
			}

			self.currentTab = index;
			
			return this;
		},

		//根据配置条件修正控件尺寸
		// 重新渲染slide的尺寸，
		// 根据go到的index索引值渲染当前需要的长度和宽度
		fixSlideSize:function(index){
			var self = this;
			if(self.adaptive_fixed_width){
				self.renderWidth();
			}
			if(self.adaptive_fixed_height){
				self.renderHeight();
			}
			if(self.adaptive_fixed_size){
				self.renderHeight().renderWidth();
			}
			self.resetSlideSize(index);
			return this;
		},

		/**
		 * 隐藏浏览器地址栏
		 * added bydonghan - 2013-04-13
		 * 执行时机：app加载完成后初始化操作、切换应用视图后
		 */
		hideURIbar: function() {
			this.animcon.height('2500px');
			window.scrollTo(0 , 1);
			this.animcon.height(window.innerHeight + 'px');
		},

		/**
		 * 重置动画包裹器尺寸，fixed和auto两种
		 * added by donghan - 2013-04-13
		 */
		setViewSize: function(type) {
			var body = S.one('body') , 
				html = S.one('html') ,
				size = type === 'auto' ? 'auto' : '100%';
			body.css('height' , size);
			html.css('height' , size);
			this.animcon.css('height' , size);
			this.animcon.parent().height(size);
		},
		// timmer 是指的动态监控wrapperCon高度的定时器
		// wrapperCon在很多时候高度是可变的
		// 这时就需要timmer来监听了
		removeHeightTimmer: function(){
			var self = this;
			if(!S.isNull(self.heightTimmer)){
				clearInterval(self.heightTimmer);
				self.heightTimmer = null;
			}
		},
		addHeightTimmer: function(){
			var self = this;
			if(!S.isNull(self.heightTimmer)){
				clearInterval(self.heightTimmer);
				self.heightTimmer = null;
			}

			var resetHeight = function(){
				if(self.effect == 'hSlide'){
					self.animcon.css({
						height:self.pannels.item(self.currentTab).get('region').height+'px'
					});
				}
			};
			self.heightTimmer = setInterval(resetHeight,100);
			resetHeight();
		},

		//在before_switch和windowResize的时候执行，根据spec_width是否指定，来决定是否重置页面中的适配出来的宽度和高度并赋值
		// index是go的目标tab-pannel的索引
		// 这个函数主要针对横向滚动时各个pannel高度不定的情况
		resetSlideSize:function(index){
			var self = this;
			var width,height;
			if(typeof index == 'undefined' || index === null){
				index = self.currentTab;
			}
			// 如果没有开关，或者没有滑动特效，则退出函数
			if(self.effect != 'hSlide' && self.effect != 'vSlide'){
				return;
			}
			//var width = self.spec_width();
			
			if(self.effect == 'hSlide'){
				width = self.adaptive_width ? 
										self.adaptive_width():
										self.animcon.get('region').width;
				height = self.pannels.item(index).get('region').height;

				width /= self.colspan;

				// pannels的高度是不定的，高度是根据内容
				// 来撑开的因此不能设置高度，而宽度则需要设置
				self.pannels.css({
					width:width+'px',
					display:'block'
				});

				self.animcon.css({
					width:width * self.colspan +'px',
					overflow:'hidden'
				});

				if(self.animWrapperAutoHeightSetting){
					self.animcon.css({
						height:height+'px'
						//强制pannel的内容不超过动画容器的范围
					});
				}
			}

			return this;
		},

		// 得到tabnav应当显示的当前index索引，0,1,2,3...
		getWrappedIndex:function(index){
			var self = this,wrappedIndex = 0;

			if(index === 0){
				//debugger;
			}
			if(self.carousel){
				
				if(index < self.colspan){
					wrappedIndex = self.length - self.colspan * 3 + index; 
				} else if(index >= self.length - self.colspan) {
					wrappedIndex = index - (self.length - self.colspan);
				} else {
					wrappedIndex = index - self.colspan;
				}

			}else{
				wrappedIndex = index;
			}
			return wrappedIndex;
		},


		// 绑定默认事件
		bindEvent:function(){
			var self = this;

			// 绑定窗口resize事件 
			S.Event.on(window,'resize',function(e){
				self.fixSlideSize(self.currentTab);
				self.relocateCurrentTab();
			});

			//终端事件触屏事件绑定
			// TODO 触屏设备目前和ie6的降级方案实现一样,目前没实现降级
			// TODO 需要将触屏支持抽离出BSlide
			/*
			if ( 'ontouchstart' in document.documentElement ) {
			}
			*/

			return this;

		},

		// 初始化所有的SubLayer
		// TODO 从BSlide中抽离出来

		/*
		 * SubLayer存放在:
		 *
		 * self {
		 *		sublayers:[
		 *			[],	// 第一帧的sublay数组,可以为空数组
		 *			[], // ...
		 *			[]
		 *		]
		 * }
		 *
		 * */
		
		// 构建BSlide全局参数列表
		buildParam:function(o){

			var self = this;

			if(o === undefined || o === null){
				o = {};
			}

			function setParam(def, key){
				var v = o[key];
				// null 是占位符
				self[key] = (v === undefined || v === null) ? def : v;
			}

			S.each({
				autoSlide:		false,
				speed:			500,//ms
				timeout:		3000,
				effect:			'none',
				eventType:		'click',
				easing:			'easeBoth',
				hoverStop:		true,
				selectedClass:	'selected',
				conClass:		't-slide',
				navClass:		'tab-nav',
				triggerSelector:'li',
				contentClass:	'tab-content',
				pannelClass:	'tab-pannel',
				// before_switch:	new Function,
				carousel:		false,
				reverse:		false,
				touchmove:		false,
				adaptive_fixed_width:false,
				adaptive_fixed_height:false,
				adaptive_fixed_size:false,
				adaptive_width:	false,
				adaptive_height:false,
				defaultTab:		0,
				layerSlide:		false,
				layerClass:		'tab-animlayer',
				colspan:		1,
				animWrapperAutoHeightSetting:true,// beforeSwitch不修改wrappercon 宽高
				webkitOptimize	:true
				
			},setParam);

			S.mix(self,{
				tabs:			[],
				animcon:		null,
				pannels:		[],
				timmer:			null,
				touching:		false
			});

			self.speed = self.speed / 1000;

			if(self.defaultTab !== 0){
				self.defaultTab = Number(self.defaultTab) - 1; // 默认隐藏所有pannel
			}

			self.currentTab = self.defaultTab;//0,1,2,3...

			//判断是否开启了内置动画
			self.transitions = ( "webkitTransition" in document.body.style && self.webkitOptimize );

            return self;
		},
		//针对移动终端的跑马灯的hack
		//index 移动第几个,0,1,2,3
		fix_for_transition_when_carousel: function(index){
		},

		// 是否在做动画过程中
		isAming : function(){
			var self = this;
			if(self.anim){
				return self.anim.isRunning();
			} else {
				return false;
			}
		},

		//上一个
		previous:function(callback){
			var self = this;
			//防止旋转木马状态下切换过快带来的晃眼
			try{
				if(self.isAming() && self.carousel){
					return this;
				}
			}catch(e){}
			var _index = self.currentTab+self.length-1 - (self.colspan - 1);
			if(_index >= (self.length - self.colspan + 1)){
				_index = _index % (self.length - self.colspan + 1);
			}

			if(self.carousel){

				if(self.is_first()){
					self.fix_pre_carousel();
					self.previous.call(self);
					// arguments.callee.call(self);
					return this;
				}
			}
			self.go(_index,callback);
			return this;
		},
		//判断当前tab是否是最后一个
		is_last:function(){
			var self = this;
			if(self.currentTab == (self.length - (self.colspan - 1) - 1)){
				return true;
			}else{
				return false;
			}
		},
		//判断当前tab是否是第一个
		is_first:function(){
			var self = this;
			if(self.currentTab === 0){
				return true;
			}else{
				return false;
			}
		},
		//下一个
		next:function(callback){
			var self = this;
			//防止旋转木马状态下切换过快带来的晃眼
			try{
				if(self.isAming() && self.carousel){
					return this;
				}
			}catch(e){}
			var _index = self.currentTab+1;
			if(_index >= (self.length - self.colspan + 1)){
				_index = _index % (self.length - self.colspan + 1);
			}
			if(self.carousel){

				if(self.is_last()){
					self.fix_next_carousel();
					self.next.call(self);
					// arguments.callee.call(self);
					return this;

				}

			}
			self.go(_index,callback);
			return this;
		},
		// 修正跑马灯结尾的滚动位置
		fix_next_carousel:function(){
		},

		// 修正跑马灯开始的滚动位置
		fix_pre_carousel:function(){
		},
		//高亮显示第index(0,1,2,3...)个nav
		hightlightNav:function(index){
		},
		//切换至index,这里的index为真实的索引
		switch_to:function(index,callback){
			var self = this;
			//首先高亮显示tab


			var afterSwitch = function(){
				if(S.isFunction(callback)){
					callback.call(self,self);
				}
				self.fire('afterSwitch',{
					index: self.currentTab,
					navnode: self.tabs.item(self.getWrappedIndex(self.currentTab)),
					pannelnode: self.pannels.item(self.currentTab)
				});
			};
			

			self.fire('beforeTailSwitch',{
                index: self.currentTab,
                navnode: self.tabs.item(self.getWrappedIndex(self.currentTab)),
                pannelnode: self.pannels.item(self.currentTab)
			});

			self.hightlightNav(self.getWrappedIndex(index));
			self.fixSlideSize(index);
			if(self.autoSlide){
				self.stop().play();
			}
            if (index >= self.length) {
                index = index % self.length;
            }
            if (index == self.currentTab) {
                return this;
            }

			if (self.anim) {
				try {
					self.anim.stop();
					//fix IE6下内存泄露的问题，仅支持3.2.0及3.3.0,3.1.0及3.0.0需修改Y.Anim的代码
					//modified by huya
					// self.anim.destroy();
					self.anim = null;
				} catch (e) {}
			}

			// TODO 帧切换动画的实现应当从Bslide中抽离出来
			var animFn = {
				'none':function(index){

					self.pannels.css({
						'display':'none'	
					});

					self.pannels.item(index).css({
						'display':'block'	
					});

					afterSwitch();

				},
				'hSlide':function(index){

					if(self.transitions){
						self.animwrap.css({
							'-webkit-transition-duration': self.speed + 's',
							'-webkit-transform':'translate3d('+(-1 * index * self.animcon.get('region').width / self.colspan)+'px,0,0)',
							'-webkit-backface-visibility':'hidden'
						});
						self.anim = S.Anim(self.animwrap,{
							opacity:1
						},self.speed,self.easing,function(){
							afterSwitch();
						});
						self.anim.run();
					}else{

						self.anim = S.Anim(self.animwrap,{
							left: -1 * index * self.animcon.get('region').width / self.colspan
						},self.speed,self.easing,function(){
							afterSwitch();
						});

						self.anim.run();
					}

				}

			};

			animFn[self.effect](index);

            self.currentTab = index;

			// TODO，讨论switch的发生时机
            self.fire('switch', {
                index: index,
                navnode: self.tabs.item(self.getWrappedIndex(index)),
                pannelnode: self.pannels.item(index)
            });

			//延迟执行的脚本
			var scriptsArea = self.pannels.item(index).all('.data-lazyload');
			if(scriptsArea){
				scriptsArea.each(function(node,i){
					self.renderLazyData(node);
				});
			}
		},
		//去往任意一个,0,1,2,3...
		"go":function(index,callback){
			var self = this;

            var goon = self.fire('beforeSwitch', {
				index:index,
				navnode:self.tabs.item(index),
				pannelnode:self.pannels.item(index)
            });

			if(goon !== false){
				//发生go的时候首先判断是否需要整理空间的长宽尺寸
				//self.renderSize(index);

				if(index + self.colspan > self.pannels.size()){
					index = self.pannels.size() - self.colspan;
				}
				self.switch_to(index,callback);
			}

			// TODO 讨论afterSwitch的发生时机
			/*
            self.fire('afterSwitch', {
                index: index,
                navnode: self.tabs.item(self.getWrappedIndex(index)),
                pannelnode: self.pannels.item(index)
            });
			*/

			return this;

		},
		//自动播放
		play:function(){
			var self = this;
			if(self.timer !== null){
				clearTimeout(self.timer);
			}
			self.timer = setTimeout(function(){
				self.next().play();
			},Number(self.timeout));
			return this;
		},
		//停止自动播放
		stop:function(){
			var self = this;
			clearTimeout(self.timer);
			self.timer = null;
			return this;
		}
	});

	return BSlide;

},{
	requires:['node','event','json','./util','./kissy2yui']	
});

