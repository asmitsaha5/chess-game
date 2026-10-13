function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

export var OptionsReader = /*#__PURE__*/function () {
  function OptionsReader(args, context) {
    _classCallCheck(this, OptionsReader);

    _defineProperty(this, "args", void 0);

    _defineProperty(this, "context", void 0);

    this.args = args;
    this.context = context;
  }

  _createClass(OptionsReader, [{
    key: "delay",
    get: function get() {
      var _this$args$delay;

      return (_this$args$delay = this.args.delay) !== null && _this$args$delay !== void 0 ? _this$args$delay : 0;
    }
  }, {
    key: "scrollAngleRanges",
    get: function get() {
      return this.args.scrollAngleRanges;
    }
  }, {
    key: "getDropTargetElementsAtPoint",
    get: function get() {
      return this.args.getDropTargetElementsAtPoint;
    }
  }, {
    key: "ignoreContextMenu",
    get: function get() {
      var _this$args$ignoreCont;

      return (_this$args$ignoreCont = this.args.ignoreContextMenu) !== null && _this$args$ignoreCont !== void 0 ? _this$args$ignoreCont : false;
    }
  }, {
    key: "enableHoverOutsideTarget",
    get: function get() {
      var _this$args$enableHove;

      return (_this$args$enableHove = this.args.enableHoverOutsideTarget) !== null && _this$args$enableHove !== void 0 ? _this$args$enableHove : false;
    }
  }, {
    key: "enableKeyboardEvents",
    get: function get() {
      var _this$args$enableKeyb;

      return (_this$args$enableKeyb = this.args.enableKeyboardEvents) !== null && _this$args$enableKeyb !== void 0 ? _this$args$enableKeyb : false;
    }
  }, {
    key: "enableMouseEvents",
    get: function get() {
      var _this$args$enableMous;

      return (_this$args$enableMous = this.args.enableMouseEvents) !== null && _this$args$enableMous !== void 0 ? _this$args$enableMous : false;
    }
  }, {
    key: "enableTouchEvents",
    get: function get() {
      var _this$args$enableTouc;

      return (_this$args$enableTouc = this.args.enableTouchEvents) !== null && _this$args$enableTouc !== void 0 ? _this$args$enableTouc : true;
    }
  }, {
    key: "touchSlop",
    get: function get() {
      return this.args.touchSlop || 0;
    }
  }, {
    key: "delayTouchStart",
    get: function get() {
      var _ref, _this$args$delayTouch, _this$args, _this$args2;

      return (_ref = (_this$args$delayTouch = (_this$args = this.args) === null || _this$args === void 0 ? void 0 : _this$args.delayTouchStart) !== null && _this$args$delayTouch !== void 0 ? _this$args$delayTouch : (_this$args2 = this.args) === null || _this$args2 === void 0 ? void 0 : _this$args2.delay) !== null && _ref !== void 0 ? _ref : 0;
    }
  }, {
    key: "delayMouseStart",
    get: function get() {
      var _ref2, _this$args$delayMouse, _this$args3, _this$args4;

      return (_ref2 = (_this$args$delayMouse = (_this$args3 = this.args) === null || _this$args3 === void 0 ? void 0 : _this$args3.delayMouseStart) !== null && _this$args$delayMouse !== void 0 ? _this$args$delayMouse : (_this$args4 = this.args) === null || _this$args4 === void 0 ? void 0 : _this$args4.delay) !== null && _ref2 !== void 0 ? _ref2 : 0;
    }
  }, {
    key: "window",
    get: function get() {
      if (this.context && this.context.window) {
        return this.context.window;
      } else if (typeof window !== 'undefined') {
        return window;
      }

      return undefined;
    }
  }, {
    key: "document",
    get: function get() {
      var _this$context;

      if ((_this$context = this.context) !== null && _this$context !== void 0 && _this$context.document) {
        return this.context.document;
      }

      if (this.window) {
        return this.window.document;
      }

      return undefined;
    }
  }, {
    key: "rootElement",
    get: function get() {
      var _this$args5;

      return ((_this$args5 = this.args) === null || _this$args5 === void 0 ? void 0 : _this$args5.rootElement) || this.document;
    }
  }]);

  return OptionsReader;
}();