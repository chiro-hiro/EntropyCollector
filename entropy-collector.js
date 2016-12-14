
(function (w, d) {

    //Make sure that there are no defined object
    if (typeof (w.EntropyCollector) !== 'undefined')
        return false;

    /** 
     * Merge two objects
     * @param {object}
     * @param {object}
     */
    var _objMerge = function (src, dst) {
        var index;
        if (typeof (dst) !== 'object'
            || typeof (src) !== 'object') {
            throw new Error('This type of data doesnt supported');
        }
        for (index in src) {
            if (typeof (src[index]) === 'object') {
                if (typeof (dst[index]) === 'undefined') {
                    dst[index] = (Array.isArray(src[index])) ? [] : {};
                }
                _objMerge(src[index], dst[index]);
            } else {
                if (typeof (dst[index]) === 'undefined') {
                    dst[index] = src[index];
                }
            }
        }
    }

    /**
     * Construction function
     * @param {object}
     */
    var _entropy = function (options) {

        var defaultSettings = {
            maxRound: 16,
            maxBytes: 32,
        };
        //Merge settings
        this._settings = {};
        _objMerge(options, this._settings);
        _objMerge(defaultSettings, this._settings);
        if (typeof (this._settings.canvasId) === 'undeinfed') {
            throw new Error('Canvas id wasnt defined');
        } else {
            this._canvas = document.getElementById(this._settings.canvasId);
            if (this._canvas === null) {
                throw new Error('Canvas DOM wasnt found');
            }
            this._context = this._canvas.getContext('2d');
        }
        this._curRound = 0;
        this._result = [];
        this._counter = 0;
        this._done = false;
    };

    /**
     * Event trigger on change
     * @param {function}
     */
    _entropy.prototype.onChange = function (callback) {
        this._onChangeCallback = callback;
    }

    /**
     * Event trigger on done
     * @param {function}
     */
    _entropy.prototype.onDone = function (callback) {
        this._onDoneCallBack = callback;
    }

    /**
     * Reset
     */
    _entropy.prototype.reset = function (callback) {
        this._curRound = 0;
        this._result = [];
        this._counter = 0;
        this._done = false;
        this._context.clearRect(0, 0, canvas.width, canvas.height);
        if(typeof(callback) === 'function'){
            callback();
        }
    }

    /**
     * Get current result
     * @return {string}
     */
    _entropy.prototype.getResult = function () {
        var retValue = "";
        var char = "";
        for (let i = 0; i < this._settings.maxBytes; i++) {
            char = (0 | this._result[i]).toString(16);
            char = (char.length <= 1) ? '0' + char : char;
            retValue += char;
        }
        return retValue;
    }

    /**
     * Start monitoring
     */
    _entropy.prototype.start = function () {
        if (w._activeEntropyCollector !== null) {
            throw new Error('One collector can active at the same time');
        }
        w._activeEntropyCollector = this;
        this._canvas.addEventListener('mousemove', this._listener);
        this._canvas.addEventListener('touchmove', this._listener);
    }

    /**
     * Stop monitoring
     */
    _entropy.prototype.stop = function () {
        //It's already null
        if (w._activeEntropyCollector === null)
            return;
        w._activeEntropyCollector = null;
        this._canvas.removeEventListener('mousemove', this._listener);
        this._canvas.removeEventListener('touchmove', this._listener);
    }

    /**
     * Get color of current result
     * @return {string}
     */
    _entropy.prototype._getColor = function () {
        var retValue = "#";
        var char = "";
        for (let i = 0; i < 3; i++) {
            char = (0 | this._result[i]).toString(16);
            char = (char.length <= 1) ? '0' + char : char;
            retValue += char;
        }
        return retValue;
    }

    /**
     * Event handle
     * @param {object}
     */
    _entropy.prototype._listener = function (event) {
        var collector = w._activeEntropyCollector;
        var x, y;
        //Handle touch event
        if (event instanceof TouchEvent) {
            x = event.changedTouches[0].clientX;
            y = event.changedTouches[0].clientY;
        } else {
            x = event.clientX;
            y = event.clientY;
        }

        //So nothing to do outa there
        if (x * y < 0) return false;
        // console.log(collector);
        if (collector._curRound >= collector._settings.maxRound) {
            //Trigger onDone callback
            if (typeof (collector._onDoneCallBack) === 'function'
                && collector._curRound === collector._settings.maxRound
                && !collector._done) {
                collector._done = true;
                collector._onDoneCallBack(collector.getResult(), collector._curRound, collector._settings.maxRound);
            }
            return true;
        }

        if (collector._counter >= collector._settings.maxBytes) {
            collector._counter = 0;
            collector._curRound++;
        }

        //Collect entropy
        collector._result[collector._counter] = collector._result[collector._counter] ^ (x * y) % 255;

        //Trigger onChange callback
        if (typeof (collector._onChangeCallback) === 'function') {
            collector._onChangeCallback(collector.getResult(), collector._curRound, collector._settings.maxRound);
        }

        //Draw the fingerprint
        var circle = new Path2D();
        circle.arc(x, y, (x * y) % 20, 0, 2 * Math.PI);
        collector._context.fillStyle = collector._getColor();
        collector._context.fill(circle);
        collector._counter++;

        return event.preventDefault();
    }

    //Provide global function
    w.EntropyCollector = _entropy;
    w._activeEntropyCollector = null;

})(window, document);