/**
 *  Created By Henry Yang @ 2017/04/24
 *  MIT License
 */

'use strict';

(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : (global.dateTimeSelector = factory());
})(this, (function() {
    /**
     *  string is match the regular expression or not
     *  @param str {String} time string
     */
    var _isFormatted = function(str) {
        var s = str.toString(),
            simpleTimeReg = /^(\d{1,2}:\d{1,2}:\d{1,2})$/,
            combinedTimeReg = /^(\d{1,2}:\d{1,2}:\d{1,2})\-(\d{1,2}:\d{1,2}:\d{1,2})$/;

        if(!simpleTimeReg.test(s) && !combinedTimeReg.test(s)) {
            return false;
        }

        return true;
    }

    /**
     *  add zero if the number is less than 10
     *  @param num {Number} unformatted number
     *  @return f_num {String} formatted number
     */
    var _prezero = function(num) {
        var f_num = Number(num);

        if(f_num != 0 && !f_num) {return;}

        if(f_num < 10) {
            return '0' + f_num;
        }
        else {
            return f_num.toString();
        }
    }

    /**
     *  get time
     */
    var _getTime = function(type, str) {
        if(!str) {
            var date = new Date(),
                defaultTime = {
                    "hour": _prezero(date.getHours()),
                    "minute": _prezero(date.getMinutes()),
                    "second": _prezero(date.getSeconds())
                };

            if(type == 'simple') {
                return defaultTime;
            }
            else if(type == 'range') {
                return {
                    "start": defaultTime,
                    "end": defaultTime
                }
            }
        }
        else {
            var temp;

            if(type == 'simple') {
                temp = str.split(':');

                return {
                    "hour": _prezero(temp[0]),
                    "minute": _prezero(temp[1]),
                    "second": _prezero(temp[2])
                }
            }
            else if(type == 'range') {
                var start, end, startArr, endArr;

                temp = str.split('-');
                start = temp[0];
                startArr = start.split(':');
                end = temp[1];
                endArr = end.split(':');

                return {
                    "start": {
                        "hour": _prezero(startArr[0]),
                        "minute": _prezero(startArr[1]),
                        "second": _prezero(startArr[2])
                    },
                    "end": {
                        "hour": _prezero(endArr[0]),
                        "minute": _prezero(endArr[1]),
                        "second": _prezero(endArr[2])
                    }
                }
            }
        }
    }

    /**
     *  format time
     *  @param obj {Object} object contains time info
     *  @param str {String} formatted time string
     */
    var _jointTime = function(obj) {
        var str = '',
            start, end;

        if(!obj.start && !obj.end) {        // only one time object
            str += obj.hour + ':' + obj.minute + ':' + obj.second;
        }
        else {
            start = obj.start;
            end = obj.end;

            str += start.hour + ':' + start.minute + ':' +start.second + '-' + end.hour + ':' + end.minute + ':' +end.second;
        }

        return str;
    }

    /**
     *  whether the number of time is valid
     *  @param num {Number} number of time
     *  @param pos {String} hour / minute / second
     *  @return valid {Boolean} valid or not
     */
    var _isValid = function(num, pos) {
        var num = Number(num);

        if(num < 0) {
            return false;
        }

        if(pos == 'hour' && num >= 24) {
            return false;
        }

        if((pos == 'minute' || pos == 'second') && num >= 60) {
            return false;
        }

        return true;
    }

    /**
     *  construct function
     */
    function dateTimeSelector(options) {
        var opts = options || {};

        // _this = this;
        this.$el = document.querySelector(opts.el || '[data-id="datetime-selector"]');   // hidden input
        this.type = opts.type || 't-basic';   // type of plugin
        this.time = opts.time || '';        // user set time
        this.onScroll = opts.onScroll || function() {};     // scroll callback
        this.onChange = opts.onChange || function() {};     // select callback
        this.onCancel = opts.onCancel || function() {};     // cancel callback

        this._timeObj = {};             // cache time by object
        this._timeStr = '';             // cache time by string

        this.$root = null;
        this.$wrapper = null;
        this.$items = null;
        this.$scroller = null;
        this.$clock = null;

        _init.call(this);
    }

    /**
     *  initialize the plugin
     */
    var _init = function() {
        _initObject.call(this);
        _initStyle.call(this);
        _initEvents.call(this);
    }

    /**
     * initialize time object
     */
    var _initObject = function() {
        switch(this.type) {
            case 't-basic':
            case 't-simple':
                var time = _getTime('simple', this.time);

                this._timeObj = {
                    "hour": time.hour,
                    "minute": time.minute,
                    "second": time.second
                }
                break;
            case 't-range':
            case 't-combined':
                var rangeTime = _getTime('range', this.time),
                    start = rangeTime.start,
                    end = rangeTime.end;

                this._timeObj = {
                    "start": {
                        "hour": start.hour,
                        "minute": start.minute,
                        "second": start.second
                    },
                    "end": {
                        "hour": end.hour,
                        "minute": end.minute,
                        "second": end.second
                    }
                }
        }

        this._timeStr = _jointTime(this._timeObj);
    }

    /**
     *  initialize style
     */
    var _initStyle = function() {
        var $hiddenInput = this.$el.cloneNode(true),
            type = this.type;

        $hiddenInput.className += 'hidden';

        var html = '<div class="datetime-selector ' + type + '">' + $hiddenInput.outerHTML,
            hourDOM = '<ul class="dts-scrollers-list dts-scroller-hour" data-type="hour"><li></li>',
            minuteDOM = '<ul class="dts-scrollers-list dts-scroller-minute" data-type="minute"><li></li>',
            secondDOM = '<ul class="dts-scrollers-list dts-scroller-second" data-type="second"><li></li>',
            seperator = '',
            fragment, children, i, curValue;

        if(type !== 't-basic') {
            for(i = 0; i < 60; i++) {
                curValue = _prezero(i);

                if(i < 24) {
                    hourDOM += '<li value="' + curValue + '">' + curValue + '</li>';
                }

                minuteDOM += '<li value="' + curValue + '">' + curValue + '</li>';
                secondDOM += '<li value="' + curValue + '">' + curValue + '</li>';
            }

            hourDOM += '<li></li></ul>',
            minuteDOM += '<li></li></ul>',
            secondDOM += '<li></li></ul>',

            seperator = '<div class="dts-scrollers-seperators dts-scrollers-item">'+
                            '<ul class="dts-scrollers-seperator">'+
                                '<li>:</li>'+
                                '<li class="active">:</li>'+
                                '<li>:</li>'+
                            '</ul>'+
                        '</div>';
        }

        switch(type) {
            case 't-basic':
                html += '<div class="datetime-selector-wrapper">'+
                            '<div class="datetime-selector-item">'+
                                '<input type="text" class="datetime-selector-input time-basic-input time-basic-hour" data-input="hour" value="' + this._timeObj.hour + '">'+
                                '<div class="datetime-selector-tools" data-value="hour">'+
                                    '<i class="datetime-selector-add" data-type="add"></i>'+
                                    '<i class="datetime-selector-minus" data-type="minus"></i>'+
                                '</div>'+
                            '</div>'+
                            '<div class="datetime-selector-item">'+
                                '<input type="text" class="datetime-selector-input time-basic-input time-basic-minute" data-input="minute" value="' + this._timeObj.minute + '">'+
                                '<div class="datetime-selector-tools" data-value="minute">'+
                                    '<i class="datetime-selector-add" data-type="add"></i>'+
                                    '<i class="datetime-selector-minus" data-type="minus"></i>'+
                                '</div>'+
                            '</div>'+
                            '<div class="datetime-selector-item">'+
                                '<input type="text" class="datetime-selector-input time-basic-input time-basic-second" data-input="second" value="' + this._timeObj.second + '">'+
                                '<div class="datetime-selector-tools" data-value="second">'+
                                    '<i class="datetime-selector-add" data-type="add"></i>'+
                                    '<i class="datetime-selector-minus" data-type="minus"></i>'+
                                '</div>'+
                            '</div>'+
                        '</div>';
                break;
            case 't-simple':
                html += '<div class="datetime-selector-wrapper">'+
                            '<div class="datetime-selector-item">'+
                                '<input type="text" class="datetime-selector-input time-simple-input" data-input="t-simple" readonly value="'+this._timeStr+'">'+
                                '<div class="datetime-selector-tools" data-type="clock">'+
                                    '<i class="datetime-selector-clock iconfont icon-clock"></i>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                        '<div class="datetime-selector-scrollers hidden" data-type="scroller">'+
                            '<div class="dts-scrollers-body">'+
                                '<div class="dts-scrollers-wrapper">'+
                                    '<div class="dts-scrollers-item dts-scrollers-time">'+
                                        hourDOM+
                                    '</div>'+
                                    seperator+
                                    '<div class="dts-scrollers-item dts-scrollers-time">'+
                                        minuteDOM+
                                    '</div>'+
                                    seperator+
                                    '<div class="dts-scrollers-item dts-scrollers-time">'+
                                        secondDOM+
                                    '</div>'+
                                    '<div class="dts-scrollers-mask"></div>'+
                                '</div>'+
                            '</div>'+
                        '</div>';
                break;
            case 't-range':
                html += '<div class="datetime-selector-wrapper">'+
                            '<div class="datetime-selector-item">'+
                                '<input type="text" class="datetime-selector-input time-range-input" data-input="start" readonly value="'+this._timeStr.split('-')[0]+'">'+
                                '<div class="datetime-selector-tools" data-type="clock" data-time="start">'+
                                    '<i class="datetime-selector-clock iconfont icon-clock"></i>'+
                                '</div>'+
                            '</div>'+
                            '<div class="datetime-selector-item">'+
                                '<input type="text" class="datetime-selector-input time-range-input" data-input="end" readonly value="'+this._timeStr.split('-')[1]+'">'+
                                '<div class="datetime-selector-tools" data-type="clock" data-time="end">'+
                                    '<i class="datetime-selector-clock iconfont icon-clock"></i>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                        '<div class="datetime-selector-scrollers hidden" data-type="scroller" style="width: 49%;">'+
                            '<div class="dts-scrollers-body">'+
                                '<div class="dts-scrollers-wrapper">'+
                                    '<div class="dts-scrollers-item dts-scrollers-time">'+
                                        hourDOM+
                                    '</div>'+
                                    seperator+
                                    '<div class="dts-scrollers-item dts-scrollers-time">'+
                                        minuteDOM+
                                    '</div>'+
                                    seperator+
                                    '<div class="dts-scrollers-item dts-scrollers-time">'+
                                        secondDOM+
                                    '</div>'+
                                    '<div class="dts-scrollers-mask"></div>'+
                                '</div>'+
                            '</div>'+
                        '</div>';
                break;
            case 't-combined':
                html += '<div class="datetime-selector-wrapper">'+
                            '<div class="datetime-selector-item">'+
                                '<input type="text" class="datetime-selector-input time-combined-input" data-input="t-combined" readonly value="'+this._timeStr+'">'+
                                '<div class="datetime-selector-tools" data-type="clock">'+
                                    '<i class="datetime-selector-clock iconfont icon-clock"></i>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                        '<div class="datetime-selector-scrollers hidden dts-scrollers-combined" data-type="scroller">'+
                            '<div class="dts-scrollers-header">'+
                                '<div class="dts-scrollers-header-item">开始时间</div>'+
                                '<div class="dts-scrollers-header-item">结束时间</div>'+
                            '</div>'+
                            '<div class="dts-scrollers-body">'+
                                '<div class="dts-scrollers-wrapper" data-type="start">'+
                                    '<div class="dts-scrollers-item dts-scrollers-time">'+
                                        hourDOM+
                                    '</div>'+
                                    seperator+
                                    '<div class="dts-scrollers-item dts-scrollers-time">'+
                                        minuteDOM+
                                    '</div>'+
                                    seperator+
                                    '<div class="dts-scrollers-item dts-scrollers-time">'+
                                        secondDOM+
                                    '</div>'+
                                    '<div class="dts-scrollers-mask"></div>'+
                                '</div>'+
                                '<div class="dts-scrollers-wrapper" data-type="end">'+
                                    '<div class="dts-scrollers-item dts-scrollers-time">'+
                                        hourDOM+
                                    '</div>'+
                                    seperator+
                                    '<div class="dts-scrollers-item dts-scrollers-time">'+
                                        minuteDOM+
                                    '</div>'+
                                    seperator+
                                    '<div class="dts-scrollers-item dts-scrollers-time">'+
                                        secondDOM+
                                    '</div>'+
                                    '<div class="dts-scrollers-mask"></div>'+
                                '</div>'+
                            '</div>'+
                        '</div>';
                break;
        }

        html += '</div>';
        fragment = compile(html);

        this.$el.parentNode.insertBefore(fragment, this.$el);
        this.$root = this.$el.previousSibling;
        children = this.$root.childNodes;
        this.$el = children[0];
        this.$wrapper = children[1];
        this.$items = this.$wrapper.childNodes;
        this.$clock = Array.prototype.slice.call(this.$wrapper.querySelectorAll('[data-type="clock"]'), 0);
        this.$root.parentNode.removeChild(this.$root.nextSibling);
        this.$el.value = this._timeStr;

        if(type != 't-basic') {
            this.$scroller = this.$wrapper.nextSibling;
        }
    }

    /**
     *  initialize event binding
     */
    var _initEvents = function() {
        var _this = this;

        switch(this.type) {
            case 't-basic':
                function __modifyTime(e, operation) {
                    var $this = event.target,
                        type = $this.parentNode.getAttribute('data-value'),
                        next = operation == 'add' ? Number(this._timeObj[type]) + 1 : Number(this._timeObj[type]) - 1;

                    if(_isValid(next, type)) {
                        this._timeObj[type] = next;
                        _updateTimeObj.call(this, this._timeObj[type], type);
                    }
                }

                // add time
                EventUtil.add('[data-type="add"]', 'click', function(event) {
                    __modifyTime.call(_this, event, 'add');
                });

                // minus time
                EventUtil.add('[data-type="minus"]', 'click', function(event) {
                    __modifyTime.call(_this, event, 'minus');
                });

                function __spliceNum(num) {
                    var temp = num.split('');
                    temp.splice(num.length - 1, 1);
                    return temp.join('');
                }

                Array.prototype.forEach.call(this.$items, function(item, index) {
                    var input = item.querySelector('input[data-input]');

                    // handle input when type is 't-basic'
                    EventUtil.add(input, 'input', function(event) {
                        var value = this.value.charAt(this.value.length - 1),
                            type = this.getAttribute('data-input'),
                            reg = /^\d$/,
                            isValid = undefined,
                            length = this.value.length;

                        if(!reg.test(value)) {
                            this.value = __spliceNum(this.value);
                            return;
                        }
                        else {
                            isValid = _isValid(this.value, type);

                            if(isValid) {
                                this.value = _prezero(this.value);
                            }
                            else {
                                this.value = __spliceNum(this.value);
                            }
                        }
                    });
                });
                break;
            case 't-simple':
            case 't-range':
            case 't-combined':
                var ua = ~navigator.userAgent.indexOf('Firefox'),
                    _wheelType = ua ? 'detail' : 'wheelDelta',
                    ExpTpl = /translateY\((\-{0,}\d{0,})px\)/;

                // common scroll callback function
                function __scroller(e, sType) {
                    e.preventDefault();

                    var direction = '',
                        delta = e[_wheelType],
                        target = e.target,
                        ul = target.parentNode,
                        style = getComputedStyle(target),
                        height = Number(style.height.replace('px', '')),
                        translateY = ul.style.transform.match(ExpTpl),
                        translateY_value = translateY.length ? Number(translateY[1]) : '',
                        children = ul.childNodes,
                        childrenCount = children.length,
                        limit = height * (childrenCount - 3) * -1,
                        count = Math.abs(translateY_value / height) + 1,
                        new_translateY_value, new_count;

                    // unify direction
                    if(ua) {
                        direction = delta > 0 ? 'down' : 'up';
                    }
                    else {
                        direction = delta > 0 ? 'up' : 'down';
                    }

                    // control the scroller within limitation
                    if(direction == 'down') {
                        if(translateY_value > limit) {
                            new_translateY_value = translateY_value - height;
                            new_count = count + 1;
                        }
                        else {
                            return;
                        }
                    }
                    else {
                        if(translateY_value < 0) {
                            new_translateY_value = translateY_value + height;
                            new_count = count - 1;
                        }
                        else {
                            return;
                        }
                    }

                    ul.style.transform = 'translateY(' + new_translateY_value + 'px)';
                    children[count].className = children[count].className.replace('active', '');
                    children[new_count].className += 'active';

                    this.onScroll && this.onScroll(ul);
                }

                // scroll event
                Array.prototype.forEach.call(this.$scroller.querySelectorAll('ul[data-type]'), function(item, index) {
                    var scrollerType = item.getAttribute('data-type');

                    if(ua) {
                        EventUtil.add(item, 'DOMMouseScroll', function(e) {
                            __scroller.call(_this, e, scrollerType);
                        });
                    }
                    else{
                        item.onmousewheel = function(e) {
                            __scroller.call(_this, e, scrollerType);
                        }
                    }
                });

                // click on scroller or mask
                EventUtil.add(this.$scroller, 'click', function(e) {
                    var target = e.target,
                        type = target.getAttribute('data-type') ? 'mask' : 'item',
                        tempTime = {},
                        tempStart = {},
                        tempEnd = {},
                        activeItems, timeType, value;

                    if(type == 'item') {
                        activeItems = Array.prototype.slice.call(_this.$scroller.querySelectorAll('li.active'), 0);

                        activeItems.forEach(function(item, index) {
                            value = item.getAttribute('value');

                            if(value) {
                                timeType = item.parentNode.getAttribute('data-type');

                                if(_this.type !== 't-combined') {
                                    tempTime[timeType] = value;
                                }
                                else {
                                    if(index < 5) {
                                        tempStart[timeType] = value;
                                    }
                                    else {
                                        tempEnd[timeType] = value;
                                    }
                                }
                            }
                        });

                        if(_this.type === 't-combined') {
                            tempTime = {
                                "start": tempStart,
                                "end": tempEnd
                            }
                        }

                        // update time
                        switch(_this.type) {
                            case 't-simple':
                            case 't-combined':
                                _this.$items[0].querySelector('input').value = _this.$el.value = _this._timeStr = _jointTime(tempTime);
                                _this._timeObj = tempTime;
                                break;
                            case 't-range':
                                var current = _this.$scroller.getAttribute('data-current'),
                                    start = _this.$wrapper.querySelector('[data-input="start"]'),
                                    end = _this.$wrapper.querySelector('[data-input="end"]');

                                _this.$wrapper.querySelector('[data-input="'+current+'"]').value = _jointTime(tempTime);
                                _this.$el.value = _this._timeStr = start.value + '-' + end.value;
                                _this._timeObj = _getTime('range', _this._timeStr);
                                break;
                        }

                        _this.onChange && _this.onChange(_this._timeStr);
                    }

                    _closeScroller.call(_this);
                    e.stopPropagation();
                });

                // click clock icon
                function __updateScroller(timeType, time, scroller) {
                    var height = Number(getComputedStyle(scroller.querySelector('li')).height.replace('px', '')),
                        timeScroller = scroller.querySelector('[data-type="'+timeType+'"]');

                    Array.prototype.forEach.call(Array.prototype.slice.call(timeScroller.querySelectorAll('li')), function(item, index) {
                        item.className = item.className.replace('active', '');
                    });

                    timeScroller.style.transform = 'translateY(-' + (time[timeType] * height) + 'px)';
                    timeScroller.childNodes[Number(time[timeType]) + 1].className = 'active';
                }

                this.$clock.forEach(function(item, index) {
                    EventUtil.add(item, 'click', function() {
                        var scroller = _this.$scroller,
                            time;

                        switch(_this.type) {
                            case 't-simple':
                                time = _this._timeObj;
                                __updateScroller.call(_this, 'hour', time, scroller);
                                __updateScroller.call(_this, 'minute', time, scroller);
                                __updateScroller.call(_this, 'second', time, scroller);
                                break;
                            case 't-range':
                                var range = item.getAttribute('data-time');

                                if(range == 'start') {
                                    scroller.style.left = 0;
                                    scroller.setAttribute('data-current', 'start');
                                    time = _this._timeObj.start;
                                }
                                else {
                                    scroller.style.left = '51%';
                                    scroller.setAttribute('data-current', 'end');
                                    time = _this._timeObj.end;
                                }
                                __updateScroller.call(_this, 'hour', time, scroller);
                                __updateScroller.call(_this, 'minute', time, scroller);
                                __updateScroller.call(_this, 'second', time, scroller);
                                break;
                            case 't-combined':
                                time = _this._timeObj;

                                var startTime = time.start,
                                    endTime = time.end,
                                    startScroller = scroller.querySelector('[data-type="start"]'),
                                    endScroller = scroller.querySelector('[data-type="end"]');

                                __updateScroller.call(_this, 'hour', startTime, startScroller);
                                __updateScroller.call(_this, 'minute', startTime, startScroller);
                                __updateScroller.call(_this, 'second', startTime, startScroller);
                                __updateScroller.call(_this, 'hour', endTime, endScroller);
                                __updateScroller.call(_this, 'minute', endTime, endScroller);
                                __updateScroller.call(_this, 'second', endTime, endScroller);
                                break;
                        }

                        _this.$scroller.className = _this.$scroller.className.replace('hidden', '');
                    });
                });
                break;
        }
    }

    var _updateTimeObj = function(newVal, pos) {
        var new_val = _prezero(newVal.toString()),
            timeMap = {
                "hour": 0,
                "minute": 1,
                "second": 2
            },
            timeObj = this._timeObj;

        this._timeStr = _jointTime({
            "hour": pos == 'hour' ? new_val : timeObj.hour,
            "minute": pos == 'minute' ? new_val : timeObj.minute,
            "second": pos == 'second' ? new_val : timeObj.second
        });

        this.$el.value = this._timeStr;

        switch(this.type) {
            case 't-basic':
                this.$items[timeMap[pos]].querySelector('[data-input="'+pos+'"]').value = new_val;
        }
    }

    var _closeScroller = function() {
        this.$scroller.className += ' hidden';
        this.onCancel && this.onCancel();
    }

    dateTimeSelector.prototype.getTime = function() {
        return this._timeStr;
    }

    return dateTimeSelector;
}));
