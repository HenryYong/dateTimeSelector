/**
 * Created By Henry Yang @ 2017/04/25
 * MIT License
 */

(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : (global.dataSelector = factory());
})(this, function() {
    /**
     *  convert String to DOM Node
     *  @param html {String} string template
     *  @return fragment {Fragment} DOM Node
     */
    this.compile = function(html) {
        var temp = document.createElement('div'),
            children = null,
            fragment = document.createDocumentFragment();

        temp.innerHTML = html;
        children = temp.childNodes;

        for(var i = 0, length = children.length; i < length; i++) {
            fragment.appendChild(children[i].cloneNode(true));
        }

        return fragment;
    }

    /**
     *  return el whether is an DOM element
     *  @param el {Object} element
     *  @return {Boolean}
     */
    var _isElement = function(el) {
        if(typeof HTMLElement === 'object') {
            return el instanceof HTMLElement;
        }else{
            return el && typeof el === 'object' && el.nodeType === 1 && typeof el.nodeName === 'string';
        }
    }

    /**
     *  add event listener on specific element
     *  @param element {DOM} css selector or DOM Node
     *  @param type {String} event type
     *  @param children {DOM} css selector or DOM Node
     *  @param handler {Function} binding callback function
     */
    this.EventUtil = {
        add: function(element, type, handler) {
            if(!_isElement(element)) {  // css selector is passed
                element = Array.prototype.slice.call(document.querySelectorAll(element), 0);
            }

            type = type.split(' ');

            type.forEach(function(_type, index) {
                if(element instanceof Array) {
                    element.forEach(function(item, index) {
                        item.addEventListener(_type, handler, false);
                    });
                }
                else {
                    element.addEventListener(type, handler, false);
                }
            });
        }
    }
});
