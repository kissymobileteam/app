/*
combined files : 

gallery/app/1.9/index

*/
/**
 * @fileoverview 请修改组件描述
 * @author bachi@taobao.com<bachi@taobao.com>
 * @module app
 **/
KISSY.add('gallery/app/1.9/index',function (S, Node,Base) {
		alert(22);
    var EMPTY = '';
    var $ = Node.all;
    /**
     * 请修改组件描述
     * @class App
     * @constructor
     * @extends Base
     */
    function App(comConfig) {
        var self = this;
        //调用父类构造函数
        App.superclass.constructor.call(self, comConfig);
    }
    S.extend(App, Base, /** @lends App.prototype*/{

    }, {ATTRS : /** @lends App*/{

    }});
    return App;
}, {requires:['node', 'base']});




