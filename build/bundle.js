(function (feather) {
	'use strict';

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var mithril = createCommonjsModule(function (module) {
	(function() {
	function Vnode(tag, key, attrs0, children, text, dom) {
		return {tag: tag, key: key, attrs: attrs0, children: children, text: text, dom: dom, domSize: undefined, state: undefined, _state: undefined, events: undefined, instance: undefined, skip: false}
	}
	Vnode.normalize = function(node) {
		if (Array.isArray(node)) return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node), undefined, undefined)
		if (node != null && typeof node !== "object") return Vnode("#", undefined, undefined, node === false ? "" : node, undefined, undefined)
		return node
	};
	Vnode.normalizeChildren = function normalizeChildren(children) {
		for (var i = 0; i < children.length; i++) {
			children[i] = Vnode.normalize(children[i]);
		}
		return children
	};
	var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g;
	var selectorCache = {};
	var hasOwn = {}.hasOwnProperty;
	function isEmpty(object) {
		for (var key in object) if (hasOwn.call(object, key)) return false
		return true
	}
	function compileSelector(selector) {
		var match, tag = "div", classes = [], attrs = {};
		while (match = selectorParser.exec(selector)) {
			var type = match[1], value = match[2];
			if (type === "" && value !== "") tag = value;
			else if (type === "#") attrs.id = value;
			else if (type === ".") classes.push(value);
			else if (match[3][0] === "[") {
				var attrValue = match[6];
				if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\");
				if (match[4] === "class") classes.push(attrValue);
				else attrs[match[4]] = attrValue === "" ? attrValue : attrValue || true;
			}
		}
		if (classes.length > 0) attrs.className = classes.join(" ");
		return selectorCache[selector] = {tag: tag, attrs: attrs}
	}
	function execSelector(state, attrs, children) {
		var hasAttrs = false, childList, text;
		var className = attrs.className || attrs.class;
		if (!isEmpty(state.attrs) && !isEmpty(attrs)) {
			var newAttrs = {};
			for(var key in attrs) {
				if (hasOwn.call(attrs, key)) {
					newAttrs[key] = attrs[key];
				}
			}
			attrs = newAttrs;
		}
		for (var key in state.attrs) {
			if (hasOwn.call(state.attrs, key)) {
				attrs[key] = state.attrs[key];
			}
		}
		if (className !== undefined) {
			if (attrs.class !== undefined) {
				attrs.class = undefined;
				attrs.className = className;
			}
			if (state.attrs.className != null) {
				attrs.className = state.attrs.className + " " + className;
			}
		}
		for (var key in attrs) {
			if (hasOwn.call(attrs, key) && key !== "key") {
				hasAttrs = true;
				break
			}
		}
		if (Array.isArray(children) && children.length === 1 && children[0] != null && children[0].tag === "#") {
			text = children[0].children;
		} else {
			childList = children;
		}
		return Vnode(state.tag, attrs.key, hasAttrs ? attrs : undefined, childList, text)
	}
	function hyperscript(selector) {
		// Because sloppy mode sucks
		var attrs = arguments[1], start = 2, children;
		if (selector == null || typeof selector !== "string" && typeof selector !== "function" && typeof selector.view !== "function") {
			throw Error("The selector must be either a string or a component.");
		}
		if (typeof selector === "string") {
			var cached = selectorCache[selector] || compileSelector(selector);
		}
		if (attrs == null) {
			attrs = {};
		} else if (typeof attrs !== "object" || attrs.tag != null || Array.isArray(attrs)) {
			attrs = {};
			start = 1;
		}
		if (arguments.length === start + 1) {
			children = arguments[start];
			if (!Array.isArray(children)) children = [children];
		} else {
			children = [];
			while (start < arguments.length) children.push(arguments[start++]);
		}
		var normalized = Vnode.normalizeChildren(children);
		if (typeof selector === "string") {
			return execSelector(cached, attrs, normalized)
		} else {
			return Vnode(selector, attrs.key, attrs, normalized)
		}
	}
	hyperscript.trust = function(html) {
		if (html == null) html = "";
		return Vnode("<", undefined, undefined, html, undefined, undefined)
	};
	hyperscript.fragment = function(attrs1, children) {
		return Vnode("[", attrs1.key, attrs1, Vnode.normalizeChildren(children), undefined, undefined)
	};
	var m = hyperscript;
	/** @constructor */
	var PromisePolyfill = function(executor) {
		if (!(this instanceof PromisePolyfill)) throw new Error("Promise must be called with `new`")
		if (typeof executor !== "function") throw new TypeError("executor must be a function")
		var self = this, resolvers = [], rejectors = [], resolveCurrent = handler(resolvers, true), rejectCurrent = handler(rejectors, false);
		var instance = self._instance = {resolvers: resolvers, rejectors: rejectors};
		var callAsync = typeof setImmediate === "function" ? setImmediate : setTimeout;
		function handler(list, shouldAbsorb) {
			return function execute(value) {
				var then;
				try {
					if (shouldAbsorb && value != null && (typeof value === "object" || typeof value === "function") && typeof (then = value.then) === "function") {
						if (value === self) throw new TypeError("Promise can't be resolved w/ itself")
						executeOnce(then.bind(value));
					}
					else {
						callAsync(function() {
							if (!shouldAbsorb && list.length === 0) console.error("Possible unhandled promise rejection:", value);
							for (var i = 0; i < list.length; i++) list[i](value);
							resolvers.length = 0, rejectors.length = 0;
							instance.state = shouldAbsorb;
							instance.retry = function() {execute(value);};
						});
					}
				}
				catch (e) {
					rejectCurrent(e);
				}
			}
		}
		function executeOnce(then) {
			var runs = 0;
			function run(fn) {
				return function(value) {
					if (runs++ > 0) return
					fn(value);
				}
			}
			var onerror = run(rejectCurrent);
			try {then(run(resolveCurrent), onerror);} catch (e) {onerror(e);}
		}
		executeOnce(executor);
	};
	PromisePolyfill.prototype.then = function(onFulfilled, onRejection) {
		var self = this, instance = self._instance;
		function handle(callback, list, next, state) {
			list.push(function(value) {
				if (typeof callback !== "function") next(value);
				else try {resolveNext(callback(value));} catch (e) {if (rejectNext) rejectNext(e);}
			});
			if (typeof instance.retry === "function" && state === instance.state) instance.retry();
		}
		var resolveNext, rejectNext;
		var promise = new PromisePolyfill(function(resolve, reject) {resolveNext = resolve, rejectNext = reject;});
		handle(onFulfilled, instance.resolvers, resolveNext, true), handle(onRejection, instance.rejectors, rejectNext, false);
		return promise
	};
	PromisePolyfill.prototype.catch = function(onRejection) {
		return this.then(null, onRejection)
	};
	PromisePolyfill.resolve = function(value) {
		if (value instanceof PromisePolyfill) return value
		return new PromisePolyfill(function(resolve) {resolve(value);})
	};
	PromisePolyfill.reject = function(value) {
		return new PromisePolyfill(function(resolve, reject) {reject(value);})
	};
	PromisePolyfill.all = function(list) {
		return new PromisePolyfill(function(resolve, reject) {
			var total = list.length, count = 0, values = [];
			if (list.length === 0) resolve([]);
			else for (var i = 0; i < list.length; i++) {
				(function(i) {
					function consume(value) {
						count++;
						values[i] = value;
						if (count === total) resolve(values);
					}
					if (list[i] != null && (typeof list[i] === "object" || typeof list[i] === "function") && typeof list[i].then === "function") {
						list[i].then(consume, reject);
					}
					else consume(list[i]);
				})(i);
			}
		})
	};
	PromisePolyfill.race = function(list) {
		return new PromisePolyfill(function(resolve, reject) {
			for (var i = 0; i < list.length; i++) {
				list[i].then(resolve, reject);
			}
		})
	};
	if (typeof window !== "undefined") {
		if (typeof window.Promise === "undefined") window.Promise = PromisePolyfill;
		var PromisePolyfill = window.Promise;
	} else if (typeof commonjsGlobal !== "undefined") {
		if (typeof commonjsGlobal.Promise === "undefined") commonjsGlobal.Promise = PromisePolyfill;
		var PromisePolyfill = commonjsGlobal.Promise;
	}
	var buildQueryString = function(object) {
		if (Object.prototype.toString.call(object) !== "[object Object]") return ""
		var args = [];
		for (var key0 in object) {
			destructure(key0, object[key0]);
		}
		return args.join("&")
		function destructure(key0, value) {
			if (Array.isArray(value)) {
				for (var i = 0; i < value.length; i++) {
					destructure(key0 + "[" + i + "]", value[i]);
				}
			}
			else if (Object.prototype.toString.call(value) === "[object Object]") {
				for (var i in value) {
					destructure(key0 + "[" + i + "]", value[i]);
				}
			}
			else args.push(encodeURIComponent(key0) + (value != null && value !== "" ? "=" + encodeURIComponent(value) : ""));
		}
	};
	var FILE_PROTOCOL_REGEX = new RegExp("^file://", "i");
	var _8 = function($window, Promise) {
		var callbackCount = 0;
		var oncompletion;
		function setCompletionCallback(callback) {oncompletion = callback;}
		function finalizer() {
			var count = 0;
			function complete() {if (--count === 0 && typeof oncompletion === "function") oncompletion();}
			return function finalize(promise0) {
				var then0 = promise0.then;
				promise0.then = function() {
					count++;
					var next = then0.apply(promise0, arguments);
					next.then(complete, function(e) {
						complete();
						if (count === 0) throw e
					});
					return finalize(next)
				};
				return promise0
			}
		}
		function normalize(args, extra) {
			if (typeof args === "string") {
				var url = args;
				args = extra || {};
				if (args.url == null) args.url = url;
			}
			return args
		}
		function request(args, extra) {
			var finalize = finalizer();
			args = normalize(args, extra);
			var promise0 = new Promise(function(resolve, reject) {
				if (args.method == null) args.method = "GET";
				args.method = args.method.toUpperCase();
				var useBody = (args.method === "GET" || args.method === "TRACE") ? false : (typeof args.useBody === "boolean" ? args.useBody : true);
				if (typeof args.serialize !== "function") args.serialize = typeof FormData !== "undefined" && args.data instanceof FormData ? function(value) {return value} : JSON.stringify;
				if (typeof args.deserialize !== "function") args.deserialize = deserialize;
				if (typeof args.extract !== "function") args.extract = extract;
				args.url = interpolate(args.url, args.data);
				if (useBody) args.data = args.serialize(args.data);
				else args.url = assemble(args.url, args.data);
				var xhr = new $window.XMLHttpRequest(),
					aborted = false,
					_abort = xhr.abort;
				xhr.abort = function abort() {
					aborted = true;
					_abort.call(xhr);
				};
				xhr.open(args.method, args.url, typeof args.async === "boolean" ? args.async : true, typeof args.user === "string" ? args.user : undefined, typeof args.password === "string" ? args.password : undefined);
				if (args.serialize === JSON.stringify && useBody && !(args.headers && args.headers.hasOwnProperty("Content-Type"))) {
					xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
				}
				if (args.deserialize === deserialize && !(args.headers && args.headers.hasOwnProperty("Accept"))) {
					xhr.setRequestHeader("Accept", "application/json, text/*");
				}
				if (args.withCredentials) xhr.withCredentials = args.withCredentials;
				for (var key in args.headers) if ({}.hasOwnProperty.call(args.headers, key)) {
					xhr.setRequestHeader(key, args.headers[key]);
				}
				if (typeof args.config === "function") xhr = args.config(xhr, args) || xhr;
				xhr.onreadystatechange = function() {
					// Don't throw errors on xhr.abort().
					if(aborted) return
					if (xhr.readyState === 4) {
						try {
							var response = (args.extract !== extract) ? args.extract(xhr, args) : args.deserialize(args.extract(xhr, args));
							if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || FILE_PROTOCOL_REGEX.test(args.url)) {
								resolve(cast(args.type, response));
							}
							else {
								var error = new Error(xhr.responseText);
								for (var key in response) error[key] = response[key];
								reject(error);
							}
						}
						catch (e) {
							reject(e);
						}
					}
				};
				if (useBody && (args.data != null)) xhr.send(args.data);
				else xhr.send();
			});
			return args.background === true ? promise0 : finalize(promise0)
		}
		function jsonp(args, extra) {
			var finalize = finalizer();
			args = normalize(args, extra);
			var promise0 = new Promise(function(resolve, reject) {
				var callbackName = args.callbackName || "_mithril_" + Math.round(Math.random() * 1e16) + "_" + callbackCount++;
				var script = $window.document.createElement("script");
				$window[callbackName] = function(data) {
					script.parentNode.removeChild(script);
					resolve(cast(args.type, data));
					delete $window[callbackName];
				};
				script.onerror = function() {
					script.parentNode.removeChild(script);
					reject(new Error("JSONP request failed"));
					delete $window[callbackName];
				};
				if (args.data == null) args.data = {};
				args.url = interpolate(args.url, args.data);
				args.data[args.callbackKey || "callback"] = callbackName;
				script.src = assemble(args.url, args.data);
				$window.document.documentElement.appendChild(script);
			});
			return args.background === true? promise0 : finalize(promise0)
		}
		function interpolate(url, data) {
			if (data == null) return url
			var tokens = url.match(/:[^\/]+/gi) || [];
			for (var i = 0; i < tokens.length; i++) {
				var key = tokens[i].slice(1);
				if (data[key] != null) {
					url = url.replace(tokens[i], data[key]);
				}
			}
			return url
		}
		function assemble(url, data) {
			var querystring = buildQueryString(data);
			if (querystring !== "") {
				var prefix = url.indexOf("?") < 0 ? "?" : "&";
				url += prefix + querystring;
			}
			return url
		}
		function deserialize(data) {
			try {return data !== "" ? JSON.parse(data) : null}
			catch (e) {throw new Error(data)}
		}
		function extract(xhr) {return xhr.responseText}
		function cast(type0, data) {
			if (typeof type0 === "function") {
				if (Array.isArray(data)) {
					for (var i = 0; i < data.length; i++) {
						data[i] = new type0(data[i]);
					}
				}
				else return new type0(data)
			}
			return data
		}
		return {request: request, jsonp: jsonp, setCompletionCallback: setCompletionCallback}
	};
	var requestService = _8(window, PromisePolyfill);
	var coreRenderer = function($window) {
		var $doc = $window.document;
		var $emptyFragment = $doc.createDocumentFragment();
		var nameSpace = {
			svg: "http://www.w3.org/2000/svg",
			math: "http://www.w3.org/1998/Math/MathML"
		};
		var onevent;
		function setEventCallback(callback) {return onevent = callback}
		function getNameSpace(vnode) {
			return vnode.attrs && vnode.attrs.xmlns || nameSpace[vnode.tag]
		}
		// IE9 - IE11 (at least) throw an UnspecifiedError when accessing document.activeElement when
		// inside an iframe. Catch and swallow this error0, and heavy-handidly return null.
		function activeElement() {
			try {
				return $doc.activeElement
			} catch (e) {
				return null
			}
		}
		//create
		function createNodes(parent, vnodes, start, end, hooks, nextSibling, ns) {
			for (var i = start; i < end; i++) {
				var vnode = vnodes[i];
				if (vnode != null) {
					createNode(parent, vnode, hooks, ns, nextSibling);
				}
			}
		}
		function createNode(parent, vnode, hooks, ns, nextSibling) {
			var tag = vnode.tag;
			if (typeof tag === "string") {
				vnode.state = {};
				if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks);
				switch (tag) {
					case "#": return createText(parent, vnode, nextSibling)
					case "<": return createHTML(parent, vnode, nextSibling)
					case "[": return createFragment(parent, vnode, hooks, ns, nextSibling)
					default: return createElement(parent, vnode, hooks, ns, nextSibling)
				}
			}
			else return createComponent(parent, vnode, hooks, ns, nextSibling)
		}
		function createText(parent, vnode, nextSibling) {
			vnode.dom = $doc.createTextNode(vnode.children);
			insertNode(parent, vnode.dom, nextSibling);
			return vnode.dom
		}
		function createHTML(parent, vnode, nextSibling) {
			var match1 = vnode.children.match(/^\s*?<(\w+)/im) || [];
			var parent1 = {caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup"}[match1[1]] || "div";
			var temp = $doc.createElement(parent1);
			temp.innerHTML = vnode.children;
			vnode.dom = temp.firstChild;
			vnode.domSize = temp.childNodes.length;
			var fragment = $doc.createDocumentFragment();
			var child;
			while (child = temp.firstChild) {
				fragment.appendChild(child);
			}
			insertNode(parent, fragment, nextSibling);
			return fragment
		}
		function createFragment(parent, vnode, hooks, ns, nextSibling) {
			var fragment = $doc.createDocumentFragment();
			if (vnode.children != null) {
				var children = vnode.children;
				createNodes(fragment, children, 0, children.length, hooks, null, ns);
			}
			vnode.dom = fragment.firstChild;
			vnode.domSize = fragment.childNodes.length;
			insertNode(parent, fragment, nextSibling);
			return fragment
		}
		function createElement(parent, vnode, hooks, ns, nextSibling) {
			var tag = vnode.tag;
			var attrs2 = vnode.attrs;
			var is = attrs2 && attrs2.is;
			ns = getNameSpace(vnode) || ns;
			var element = ns ?
				is ? $doc.createElementNS(ns, tag, {is: is}) : $doc.createElementNS(ns, tag) :
				is ? $doc.createElement(tag, {is: is}) : $doc.createElement(tag);
			vnode.dom = element;
			if (attrs2 != null) {
				setAttrs(vnode, attrs2, ns);
			}
			insertNode(parent, element, nextSibling);
			if (vnode.attrs != null && vnode.attrs.contenteditable != null) {
				setContentEditable(vnode);
			}
			else {
				if (vnode.text != null) {
					if (vnode.text !== "") element.textContent = vnode.text;
					else vnode.children = [Vnode("#", undefined, undefined, vnode.text, undefined, undefined)];
				}
				if (vnode.children != null) {
					var children = vnode.children;
					createNodes(element, children, 0, children.length, hooks, null, ns);
					setLateAttrs(vnode);
				}
			}
			return element
		}
		function initComponent(vnode, hooks) {
			var sentinel;
			if (typeof vnode.tag.view === "function") {
				vnode.state = Object.create(vnode.tag);
				sentinel = vnode.state.view;
				if (sentinel.$$reentrantLock$$ != null) return $emptyFragment
				sentinel.$$reentrantLock$$ = true;
			} else {
				vnode.state = void 0;
				sentinel = vnode.tag;
				if (sentinel.$$reentrantLock$$ != null) return $emptyFragment
				sentinel.$$reentrantLock$$ = true;
				vnode.state = (vnode.tag.prototype != null && typeof vnode.tag.prototype.view === "function") ? new vnode.tag(vnode) : vnode.tag(vnode);
			}
			vnode._state = vnode.state;
			if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks);
			initLifecycle(vnode._state, vnode, hooks);
			vnode.instance = Vnode.normalize(vnode._state.view.call(vnode.state, vnode));
			if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument")
			sentinel.$$reentrantLock$$ = null;
		}
		function createComponent(parent, vnode, hooks, ns, nextSibling) {
			initComponent(vnode, hooks);
			if (vnode.instance != null) {
				var element = createNode(parent, vnode.instance, hooks, ns, nextSibling);
				vnode.dom = vnode.instance.dom;
				vnode.domSize = vnode.dom != null ? vnode.instance.domSize : 0;
				insertNode(parent, element, nextSibling);
				return element
			}
			else {
				vnode.domSize = 0;
				return $emptyFragment
			}
		}
		//update
		function updateNodes(parent, old, vnodes, recycling, hooks, nextSibling, ns) {
			if (old === vnodes || old == null && vnodes == null) return
			else if (old == null) createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling, ns);
			else if (vnodes == null) removeNodes(old, 0, old.length, vnodes);
			else {
				if (old.length === vnodes.length) {
					var isUnkeyed = false;
					for (var i = 0; i < vnodes.length; i++) {
						if (vnodes[i] != null && old[i] != null) {
							isUnkeyed = vnodes[i].key == null && old[i].key == null;
							break
						}
					}
					if (isUnkeyed) {
						for (var i = 0; i < old.length; i++) {
							if (old[i] === vnodes[i]) continue
							else if (old[i] == null && vnodes[i] != null) createNode(parent, vnodes[i], hooks, ns, getNextSibling(old, i + 1, nextSibling));
							else if (vnodes[i] == null) removeNodes(old, i, i + 1, vnodes);
							else updateNode(parent, old[i], vnodes[i], hooks, getNextSibling(old, i + 1, nextSibling), recycling, ns);
						}
						return
					}
				}
				recycling = recycling || isRecyclable(old, vnodes);
				if (recycling) {
					var pool = old.pool;
					old = old.concat(old.pool);
				}
				var oldStart = 0, start = 0, oldEnd = old.length - 1, end = vnodes.length - 1, map;
				while (oldEnd >= oldStart && end >= start) {
					var o = old[oldStart], v = vnodes[start];
					if (o === v && !recycling) oldStart++, start++;
					else if (o == null) oldStart++;
					else if (v == null) start++;
					else if (o.key === v.key) {
						var shouldRecycle = (pool != null && oldStart >= old.length - pool.length) || ((pool == null) && recycling);
						oldStart++, start++;
						updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), shouldRecycle, ns);
						if (recycling && o.tag === v.tag) insertNode(parent, toFragment(o), nextSibling);
					}
					else {
						var o = old[oldEnd];
						if (o === v && !recycling) oldEnd--, start++;
						else if (o == null) oldEnd--;
						else if (v == null) start++;
						else if (o.key === v.key) {
							var shouldRecycle = (pool != null && oldEnd >= old.length - pool.length) || ((pool == null) && recycling);
							updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), shouldRecycle, ns);
							if (recycling || start < end) insertNode(parent, toFragment(o), getNextSibling(old, oldStart, nextSibling));
							oldEnd--, start++;
						}
						else break
					}
				}
				while (oldEnd >= oldStart && end >= start) {
					var o = old[oldEnd], v = vnodes[end];
					if (o === v && !recycling) oldEnd--, end--;
					else if (o == null) oldEnd--;
					else if (v == null) end--;
					else if (o.key === v.key) {
						var shouldRecycle = (pool != null && oldEnd >= old.length - pool.length) || ((pool == null) && recycling);
						updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), shouldRecycle, ns);
						if (recycling && o.tag === v.tag) insertNode(parent, toFragment(o), nextSibling);
						if (o.dom != null) nextSibling = o.dom;
						oldEnd--, end--;
					}
					else {
						if (!map) map = getKeyMap(old, oldEnd);
						if (v != null) {
							var oldIndex = map[v.key];
							if (oldIndex != null) {
								var movable = old[oldIndex];
								var shouldRecycle = (pool != null && oldIndex >= old.length - pool.length) || ((pool == null) && recycling);
								updateNode(parent, movable, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns);
								insertNode(parent, toFragment(movable), nextSibling);
								old[oldIndex].skip = true;
								if (movable.dom != null) nextSibling = movable.dom;
							}
							else {
								var dom = createNode(parent, v, hooks, ns, nextSibling);
								nextSibling = dom;
							}
						}
						end--;
					}
					if (end < start) break
				}
				createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns);
				removeNodes(old, oldStart, oldEnd + 1, vnodes);
			}
		}
		function updateNode(parent, old, vnode, hooks, nextSibling, recycling, ns) {
			var oldTag = old.tag, tag = vnode.tag;
			if (oldTag === tag) {
				vnode.state = old.state;
				vnode._state = old._state;
				vnode.events = old.events;
				if (!recycling && shouldNotUpdate(vnode, old)) return
				if (typeof oldTag === "string") {
					if (vnode.attrs != null) {
						if (recycling) {
							vnode.state = {};
							initLifecycle(vnode.attrs, vnode, hooks);
						}
						else updateLifecycle(vnode.attrs, vnode, hooks);
					}
					switch (oldTag) {
						case "#": updateText(old, vnode); break
						case "<": updateHTML(parent, old, vnode, nextSibling); break
						case "[": updateFragment(parent, old, vnode, recycling, hooks, nextSibling, ns); break
						default: updateElement(old, vnode, recycling, hooks, ns);
					}
				}
				else updateComponent(parent, old, vnode, hooks, nextSibling, recycling, ns);
			}
			else {
				removeNode(old, null);
				createNode(parent, vnode, hooks, ns, nextSibling);
			}
		}
		function updateText(old, vnode) {
			if (old.children.toString() !== vnode.children.toString()) {
				old.dom.nodeValue = vnode.children;
			}
			vnode.dom = old.dom;
		}
		function updateHTML(parent, old, vnode, nextSibling) {
			if (old.children !== vnode.children) {
				toFragment(old);
				createHTML(parent, vnode, nextSibling);
			}
			else vnode.dom = old.dom, vnode.domSize = old.domSize;
		}
		function updateFragment(parent, old, vnode, recycling, hooks, nextSibling, ns) {
			updateNodes(parent, old.children, vnode.children, recycling, hooks, nextSibling, ns);
			var domSize = 0, children = vnode.children;
			vnode.dom = null;
			if (children != null) {
				for (var i = 0; i < children.length; i++) {
					var child = children[i];
					if (child != null && child.dom != null) {
						if (vnode.dom == null) vnode.dom = child.dom;
						domSize += child.domSize || 1;
					}
				}
				if (domSize !== 1) vnode.domSize = domSize;
			}
		}
		function updateElement(old, vnode, recycling, hooks, ns) {
			var element = vnode.dom = old.dom;
			ns = getNameSpace(vnode) || ns;
			if (vnode.tag === "textarea") {
				if (vnode.attrs == null) vnode.attrs = {};
				if (vnode.text != null) {
					vnode.attrs.value = vnode.text; //FIXME handle0 multiple children
					vnode.text = undefined;
				}
			}
			updateAttrs(vnode, old.attrs, vnode.attrs, ns);
			if (vnode.attrs != null && vnode.attrs.contenteditable != null) {
				setContentEditable(vnode);
			}
			else if (old.text != null && vnode.text != null && vnode.text !== "") {
				if (old.text.toString() !== vnode.text.toString()) old.dom.firstChild.nodeValue = vnode.text;
			}
			else {
				if (old.text != null) old.children = [Vnode("#", undefined, undefined, old.text, undefined, old.dom.firstChild)];
				if (vnode.text != null) vnode.children = [Vnode("#", undefined, undefined, vnode.text, undefined, undefined)];
				updateNodes(element, old.children, vnode.children, recycling, hooks, null, ns);
			}
		}
		function updateComponent(parent, old, vnode, hooks, nextSibling, recycling, ns) {
			if (recycling) {
				initComponent(vnode, hooks);
			} else {
				vnode.instance = Vnode.normalize(vnode._state.view.call(vnode.state, vnode));
				if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument")
				if (vnode.attrs != null) updateLifecycle(vnode.attrs, vnode, hooks);
				updateLifecycle(vnode._state, vnode, hooks);
			}
			if (vnode.instance != null) {
				if (old.instance == null) createNode(parent, vnode.instance, hooks, ns, nextSibling);
				else updateNode(parent, old.instance, vnode.instance, hooks, nextSibling, recycling, ns);
				vnode.dom = vnode.instance.dom;
				vnode.domSize = vnode.instance.domSize;
			}
			else if (old.instance != null) {
				removeNode(old.instance, null);
				vnode.dom = undefined;
				vnode.domSize = 0;
			}
			else {
				vnode.dom = old.dom;
				vnode.domSize = old.domSize;
			}
		}
		function isRecyclable(old, vnodes) {
			if (old.pool != null && Math.abs(old.pool.length - vnodes.length) <= Math.abs(old.length - vnodes.length)) {
				var oldChildrenLength = old[0] && old[0].children && old[0].children.length || 0;
				var poolChildrenLength = old.pool[0] && old.pool[0].children && old.pool[0].children.length || 0;
				var vnodesChildrenLength = vnodes[0] && vnodes[0].children && vnodes[0].children.length || 0;
				if (Math.abs(poolChildrenLength - vnodesChildrenLength) <= Math.abs(oldChildrenLength - vnodesChildrenLength)) {
					return true
				}
			}
			return false
		}
		function getKeyMap(vnodes, end) {
			var map = {}, i = 0;
			for (var i = 0; i < end; i++) {
				var vnode = vnodes[i];
				if (vnode != null) {
					var key2 = vnode.key;
					if (key2 != null) map[key2] = i;
				}
			}
			return map
		}
		function toFragment(vnode) {
			var count0 = vnode.domSize;
			if (count0 != null || vnode.dom == null) {
				var fragment = $doc.createDocumentFragment();
				if (count0 > 0) {
					var dom = vnode.dom;
					while (--count0) fragment.appendChild(dom.nextSibling);
					fragment.insertBefore(dom, fragment.firstChild);
				}
				return fragment
			}
			else return vnode.dom
		}
		function getNextSibling(vnodes, i, nextSibling) {
			for (; i < vnodes.length; i++) {
				if (vnodes[i] != null && vnodes[i].dom != null) return vnodes[i].dom
			}
			return nextSibling
		}
		function insertNode(parent, dom, nextSibling) {
			if (nextSibling && nextSibling.parentNode) parent.insertBefore(dom, nextSibling);
			else parent.appendChild(dom);
		}
		function setContentEditable(vnode) {
			var children = vnode.children;
			if (children != null && children.length === 1 && children[0].tag === "<") {
				var content = children[0].children;
				if (vnode.dom.innerHTML !== content) vnode.dom.innerHTML = content;
			}
			else if (vnode.text != null || children != null && children.length !== 0) throw new Error("Child node of a contenteditable must be trusted")
		}
		//remove
		function removeNodes(vnodes, start, end, context) {
			for (var i = start; i < end; i++) {
				var vnode = vnodes[i];
				if (vnode != null) {
					if (vnode.skip) vnode.skip = false;
					else removeNode(vnode, context);
				}
			}
		}
		function removeNode(vnode, context) {
			var expected = 1, called = 0;
			if (vnode.attrs && typeof vnode.attrs.onbeforeremove === "function") {
				var result = vnode.attrs.onbeforeremove.call(vnode.state, vnode);
				if (result != null && typeof result.then === "function") {
					expected++;
					result.then(continuation, continuation);
				}
			}
			if (typeof vnode.tag !== "string" && typeof vnode._state.onbeforeremove === "function") {
				var result = vnode._state.onbeforeremove.call(vnode.state, vnode);
				if (result != null && typeof result.then === "function") {
					expected++;
					result.then(continuation, continuation);
				}
			}
			continuation();
			function continuation() {
				if (++called === expected) {
					onremove(vnode);
					if (vnode.dom) {
						var count0 = vnode.domSize || 1;
						if (count0 > 1) {
							var dom = vnode.dom;
							while (--count0) {
								removeNodeFromDOM(dom.nextSibling);
							}
						}
						removeNodeFromDOM(vnode.dom);
						if (context != null && vnode.domSize == null && !hasIntegrationMethods(vnode.attrs) && typeof vnode.tag === "string") { //TODO test custom elements
							if (!context.pool) context.pool = [vnode];
							else context.pool.push(vnode);
						}
					}
				}
			}
		}
		function removeNodeFromDOM(node) {
			var parent = node.parentNode;
			if (parent != null) parent.removeChild(node);
		}
		function onremove(vnode) {
			if (vnode.attrs && typeof vnode.attrs.onremove === "function") vnode.attrs.onremove.call(vnode.state, vnode);
			if (typeof vnode.tag !== "string") {
				if (typeof vnode._state.onremove === "function") vnode._state.onremove.call(vnode.state, vnode);
				if (vnode.instance != null) onremove(vnode.instance);
			} else {
				var children = vnode.children;
				if (Array.isArray(children)) {
					for (var i = 0; i < children.length; i++) {
						var child = children[i];
						if (child != null) onremove(child);
					}
				}
			}
		}
		//attrs2
		function setAttrs(vnode, attrs2, ns) {
			for (var key2 in attrs2) {
				setAttr(vnode, key2, null, attrs2[key2], ns);
			}
		}
		function setAttr(vnode, key2, old, value, ns) {
			var element = vnode.dom;
			if (key2 === "key" || key2 === "is" || (old === value && !isFormAttribute(vnode, key2)) && typeof value !== "object" || typeof value === "undefined" || isLifecycleMethod(key2)) return
			var nsLastIndex = key2.indexOf(":");
			if (nsLastIndex > -1 && key2.substr(0, nsLastIndex) === "xlink") {
				element.setAttributeNS("http://www.w3.org/1999/xlink", key2.slice(nsLastIndex + 1), value);
			}
			else if (key2[0] === "o" && key2[1] === "n" && typeof value === "function") updateEvent(vnode, key2, value);
			else if (key2 === "style") updateStyle(element, old, value);
			else if (key2 in element && !isAttribute(key2) && ns === undefined && !isCustomElement(vnode)) {
				if (key2 === "value") {
					var normalized0 = "" + value; // eslint-disable-line no-implicit-coercion
					//setting input[value] to same value by typing on focused element moves cursor to end in Chrome
					if ((vnode.tag === "input" || vnode.tag === "textarea") && vnode.dom.value === normalized0 && vnode.dom === activeElement()) return
					//setting select[value] to same value while having select open blinks select dropdown in Chrome
					if (vnode.tag === "select") {
						if (value === null) {
							if (vnode.dom.selectedIndex === -1 && vnode.dom === activeElement()) return
						} else {
							if (old !== null && vnode.dom.value === normalized0 && vnode.dom === activeElement()) return
						}
					}
					//setting option[value] to same value while having select open blinks select dropdown in Chrome
					if (vnode.tag === "option" && old != null && vnode.dom.value === normalized0) return
				}
				// If you assign an input type1 that is not supported by IE 11 with an assignment expression, an error0 will occur.
				if (vnode.tag === "input" && key2 === "type") {
					element.setAttribute(key2, value);
					return
				}
				element[key2] = value;
			}
			else {
				if (typeof value === "boolean") {
					if (value) element.setAttribute(key2, "");
					else element.removeAttribute(key2);
				}
				else element.setAttribute(key2 === "className" ? "class" : key2, value);
			}
		}
		function setLateAttrs(vnode) {
			var attrs2 = vnode.attrs;
			if (vnode.tag === "select" && attrs2 != null) {
				if ("value" in attrs2) setAttr(vnode, "value", null, attrs2.value, undefined);
				if ("selectedIndex" in attrs2) setAttr(vnode, "selectedIndex", null, attrs2.selectedIndex, undefined);
			}
		}
		function updateAttrs(vnode, old, attrs2, ns) {
			if (attrs2 != null) {
				for (var key2 in attrs2) {
					setAttr(vnode, key2, old && old[key2], attrs2[key2], ns);
				}
			}
			if (old != null) {
				for (var key2 in old) {
					if (attrs2 == null || !(key2 in attrs2)) {
						if (key2 === "className") key2 = "class";
						if (key2[0] === "o" && key2[1] === "n" && !isLifecycleMethod(key2)) updateEvent(vnode, key2, undefined);
						else if (key2 !== "key") vnode.dom.removeAttribute(key2);
					}
				}
			}
		}
		function isFormAttribute(vnode, attr) {
			return attr === "value" || attr === "checked" || attr === "selectedIndex" || attr === "selected" && vnode.dom === activeElement()
		}
		function isLifecycleMethod(attr) {
			return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate"
		}
		function isAttribute(attr) {
			return attr === "href" || attr === "list" || attr === "form" || attr === "width" || attr === "height"// || attr === "type"
		}
		function isCustomElement(vnode){
			return vnode.attrs.is || vnode.tag.indexOf("-") > -1
		}
		function hasIntegrationMethods(source) {
			return source != null && (source.oncreate || source.onupdate || source.onbeforeremove || source.onremove)
		}
		//style
		function updateStyle(element, old, style) {
			if (old === style) element.style.cssText = "", old = null;
			if (style == null) element.style.cssText = "";
			else if (typeof style === "string") element.style.cssText = style;
			else {
				if (typeof old === "string") element.style.cssText = "";
				for (var key2 in style) {
					element.style[key2] = style[key2];
				}
				if (old != null && typeof old !== "string") {
					for (var key2 in old) {
						if (!(key2 in style)) element.style[key2] = "";
					}
				}
			}
		}
		//event
		function updateEvent(vnode, key2, value) {
			var element = vnode.dom;
			var callback = typeof onevent !== "function" ? value : function(e) {
				var result = value.call(element, e);
				onevent.call(element, e);
				return result
			};
			if (key2 in element) element[key2] = typeof value === "function" ? callback : null;
			else {
				var eventName = key2.slice(2);
				if (vnode.events === undefined) vnode.events = {};
				if (vnode.events[key2] === callback) return
				if (vnode.events[key2] != null) element.removeEventListener(eventName, vnode.events[key2], false);
				if (typeof value === "function") {
					vnode.events[key2] = callback;
					element.addEventListener(eventName, vnode.events[key2], false);
				}
			}
		}
		//lifecycle
		function initLifecycle(source, vnode, hooks) {
			if (typeof source.oninit === "function") source.oninit.call(vnode.state, vnode);
			if (typeof source.oncreate === "function") hooks.push(source.oncreate.bind(vnode.state, vnode));
		}
		function updateLifecycle(source, vnode, hooks) {
			if (typeof source.onupdate === "function") hooks.push(source.onupdate.bind(vnode.state, vnode));
		}
		function shouldNotUpdate(vnode, old) {
			var forceVnodeUpdate, forceComponentUpdate;
			if (vnode.attrs != null && typeof vnode.attrs.onbeforeupdate === "function") forceVnodeUpdate = vnode.attrs.onbeforeupdate.call(vnode.state, vnode, old);
			if (typeof vnode.tag !== "string" && typeof vnode._state.onbeforeupdate === "function") forceComponentUpdate = vnode._state.onbeforeupdate.call(vnode.state, vnode, old);
			if (!(forceVnodeUpdate === undefined && forceComponentUpdate === undefined) && !forceVnodeUpdate && !forceComponentUpdate) {
				vnode.dom = old.dom;
				vnode.domSize = old.domSize;
				vnode.instance = old.instance;
				return true
			}
			return false
		}
		function render(dom, vnodes) {
			if (!dom) throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.")
			var hooks = [];
			var active = activeElement();
			var namespace = dom.namespaceURI;
			// First time0 rendering into a node clears it out
			if (dom.vnodes == null) dom.textContent = "";
			if (!Array.isArray(vnodes)) vnodes = [vnodes];
			updateNodes(dom, dom.vnodes, Vnode.normalizeChildren(vnodes), false, hooks, null, namespace === "http://www.w3.org/1999/xhtml" ? undefined : namespace);
			dom.vnodes = vnodes;
			// document.activeElement can return null in IE https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement
			if (active != null && activeElement() !== active) active.focus();
			for (var i = 0; i < hooks.length; i++) hooks[i]();
		}
		return {render: render, setEventCallback: setEventCallback}
	};
	function throttle(callback) {
		//60fps translates to 16.6ms, round it down since setTimeout requires int
		var time = 16;
		var last = 0, pending = null;
		var timeout = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setTimeout;
		return function() {
			var now = Date.now();
			if (last === 0 || now - last >= time) {
				last = now;
				callback();
			}
			else if (pending === null) {
				pending = timeout(function() {
					pending = null;
					callback();
					last = Date.now();
				}, time - (now - last));
			}
		}
	}
	var _11 = function($window) {
		var renderService = coreRenderer($window);
		renderService.setEventCallback(function(e) {
			if (e.redraw === false) e.redraw = undefined;
			else redraw();
		});
		var callbacks = [];
		function subscribe(key1, callback) {
			unsubscribe(key1);
			callbacks.push(key1, throttle(callback));
		}
		function unsubscribe(key1) {
			var index = callbacks.indexOf(key1);
			if (index > -1) callbacks.splice(index, 2);
		}
		function redraw() {
			for (var i = 1; i < callbacks.length; i += 2) {
				callbacks[i]();
			}
		}
		return {subscribe: subscribe, unsubscribe: unsubscribe, redraw: redraw, render: renderService.render}
	};
	var redrawService = _11(window);
	requestService.setCompletionCallback(redrawService.redraw);
	var _16 = function(redrawService0) {
		return function(root, component) {
			if (component === null) {
				redrawService0.render(root, []);
				redrawService0.unsubscribe(root);
				return
			}
			
			if (component.view == null && typeof component !== "function") throw new Error("m.mount(element, component) expects a component, not a vnode")
			
			var run0 = function() {
				redrawService0.render(root, Vnode(component));
			};
			redrawService0.subscribe(root, run0);
			redrawService0.redraw();
		}
	};
	m.mount = _16(redrawService);
	var Promise = PromisePolyfill;
	var parseQueryString = function(string) {
		if (string === "" || string == null) return {}
		if (string.charAt(0) === "?") string = string.slice(1);
		var entries = string.split("&"), counters = {}, data0 = {};
		for (var i = 0; i < entries.length; i++) {
			var entry = entries[i].split("=");
			var key5 = decodeURIComponent(entry[0]);
			var value = entry.length === 2 ? decodeURIComponent(entry[1]) : "";
			if (value === "true") value = true;
			else if (value === "false") value = false;
			var levels = key5.split(/\]\[?|\[/);
			var cursor = data0;
			if (key5.indexOf("[") > -1) levels.pop();
			for (var j = 0; j < levels.length; j++) {
				var level = levels[j], nextLevel = levels[j + 1];
				var isNumber = nextLevel == "" || !isNaN(parseInt(nextLevel, 10));
				if (level === "") {
					var key5 = levels.slice(0, j).join();
					if (counters[key5] == null) {
						counters[key5] = Array.isArray(cursor) ? cursor.length : 0;
					}
					level = counters[key5]++;
				}
				// Disallow direct prototype pollution
				else if (level === "__proto__") break
				if (j === levels.length - 1) cursor[level] = value;
				else {
					// Read own properties exclusively to disallow indirect
					// prototype pollution
					var desc = Object.getOwnPropertyDescriptor(cursor, level);
					if (desc != null) desc = desc.value;
					if (desc == null) cursor[level] = desc = isNumber ? [] : {};
					cursor = desc;
				}
			}
		}
		return data0
	};
	var coreRouter = function($window) {
		var supportsPushState = typeof $window.history.pushState === "function";
		var callAsync0 = typeof setImmediate === "function" ? setImmediate : setTimeout;
		function normalize1(fragment0) {
			var data = $window.location[fragment0].replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent);
			if (fragment0 === "pathname" && data[0] !== "/") data = "/" + data;
			return data
		}
		var asyncId;
		function debounceAsync(callback0) {
			return function() {
				if (asyncId != null) return
				asyncId = callAsync0(function() {
					asyncId = null;
					callback0();
				});
			}
		}
		function parsePath(path, queryData, hashData) {
			var queryIndex = path.indexOf("?");
			var hashIndex = path.indexOf("#");
			var pathEnd = queryIndex > -1 ? queryIndex : hashIndex > -1 ? hashIndex : path.length;
			if (queryIndex > -1) {
				var queryEnd = hashIndex > -1 ? hashIndex : path.length;
				var queryParams = parseQueryString(path.slice(queryIndex + 1, queryEnd));
				for (var key4 in queryParams) queryData[key4] = queryParams[key4];
			}
			if (hashIndex > -1) {
				var hashParams = parseQueryString(path.slice(hashIndex + 1));
				for (var key4 in hashParams) hashData[key4] = hashParams[key4];
			}
			return path.slice(0, pathEnd)
		}
		var router = {prefix: "#!"};
		router.getPath = function() {
			var type2 = router.prefix.charAt(0);
			switch (type2) {
				case "#": return normalize1("hash").slice(router.prefix.length)
				case "?": return normalize1("search").slice(router.prefix.length) + normalize1("hash")
				default: return normalize1("pathname").slice(router.prefix.length) + normalize1("search") + normalize1("hash")
			}
		};
		router.setPath = function(path, data, options) {
			var queryData = {}, hashData = {};
			path = parsePath(path, queryData, hashData);
			if (data != null) {
				for (var key4 in data) queryData[key4] = data[key4];
				path = path.replace(/:([^\/]+)/g, function(match2, token) {
					delete queryData[token];
					return data[token]
				});
			}
			var query = buildQueryString(queryData);
			if (query) path += "?" + query;
			var hash = buildQueryString(hashData);
			if (hash) path += "#" + hash;
			if (supportsPushState) {
				var state = options ? options.state : null;
				var title = options ? options.title : null;
				$window.onpopstate();
				if (options && options.replace) $window.history.replaceState(state, title, router.prefix + path);
				else $window.history.pushState(state, title, router.prefix + path);
			}
			else $window.location.href = router.prefix + path;
		};
		router.defineRoutes = function(routes, resolve, reject) {
			function resolveRoute() {
				var path = router.getPath();
				var params = {};
				var pathname = parsePath(path, params, params);
				var state = $window.history.state;
				if (state != null) {
					for (var k in state) params[k] = state[k];
				}
				for (var route0 in routes) {
					var matcher = new RegExp("^" + route0.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$");
					if (matcher.test(pathname)) {
						pathname.replace(matcher, function() {
							var keys = route0.match(/:[^\/]+/g) || [];
							var values = [].slice.call(arguments, 1, -2);
							for (var i = 0; i < keys.length; i++) {
								params[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i]);
							}
							resolve(routes[route0], params, path, route0);
						});
						return
					}
				}
				reject(path, params);
			}
			if (supportsPushState) $window.onpopstate = debounceAsync(resolveRoute);
			else if (router.prefix.charAt(0) === "#") $window.onhashchange = resolveRoute;
			resolveRoute();
		};
		return router
	};
	var _20 = function($window, redrawService0) {
		var routeService = coreRouter($window);
		var identity = function(v) {return v};
		var render1, component, attrs3, currentPath, lastUpdate;
		var route = function(root, defaultRoute, routes) {
			if (root == null) throw new Error("Ensure the DOM element that was passed to `m.route` is not undefined")
			var run1 = function() {
				if (render1 != null) redrawService0.render(root, render1(Vnode(component, attrs3.key, attrs3)));
			};
			var bail = function(path) {
				if (path !== defaultRoute) routeService.setPath(defaultRoute, null, {replace: true});
				else throw new Error("Could not resolve default route " + defaultRoute)
			};
			routeService.defineRoutes(routes, function(payload, params, path) {
				var update = lastUpdate = function(routeResolver, comp) {
					if (update !== lastUpdate) return
					component = comp != null && (typeof comp.view === "function" || typeof comp === "function")? comp : "div";
					attrs3 = params, currentPath = path, lastUpdate = null;
					render1 = (routeResolver.render || identity).bind(routeResolver);
					run1();
				};
				if (payload.view || typeof payload === "function") update({}, payload);
				else {
					if (payload.onmatch) {
						Promise.resolve(payload.onmatch(params, path)).then(function(resolved) {
							update(payload, resolved);
						}, bail);
					}
					else update(payload, "div");
				}
			}, bail);
			redrawService0.subscribe(root, run1);
		};
		route.set = function(path, data, options) {
			if (lastUpdate != null) {
				options = options || {};
				options.replace = true;
			}
			lastUpdate = null;
			routeService.setPath(path, data, options);
		};
		route.get = function() {return currentPath};
		route.prefix = function(prefix0) {routeService.prefix = prefix0;};
		route.link = function(vnode1) {
			vnode1.dom.setAttribute("href", routeService.prefix + vnode1.attrs.href);
			vnode1.dom.onclick = function(e) {
				if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return
				e.preventDefault();
				e.redraw = false;
				var href = this.getAttribute("href");
				if (href.indexOf(routeService.prefix) === 0) href = href.slice(routeService.prefix.length);
				route.set(href, undefined, undefined);
			};
		};
		route.param = function(key3) {
			if(typeof attrs3 !== "undefined" && typeof key3 !== "undefined") return attrs3[key3]
			return attrs3
		};
		return route
	};
	m.route = _20(window, redrawService);
	m.withAttr = function(attrName, callback1, context) {
		return function(e) {
			callback1.call(context || this, attrName in e.currentTarget ? e.currentTarget[attrName] : e.currentTarget.getAttribute(attrName));
		}
	};
	var _28 = coreRenderer(window);
	m.render = _28.render;
	m.redraw = redrawService.redraw;
	m.request = requestService.request;
	m.jsonp = requestService.jsonp;
	m.parseQueryString = parseQueryString;
	m.buildQueryString = buildQueryString;
	m.version = "1.1.7";
	m.vnode = Vnode;
	module["exports"] = m;
	}());
	});

	var stream = createCommonjsModule(function (module) {
	(function() {
	/* eslint-enable */

	var guid = 0, HALT = {};
	function createStream() {
		function stream() {
			if (arguments.length > 0 && arguments[0] !== HALT) updateStream(stream, arguments[0]);
			return stream._state.value
		}
		initStream(stream);

		if (arguments.length > 0 && arguments[0] !== HALT) updateStream(stream, arguments[0]);

		return stream
	}
	function initStream(stream) {
		stream.constructor = createStream;
		stream._state = {id: guid++, value: undefined, state: 0, derive: undefined, recover: undefined, deps: {}, parents: [], endStream: undefined, unregister: undefined};
		stream.map = stream["fantasy-land/map"] = map, stream["fantasy-land/ap"] = ap, stream["fantasy-land/of"] = createStream;
		stream.valueOf = valueOf, stream.toJSON = toJSON, stream.toString = valueOf;

		Object.defineProperties(stream, {
			end: {get: function() {
				if (!stream._state.endStream) {
					var endStream = createStream();
					endStream.map(function(value) {
						if (value === true) {
							unregisterStream(stream);
							endStream._state.unregister = function(){unregisterStream(endStream);};
						}
						return value
					});
					stream._state.endStream = endStream;
				}
				return stream._state.endStream
			}}
		});
	}
	function updateStream(stream, value) {
		updateState(stream, value);
		for (var id in stream._state.deps) updateDependency(stream._state.deps[id], false);
		if (stream._state.unregister != null) stream._state.unregister();
		finalize(stream);
	}
	function updateState(stream, value) {
		stream._state.value = value;
		stream._state.changed = true;
		if (stream._state.state !== 2) stream._state.state = 1;
	}
	function updateDependency(stream, mustSync) {
		var state = stream._state, parents = state.parents;
		if (parents.length > 0 && parents.every(active) && (mustSync || parents.some(changed))) {
			var value = stream._state.derive();
			if (value === HALT) return false
			updateState(stream, value);
		}
	}
	function finalize(stream) {
		stream._state.changed = false;
		for (var id in stream._state.deps) stream._state.deps[id]._state.changed = false;
	}

	function combine(fn, streams) {
		if (!streams.every(valid)) throw new Error("Ensure that each item passed to stream.combine/stream.merge is a stream")
		return initDependency(createStream(), streams, function() {
			return fn.apply(this, streams.concat([streams.filter(changed)]))
		})
	}

	function initDependency(dep, streams, derive) {
		var state = dep._state;
		state.derive = derive;
		state.parents = streams.filter(notEnded);

		registerDependency(dep, state.parents);
		updateDependency(dep, true);

		return dep
	}
	function registerDependency(stream, parents) {
		for (var i = 0; i < parents.length; i++) {
			parents[i]._state.deps[stream._state.id] = stream;
			registerDependency(stream, parents[i]._state.parents);
		}
	}
	function unregisterStream(stream) {
		for (var i = 0; i < stream._state.parents.length; i++) {
			var parent = stream._state.parents[i];
			delete parent._state.deps[stream._state.id];
		}
		for (var id in stream._state.deps) {
			var dependent = stream._state.deps[id];
			var index = dependent._state.parents.indexOf(stream);
			if (index > -1) dependent._state.parents.splice(index, 1);
		}
		stream._state.state = 2; //ended
		stream._state.deps = {};
	}

	function map(fn) {return combine(function(stream) {return fn(stream())}, [this])}
	function ap(stream) {return combine(function(s1, s2) {return s1()(s2())}, [stream, this])}
	function valueOf() {return this._state.value}
	function toJSON() {return this._state.value != null && typeof this._state.value.toJSON === "function" ? this._state.value.toJSON() : this._state.value}

	function valid(stream) {return stream._state }
	function active(stream) {return stream._state.state === 1}
	function changed(stream) {return stream._state.changed}
	function notEnded(stream) {return stream._state.state !== 2}

	function merge(streams) {
		return combine(function() {
			return streams.map(function(s) {return s()})
		}, streams)
	}

	function scan(reducer, seed, stream) {
		var newStream = combine(function (s) {
			return seed = reducer(seed, s._state.value)
		}, [stream]);

		if (newStream._state.state === 0) newStream(seed);

		return newStream
	}

	function scanMerge(tuples, seed) {
		var streams = tuples.map(function(tuple) {
			var stream = tuple[0];
			if (stream._state.state === 0) stream(undefined);
			return stream
		});

		var newStream = combine(function() {
			var changed = arguments[arguments.length - 1];

			streams.forEach(function(stream, idx) {
				if (changed.indexOf(stream) > -1) {
					seed = tuples[idx][1](seed, stream._state.value);
				}
			});

			return seed
		}, streams);

		return newStream
	}

	createStream["fantasy-land/of"] = createStream;
	createStream.merge = merge;
	createStream.combine = combine;
	createStream.scan = scan;
	createStream.scanMerge = scanMerge;
	createStream.HALT = HALT;

	module["exports"] = createStream;

	}());
	});

	var stream$1 = stream;

	var pseudos = [
	  ':active',
	  ':any',
	  ':checked',
	  ':default',
	  ':disabled',
	  ':empty',
	  ':enabled',
	  ':first',
	  ':first-child',
	  ':first-of-type',
	  ':fullscreen',
	  ':focus',
	  ':hover',
	  ':indeterminate',
	  ':in-range',
	  ':invalid',
	  ':last-child',
	  ':last-of-type',
	  ':left',
	  ':link',
	  ':only-child',
	  ':only-of-type',
	  ':optional',
	  ':out-of-range',
	  ':read-only',
	  ':read-write',
	  ':required',
	  ':right',
	  ':root',
	  ':scope',
	  ':target',
	  ':valid',
	  ':visited',

	  // With value
	  ':dir',
	  ':lang',
	  ':not',
	  ':nth-child',
	  ':nth-last-child',
	  ':nth-last-of-type',
	  ':nth-of-type',

	  // Elements
	  '::after',
	  '::before',
	  '::first-letter',
	  '::first-line',
	  '::selection',
	  '::backdrop',
	  '::placeholder',
	  '::marker',
	  '::spelling-error',
	  '::grammar-error'
	];

	var popular = {
	  ai : 'alignItems',
	  b  : 'bottom',
	  bc : 'backgroundColor',
	  br : 'borderRadius',
	  bs : 'boxShadow',
	  bi : 'backgroundImage',
	  c  : 'color',
	  d  : 'display',
	  f  : 'float',
	  fd : 'flexDirection',
	  ff : 'fontFamily',
	  fs : 'fontSize',
	  h  : 'height',
	  jc : 'justifyContent',
	  l  : 'left',
	  lh : 'lineHeight',
	  ls : 'letterSpacing',
	  m  : 'margin',
	  mb : 'marginBottom',
	  ml : 'marginLeft',
	  mr : 'marginRight',
	  mt : 'marginTop',
	  o  : 'opacity',
	  p  : 'padding',
	  pb : 'paddingBottom',
	  pl : 'paddingLeft',
	  pr : 'paddingRight',
	  pt : 'paddingTop',
	  r  : 'right',
	  t  : 'top',
	  ta : 'textAlign',
	  td : 'textDecoration',
	  tt : 'textTransform',
	  w  : 'width'
	};

	var cssProperties = ['float'].concat(Object.keys(
	  typeof document === 'undefined'
	    ? {}
	    : findWidth(document.documentElement.style)
	).filter(function (p) { return p.indexOf('-') === -1 && p !== 'length'; }));

	function findWidth(obj) {
	  return obj
	    ? obj.hasOwnProperty('width')
	      ? obj
	      : findWidth(Object.getPrototypeOf(obj))
	    : {}
	}

	var isProp = /^-?-?[a-z][a-z-_0-9]*$/i;

	var memoize = function (fn, cache) {
	  if ( cache === void 0 ) cache = {};

	  return function (item) { return item in cache
	    ? cache[item]
	    : cache[item] = fn(item); };
	};

	function add(style, prop, values) {
	  if (prop in style) // Recursively increase specificity
	    { add(style, '!' + prop, values); }
	  else
	    { style[prop] = formatValues(prop, values); }
	}

	var vendorMap = Object.create(null, {});
	var vendorValuePrefix = Object.create(null, {});

	var vendorRegex = /^(o|O|ms|MS|Ms|moz|Moz|webkit|Webkit|WebKit)([A-Z])/;

	var appendPx = memoize(function (prop) {
	  var el = document.createElement('div');

	  try {
	    el.style[prop] = '1px';
	    el.style.setProperty(prop, '1px');
	    return el.style[prop].slice(-3) === '1px' ? 'px' : ''
	  } catch (err) {
	    return ''
	  }
	}, {
	  flex: '',
	  boxShadow: 'px',
	  border: 'px',
	  borderTop: 'px',
	  borderRight: 'px',
	  borderBottom: 'px',
	  borderLeft: 'px'
	});

	function lowercaseFirst(string) {
	  return string.charAt(0).toLowerCase() + string.slice(1)
	}

	function assign(obj, obj2) {
	  for (var key in obj2) {
	    if (obj2.hasOwnProperty(key))
	      { obj[key] = obj2[key]; }
	  }
	  return obj
	}

	function hyphenToCamelCase(hyphen) {
	  return hyphen.slice(hyphen.charAt(0) === '-' ? 1 : 0).replace(/-([a-z])/g, function(match) {
	    return match[1].toUpperCase()
	  })
	}

	function camelCaseToHyphen(camelCase) {
	  return camelCase.replace(/(\B[A-Z])/g, '-$1').toLowerCase()
	}

	function initials(camelCase) {
	  return camelCase.charAt(0) + (camelCase.match(/([A-Z])/g) || []).join('').toLowerCase()
	}

	function objectToRules(style, selector, suffix, single) {
	  if ( suffix === void 0 ) suffix = '';

	  var base = {};

	  var rules = [];

	  Object.keys(style).forEach(function (prop) {
	    if (prop.charAt(0) === '@')
	      { rules.push(prop + '{' + objectToRules(style[prop], selector, suffix, single) + '}'); }
	    else if (typeof style[prop] === 'object')
	      { rules = rules.concat(objectToRules(style[prop], selector, suffix + prop, single)); }
	    else
	      { base[prop] = style[prop]; }
	  });

	  if (Object.keys(base).length) {
	    rules.unshift(
	      ((single || (suffix.charAt(0) === ' ') ? '' : '&') + '&' + suffix).replace(/&/g, selector) +
	      '{' + stylesToCss(base) + '}'
	    );
	  }

	  return rules
	}

	var selectorSplit = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

	function stylesToCss(style) {
	  return Object.keys(style).reduce(function (acc, prop) { return acc + propToString(prop.replace(/!/g, ''), style[prop]); }
	  , '')
	}

	function propToString(prop, value) {
	  prop = prop in vendorMap ? vendorMap[prop] : prop;
	  return (vendorRegex.test(prop) ? '-' : '')
	    + (cssVar(prop)
	      ? prop
	      : camelCaseToHyphen(prop)
	    )
	    + ':'
	    + value
	    + ';'
	}

	function formatValues(prop, value) {
	  return Array.isArray(value)
	    ? value.map(function (v) { return formatValue(prop, v); }).join(' ')
	    : typeof value === 'string'
	      ? formatValues(prop, value.split(' '))
	      : formatValue(prop, value)
	}

	function formatValue(prop, value) {
	  return value in vendorValuePrefix
	    ? vendorValuePrefix[value]
	    : value + (isNaN(value) || value === null || typeof value === 'boolean' || cssVar(prop) ? '' : appendPx(prop))
	}

	function cssVar(prop) {
	  return prop.charAt(0) === '-' && prop.charAt(1) === '-'
	}

	var styleSheet = typeof document === 'object' && document.createElement('style');
	styleSheet && document.head && document.head.appendChild(styleSheet);

	var sheet = styleSheet && styleSheet.sheet;

	var debug = false;
	var classes = Object.create(null, {});
	var rules = [];
	var count = 0;

	var classPrefix = 'b' + ('000' + ((Math.random() * 46656) | 0).toString(36)).slice(-3) +
	                    ('000' + ((Math.random() * 46656) | 0).toString(36)).slice(-3);

	function setDebug(d) {
	  debug = d;
	}

	function getSheet() {
	  var content = rules.join('');
	  rules = [];
	  classes = Object.create(null, {});
	  count = 0;
	  return content
	}

	function getRules() {
	  return rules
	}

	function insert(rule, index) {
	  rules.push(rule);

	  if (debug)
	    { return styleSheet.textContent = rules.join('\n') }

	  try {
	    sheet && sheet.insertRule(rule, arguments.length > 1
	      ? index
	      : sheet.cssRules.length);
	  } catch (e) {
	    // Ignore thrown errors in eg. firefox for unsupported strings (::-webkit-inner-spin-button)
	  }
	}

	function createClass(style) {
	  var json = JSON.stringify(style);

	  if (json in classes)
	    { return classes[json] }

	  var className = classPrefix + (++count)
	      , rules = objectToRules(style, '.' + className);

	  for (var i = 0; i < rules.length; i++)
	    { insert(rules[i]); }

	  classes[json] = className;

	  return className
	}

	/* eslint no-invalid-this: 0 */

	var shorts = Object.create(null);

	function bss(input, value) {
	  var b = chain(bss);
	  input && assign(b.__style, parse.apply(null, arguments));
	  return b
	}

	function setProp(prop, value) {
	  Object.defineProperty(bss, prop, {
	    configurable: true,
	    value: value
	  });
	}

	Object.defineProperties(bss, {
	  __style: {
	    configurable: true,
	    writable: true,
	    value: {}
	  },
	  valueOf: {
	    configurable: true,
	    writable: true,
	    value: function() {
	      return '.' + this.class
	    }
	  },
	  toString: {
	    configurable: true,
	    writable: true,
	    value: function() {
	      return this.class
	    }
	  }
	});

	setProp('setDebug', setDebug);

	setProp('$keyframes', keyframes);
	setProp('$media', $media);
	setProp('$import', $import);
	setProp('$nest', $nest);
	setProp('getSheet', getSheet);
	setProp('getRules', getRules);
	setProp('helper', helper);
	setProp('css', css);
	setProp('classPrefix', classPrefix);

	function chain(instance) {
	  var newInstance = Object.create(bss, {
	    __style: {
	      value: assign({}, instance.__style)
	    },
	    style: {
	      enumerable: true,
	      get: function() {
	        var this$1 = this;

	        return Object.keys(this.__style).reduce(function (acc, key) {
	          if (typeof this$1.__style[key] === 'number' || typeof this$1.__style[key] === 'string')
	            { acc[key.replace(/^!/, '')] = this$1.__style[key]; }
	          return acc
	        }, {})
	      }
	    }
	  });

	  if (instance === bss)
	    { bss.__style = {}; }

	  return newInstance
	}

	cssProperties.forEach(function (prop) {
	  var vendor = prop.match(vendorRegex);
	  if (vendor) {
	    var unprefixed = lowercaseFirst(prop.replace(vendorRegex, '$2'));
	    if (cssProperties.indexOf(unprefixed) === -1) {
	      if (unprefixed === 'flexDirection')
	        { vendorValuePrefix.flex = '-' + vendor[1].toLowerCase() + '-flex'; }

	      vendorMap[unprefixed] = prop;
	      setProp(unprefixed, setter(prop));
	      setProp(short(unprefixed), bss[unprefixed]);
	      return
	    }
	  }

	  setProp(prop, setter(prop));
	  setProp(short(prop), bss[prop]);
	});

	setProp('content', function Content(arg) {
	  var b = chain(this);
	  arg === null || arg === undefined || arg === false
	    ? delete b.__style.content
	    : b.__style.content = '"' + arg + '"';
	  return b
	});

	Object.defineProperty(bss, 'class', {
	  set: function(value) {
	    this.__class = value;
	  },
	  get: function() {
	    return this.__class || createClass(this.__style)
	  }
	});

	function $media(value, style) {
	  var b = chain(this);
	  if (value)
	    { b.__style['@media ' + value] = parse(style); }

	  return b
	}

	function $import(value) {
	  if (value)
	    { insert('@import ' + value + ';', 0); }

	  return chain(this)
	}

	function $nest(selector, properties) {
	  var b = chain(this);
	  if (arguments.length === 1)
	    { Object.keys(selector).forEach(function (x) { return addNest(b.__style, x, selector[x]); }); }
	  else if (selector)
	    { addNest(b.__style, selector, properties); }

	  return b
	}

	function addNest(style, selector, properties) {
	  style[
	    selector.split(selectorSplit).map(function (x) {
	      x = x.trim();
	      return (x.charAt(0) === ':' || x.charAt(0) === '[' ? '' : ' ') + x
	    }).join(',&')
	  ] = parse(properties);
	}

	pseudos.forEach(function (name) { return setProp('$' + hyphenToCamelCase(name.replace(/:/g, '')), function Pseudo(value, style) {
	    var b = chain(this);
	    if (isTagged(value))
	      { b.__style[name] = parse.apply(null, arguments); }
	    else if (value || style)
	      { b.__style[name + (style ? '(' + value + ')' : '')] = parse(style || value); }
	    return b
	  }); }
	);

	function setter(prop) {
	  return function CssProperty(value) {
	    var b = chain(this);
	    if (!value && value !== 0)
	      { delete b.__style[prop]; }
	    else if (arguments.length > 0)
	      { add(b.__style, prop, Array.prototype.slice.call(arguments)); }

	    return b
	  }
	}

	function css(selector, style) {
	  if (arguments.length === 1)
	    { Object.keys(selector).forEach(function (key) { return addCss(key, selector[key]); }); }
	  else
	    { addCss(selector, style); }

	  return chain(this)
	}

	function addCss(selector, style) {
	  objectToRules(parse(style), selector, '', true).forEach(insert);
	}

	function helper(name, styling) {
	  if (arguments.length === 1)
	    { return Object.keys(name).forEach(function (key) { return helper(key, name[key]); }) }

	  delete bss[name]; // Needed to avoid weird get calls in chrome

	  if (typeof styling === 'function') {
	    helper[name] = styling;
	    Object.defineProperty(bss, name, {
	      configurable: true,
	      value: function Helper(input) {
	        var b = chain(this);
	        var result = isTagged(input)
	          ? styling(raw(input, arguments))
	          : styling.apply(null, arguments);
	        assign(b.__style, result.__style);
	        return b
	      }
	    });
	  } else {
	    helper[name] = parse(styling);
	    Object.defineProperty(bss, name, {
	      configurable: true,
	      get: function() {
	        var b = chain(this);
	        assign(b.__style, parse(styling));
	        return b
	      }
	    });
	  }
	}

	bss.helper('$animate', function (value, props) { return bss.animation(bss.$keyframes(props) + ' ' + value); }
	);

	function short(prop) {
	  var acronym = initials(prop)
	      , short = popular[acronym] && popular[acronym] !== prop ? prop : acronym;

	  shorts[short] = prop;
	  return short
	}

	var stringToObject = memoize(function (string) {
	  var last = ''
	    , prev;

	  return string.trim().replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*/g, '').split(/;|\n/).reduce(function (acc, line) {
	    if (!line)
	      { return acc }
	    line = last + line.trim();
	    var ref = line.replace(/[ :]+/, ' ').split(' ');
	    var key = ref[0];
	    var tokens = ref.slice(1);

	    last = line.charAt(line.length - 1) === ',' ? line : '';
	    if (last)
	      { return acc }

	    if (line.charAt(0) === ',' || !isProp.test(key)) {
	      acc[prev] += ' ' + line;
	      return acc
	    }

	    if (!key)
	      { return acc }

	    var prop = key.charAt(0) === '-' && key.charAt(1) === '-'
	      ? key
	      : hyphenToCamelCase(key);

	    prev = shorts[prop] || prop;

	    if (prop in helper) {
	      typeof helper[prop] === 'function'
	        ? assign(acc, helper[prop].apply(helper, tokens).__style)
	        : assign(acc, helper[prop]);
	    } else if (tokens.length > 0) {
	      add(acc, prev, tokens);
	    }

	    return acc
	  }, {})
	});

	var count$1 = 0;
	var keyframeCache = {};

	function keyframes(props) {
	  var content = Object.keys(props).reduce(function (acc, key) { return acc + key + '{' + stylesToCss(parse(props[key])) + '}'; }
	  , '');

	  if (content in keyframeCache)
	    { return keyframeCache[content] }

	  var name = classPrefix + count$1++;
	  keyframeCache[content] = name;
	  insert('@keyframes ' + name + '{' + content + '}');

	  return name
	}

	function parse(input, value) {
	  var obj;

	  if (typeof input === 'string') {
	    if (typeof value === 'string' || typeof value === 'number')
	      { return (( obj = {}, obj[input] = value, obj )) }

	    return stringToObject(input)
	  } else if (isTagged(input)) {
	    return stringToObject(raw(input, arguments))
	  }

	  return input.__style || sanitize(input)
	}

	function isTagged(input) {
	  return Array.isArray(input) && typeof input[0] === 'string'
	}

	function raw(input, args) {
	  var str = '';
	  for (var i = 0; i < input.length; i++)
	    { str += input[i] + (args[i + 1] || ''); }
	  return str
	}

	function sanitize(styles) {
	  return Object.keys(styles).reduce(function (acc, key) {
	    var value = styles[key];
	    key = shorts[key] || key;

	    if (!value && value !== 0 && value !== '')
	      { return acc }

	    if (key === 'content' && value.charAt(0) !== '"')
	      { acc[key] = '"' + value + '"'; }
	    else if (typeof value === 'object')
	      { acc[key] = sanitize(value); }
	    else
	      { add(acc, key, value); }

	    return acc
	  }, {})
	}

	function _toConsumableArray(arr) {
	  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
	}

	function _arrayWithoutHoles(arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

	    return arr2;
	  }
	}

	function _iterableToArray(iter) {
	  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
	}

	function _nonIterableSpread() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance");
	}

	// models/Entry.js
	var Entry = {};
	var store = [];
	var idCounter = 1;

	Entry.all = function () {
	  return store;
	};

	Entry.create = function (attrs) {
	  attrs.id = idCounter += 1;
	  store.push(attrs);
	  return attrs;
	};

	Entry.vm = function () {
	  return {
	    enteredAt: null,
	    volunteers: [Entry.volunteerVM()]
	  };
	};

	Entry.volunteerVM = function () {
	  return {
	    name: '[Your name]',
	    email: '[Your email]'
	  };
	};

	// src/components/EntryList.js

	Entry.create({
	  "enteredAt": 1443018758199,
	  "volunteers": [{
	    name: "Alice",
	    email: "alice@example.com"
	  }, {
	    name: "Bob",
	    email: "bob@example.com"
	  }]
	});
	Entry.create({
	  "enteredAt": 1443019047227,
	  "volunteers": [{
	    name: "Carl",
	    email: "carl@example.com"
	  }, {
	    name: "Dan",
	    email: "dan@example.com"
	  }, {
	    name: "Erl",
	    email: "erl@example.com"
	  }]
	});

	// models/Navigation.js
	var Navigation = {};
	var store$1 = [];
	var idCounter$1 = 1;

	Navigation.all = function () {
	  return store$1;
	};

	Navigation.create = function (attrs) {
	  attrs.id = idCounter$1 += 1;
	  store$1.push(attrs);
	  return attrs;
	};

	Navigation.vm = function () {
	  return {
	    // enteredAt: null,
	    buttons: [Navigation.buttonVM()]
	  };
	};

	Navigation.buttonVM = function () {
	  return {
	    name: '[Button name]',
	    link: '[Button link]'
	  };
	};

	// src/components/FiveChildrenComp.js

	Navigation.create({
	  // "enteredAt": 1443018758199,
	  "buttons": [{
	    name: "O projektu",
	    link: "/#!/about"
	  }, {
	    name: "Kako ukrepati",
	    link: "/#!/help"
	  }, {
	    name: "Izobraževaje",
	    link: "/#!/learn"
	  }, {
	    name: "Gradiva",
	    link: "/#!/read"
	  }, {
	    name: "Gradiva",
	    link: "/#!/read"
	  }]
	}); // Navigation.create({
	//     "enteredAt": 1443019047227,
	//     "buttons": [
	//         { name: "Carl", email: "carl@example.com" },
	//         { name: "Dan", email: "dan@example.com" },
	//         { name: "Erl", email: "erl@example.com" },
	//     ]
	// })

	var KidSVG = {
	  view: function view(vnode) {
	    return m("svg[clip-rule='evenodd'][fill-rule='evenodd'][stroke-linejoin='round'][stroke-miterlimit='1.414'][viewBox='0 0 200 300'][xmlns='http://www.w3.org/2000/svg']" + bss.fill("white").w("100%").transition("all 0.5s ease-in").h("100%").$hover(bss.fill("#8f2426")), m("path[d='M64.775 300H22.626l47.801-130.848-4.886-55.25L0 175.47v-41.1l65.541-59.303h12.438c-12.617-6.832-21.164-19.965-21.164-35.031C56.815 17.939 75.203 0 97.85 0c.557 0 1.124.011 1.681.033h.001A42.933 42.933 0 0 1 101.214 0c22.647 0 41.035 17.939 41.035 40.036 0 15.066-8.548 28.199-21.164 35.031h12.437L200 134.37v41.1l-66.478-61.568-4.885 55.25L176.438 300h-42.149l-34.757-75.926v.001l-.001-.001L64.775 300z']"));
	  }
	};
	var NavigationMenu = {
	  view: function view() {
	    return m('.test', [Navigation.all().map(NavigationView)]);
	  }
	};

	function NavigationView(Navigation$$1) {
	  var date = new Date(Navigation$$1.enteredAt);
	  return m('.test2', [// m('label', "Entered at: ", date.toString()),
	  m('ul' + bss.display("flex").jc("space-around").listStyle("none"), Navigation$$1.buttons.map(navigationView))]);
	}

	function navigationView(buttons) {
	  return m('li.btn' + bss.flex().textAlign('center').tt('uppercase').fs('2.3rem').fontWeight(900), [m(KidSVG)]);
	}

	window.VideoLibrary = {};
	var store$2 = [];
	var idCounter$2 = 1;

	VideoLibrary.all = function () {
	  return store$2;
	};

	VideoLibrary.create = function (attrs) {
	  attrs.id = idCounter$2 += 1;
	  store$2.push(attrs);
	  return attrs;
	};

	VideoLibrary.vm = function () {
	  return {
	    // enteredAt: null,
	    videos: [VideoLibrary.videoVM()]
	  };
	};

	VideoLibrary.videoVM = function () {
	  return {
	    label: '[Some label]',
	    link: '[Some link]'
	  };
	};

	// src/components/VideoComp.js

	VideoLibrary.create({
	  "videos": [{
	    link: "https://www.youtube.com/embed/bc9i0T_9PL4",
	    label: "Svet Evrope: Kiko in roka."
	  }, {
	    link: "https://www.youtube.com/embed/fxb_8JMWJkk",
	    label: "Svet Evrope: Povej nekomu, ki mu zaupaš."
	  }, {
	    link: "https://www.youtube.com/embed/J19lRLb-wwY",
	    label: "Miti o spolni zlorabi, v katere verjamemo, 1."
	  }, {
	    link: "https://www.youtube.com/embed/T2pSkJ37KPY",
	    label: "Miti o spolni zlorabi, v katere verjamemo, 2."
	  }, {
	    link: "https://www.youtube.com/embed/CWfJUSHNsvU",
	    label: "Otroka krepi informacija"
	  }, {
	    link: "https://www.youtube.com/embed/E-5STlOkHLo",
	    label: "Spletno oko:Posnetki spolnih zlorab otrok - za vedno prikazana spolna zloraba"
	  }, {
	    link: "https://www.youtube.com/embed/gBUXBja98KU",
	    label: "Neža Miklič: kampanja \"Reci ne nasilju\""
	  }, {
	    link: "https://www.youtube.com/embed/M9Go2-Dxxx0",
	    label: "Infodrom: Spletne zlorabe"
	  }, {
	    link: "https://www.youtube.com/embed/9nfaQbRYSNg",
	    label: "Robova in Sueina zgodba: Posnetki spolne zlorabe so po 15 letih še vedno na spletu."
	  }, {
	    link: "https://www.youtube.com/embed/iA4Xg95SdyE",
	    label: "Novo je, da sem bila zlorabljena - Incest Trauma Centar, Beograd"
	  }, {
	    link: "https://www.youtube.com/embed/fIgU-cpgh_4",
	    label: "Incest Trauma Centar - Beograd, Hajde da pričamo o seksualnom nasilju"
	  }, {
	    link: "https://www.youtube.com/embed/0I2gVdBmA-s",
	    label: "Committee for Children: How to Talk with Kids About Sexual Abuse."
	  }, {
	    link: "https://www.youtube.com/embed/SBMvevd9BrU",
	    label: "ECPAT: Stop sexual exploitation of a child."
	  }]
	}); // components

	var Video = {
	  view: function view() {
	    return m('.video-library', [VideoLibrary.all().map(videoLibraryView)]);
	  }
	};

	function videoLibraryView(video) {
	  return m('section.video', [// m('h1.title.is-2', 'Video vsebina <section>'),
	  m('.video-grid' + bss.overflow('hidden').display('grid').gridTemplateColumns('1fr').gridTemplateRows('auto').$media('(min-width:801px)', bss.gridTemplateColumns('1fr 1fr 1fr').gridTemplateRows('auto').gridGap('1em')), video.videos.map(videoView))]);
	}

	function videoView(entry) {
	  return m('.video-item.video-wrap' + bss.position('relative').w('100%').h(0).paddingBottom('56.27198%'), [m('iframe' + bss.position('absolute').top(0).left(0).w('100%').h('100%'), {
	    "src": entry.link,
	    "frameborder": "0",
	    "allow": "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture",
	    "allowfullscreen": "allowfullscreen"
	  }), m("p", entry.label)]);
	} // function videoView (entry) {

	var About = {};
	var store$3 = [];
	var idCounter$3 = 1;

	About.all = function () {
	  return store$3;
	};

	About.create = function (attrs) {
	  attrs.id = idCounter$3 += 1;
	  store$3.push(attrs);
	  return attrs;
	};

	About.vm = function () {
	  return {
	    // enteredAt: null,
	    elements: [About.elementVM()]
	  };
	};

	About.elementVM = function () {
	  return {
	    label: '[Some label]',
	    link: '[Some link]'
	  };
	};

	// src/components/EntryList.js

	About.create({
	  "elements": [{
	    link: "https://www.eventim.si/si",
	    label: "eventim.si"
	  }, {
	    link: "",
	    label: "Delo Revije"
	  }, {
	    link: "https://radiostudent.si/",
	    label: "Radio Študent"
	  }, {
	    link: "http://mediabus.si",
	    label: "Media Bus"
	  }, {
	    link: "http://tam-tam.si",
	    label: "TAM-TAM"
	  }, {
	    link: "https://www.europlakat.si",
	    label: "Europlakat"
	  }]
	}); // components

	var AboutComp = {
	  view: function view() {
	    return m('.about', [About.all().map(AboutView)]);
	  }
	};

	function AboutView(data) {
	  return m('section', [m('h1.title.is-2', 'Medijska podpora <section>'), m('ul', data.elements.map(sectionView))]);
	}

	function sectionView(el) {
	  return m('li.el', [m('a', {
	    "href": el.link
	  }, el.label)]);
	}

	/**
	This Overlay component provides a full-screen cover element.
	It is mounted to a separate V/DOM tree appended to the body.
	Children supplied to Overlay are rendered into this tree.
	The Overlay component can be nested anywhere within your app's
	view but will be rendered to display overtop everything else.
	*/

	var Overlay = function Overlay() {
	  var dom;
	  var children;
	  var OverlayContainer = {
	    view: function view() {
	      return children;
	    }
	  };
	  return {
	    oncreate: function oncreate(v) {
	      children = v.children; // Append a container to the end of body

	      dom = document.createElement('div');
	      dom.className = 'overlay';
	      document.body.appendChild(dom); // Mount a separate VDOM tree here

	      mithril.mount(dom, OverlayContainer);
	    },
	    onbeforeupdate: function onbeforeupdate(v) {
	      children = v.children;
	    },
	    onbeforeremove: function onbeforeremove() {
	      // Add a class with fade-out exit animation
	      dom.classList.add('hide');
	      return new Promise(function (r) {
	        dom.addEventListener('animationend', r);
	      });
	    },
	    onremove: function onremove() {
	      // Destroy the overlay dom tree. Using m.mount with
	      // null triggers any modal children removal hooks.
	      mithril.mount(dom, null);
	      document.body.removeChild(dom);
	    },
	    view: function view() {}
	  };
	};

	var LazyLoad = function LazyLoad() {
	  // let showModal = false
	  return {
	    oninit: function oninit(vnode) {
	      initialData = vnode.attrs.data;
	    },
	    view: function view(vnode) {
	      return mithril('.youtube', {
	        "data-embed": "AqcjdkPMPJA"
	      }, mithril('div.play-button'));
	    }
	  };
	};
	// m("div", {"class":"play-button"})
	// ),
	// function ComponentWithState() {
	//     var initialData
	//     return {
	//         oninit: function(vnode) {
	//             initialData = vnode.attrs.data
	//         },
	//         view: function(vnode) {
	//             return [
	//                 // displays data from initialization time:
	//                 m("div", "Initial: " + initialData),
	//                 // displays current data:
	//                 m("div", "Current: " + vnode.attrs.data)
	//             ]
	//         }
	//     }
	// }

	/**
	This Modal component uses the Overlay component to provide a
	full screen cover and renders a dialog-like widget within that
	waits for the user to click a button. A Modal instance can
	be nested anywhere within your app's view and will be rendered
	on top of everything else.

	Expected attrs are as follows:

	interface Attrs {
	  title: m.Children
	  content: m.Children
	  buttons: {id: string, text: string}[]
	  onClose(id: string): void
	}

	At least one button should be provided otherwise there
	will be no way to close the modal.
	*/

	var Modal$1 = function Modal(v) {
	  var clickedId;
	  return {
	    view: function view(_ref) {
	      var _ref$attrs = _ref.attrs,
	          title = _ref$attrs.title,
	          content = _ref$attrs.content,
	          buttons = _ref$attrs.buttons,
	          onClose = _ref$attrs.onClose;

	      if (clickedId != null) {
	        // We need to allow the Overlay component execute its
	        // exit animation. Because it is a child of this component,
	        // it will not fire when this component is removed.
	        // Instead, we need to remove it first before this component
	        // goes away.
	        // When a button is clicked, we omit the Overlay component
	        // from this Modal component's next view render, which will
	        // trigger Overlay's onbeforeremove hook.
	        return null;
	      }

	      return mithril(Overlay, {
	        onremove: function onremove() {
	          // Wait for the overlay's removal animation to complete.
	          // Then we fire our parent's callback, which will
	          // presumably remove this Modal component.
	          Promise.resolve().then(function () {
	            onClose(clickedId);
	            mithril.redraw();
	          });
	        }
	      }, mithril('.Xmodal', mithril('h3', title), mithril('.Xmodal-content', content), mithril(LazyLoad), mithril('.modal-buttons', buttons.map(function (b) {
	        return mithril('button', {
	          type: 'button',
	          disabled: clickedId != null,
	          onclick: function onclick() {
	            clickedId = b.id;
	          }
	        }, b.text);
	      }))));
	    }
	  };
	};

	var ModalDemo = function ModalDemo() {
	  var showModal = false;
	  return {
	    view: function view() {
	      return mithril('.app', mithril('h1', 'Modal Demo'), mithril('p', 'Click below to open a modal'), mithril('p', mithril('button', {
	        type: 'button',
	        onclick: function onclick() {
	          showModal = true;
	        }
	      }, 'Open Modal'), // Even though this modal is nested within our App vdom,
	      // it will appear on top of everything else, appended 
	      // to the end of document body.
	      showModal && mithril(Modal$1, {
	        title: 'Hello Modal!',
	        content: 'Click the button below to close.',
	        buttons: [{
	          id: 'close',
	          text: 'Close'
	        }],
	        onClose: function onClose(id) {
	          showModal = false;
	        }
	      })));
	    }
	  };
	};

	var HelpContact = {};
	var store$4 = [];
	var idCounter$4 = 1;

	HelpContact.all = function () {
	  return store$4;
	};

	HelpContact.create = function (attrs) {
	  attrs.id = idCounter$4 += 1;
	  store$4.push(attrs);
	  return attrs;
	};

	HelpContact.vm = function () {
	  return {
	    // enteredAt: null,
	    elements: [HelpContact.elementVM()]
	  };
	};

	HelpContact.elementVM = function () {
	  return {
	    label: '[Some label]',
	    link: '[Some link]'
	  };
	};

	// src/components/HelpContactComp.js

	HelpContact.create({
	  "contacts": [{
	    id: "1",
	    link: "http://www.drustvo-sos.si",
	    label: "SOS telefon (080 1155)"
	  }, {
	    id: "2",
	    link: "http://www.e-tom.si",
	    label: "TOM telefon (116 111)"
	  }, {
	    id: "3",
	    link: "https://www.drustvo-dnk.si",
	    label: "Društvo za nenasilno komunikacijo (01 4344822 v Ljubljani ali 05 6393170 in 031 546098 v Kopru)"
	  }, {
	    id: "4",
	    link: "http://www.drustvo-zenska-svetovalnica.si",
	    label: "Ženska svetovalnica (031 233211)"
	  }, {
	    id: "5",
	    link: "https://fdinstitut.si",
	    label: "Frančiškanski družinski inštitut (01 2006760 ali 040 863986)"
	  }, {
	    id: "6",
	    link: "http://www.luninavila.si",
	    label: "Lunina vila"
	  }, {
	    id: "7",
	    link: "http://www.beliobroc.si",
	    label: "Beli obroč Slovenije"
	  }, {
	    id: "8",
	    link: "http://spolna-zloraba.si/index.php/dejavnosti-2/breplacni-telefon",
	    label: "Združenje proti spolnemu zlorabljanju (080 2880)"
	  }, {
	    id: "9",
	    link: "http://www.spletno-oko.si",
	    label: "Kam prijaviti nezakonite vsebine"
	  }, {
	    id: "10",
	    link: "http://www.safe.si",
	    label: "Center za varnejši internet"
	  }]
	}); // components

	var HelpContactComp = {
	  view: function view() {
	    return m('.help-contact' + bss.bc("#ffffff    "), [HelpContact.all().map(HelpContactView)]);
	  }
	};

	function HelpContactView(contact) {
	  return m('section.help-contact', [m('h2.subtitle.is-3', 'Na koga se obrniti'), // TODO move to model
	  m('ul' + bss.listStyle("none").marginLeft("1em"), [m('li', m('.title.is-size-5', ['Policija ', m('span' + bss.color("#990000"), '113'), ' ali 080 1200'])), // TODO
	  m('.help-contact-grid', contact.contacts.map(helpContactView))])]);
	}

	function helpContactView(entry) {
	  return m('.contact-item.help-contact-wrap' + bss.w(), [m('li', linktotab(entry.link, entry.label))]);
	}

	function linktotab(link, text) {
	  return m('a.blob', {
	    "target": "_blank",
	    "rel": "noopener noreferrer",
	    "href": link
	  }, text); // TODO
	}

	var Header = {
	  view: function view(vnode) {
	    return [mithril(TitleView), mithril('.boxx' + bss.display('flex').position('relative'), [_toConsumableArray(Array(5).keys()).map(kidView), mithril(SubtitleView)])];
	  }
	};
	var SubtitleView = {
	  view: function view() {
	    return mithril('span#title' + bss.position('absolute').fs('1.5em').top('85%').left('50%').transform('translate(-50%, -50%)').w('100%').fontWeight(900).textTransform('uppercase').textAlign('center').opacity(0).transition('opecity .1s linear') // .$hover(b.opacity(1).transition('opacity .4s linear'))
	    .$media('(min-width: 801px)', bss.fs("3.6em")), 'Je žrtev spolne zlorabe');
	  }
	};
	var TitleView = {
	  view: function view() {
	    return mithril(".title" + bss.fontWeight(900).fontSize('3em').color('#000000').textTransform('uppercase').w('100%').textAlign('center').$media('(min-width: 801px)', bss.fs("5em")), ["Vsak ", mithril("span" + bss.c("#8f2426"), "5. "), "otrok"]);
	  }
	};

	function kidView() {
	  return mithril("svg[class=show][clip-rule='evenodd'][fill-rule='evenodd'][stroke-linejoin='round'][stroke-miterlimit='1.414'][viewBox='0 0 200 300'][xmlns='http://www.w3.org/2000/svg']", mithril("path[d='M64.775 300H22.626l47.801-130.848-4.886-55.25L0 175.47v-41.1l65.541-59.303h12.438c-12.617-6.832-21.164-19.965-21.164-35.031C56.815 17.939 75.203 0 97.85 0c.557 0 1.124.011 1.681.033h.001A42.933 42.933 0 0 1 101.214 0c22.647 0 41.035 17.939 41.035 40.036 0 15.066-8.548 28.199-21.164 35.031h12.437L200 134.37v41.1l-66.478-61.568-4.885 55.25L176.438 300h-42.149l-34.757-75.926v.001l-.001-.001L64.775 300z']"));
	}

	var Footer = {
	  view: function view() {
	    return [mithril('footer.footer' + bss.bc('#ededed'), [mithril('.footer-content' + bss.display('block').fontSize('.9rem').$media('(min-width:801px)', bss.display('flex').jc('space-around')).$media('(max-width: 800px)', bss.$nest('> * + *', bss.paddingTop('2em'))).p('1em 0').borderBottom("1px solid #4a4a4a"), [mithril(OrganizationView), mithril(ParticipantView), mithril(SupporterView), mithril(MediaSupportView)])])];
	  }
	};
	var OrganizationView = {
	  view: function view() {
	    return mithril('section.organization' + bss.h('100%'), [mithril('.subtitle.is-5', 'Organizatorji'), mithril('ul', [// m("li", linktotab("", "Društvo PuP")),
	    mithril("li", "Društvo PuP"), mithril("li", linktotab$1("https://www.mdj.si", "Mladinski dom Jarše"))])]);
	  }
	};
	var ParticipantView = {
	  view: function view() {
	    return mithril('section.participants' + bss.h('100%'), [mithril('.subtitle.is-5', 'Sodelujoči'), mithril('ul', [mithril("li", linktotab$1("http://zdruzenje-sezam.si/sezam", "Združenje SEZAM")), mithril("li", linktotab$1("http://www.drustvo-zenska-svetovalnica.si", "Ženska svetovalnica")), mithril("li", linktotab$1("https://www.sititeater.si", "SiTi Teater BTC")), mithril("li", linktotab$1("https://www.nika.si", "NIKA Records")), mithril("li", linktotab$1("https://www.eusa.eu/projects/voice", "Voice"))])]);
	  }
	};
	var SupporterView = {
	  view: function view() {
	    return mithril('section.supporters' + bss.h('100%'), [mithril('.subtitle.is-5', 'Podporniki'), mithril('ul', [mithril("li", linktotab$1("http://www.finioglasi.com", "FINI oglasi")), mithril("li", linktotab$1("https://www.akton.net/.si/", "Akton d.o.o.")), mithril("li", linktotab$1("https://www.facebook.com/LepaZoga", "Lepa Žoga")), mithril("li", linktotab$1("http://www.slovenia-explorer.com", "Slovenia Explorer")), mithril("li", linktotab$1("https://www.sportna-loterija.si", "Športna loterija")), mithril("li", linktotab$1("http://www.snaga.si", "Snaga Ljubljana"))])]);
	  }
	};
	var MediaSupportView = {
	  view: function view() {
	    return mithril('section.media-support' + bss.h('100%'), [mithril('.subtitle.is-5', 'Medijska podpora'), mithril('ul', [mithril("li", linktotab$1("https://www.eventim.si/si", "Eventim.si")), mithril("li", linktotab$1("https://info.delo.si/", "Delo Revije")), mithril("li", linktotab$1("https://radiostudent.si/", "Radio Študent")), mithril("li", linktotab$1("http://mediabus.si", "Media Bus")), mithril("li", linktotab$1("http://zaslon.si/", "Zaslon.si")), mithril("li", linktotab$1("http://tam-tam.si", "TAM-TAM")), mithril("li", linktotab$1("https://www.europlakat.si", "Europlakat"))])]);
	  }
	};

	function linktotab$1(link, text) {
	  return mithril('a.blob', {
	    "target": "_blank",
	    "rel": "noopener noreferrer",
	    "href": link
	  }, text);
	} // function svg(icon, attrs) {

	//     [1, 'Brušure'],
	//     [2, 'Title2'],
	//     [3, 'Title3']
	// ]

	var Tabs = {
	  view: function view() {
	    return mithril('.', "Tabs"); // return m('div.tabs',
	    //     m('li', m('a', model.map(x=>x))
	    // )
	  }
	};
	var List = {
	  view: function view() {
	    return mithril('div.list.is-hoverable', listItem("./assets/doc/01-Text_Brosura_Tjaša_Horvat_DNK_2019_02_10.pdf", "Tjaša Hrovat DNK: Vsebina Zloženke VSAK5."), // TODO Preimenuj brusuro Hrovat
	    listItem("./assets/doc/06-2007_MNZ_Policija_SPOLNO_NASILJE.pdf", "MNZ Policija: Spolno Nasilje"), //
	    listItem("https://www.portalplus.si/1603/jeseniska-deklica", "Katja Knez Steinbuch: 'Ena po riti' je za Slovence nekaj sprejemljivega, normalnega in vzgojnega. Portal Plus, 5. 7. 2016."), listItem("https://www.rtvslo.si/slovenija/pedofilija-kdo-si-zatiska-oci/255711", "A. Mu.: Pedofilija: kdo si zatiska oči? MMC RTV SLO, 19. 4. 2011."), listItem("http://novice.svet24.si/clanek/novice/slovenija/56c5ff4a86b9b/razgaljanje-intime-pred-raznimi-neznanci", "Tina Recek: Mama spolno zlorabljenega otroka: Otrok se je tresel, potil, se me oklepal. Media 24, 19. 2. 2016."), listItem("http://www.24ur.com/novice/slovenija/po-taksni-izgubi-ni-clovek-nikoli-vec-isti-grdi-neznanec-v-temni-ulici-je-imel-znan-obraz.html", "Natalija Švab: Po takšni izgubi ni človek nikoli več isti: Grdi neznanec v temni ulici je imel znan obraz. 24ur, 26. 9. 2014."), listItem("https://www.dnevnik.si/1042725852/ljudje/neza-miklic-dolgoletna-preiskovalka-spolnih-zlorab-otrok-pedofili-izkoriscajo-tabuje", "Peter Lovšin: Neža Miklič, dolgoletna preiskovalka spolnih zlorab otrok: Pedofili izkoriščajo tabuje. Dnevnik, 2. 12. 2015."), listItem("http://jazsemvredu.si/forum/nase-otrostvo/kam-nas-pripeljejo-zlorabe-v-otrostvu-t64.html", "Kam nas pripeljejo zlorabe v otroštvu. Forum jazsemvredu, 26. 6. 2010."), listItem("http://www.delo.si/novice/kronika/vsaka-peta-otroska-zrtev-spolne-zlorabe-stara-manj-kot-sedem-let.html", "Mihael Korsika: Vsaka peta otroška žrtev spolne zlorabe na internetu stara manj kot sedem let. Delo, 29. 9. 2016."), listItem("http://www.milenamatko.com/spolne-zlorabe", "Milena Matko: Spolne zlorabe. Pot srca, 20. 2. 2017."), listItem("https://govori.se/dogodki/spolno-zlorabljanje-otrok-ne-sme-ostati-tabu/", "Tanja Šket: Spolno zlorabljanje otrok ne sme ostati tabu! Govori.se, 16. 11. 2015."), listItem("https://www.portalplus.si/2855/o-katoliski-cerkvi-in-pedofiliji", "Dejan Steinbuch: Katoliška cerkev na Slovenskem in vprašanje pedofilije med duhovščino. Portal Plus, 19. 8. 2018."), listItem("https://www.onaplus.si/pedofilske-mreze-scitijo-najvplivnejsi-politiki", "Katja Cah: Pedofilske mreže ščitijo najvplivnejši politiki. OnaPlus, 30. 8. 2017."), listItem("http://www.began.si/2018/02/16/pedofilski-obroc-okoli-papeza-franciska-se-zateguje", "Vlado Began: Pedofilski obroč okoli papeža Frančiška se zateguje. Cerkveno kritične knjige, 16. 2. 2018."), listItem("https://www.spletno-oko.si/novice/moj-mikro-o-pedofiliji", "Moj Mikro o pedofiliji. Spletno oko, 4. 1. 2010."), listItem("https://slo-tech.com/novice/t586654", "Matej Huš: Nizozemski raziskovalci z virtualno deklico odkrili več tisoč spletnih pedofilov. SloTech, 6. 11. 2013."), listItem("https://casoris.si/kako-govoriti-o-neprimernih-dotikih", "Sonja: Kako govoriti o neprimernih dotikih. Časoris, 12. 6. 2016."), listItem("https://www.b92.net/zdravlje/vesti.php?yyyy=2018&mm=10&dd=04&nav_id=1451777", "Zlostavljanje dečaka ostavlja ožiljke u njihovom DNK, pokazala studija. B92, 4. 10. 2018."), listItem("https://www.delo.si/novice/slovenija/spolna-zloraba-ni-le-zlo-je-zlocin.html?iskalnik=Katarina%20Matko&PHPSESSID=1f8a2012c4080f5009fb1e8529bb0ff1", "Maja Fabjan: Spolna zloraba ni le zlo, je zločin. Delo 17. 11. 2015."), listItem("./assets/doc/03-2017-preprecevanjeinprepoznavanjespolnihzlorabotrok.pdf", "DNK: Preprečevanje in prepoznavanje spolnih zlorab otrok. Najpogostejša vprašanja in odgovori nanje., Publikacija, 2016."), listItem("./assets/doc/04-2015-svetovalnicazazrtvespolneganasilja.pdf", "DNK: Oglas za svetovalnico, 2018."), listItem("./assets/doc/05-UNI_Osojnik_Vesna_2011spolne zlorabe.pdf", "Vesna Osojnik: Spolna zloraba otrok. Diplomsko delo, 2011."));
	  }
	};

	function listItem(link, text) {
	  return mithril('a.list-item', {
	    "target": "_blank",
	    "rel": "noopener noreferrer",
	    "href": link
	  }, text);
	}

	window.m = mithril;
	bss.setDebug(true);
	var DevPage = {
	  view: function view() {
	    return mithril(Main, mithril(".container", [mithril(Tabs), mithril(List), mithril(Footer), mithril(Header), mithril(HelpContactComp), mithril(Video), mithril(AboutComp), mithril(ModalDemo)]));
	  }
	  /*
	  *   Some handy utilities for use in view()s
	  */
	  // VIDEO
	  // // seed some data
	  // Video.create({
	  // 	"videos": [
	  // 		{ link: "https://www.youtube.com/embed/J19lRLb-wwY", label: "Miti o spolni zlorabi, v katere verjamemo, 1."},
	  // 		{ link: "https://www.youtube.com/embed/T2pSkJ37KPY", label: "Miti o spolni zlorabi, v katere verjamemo, 2."},
	  // 		{ link: "https://www.youtube.com/embed/CWfJUSHNsvU", label: "Otroka krepi informacija"},
	  // 		// { link: "", label: ""},
	  // 		// { link: "", label: ""},
	  // 		// { link: "", label: ""},
	  // 		// { link: "", label: ""}
	  // 	]
	  // })
	  // // components
	  // var VideoList = {
	  // 	view() {
	  // 		return m('.video-list', [
	  // 			Video.all().map( videoView )
	  // 		])
	  // 	}
	  // }
	  // function videoView (entry) {
	  // 	return m('.video',[
	  // 		m('div', video.entry.map( entryView ))
	  // 	])
	  // }
	  // function entryView (entry) {
	  // 	return m('div.entry', [
	  // 		m('.yt', entry.link),
	  // 		m('label', entry.name)	
	  // 	])
	  // }

	};


	function linkto(href) {
	  return {
	    href: href,
	    oncreate: mithril.route.link
	  };
	}

	function linktotab$2(link, text) {
	  return mithril('a.blob', {
	    "target": "_blank",
	    "rel": "noopener noreferrer",
	    "href": link
	  }, text);
	}

	bss.helper('measure', bss.maxWidth("30em")); // b.helper('measureWide', b.maxWidth("34em"))

	bss.helper('measureWide', bss.minWidth("34em"));
	bss.helper('measureNarrow', bss.maxWidth("20em"));
	bss.helper('v5Grid', bss.display("grid").gridTemplateRows("45px 350px auto auto auto"));
	var fadeIn = bss.$keyframes({
	  from: bss.fill("#fff").style,
	  to: bss.fill("#8f2426").style
	});

	var MainComp = function MainComp() {
	  function oninit() {}

	  function view(vnode) {
	    return mithril("is-fullheight", [// HEADER
	    mithril(Header), // m("section.hero",
	    // 	m(".hero-body",
	    // 		m(".container" + b.display("flex").jc("center").ai("center"),
	    // 			m("h1.title.is-uppercase.is-1" + b.fontWeight(900), ["Vsak ", m("span"+b.c("#8f2426"), "5. "), "otrok"])
	    // 		)
	    // 	)
	    // ),
	    // MAG5
	    // m(NavigationMenu),
	    // NAVBAR
	    mithril("nav.navbar", mithril(".navbar-menu.is-active", mithril("a.navbar-item.is-uppercase", linkto("/about"), "Poslanstvo"), mithril("a.navbar-item.is-uppercase", linkto("/help"), "Pomoč"), mithril("a.navbar-item.is-uppercase", linkto("/learn"), "Izobraževanje"))), // SECTION
	    mithril("section.section", vnode.children), // FOOTER
	    mithril(Footer) // FOOTER * + *
	    // m("footer.footer" + b.bc('#ededed'), [
	    // 	m('.footer-content'
	    // 		+ b.display('block').fontSize('.9rem')
	    // 		.$media('(min-width:801px)', b.display('flex').jc('space-around'))
	    // 		.$media('(max-width: 800px)', b.$nest('> * + *', b.paddingTop('2em')))
	    // 		.p('1em 0').borderBottom("1px solid #4a4a4a")
	    // 		, [
	    // 		m('section.organization' + b.h('100%'),  [
	    // 			m('.subtitle.is-5', 'Organizatorji'),
	    // 			m('ul', [
	    // 				m("li", linktotab("", "Društvo PuP")),
	    // 				m("li", linktotab("https://www.mdj.si", "Mladinski dom Jarše"))
	    // 			])
	    // 		]),
	    // 		m('section.participants' + b.h('100%'),  [
	    // 			m('.subtitle.is-5', 'Sodelujoči'),
	    // 			m('ul', [
	    // 				m("li", linktotab("http://zdruzenje-sezam.si/sezam", "Združenje SEZAM")),
	    // 				m("li", linktotab("http://www.drustvo-zenska-svetovalnica.si", "Ženska svetovalnica")),
	    // 				m("li", linktotab("https://www.sititeater.si", "SiTi Teater BTC")),
	    // 				m("li", linktotab("https://www.nika.si", "NIKA Records")),
	    // 				m("li", linktotab("https://www.eusa.eu/projects/voice", "Voice"))
	    // 			])
	    // 		]),
	    // 		m('section.supporters' + b.h('100%'), [
	    // 			m('.subtitle.is-5', 'Podporniki'),
	    // 			m('ul', [
	    // 				m("li", linktotab("http://www.finioglasi.com", "FINI oglasi")),
	    // 				m("li", linktotab("https://www.akton.net/.si/", "Akton d.o.o.")),
	    // 				m("li", linktotab("https://www.facebook.com/LepaZoga", "Lepa Žoga")),
	    // 				m("li", linktotab("http://www.slovenia-explorer.com", "Slovenia Explorer")),
	    // 				m("li", linktotab("https://www.sportna-loterija.si", "Športna loterija")),
	    // 				m("li", linktotab("http://www.snaga.si", "Snaga Ljubljana"))
	    // 			])
	    // 		]),
	    // 		m('section.media-support' + b.h('100%'), [
	    // 			m('.subtitle.is-5', 'Medijska podpora'),
	    // 			m('ul', [
	    // 				m("li", linktotab("https://www.eventim.si/si", "Eventim.si")),
	    // 				m("li", linktotab("https://info.delo.si/", "Delo Revije")),
	    // 				m("li", linktotab("https://radiostudent.si/", "Radio Študent")),
	    // 				m("li", linktotab("http://mediabus.si", "Media Bus")),
	    // 				m("li", linktotab("http://zaslon.si/", "Zaslon.si")),
	    // 				m("li", linktotab("http://tam-tam.si", "TAM-TAM")),
	    // 				m("li", linktotab("https://www.europlakat.si", "Europlakat"))
	    // 			])
	    // 		]),
	    // 	]),
	    // 	// m('span' + b.borderBottom("1px solid #4a4a4a").w('100%').h('1px'), ''),
	    // 	m(".content.has-text-centered" + b.p('1em 0'),
	    // 		[
	    // 			m('a[href="https://www.facebook.com/VSAK-5live-2178767162378239/"].icon'+b.$hover(b.fill('#fff')), m.trust(svg('facebook', { width: 48, height: 48, fill: '#4a4a4a', stroke: 'none'}))),
	    // 			m('a[href="vsak.peti@gmail.com].icon', m.trust(svg('mail', { width: 48, height: 48, stroke: '#4a4a4a' } ))),
	    // 			// youtube TODO
	    // 		],
	    // 		// m('small.has-text-centered', '2019 @ vsak5.live')
	    // 	),
	    // 	// m('small', 'ZAHVALE:')
	    // ])
	    ]);
	  }

	  return {
	    oninit: oninit,
	    view: view
	  };
	};

	var Main = MainComp();
	var About$1 = {
	  view: function view(vnode) {
	    return mithril(Main, mithril('.container' + bss.bc("#ffffff").paddingBottom('3em'), mithril("columns", mithril("column", [mithril(".tile.is-parent.has-text-centered" + bss.p("1.5em"), mithril('h1.title.is-2.is-uppercase.tile.is-child.is-12', "O Projektu")), mithril(".tile.is-parent" + bss.p(0), mithril(".tile.is-child" + bss.p("0 1.5em"), mithril('h2.subtitle.is-3', "Poslanstvo"), mithril('p' + bss.marginLeft("none"), mithril('span.content', 'Svetovna zdravstvena organizacija opozarja, da so spolne zlorabe otrok zelo pereča tema, saj raziskave kažejo, da je vsaka četrta deklica in vsak šesti deček žrtev spolne zlorabe v otroštvu. Po svetu in v Sloveniji »vsak peti« otrok prav zdaj, ko o tem govorimo, doživlja spolno zlorabo s strani ljudi, ob katerih živi ali jih dnevno srečuje. To so šokantni, a žal še kako resnični podatki in težko si je predstavljati, da se v tako razviti družbi, v na videz običajnih družinah, dogajajo zločini spolnega izkoriščanja in spolnega zlorabljanja, ki jih ne bi smel trpeti noben otrok na tem svetu.'), mithril("span.content.has-text-weight-bold", " Zato smo danes tukaj, da spregovorimo in si nehamo zatiskati oči pred tako množičnim pojavom, kot je spolno izkoriščanje otrok. Kot družba smo odgovorni za naše otroke. To je nedopustno in se mora končati."), mithril("span.content" + bss.color("").display("inline-block").marginLeft(10), mithril("span" + bss.fontSize(".75rem").color("#666666"), "(Tanja Šket)"))), mithril("." + bss.marginTop("1em"), mithril("p.content", "Kampanja »VSAK5.« (vsak peti otrok je žrtev spolne zlorabe), ima namen osvestiti najširšo javnost o nedopustnem in neodgovornem ravnanju družbe, kadar je soočena s spolnim izkoriščanjem in spolno zlorabo otrok. S kampanjo naslavljamo vrednote naše družbe, ki še vedno dovoljuje, da spolno nasilje zastara, kar žrtvam onemogoča rehabilitacijo in enakovredno vključevanje v družbo.")) // m('hr'+b.border(0).h(1).bc('rgba(255,154,59,1)')),
	    ))]))));
	  }
	};

	var TabComp = function TabComp() {
	  var activeTab = stream$1(0);
	  var list = [{
	    id: 'Brošure',
	    content: 'First tab'
	  }, {
	    id: 'Članki',
	    content: 'Second tab'
	  }, {
	    id: 'Literatura',
	    content: 'Third tab'
	  }, {
	    id: 'Video vsebine',
	    content: 'Third tab'
	  }];

	  function oninit() {
	    return list = learn.data;
	  }

	  function viewTab(u) {
	    var txt = u.id;
	    var content = u.content;
	    mithril("div.tab", [mithril("iframe", {
	      "src": link,
	      "frameborder": "0",
	      "allow": "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture",
	      "allowfullscreen": "allowfullscreen"
	    }), mithril(".content", txt)]);
	  }

	  function view() {
	    return mithril("div", {
	      "class": "columns"
	    }, mithril(".tabs", list.map(viewTab)));
	  }

	  return {
	    oninit: oninit,
	    view: view
	  };
	};

	var Learn2 = TabComp(); // TAB
	// var activeTab = stream(0);
	// return {
	// 	view: function(vnode) {
	// 	return (
	// 		m('.Tabs',
	// 		m('.TabBar',
	// 			attrs.tabs.map(function(tab, i) {
	// 			return m('.Tab', {
	// 				key: tab.id,
	// 				className: activeTab() === i ? 'active' : '',
	// 				onclick: function() { activeTab(i); }
	// 			}, tab.id)
	// 			})
	// 		),
	// 		m('.TabContent', attrs.tabs[activeTab()].content)
	// 		)
	// 	);
	// 	}
	// };
	// }

	var Learn = {
	  view: function view(vnode) {
	    return mithril(Main, mithril('.container' + bss.bc("#ffffff"), mithril("columns", mithril("column", [mithril(".tile.is-parent.has-text-centered", mithril('h1.title.is-2.is-uppercase.tile.is-child.is-12', "Izobraževanje")), mithril(".tile.is-parent", mithril(".tile.is-child" + bss.p("0 1.5em"), // m('.' + b.display('flex').jc('space-around').tt('uppercase'), [
	    // 	m('a.button' + b.flex(1), 'Brošure'),
	    // 	m('a.button' + b.flex(1), 'Članki'),
	    // 	m('a.button' + b.flex(1), 'Literatura'),
	    // 	m('a.button' + b.flex(1), 'Video vsebine')
	    // ]),
	    // TODO ADD TAB  
	    // m(Tabs, { tabs: tabContent }),
	    mithril('h2.subtitle.is-3', "Članki in spletne strani"), mithril("ul" + bss.listStyle("disc outside").marginLeft("2em"), // BROŠURE
	    mithril("li", linktotab$2("./assets/doc/01-Text_Brosura_Tjaša_Horvat_DNK_2019_02_10.pdf", "Tjaša Hrovat DNK: Vsebina Zloženke VSAK5.")), // TODO Preimenuj brusuro Hrovat
	    mithril("li", linktotab$2("./assets/doc/06-2007_MNZ_Policija_SPOLNO_NASILJE.pdf", "MNZ Policija: Spolno Nasilje")), //
	    mithril("li", linktotab$2("https://www.portalplus.si/1603/jeseniska-deklica", "Katja Knez Steinbuch: 'Ena po riti' je za Slovence nekaj sprejemljivega, normalnega in vzgojnega. Portal Plus, 5. 7. 2016.")), mithril("li", linktotab$2("https://www.rtvslo.si/slovenija/pedofilija-kdo-si-zatiska-oci/255711", "A. Mu.: Pedofilija: kdo si zatiska oči? MMC RTV SLO, 19. 4. 2011.")), mithril("li", linktotab$2("http://novice.svet24.si/clanek/novice/slovenija/56c5ff4a86b9b/razgaljanje-intime-pred-raznimi-neznanci", "Tina Recek: Mama spolno zlorabljenega otroka: Otrok se je tresel, potil, se me oklepal. Media 24, 19. 2. 2016.")), mithril("li", linktotab$2("http://www.24ur.com/novice/slovenija/po-taksni-izgubi-ni-clovek-nikoli-vec-isti-grdi-neznanec-v-temni-ulici-je-imel-znan-obraz.html", "Natalija Švab: Po takšni izgubi ni človek nikoli več isti: Grdi neznanec v temni ulici je imel znan obraz. 24ur, 26. 9. 2014.")), mithril("li", linktotab$2("https://www.dnevnik.si/1042725852/ljudje/neza-miklic-dolgoletna-preiskovalka-spolnih-zlorab-otrok-pedofili-izkoriscajo-tabuje", "Peter Lovšin: Neža Miklič, dolgoletna preiskovalka spolnih zlorab otrok: Pedofili izkoriščajo tabuje. Dnevnik, 2. 12. 2015.")), mithril("li", linktotab$2("http://jazsemvredu.si/forum/nase-otrostvo/kam-nas-pripeljejo-zlorabe-v-otrostvu-t64.html", "Kam nas pripeljejo zlorabe v otroštvu. Forum jazsemvredu, 26. 6. 2010.")), mithril("li", linktotab$2("http://www.delo.si/novice/kronika/vsaka-peta-otroska-zrtev-spolne-zlorabe-stara-manj-kot-sedem-let.html", "Mihael Korsika: Vsaka peta otroška žrtev spolne zlorabe na internetu stara manj kot sedem let. Delo, 29. 9. 2016.")), mithril("li", linktotab$2("http://www.milenamatko.com/spolne-zlorabe", "Milena Matko: Spolne zlorabe. Pot srca, 20. 2. 2017.")), mithril("li", linktotab$2("https://govori.se/dogodki/spolno-zlorabljanje-otrok-ne-sme-ostati-tabu/", "Tanja Šket: Spolno zlorabljanje otrok ne sme ostati tabu! Govori.se, 16. 11. 2015.")), mithril("li", linktotab$2("https://www.portalplus.si/2855/o-katoliski-cerkvi-in-pedofiliji", "Dejan Steinbuch: Katoliška cerkev na Slovenskem in vprašanje pedofilije med duhovščino. Portal Plus, 19. 8. 2018.")), mithril("li", linktotab$2("https://www.onaplus.si/pedofilske-mreze-scitijo-najvplivnejsi-politiki", "Katja Cah: Pedofilske mreže ščitijo najvplivnejši politiki. OnaPlus, 30. 8. 2017.")), mithril("li", linktotab$2("http://www.began.si/2018/02/16/pedofilski-obroc-okoli-papeza-franciska-se-zateguje", "Vlado Began: Pedofilski obroč okoli papeža Frančiška se zateguje. Cerkveno kritične knjige, 16. 2. 2018.")), mithril("li", linktotab$2("https://www.spletno-oko.si/novice/moj-mikro-o-pedofiliji", "Moj Mikro o pedofiliji. Spletno oko, 4. 1. 2010.")), mithril("li", linktotab$2("https://slo-tech.com/novice/t586654", "Matej Huš: Nizozemski raziskovalci z virtualno deklico odkrili več tisoč spletnih pedofilov. SloTech, 6. 11. 2013.")), mithril("li", linktotab$2("https://casoris.si/kako-govoriti-o-neprimernih-dotikih", "Sonja: Kako govoriti o neprimernih dotikih. Časoris, 12. 6. 2016.")), mithril("li", linktotab$2("https://www.b92.net/zdravlje/vesti.php?yyyy=2018&mm=10&dd=04&nav_id=1451777", "Zlostavljanje dečaka ostavlja ožiljke u njihovom DNK, pokazala studija. B92, 4. 10. 2018.")), mithril("li", linktotab$2("https://www.delo.si/novice/slovenija/spolna-zloraba-ni-le-zlo-je-zlocin.html?iskalnik=Katarina%20Matko&PHPSESSID=1f8a2012c4080f5009fb1e8529bb0ff1", "Maja Fabjan: Spolna zloraba ni le zlo, je zločin. Delo 17. 11. 2015.")), mithril("li", linktotab$2("./assets/doc/03-2017-preprecevanjeinprepoznavanjespolnihzlorabotrok.pdf", "DNK: Preprečevanje in prepoznavanje spolnih zlorab otrok. Najpogostejša vprašanja in odgovori nanje., Publikacija, 2016.")), mithril("li", linktotab$2("./assets/doc/04-2015-svetovalnicazazrtvespolneganasilja.pdf", "DNK: Oglas za svetovalnico, 2018.")), mithril("li", linktotab$2("./assets/doc/05-UNI_Osojnik_Vesna_2011spolne zlorabe.pdf", "Vesna Osojnik: Spolna zloraba otrok. Diplomsko delo, 2011."))))), mithril("" + bss.p(0).paddingBottom("1em"), mithril("" + bss.p("0 1.5em"), mithril('h2.subtitle.is-3', 'Video vsebine'), // m("iframe[allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture'][allowfullscreen=''][frameborder='0'][height='315'][src='https://www.youtube.com/embed/cniCkkwD69o'][width='560']"),
	    mithril(Video), mithril("ul" + bss.listStyle("disc outside").marginLeft("2em"), [// m('li', m('a[href="http://4d.rtvslo.si/arhiv/odmevi/134820142"]', 'RTV Slo Odmevi')),
	    // m('li', m('a[href="https://4d.rtvslo.si/arhiv/dosje/134819078"]', 'Nikomur ne smeš povedati')),
	    mithril("li", linktotab$2("http://4d.rtvslo.si/arhiv/odmevi/134820142", "Spolne zlorabe otrok se dogajajo večkrat, kot si mislimo. RTV 4D, 24. 4. 2012.")), mithril("li", linktotab$2("https://4d.rtvslo.si/arhiv/dosje/134819078", "Jelena Aščić: Nikomur ne smeš povedati. RTV 4D, 24. 4. 2012.")), mithril("li", linktotab$2("https://4d.rtvslo.si/arhiv/dobro-jutro/174591911", "Spolne zlorabe otrok RTV 4D 29. 1. 2019"))])))]))));
	  }
	};
	var Help = {
	  view: function view(vnode) {
	    return mithril(Main, mithril('.container' + bss.bc("#ffffff"), mithril("columns", mithril("column", [mithril(".tile.is-parent.has-text-centered", mithril('h1.title.is-size-2.is-uppercase.tile.is-child.is-12', "Kako ukrepati")), mithril(".tile.is-parent", mithril(".tile.is-child" + bss.p("0 1.5em"), mithril('h2.subtitle.is-3', "Kako ukrepati v primeru suma zlorabe?"), mithril('p', mithril('ul' + bss.listStyle("disc outside").marginLeft("2em"), [mithril('li', 'Ne jezite se na otroka.'), mithril('li', 'Ne dajte mu vtisa, da je storil kaj narobe.'), mithril('li', 'Ne zaslišujte ga.'), mithril('li', 'Vprašajte, kaj se je zgodilo, kje in s kom, ne pa tudi zakaj.'), mithril('li', 'Pred njim se ne vznemirjajte. Otroci se hitro počutijo krive, zaradi česar težko spregovorijo.'), mithril('li', 'Ne sklepajte prehitro, še posebej če so informacije skope ali nejasne.'), mithril('li', 'Otroku zagotovite, da boste ukrepali. Obrnite se na osebo, ki lahko pomaga, na primer na psihologa, zdravnika, socialnega delavca ali policijo.')])), mithril('hr' + bss.border(0).h(1).bc('rgba(255,154,59,1)')))), mithril(".tile.is-parent" + bss.p(0).paddingBottom("1em"), mithril(".tile.is-child" + bss.p("0 1.5em"), mithril('h2.subtitle.is-3', 'Na koga se obrniti'), mithril('ul' + bss.listStyle("none").marginLeft("1em"), [mithril('li', mithril('.title.is-size-5', ['Policija ', mithril('span' + bss.color("#990000"), '113'), ' ali 080 1200'])), mithril("li", linktotab$2("http://www.drustvo-sos.si", "SOS telefon (080 1155)")), mithril("li", linktotab$2("http://www.e-tom.si", "TOM telefon (116 111)")), mithril("li", linktotab$2("https://www.drustvo-dnk.si", "Društvo za nenasilno komunikacijo (01 4344822 v Ljubljani ali 05 6393170 in 031 546098 v Kopru)")), mithril("li", linktotab$2("http://www.drustvo-zenska-svetovalnica.si", "Ženska svetovalnica (031 233211)")), mithril("li", linktotab$2("https://fdinstitut.si", "Frančiškanski družinski inštitut (01 2006760 ali 040 863986)")), mithril("li", linktotab$2("http://www.luninavila.si", "Lunina vila")), mithril("li", linktotab$2("http://www.beliobroc.si", "Beli obroč Slovenije")), mithril("li", linktotab$2("http://spolna-zloraba.si/index.php/dejavnosti-2/breplacni-telefon", "Združenje proti spolnemu zlorabljanju (080 2880)")), mithril("li", linktotab$2("http://www.spletno-oko.si", "Kam prijaviti nezakonite vsebine")), // m("li", linktotab("http://www.nasvetzanet.si", "Telefon za otroke in mladostnike, ki se znajdejo v težavah na spletu")),
	    mithril("li", linktotab$2("http://www.safe.si", "Center za varnejši internet"))]) // m('hr'+b.border(0).h(1).bc('rgba(255,154,59,1)')),
	    ))]))));
	  }
	};
	mithril.route(document.body, '/about', {
	  '/': MainComp,
	  '/help': Help,
	  // '/dev': EntryList,
	  '/menu': NavigationMenu,
	  '/about': About$1,
	  '/learn': Learn,
	  '/dev': DevPage
	});

}(feather));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvbWl0aHJpbC9taXRocmlsLmpzIiwiLi4vbm9kZV9tb2R1bGVzL21pdGhyaWwvc3RyZWFtL3N0cmVhbS5qcyIsIi4uL25vZGVfbW9kdWxlcy9taXRocmlsL3N0cmVhbS5qcyIsIi4uL25vZGVfbW9kdWxlcy9ic3MvYnNzLmVzbS5qcyIsIi4uL21vZGVscy9FbnRyeS5qcyIsIi4uL3NyYy9jb21wb25lbnRzL0VudHJ5TGlzdC5qcyIsIi4uL21vZGVscy9NZW51TGlzdC5qcyIsIi4uL3NyYy9jb21wb25lbnRzL05hdmlnYXRpb25NZW51LmpzIiwiLi4vc3JjL21vZGVscy9WaWRlb0xpYnJhcnkuanMiLCIuLi9zcmMvY29tcG9uZW50cy9WaWRlb0NvbXAuanMiLCIuLi9zcmMvbW9kZWxzL0Fib3V0LmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvQWJvdXRDb21wLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvT3ZlcmxheS5qcyIsIi4uL3NyYy9jb21wb25lbnRzL0xhenlMb2FkLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvTW9kYWwuanMiLCIuLi9zcmMvY29tcG9uZW50cy9Nb2RhbERlbW8uanMiLCIuLi9zcmMvbW9kZWxzL0hlbHBDb250YWN0LmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvSGVscENvbnRhY3RDb21wLmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvaGVhZGVyL2luZGV4LmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvZm9vdGVyL2luZGV4LmpzIiwiLi4vc3JjL2NvbXBvbmVudHMvbGlzdC9pbmRleC5qcyIsIi4uL3NyYy9hcHAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiOyhmdW5jdGlvbigpIHtcblwidXNlIHN0cmljdFwiXG5mdW5jdGlvbiBWbm9kZSh0YWcsIGtleSwgYXR0cnMwLCBjaGlsZHJlbiwgdGV4dCwgZG9tKSB7XG5cdHJldHVybiB7dGFnOiB0YWcsIGtleToga2V5LCBhdHRyczogYXR0cnMwLCBjaGlsZHJlbjogY2hpbGRyZW4sIHRleHQ6IHRleHQsIGRvbTogZG9tLCBkb21TaXplOiB1bmRlZmluZWQsIHN0YXRlOiB1bmRlZmluZWQsIF9zdGF0ZTogdW5kZWZpbmVkLCBldmVudHM6IHVuZGVmaW5lZCwgaW5zdGFuY2U6IHVuZGVmaW5lZCwgc2tpcDogZmFsc2V9XG59XG5Wbm9kZS5ub3JtYWxpemUgPSBmdW5jdGlvbihub2RlKSB7XG5cdGlmIChBcnJheS5pc0FycmF5KG5vZGUpKSByZXR1cm4gVm5vZGUoXCJbXCIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBWbm9kZS5ub3JtYWxpemVDaGlsZHJlbihub2RlKSwgdW5kZWZpbmVkLCB1bmRlZmluZWQpXG5cdGlmIChub2RlICE9IG51bGwgJiYgdHlwZW9mIG5vZGUgIT09IFwib2JqZWN0XCIpIHJldHVybiBWbm9kZShcIiNcIiwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIG5vZGUgPT09IGZhbHNlID8gXCJcIiA6IG5vZGUsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKVxuXHRyZXR1cm4gbm9kZVxufVxuVm5vZGUubm9ybWFsaXplQ2hpbGRyZW4gPSBmdW5jdGlvbiBub3JtYWxpemVDaGlsZHJlbihjaGlsZHJlbikge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0Y2hpbGRyZW5baV0gPSBWbm9kZS5ub3JtYWxpemUoY2hpbGRyZW5baV0pXG5cdH1cblx0cmV0dXJuIGNoaWxkcmVuXG59XG52YXIgc2VsZWN0b3JQYXJzZXIgPSAvKD86KF58I3xcXC4pKFteI1xcLlxcW1xcXV0rKSl8KFxcWyguKz8pKD86XFxzKj1cXHMqKFwifCd8KSgoPzpcXFxcW1wiJ1xcXV18LikqPylcXDUpP1xcXSkvZ1xudmFyIHNlbGVjdG9yQ2FjaGUgPSB7fVxudmFyIGhhc093biA9IHt9Lmhhc093blByb3BlcnR5XG5mdW5jdGlvbiBpc0VtcHR5KG9iamVjdCkge1xuXHRmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSBpZiAoaGFzT3duLmNhbGwob2JqZWN0LCBrZXkpKSByZXR1cm4gZmFsc2Vcblx0cmV0dXJuIHRydWVcbn1cbmZ1bmN0aW9uIGNvbXBpbGVTZWxlY3RvcihzZWxlY3Rvcikge1xuXHR2YXIgbWF0Y2gsIHRhZyA9IFwiZGl2XCIsIGNsYXNzZXMgPSBbXSwgYXR0cnMgPSB7fVxuXHR3aGlsZSAobWF0Y2ggPSBzZWxlY3RvclBhcnNlci5leGVjKHNlbGVjdG9yKSkge1xuXHRcdHZhciB0eXBlID0gbWF0Y2hbMV0sIHZhbHVlID0gbWF0Y2hbMl1cblx0XHRpZiAodHlwZSA9PT0gXCJcIiAmJiB2YWx1ZSAhPT0gXCJcIikgdGFnID0gdmFsdWVcblx0XHRlbHNlIGlmICh0eXBlID09PSBcIiNcIikgYXR0cnMuaWQgPSB2YWx1ZVxuXHRcdGVsc2UgaWYgKHR5cGUgPT09IFwiLlwiKSBjbGFzc2VzLnB1c2godmFsdWUpXG5cdFx0ZWxzZSBpZiAobWF0Y2hbM11bMF0gPT09IFwiW1wiKSB7XG5cdFx0XHR2YXIgYXR0clZhbHVlID0gbWF0Y2hbNl1cblx0XHRcdGlmIChhdHRyVmFsdWUpIGF0dHJWYWx1ZSA9IGF0dHJWYWx1ZS5yZXBsYWNlKC9cXFxcKFtcIiddKS9nLCBcIiQxXCIpLnJlcGxhY2UoL1xcXFxcXFxcL2csIFwiXFxcXFwiKVxuXHRcdFx0aWYgKG1hdGNoWzRdID09PSBcImNsYXNzXCIpIGNsYXNzZXMucHVzaChhdHRyVmFsdWUpXG5cdFx0XHRlbHNlIGF0dHJzW21hdGNoWzRdXSA9IGF0dHJWYWx1ZSA9PT0gXCJcIiA/IGF0dHJWYWx1ZSA6IGF0dHJWYWx1ZSB8fCB0cnVlXG5cdFx0fVxuXHR9XG5cdGlmIChjbGFzc2VzLmxlbmd0aCA+IDApIGF0dHJzLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbihcIiBcIilcblx0cmV0dXJuIHNlbGVjdG9yQ2FjaGVbc2VsZWN0b3JdID0ge3RhZzogdGFnLCBhdHRyczogYXR0cnN9XG59XG5mdW5jdGlvbiBleGVjU2VsZWN0b3Ioc3RhdGUsIGF0dHJzLCBjaGlsZHJlbikge1xuXHR2YXIgaGFzQXR0cnMgPSBmYWxzZSwgY2hpbGRMaXN0LCB0ZXh0XG5cdHZhciBjbGFzc05hbWUgPSBhdHRycy5jbGFzc05hbWUgfHwgYXR0cnMuY2xhc3Ncblx0aWYgKCFpc0VtcHR5KHN0YXRlLmF0dHJzKSAmJiAhaXNFbXB0eShhdHRycykpIHtcblx0XHR2YXIgbmV3QXR0cnMgPSB7fVxuXHRcdGZvcih2YXIga2V5IGluIGF0dHJzKSB7XG5cdFx0XHRpZiAoaGFzT3duLmNhbGwoYXR0cnMsIGtleSkpIHtcblx0XHRcdFx0bmV3QXR0cnNba2V5XSA9IGF0dHJzW2tleV1cblx0XHRcdH1cblx0XHR9XG5cdFx0YXR0cnMgPSBuZXdBdHRyc1xuXHR9XG5cdGZvciAodmFyIGtleSBpbiBzdGF0ZS5hdHRycykge1xuXHRcdGlmIChoYXNPd24uY2FsbChzdGF0ZS5hdHRycywga2V5KSkge1xuXHRcdFx0YXR0cnNba2V5XSA9IHN0YXRlLmF0dHJzW2tleV1cblx0XHR9XG5cdH1cblx0aWYgKGNsYXNzTmFtZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0aWYgKGF0dHJzLmNsYXNzICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGF0dHJzLmNsYXNzID0gdW5kZWZpbmVkXG5cdFx0XHRhdHRycy5jbGFzc05hbWUgPSBjbGFzc05hbWVcblx0XHR9XG5cdFx0aWYgKHN0YXRlLmF0dHJzLmNsYXNzTmFtZSAhPSBudWxsKSB7XG5cdFx0XHRhdHRycy5jbGFzc05hbWUgPSBzdGF0ZS5hdHRycy5jbGFzc05hbWUgKyBcIiBcIiArIGNsYXNzTmFtZVxuXHRcdH1cblx0fVxuXHRmb3IgKHZhciBrZXkgaW4gYXR0cnMpIHtcblx0XHRpZiAoaGFzT3duLmNhbGwoYXR0cnMsIGtleSkgJiYga2V5ICE9PSBcImtleVwiKSB7XG5cdFx0XHRoYXNBdHRycyA9IHRydWVcblx0XHRcdGJyZWFrXG5cdFx0fVxuXHR9XG5cdGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuKSAmJiBjaGlsZHJlbi5sZW5ndGggPT09IDEgJiYgY2hpbGRyZW5bMF0gIT0gbnVsbCAmJiBjaGlsZHJlblswXS50YWcgPT09IFwiI1wiKSB7XG5cdFx0dGV4dCA9IGNoaWxkcmVuWzBdLmNoaWxkcmVuXG5cdH0gZWxzZSB7XG5cdFx0Y2hpbGRMaXN0ID0gY2hpbGRyZW5cblx0fVxuXHRyZXR1cm4gVm5vZGUoc3RhdGUudGFnLCBhdHRycy5rZXksIGhhc0F0dHJzID8gYXR0cnMgOiB1bmRlZmluZWQsIGNoaWxkTGlzdCwgdGV4dClcbn1cbmZ1bmN0aW9uIGh5cGVyc2NyaXB0KHNlbGVjdG9yKSB7XG5cdC8vIEJlY2F1c2Ugc2xvcHB5IG1vZGUgc3Vja3Ncblx0dmFyIGF0dHJzID0gYXJndW1lbnRzWzFdLCBzdGFydCA9IDIsIGNoaWxkcmVuXG5cdGlmIChzZWxlY3RvciA9PSBudWxsIHx8IHR5cGVvZiBzZWxlY3RvciAhPT0gXCJzdHJpbmdcIiAmJiB0eXBlb2Ygc2VsZWN0b3IgIT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2Ygc2VsZWN0b3IudmlldyAhPT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0dGhyb3cgRXJyb3IoXCJUaGUgc2VsZWN0b3IgbXVzdCBiZSBlaXRoZXIgYSBzdHJpbmcgb3IgYSBjb21wb25lbnQuXCIpO1xuXHR9XG5cdGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09IFwic3RyaW5nXCIpIHtcblx0XHR2YXIgY2FjaGVkID0gc2VsZWN0b3JDYWNoZVtzZWxlY3Rvcl0gfHwgY29tcGlsZVNlbGVjdG9yKHNlbGVjdG9yKVxuXHR9XG5cdGlmIChhdHRycyA9PSBudWxsKSB7XG5cdFx0YXR0cnMgPSB7fVxuXHR9IGVsc2UgaWYgKHR5cGVvZiBhdHRycyAhPT0gXCJvYmplY3RcIiB8fCBhdHRycy50YWcgIT0gbnVsbCB8fCBBcnJheS5pc0FycmF5KGF0dHJzKSkge1xuXHRcdGF0dHJzID0ge31cblx0XHRzdGFydCA9IDFcblx0fVxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gc3RhcnQgKyAxKSB7XG5cdFx0Y2hpbGRyZW4gPSBhcmd1bWVudHNbc3RhcnRdXG5cdFx0aWYgKCFBcnJheS5pc0FycmF5KGNoaWxkcmVuKSkgY2hpbGRyZW4gPSBbY2hpbGRyZW5dXG5cdH0gZWxzZSB7XG5cdFx0Y2hpbGRyZW4gPSBbXVxuXHRcdHdoaWxlIChzdGFydCA8IGFyZ3VtZW50cy5sZW5ndGgpIGNoaWxkcmVuLnB1c2goYXJndW1lbnRzW3N0YXJ0KytdKVxuXHR9XG5cdHZhciBub3JtYWxpemVkID0gVm5vZGUubm9ybWFsaXplQ2hpbGRyZW4oY2hpbGRyZW4pXG5cdGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09IFwic3RyaW5nXCIpIHtcblx0XHRyZXR1cm4gZXhlY1NlbGVjdG9yKGNhY2hlZCwgYXR0cnMsIG5vcm1hbGl6ZWQpXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIFZub2RlKHNlbGVjdG9yLCBhdHRycy5rZXksIGF0dHJzLCBub3JtYWxpemVkKVxuXHR9XG59XG5oeXBlcnNjcmlwdC50cnVzdCA9IGZ1bmN0aW9uKGh0bWwpIHtcblx0aWYgKGh0bWwgPT0gbnVsbCkgaHRtbCA9IFwiXCJcblx0cmV0dXJuIFZub2RlKFwiPFwiLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgaHRtbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQpXG59XG5oeXBlcnNjcmlwdC5mcmFnbWVudCA9IGZ1bmN0aW9uKGF0dHJzMSwgY2hpbGRyZW4pIHtcblx0cmV0dXJuIFZub2RlKFwiW1wiLCBhdHRyczEua2V5LCBhdHRyczEsIFZub2RlLm5vcm1hbGl6ZUNoaWxkcmVuKGNoaWxkcmVuKSwgdW5kZWZpbmVkLCB1bmRlZmluZWQpXG59XG52YXIgbSA9IGh5cGVyc2NyaXB0XG4vKiogQGNvbnN0cnVjdG9yICovXG52YXIgUHJvbWlzZVBvbHlmaWxsID0gZnVuY3Rpb24oZXhlY3V0b3IpIHtcblx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIFByb21pc2VQb2x5ZmlsbCkpIHRocm93IG5ldyBFcnJvcihcIlByb21pc2UgbXVzdCBiZSBjYWxsZWQgd2l0aCBgbmV3YFwiKVxuXHRpZiAodHlwZW9mIGV4ZWN1dG9yICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJleGVjdXRvciBtdXN0IGJlIGEgZnVuY3Rpb25cIilcblx0dmFyIHNlbGYgPSB0aGlzLCByZXNvbHZlcnMgPSBbXSwgcmVqZWN0b3JzID0gW10sIHJlc29sdmVDdXJyZW50ID0gaGFuZGxlcihyZXNvbHZlcnMsIHRydWUpLCByZWplY3RDdXJyZW50ID0gaGFuZGxlcihyZWplY3RvcnMsIGZhbHNlKVxuXHR2YXIgaW5zdGFuY2UgPSBzZWxmLl9pbnN0YW5jZSA9IHtyZXNvbHZlcnM6IHJlc29sdmVycywgcmVqZWN0b3JzOiByZWplY3RvcnN9XG5cdHZhciBjYWxsQXN5bmMgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBzZXRJbW1lZGlhdGUgOiBzZXRUaW1lb3V0XG5cdGZ1bmN0aW9uIGhhbmRsZXIobGlzdCwgc2hvdWxkQWJzb3JiKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIGV4ZWN1dGUodmFsdWUpIHtcblx0XHRcdHZhciB0aGVuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRpZiAoc2hvdWxkQWJzb3JiICYmIHZhbHVlICE9IG51bGwgJiYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikgJiYgdHlwZW9mICh0aGVuID0gdmFsdWUudGhlbikgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0XHRcdGlmICh2YWx1ZSA9PT0gc2VsZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByb21pc2UgY2FuJ3QgYmUgcmVzb2x2ZWQgdy8gaXRzZWxmXCIpXG5cdFx0XHRcdFx0ZXhlY3V0ZU9uY2UodGhlbi5iaW5kKHZhbHVlKSlcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRjYWxsQXN5bmMoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRpZiAoIXNob3VsZEFic29yYiAmJiBsaXN0Lmxlbmd0aCA9PT0gMCkgY29uc29sZS5lcnJvcihcIlBvc3NpYmxlIHVuaGFuZGxlZCBwcm9taXNlIHJlamVjdGlvbjpcIiwgdmFsdWUpXG5cdFx0XHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIGxpc3RbaV0odmFsdWUpXG5cdFx0XHRcdFx0XHRyZXNvbHZlcnMubGVuZ3RoID0gMCwgcmVqZWN0b3JzLmxlbmd0aCA9IDBcblx0XHRcdFx0XHRcdGluc3RhbmNlLnN0YXRlID0gc2hvdWxkQWJzb3JiXG5cdFx0XHRcdFx0XHRpbnN0YW5jZS5yZXRyeSA9IGZ1bmN0aW9uKCkge2V4ZWN1dGUodmFsdWUpfVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNhdGNoIChlKSB7XG5cdFx0XHRcdHJlamVjdEN1cnJlbnQoZSlcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0ZnVuY3Rpb24gZXhlY3V0ZU9uY2UodGhlbikge1xuXHRcdHZhciBydW5zID0gMFxuXHRcdGZ1bmN0aW9uIHJ1bihmbikge1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdGlmIChydW5zKysgPiAwKSByZXR1cm5cblx0XHRcdFx0Zm4odmFsdWUpXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHZhciBvbmVycm9yID0gcnVuKHJlamVjdEN1cnJlbnQpXG5cdFx0dHJ5IHt0aGVuKHJ1bihyZXNvbHZlQ3VycmVudCksIG9uZXJyb3IpfSBjYXRjaCAoZSkge29uZXJyb3IoZSl9XG5cdH1cblx0ZXhlY3V0ZU9uY2UoZXhlY3V0b3IpXG59XG5Qcm9taXNlUG9seWZpbGwucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbihvbkZ1bGZpbGxlZCwgb25SZWplY3Rpb24pIHtcblx0dmFyIHNlbGYgPSB0aGlzLCBpbnN0YW5jZSA9IHNlbGYuX2luc3RhbmNlXG5cdGZ1bmN0aW9uIGhhbmRsZShjYWxsYmFjaywgbGlzdCwgbmV4dCwgc3RhdGUpIHtcblx0XHRsaXN0LnB1c2goZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikgbmV4dCh2YWx1ZSlcblx0XHRcdGVsc2UgdHJ5IHtyZXNvbHZlTmV4dChjYWxsYmFjayh2YWx1ZSkpfSBjYXRjaCAoZSkge2lmIChyZWplY3ROZXh0KSByZWplY3ROZXh0KGUpfVxuXHRcdH0pXG5cdFx0aWYgKHR5cGVvZiBpbnN0YW5jZS5yZXRyeSA9PT0gXCJmdW5jdGlvblwiICYmIHN0YXRlID09PSBpbnN0YW5jZS5zdGF0ZSkgaW5zdGFuY2UucmV0cnkoKVxuXHR9XG5cdHZhciByZXNvbHZlTmV4dCwgcmVqZWN0TmV4dFxuXHR2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlUG9seWZpbGwoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7cmVzb2x2ZU5leHQgPSByZXNvbHZlLCByZWplY3ROZXh0ID0gcmVqZWN0fSlcblx0aGFuZGxlKG9uRnVsZmlsbGVkLCBpbnN0YW5jZS5yZXNvbHZlcnMsIHJlc29sdmVOZXh0LCB0cnVlKSwgaGFuZGxlKG9uUmVqZWN0aW9uLCBpbnN0YW5jZS5yZWplY3RvcnMsIHJlamVjdE5leHQsIGZhbHNlKVxuXHRyZXR1cm4gcHJvbWlzZVxufVxuUHJvbWlzZVBvbHlmaWxsLnByb3RvdHlwZS5jYXRjaCA9IGZ1bmN0aW9uKG9uUmVqZWN0aW9uKSB7XG5cdHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3Rpb24pXG59XG5Qcm9taXNlUG9seWZpbGwucmVzb2x2ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdGlmICh2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2VQb2x5ZmlsbCkgcmV0dXJuIHZhbHVlXG5cdHJldHVybiBuZXcgUHJvbWlzZVBvbHlmaWxsKGZ1bmN0aW9uKHJlc29sdmUpIHtyZXNvbHZlKHZhbHVlKX0pXG59XG5Qcm9taXNlUG9seWZpbGwucmVqZWN0ID0gZnVuY3Rpb24odmFsdWUpIHtcblx0cmV0dXJuIG5ldyBQcm9taXNlUG9seWZpbGwoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7cmVqZWN0KHZhbHVlKX0pXG59XG5Qcm9taXNlUG9seWZpbGwuYWxsID0gZnVuY3Rpb24obGlzdCkge1xuXHRyZXR1cm4gbmV3IFByb21pc2VQb2x5ZmlsbChmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblx0XHR2YXIgdG90YWwgPSBsaXN0Lmxlbmd0aCwgY291bnQgPSAwLCB2YWx1ZXMgPSBbXVxuXHRcdGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkgcmVzb2x2ZShbXSlcblx0XHRlbHNlIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuXHRcdFx0KGZ1bmN0aW9uKGkpIHtcblx0XHRcdFx0ZnVuY3Rpb24gY29uc3VtZSh2YWx1ZSkge1xuXHRcdFx0XHRcdGNvdW50Kytcblx0XHRcdFx0XHR2YWx1ZXNbaV0gPSB2YWx1ZVxuXHRcdFx0XHRcdGlmIChjb3VudCA9PT0gdG90YWwpIHJlc29sdmUodmFsdWVzKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChsaXN0W2ldICE9IG51bGwgJiYgKHR5cGVvZiBsaXN0W2ldID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBsaXN0W2ldID09PSBcImZ1bmN0aW9uXCIpICYmIHR5cGVvZiBsaXN0W2ldLnRoZW4gPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0XHRcdGxpc3RbaV0udGhlbihjb25zdW1lLCByZWplY3QpXG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBjb25zdW1lKGxpc3RbaV0pXG5cdFx0XHR9KShpKVxuXHRcdH1cblx0fSlcbn1cblByb21pc2VQb2x5ZmlsbC5yYWNlID0gZnVuY3Rpb24obGlzdCkge1xuXHRyZXR1cm4gbmV3IFByb21pc2VQb2x5ZmlsbChmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcblx0XHRcdGxpc3RbaV0udGhlbihyZXNvbHZlLCByZWplY3QpXG5cdFx0fVxuXHR9KVxufVxuaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcblx0aWYgKHR5cGVvZiB3aW5kb3cuUHJvbWlzZSA9PT0gXCJ1bmRlZmluZWRcIikgd2luZG93LlByb21pc2UgPSBQcm9taXNlUG9seWZpbGxcblx0dmFyIFByb21pc2VQb2x5ZmlsbCA9IHdpbmRvdy5Qcm9taXNlXG59IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWwuUHJvbWlzZSA9PT0gXCJ1bmRlZmluZWRcIikgZ2xvYmFsLlByb21pc2UgPSBQcm9taXNlUG9seWZpbGxcblx0dmFyIFByb21pc2VQb2x5ZmlsbCA9IGdsb2JhbC5Qcm9taXNlXG59IGVsc2Uge1xufVxudmFyIGJ1aWxkUXVlcnlTdHJpbmcgPSBmdW5jdGlvbihvYmplY3QpIHtcblx0aWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpICE9PSBcIltvYmplY3QgT2JqZWN0XVwiKSByZXR1cm4gXCJcIlxuXHR2YXIgYXJncyA9IFtdXG5cdGZvciAodmFyIGtleTAgaW4gb2JqZWN0KSB7XG5cdFx0ZGVzdHJ1Y3R1cmUoa2V5MCwgb2JqZWN0W2tleTBdKVxuXHR9XG5cdHJldHVybiBhcmdzLmpvaW4oXCImXCIpXG5cdGZ1bmN0aW9uIGRlc3RydWN0dXJlKGtleTAsIHZhbHVlKSB7XG5cdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGRlc3RydWN0dXJlKGtleTAgKyBcIltcIiArIGkgKyBcIl1cIiwgdmFsdWVbaV0pXG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2UgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09IFwiW29iamVjdCBPYmplY3RdXCIpIHtcblx0XHRcdGZvciAodmFyIGkgaW4gdmFsdWUpIHtcblx0XHRcdFx0ZGVzdHJ1Y3R1cmUoa2V5MCArIFwiW1wiICsgaSArIFwiXVwiLCB2YWx1ZVtpXSlcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSBhcmdzLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGtleTApICsgKHZhbHVlICE9IG51bGwgJiYgdmFsdWUgIT09IFwiXCIgPyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkgOiBcIlwiKSlcblx0fVxufVxudmFyIEZJTEVfUFJPVE9DT0xfUkVHRVggPSBuZXcgUmVnRXhwKFwiXmZpbGU6Ly9cIiwgXCJpXCIpXG52YXIgXzggPSBmdW5jdGlvbigkd2luZG93LCBQcm9taXNlKSB7XG5cdHZhciBjYWxsYmFja0NvdW50ID0gMFxuXHR2YXIgb25jb21wbGV0aW9uXG5cdGZ1bmN0aW9uIHNldENvbXBsZXRpb25DYWxsYmFjayhjYWxsYmFjaykge29uY29tcGxldGlvbiA9IGNhbGxiYWNrfVxuXHRmdW5jdGlvbiBmaW5hbGl6ZXIoKSB7XG5cdFx0dmFyIGNvdW50ID0gMFxuXHRcdGZ1bmN0aW9uIGNvbXBsZXRlKCkge2lmICgtLWNvdW50ID09PSAwICYmIHR5cGVvZiBvbmNvbXBsZXRpb24gPT09IFwiZnVuY3Rpb25cIikgb25jb21wbGV0aW9uKCl9XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIGZpbmFsaXplKHByb21pc2UwKSB7XG5cdFx0XHR2YXIgdGhlbjAgPSBwcm9taXNlMC50aGVuXG5cdFx0XHRwcm9taXNlMC50aGVuID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNvdW50Kytcblx0XHRcdFx0dmFyIG5leHQgPSB0aGVuMC5hcHBseShwcm9taXNlMCwgYXJndW1lbnRzKVxuXHRcdFx0XHRuZXh0LnRoZW4oY29tcGxldGUsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0XHRjb21wbGV0ZSgpXG5cdFx0XHRcdFx0aWYgKGNvdW50ID09PSAwKSB0aHJvdyBlXG5cdFx0XHRcdH0pXG5cdFx0XHRcdHJldHVybiBmaW5hbGl6ZShuZXh0KVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHByb21pc2UwXG5cdFx0fVxuXHR9XG5cdGZ1bmN0aW9uIG5vcm1hbGl6ZShhcmdzLCBleHRyYSkge1xuXHRcdGlmICh0eXBlb2YgYXJncyA9PT0gXCJzdHJpbmdcIikge1xuXHRcdFx0dmFyIHVybCA9IGFyZ3Ncblx0XHRcdGFyZ3MgPSBleHRyYSB8fCB7fVxuXHRcdFx0aWYgKGFyZ3MudXJsID09IG51bGwpIGFyZ3MudXJsID0gdXJsXG5cdFx0fVxuXHRcdHJldHVybiBhcmdzXG5cdH1cblx0ZnVuY3Rpb24gcmVxdWVzdChhcmdzLCBleHRyYSkge1xuXHRcdHZhciBmaW5hbGl6ZSA9IGZpbmFsaXplcigpXG5cdFx0YXJncyA9IG5vcm1hbGl6ZShhcmdzLCBleHRyYSlcblx0XHR2YXIgcHJvbWlzZTAgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblx0XHRcdGlmIChhcmdzLm1ldGhvZCA9PSBudWxsKSBhcmdzLm1ldGhvZCA9IFwiR0VUXCJcblx0XHRcdGFyZ3MubWV0aG9kID0gYXJncy5tZXRob2QudG9VcHBlckNhc2UoKVxuXHRcdFx0dmFyIHVzZUJvZHkgPSAoYXJncy5tZXRob2QgPT09IFwiR0VUXCIgfHwgYXJncy5tZXRob2QgPT09IFwiVFJBQ0VcIikgPyBmYWxzZSA6ICh0eXBlb2YgYXJncy51c2VCb2R5ID09PSBcImJvb2xlYW5cIiA/IGFyZ3MudXNlQm9keSA6IHRydWUpXG5cdFx0XHRpZiAodHlwZW9mIGFyZ3Muc2VyaWFsaXplICE9PSBcImZ1bmN0aW9uXCIpIGFyZ3Muc2VyaWFsaXplID0gdHlwZW9mIEZvcm1EYXRhICE9PSBcInVuZGVmaW5lZFwiICYmIGFyZ3MuZGF0YSBpbnN0YW5jZW9mIEZvcm1EYXRhID8gZnVuY3Rpb24odmFsdWUpIHtyZXR1cm4gdmFsdWV9IDogSlNPTi5zdHJpbmdpZnlcblx0XHRcdGlmICh0eXBlb2YgYXJncy5kZXNlcmlhbGl6ZSAhPT0gXCJmdW5jdGlvblwiKSBhcmdzLmRlc2VyaWFsaXplID0gZGVzZXJpYWxpemVcblx0XHRcdGlmICh0eXBlb2YgYXJncy5leHRyYWN0ICE9PSBcImZ1bmN0aW9uXCIpIGFyZ3MuZXh0cmFjdCA9IGV4dHJhY3Rcblx0XHRcdGFyZ3MudXJsID0gaW50ZXJwb2xhdGUoYXJncy51cmwsIGFyZ3MuZGF0YSlcblx0XHRcdGlmICh1c2VCb2R5KSBhcmdzLmRhdGEgPSBhcmdzLnNlcmlhbGl6ZShhcmdzLmRhdGEpXG5cdFx0XHRlbHNlIGFyZ3MudXJsID0gYXNzZW1ibGUoYXJncy51cmwsIGFyZ3MuZGF0YSlcblx0XHRcdHZhciB4aHIgPSBuZXcgJHdpbmRvdy5YTUxIdHRwUmVxdWVzdCgpLFxuXHRcdFx0XHRhYm9ydGVkID0gZmFsc2UsXG5cdFx0XHRcdF9hYm9ydCA9IHhoci5hYm9ydFxuXHRcdFx0eGhyLmFib3J0ID0gZnVuY3Rpb24gYWJvcnQoKSB7XG5cdFx0XHRcdGFib3J0ZWQgPSB0cnVlXG5cdFx0XHRcdF9hYm9ydC5jYWxsKHhocilcblx0XHRcdH1cblx0XHRcdHhoci5vcGVuKGFyZ3MubWV0aG9kLCBhcmdzLnVybCwgdHlwZW9mIGFyZ3MuYXN5bmMgPT09IFwiYm9vbGVhblwiID8gYXJncy5hc3luYyA6IHRydWUsIHR5cGVvZiBhcmdzLnVzZXIgPT09IFwic3RyaW5nXCIgPyBhcmdzLnVzZXIgOiB1bmRlZmluZWQsIHR5cGVvZiBhcmdzLnBhc3N3b3JkID09PSBcInN0cmluZ1wiID8gYXJncy5wYXNzd29yZCA6IHVuZGVmaW5lZClcblx0XHRcdGlmIChhcmdzLnNlcmlhbGl6ZSA9PT0gSlNPTi5zdHJpbmdpZnkgJiYgdXNlQm9keSAmJiAhKGFyZ3MuaGVhZGVycyAmJiBhcmdzLmhlYWRlcnMuaGFzT3duUHJvcGVydHkoXCJDb250ZW50LVR5cGVcIikpKSB7XG5cdFx0XHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiKVxuXHRcdFx0fVxuXHRcdFx0aWYgKGFyZ3MuZGVzZXJpYWxpemUgPT09IGRlc2VyaWFsaXplICYmICEoYXJncy5oZWFkZXJzICYmIGFyZ3MuaGVhZGVycy5oYXNPd25Qcm9wZXJ0eShcIkFjY2VwdFwiKSkpIHtcblx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoXCJBY2NlcHRcIiwgXCJhcHBsaWNhdGlvbi9qc29uLCB0ZXh0LypcIilcblx0XHRcdH1cblx0XHRcdGlmIChhcmdzLndpdGhDcmVkZW50aWFscykgeGhyLndpdGhDcmVkZW50aWFscyA9IGFyZ3Mud2l0aENyZWRlbnRpYWxzXG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gYXJncy5oZWFkZXJzKSBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChhcmdzLmhlYWRlcnMsIGtleSkpIHtcblx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoa2V5LCBhcmdzLmhlYWRlcnNba2V5XSlcblx0XHRcdH1cblx0XHRcdGlmICh0eXBlb2YgYXJncy5jb25maWcgPT09IFwiZnVuY3Rpb25cIikgeGhyID0gYXJncy5jb25maWcoeGhyLCBhcmdzKSB8fCB4aHJcblx0XHRcdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly8gRG9uJ3QgdGhyb3cgZXJyb3JzIG9uIHhoci5hYm9ydCgpLlxuXHRcdFx0XHRpZihhYm9ydGVkKSByZXR1cm5cblx0XHRcdFx0aWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdHZhciByZXNwb25zZSA9IChhcmdzLmV4dHJhY3QgIT09IGV4dHJhY3QpID8gYXJncy5leHRyYWN0KHhociwgYXJncykgOiBhcmdzLmRlc2VyaWFsaXplKGFyZ3MuZXh0cmFjdCh4aHIsIGFyZ3MpKVxuXHRcdFx0XHRcdFx0aWYgKCh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSB8fCB4aHIuc3RhdHVzID09PSAzMDQgfHwgRklMRV9QUk9UT0NPTF9SRUdFWC50ZXN0KGFyZ3MudXJsKSkge1xuXHRcdFx0XHRcdFx0XHRyZXNvbHZlKGNhc3QoYXJncy50eXBlLCByZXNwb25zZSkpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0dmFyIGVycm9yID0gbmV3IEVycm9yKHhoci5yZXNwb25zZVRleHQpXG5cdFx0XHRcdFx0XHRcdGZvciAodmFyIGtleSBpbiByZXNwb25zZSkgZXJyb3Jba2V5XSA9IHJlc3BvbnNlW2tleV1cblx0XHRcdFx0XHRcdFx0cmVqZWN0KGVycm9yKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjYXRjaCAoZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KGUpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAodXNlQm9keSAmJiAoYXJncy5kYXRhICE9IG51bGwpKSB4aHIuc2VuZChhcmdzLmRhdGEpXG5cdFx0XHRlbHNlIHhoci5zZW5kKClcblx0XHR9KVxuXHRcdHJldHVybiBhcmdzLmJhY2tncm91bmQgPT09IHRydWUgPyBwcm9taXNlMCA6IGZpbmFsaXplKHByb21pc2UwKVxuXHR9XG5cdGZ1bmN0aW9uIGpzb25wKGFyZ3MsIGV4dHJhKSB7XG5cdFx0dmFyIGZpbmFsaXplID0gZmluYWxpemVyKClcblx0XHRhcmdzID0gbm9ybWFsaXplKGFyZ3MsIGV4dHJhKVxuXHRcdHZhciBwcm9taXNlMCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdFx0dmFyIGNhbGxiYWNrTmFtZSA9IGFyZ3MuY2FsbGJhY2tOYW1lIHx8IFwiX21pdGhyaWxfXCIgKyBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAxZTE2KSArIFwiX1wiICsgY2FsbGJhY2tDb3VudCsrXG5cdFx0XHR2YXIgc2NyaXB0ID0gJHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpXG5cdFx0XHQkd2luZG93W2NhbGxiYWNrTmFtZV0gPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdClcblx0XHRcdFx0cmVzb2x2ZShjYXN0KGFyZ3MudHlwZSwgZGF0YSkpXG5cdFx0XHRcdGRlbGV0ZSAkd2luZG93W2NhbGxiYWNrTmFtZV1cblx0XHRcdH1cblx0XHRcdHNjcmlwdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdClcblx0XHRcdFx0cmVqZWN0KG5ldyBFcnJvcihcIkpTT05QIHJlcXVlc3QgZmFpbGVkXCIpKVxuXHRcdFx0XHRkZWxldGUgJHdpbmRvd1tjYWxsYmFja05hbWVdXG5cdFx0XHR9XG5cdFx0XHRpZiAoYXJncy5kYXRhID09IG51bGwpIGFyZ3MuZGF0YSA9IHt9XG5cdFx0XHRhcmdzLnVybCA9IGludGVycG9sYXRlKGFyZ3MudXJsLCBhcmdzLmRhdGEpXG5cdFx0XHRhcmdzLmRhdGFbYXJncy5jYWxsYmFja0tleSB8fCBcImNhbGxiYWNrXCJdID0gY2FsbGJhY2tOYW1lXG5cdFx0XHRzY3JpcHQuc3JjID0gYXNzZW1ibGUoYXJncy51cmwsIGFyZ3MuZGF0YSlcblx0XHRcdCR3aW5kb3cuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKHNjcmlwdClcblx0XHR9KVxuXHRcdHJldHVybiBhcmdzLmJhY2tncm91bmQgPT09IHRydWU/IHByb21pc2UwIDogZmluYWxpemUocHJvbWlzZTApXG5cdH1cblx0ZnVuY3Rpb24gaW50ZXJwb2xhdGUodXJsLCBkYXRhKSB7XG5cdFx0aWYgKGRhdGEgPT0gbnVsbCkgcmV0dXJuIHVybFxuXHRcdHZhciB0b2tlbnMgPSB1cmwubWF0Y2goLzpbXlxcL10rL2dpKSB8fCBbXVxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIga2V5ID0gdG9rZW5zW2ldLnNsaWNlKDEpXG5cdFx0XHRpZiAoZGF0YVtrZXldICE9IG51bGwpIHtcblx0XHRcdFx0dXJsID0gdXJsLnJlcGxhY2UodG9rZW5zW2ldLCBkYXRhW2tleV0pXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB1cmxcblx0fVxuXHRmdW5jdGlvbiBhc3NlbWJsZSh1cmwsIGRhdGEpIHtcblx0XHR2YXIgcXVlcnlzdHJpbmcgPSBidWlsZFF1ZXJ5U3RyaW5nKGRhdGEpXG5cdFx0aWYgKHF1ZXJ5c3RyaW5nICE9PSBcIlwiKSB7XG5cdFx0XHR2YXIgcHJlZml4ID0gdXJsLmluZGV4T2YoXCI/XCIpIDwgMCA/IFwiP1wiIDogXCImXCJcblx0XHRcdHVybCArPSBwcmVmaXggKyBxdWVyeXN0cmluZ1xuXHRcdH1cblx0XHRyZXR1cm4gdXJsXG5cdH1cblx0ZnVuY3Rpb24gZGVzZXJpYWxpemUoZGF0YSkge1xuXHRcdHRyeSB7cmV0dXJuIGRhdGEgIT09IFwiXCIgPyBKU09OLnBhcnNlKGRhdGEpIDogbnVsbH1cblx0XHRjYXRjaCAoZSkge3Rocm93IG5ldyBFcnJvcihkYXRhKX1cblx0fVxuXHRmdW5jdGlvbiBleHRyYWN0KHhocikge3JldHVybiB4aHIucmVzcG9uc2VUZXh0fVxuXHRmdW5jdGlvbiBjYXN0KHR5cGUwLCBkYXRhKSB7XG5cdFx0aWYgKHR5cGVvZiB0eXBlMCA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRkYXRhW2ldID0gbmV3IHR5cGUwKGRhdGFbaV0pXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGVsc2UgcmV0dXJuIG5ldyB0eXBlMChkYXRhKVxuXHRcdH1cblx0XHRyZXR1cm4gZGF0YVxuXHR9XG5cdHJldHVybiB7cmVxdWVzdDogcmVxdWVzdCwganNvbnA6IGpzb25wLCBzZXRDb21wbGV0aW9uQ2FsbGJhY2s6IHNldENvbXBsZXRpb25DYWxsYmFja31cbn1cbnZhciByZXF1ZXN0U2VydmljZSA9IF84KHdpbmRvdywgUHJvbWlzZVBvbHlmaWxsKVxudmFyIGNvcmVSZW5kZXJlciA9IGZ1bmN0aW9uKCR3aW5kb3cpIHtcblx0dmFyICRkb2MgPSAkd2luZG93LmRvY3VtZW50XG5cdHZhciAkZW1wdHlGcmFnbWVudCA9ICRkb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG5cdHZhciBuYW1lU3BhY2UgPSB7XG5cdFx0c3ZnOiBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXG5cdFx0bWF0aDogXCJodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGgvTWF0aE1MXCJcblx0fVxuXHR2YXIgb25ldmVudFxuXHRmdW5jdGlvbiBzZXRFdmVudENhbGxiYWNrKGNhbGxiYWNrKSB7cmV0dXJuIG9uZXZlbnQgPSBjYWxsYmFja31cblx0ZnVuY3Rpb24gZ2V0TmFtZVNwYWNlKHZub2RlKSB7XG5cdFx0cmV0dXJuIHZub2RlLmF0dHJzICYmIHZub2RlLmF0dHJzLnhtbG5zIHx8IG5hbWVTcGFjZVt2bm9kZS50YWddXG5cdH1cblx0Ly8gSUU5IC0gSUUxMSAoYXQgbGVhc3QpIHRocm93IGFuIFVuc3BlY2lmaWVkRXJyb3Igd2hlbiBhY2Nlc3NpbmcgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCB3aGVuXG5cdC8vIGluc2lkZSBhbiBpZnJhbWUuIENhdGNoIGFuZCBzd2FsbG93IHRoaXMgZXJyb3IwLCBhbmQgaGVhdnktaGFuZGlkbHkgcmV0dXJuIG51bGwuXG5cdGZ1bmN0aW9uIGFjdGl2ZUVsZW1lbnQoKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiAkZG9jLmFjdGl2ZUVsZW1lbnRcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblx0fVxuXHQvL2NyZWF0ZVxuXHRmdW5jdGlvbiBjcmVhdGVOb2RlcyhwYXJlbnQsIHZub2Rlcywgc3RhcnQsIGVuZCwgaG9va3MsIG5leHRTaWJsaW5nLCBucykge1xuXHRcdGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG5cdFx0XHR2YXIgdm5vZGUgPSB2bm9kZXNbaV1cblx0XHRcdGlmICh2bm9kZSAhPSBudWxsKSB7XG5cdFx0XHRcdGNyZWF0ZU5vZGUocGFyZW50LCB2bm9kZSwgaG9va3MsIG5zLCBuZXh0U2libGluZylcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0ZnVuY3Rpb24gY3JlYXRlTm9kZShwYXJlbnQsIHZub2RlLCBob29rcywgbnMsIG5leHRTaWJsaW5nKSB7XG5cdFx0dmFyIHRhZyA9IHZub2RlLnRhZ1xuXHRcdGlmICh0eXBlb2YgdGFnID09PSBcInN0cmluZ1wiKSB7XG5cdFx0XHR2bm9kZS5zdGF0ZSA9IHt9XG5cdFx0XHRpZiAodm5vZGUuYXR0cnMgIT0gbnVsbCkgaW5pdExpZmVjeWNsZSh2bm9kZS5hdHRycywgdm5vZGUsIGhvb2tzKVxuXHRcdFx0c3dpdGNoICh0YWcpIHtcblx0XHRcdFx0Y2FzZSBcIiNcIjogcmV0dXJuIGNyZWF0ZVRleHQocGFyZW50LCB2bm9kZSwgbmV4dFNpYmxpbmcpXG5cdFx0XHRcdGNhc2UgXCI8XCI6IHJldHVybiBjcmVhdGVIVE1MKHBhcmVudCwgdm5vZGUsIG5leHRTaWJsaW5nKVxuXHRcdFx0XHRjYXNlIFwiW1wiOiByZXR1cm4gY3JlYXRlRnJhZ21lbnQocGFyZW50LCB2bm9kZSwgaG9va3MsIG5zLCBuZXh0U2libGluZylcblx0XHRcdFx0ZGVmYXVsdDogcmV0dXJuIGNyZWF0ZUVsZW1lbnQocGFyZW50LCB2bm9kZSwgaG9va3MsIG5zLCBuZXh0U2libGluZylcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSByZXR1cm4gY3JlYXRlQ29tcG9uZW50KHBhcmVudCwgdm5vZGUsIGhvb2tzLCBucywgbmV4dFNpYmxpbmcpXG5cdH1cblx0ZnVuY3Rpb24gY3JlYXRlVGV4dChwYXJlbnQsIHZub2RlLCBuZXh0U2libGluZykge1xuXHRcdHZub2RlLmRvbSA9ICRkb2MuY3JlYXRlVGV4dE5vZGUodm5vZGUuY2hpbGRyZW4pXG5cdFx0aW5zZXJ0Tm9kZShwYXJlbnQsIHZub2RlLmRvbSwgbmV4dFNpYmxpbmcpXG5cdFx0cmV0dXJuIHZub2RlLmRvbVxuXHR9XG5cdGZ1bmN0aW9uIGNyZWF0ZUhUTUwocGFyZW50LCB2bm9kZSwgbmV4dFNpYmxpbmcpIHtcblx0XHR2YXIgbWF0Y2gxID0gdm5vZGUuY2hpbGRyZW4ubWF0Y2goL15cXHMqPzwoXFx3KykvaW0pIHx8IFtdXG5cdFx0dmFyIHBhcmVudDEgPSB7Y2FwdGlvbjogXCJ0YWJsZVwiLCB0aGVhZDogXCJ0YWJsZVwiLCB0Ym9keTogXCJ0YWJsZVwiLCB0Zm9vdDogXCJ0YWJsZVwiLCB0cjogXCJ0Ym9keVwiLCB0aDogXCJ0clwiLCB0ZDogXCJ0clwiLCBjb2xncm91cDogXCJ0YWJsZVwiLCBjb2w6IFwiY29sZ3JvdXBcIn1bbWF0Y2gxWzFdXSB8fCBcImRpdlwiXG5cdFx0dmFyIHRlbXAgPSAkZG9jLmNyZWF0ZUVsZW1lbnQocGFyZW50MSlcblx0XHR0ZW1wLmlubmVySFRNTCA9IHZub2RlLmNoaWxkcmVuXG5cdFx0dm5vZGUuZG9tID0gdGVtcC5maXJzdENoaWxkXG5cdFx0dm5vZGUuZG9tU2l6ZSA9IHRlbXAuY2hpbGROb2Rlcy5sZW5ndGhcblx0XHR2YXIgZnJhZ21lbnQgPSAkZG9jLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxuXHRcdHZhciBjaGlsZFxuXHRcdHdoaWxlIChjaGlsZCA9IHRlbXAuZmlyc3RDaGlsZCkge1xuXHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoY2hpbGQpXG5cdFx0fVxuXHRcdGluc2VydE5vZGUocGFyZW50LCBmcmFnbWVudCwgbmV4dFNpYmxpbmcpXG5cdFx0cmV0dXJuIGZyYWdtZW50XG5cdH1cblx0ZnVuY3Rpb24gY3JlYXRlRnJhZ21lbnQocGFyZW50LCB2bm9kZSwgaG9va3MsIG5zLCBuZXh0U2libGluZykge1xuXHRcdHZhciBmcmFnbWVudCA9ICRkb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG5cdFx0aWYgKHZub2RlLmNoaWxkcmVuICE9IG51bGwpIHtcblx0XHRcdHZhciBjaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuXG5cdFx0XHRjcmVhdGVOb2RlcyhmcmFnbWVudCwgY2hpbGRyZW4sIDAsIGNoaWxkcmVuLmxlbmd0aCwgaG9va3MsIG51bGwsIG5zKVxuXHRcdH1cblx0XHR2bm9kZS5kb20gPSBmcmFnbWVudC5maXJzdENoaWxkXG5cdFx0dm5vZGUuZG9tU2l6ZSA9IGZyYWdtZW50LmNoaWxkTm9kZXMubGVuZ3RoXG5cdFx0aW5zZXJ0Tm9kZShwYXJlbnQsIGZyYWdtZW50LCBuZXh0U2libGluZylcblx0XHRyZXR1cm4gZnJhZ21lbnRcblx0fVxuXHRmdW5jdGlvbiBjcmVhdGVFbGVtZW50KHBhcmVudCwgdm5vZGUsIGhvb2tzLCBucywgbmV4dFNpYmxpbmcpIHtcblx0XHR2YXIgdGFnID0gdm5vZGUudGFnXG5cdFx0dmFyIGF0dHJzMiA9IHZub2RlLmF0dHJzXG5cdFx0dmFyIGlzID0gYXR0cnMyICYmIGF0dHJzMi5pc1xuXHRcdG5zID0gZ2V0TmFtZVNwYWNlKHZub2RlKSB8fCBuc1xuXHRcdHZhciBlbGVtZW50ID0gbnMgP1xuXHRcdFx0aXMgPyAkZG9jLmNyZWF0ZUVsZW1lbnROUyhucywgdGFnLCB7aXM6IGlzfSkgOiAkZG9jLmNyZWF0ZUVsZW1lbnROUyhucywgdGFnKSA6XG5cdFx0XHRpcyA/ICRkb2MuY3JlYXRlRWxlbWVudCh0YWcsIHtpczogaXN9KSA6ICRkb2MuY3JlYXRlRWxlbWVudCh0YWcpXG5cdFx0dm5vZGUuZG9tID0gZWxlbWVudFxuXHRcdGlmIChhdHRyczIgIT0gbnVsbCkge1xuXHRcdFx0c2V0QXR0cnModm5vZGUsIGF0dHJzMiwgbnMpXG5cdFx0fVxuXHRcdGluc2VydE5vZGUocGFyZW50LCBlbGVtZW50LCBuZXh0U2libGluZylcblx0XHRpZiAodm5vZGUuYXR0cnMgIT0gbnVsbCAmJiB2bm9kZS5hdHRycy5jb250ZW50ZWRpdGFibGUgIT0gbnVsbCkge1xuXHRcdFx0c2V0Q29udGVudEVkaXRhYmxlKHZub2RlKVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICh2bm9kZS50ZXh0ICE9IG51bGwpIHtcblx0XHRcdFx0aWYgKHZub2RlLnRleHQgIT09IFwiXCIpIGVsZW1lbnQudGV4dENvbnRlbnQgPSB2bm9kZS50ZXh0XG5cdFx0XHRcdGVsc2Ugdm5vZGUuY2hpbGRyZW4gPSBbVm5vZGUoXCIjXCIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB2bm9kZS50ZXh0LCB1bmRlZmluZWQsIHVuZGVmaW5lZCldXG5cdFx0XHR9XG5cdFx0XHRpZiAodm5vZGUuY2hpbGRyZW4gIT0gbnVsbCkge1xuXHRcdFx0XHR2YXIgY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlblxuXHRcdFx0XHRjcmVhdGVOb2RlcyhlbGVtZW50LCBjaGlsZHJlbiwgMCwgY2hpbGRyZW4ubGVuZ3RoLCBob29rcywgbnVsbCwgbnMpXG5cdFx0XHRcdHNldExhdGVBdHRycyh2bm9kZSlcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGVsZW1lbnRcblx0fVxuXHRmdW5jdGlvbiBpbml0Q29tcG9uZW50KHZub2RlLCBob29rcykge1xuXHRcdHZhciBzZW50aW5lbFxuXHRcdGlmICh0eXBlb2Ygdm5vZGUudGFnLnZpZXcgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0dm5vZGUuc3RhdGUgPSBPYmplY3QuY3JlYXRlKHZub2RlLnRhZylcblx0XHRcdHNlbnRpbmVsID0gdm5vZGUuc3RhdGUudmlld1xuXHRcdFx0aWYgKHNlbnRpbmVsLiQkcmVlbnRyYW50TG9jayQkICE9IG51bGwpIHJldHVybiAkZW1wdHlGcmFnbWVudFxuXHRcdFx0c2VudGluZWwuJCRyZWVudHJhbnRMb2NrJCQgPSB0cnVlXG5cdFx0fSBlbHNlIHtcblx0XHRcdHZub2RlLnN0YXRlID0gdm9pZCAwXG5cdFx0XHRzZW50aW5lbCA9IHZub2RlLnRhZ1xuXHRcdFx0aWYgKHNlbnRpbmVsLiQkcmVlbnRyYW50TG9jayQkICE9IG51bGwpIHJldHVybiAkZW1wdHlGcmFnbWVudFxuXHRcdFx0c2VudGluZWwuJCRyZWVudHJhbnRMb2NrJCQgPSB0cnVlXG5cdFx0XHR2bm9kZS5zdGF0ZSA9ICh2bm9kZS50YWcucHJvdG90eXBlICE9IG51bGwgJiYgdHlwZW9mIHZub2RlLnRhZy5wcm90b3R5cGUudmlldyA9PT0gXCJmdW5jdGlvblwiKSA/IG5ldyB2bm9kZS50YWcodm5vZGUpIDogdm5vZGUudGFnKHZub2RlKVxuXHRcdH1cblx0XHR2bm9kZS5fc3RhdGUgPSB2bm9kZS5zdGF0ZVxuXHRcdGlmICh2bm9kZS5hdHRycyAhPSBudWxsKSBpbml0TGlmZWN5Y2xlKHZub2RlLmF0dHJzLCB2bm9kZSwgaG9va3MpXG5cdFx0aW5pdExpZmVjeWNsZSh2bm9kZS5fc3RhdGUsIHZub2RlLCBob29rcylcblx0XHR2bm9kZS5pbnN0YW5jZSA9IFZub2RlLm5vcm1hbGl6ZSh2bm9kZS5fc3RhdGUudmlldy5jYWxsKHZub2RlLnN0YXRlLCB2bm9kZSkpXG5cdFx0aWYgKHZub2RlLmluc3RhbmNlID09PSB2bm9kZSkgdGhyb3cgRXJyb3IoXCJBIHZpZXcgY2Fubm90IHJldHVybiB0aGUgdm5vZGUgaXQgcmVjZWl2ZWQgYXMgYXJndW1lbnRcIilcblx0XHRzZW50aW5lbC4kJHJlZW50cmFudExvY2skJCA9IG51bGxcblx0fVxuXHRmdW5jdGlvbiBjcmVhdGVDb21wb25lbnQocGFyZW50LCB2bm9kZSwgaG9va3MsIG5zLCBuZXh0U2libGluZykge1xuXHRcdGluaXRDb21wb25lbnQodm5vZGUsIGhvb2tzKVxuXHRcdGlmICh2bm9kZS5pbnN0YW5jZSAhPSBudWxsKSB7XG5cdFx0XHR2YXIgZWxlbWVudCA9IGNyZWF0ZU5vZGUocGFyZW50LCB2bm9kZS5pbnN0YW5jZSwgaG9va3MsIG5zLCBuZXh0U2libGluZylcblx0XHRcdHZub2RlLmRvbSA9IHZub2RlLmluc3RhbmNlLmRvbVxuXHRcdFx0dm5vZGUuZG9tU2l6ZSA9IHZub2RlLmRvbSAhPSBudWxsID8gdm5vZGUuaW5zdGFuY2UuZG9tU2l6ZSA6IDBcblx0XHRcdGluc2VydE5vZGUocGFyZW50LCBlbGVtZW50LCBuZXh0U2libGluZylcblx0XHRcdHJldHVybiBlbGVtZW50XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dm5vZGUuZG9tU2l6ZSA9IDBcblx0XHRcdHJldHVybiAkZW1wdHlGcmFnbWVudFxuXHRcdH1cblx0fVxuXHQvL3VwZGF0ZVxuXHRmdW5jdGlvbiB1cGRhdGVOb2RlcyhwYXJlbnQsIG9sZCwgdm5vZGVzLCByZWN5Y2xpbmcsIGhvb2tzLCBuZXh0U2libGluZywgbnMpIHtcblx0XHRpZiAob2xkID09PSB2bm9kZXMgfHwgb2xkID09IG51bGwgJiYgdm5vZGVzID09IG51bGwpIHJldHVyblxuXHRcdGVsc2UgaWYgKG9sZCA9PSBudWxsKSBjcmVhdGVOb2RlcyhwYXJlbnQsIHZub2RlcywgMCwgdm5vZGVzLmxlbmd0aCwgaG9va3MsIG5leHRTaWJsaW5nLCBucylcblx0XHRlbHNlIGlmICh2bm9kZXMgPT0gbnVsbCkgcmVtb3ZlTm9kZXMob2xkLCAwLCBvbGQubGVuZ3RoLCB2bm9kZXMpXG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAob2xkLmxlbmd0aCA9PT0gdm5vZGVzLmxlbmd0aCkge1xuXHRcdFx0XHR2YXIgaXNVbmtleWVkID0gZmFsc2Vcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB2bm9kZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRpZiAodm5vZGVzW2ldICE9IG51bGwgJiYgb2xkW2ldICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdGlzVW5rZXllZCA9IHZub2Rlc1tpXS5rZXkgPT0gbnVsbCAmJiBvbGRbaV0ua2V5ID09IG51bGxcblx0XHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChpc1Vua2V5ZWQpIHtcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG9sZC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0aWYgKG9sZFtpXSA9PT0gdm5vZGVzW2ldKSBjb250aW51ZVxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAob2xkW2ldID09IG51bGwgJiYgdm5vZGVzW2ldICE9IG51bGwpIGNyZWF0ZU5vZGUocGFyZW50LCB2bm9kZXNbaV0sIGhvb2tzLCBucywgZ2V0TmV4dFNpYmxpbmcob2xkLCBpICsgMSwgbmV4dFNpYmxpbmcpKVxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAodm5vZGVzW2ldID09IG51bGwpIHJlbW92ZU5vZGVzKG9sZCwgaSwgaSArIDEsIHZub2Rlcylcblx0XHRcdFx0XHRcdGVsc2UgdXBkYXRlTm9kZShwYXJlbnQsIG9sZFtpXSwgdm5vZGVzW2ldLCBob29rcywgZ2V0TmV4dFNpYmxpbmcob2xkLCBpICsgMSwgbmV4dFNpYmxpbmcpLCByZWN5Y2xpbmcsIG5zKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmVjeWNsaW5nID0gcmVjeWNsaW5nIHx8IGlzUmVjeWNsYWJsZShvbGQsIHZub2Rlcylcblx0XHRcdGlmIChyZWN5Y2xpbmcpIHtcblx0XHRcdFx0dmFyIHBvb2wgPSBvbGQucG9vbFxuXHRcdFx0XHRvbGQgPSBvbGQuY29uY2F0KG9sZC5wb29sKVxuXHRcdFx0fVxuXHRcdFx0dmFyIG9sZFN0YXJ0ID0gMCwgc3RhcnQgPSAwLCBvbGRFbmQgPSBvbGQubGVuZ3RoIC0gMSwgZW5kID0gdm5vZGVzLmxlbmd0aCAtIDEsIG1hcFxuXHRcdFx0d2hpbGUgKG9sZEVuZCA+PSBvbGRTdGFydCAmJiBlbmQgPj0gc3RhcnQpIHtcblx0XHRcdFx0dmFyIG8gPSBvbGRbb2xkU3RhcnRdLCB2ID0gdm5vZGVzW3N0YXJ0XVxuXHRcdFx0XHRpZiAobyA9PT0gdiAmJiAhcmVjeWNsaW5nKSBvbGRTdGFydCsrLCBzdGFydCsrXG5cdFx0XHRcdGVsc2UgaWYgKG8gPT0gbnVsbCkgb2xkU3RhcnQrK1xuXHRcdFx0XHRlbHNlIGlmICh2ID09IG51bGwpIHN0YXJ0Kytcblx0XHRcdFx0ZWxzZSBpZiAoby5rZXkgPT09IHYua2V5KSB7XG5cdFx0XHRcdFx0dmFyIHNob3VsZFJlY3ljbGUgPSAocG9vbCAhPSBudWxsICYmIG9sZFN0YXJ0ID49IG9sZC5sZW5ndGggLSBwb29sLmxlbmd0aCkgfHwgKChwb29sID09IG51bGwpICYmIHJlY3ljbGluZylcblx0XHRcdFx0XHRvbGRTdGFydCsrLCBzdGFydCsrXG5cdFx0XHRcdFx0dXBkYXRlTm9kZShwYXJlbnQsIG8sIHYsIGhvb2tzLCBnZXROZXh0U2libGluZyhvbGQsIG9sZFN0YXJ0LCBuZXh0U2libGluZyksIHNob3VsZFJlY3ljbGUsIG5zKVxuXHRcdFx0XHRcdGlmIChyZWN5Y2xpbmcgJiYgby50YWcgPT09IHYudGFnKSBpbnNlcnROb2RlKHBhcmVudCwgdG9GcmFnbWVudChvKSwgbmV4dFNpYmxpbmcpXG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0dmFyIG8gPSBvbGRbb2xkRW5kXVxuXHRcdFx0XHRcdGlmIChvID09PSB2ICYmICFyZWN5Y2xpbmcpIG9sZEVuZC0tLCBzdGFydCsrXG5cdFx0XHRcdFx0ZWxzZSBpZiAobyA9PSBudWxsKSBvbGRFbmQtLVxuXHRcdFx0XHRcdGVsc2UgaWYgKHYgPT0gbnVsbCkgc3RhcnQrK1xuXHRcdFx0XHRcdGVsc2UgaWYgKG8ua2V5ID09PSB2LmtleSkge1xuXHRcdFx0XHRcdFx0dmFyIHNob3VsZFJlY3ljbGUgPSAocG9vbCAhPSBudWxsICYmIG9sZEVuZCA+PSBvbGQubGVuZ3RoIC0gcG9vbC5sZW5ndGgpIHx8ICgocG9vbCA9PSBudWxsKSAmJiByZWN5Y2xpbmcpXG5cdFx0XHRcdFx0XHR1cGRhdGVOb2RlKHBhcmVudCwgbywgdiwgaG9va3MsIGdldE5leHRTaWJsaW5nKG9sZCwgb2xkRW5kICsgMSwgbmV4dFNpYmxpbmcpLCBzaG91bGRSZWN5Y2xlLCBucylcblx0XHRcdFx0XHRcdGlmIChyZWN5Y2xpbmcgfHwgc3RhcnQgPCBlbmQpIGluc2VydE5vZGUocGFyZW50LCB0b0ZyYWdtZW50KG8pLCBnZXROZXh0U2libGluZyhvbGQsIG9sZFN0YXJ0LCBuZXh0U2libGluZykpXG5cdFx0XHRcdFx0XHRvbGRFbmQtLSwgc3RhcnQrK1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGJyZWFrXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHdoaWxlIChvbGRFbmQgPj0gb2xkU3RhcnQgJiYgZW5kID49IHN0YXJ0KSB7XG5cdFx0XHRcdHZhciBvID0gb2xkW29sZEVuZF0sIHYgPSB2bm9kZXNbZW5kXVxuXHRcdFx0XHRpZiAobyA9PT0gdiAmJiAhcmVjeWNsaW5nKSBvbGRFbmQtLSwgZW5kLS1cblx0XHRcdFx0ZWxzZSBpZiAobyA9PSBudWxsKSBvbGRFbmQtLVxuXHRcdFx0XHRlbHNlIGlmICh2ID09IG51bGwpIGVuZC0tXG5cdFx0XHRcdGVsc2UgaWYgKG8ua2V5ID09PSB2LmtleSkge1xuXHRcdFx0XHRcdHZhciBzaG91bGRSZWN5Y2xlID0gKHBvb2wgIT0gbnVsbCAmJiBvbGRFbmQgPj0gb2xkLmxlbmd0aCAtIHBvb2wubGVuZ3RoKSB8fCAoKHBvb2wgPT0gbnVsbCkgJiYgcmVjeWNsaW5nKVxuXHRcdFx0XHRcdHVwZGF0ZU5vZGUocGFyZW50LCBvLCB2LCBob29rcywgZ2V0TmV4dFNpYmxpbmcob2xkLCBvbGRFbmQgKyAxLCBuZXh0U2libGluZyksIHNob3VsZFJlY3ljbGUsIG5zKVxuXHRcdFx0XHRcdGlmIChyZWN5Y2xpbmcgJiYgby50YWcgPT09IHYudGFnKSBpbnNlcnROb2RlKHBhcmVudCwgdG9GcmFnbWVudChvKSwgbmV4dFNpYmxpbmcpXG5cdFx0XHRcdFx0aWYgKG8uZG9tICE9IG51bGwpIG5leHRTaWJsaW5nID0gby5kb21cblx0XHRcdFx0XHRvbGRFbmQtLSwgZW5kLS1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRpZiAoIW1hcCkgbWFwID0gZ2V0S2V5TWFwKG9sZCwgb2xkRW5kKVxuXHRcdFx0XHRcdGlmICh2ICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdHZhciBvbGRJbmRleCA9IG1hcFt2LmtleV1cblx0XHRcdFx0XHRcdGlmIChvbGRJbmRleCAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBtb3ZhYmxlID0gb2xkW29sZEluZGV4XVxuXHRcdFx0XHRcdFx0XHR2YXIgc2hvdWxkUmVjeWNsZSA9IChwb29sICE9IG51bGwgJiYgb2xkSW5kZXggPj0gb2xkLmxlbmd0aCAtIHBvb2wubGVuZ3RoKSB8fCAoKHBvb2wgPT0gbnVsbCkgJiYgcmVjeWNsaW5nKVxuXHRcdFx0XHRcdFx0XHR1cGRhdGVOb2RlKHBhcmVudCwgbW92YWJsZSwgdiwgaG9va3MsIGdldE5leHRTaWJsaW5nKG9sZCwgb2xkRW5kICsgMSwgbmV4dFNpYmxpbmcpLCByZWN5Y2xpbmcsIG5zKVxuXHRcdFx0XHRcdFx0XHRpbnNlcnROb2RlKHBhcmVudCwgdG9GcmFnbWVudChtb3ZhYmxlKSwgbmV4dFNpYmxpbmcpXG5cdFx0XHRcdFx0XHRcdG9sZFtvbGRJbmRleF0uc2tpcCA9IHRydWVcblx0XHRcdFx0XHRcdFx0aWYgKG1vdmFibGUuZG9tICE9IG51bGwpIG5leHRTaWJsaW5nID0gbW92YWJsZS5kb21cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR2YXIgZG9tID0gY3JlYXRlTm9kZShwYXJlbnQsIHYsIGhvb2tzLCBucywgbmV4dFNpYmxpbmcpXG5cdFx0XHRcdFx0XHRcdG5leHRTaWJsaW5nID0gZG9tXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVuZC0tXG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGVuZCA8IHN0YXJ0KSBicmVha1xuXHRcdFx0fVxuXHRcdFx0Y3JlYXRlTm9kZXMocGFyZW50LCB2bm9kZXMsIHN0YXJ0LCBlbmQgKyAxLCBob29rcywgbmV4dFNpYmxpbmcsIG5zKVxuXHRcdFx0cmVtb3ZlTm9kZXMob2xkLCBvbGRTdGFydCwgb2xkRW5kICsgMSwgdm5vZGVzKVxuXHRcdH1cblx0fVxuXHRmdW5jdGlvbiB1cGRhdGVOb2RlKHBhcmVudCwgb2xkLCB2bm9kZSwgaG9va3MsIG5leHRTaWJsaW5nLCByZWN5Y2xpbmcsIG5zKSB7XG5cdFx0dmFyIG9sZFRhZyA9IG9sZC50YWcsIHRhZyA9IHZub2RlLnRhZ1xuXHRcdGlmIChvbGRUYWcgPT09IHRhZykge1xuXHRcdFx0dm5vZGUuc3RhdGUgPSBvbGQuc3RhdGVcblx0XHRcdHZub2RlLl9zdGF0ZSA9IG9sZC5fc3RhdGVcblx0XHRcdHZub2RlLmV2ZW50cyA9IG9sZC5ldmVudHNcblx0XHRcdGlmICghcmVjeWNsaW5nICYmIHNob3VsZE5vdFVwZGF0ZSh2bm9kZSwgb2xkKSkgcmV0dXJuXG5cdFx0XHRpZiAodHlwZW9mIG9sZFRhZyA9PT0gXCJzdHJpbmdcIikge1xuXHRcdFx0XHRpZiAodm5vZGUuYXR0cnMgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGlmIChyZWN5Y2xpbmcpIHtcblx0XHRcdFx0XHRcdHZub2RlLnN0YXRlID0ge31cblx0XHRcdFx0XHRcdGluaXRMaWZlY3ljbGUodm5vZGUuYXR0cnMsIHZub2RlLCBob29rcylcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB1cGRhdGVMaWZlY3ljbGUodm5vZGUuYXR0cnMsIHZub2RlLCBob29rcylcblx0XHRcdFx0fVxuXHRcdFx0XHRzd2l0Y2ggKG9sZFRhZykge1xuXHRcdFx0XHRcdGNhc2UgXCIjXCI6IHVwZGF0ZVRleHQob2xkLCB2bm9kZSk7IGJyZWFrXG5cdFx0XHRcdFx0Y2FzZSBcIjxcIjogdXBkYXRlSFRNTChwYXJlbnQsIG9sZCwgdm5vZGUsIG5leHRTaWJsaW5nKTsgYnJlYWtcblx0XHRcdFx0XHRjYXNlIFwiW1wiOiB1cGRhdGVGcmFnbWVudChwYXJlbnQsIG9sZCwgdm5vZGUsIHJlY3ljbGluZywgaG9va3MsIG5leHRTaWJsaW5nLCBucyk7IGJyZWFrXG5cdFx0XHRcdFx0ZGVmYXVsdDogdXBkYXRlRWxlbWVudChvbGQsIHZub2RlLCByZWN5Y2xpbmcsIGhvb2tzLCBucylcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB1cGRhdGVDb21wb25lbnQocGFyZW50LCBvbGQsIHZub2RlLCBob29rcywgbmV4dFNpYmxpbmcsIHJlY3ljbGluZywgbnMpXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmVtb3ZlTm9kZShvbGQsIG51bGwpXG5cdFx0XHRjcmVhdGVOb2RlKHBhcmVudCwgdm5vZGUsIGhvb2tzLCBucywgbmV4dFNpYmxpbmcpXG5cdFx0fVxuXHR9XG5cdGZ1bmN0aW9uIHVwZGF0ZVRleHQob2xkLCB2bm9kZSkge1xuXHRcdGlmIChvbGQuY2hpbGRyZW4udG9TdHJpbmcoKSAhPT0gdm5vZGUuY2hpbGRyZW4udG9TdHJpbmcoKSkge1xuXHRcdFx0b2xkLmRvbS5ub2RlVmFsdWUgPSB2bm9kZS5jaGlsZHJlblxuXHRcdH1cblx0XHR2bm9kZS5kb20gPSBvbGQuZG9tXG5cdH1cblx0ZnVuY3Rpb24gdXBkYXRlSFRNTChwYXJlbnQsIG9sZCwgdm5vZGUsIG5leHRTaWJsaW5nKSB7XG5cdFx0aWYgKG9sZC5jaGlsZHJlbiAhPT0gdm5vZGUuY2hpbGRyZW4pIHtcblx0XHRcdHRvRnJhZ21lbnQob2xkKVxuXHRcdFx0Y3JlYXRlSFRNTChwYXJlbnQsIHZub2RlLCBuZXh0U2libGluZylcblx0XHR9XG5cdFx0ZWxzZSB2bm9kZS5kb20gPSBvbGQuZG9tLCB2bm9kZS5kb21TaXplID0gb2xkLmRvbVNpemVcblx0fVxuXHRmdW5jdGlvbiB1cGRhdGVGcmFnbWVudChwYXJlbnQsIG9sZCwgdm5vZGUsIHJlY3ljbGluZywgaG9va3MsIG5leHRTaWJsaW5nLCBucykge1xuXHRcdHVwZGF0ZU5vZGVzKHBhcmVudCwgb2xkLmNoaWxkcmVuLCB2bm9kZS5jaGlsZHJlbiwgcmVjeWNsaW5nLCBob29rcywgbmV4dFNpYmxpbmcsIG5zKVxuXHRcdHZhciBkb21TaXplID0gMCwgY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlblxuXHRcdHZub2RlLmRvbSA9IG51bGxcblx0XHRpZiAoY2hpbGRyZW4gIT0gbnVsbCkge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIgY2hpbGQgPSBjaGlsZHJlbltpXVxuXHRcdFx0XHRpZiAoY2hpbGQgIT0gbnVsbCAmJiBjaGlsZC5kb20gIT0gbnVsbCkge1xuXHRcdFx0XHRcdGlmICh2bm9kZS5kb20gPT0gbnVsbCkgdm5vZGUuZG9tID0gY2hpbGQuZG9tXG5cdFx0XHRcdFx0ZG9tU2l6ZSArPSBjaGlsZC5kb21TaXplIHx8IDFcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKGRvbVNpemUgIT09IDEpIHZub2RlLmRvbVNpemUgPSBkb21TaXplXG5cdFx0fVxuXHR9XG5cdGZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQob2xkLCB2bm9kZSwgcmVjeWNsaW5nLCBob29rcywgbnMpIHtcblx0XHR2YXIgZWxlbWVudCA9IHZub2RlLmRvbSA9IG9sZC5kb21cblx0XHRucyA9IGdldE5hbWVTcGFjZSh2bm9kZSkgfHwgbnNcblx0XHRpZiAodm5vZGUudGFnID09PSBcInRleHRhcmVhXCIpIHtcblx0XHRcdGlmICh2bm9kZS5hdHRycyA9PSBudWxsKSB2bm9kZS5hdHRycyA9IHt9XG5cdFx0XHRpZiAodm5vZGUudGV4dCAhPSBudWxsKSB7XG5cdFx0XHRcdHZub2RlLmF0dHJzLnZhbHVlID0gdm5vZGUudGV4dCAvL0ZJWE1FIGhhbmRsZTAgbXVsdGlwbGUgY2hpbGRyZW5cblx0XHRcdFx0dm5vZGUudGV4dCA9IHVuZGVmaW5lZFxuXHRcdFx0fVxuXHRcdH1cblx0XHR1cGRhdGVBdHRycyh2bm9kZSwgb2xkLmF0dHJzLCB2bm9kZS5hdHRycywgbnMpXG5cdFx0aWYgKHZub2RlLmF0dHJzICE9IG51bGwgJiYgdm5vZGUuYXR0cnMuY29udGVudGVkaXRhYmxlICE9IG51bGwpIHtcblx0XHRcdHNldENvbnRlbnRFZGl0YWJsZSh2bm9kZSlcblx0XHR9XG5cdFx0ZWxzZSBpZiAob2xkLnRleHQgIT0gbnVsbCAmJiB2bm9kZS50ZXh0ICE9IG51bGwgJiYgdm5vZGUudGV4dCAhPT0gXCJcIikge1xuXHRcdFx0aWYgKG9sZC50ZXh0LnRvU3RyaW5nKCkgIT09IHZub2RlLnRleHQudG9TdHJpbmcoKSkgb2xkLmRvbS5maXJzdENoaWxkLm5vZGVWYWx1ZSA9IHZub2RlLnRleHRcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRpZiAob2xkLnRleHQgIT0gbnVsbCkgb2xkLmNoaWxkcmVuID0gW1Zub2RlKFwiI1wiLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgb2xkLnRleHQsIHVuZGVmaW5lZCwgb2xkLmRvbS5maXJzdENoaWxkKV1cblx0XHRcdGlmICh2bm9kZS50ZXh0ICE9IG51bGwpIHZub2RlLmNoaWxkcmVuID0gW1Zub2RlKFwiI1wiLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdm5vZGUudGV4dCwgdW5kZWZpbmVkLCB1bmRlZmluZWQpXVxuXHRcdFx0dXBkYXRlTm9kZXMoZWxlbWVudCwgb2xkLmNoaWxkcmVuLCB2bm9kZS5jaGlsZHJlbiwgcmVjeWNsaW5nLCBob29rcywgbnVsbCwgbnMpXG5cdFx0fVxuXHR9XG5cdGZ1bmN0aW9uIHVwZGF0ZUNvbXBvbmVudChwYXJlbnQsIG9sZCwgdm5vZGUsIGhvb2tzLCBuZXh0U2libGluZywgcmVjeWNsaW5nLCBucykge1xuXHRcdGlmIChyZWN5Y2xpbmcpIHtcblx0XHRcdGluaXRDb21wb25lbnQodm5vZGUsIGhvb2tzKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR2bm9kZS5pbnN0YW5jZSA9IFZub2RlLm5vcm1hbGl6ZSh2bm9kZS5fc3RhdGUudmlldy5jYWxsKHZub2RlLnN0YXRlLCB2bm9kZSkpXG5cdFx0XHRpZiAodm5vZGUuaW5zdGFuY2UgPT09IHZub2RlKSB0aHJvdyBFcnJvcihcIkEgdmlldyBjYW5ub3QgcmV0dXJuIHRoZSB2bm9kZSBpdCByZWNlaXZlZCBhcyBhcmd1bWVudFwiKVxuXHRcdFx0aWYgKHZub2RlLmF0dHJzICE9IG51bGwpIHVwZGF0ZUxpZmVjeWNsZSh2bm9kZS5hdHRycywgdm5vZGUsIGhvb2tzKVxuXHRcdFx0dXBkYXRlTGlmZWN5Y2xlKHZub2RlLl9zdGF0ZSwgdm5vZGUsIGhvb2tzKVxuXHRcdH1cblx0XHRpZiAodm5vZGUuaW5zdGFuY2UgIT0gbnVsbCkge1xuXHRcdFx0aWYgKG9sZC5pbnN0YW5jZSA9PSBudWxsKSBjcmVhdGVOb2RlKHBhcmVudCwgdm5vZGUuaW5zdGFuY2UsIGhvb2tzLCBucywgbmV4dFNpYmxpbmcpXG5cdFx0XHRlbHNlIHVwZGF0ZU5vZGUocGFyZW50LCBvbGQuaW5zdGFuY2UsIHZub2RlLmluc3RhbmNlLCBob29rcywgbmV4dFNpYmxpbmcsIHJlY3ljbGluZywgbnMpXG5cdFx0XHR2bm9kZS5kb20gPSB2bm9kZS5pbnN0YW5jZS5kb21cblx0XHRcdHZub2RlLmRvbVNpemUgPSB2bm9kZS5pbnN0YW5jZS5kb21TaXplXG5cdFx0fVxuXHRcdGVsc2UgaWYgKG9sZC5pbnN0YW5jZSAhPSBudWxsKSB7XG5cdFx0XHRyZW1vdmVOb2RlKG9sZC5pbnN0YW5jZSwgbnVsbClcblx0XHRcdHZub2RlLmRvbSA9IHVuZGVmaW5lZFxuXHRcdFx0dm5vZGUuZG9tU2l6ZSA9IDBcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHR2bm9kZS5kb20gPSBvbGQuZG9tXG5cdFx0XHR2bm9kZS5kb21TaXplID0gb2xkLmRvbVNpemVcblx0XHR9XG5cdH1cblx0ZnVuY3Rpb24gaXNSZWN5Y2xhYmxlKG9sZCwgdm5vZGVzKSB7XG5cdFx0aWYgKG9sZC5wb29sICE9IG51bGwgJiYgTWF0aC5hYnMob2xkLnBvb2wubGVuZ3RoIC0gdm5vZGVzLmxlbmd0aCkgPD0gTWF0aC5hYnMob2xkLmxlbmd0aCAtIHZub2Rlcy5sZW5ndGgpKSB7XG5cdFx0XHR2YXIgb2xkQ2hpbGRyZW5MZW5ndGggPSBvbGRbMF0gJiYgb2xkWzBdLmNoaWxkcmVuICYmIG9sZFswXS5jaGlsZHJlbi5sZW5ndGggfHwgMFxuXHRcdFx0dmFyIHBvb2xDaGlsZHJlbkxlbmd0aCA9IG9sZC5wb29sWzBdICYmIG9sZC5wb29sWzBdLmNoaWxkcmVuICYmIG9sZC5wb29sWzBdLmNoaWxkcmVuLmxlbmd0aCB8fCAwXG5cdFx0XHR2YXIgdm5vZGVzQ2hpbGRyZW5MZW5ndGggPSB2bm9kZXNbMF0gJiYgdm5vZGVzWzBdLmNoaWxkcmVuICYmIHZub2Rlc1swXS5jaGlsZHJlbi5sZW5ndGggfHwgMFxuXHRcdFx0aWYgKE1hdGguYWJzKHBvb2xDaGlsZHJlbkxlbmd0aCAtIHZub2Rlc0NoaWxkcmVuTGVuZ3RoKSA8PSBNYXRoLmFicyhvbGRDaGlsZHJlbkxlbmd0aCAtIHZub2Rlc0NoaWxkcmVuTGVuZ3RoKSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2Vcblx0fVxuXHRmdW5jdGlvbiBnZXRLZXlNYXAodm5vZGVzLCBlbmQpIHtcblx0XHR2YXIgbWFwID0ge30sIGkgPSAwXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBlbmQ7IGkrKykge1xuXHRcdFx0dmFyIHZub2RlID0gdm5vZGVzW2ldXG5cdFx0XHRpZiAodm5vZGUgIT0gbnVsbCkge1xuXHRcdFx0XHR2YXIga2V5MiA9IHZub2RlLmtleVxuXHRcdFx0XHRpZiAoa2V5MiAhPSBudWxsKSBtYXBba2V5Ml0gPSBpXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBtYXBcblx0fVxuXHRmdW5jdGlvbiB0b0ZyYWdtZW50KHZub2RlKSB7XG5cdFx0dmFyIGNvdW50MCA9IHZub2RlLmRvbVNpemVcblx0XHRpZiAoY291bnQwICE9IG51bGwgfHwgdm5vZGUuZG9tID09IG51bGwpIHtcblx0XHRcdHZhciBmcmFnbWVudCA9ICRkb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG5cdFx0XHRpZiAoY291bnQwID4gMCkge1xuXHRcdFx0XHR2YXIgZG9tID0gdm5vZGUuZG9tXG5cdFx0XHRcdHdoaWxlICgtLWNvdW50MCkgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoZG9tLm5leHRTaWJsaW5nKVxuXHRcdFx0XHRmcmFnbWVudC5pbnNlcnRCZWZvcmUoZG9tLCBmcmFnbWVudC5maXJzdENoaWxkKVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZyYWdtZW50XG5cdFx0fVxuXHRcdGVsc2UgcmV0dXJuIHZub2RlLmRvbVxuXHR9XG5cdGZ1bmN0aW9uIGdldE5leHRTaWJsaW5nKHZub2RlcywgaSwgbmV4dFNpYmxpbmcpIHtcblx0XHRmb3IgKDsgaSA8IHZub2Rlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKHZub2Rlc1tpXSAhPSBudWxsICYmIHZub2Rlc1tpXS5kb20gIT0gbnVsbCkgcmV0dXJuIHZub2Rlc1tpXS5kb21cblx0XHR9XG5cdFx0cmV0dXJuIG5leHRTaWJsaW5nXG5cdH1cblx0ZnVuY3Rpb24gaW5zZXJ0Tm9kZShwYXJlbnQsIGRvbSwgbmV4dFNpYmxpbmcpIHtcblx0XHRpZiAobmV4dFNpYmxpbmcgJiYgbmV4dFNpYmxpbmcucGFyZW50Tm9kZSkgcGFyZW50Lmluc2VydEJlZm9yZShkb20sIG5leHRTaWJsaW5nKVxuXHRcdGVsc2UgcGFyZW50LmFwcGVuZENoaWxkKGRvbSlcblx0fVxuXHRmdW5jdGlvbiBzZXRDb250ZW50RWRpdGFibGUodm5vZGUpIHtcblx0XHR2YXIgY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlblxuXHRcdGlmIChjaGlsZHJlbiAhPSBudWxsICYmIGNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiBjaGlsZHJlblswXS50YWcgPT09IFwiPFwiKSB7XG5cdFx0XHR2YXIgY29udGVudCA9IGNoaWxkcmVuWzBdLmNoaWxkcmVuXG5cdFx0XHRpZiAodm5vZGUuZG9tLmlubmVySFRNTCAhPT0gY29udGVudCkgdm5vZGUuZG9tLmlubmVySFRNTCA9IGNvbnRlbnRcblx0XHR9XG5cdFx0ZWxzZSBpZiAodm5vZGUudGV4dCAhPSBudWxsIHx8IGNoaWxkcmVuICE9IG51bGwgJiYgY2hpbGRyZW4ubGVuZ3RoICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoXCJDaGlsZCBub2RlIG9mIGEgY29udGVudGVkaXRhYmxlIG11c3QgYmUgdHJ1c3RlZFwiKVxuXHR9XG5cdC8vcmVtb3ZlXG5cdGZ1bmN0aW9uIHJlbW92ZU5vZGVzKHZub2Rlcywgc3RhcnQsIGVuZCwgY29udGV4dCkge1xuXHRcdGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG5cdFx0XHR2YXIgdm5vZGUgPSB2bm9kZXNbaV1cblx0XHRcdGlmICh2bm9kZSAhPSBudWxsKSB7XG5cdFx0XHRcdGlmICh2bm9kZS5za2lwKSB2bm9kZS5za2lwID0gZmFsc2Vcblx0XHRcdFx0ZWxzZSByZW1vdmVOb2RlKHZub2RlLCBjb250ZXh0KVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRmdW5jdGlvbiByZW1vdmVOb2RlKHZub2RlLCBjb250ZXh0KSB7XG5cdFx0dmFyIGV4cGVjdGVkID0gMSwgY2FsbGVkID0gMFxuXHRcdGlmICh2bm9kZS5hdHRycyAmJiB0eXBlb2Ygdm5vZGUuYXR0cnMub25iZWZvcmVyZW1vdmUgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0dmFyIHJlc3VsdCA9IHZub2RlLmF0dHJzLm9uYmVmb3JlcmVtb3ZlLmNhbGwodm5vZGUuc3RhdGUsIHZub2RlKVxuXHRcdFx0aWYgKHJlc3VsdCAhPSBudWxsICYmIHR5cGVvZiByZXN1bHQudGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRcdGV4cGVjdGVkKytcblx0XHRcdFx0cmVzdWx0LnRoZW4oY29udGludWF0aW9uLCBjb250aW51YXRpb24pXG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICh0eXBlb2Ygdm5vZGUudGFnICE9PSBcInN0cmluZ1wiICYmIHR5cGVvZiB2bm9kZS5fc3RhdGUub25iZWZvcmVyZW1vdmUgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0dmFyIHJlc3VsdCA9IHZub2RlLl9zdGF0ZS5vbmJlZm9yZXJlbW92ZS5jYWxsKHZub2RlLnN0YXRlLCB2bm9kZSlcblx0XHRcdGlmIChyZXN1bHQgIT0gbnVsbCAmJiB0eXBlb2YgcmVzdWx0LnRoZW4gPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0XHRleHBlY3RlZCsrXG5cdFx0XHRcdHJlc3VsdC50aGVuKGNvbnRpbnVhdGlvbiwgY29udGludWF0aW9uKVxuXHRcdFx0fVxuXHRcdH1cblx0XHRjb250aW51YXRpb24oKVxuXHRcdGZ1bmN0aW9uIGNvbnRpbnVhdGlvbigpIHtcblx0XHRcdGlmICgrK2NhbGxlZCA9PT0gZXhwZWN0ZWQpIHtcblx0XHRcdFx0b25yZW1vdmUodm5vZGUpXG5cdFx0XHRcdGlmICh2bm9kZS5kb20pIHtcblx0XHRcdFx0XHR2YXIgY291bnQwID0gdm5vZGUuZG9tU2l6ZSB8fCAxXG5cdFx0XHRcdFx0aWYgKGNvdW50MCA+IDEpIHtcblx0XHRcdFx0XHRcdHZhciBkb20gPSB2bm9kZS5kb21cblx0XHRcdFx0XHRcdHdoaWxlICgtLWNvdW50MCkge1xuXHRcdFx0XHRcdFx0XHRyZW1vdmVOb2RlRnJvbURPTShkb20ubmV4dFNpYmxpbmcpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJlbW92ZU5vZGVGcm9tRE9NKHZub2RlLmRvbSlcblx0XHRcdFx0XHRpZiAoY29udGV4dCAhPSBudWxsICYmIHZub2RlLmRvbVNpemUgPT0gbnVsbCAmJiAhaGFzSW50ZWdyYXRpb25NZXRob2RzKHZub2RlLmF0dHJzKSAmJiB0eXBlb2Ygdm5vZGUudGFnID09PSBcInN0cmluZ1wiKSB7IC8vVE9ETyB0ZXN0IGN1c3RvbSBlbGVtZW50c1xuXHRcdFx0XHRcdFx0aWYgKCFjb250ZXh0LnBvb2wpIGNvbnRleHQucG9vbCA9IFt2bm9kZV1cblx0XHRcdFx0XHRcdGVsc2UgY29udGV4dC5wb29sLnB1c2godm5vZGUpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdGZ1bmN0aW9uIHJlbW92ZU5vZGVGcm9tRE9NKG5vZGUpIHtcblx0XHR2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlXG5cdFx0aWYgKHBhcmVudCAhPSBudWxsKSBwYXJlbnQucmVtb3ZlQ2hpbGQobm9kZSlcblx0fVxuXHRmdW5jdGlvbiBvbnJlbW92ZSh2bm9kZSkge1xuXHRcdGlmICh2bm9kZS5hdHRycyAmJiB0eXBlb2Ygdm5vZGUuYXR0cnMub25yZW1vdmUgPT09IFwiZnVuY3Rpb25cIikgdm5vZGUuYXR0cnMub25yZW1vdmUuY2FsbCh2bm9kZS5zdGF0ZSwgdm5vZGUpXG5cdFx0aWYgKHR5cGVvZiB2bm9kZS50YWcgIT09IFwic3RyaW5nXCIpIHtcblx0XHRcdGlmICh0eXBlb2Ygdm5vZGUuX3N0YXRlLm9ucmVtb3ZlID09PSBcImZ1bmN0aW9uXCIpIHZub2RlLl9zdGF0ZS5vbnJlbW92ZS5jYWxsKHZub2RlLnN0YXRlLCB2bm9kZSlcblx0XHRcdGlmICh2bm9kZS5pbnN0YW5jZSAhPSBudWxsKSBvbnJlbW92ZSh2bm9kZS5pbnN0YW5jZSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIGNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW5cblx0XHRcdGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuKSkge1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0dmFyIGNoaWxkID0gY2hpbGRyZW5baV1cblx0XHRcdFx0XHRpZiAoY2hpbGQgIT0gbnVsbCkgb25yZW1vdmUoY2hpbGQpXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0Ly9hdHRyczJcblx0ZnVuY3Rpb24gc2V0QXR0cnModm5vZGUsIGF0dHJzMiwgbnMpIHtcblx0XHRmb3IgKHZhciBrZXkyIGluIGF0dHJzMikge1xuXHRcdFx0c2V0QXR0cih2bm9kZSwga2V5MiwgbnVsbCwgYXR0cnMyW2tleTJdLCBucylcblx0XHR9XG5cdH1cblx0ZnVuY3Rpb24gc2V0QXR0cih2bm9kZSwga2V5Miwgb2xkLCB2YWx1ZSwgbnMpIHtcblx0XHR2YXIgZWxlbWVudCA9IHZub2RlLmRvbVxuXHRcdGlmIChrZXkyID09PSBcImtleVwiIHx8IGtleTIgPT09IFwiaXNcIiB8fCAob2xkID09PSB2YWx1ZSAmJiAhaXNGb3JtQXR0cmlidXRlKHZub2RlLCBrZXkyKSkgJiYgdHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiIHx8IHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIiB8fCBpc0xpZmVjeWNsZU1ldGhvZChrZXkyKSkgcmV0dXJuXG5cdFx0dmFyIG5zTGFzdEluZGV4ID0ga2V5Mi5pbmRleE9mKFwiOlwiKVxuXHRcdGlmIChuc0xhc3RJbmRleCA+IC0xICYmIGtleTIuc3Vic3RyKDAsIG5zTGFzdEluZGV4KSA9PT0gXCJ4bGlua1wiKSB7XG5cdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZU5TKFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLCBrZXkyLnNsaWNlKG5zTGFzdEluZGV4ICsgMSksIHZhbHVlKVxuXHRcdH1cblx0XHRlbHNlIGlmIChrZXkyWzBdID09PSBcIm9cIiAmJiBrZXkyWzFdID09PSBcIm5cIiAmJiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikgdXBkYXRlRXZlbnQodm5vZGUsIGtleTIsIHZhbHVlKVxuXHRcdGVsc2UgaWYgKGtleTIgPT09IFwic3R5bGVcIikgdXBkYXRlU3R5bGUoZWxlbWVudCwgb2xkLCB2YWx1ZSlcblx0XHRlbHNlIGlmIChrZXkyIGluIGVsZW1lbnQgJiYgIWlzQXR0cmlidXRlKGtleTIpICYmIG5zID09PSB1bmRlZmluZWQgJiYgIWlzQ3VzdG9tRWxlbWVudCh2bm9kZSkpIHtcblx0XHRcdGlmIChrZXkyID09PSBcInZhbHVlXCIpIHtcblx0XHRcdFx0dmFyIG5vcm1hbGl6ZWQwID0gXCJcIiArIHZhbHVlIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8taW1wbGljaXQtY29lcmNpb25cblx0XHRcdFx0Ly9zZXR0aW5nIGlucHV0W3ZhbHVlXSB0byBzYW1lIHZhbHVlIGJ5IHR5cGluZyBvbiBmb2N1c2VkIGVsZW1lbnQgbW92ZXMgY3Vyc29yIHRvIGVuZCBpbiBDaHJvbWVcblx0XHRcdFx0aWYgKCh2bm9kZS50YWcgPT09IFwiaW5wdXRcIiB8fCB2bm9kZS50YWcgPT09IFwidGV4dGFyZWFcIikgJiYgdm5vZGUuZG9tLnZhbHVlID09PSBub3JtYWxpemVkMCAmJiB2bm9kZS5kb20gPT09IGFjdGl2ZUVsZW1lbnQoKSkgcmV0dXJuXG5cdFx0XHRcdC8vc2V0dGluZyBzZWxlY3RbdmFsdWVdIHRvIHNhbWUgdmFsdWUgd2hpbGUgaGF2aW5nIHNlbGVjdCBvcGVuIGJsaW5rcyBzZWxlY3QgZHJvcGRvd24gaW4gQ2hyb21lXG5cdFx0XHRcdGlmICh2bm9kZS50YWcgPT09IFwic2VsZWN0XCIpIHtcblx0XHRcdFx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcblx0XHRcdFx0XHRcdGlmICh2bm9kZS5kb20uc2VsZWN0ZWRJbmRleCA9PT0gLTEgJiYgdm5vZGUuZG9tID09PSBhY3RpdmVFbGVtZW50KCkpIHJldHVyblxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRpZiAob2xkICE9PSBudWxsICYmIHZub2RlLmRvbS52YWx1ZSA9PT0gbm9ybWFsaXplZDAgJiYgdm5vZGUuZG9tID09PSBhY3RpdmVFbGVtZW50KCkpIHJldHVyblxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHQvL3NldHRpbmcgb3B0aW9uW3ZhbHVlXSB0byBzYW1lIHZhbHVlIHdoaWxlIGhhdmluZyBzZWxlY3Qgb3BlbiBibGlua3Mgc2VsZWN0IGRyb3Bkb3duIGluIENocm9tZVxuXHRcdFx0XHRpZiAodm5vZGUudGFnID09PSBcIm9wdGlvblwiICYmIG9sZCAhPSBudWxsICYmIHZub2RlLmRvbS52YWx1ZSA9PT0gbm9ybWFsaXplZDApIHJldHVyblxuXHRcdFx0fVxuXHRcdFx0Ly8gSWYgeW91IGFzc2lnbiBhbiBpbnB1dCB0eXBlMSB0aGF0IGlzIG5vdCBzdXBwb3J0ZWQgYnkgSUUgMTEgd2l0aCBhbiBhc3NpZ25tZW50IGV4cHJlc3Npb24sIGFuIGVycm9yMCB3aWxsIG9jY3VyLlxuXHRcdFx0aWYgKHZub2RlLnRhZyA9PT0gXCJpbnB1dFwiICYmIGtleTIgPT09IFwidHlwZVwiKSB7XG5cdFx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKGtleTIsIHZhbHVlKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH1cblx0XHRcdGVsZW1lbnRba2V5Ml0gPSB2YWx1ZVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT09IFwiYm9vbGVhblwiKSB7XG5cdFx0XHRcdGlmICh2YWx1ZSkgZWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5MiwgXCJcIilcblx0XHRcdFx0ZWxzZSBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShrZXkyKVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSBlbGVtZW50LnNldEF0dHJpYnV0ZShrZXkyID09PSBcImNsYXNzTmFtZVwiID8gXCJjbGFzc1wiIDoga2V5MiwgdmFsdWUpXG5cdFx0fVxuXHR9XG5cdGZ1bmN0aW9uIHNldExhdGVBdHRycyh2bm9kZSkge1xuXHRcdHZhciBhdHRyczIgPSB2bm9kZS5hdHRyc1xuXHRcdGlmICh2bm9kZS50YWcgPT09IFwic2VsZWN0XCIgJiYgYXR0cnMyICE9IG51bGwpIHtcblx0XHRcdGlmIChcInZhbHVlXCIgaW4gYXR0cnMyKSBzZXRBdHRyKHZub2RlLCBcInZhbHVlXCIsIG51bGwsIGF0dHJzMi52YWx1ZSwgdW5kZWZpbmVkKVxuXHRcdFx0aWYgKFwic2VsZWN0ZWRJbmRleFwiIGluIGF0dHJzMikgc2V0QXR0cih2bm9kZSwgXCJzZWxlY3RlZEluZGV4XCIsIG51bGwsIGF0dHJzMi5zZWxlY3RlZEluZGV4LCB1bmRlZmluZWQpXG5cdFx0fVxuXHR9XG5cdGZ1bmN0aW9uIHVwZGF0ZUF0dHJzKHZub2RlLCBvbGQsIGF0dHJzMiwgbnMpIHtcblx0XHRpZiAoYXR0cnMyICE9IG51bGwpIHtcblx0XHRcdGZvciAodmFyIGtleTIgaW4gYXR0cnMyKSB7XG5cdFx0XHRcdHNldEF0dHIodm5vZGUsIGtleTIsIG9sZCAmJiBvbGRba2V5Ml0sIGF0dHJzMltrZXkyXSwgbnMpXG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmIChvbGQgIT0gbnVsbCkge1xuXHRcdFx0Zm9yICh2YXIga2V5MiBpbiBvbGQpIHtcblx0XHRcdFx0aWYgKGF0dHJzMiA9PSBudWxsIHx8ICEoa2V5MiBpbiBhdHRyczIpKSB7XG5cdFx0XHRcdFx0aWYgKGtleTIgPT09IFwiY2xhc3NOYW1lXCIpIGtleTIgPSBcImNsYXNzXCJcblx0XHRcdFx0XHRpZiAoa2V5MlswXSA9PT0gXCJvXCIgJiYga2V5MlsxXSA9PT0gXCJuXCIgJiYgIWlzTGlmZWN5Y2xlTWV0aG9kKGtleTIpKSB1cGRhdGVFdmVudCh2bm9kZSwga2V5MiwgdW5kZWZpbmVkKVxuXHRcdFx0XHRcdGVsc2UgaWYgKGtleTIgIT09IFwia2V5XCIpIHZub2RlLmRvbS5yZW1vdmVBdHRyaWJ1dGUoa2V5Milcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRmdW5jdGlvbiBpc0Zvcm1BdHRyaWJ1dGUodm5vZGUsIGF0dHIpIHtcblx0XHRyZXR1cm4gYXR0ciA9PT0gXCJ2YWx1ZVwiIHx8IGF0dHIgPT09IFwiY2hlY2tlZFwiIHx8IGF0dHIgPT09IFwic2VsZWN0ZWRJbmRleFwiIHx8IGF0dHIgPT09IFwic2VsZWN0ZWRcIiAmJiB2bm9kZS5kb20gPT09IGFjdGl2ZUVsZW1lbnQoKVxuXHR9XG5cdGZ1bmN0aW9uIGlzTGlmZWN5Y2xlTWV0aG9kKGF0dHIpIHtcblx0XHRyZXR1cm4gYXR0ciA9PT0gXCJvbmluaXRcIiB8fCBhdHRyID09PSBcIm9uY3JlYXRlXCIgfHwgYXR0ciA9PT0gXCJvbnVwZGF0ZVwiIHx8IGF0dHIgPT09IFwib25yZW1vdmVcIiB8fCBhdHRyID09PSBcIm9uYmVmb3JlcmVtb3ZlXCIgfHwgYXR0ciA9PT0gXCJvbmJlZm9yZXVwZGF0ZVwiXG5cdH1cblx0ZnVuY3Rpb24gaXNBdHRyaWJ1dGUoYXR0cikge1xuXHRcdHJldHVybiBhdHRyID09PSBcImhyZWZcIiB8fCBhdHRyID09PSBcImxpc3RcIiB8fCBhdHRyID09PSBcImZvcm1cIiB8fCBhdHRyID09PSBcIndpZHRoXCIgfHwgYXR0ciA9PT0gXCJoZWlnaHRcIi8vIHx8IGF0dHIgPT09IFwidHlwZVwiXG5cdH1cblx0ZnVuY3Rpb24gaXNDdXN0b21FbGVtZW50KHZub2RlKXtcblx0XHRyZXR1cm4gdm5vZGUuYXR0cnMuaXMgfHwgdm5vZGUudGFnLmluZGV4T2YoXCItXCIpID4gLTFcblx0fVxuXHRmdW5jdGlvbiBoYXNJbnRlZ3JhdGlvbk1ldGhvZHMoc291cmNlKSB7XG5cdFx0cmV0dXJuIHNvdXJjZSAhPSBudWxsICYmIChzb3VyY2Uub25jcmVhdGUgfHwgc291cmNlLm9udXBkYXRlIHx8IHNvdXJjZS5vbmJlZm9yZXJlbW92ZSB8fCBzb3VyY2Uub25yZW1vdmUpXG5cdH1cblx0Ly9zdHlsZVxuXHRmdW5jdGlvbiB1cGRhdGVTdHlsZShlbGVtZW50LCBvbGQsIHN0eWxlKSB7XG5cdFx0aWYgKG9sZCA9PT0gc3R5bGUpIGVsZW1lbnQuc3R5bGUuY3NzVGV4dCA9IFwiXCIsIG9sZCA9IG51bGxcblx0XHRpZiAoc3R5bGUgPT0gbnVsbCkgZWxlbWVudC5zdHlsZS5jc3NUZXh0ID0gXCJcIlxuXHRcdGVsc2UgaWYgKHR5cGVvZiBzdHlsZSA9PT0gXCJzdHJpbmdcIikgZWxlbWVudC5zdHlsZS5jc3NUZXh0ID0gc3R5bGVcblx0XHRlbHNlIHtcblx0XHRcdGlmICh0eXBlb2Ygb2xkID09PSBcInN0cmluZ1wiKSBlbGVtZW50LnN0eWxlLmNzc1RleHQgPSBcIlwiXG5cdFx0XHRmb3IgKHZhciBrZXkyIGluIHN0eWxlKSB7XG5cdFx0XHRcdGVsZW1lbnQuc3R5bGVba2V5Ml0gPSBzdHlsZVtrZXkyXVxuXHRcdFx0fVxuXHRcdFx0aWYgKG9sZCAhPSBudWxsICYmIHR5cGVvZiBvbGQgIT09IFwic3RyaW5nXCIpIHtcblx0XHRcdFx0Zm9yICh2YXIga2V5MiBpbiBvbGQpIHtcblx0XHRcdFx0XHRpZiAoIShrZXkyIGluIHN0eWxlKSkgZWxlbWVudC5zdHlsZVtrZXkyXSA9IFwiXCJcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHQvL2V2ZW50XG5cdGZ1bmN0aW9uIHVwZGF0ZUV2ZW50KHZub2RlLCBrZXkyLCB2YWx1ZSkge1xuXHRcdHZhciBlbGVtZW50ID0gdm5vZGUuZG9tXG5cdFx0dmFyIGNhbGxiYWNrID0gdHlwZW9mIG9uZXZlbnQgIT09IFwiZnVuY3Rpb25cIiA/IHZhbHVlIDogZnVuY3Rpb24oZSkge1xuXHRcdFx0dmFyIHJlc3VsdCA9IHZhbHVlLmNhbGwoZWxlbWVudCwgZSlcblx0XHRcdG9uZXZlbnQuY2FsbChlbGVtZW50LCBlKVxuXHRcdFx0cmV0dXJuIHJlc3VsdFxuXHRcdH1cblx0XHRpZiAoa2V5MiBpbiBlbGVtZW50KSBlbGVtZW50W2tleTJdID0gdHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIgPyBjYWxsYmFjayA6IG51bGxcblx0XHRlbHNlIHtcblx0XHRcdHZhciBldmVudE5hbWUgPSBrZXkyLnNsaWNlKDIpXG5cdFx0XHRpZiAodm5vZGUuZXZlbnRzID09PSB1bmRlZmluZWQpIHZub2RlLmV2ZW50cyA9IHt9XG5cdFx0XHRpZiAodm5vZGUuZXZlbnRzW2tleTJdID09PSBjYWxsYmFjaykgcmV0dXJuXG5cdFx0XHRpZiAodm5vZGUuZXZlbnRzW2tleTJdICE9IG51bGwpIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIHZub2RlLmV2ZW50c1trZXkyXSwgZmFsc2UpXG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0dm5vZGUuZXZlbnRzW2tleTJdID0gY2FsbGJhY2tcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgdm5vZGUuZXZlbnRzW2tleTJdLCBmYWxzZSlcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0Ly9saWZlY3ljbGVcblx0ZnVuY3Rpb24gaW5pdExpZmVjeWNsZShzb3VyY2UsIHZub2RlLCBob29rcykge1xuXHRcdGlmICh0eXBlb2Ygc291cmNlLm9uaW5pdCA9PT0gXCJmdW5jdGlvblwiKSBzb3VyY2Uub25pbml0LmNhbGwodm5vZGUuc3RhdGUsIHZub2RlKVxuXHRcdGlmICh0eXBlb2Ygc291cmNlLm9uY3JlYXRlID09PSBcImZ1bmN0aW9uXCIpIGhvb2tzLnB1c2goc291cmNlLm9uY3JlYXRlLmJpbmQodm5vZGUuc3RhdGUsIHZub2RlKSlcblx0fVxuXHRmdW5jdGlvbiB1cGRhdGVMaWZlY3ljbGUoc291cmNlLCB2bm9kZSwgaG9va3MpIHtcblx0XHRpZiAodHlwZW9mIHNvdXJjZS5vbnVwZGF0ZSA9PT0gXCJmdW5jdGlvblwiKSBob29rcy5wdXNoKHNvdXJjZS5vbnVwZGF0ZS5iaW5kKHZub2RlLnN0YXRlLCB2bm9kZSkpXG5cdH1cblx0ZnVuY3Rpb24gc2hvdWxkTm90VXBkYXRlKHZub2RlLCBvbGQpIHtcblx0XHR2YXIgZm9yY2VWbm9kZVVwZGF0ZSwgZm9yY2VDb21wb25lbnRVcGRhdGVcblx0XHRpZiAodm5vZGUuYXR0cnMgIT0gbnVsbCAmJiB0eXBlb2Ygdm5vZGUuYXR0cnMub25iZWZvcmV1cGRhdGUgPT09IFwiZnVuY3Rpb25cIikgZm9yY2VWbm9kZVVwZGF0ZSA9IHZub2RlLmF0dHJzLm9uYmVmb3JldXBkYXRlLmNhbGwodm5vZGUuc3RhdGUsIHZub2RlLCBvbGQpXG5cdFx0aWYgKHR5cGVvZiB2bm9kZS50YWcgIT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIHZub2RlLl9zdGF0ZS5vbmJlZm9yZXVwZGF0ZSA9PT0gXCJmdW5jdGlvblwiKSBmb3JjZUNvbXBvbmVudFVwZGF0ZSA9IHZub2RlLl9zdGF0ZS5vbmJlZm9yZXVwZGF0ZS5jYWxsKHZub2RlLnN0YXRlLCB2bm9kZSwgb2xkKVxuXHRcdGlmICghKGZvcmNlVm5vZGVVcGRhdGUgPT09IHVuZGVmaW5lZCAmJiBmb3JjZUNvbXBvbmVudFVwZGF0ZSA9PT0gdW5kZWZpbmVkKSAmJiAhZm9yY2VWbm9kZVVwZGF0ZSAmJiAhZm9yY2VDb21wb25lbnRVcGRhdGUpIHtcblx0XHRcdHZub2RlLmRvbSA9IG9sZC5kb21cblx0XHRcdHZub2RlLmRvbVNpemUgPSBvbGQuZG9tU2l6ZVxuXHRcdFx0dm5vZGUuaW5zdGFuY2UgPSBvbGQuaW5zdGFuY2Vcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZVxuXHR9XG5cdGZ1bmN0aW9uIHJlbmRlcihkb20sIHZub2Rlcykge1xuXHRcdGlmICghZG9tKSB0aHJvdyBuZXcgRXJyb3IoXCJFbnN1cmUgdGhlIERPTSBlbGVtZW50IGJlaW5nIHBhc3NlZCB0byBtLnJvdXRlL20ubW91bnQvbS5yZW5kZXIgaXMgbm90IHVuZGVmaW5lZC5cIilcblx0XHR2YXIgaG9va3MgPSBbXVxuXHRcdHZhciBhY3RpdmUgPSBhY3RpdmVFbGVtZW50KClcblx0XHR2YXIgbmFtZXNwYWNlID0gZG9tLm5hbWVzcGFjZVVSSVxuXHRcdC8vIEZpcnN0IHRpbWUwIHJlbmRlcmluZyBpbnRvIGEgbm9kZSBjbGVhcnMgaXQgb3V0XG5cdFx0aWYgKGRvbS52bm9kZXMgPT0gbnVsbCkgZG9tLnRleHRDb250ZW50ID0gXCJcIlxuXHRcdGlmICghQXJyYXkuaXNBcnJheSh2bm9kZXMpKSB2bm9kZXMgPSBbdm5vZGVzXVxuXHRcdHVwZGF0ZU5vZGVzKGRvbSwgZG9tLnZub2RlcywgVm5vZGUubm9ybWFsaXplQ2hpbGRyZW4odm5vZGVzKSwgZmFsc2UsIGhvb2tzLCBudWxsLCBuYW1lc3BhY2UgPT09IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiID8gdW5kZWZpbmVkIDogbmFtZXNwYWNlKVxuXHRcdGRvbS52bm9kZXMgPSB2bm9kZXNcblx0XHQvLyBkb2N1bWVudC5hY3RpdmVFbGVtZW50IGNhbiByZXR1cm4gbnVsbCBpbiBJRSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRG9jdW1lbnQvYWN0aXZlRWxlbWVudFxuXHRcdGlmIChhY3RpdmUgIT0gbnVsbCAmJiBhY3RpdmVFbGVtZW50KCkgIT09IGFjdGl2ZSkgYWN0aXZlLmZvY3VzKClcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGhvb2tzLmxlbmd0aDsgaSsrKSBob29rc1tpXSgpXG5cdH1cblx0cmV0dXJuIHtyZW5kZXI6IHJlbmRlciwgc2V0RXZlbnRDYWxsYmFjazogc2V0RXZlbnRDYWxsYmFja31cbn1cbmZ1bmN0aW9uIHRocm90dGxlKGNhbGxiYWNrKSB7XG5cdC8vNjBmcHMgdHJhbnNsYXRlcyB0byAxNi42bXMsIHJvdW5kIGl0IGRvd24gc2luY2Ugc2V0VGltZW91dCByZXF1aXJlcyBpbnRcblx0dmFyIHRpbWUgPSAxNlxuXHR2YXIgbGFzdCA9IDAsIHBlbmRpbmcgPSBudWxsXG5cdHZhciB0aW1lb3V0ID0gdHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gXCJmdW5jdGlvblwiID8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIDogc2V0VGltZW91dFxuXHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG5vdyA9IERhdGUubm93KClcblx0XHRpZiAobGFzdCA9PT0gMCB8fCBub3cgLSBsYXN0ID49IHRpbWUpIHtcblx0XHRcdGxhc3QgPSBub3dcblx0XHRcdGNhbGxiYWNrKClcblx0XHR9XG5cdFx0ZWxzZSBpZiAocGVuZGluZyA9PT0gbnVsbCkge1xuXHRcdFx0cGVuZGluZyA9IHRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHBlbmRpbmcgPSBudWxsXG5cdFx0XHRcdGNhbGxiYWNrKClcblx0XHRcdFx0bGFzdCA9IERhdGUubm93KClcblx0XHRcdH0sIHRpbWUgLSAobm93IC0gbGFzdCkpXG5cdFx0fVxuXHR9XG59XG52YXIgXzExID0gZnVuY3Rpb24oJHdpbmRvdykge1xuXHR2YXIgcmVuZGVyU2VydmljZSA9IGNvcmVSZW5kZXJlcigkd2luZG93KVxuXHRyZW5kZXJTZXJ2aWNlLnNldEV2ZW50Q2FsbGJhY2soZnVuY3Rpb24oZSkge1xuXHRcdGlmIChlLnJlZHJhdyA9PT0gZmFsc2UpIGUucmVkcmF3ID0gdW5kZWZpbmVkXG5cdFx0ZWxzZSByZWRyYXcoKVxuXHR9KVxuXHR2YXIgY2FsbGJhY2tzID0gW11cblx0ZnVuY3Rpb24gc3Vic2NyaWJlKGtleTEsIGNhbGxiYWNrKSB7XG5cdFx0dW5zdWJzY3JpYmUoa2V5MSlcblx0XHRjYWxsYmFja3MucHVzaChrZXkxLCB0aHJvdHRsZShjYWxsYmFjaykpXG5cdH1cblx0ZnVuY3Rpb24gdW5zdWJzY3JpYmUoa2V5MSkge1xuXHRcdHZhciBpbmRleCA9IGNhbGxiYWNrcy5pbmRleE9mKGtleTEpXG5cdFx0aWYgKGluZGV4ID4gLTEpIGNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDIpXG5cdH1cblx0ZnVuY3Rpb24gcmVkcmF3KCkge1xuXHRcdGZvciAodmFyIGkgPSAxOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSArPSAyKSB7XG5cdFx0XHRjYWxsYmFja3NbaV0oKVxuXHRcdH1cblx0fVxuXHRyZXR1cm4ge3N1YnNjcmliZTogc3Vic2NyaWJlLCB1bnN1YnNjcmliZTogdW5zdWJzY3JpYmUsIHJlZHJhdzogcmVkcmF3LCByZW5kZXI6IHJlbmRlclNlcnZpY2UucmVuZGVyfVxufVxudmFyIHJlZHJhd1NlcnZpY2UgPSBfMTEod2luZG93KVxucmVxdWVzdFNlcnZpY2Uuc2V0Q29tcGxldGlvbkNhbGxiYWNrKHJlZHJhd1NlcnZpY2UucmVkcmF3KVxudmFyIF8xNiA9IGZ1bmN0aW9uKHJlZHJhd1NlcnZpY2UwKSB7XG5cdHJldHVybiBmdW5jdGlvbihyb290LCBjb21wb25lbnQpIHtcblx0XHRpZiAoY29tcG9uZW50ID09PSBudWxsKSB7XG5cdFx0XHRyZWRyYXdTZXJ2aWNlMC5yZW5kZXIocm9vdCwgW10pXG5cdFx0XHRyZWRyYXdTZXJ2aWNlMC51bnN1YnNjcmliZShyb290KVxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdFxuXHRcdGlmIChjb21wb25lbnQudmlldyA9PSBudWxsICYmIHR5cGVvZiBjb21wb25lbnQgIT09IFwiZnVuY3Rpb25cIikgdGhyb3cgbmV3IEVycm9yKFwibS5tb3VudChlbGVtZW50LCBjb21wb25lbnQpIGV4cGVjdHMgYSBjb21wb25lbnQsIG5vdCBhIHZub2RlXCIpXG5cdFx0XG5cdFx0dmFyIHJ1bjAgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJlZHJhd1NlcnZpY2UwLnJlbmRlcihyb290LCBWbm9kZShjb21wb25lbnQpKVxuXHRcdH1cblx0XHRyZWRyYXdTZXJ2aWNlMC5zdWJzY3JpYmUocm9vdCwgcnVuMClcblx0XHRyZWRyYXdTZXJ2aWNlMC5yZWRyYXcoKVxuXHR9XG59XG5tLm1vdW50ID0gXzE2KHJlZHJhd1NlcnZpY2UpXG52YXIgUHJvbWlzZSA9IFByb21pc2VQb2x5ZmlsbFxudmFyIHBhcnNlUXVlcnlTdHJpbmcgPSBmdW5jdGlvbihzdHJpbmcpIHtcblx0aWYgKHN0cmluZyA9PT0gXCJcIiB8fCBzdHJpbmcgPT0gbnVsbCkgcmV0dXJuIHt9XG5cdGlmIChzdHJpbmcuY2hhckF0KDApID09PSBcIj9cIikgc3RyaW5nID0gc3RyaW5nLnNsaWNlKDEpXG5cdHZhciBlbnRyaWVzID0gc3RyaW5nLnNwbGl0KFwiJlwiKSwgY291bnRlcnMgPSB7fSwgZGF0YTAgPSB7fVxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGVudHJpZXMubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgZW50cnkgPSBlbnRyaWVzW2ldLnNwbGl0KFwiPVwiKVxuXHRcdHZhciBrZXk1ID0gZGVjb2RlVVJJQ29tcG9uZW50KGVudHJ5WzBdKVxuXHRcdHZhciB2YWx1ZSA9IGVudHJ5Lmxlbmd0aCA9PT0gMiA/IGRlY29kZVVSSUNvbXBvbmVudChlbnRyeVsxXSkgOiBcIlwiXG5cdFx0aWYgKHZhbHVlID09PSBcInRydWVcIikgdmFsdWUgPSB0cnVlXG5cdFx0ZWxzZSBpZiAodmFsdWUgPT09IFwiZmFsc2VcIikgdmFsdWUgPSBmYWxzZVxuXHRcdHZhciBsZXZlbHMgPSBrZXk1LnNwbGl0KC9cXF1cXFs/fFxcWy8pXG5cdFx0dmFyIGN1cnNvciA9IGRhdGEwXG5cdFx0aWYgKGtleTUuaW5kZXhPZihcIltcIikgPiAtMSkgbGV2ZWxzLnBvcCgpXG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBsZXZlbHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdHZhciBsZXZlbCA9IGxldmVsc1tqXSwgbmV4dExldmVsID0gbGV2ZWxzW2ogKyAxXVxuXHRcdFx0dmFyIGlzTnVtYmVyID0gbmV4dExldmVsID09IFwiXCIgfHwgIWlzTmFOKHBhcnNlSW50KG5leHRMZXZlbCwgMTApKVxuXHRcdFx0aWYgKGxldmVsID09PSBcIlwiKSB7XG5cdFx0XHRcdHZhciBrZXk1ID0gbGV2ZWxzLnNsaWNlKDAsIGopLmpvaW4oKVxuXHRcdFx0XHRpZiAoY291bnRlcnNba2V5NV0gPT0gbnVsbCkge1xuXHRcdFx0XHRcdGNvdW50ZXJzW2tleTVdID0gQXJyYXkuaXNBcnJheShjdXJzb3IpID8gY3Vyc29yLmxlbmd0aCA6IDBcblx0XHRcdFx0fVxuXHRcdFx0XHRsZXZlbCA9IGNvdW50ZXJzW2tleTVdKytcblx0XHRcdH1cblx0XHRcdC8vIERpc2FsbG93IGRpcmVjdCBwcm90b3R5cGUgcG9sbHV0aW9uXG5cdFx0XHRlbHNlIGlmIChsZXZlbCA9PT0gXCJfX3Byb3RvX19cIikgYnJlYWtcblx0XHRcdGlmIChqID09PSBsZXZlbHMubGVuZ3RoIC0gMSkgY3Vyc29yW2xldmVsXSA9IHZhbHVlXG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0Ly8gUmVhZCBvd24gcHJvcGVydGllcyBleGNsdXNpdmVseSB0byBkaXNhbGxvdyBpbmRpcmVjdFxuXHRcdFx0XHQvLyBwcm90b3R5cGUgcG9sbHV0aW9uXG5cdFx0XHRcdHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihjdXJzb3IsIGxldmVsKVxuXHRcdFx0XHRpZiAoZGVzYyAhPSBudWxsKSBkZXNjID0gZGVzYy52YWx1ZVxuXHRcdFx0XHRpZiAoZGVzYyA9PSBudWxsKSBjdXJzb3JbbGV2ZWxdID0gZGVzYyA9IGlzTnVtYmVyID8gW10gOiB7fVxuXHRcdFx0XHRjdXJzb3IgPSBkZXNjXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJldHVybiBkYXRhMFxufVxudmFyIGNvcmVSb3V0ZXIgPSBmdW5jdGlvbigkd2luZG93KSB7XG5cdHZhciBzdXBwb3J0c1B1c2hTdGF0ZSA9IHR5cGVvZiAkd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlID09PSBcImZ1bmN0aW9uXCJcblx0dmFyIGNhbGxBc3luYzAgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBzZXRJbW1lZGlhdGUgOiBzZXRUaW1lb3V0XG5cdGZ1bmN0aW9uIG5vcm1hbGl6ZTEoZnJhZ21lbnQwKSB7XG5cdFx0dmFyIGRhdGEgPSAkd2luZG93LmxvY2F0aW9uW2ZyYWdtZW50MF0ucmVwbGFjZSgvKD86JVthLWY4OV1bYS1mMC05XSkrL2dpbSwgZGVjb2RlVVJJQ29tcG9uZW50KVxuXHRcdGlmIChmcmFnbWVudDAgPT09IFwicGF0aG5hbWVcIiAmJiBkYXRhWzBdICE9PSBcIi9cIikgZGF0YSA9IFwiL1wiICsgZGF0YVxuXHRcdHJldHVybiBkYXRhXG5cdH1cblx0dmFyIGFzeW5jSWRcblx0ZnVuY3Rpb24gZGVib3VuY2VBc3luYyhjYWxsYmFjazApIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoYXN5bmNJZCAhPSBudWxsKSByZXR1cm5cblx0XHRcdGFzeW5jSWQgPSBjYWxsQXN5bmMwKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRhc3luY0lkID0gbnVsbFxuXHRcdFx0XHRjYWxsYmFjazAoKVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cblx0ZnVuY3Rpb24gcGFyc2VQYXRoKHBhdGgsIHF1ZXJ5RGF0YSwgaGFzaERhdGEpIHtcblx0XHR2YXIgcXVlcnlJbmRleCA9IHBhdGguaW5kZXhPZihcIj9cIilcblx0XHR2YXIgaGFzaEluZGV4ID0gcGF0aC5pbmRleE9mKFwiI1wiKVxuXHRcdHZhciBwYXRoRW5kID0gcXVlcnlJbmRleCA+IC0xID8gcXVlcnlJbmRleCA6IGhhc2hJbmRleCA+IC0xID8gaGFzaEluZGV4IDogcGF0aC5sZW5ndGhcblx0XHRpZiAocXVlcnlJbmRleCA+IC0xKSB7XG5cdFx0XHR2YXIgcXVlcnlFbmQgPSBoYXNoSW5kZXggPiAtMSA/IGhhc2hJbmRleCA6IHBhdGgubGVuZ3RoXG5cdFx0XHR2YXIgcXVlcnlQYXJhbXMgPSBwYXJzZVF1ZXJ5U3RyaW5nKHBhdGguc2xpY2UocXVlcnlJbmRleCArIDEsIHF1ZXJ5RW5kKSlcblx0XHRcdGZvciAodmFyIGtleTQgaW4gcXVlcnlQYXJhbXMpIHF1ZXJ5RGF0YVtrZXk0XSA9IHF1ZXJ5UGFyYW1zW2tleTRdXG5cdFx0fVxuXHRcdGlmIChoYXNoSW5kZXggPiAtMSkge1xuXHRcdFx0dmFyIGhhc2hQYXJhbXMgPSBwYXJzZVF1ZXJ5U3RyaW5nKHBhdGguc2xpY2UoaGFzaEluZGV4ICsgMSkpXG5cdFx0XHRmb3IgKHZhciBrZXk0IGluIGhhc2hQYXJhbXMpIGhhc2hEYXRhW2tleTRdID0gaGFzaFBhcmFtc1trZXk0XVxuXHRcdH1cblx0XHRyZXR1cm4gcGF0aC5zbGljZSgwLCBwYXRoRW5kKVxuXHR9XG5cdHZhciByb3V0ZXIgPSB7cHJlZml4OiBcIiMhXCJ9XG5cdHJvdXRlci5nZXRQYXRoID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHR5cGUyID0gcm91dGVyLnByZWZpeC5jaGFyQXQoMClcblx0XHRzd2l0Y2ggKHR5cGUyKSB7XG5cdFx0XHRjYXNlIFwiI1wiOiByZXR1cm4gbm9ybWFsaXplMShcImhhc2hcIikuc2xpY2Uocm91dGVyLnByZWZpeC5sZW5ndGgpXG5cdFx0XHRjYXNlIFwiP1wiOiByZXR1cm4gbm9ybWFsaXplMShcInNlYXJjaFwiKS5zbGljZShyb3V0ZXIucHJlZml4Lmxlbmd0aCkgKyBub3JtYWxpemUxKFwiaGFzaFwiKVxuXHRcdFx0ZGVmYXVsdDogcmV0dXJuIG5vcm1hbGl6ZTEoXCJwYXRobmFtZVwiKS5zbGljZShyb3V0ZXIucHJlZml4Lmxlbmd0aCkgKyBub3JtYWxpemUxKFwic2VhcmNoXCIpICsgbm9ybWFsaXplMShcImhhc2hcIilcblx0XHR9XG5cdH1cblx0cm91dGVyLnNldFBhdGggPSBmdW5jdGlvbihwYXRoLCBkYXRhLCBvcHRpb25zKSB7XG5cdFx0dmFyIHF1ZXJ5RGF0YSA9IHt9LCBoYXNoRGF0YSA9IHt9XG5cdFx0cGF0aCA9IHBhcnNlUGF0aChwYXRoLCBxdWVyeURhdGEsIGhhc2hEYXRhKVxuXHRcdGlmIChkYXRhICE9IG51bGwpIHtcblx0XHRcdGZvciAodmFyIGtleTQgaW4gZGF0YSkgcXVlcnlEYXRhW2tleTRdID0gZGF0YVtrZXk0XVxuXHRcdFx0cGF0aCA9IHBhdGgucmVwbGFjZSgvOihbXlxcL10rKS9nLCBmdW5jdGlvbihtYXRjaDIsIHRva2VuKSB7XG5cdFx0XHRcdGRlbGV0ZSBxdWVyeURhdGFbdG9rZW5dXG5cdFx0XHRcdHJldHVybiBkYXRhW3Rva2VuXVxuXHRcdFx0fSlcblx0XHR9XG5cdFx0dmFyIHF1ZXJ5ID0gYnVpbGRRdWVyeVN0cmluZyhxdWVyeURhdGEpXG5cdFx0aWYgKHF1ZXJ5KSBwYXRoICs9IFwiP1wiICsgcXVlcnlcblx0XHR2YXIgaGFzaCA9IGJ1aWxkUXVlcnlTdHJpbmcoaGFzaERhdGEpXG5cdFx0aWYgKGhhc2gpIHBhdGggKz0gXCIjXCIgKyBoYXNoXG5cdFx0aWYgKHN1cHBvcnRzUHVzaFN0YXRlKSB7XG5cdFx0XHR2YXIgc3RhdGUgPSBvcHRpb25zID8gb3B0aW9ucy5zdGF0ZSA6IG51bGxcblx0XHRcdHZhciB0aXRsZSA9IG9wdGlvbnMgPyBvcHRpb25zLnRpdGxlIDogbnVsbFxuXHRcdFx0JHdpbmRvdy5vbnBvcHN0YXRlKClcblx0XHRcdGlmIChvcHRpb25zICYmIG9wdGlvbnMucmVwbGFjZSkgJHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZShzdGF0ZSwgdGl0bGUsIHJvdXRlci5wcmVmaXggKyBwYXRoKVxuXHRcdFx0ZWxzZSAkd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKHN0YXRlLCB0aXRsZSwgcm91dGVyLnByZWZpeCArIHBhdGgpXG5cdFx0fVxuXHRcdGVsc2UgJHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gcm91dGVyLnByZWZpeCArIHBhdGhcblx0fVxuXHRyb3V0ZXIuZGVmaW5lUm91dGVzID0gZnVuY3Rpb24ocm91dGVzLCByZXNvbHZlLCByZWplY3QpIHtcblx0XHRmdW5jdGlvbiByZXNvbHZlUm91dGUoKSB7XG5cdFx0XHR2YXIgcGF0aCA9IHJvdXRlci5nZXRQYXRoKClcblx0XHRcdHZhciBwYXJhbXMgPSB7fVxuXHRcdFx0dmFyIHBhdGhuYW1lID0gcGFyc2VQYXRoKHBhdGgsIHBhcmFtcywgcGFyYW1zKVxuXHRcdFx0dmFyIHN0YXRlID0gJHdpbmRvdy5oaXN0b3J5LnN0YXRlXG5cdFx0XHRpZiAoc3RhdGUgIT0gbnVsbCkge1xuXHRcdFx0XHRmb3IgKHZhciBrIGluIHN0YXRlKSBwYXJhbXNba10gPSBzdGF0ZVtrXVxuXHRcdFx0fVxuXHRcdFx0Zm9yICh2YXIgcm91dGUwIGluIHJvdXRlcykge1xuXHRcdFx0XHR2YXIgbWF0Y2hlciA9IG5ldyBSZWdFeHAoXCJeXCIgKyByb3V0ZTAucmVwbGFjZSgvOlteXFwvXSs/XFwuezN9L2csIFwiKC4qPylcIikucmVwbGFjZSgvOlteXFwvXSsvZywgXCIoW15cXFxcL10rKVwiKSArIFwiXFwvPyRcIilcblx0XHRcdFx0aWYgKG1hdGNoZXIudGVzdChwYXRobmFtZSkpIHtcblx0XHRcdFx0XHRwYXRobmFtZS5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0dmFyIGtleXMgPSByb3V0ZTAubWF0Y2goLzpbXlxcL10rL2cpIHx8IFtdXG5cdFx0XHRcdFx0XHR2YXIgdmFsdWVzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEsIC0yKVxuXHRcdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRcdHBhcmFtc1trZXlzW2ldLnJlcGxhY2UoLzp8XFwuL2csIFwiXCIpXSA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZXNbaV0pXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJvdXRlc1tyb3V0ZTBdLCBwYXJhbXMsIHBhdGgsIHJvdXRlMClcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZWplY3QocGF0aCwgcGFyYW1zKVxuXHRcdH1cblx0XHRpZiAoc3VwcG9ydHNQdXNoU3RhdGUpICR3aW5kb3cub25wb3BzdGF0ZSA9IGRlYm91bmNlQXN5bmMocmVzb2x2ZVJvdXRlKVxuXHRcdGVsc2UgaWYgKHJvdXRlci5wcmVmaXguY2hhckF0KDApID09PSBcIiNcIikgJHdpbmRvdy5vbmhhc2hjaGFuZ2UgPSByZXNvbHZlUm91dGVcblx0XHRyZXNvbHZlUm91dGUoKVxuXHR9XG5cdHJldHVybiByb3V0ZXJcbn1cbnZhciBfMjAgPSBmdW5jdGlvbigkd2luZG93LCByZWRyYXdTZXJ2aWNlMCkge1xuXHR2YXIgcm91dGVTZXJ2aWNlID0gY29yZVJvdXRlcigkd2luZG93KVxuXHR2YXIgaWRlbnRpdHkgPSBmdW5jdGlvbih2KSB7cmV0dXJuIHZ9XG5cdHZhciByZW5kZXIxLCBjb21wb25lbnQsIGF0dHJzMywgY3VycmVudFBhdGgsIGxhc3RVcGRhdGVcblx0dmFyIHJvdXRlID0gZnVuY3Rpb24ocm9vdCwgZGVmYXVsdFJvdXRlLCByb3V0ZXMpIHtcblx0XHRpZiAocm9vdCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJFbnN1cmUgdGhlIERPTSBlbGVtZW50IHRoYXQgd2FzIHBhc3NlZCB0byBgbS5yb3V0ZWAgaXMgbm90IHVuZGVmaW5lZFwiKVxuXHRcdHZhciBydW4xID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAocmVuZGVyMSAhPSBudWxsKSByZWRyYXdTZXJ2aWNlMC5yZW5kZXIocm9vdCwgcmVuZGVyMShWbm9kZShjb21wb25lbnQsIGF0dHJzMy5rZXksIGF0dHJzMykpKVxuXHRcdH1cblx0XHR2YXIgYmFpbCA9IGZ1bmN0aW9uKHBhdGgpIHtcblx0XHRcdGlmIChwYXRoICE9PSBkZWZhdWx0Um91dGUpIHJvdXRlU2VydmljZS5zZXRQYXRoKGRlZmF1bHRSb3V0ZSwgbnVsbCwge3JlcGxhY2U6IHRydWV9KVxuXHRcdFx0ZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgcmVzb2x2ZSBkZWZhdWx0IHJvdXRlIFwiICsgZGVmYXVsdFJvdXRlKVxuXHRcdH1cblx0XHRyb3V0ZVNlcnZpY2UuZGVmaW5lUm91dGVzKHJvdXRlcywgZnVuY3Rpb24ocGF5bG9hZCwgcGFyYW1zLCBwYXRoKSB7XG5cdFx0XHR2YXIgdXBkYXRlID0gbGFzdFVwZGF0ZSA9IGZ1bmN0aW9uKHJvdXRlUmVzb2x2ZXIsIGNvbXApIHtcblx0XHRcdFx0aWYgKHVwZGF0ZSAhPT0gbGFzdFVwZGF0ZSkgcmV0dXJuXG5cdFx0XHRcdGNvbXBvbmVudCA9IGNvbXAgIT0gbnVsbCAmJiAodHlwZW9mIGNvbXAudmlldyA9PT0gXCJmdW5jdGlvblwiIHx8IHR5cGVvZiBjb21wID09PSBcImZ1bmN0aW9uXCIpPyBjb21wIDogXCJkaXZcIlxuXHRcdFx0XHRhdHRyczMgPSBwYXJhbXMsIGN1cnJlbnRQYXRoID0gcGF0aCwgbGFzdFVwZGF0ZSA9IG51bGxcblx0XHRcdFx0cmVuZGVyMSA9IChyb3V0ZVJlc29sdmVyLnJlbmRlciB8fCBpZGVudGl0eSkuYmluZChyb3V0ZVJlc29sdmVyKVxuXHRcdFx0XHRydW4xKClcblx0XHRcdH1cblx0XHRcdGlmIChwYXlsb2FkLnZpZXcgfHwgdHlwZW9mIHBheWxvYWQgPT09IFwiZnVuY3Rpb25cIikgdXBkYXRlKHt9LCBwYXlsb2FkKVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdGlmIChwYXlsb2FkLm9ubWF0Y2gpIHtcblx0XHRcdFx0XHRQcm9taXNlLnJlc29sdmUocGF5bG9hZC5vbm1hdGNoKHBhcmFtcywgcGF0aCkpLnRoZW4oZnVuY3Rpb24ocmVzb2x2ZWQpIHtcblx0XHRcdFx0XHRcdHVwZGF0ZShwYXlsb2FkLCByZXNvbHZlZClcblx0XHRcdFx0XHR9LCBiYWlsKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgdXBkYXRlKHBheWxvYWQsIFwiZGl2XCIpXG5cdFx0XHR9XG5cdFx0fSwgYmFpbClcblx0XHRyZWRyYXdTZXJ2aWNlMC5zdWJzY3JpYmUocm9vdCwgcnVuMSlcblx0fVxuXHRyb3V0ZS5zZXQgPSBmdW5jdGlvbihwYXRoLCBkYXRhLCBvcHRpb25zKSB7XG5cdFx0aWYgKGxhc3RVcGRhdGUgIT0gbnVsbCkge1xuXHRcdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge31cblx0XHRcdG9wdGlvbnMucmVwbGFjZSA9IHRydWVcblx0XHR9XG5cdFx0bGFzdFVwZGF0ZSA9IG51bGxcblx0XHRyb3V0ZVNlcnZpY2Uuc2V0UGF0aChwYXRoLCBkYXRhLCBvcHRpb25zKVxuXHR9XG5cdHJvdXRlLmdldCA9IGZ1bmN0aW9uKCkge3JldHVybiBjdXJyZW50UGF0aH1cblx0cm91dGUucHJlZml4ID0gZnVuY3Rpb24ocHJlZml4MCkge3JvdXRlU2VydmljZS5wcmVmaXggPSBwcmVmaXgwfVxuXHRyb3V0ZS5saW5rID0gZnVuY3Rpb24odm5vZGUxKSB7XG5cdFx0dm5vZGUxLmRvbS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIHJvdXRlU2VydmljZS5wcmVmaXggKyB2bm9kZTEuYXR0cnMuaHJlZilcblx0XHR2bm9kZTEuZG9tLm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XG5cdFx0XHRpZiAoZS5jdHJsS2V5IHx8IGUubWV0YUtleSB8fCBlLnNoaWZ0S2V5IHx8IGUud2hpY2ggPT09IDIpIHJldHVyblxuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRlLnJlZHJhdyA9IGZhbHNlXG5cdFx0XHR2YXIgaHJlZiA9IHRoaXMuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKVxuXHRcdFx0aWYgKGhyZWYuaW5kZXhPZihyb3V0ZVNlcnZpY2UucHJlZml4KSA9PT0gMCkgaHJlZiA9IGhyZWYuc2xpY2Uocm91dGVTZXJ2aWNlLnByZWZpeC5sZW5ndGgpXG5cdFx0XHRyb3V0ZS5zZXQoaHJlZiwgdW5kZWZpbmVkLCB1bmRlZmluZWQpXG5cdFx0fVxuXHR9XG5cdHJvdXRlLnBhcmFtID0gZnVuY3Rpb24oa2V5Mykge1xuXHRcdGlmKHR5cGVvZiBhdHRyczMgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIGtleTMgIT09IFwidW5kZWZpbmVkXCIpIHJldHVybiBhdHRyczNba2V5M11cblx0XHRyZXR1cm4gYXR0cnMzXG5cdH1cblx0cmV0dXJuIHJvdXRlXG59XG5tLnJvdXRlID0gXzIwKHdpbmRvdywgcmVkcmF3U2VydmljZSlcbm0ud2l0aEF0dHIgPSBmdW5jdGlvbihhdHRyTmFtZSwgY2FsbGJhY2sxLCBjb250ZXh0KSB7XG5cdHJldHVybiBmdW5jdGlvbihlKSB7XG5cdFx0Y2FsbGJhY2sxLmNhbGwoY29udGV4dCB8fCB0aGlzLCBhdHRyTmFtZSBpbiBlLmN1cnJlbnRUYXJnZXQgPyBlLmN1cnJlbnRUYXJnZXRbYXR0ck5hbWVdIDogZS5jdXJyZW50VGFyZ2V0LmdldEF0dHJpYnV0ZShhdHRyTmFtZSkpXG5cdH1cbn1cbnZhciBfMjggPSBjb3JlUmVuZGVyZXIod2luZG93KVxubS5yZW5kZXIgPSBfMjgucmVuZGVyXG5tLnJlZHJhdyA9IHJlZHJhd1NlcnZpY2UucmVkcmF3XG5tLnJlcXVlc3QgPSByZXF1ZXN0U2VydmljZS5yZXF1ZXN0XG5tLmpzb25wID0gcmVxdWVzdFNlcnZpY2UuanNvbnBcbm0ucGFyc2VRdWVyeVN0cmluZyA9IHBhcnNlUXVlcnlTdHJpbmdcbm0uYnVpbGRRdWVyeVN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmdcbm0udmVyc2lvbiA9IFwiMS4xLjdcIlxubS52bm9kZSA9IFZub2RlXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIikgbW9kdWxlW1wiZXhwb3J0c1wiXSA9IG1cbmVsc2Ugd2luZG93Lm0gPSBtXG59KCkpOyIsIi8qIGVzbGludC1kaXNhYmxlICovXG47KGZ1bmN0aW9uKCkge1xuXCJ1c2Ugc3RyaWN0XCJcbi8qIGVzbGludC1lbmFibGUgKi9cblxudmFyIGd1aWQgPSAwLCBIQUxUID0ge31cbmZ1bmN0aW9uIGNyZWF0ZVN0cmVhbSgpIHtcblx0ZnVuY3Rpb24gc3RyZWFtKCkge1xuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IEhBTFQpIHVwZGF0ZVN0cmVhbShzdHJlYW0sIGFyZ3VtZW50c1swXSlcblx0XHRyZXR1cm4gc3RyZWFtLl9zdGF0ZS52YWx1ZVxuXHR9XG5cdGluaXRTdHJlYW0oc3RyZWFtKVxuXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IEhBTFQpIHVwZGF0ZVN0cmVhbShzdHJlYW0sIGFyZ3VtZW50c1swXSlcblxuXHRyZXR1cm4gc3RyZWFtXG59XG5mdW5jdGlvbiBpbml0U3RyZWFtKHN0cmVhbSkge1xuXHRzdHJlYW0uY29uc3RydWN0b3IgPSBjcmVhdGVTdHJlYW1cblx0c3RyZWFtLl9zdGF0ZSA9IHtpZDogZ3VpZCsrLCB2YWx1ZTogdW5kZWZpbmVkLCBzdGF0ZTogMCwgZGVyaXZlOiB1bmRlZmluZWQsIHJlY292ZXI6IHVuZGVmaW5lZCwgZGVwczoge30sIHBhcmVudHM6IFtdLCBlbmRTdHJlYW06IHVuZGVmaW5lZCwgdW5yZWdpc3RlcjogdW5kZWZpbmVkfVxuXHRzdHJlYW0ubWFwID0gc3RyZWFtW1wiZmFudGFzeS1sYW5kL21hcFwiXSA9IG1hcCwgc3RyZWFtW1wiZmFudGFzeS1sYW5kL2FwXCJdID0gYXAsIHN0cmVhbVtcImZhbnRhc3ktbGFuZC9vZlwiXSA9IGNyZWF0ZVN0cmVhbVxuXHRzdHJlYW0udmFsdWVPZiA9IHZhbHVlT2YsIHN0cmVhbS50b0pTT04gPSB0b0pTT04sIHN0cmVhbS50b1N0cmluZyA9IHZhbHVlT2ZcblxuXHRPYmplY3QuZGVmaW5lUHJvcGVydGllcyhzdHJlYW0sIHtcblx0XHRlbmQ6IHtnZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCFzdHJlYW0uX3N0YXRlLmVuZFN0cmVhbSkge1xuXHRcdFx0XHR2YXIgZW5kU3RyZWFtID0gY3JlYXRlU3RyZWFtKClcblx0XHRcdFx0ZW5kU3RyZWFtLm1hcChmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRcdGlmICh2YWx1ZSA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdFx0dW5yZWdpc3RlclN0cmVhbShzdHJlYW0pXG5cdFx0XHRcdFx0XHRlbmRTdHJlYW0uX3N0YXRlLnVucmVnaXN0ZXIgPSBmdW5jdGlvbigpe3VucmVnaXN0ZXJTdHJlYW0oZW5kU3RyZWFtKX1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHZhbHVlXG5cdFx0XHRcdH0pXG5cdFx0XHRcdHN0cmVhbS5fc3RhdGUuZW5kU3RyZWFtID0gZW5kU3RyZWFtXG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gc3RyZWFtLl9zdGF0ZS5lbmRTdHJlYW1cblx0XHR9fVxuXHR9KVxufVxuZnVuY3Rpb24gdXBkYXRlU3RyZWFtKHN0cmVhbSwgdmFsdWUpIHtcblx0dXBkYXRlU3RhdGUoc3RyZWFtLCB2YWx1ZSlcblx0Zm9yICh2YXIgaWQgaW4gc3RyZWFtLl9zdGF0ZS5kZXBzKSB1cGRhdGVEZXBlbmRlbmN5KHN0cmVhbS5fc3RhdGUuZGVwc1tpZF0sIGZhbHNlKVxuXHRpZiAoc3RyZWFtLl9zdGF0ZS51bnJlZ2lzdGVyICE9IG51bGwpIHN0cmVhbS5fc3RhdGUudW5yZWdpc3RlcigpXG5cdGZpbmFsaXplKHN0cmVhbSlcbn1cbmZ1bmN0aW9uIHVwZGF0ZVN0YXRlKHN0cmVhbSwgdmFsdWUpIHtcblx0c3RyZWFtLl9zdGF0ZS52YWx1ZSA9IHZhbHVlXG5cdHN0cmVhbS5fc3RhdGUuY2hhbmdlZCA9IHRydWVcblx0aWYgKHN0cmVhbS5fc3RhdGUuc3RhdGUgIT09IDIpIHN0cmVhbS5fc3RhdGUuc3RhdGUgPSAxXG59XG5mdW5jdGlvbiB1cGRhdGVEZXBlbmRlbmN5KHN0cmVhbSwgbXVzdFN5bmMpIHtcblx0dmFyIHN0YXRlID0gc3RyZWFtLl9zdGF0ZSwgcGFyZW50cyA9IHN0YXRlLnBhcmVudHNcblx0aWYgKHBhcmVudHMubGVuZ3RoID4gMCAmJiBwYXJlbnRzLmV2ZXJ5KGFjdGl2ZSkgJiYgKG11c3RTeW5jIHx8IHBhcmVudHMuc29tZShjaGFuZ2VkKSkpIHtcblx0XHR2YXIgdmFsdWUgPSBzdHJlYW0uX3N0YXRlLmRlcml2ZSgpXG5cdFx0aWYgKHZhbHVlID09PSBIQUxUKSByZXR1cm4gZmFsc2Vcblx0XHR1cGRhdGVTdGF0ZShzdHJlYW0sIHZhbHVlKVxuXHR9XG59XG5mdW5jdGlvbiBmaW5hbGl6ZShzdHJlYW0pIHtcblx0c3RyZWFtLl9zdGF0ZS5jaGFuZ2VkID0gZmFsc2Vcblx0Zm9yICh2YXIgaWQgaW4gc3RyZWFtLl9zdGF0ZS5kZXBzKSBzdHJlYW0uX3N0YXRlLmRlcHNbaWRdLl9zdGF0ZS5jaGFuZ2VkID0gZmFsc2Vcbn1cblxuZnVuY3Rpb24gY29tYmluZShmbiwgc3RyZWFtcykge1xuXHRpZiAoIXN0cmVhbXMuZXZlcnkodmFsaWQpKSB0aHJvdyBuZXcgRXJyb3IoXCJFbnN1cmUgdGhhdCBlYWNoIGl0ZW0gcGFzc2VkIHRvIHN0cmVhbS5jb21iaW5lL3N0cmVhbS5tZXJnZSBpcyBhIHN0cmVhbVwiKVxuXHRyZXR1cm4gaW5pdERlcGVuZGVuY3koY3JlYXRlU3RyZWFtKCksIHN0cmVhbXMsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBmbi5hcHBseSh0aGlzLCBzdHJlYW1zLmNvbmNhdChbc3RyZWFtcy5maWx0ZXIoY2hhbmdlZCldKSlcblx0fSlcbn1cblxuZnVuY3Rpb24gaW5pdERlcGVuZGVuY3koZGVwLCBzdHJlYW1zLCBkZXJpdmUpIHtcblx0dmFyIHN0YXRlID0gZGVwLl9zdGF0ZVxuXHRzdGF0ZS5kZXJpdmUgPSBkZXJpdmVcblx0c3RhdGUucGFyZW50cyA9IHN0cmVhbXMuZmlsdGVyKG5vdEVuZGVkKVxuXG5cdHJlZ2lzdGVyRGVwZW5kZW5jeShkZXAsIHN0YXRlLnBhcmVudHMpXG5cdHVwZGF0ZURlcGVuZGVuY3koZGVwLCB0cnVlKVxuXG5cdHJldHVybiBkZXBcbn1cbmZ1bmN0aW9uIHJlZ2lzdGVyRGVwZW5kZW5jeShzdHJlYW0sIHBhcmVudHMpIHtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBwYXJlbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0cGFyZW50c1tpXS5fc3RhdGUuZGVwc1tzdHJlYW0uX3N0YXRlLmlkXSA9IHN0cmVhbVxuXHRcdHJlZ2lzdGVyRGVwZW5kZW5jeShzdHJlYW0sIHBhcmVudHNbaV0uX3N0YXRlLnBhcmVudHMpXG5cdH1cbn1cbmZ1bmN0aW9uIHVucmVnaXN0ZXJTdHJlYW0oc3RyZWFtKSB7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc3RyZWFtLl9zdGF0ZS5wYXJlbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIHBhcmVudCA9IHN0cmVhbS5fc3RhdGUucGFyZW50c1tpXVxuXHRcdGRlbGV0ZSBwYXJlbnQuX3N0YXRlLmRlcHNbc3RyZWFtLl9zdGF0ZS5pZF1cblx0fVxuXHRmb3IgKHZhciBpZCBpbiBzdHJlYW0uX3N0YXRlLmRlcHMpIHtcblx0XHR2YXIgZGVwZW5kZW50ID0gc3RyZWFtLl9zdGF0ZS5kZXBzW2lkXVxuXHRcdHZhciBpbmRleCA9IGRlcGVuZGVudC5fc3RhdGUucGFyZW50cy5pbmRleE9mKHN0cmVhbSlcblx0XHRpZiAoaW5kZXggPiAtMSkgZGVwZW5kZW50Ll9zdGF0ZS5wYXJlbnRzLnNwbGljZShpbmRleCwgMSlcblx0fVxuXHRzdHJlYW0uX3N0YXRlLnN0YXRlID0gMiAvL2VuZGVkXG5cdHN0cmVhbS5fc3RhdGUuZGVwcyA9IHt9XG59XG5cbmZ1bmN0aW9uIG1hcChmbikge3JldHVybiBjb21iaW5lKGZ1bmN0aW9uKHN0cmVhbSkge3JldHVybiBmbihzdHJlYW0oKSl9LCBbdGhpc10pfVxuZnVuY3Rpb24gYXAoc3RyZWFtKSB7cmV0dXJuIGNvbWJpbmUoZnVuY3Rpb24oczEsIHMyKSB7cmV0dXJuIHMxKCkoczIoKSl9LCBbc3RyZWFtLCB0aGlzXSl9XG5mdW5jdGlvbiB2YWx1ZU9mKCkge3JldHVybiB0aGlzLl9zdGF0ZS52YWx1ZX1cbmZ1bmN0aW9uIHRvSlNPTigpIHtyZXR1cm4gdGhpcy5fc3RhdGUudmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdGhpcy5fc3RhdGUudmFsdWUudG9KU09OID09PSBcImZ1bmN0aW9uXCIgPyB0aGlzLl9zdGF0ZS52YWx1ZS50b0pTT04oKSA6IHRoaXMuX3N0YXRlLnZhbHVlfVxuXG5mdW5jdGlvbiB2YWxpZChzdHJlYW0pIHtyZXR1cm4gc3RyZWFtLl9zdGF0ZSB9XG5mdW5jdGlvbiBhY3RpdmUoc3RyZWFtKSB7cmV0dXJuIHN0cmVhbS5fc3RhdGUuc3RhdGUgPT09IDF9XG5mdW5jdGlvbiBjaGFuZ2VkKHN0cmVhbSkge3JldHVybiBzdHJlYW0uX3N0YXRlLmNoYW5nZWR9XG5mdW5jdGlvbiBub3RFbmRlZChzdHJlYW0pIHtyZXR1cm4gc3RyZWFtLl9zdGF0ZS5zdGF0ZSAhPT0gMn1cblxuZnVuY3Rpb24gbWVyZ2Uoc3RyZWFtcykge1xuXHRyZXR1cm4gY29tYmluZShmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gc3RyZWFtcy5tYXAoZnVuY3Rpb24ocykge3JldHVybiBzKCl9KVxuXHR9LCBzdHJlYW1zKVxufVxuXG5mdW5jdGlvbiBzY2FuKHJlZHVjZXIsIHNlZWQsIHN0cmVhbSkge1xuXHR2YXIgbmV3U3RyZWFtID0gY29tYmluZShmdW5jdGlvbiAocykge1xuXHRcdHJldHVybiBzZWVkID0gcmVkdWNlcihzZWVkLCBzLl9zdGF0ZS52YWx1ZSlcblx0fSwgW3N0cmVhbV0pXG5cblx0aWYgKG5ld1N0cmVhbS5fc3RhdGUuc3RhdGUgPT09IDApIG5ld1N0cmVhbShzZWVkKVxuXG5cdHJldHVybiBuZXdTdHJlYW1cbn1cblxuZnVuY3Rpb24gc2Nhbk1lcmdlKHR1cGxlcywgc2VlZCkge1xuXHR2YXIgc3RyZWFtcyA9IHR1cGxlcy5tYXAoZnVuY3Rpb24odHVwbGUpIHtcblx0XHR2YXIgc3RyZWFtID0gdHVwbGVbMF1cblx0XHRpZiAoc3RyZWFtLl9zdGF0ZS5zdGF0ZSA9PT0gMCkgc3RyZWFtKHVuZGVmaW5lZClcblx0XHRyZXR1cm4gc3RyZWFtXG5cdH0pXG5cblx0dmFyIG5ld1N0cmVhbSA9IGNvbWJpbmUoZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNoYW5nZWQgPSBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdXG5cblx0XHRzdHJlYW1zLmZvckVhY2goZnVuY3Rpb24oc3RyZWFtLCBpZHgpIHtcblx0XHRcdGlmIChjaGFuZ2VkLmluZGV4T2Yoc3RyZWFtKSA+IC0xKSB7XG5cdFx0XHRcdHNlZWQgPSB0dXBsZXNbaWR4XVsxXShzZWVkLCBzdHJlYW0uX3N0YXRlLnZhbHVlKVxuXHRcdFx0fVxuXHRcdH0pXG5cblx0XHRyZXR1cm4gc2VlZFxuXHR9LCBzdHJlYW1zKVxuXG5cdHJldHVybiBuZXdTdHJlYW1cbn1cblxuY3JlYXRlU3RyZWFtW1wiZmFudGFzeS1sYW5kL29mXCJdID0gY3JlYXRlU3RyZWFtXG5jcmVhdGVTdHJlYW0ubWVyZ2UgPSBtZXJnZVxuY3JlYXRlU3RyZWFtLmNvbWJpbmUgPSBjb21iaW5lXG5jcmVhdGVTdHJlYW0uc2NhbiA9IHNjYW5cbmNyZWF0ZVN0cmVhbS5zY2FuTWVyZ2UgPSBzY2FuTWVyZ2VcbmNyZWF0ZVN0cmVhbS5IQUxUID0gSEFMVFxuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIikgbW9kdWxlW1wiZXhwb3J0c1wiXSA9IGNyZWF0ZVN0cmVhbVxuZWxzZSBpZiAodHlwZW9mIHdpbmRvdy5tID09PSBcImZ1bmN0aW9uXCIgJiYgIShcInN0cmVhbVwiIGluIHdpbmRvdy5tKSkgd2luZG93Lm0uc3RyZWFtID0gY3JlYXRlU3RyZWFtXG5lbHNlIHdpbmRvdy5tID0ge3N0cmVhbSA6IGNyZWF0ZVN0cmVhbX1cblxufSgpKTtcbiIsIlwidXNlIHN0cmljdFwiXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3RyZWFtL3N0cmVhbVwiKVxuIiwidmFyIHBzZXVkb3MgPSBbXG4gICc6YWN0aXZlJyxcbiAgJzphbnknLFxuICAnOmNoZWNrZWQnLFxuICAnOmRlZmF1bHQnLFxuICAnOmRpc2FibGVkJyxcbiAgJzplbXB0eScsXG4gICc6ZW5hYmxlZCcsXG4gICc6Zmlyc3QnLFxuICAnOmZpcnN0LWNoaWxkJyxcbiAgJzpmaXJzdC1vZi10eXBlJyxcbiAgJzpmdWxsc2NyZWVuJyxcbiAgJzpmb2N1cycsXG4gICc6aG92ZXInLFxuICAnOmluZGV0ZXJtaW5hdGUnLFxuICAnOmluLXJhbmdlJyxcbiAgJzppbnZhbGlkJyxcbiAgJzpsYXN0LWNoaWxkJyxcbiAgJzpsYXN0LW9mLXR5cGUnLFxuICAnOmxlZnQnLFxuICAnOmxpbmsnLFxuICAnOm9ubHktY2hpbGQnLFxuICAnOm9ubHktb2YtdHlwZScsXG4gICc6b3B0aW9uYWwnLFxuICAnOm91dC1vZi1yYW5nZScsXG4gICc6cmVhZC1vbmx5JyxcbiAgJzpyZWFkLXdyaXRlJyxcbiAgJzpyZXF1aXJlZCcsXG4gICc6cmlnaHQnLFxuICAnOnJvb3QnLFxuICAnOnNjb3BlJyxcbiAgJzp0YXJnZXQnLFxuICAnOnZhbGlkJyxcbiAgJzp2aXNpdGVkJyxcblxuICAvLyBXaXRoIHZhbHVlXG4gICc6ZGlyJyxcbiAgJzpsYW5nJyxcbiAgJzpub3QnLFxuICAnOm50aC1jaGlsZCcsXG4gICc6bnRoLWxhc3QtY2hpbGQnLFxuICAnOm50aC1sYXN0LW9mLXR5cGUnLFxuICAnOm50aC1vZi10eXBlJyxcblxuICAvLyBFbGVtZW50c1xuICAnOjphZnRlcicsXG4gICc6OmJlZm9yZScsXG4gICc6OmZpcnN0LWxldHRlcicsXG4gICc6OmZpcnN0LWxpbmUnLFxuICAnOjpzZWxlY3Rpb24nLFxuICAnOjpiYWNrZHJvcCcsXG4gICc6OnBsYWNlaG9sZGVyJyxcbiAgJzo6bWFya2VyJyxcbiAgJzo6c3BlbGxpbmctZXJyb3InLFxuICAnOjpncmFtbWFyLWVycm9yJ1xuXTtcblxudmFyIHBvcHVsYXIgPSB7XG4gIGFpIDogJ2FsaWduSXRlbXMnLFxuICBiICA6ICdib3R0b20nLFxuICBiYyA6ICdiYWNrZ3JvdW5kQ29sb3InLFxuICBiciA6ICdib3JkZXJSYWRpdXMnLFxuICBicyA6ICdib3hTaGFkb3cnLFxuICBiaSA6ICdiYWNrZ3JvdW5kSW1hZ2UnLFxuICBjICA6ICdjb2xvcicsXG4gIGQgIDogJ2Rpc3BsYXknLFxuICBmICA6ICdmbG9hdCcsXG4gIGZkIDogJ2ZsZXhEaXJlY3Rpb24nLFxuICBmZiA6ICdmb250RmFtaWx5JyxcbiAgZnMgOiAnZm9udFNpemUnLFxuICBoICA6ICdoZWlnaHQnLFxuICBqYyA6ICdqdXN0aWZ5Q29udGVudCcsXG4gIGwgIDogJ2xlZnQnLFxuICBsaCA6ICdsaW5lSGVpZ2h0JyxcbiAgbHMgOiAnbGV0dGVyU3BhY2luZycsXG4gIG0gIDogJ21hcmdpbicsXG4gIG1iIDogJ21hcmdpbkJvdHRvbScsXG4gIG1sIDogJ21hcmdpbkxlZnQnLFxuICBtciA6ICdtYXJnaW5SaWdodCcsXG4gIG10IDogJ21hcmdpblRvcCcsXG4gIG8gIDogJ29wYWNpdHknLFxuICBwICA6ICdwYWRkaW5nJyxcbiAgcGIgOiAncGFkZGluZ0JvdHRvbScsXG4gIHBsIDogJ3BhZGRpbmdMZWZ0JyxcbiAgcHIgOiAncGFkZGluZ1JpZ2h0JyxcbiAgcHQgOiAncGFkZGluZ1RvcCcsXG4gIHIgIDogJ3JpZ2h0JyxcbiAgdCAgOiAndG9wJyxcbiAgdGEgOiAndGV4dEFsaWduJyxcbiAgdGQgOiAndGV4dERlY29yYXRpb24nLFxuICB0dCA6ICd0ZXh0VHJhbnNmb3JtJyxcbiAgdyAgOiAnd2lkdGgnXG59O1xuXG52YXIgY3NzUHJvcGVydGllcyA9IFsnZmxvYXQnXS5jb25jYXQoT2JqZWN0LmtleXMoXG4gIHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCdcbiAgICA/IHt9XG4gICAgOiBmaW5kV2lkdGgoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlKVxuKS5maWx0ZXIoZnVuY3Rpb24gKHApIHsgcmV0dXJuIHAuaW5kZXhPZignLScpID09PSAtMSAmJiBwICE9PSAnbGVuZ3RoJzsgfSkpO1xuXG5mdW5jdGlvbiBmaW5kV2lkdGgob2JqKSB7XG4gIHJldHVybiBvYmpcbiAgICA/IG9iai5oYXNPd25Qcm9wZXJ0eSgnd2lkdGgnKVxuICAgICAgPyBvYmpcbiAgICAgIDogZmluZFdpZHRoKE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopKVxuICAgIDoge31cbn1cblxudmFyIGlzUHJvcCA9IC9eLT8tP1thLXpdW2Etei1fMC05XSokL2k7XG5cbnZhciBtZW1vaXplID0gZnVuY3Rpb24gKGZuLCBjYWNoZSkge1xuICBpZiAoIGNhY2hlID09PSB2b2lkIDAgKSBjYWNoZSA9IHt9O1xuXG4gIHJldHVybiBmdW5jdGlvbiAoaXRlbSkgeyByZXR1cm4gaXRlbSBpbiBjYWNoZVxuICAgID8gY2FjaGVbaXRlbV1cbiAgICA6IGNhY2hlW2l0ZW1dID0gZm4oaXRlbSk7IH07XG59O1xuXG5mdW5jdGlvbiBhZGQoc3R5bGUsIHByb3AsIHZhbHVlcykge1xuICBpZiAocHJvcCBpbiBzdHlsZSkgLy8gUmVjdXJzaXZlbHkgaW5jcmVhc2Ugc3BlY2lmaWNpdHlcbiAgICB7IGFkZChzdHlsZSwgJyEnICsgcHJvcCwgdmFsdWVzKTsgfVxuICBlbHNlXG4gICAgeyBzdHlsZVtwcm9wXSA9IGZvcm1hdFZhbHVlcyhwcm9wLCB2YWx1ZXMpOyB9XG59XG5cbnZhciB2ZW5kb3JNYXAgPSBPYmplY3QuY3JlYXRlKG51bGwsIHt9KTtcbnZhciB2ZW5kb3JWYWx1ZVByZWZpeCA9IE9iamVjdC5jcmVhdGUobnVsbCwge30pO1xuXG52YXIgdmVuZG9yUmVnZXggPSAvXihvfE98bXN8TVN8TXN8bW96fE1venx3ZWJraXR8V2Via2l0fFdlYktpdCkoW0EtWl0pLztcblxudmFyIGFwcGVuZFB4ID0gbWVtb2l6ZShmdW5jdGlvbiAocHJvcCkge1xuICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICB0cnkge1xuICAgIGVsLnN0eWxlW3Byb3BdID0gJzFweCc7XG4gICAgZWwuc3R5bGUuc2V0UHJvcGVydHkocHJvcCwgJzFweCcpO1xuICAgIHJldHVybiBlbC5zdHlsZVtwcm9wXS5zbGljZSgtMykgPT09ICcxcHgnID8gJ3B4JyA6ICcnXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiAnJ1xuICB9XG59LCB7XG4gIGZsZXg6ICcnLFxuICBib3hTaGFkb3c6ICdweCcsXG4gIGJvcmRlcjogJ3B4JyxcbiAgYm9yZGVyVG9wOiAncHgnLFxuICBib3JkZXJSaWdodDogJ3B4JyxcbiAgYm9yZGVyQm90dG9tOiAncHgnLFxuICBib3JkZXJMZWZ0OiAncHgnXG59KTtcblxuZnVuY3Rpb24gbG93ZXJjYXNlRmlyc3Qoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvTG93ZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSlcbn1cblxuZnVuY3Rpb24gYXNzaWduKG9iaiwgb2JqMikge1xuICBmb3IgKHZhciBrZXkgaW4gb2JqMikge1xuICAgIGlmIChvYmoyLmhhc093blByb3BlcnR5KGtleSkpXG4gICAgICB7IG9ialtrZXldID0gb2JqMltrZXldOyB9XG4gIH1cbiAgcmV0dXJuIG9ialxufVxuXG5mdW5jdGlvbiBoeXBoZW5Ub0NhbWVsQ2FzZShoeXBoZW4pIHtcbiAgcmV0dXJuIGh5cGhlbi5zbGljZShoeXBoZW4uY2hhckF0KDApID09PSAnLScgPyAxIDogMCkucmVwbGFjZSgvLShbYS16XSkvZywgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICByZXR1cm4gbWF0Y2hbMV0udG9VcHBlckNhc2UoKVxuICB9KVxufVxuXG5mdW5jdGlvbiBjYW1lbENhc2VUb0h5cGhlbihjYW1lbENhc2UpIHtcbiAgcmV0dXJuIGNhbWVsQ2FzZS5yZXBsYWNlKC8oXFxCW0EtWl0pL2csICctJDEnKS50b0xvd2VyQ2FzZSgpXG59XG5cbmZ1bmN0aW9uIGluaXRpYWxzKGNhbWVsQ2FzZSkge1xuICByZXR1cm4gY2FtZWxDYXNlLmNoYXJBdCgwKSArIChjYW1lbENhc2UubWF0Y2goLyhbQS1aXSkvZykgfHwgW10pLmpvaW4oJycpLnRvTG93ZXJDYXNlKClcbn1cblxuZnVuY3Rpb24gb2JqZWN0VG9SdWxlcyhzdHlsZSwgc2VsZWN0b3IsIHN1ZmZpeCwgc2luZ2xlKSB7XG4gIGlmICggc3VmZml4ID09PSB2b2lkIDAgKSBzdWZmaXggPSAnJztcblxuICB2YXIgYmFzZSA9IHt9O1xuXG4gIHZhciBydWxlcyA9IFtdO1xuXG4gIE9iamVjdC5rZXlzKHN0eWxlKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgaWYgKHByb3AuY2hhckF0KDApID09PSAnQCcpXG4gICAgICB7IHJ1bGVzLnB1c2gocHJvcCArICd7JyArIG9iamVjdFRvUnVsZXMoc3R5bGVbcHJvcF0sIHNlbGVjdG9yLCBzdWZmaXgsIHNpbmdsZSkgKyAnfScpOyB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHN0eWxlW3Byb3BdID09PSAnb2JqZWN0JylcbiAgICAgIHsgcnVsZXMgPSBydWxlcy5jb25jYXQob2JqZWN0VG9SdWxlcyhzdHlsZVtwcm9wXSwgc2VsZWN0b3IsIHN1ZmZpeCArIHByb3AsIHNpbmdsZSkpOyB9XG4gICAgZWxzZVxuICAgICAgeyBiYXNlW3Byb3BdID0gc3R5bGVbcHJvcF07IH1cbiAgfSk7XG5cbiAgaWYgKE9iamVjdC5rZXlzKGJhc2UpLmxlbmd0aCkge1xuICAgIHJ1bGVzLnVuc2hpZnQoXG4gICAgICAoKHNpbmdsZSB8fCAoc3VmZml4LmNoYXJBdCgwKSA9PT0gJyAnKSA/ICcnIDogJyYnKSArICcmJyArIHN1ZmZpeCkucmVwbGFjZSgvJi9nLCBzZWxlY3RvcikgK1xuICAgICAgJ3snICsgc3R5bGVzVG9Dc3MoYmFzZSkgKyAnfSdcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIHJ1bGVzXG59XG5cbnZhciBzZWxlY3RvclNwbGl0ID0gLywoPz0oPzooPzpbXlwiXSpcIil7Mn0pKlteXCJdKiQpLztcblxuZnVuY3Rpb24gc3R5bGVzVG9Dc3Moc3R5bGUpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKHN0eWxlKS5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgcHJvcCkgeyByZXR1cm4gYWNjICsgcHJvcFRvU3RyaW5nKHByb3AucmVwbGFjZSgvIS9nLCAnJyksIHN0eWxlW3Byb3BdKTsgfVxuICAsICcnKVxufVxuXG5mdW5jdGlvbiBwcm9wVG9TdHJpbmcocHJvcCwgdmFsdWUpIHtcbiAgcHJvcCA9IHByb3AgaW4gdmVuZG9yTWFwID8gdmVuZG9yTWFwW3Byb3BdIDogcHJvcDtcbiAgcmV0dXJuICh2ZW5kb3JSZWdleC50ZXN0KHByb3ApID8gJy0nIDogJycpXG4gICAgKyAoY3NzVmFyKHByb3ApXG4gICAgICA/IHByb3BcbiAgICAgIDogY2FtZWxDYXNlVG9IeXBoZW4ocHJvcClcbiAgICApXG4gICAgKyAnOidcbiAgICArIHZhbHVlXG4gICAgKyAnOydcbn1cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWVzKHByb3AsIHZhbHVlKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKVxuICAgID8gdmFsdWUubWFwKGZ1bmN0aW9uICh2KSB7IHJldHVybiBmb3JtYXRWYWx1ZShwcm9wLCB2KTsgfSkuam9pbignICcpXG4gICAgOiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICA/IGZvcm1hdFZhbHVlcyhwcm9wLCB2YWx1ZS5zcGxpdCgnICcpKVxuICAgICAgOiBmb3JtYXRWYWx1ZShwcm9wLCB2YWx1ZSlcbn1cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUocHJvcCwgdmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlIGluIHZlbmRvclZhbHVlUHJlZml4XG4gICAgPyB2ZW5kb3JWYWx1ZVByZWZpeFt2YWx1ZV1cbiAgICA6IHZhbHVlICsgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJyB8fCBjc3NWYXIocHJvcCkgPyAnJyA6IGFwcGVuZFB4KHByb3ApKVxufVxuXG5mdW5jdGlvbiBjc3NWYXIocHJvcCkge1xuICByZXR1cm4gcHJvcC5jaGFyQXQoMCkgPT09ICctJyAmJiBwcm9wLmNoYXJBdCgxKSA9PT0gJy0nXG59XG5cbnZhciBzdHlsZVNoZWV0ID0gdHlwZW9mIGRvY3VtZW50ID09PSAnb2JqZWN0JyAmJiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuc3R5bGVTaGVldCAmJiBkb2N1bWVudC5oZWFkICYmIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVTaGVldCk7XG5cbnZhciBzaGVldCA9IHN0eWxlU2hlZXQgJiYgc3R5bGVTaGVldC5zaGVldDtcblxudmFyIGRlYnVnID0gZmFsc2U7XG52YXIgY2xhc3NlcyA9IE9iamVjdC5jcmVhdGUobnVsbCwge30pO1xudmFyIHJ1bGVzID0gW107XG52YXIgY291bnQgPSAwO1xuXG52YXIgY2xhc3NQcmVmaXggPSAnYicgKyAoJzAwMCcgKyAoKE1hdGgucmFuZG9tKCkgKiA0NjY1NikgfCAwKS50b1N0cmluZygzNikpLnNsaWNlKC0zKSArXG4gICAgICAgICAgICAgICAgICAgICgnMDAwJyArICgoTWF0aC5yYW5kb20oKSAqIDQ2NjU2KSB8IDApLnRvU3RyaW5nKDM2KSkuc2xpY2UoLTMpO1xuXG5mdW5jdGlvbiBzZXREZWJ1ZyhkKSB7XG4gIGRlYnVnID0gZDtcbn1cblxuZnVuY3Rpb24gZ2V0U2hlZXQoKSB7XG4gIHZhciBjb250ZW50ID0gcnVsZXMuam9pbignJyk7XG4gIHJ1bGVzID0gW107XG4gIGNsYXNzZXMgPSBPYmplY3QuY3JlYXRlKG51bGwsIHt9KTtcbiAgY291bnQgPSAwO1xuICByZXR1cm4gY29udGVudFxufVxuXG5mdW5jdGlvbiBnZXRSdWxlcygpIHtcbiAgcmV0dXJuIHJ1bGVzXG59XG5cbmZ1bmN0aW9uIGluc2VydChydWxlLCBpbmRleCkge1xuICBydWxlcy5wdXNoKHJ1bGUpO1xuXG4gIGlmIChkZWJ1ZylcbiAgICB7IHJldHVybiBzdHlsZVNoZWV0LnRleHRDb250ZW50ID0gcnVsZXMuam9pbignXFxuJykgfVxuXG4gIHRyeSB7XG4gICAgc2hlZXQgJiYgc2hlZXQuaW5zZXJ0UnVsZShydWxlLCBhcmd1bWVudHMubGVuZ3RoID4gMVxuICAgICAgPyBpbmRleFxuICAgICAgOiBzaGVldC5jc3NSdWxlcy5sZW5ndGgpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gSWdub3JlIHRocm93biBlcnJvcnMgaW4gZWcuIGZpcmVmb3ggZm9yIHVuc3VwcG9ydGVkIHN0cmluZ3MgKDo6LXdlYmtpdC1pbm5lci1zcGluLWJ1dHRvbilcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVDbGFzcyhzdHlsZSkge1xuICB2YXIganNvbiA9IEpTT04uc3RyaW5naWZ5KHN0eWxlKTtcblxuICBpZiAoanNvbiBpbiBjbGFzc2VzKVxuICAgIHsgcmV0dXJuIGNsYXNzZXNbanNvbl0gfVxuXG4gIHZhciBjbGFzc05hbWUgPSBjbGFzc1ByZWZpeCArICgrK2NvdW50KVxuICAgICAgLCBydWxlcyA9IG9iamVjdFRvUnVsZXMoc3R5bGUsICcuJyArIGNsYXNzTmFtZSk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKylcbiAgICB7IGluc2VydChydWxlc1tpXSk7IH1cblxuICBjbGFzc2VzW2pzb25dID0gY2xhc3NOYW1lO1xuXG4gIHJldHVybiBjbGFzc05hbWVcbn1cblxuLyogZXNsaW50IG5vLWludmFsaWQtdGhpczogMCAqL1xuXG52YXIgc2hvcnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuZnVuY3Rpb24gYnNzKGlucHV0LCB2YWx1ZSkge1xuICB2YXIgYiA9IGNoYWluKGJzcyk7XG4gIGlucHV0ICYmIGFzc2lnbihiLl9fc3R5bGUsIHBhcnNlLmFwcGx5KG51bGwsIGFyZ3VtZW50cykpO1xuICByZXR1cm4gYlxufVxuXG5mdW5jdGlvbiBzZXRQcm9wKHByb3AsIHZhbHVlKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShic3MsIHByb3AsIHtcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6IHZhbHVlXG4gIH0pO1xufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhic3MsIHtcbiAgX19zdHlsZToge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICB2YWx1ZToge31cbiAgfSxcbiAgdmFsdWVPZjoge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJy4nICsgdGhpcy5jbGFzc1xuICAgIH1cbiAgfSxcbiAgdG9TdHJpbmc6IHtcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgd3JpdGFibGU6IHRydWUsXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuY2xhc3NcbiAgICB9XG4gIH1cbn0pO1xuXG5zZXRQcm9wKCdzZXREZWJ1ZycsIHNldERlYnVnKTtcblxuc2V0UHJvcCgnJGtleWZyYW1lcycsIGtleWZyYW1lcyk7XG5zZXRQcm9wKCckbWVkaWEnLCAkbWVkaWEpO1xuc2V0UHJvcCgnJGltcG9ydCcsICRpbXBvcnQpO1xuc2V0UHJvcCgnJG5lc3QnLCAkbmVzdCk7XG5zZXRQcm9wKCdnZXRTaGVldCcsIGdldFNoZWV0KTtcbnNldFByb3AoJ2dldFJ1bGVzJywgZ2V0UnVsZXMpO1xuc2V0UHJvcCgnaGVscGVyJywgaGVscGVyKTtcbnNldFByb3AoJ2NzcycsIGNzcyk7XG5zZXRQcm9wKCdjbGFzc1ByZWZpeCcsIGNsYXNzUHJlZml4KTtcblxuZnVuY3Rpb24gY2hhaW4oaW5zdGFuY2UpIHtcbiAgdmFyIG5ld0luc3RhbmNlID0gT2JqZWN0LmNyZWF0ZShic3MsIHtcbiAgICBfX3N0eWxlOiB7XG4gICAgICB2YWx1ZTogYXNzaWduKHt9LCBpbnN0YW5jZS5fX3N0eWxlKVxuICAgIH0sXG4gICAgc3R5bGU6IHtcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdGhpcyQxID0gdGhpcztcblxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5fX3N0eWxlKS5yZWR1Y2UoZnVuY3Rpb24gKGFjYywga2V5KSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiB0aGlzJDEuX19zdHlsZVtrZXldID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgdGhpcyQxLl9fc3R5bGVba2V5XSA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICB7IGFjY1trZXkucmVwbGFjZSgvXiEvLCAnJyldID0gdGhpcyQxLl9fc3R5bGVba2V5XTsgfVxuICAgICAgICAgIHJldHVybiBhY2NcbiAgICAgICAgfSwge30pXG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBpZiAoaW5zdGFuY2UgPT09IGJzcylcbiAgICB7IGJzcy5fX3N0eWxlID0ge307IH1cblxuICByZXR1cm4gbmV3SW5zdGFuY2Vcbn1cblxuY3NzUHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wKSB7XG4gIHZhciB2ZW5kb3IgPSBwcm9wLm1hdGNoKHZlbmRvclJlZ2V4KTtcbiAgaWYgKHZlbmRvcikge1xuICAgIHZhciB1bnByZWZpeGVkID0gbG93ZXJjYXNlRmlyc3QocHJvcC5yZXBsYWNlKHZlbmRvclJlZ2V4LCAnJDInKSk7XG4gICAgaWYgKGNzc1Byb3BlcnRpZXMuaW5kZXhPZih1bnByZWZpeGVkKSA9PT0gLTEpIHtcbiAgICAgIGlmICh1bnByZWZpeGVkID09PSAnZmxleERpcmVjdGlvbicpXG4gICAgICAgIHsgdmVuZG9yVmFsdWVQcmVmaXguZmxleCA9ICctJyArIHZlbmRvclsxXS50b0xvd2VyQ2FzZSgpICsgJy1mbGV4JzsgfVxuXG4gICAgICB2ZW5kb3JNYXBbdW5wcmVmaXhlZF0gPSBwcm9wO1xuICAgICAgc2V0UHJvcCh1bnByZWZpeGVkLCBzZXR0ZXIocHJvcCkpO1xuICAgICAgc2V0UHJvcChzaG9ydCh1bnByZWZpeGVkKSwgYnNzW3VucHJlZml4ZWRdKTtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxuXG4gIHNldFByb3AocHJvcCwgc2V0dGVyKHByb3ApKTtcbiAgc2V0UHJvcChzaG9ydChwcm9wKSwgYnNzW3Byb3BdKTtcbn0pO1xuXG5zZXRQcm9wKCdjb250ZW50JywgZnVuY3Rpb24gQ29udGVudChhcmcpIHtcbiAgdmFyIGIgPSBjaGFpbih0aGlzKTtcbiAgYXJnID09PSBudWxsIHx8IGFyZyA9PT0gdW5kZWZpbmVkIHx8IGFyZyA9PT0gZmFsc2VcbiAgICA/IGRlbGV0ZSBiLl9fc3R5bGUuY29udGVudFxuICAgIDogYi5fX3N0eWxlLmNvbnRlbnQgPSAnXCInICsgYXJnICsgJ1wiJztcbiAgcmV0dXJuIGJcbn0pO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoYnNzLCAnY2xhc3MnLCB7XG4gIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICB0aGlzLl9fY2xhc3MgPSB2YWx1ZTtcbiAgfSxcbiAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fX2NsYXNzIHx8IGNyZWF0ZUNsYXNzKHRoaXMuX19zdHlsZSlcbiAgfVxufSk7XG5cbmZ1bmN0aW9uICRtZWRpYSh2YWx1ZSwgc3R5bGUpIHtcbiAgdmFyIGIgPSBjaGFpbih0aGlzKTtcbiAgaWYgKHZhbHVlKVxuICAgIHsgYi5fX3N0eWxlWydAbWVkaWEgJyArIHZhbHVlXSA9IHBhcnNlKHN0eWxlKTsgfVxuXG4gIHJldHVybiBiXG59XG5cbmZ1bmN0aW9uICRpbXBvcnQodmFsdWUpIHtcbiAgaWYgKHZhbHVlKVxuICAgIHsgaW5zZXJ0KCdAaW1wb3J0ICcgKyB2YWx1ZSArICc7JywgMCk7IH1cblxuICByZXR1cm4gY2hhaW4odGhpcylcbn1cblxuZnVuY3Rpb24gJG5lc3Qoc2VsZWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgdmFyIGIgPSBjaGFpbih0aGlzKTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpXG4gICAgeyBPYmplY3Qua2V5cyhzZWxlY3RvcikuZm9yRWFjaChmdW5jdGlvbiAoeCkgeyByZXR1cm4gYWRkTmVzdChiLl9fc3R5bGUsIHgsIHNlbGVjdG9yW3hdKTsgfSk7IH1cbiAgZWxzZSBpZiAoc2VsZWN0b3IpXG4gICAgeyBhZGROZXN0KGIuX19zdHlsZSwgc2VsZWN0b3IsIHByb3BlcnRpZXMpOyB9XG5cbiAgcmV0dXJuIGJcbn1cblxuZnVuY3Rpb24gYWRkTmVzdChzdHlsZSwgc2VsZWN0b3IsIHByb3BlcnRpZXMpIHtcbiAgc3R5bGVbXG4gICAgc2VsZWN0b3Iuc3BsaXQoc2VsZWN0b3JTcGxpdCkubWFwKGZ1bmN0aW9uICh4KSB7XG4gICAgICB4ID0geC50cmltKCk7XG4gICAgICByZXR1cm4gKHguY2hhckF0KDApID09PSAnOicgfHwgeC5jaGFyQXQoMCkgPT09ICdbJyA/ICcnIDogJyAnKSArIHhcbiAgICB9KS5qb2luKCcsJicpXG4gIF0gPSBwYXJzZShwcm9wZXJ0aWVzKTtcbn1cblxucHNldWRvcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBzZXRQcm9wKCckJyArIGh5cGhlblRvQ2FtZWxDYXNlKG5hbWUucmVwbGFjZSgvOi9nLCAnJykpLCBmdW5jdGlvbiBQc2V1ZG8odmFsdWUsIHN0eWxlKSB7XG4gICAgdmFyIGIgPSBjaGFpbih0aGlzKTtcbiAgICBpZiAoaXNUYWdnZWQodmFsdWUpKVxuICAgICAgeyBiLl9fc3R5bGVbbmFtZV0gPSBwYXJzZS5hcHBseShudWxsLCBhcmd1bWVudHMpOyB9XG4gICAgZWxzZSBpZiAodmFsdWUgfHwgc3R5bGUpXG4gICAgICB7IGIuX19zdHlsZVtuYW1lICsgKHN0eWxlID8gJygnICsgdmFsdWUgKyAnKScgOiAnJyldID0gcGFyc2Uoc3R5bGUgfHwgdmFsdWUpOyB9XG4gICAgcmV0dXJuIGJcbiAgfSk7IH1cbik7XG5cbmZ1bmN0aW9uIHNldHRlcihwcm9wKSB7XG4gIHJldHVybiBmdW5jdGlvbiBDc3NQcm9wZXJ0eSh2YWx1ZSkge1xuICAgIHZhciBiID0gY2hhaW4odGhpcyk7XG4gICAgaWYgKCF2YWx1ZSAmJiB2YWx1ZSAhPT0gMClcbiAgICAgIHsgZGVsZXRlIGIuX19zdHlsZVtwcm9wXTsgfVxuICAgIGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAwKVxuICAgICAgeyBhZGQoYi5fX3N0eWxlLCBwcm9wLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTsgfVxuXG4gICAgcmV0dXJuIGJcbiAgfVxufVxuXG5mdW5jdGlvbiBjc3Moc2VsZWN0b3IsIHN0eWxlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKVxuICAgIHsgT2JqZWN0LmtleXMoc2VsZWN0b3IpLmZvckVhY2goZnVuY3Rpb24gKGtleSkgeyByZXR1cm4gYWRkQ3NzKGtleSwgc2VsZWN0b3Jba2V5XSk7IH0pOyB9XG4gIGVsc2VcbiAgICB7IGFkZENzcyhzZWxlY3Rvciwgc3R5bGUpOyB9XG5cbiAgcmV0dXJuIGNoYWluKHRoaXMpXG59XG5cbmZ1bmN0aW9uIGFkZENzcyhzZWxlY3Rvciwgc3R5bGUpIHtcbiAgb2JqZWN0VG9SdWxlcyhwYXJzZShzdHlsZSksIHNlbGVjdG9yLCAnJywgdHJ1ZSkuZm9yRWFjaChpbnNlcnQpO1xufVxuXG5mdW5jdGlvbiBoZWxwZXIobmFtZSwgc3R5bGluZykge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSlcbiAgICB7IHJldHVybiBPYmplY3Qua2V5cyhuYW1lKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHsgcmV0dXJuIGhlbHBlcihrZXksIG5hbWVba2V5XSk7IH0pIH1cblxuICBkZWxldGUgYnNzW25hbWVdOyAvLyBOZWVkZWQgdG8gYXZvaWQgd2VpcmQgZ2V0IGNhbGxzIGluIGNocm9tZVxuXG4gIGlmICh0eXBlb2Ygc3R5bGluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGhlbHBlcltuYW1lXSA9IHN0eWxpbmc7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGJzcywgbmFtZSwge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIEhlbHBlcihpbnB1dCkge1xuICAgICAgICB2YXIgYiA9IGNoYWluKHRoaXMpO1xuICAgICAgICB2YXIgcmVzdWx0ID0gaXNUYWdnZWQoaW5wdXQpXG4gICAgICAgICAgPyBzdHlsaW5nKHJhdyhpbnB1dCwgYXJndW1lbnRzKSlcbiAgICAgICAgICA6IHN0eWxpbmcuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgYXNzaWduKGIuX19zdHlsZSwgcmVzdWx0Ll9fc3R5bGUpO1xuICAgICAgICByZXR1cm4gYlxuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGhlbHBlcltuYW1lXSA9IHBhcnNlKHN0eWxpbmcpO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShic3MsIG5hbWUsIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBiID0gY2hhaW4odGhpcyk7XG4gICAgICAgIGFzc2lnbihiLl9fc3R5bGUsIHBhcnNlKHN0eWxpbmcpKTtcbiAgICAgICAgcmV0dXJuIGJcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5ic3MuaGVscGVyKCckYW5pbWF0ZScsIGZ1bmN0aW9uICh2YWx1ZSwgcHJvcHMpIHsgcmV0dXJuIGJzcy5hbmltYXRpb24oYnNzLiRrZXlmcmFtZXMocHJvcHMpICsgJyAnICsgdmFsdWUpOyB9XG4pO1xuXG5mdW5jdGlvbiBzaG9ydChwcm9wKSB7XG4gIHZhciBhY3JvbnltID0gaW5pdGlhbHMocHJvcClcbiAgICAgICwgc2hvcnQgPSBwb3B1bGFyW2Fjcm9ueW1dICYmIHBvcHVsYXJbYWNyb255bV0gIT09IHByb3AgPyBwcm9wIDogYWNyb255bTtcblxuICBzaG9ydHNbc2hvcnRdID0gcHJvcDtcbiAgcmV0dXJuIHNob3J0XG59XG5cbnZhciBzdHJpbmdUb09iamVjdCA9IG1lbW9pemUoZnVuY3Rpb24gKHN0cmluZykge1xuICB2YXIgbGFzdCA9ICcnXG4gICAgLCBwcmV2O1xuXG4gIHJldHVybiBzdHJpbmcudHJpbSgpLnJlcGxhY2UoL1xcL1xcKltcXHNcXFNdKj9cXCpcXC98KFteOl18XilcXC9cXC8uKi9nLCAnJykuc3BsaXQoLzt8XFxuLykucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGxpbmUpIHtcbiAgICBpZiAoIWxpbmUpXG4gICAgICB7IHJldHVybiBhY2MgfVxuICAgIGxpbmUgPSBsYXN0ICsgbGluZS50cmltKCk7XG4gICAgdmFyIHJlZiA9IGxpbmUucmVwbGFjZSgvWyA6XSsvLCAnICcpLnNwbGl0KCcgJyk7XG4gICAgdmFyIGtleSA9IHJlZlswXTtcbiAgICB2YXIgdG9rZW5zID0gcmVmLnNsaWNlKDEpO1xuXG4gICAgbGFzdCA9IGxpbmUuY2hhckF0KGxpbmUubGVuZ3RoIC0gMSkgPT09ICcsJyA/IGxpbmUgOiAnJztcbiAgICBpZiAobGFzdClcbiAgICAgIHsgcmV0dXJuIGFjYyB9XG5cbiAgICBpZiAobGluZS5jaGFyQXQoMCkgPT09ICcsJyB8fCAhaXNQcm9wLnRlc3Qoa2V5KSkge1xuICAgICAgYWNjW3ByZXZdICs9ICcgJyArIGxpbmU7XG4gICAgICByZXR1cm4gYWNjXG4gICAgfVxuXG4gICAgaWYgKCFrZXkpXG4gICAgICB7IHJldHVybiBhY2MgfVxuXG4gICAgdmFyIHByb3AgPSBrZXkuY2hhckF0KDApID09PSAnLScgJiYga2V5LmNoYXJBdCgxKSA9PT0gJy0nXG4gICAgICA/IGtleVxuICAgICAgOiBoeXBoZW5Ub0NhbWVsQ2FzZShrZXkpO1xuXG4gICAgcHJldiA9IHNob3J0c1twcm9wXSB8fCBwcm9wO1xuXG4gICAgaWYgKHByb3AgaW4gaGVscGVyKSB7XG4gICAgICB0eXBlb2YgaGVscGVyW3Byb3BdID09PSAnZnVuY3Rpb24nXG4gICAgICAgID8gYXNzaWduKGFjYywgaGVscGVyW3Byb3BdLmFwcGx5KGhlbHBlciwgdG9rZW5zKS5fX3N0eWxlKVxuICAgICAgICA6IGFzc2lnbihhY2MsIGhlbHBlcltwcm9wXSk7XG4gICAgfSBlbHNlIGlmICh0b2tlbnMubGVuZ3RoID4gMCkge1xuICAgICAgYWRkKGFjYywgcHJldiwgdG9rZW5zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWNjXG4gIH0sIHt9KVxufSk7XG5cbnZhciBjb3VudCQxID0gMDtcbnZhciBrZXlmcmFtZUNhY2hlID0ge307XG5cbmZ1bmN0aW9uIGtleWZyYW1lcyhwcm9wcykge1xuICB2YXIgY29udGVudCA9IE9iamVjdC5rZXlzKHByb3BzKS5yZWR1Y2UoZnVuY3Rpb24gKGFjYywga2V5KSB7IHJldHVybiBhY2MgKyBrZXkgKyAneycgKyBzdHlsZXNUb0NzcyhwYXJzZShwcm9wc1trZXldKSkgKyAnfSc7IH1cbiAgLCAnJyk7XG5cbiAgaWYgKGNvbnRlbnQgaW4ga2V5ZnJhbWVDYWNoZSlcbiAgICB7IHJldHVybiBrZXlmcmFtZUNhY2hlW2NvbnRlbnRdIH1cblxuICB2YXIgbmFtZSA9IGNsYXNzUHJlZml4ICsgY291bnQkMSsrO1xuICBrZXlmcmFtZUNhY2hlW2NvbnRlbnRdID0gbmFtZTtcbiAgaW5zZXJ0KCdAa2V5ZnJhbWVzICcgKyBuYW1lICsgJ3snICsgY29udGVudCArICd9Jyk7XG5cbiAgcmV0dXJuIG5hbWVcbn1cblxuZnVuY3Rpb24gcGFyc2UoaW5wdXQsIHZhbHVlKSB7XG4gIHZhciBvYmo7XG5cbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKVxuICAgICAgeyByZXR1cm4gKCggb2JqID0ge30sIG9ialtpbnB1dF0gPSB2YWx1ZSwgb2JqICkpIH1cblxuICAgIHJldHVybiBzdHJpbmdUb09iamVjdChpbnB1dClcbiAgfSBlbHNlIGlmIChpc1RhZ2dlZChpbnB1dCkpIHtcbiAgICByZXR1cm4gc3RyaW5nVG9PYmplY3QocmF3KGlucHV0LCBhcmd1bWVudHMpKVxuICB9XG5cbiAgcmV0dXJuIGlucHV0Ll9fc3R5bGUgfHwgc2FuaXRpemUoaW5wdXQpXG59XG5cbmZ1bmN0aW9uIGlzVGFnZ2VkKGlucHV0KSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGlucHV0KSAmJiB0eXBlb2YgaW5wdXRbMF0gPT09ICdzdHJpbmcnXG59XG5cbmZ1bmN0aW9uIHJhdyhpbnB1dCwgYXJncykge1xuICB2YXIgc3RyID0gJyc7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgaW5wdXQubGVuZ3RoOyBpKyspXG4gICAgeyBzdHIgKz0gaW5wdXRbaV0gKyAoYXJnc1tpICsgMV0gfHwgJycpOyB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gc2FuaXRpemUoc3R5bGVzKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhzdHlsZXMpLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBrZXkpIHtcbiAgICB2YXIgdmFsdWUgPSBzdHlsZXNba2V5XTtcbiAgICBrZXkgPSBzaG9ydHNba2V5XSB8fCBrZXk7XG5cbiAgICBpZiAoIXZhbHVlICYmIHZhbHVlICE9PSAwICYmIHZhbHVlICE9PSAnJylcbiAgICAgIHsgcmV0dXJuIGFjYyB9XG5cbiAgICBpZiAoa2V5ID09PSAnY29udGVudCcgJiYgdmFsdWUuY2hhckF0KDApICE9PSAnXCInKVxuICAgICAgeyBhY2Nba2V5XSA9ICdcIicgKyB2YWx1ZSArICdcIic7IH1cbiAgICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKVxuICAgICAgeyBhY2Nba2V5XSA9IHNhbml0aXplKHZhbHVlKTsgfVxuICAgIGVsc2VcbiAgICAgIHsgYWRkKGFjYywga2V5LCB2YWx1ZSk7IH1cblxuICAgIHJldHVybiBhY2NcbiAgfSwge30pXG59XG5cbmV4cG9ydCBkZWZhdWx0IGJzcztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWJzcy5lc20uanMubWFwXG4iLCIvLyBtb2RlbHMvRW50cnkuanNcblxudmFyIEVudHJ5ID0ge31cblxudmFyIHN0b3JlID0gW11cbnZhciBpZENvdW50ZXIgPSAxXG5cbkVudHJ5LmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gc3RvcmVcbn1cblxuRW50cnkuY3JlYXRlID0gZnVuY3Rpb24gKGF0dHJzKSB7XG4gICAgYXR0cnMuaWQgPSAoaWRDb3VudGVyICs9IDEpXG4gICAgc3RvcmUucHVzaChhdHRycylcbiAgICByZXR1cm4gYXR0cnNcbn1cblxuRW50cnkudm0gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZW50ZXJlZEF0OiBudWxsLFxuICAgICAgICB2b2x1bnRlZXJzOiBbIEVudHJ5LnZvbHVudGVlclZNKCkgXVxuICAgIH1cbn1cblxuRW50cnkudm9sdW50ZWVyVk0gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogJ1tZb3VyIG5hbWVdJyxcbiAgICAgICAgZW1haWw6ICdbWW91ciBlbWFpbF0nXG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBFbnRyeSIsIi8vIHNyYy9jb21wb25lbnRzL0VudHJ5TGlzdC5qc1xuaW1wb3J0IEVudHJ5IGZyb20gXCIuLi8uLi9tb2RlbHMvRW50cnlcIlxuXG4vLyBTZWVkIHNvbWUgZGF0YVxuRW50cnkuY3JlYXRlKHtcbiAgICBcImVudGVyZWRBdFwiOiAxNDQzMDE4NzU4MTk5LFxuICAgIFwidm9sdW50ZWVyc1wiOiBbXG4gICAgICAgIHsgbmFtZTogXCJBbGljZVwiLCBlbWFpbDogXCJhbGljZUBleGFtcGxlLmNvbVwiIH0sXG4gICAgICAgIHsgbmFtZTogXCJCb2JcIiwgZW1haWw6IFwiYm9iQGV4YW1wbGUuY29tXCIgfVxuICAgIF1cbn0pXG5FbnRyeS5jcmVhdGUoe1xuICAgIFwiZW50ZXJlZEF0XCI6IDE0NDMwMTkwNDcyMjcsXG4gICAgXCJ2b2x1bnRlZXJzXCI6IFtcbiAgICAgICAgeyBuYW1lOiBcIkNhcmxcIiwgZW1haWw6IFwiY2FybEBleGFtcGxlLmNvbVwiIH0sXG4gICAgICAgIHsgbmFtZTogXCJEYW5cIiwgZW1haWw6IFwiZGFuQGV4YW1wbGUuY29tXCIgfSxcbiAgICAgICAgeyBuYW1lOiBcIkVybFwiLCBlbWFpbDogXCJlcmxAZXhhbXBsZS5jb21cIiB9LFxuICAgIF1cbn0pXG5cbmNvbnN0IEVudHJ5TGlzdCA9IHsgIFxuICAgIHZpZXcoKSB7XG4gICAgICAgIHJldHVybiBtKCcuZW50cnktbGlzdCcsIFtcbiAgICAgICAgICAgIG0oJ2gxJywgXCJBbGwgRW50cmllc1wiKSxcbiAgICAgICAgICAgIEVudHJ5LmFsbCgpLm1hcCggZW50cnlWaWV3IClcbiAgICAgICAgXSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGVudHJ5VmlldyAoZW50cnkpIHsgIFxuICAgIHZhciBkYXRlID0gbmV3IERhdGUoZW50cnkuZW50ZXJlZEF0KVxuICAgIFxuICAgIHJldHVybiBtKCcuZW50cnknLCBbXG4gICAgICAgIG0oJ2xhYmVsJywgXCJFbnRlcmVkIGF0OiBcIiwgZGF0ZS50b1N0cmluZygpKSxcbiAgICAgICAgbSgndWwnLCBlbnRyeS52b2x1bnRlZXJzLm1hcCggdm9sdW50ZWVyVmlldyApKVxuICAgIF0pXG59XG5cbmZ1bmN0aW9uIHZvbHVudGVlclZpZXcgKHZvbHVudGVlcikgeyAgXG4gICAgcmV0dXJuIG0oJ2xpLnZvbHVudGVlcicsIFtcbiAgICAgICAgbSgnbGFiZWwnLCB2b2x1bnRlZXIubmFtZSksXG4gICAgICAgIG0oJ2xhYmVsJywgXCIoXCIgKyB2b2x1bnRlZXIuZW1haWwgKyBcIilcIilcbiAgICBdKVxufVxuXG5leHBvcnQgZGVmYXVsdCBFbnRyeUxpc3QiLCIvLyBtb2RlbHMvTmF2aWdhdGlvbi5qc1xuXG52YXIgTmF2aWdhdGlvbiA9IHt9XG5cbnZhciBzdG9yZSA9IFtdXG52YXIgaWRDb3VudGVyID0gMVxuXG5OYXZpZ2F0aW9uLmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gc3RvcmVcbn1cblxuTmF2aWdhdGlvbi5jcmVhdGUgPSBmdW5jdGlvbiAoYXR0cnMpIHtcbiAgICBhdHRycy5pZCA9IChpZENvdW50ZXIgKz0gMSlcbiAgICBzdG9yZS5wdXNoKGF0dHJzKVxuICAgIHJldHVybiBhdHRyc1xufVxuXG5OYXZpZ2F0aW9uLnZtID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIC8vIGVudGVyZWRBdDogbnVsbCxcbiAgICAgICAgYnV0dG9uczogWyBOYXZpZ2F0aW9uLmJ1dHRvblZNKCkgXVxuICAgIH1cbn1cblxuTmF2aWdhdGlvbi5idXR0b25WTSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiAnW0J1dHRvbiBuYW1lXScsXG4gICAgICAgIGxpbms6ICdbQnV0dG9uIGxpbmtdJ1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTmF2aWdhdGlvbiIsIi8vIHNyYy9jb21wb25lbnRzL0ZpdmVDaGlsZHJlbkNvbXAuanNcbmltcG9ydCBOYXZpZ2F0aW9uIGZyb20gXCIuLi8uLi9tb2RlbHMvTWVudUxpc3RcIlxuaW1wb3J0IGIgZnJvbSAnYnNzJ1xuXG4vLyBTZWVkIHNvbWUgZGF0YVxuTmF2aWdhdGlvbi5jcmVhdGUoe1xuICAgIC8vIFwiZW50ZXJlZEF0XCI6IDE0NDMwMTg3NTgxOTksXG4gICAgXCJidXR0b25zXCI6IFtcbiAgICAgICAgeyBuYW1lOiBcIk8gcHJvamVrdHVcIiwgbGluazogXCIvIyEvYWJvdXRcIiB9LFxuICAgICAgICB7IG5hbWU6IFwiS2FrbyB1a3JlcGF0aVwiLCBsaW5rOiBcIi8jIS9oZWxwXCJ9LFxuICAgICAgICB7IG5hbWU6IFwiSXpvYnJhxb5ldmFqZVwiLCBsaW5rOiBcIi8jIS9sZWFyblwiIH0sXG4gICAgICAgIHsgbmFtZTogXCJHcmFkaXZhXCIsIGxpbms6IFwiLyMhL3JlYWRcIiB9LFxuICAgICAgICB7IG5hbWU6IFwiR3JhZGl2YVwiLCBsaW5rOiBcIi8jIS9yZWFkXCIgfVxuICAgIF1cbn0pXG4vLyBOYXZpZ2F0aW9uLmNyZWF0ZSh7XG4vLyAgICAgXCJlbnRlcmVkQXRcIjogMTQ0MzAxOTA0NzIyNyxcbi8vICAgICBcImJ1dHRvbnNcIjogW1xuLy8gICAgICAgICB7IG5hbWU6IFwiQ2FybFwiLCBlbWFpbDogXCJjYXJsQGV4YW1wbGUuY29tXCIgfSxcbi8vICAgICAgICAgeyBuYW1lOiBcIkRhblwiLCBlbWFpbDogXCJkYW5AZXhhbXBsZS5jb21cIiB9LFxuLy8gICAgICAgICB7IG5hbWU6IFwiRXJsXCIsIGVtYWlsOiBcImVybEBleGFtcGxlLmNvbVwiIH0sXG4vLyAgICAgXVxuLy8gfSlcblxudmFyIEtpZFNWRyA9IHtcblx0dmlldzogZnVuY3Rpb24odm5vZGUpIHtcblx0XHRyZXR1cm4gbShcInN2Z1tjbGlwLXJ1bGU9J2V2ZW5vZGQnXVtmaWxsLXJ1bGU9J2V2ZW5vZGQnXVtzdHJva2UtbGluZWpvaW49J3JvdW5kJ11bc3Ryb2tlLW1pdGVybGltaXQ9JzEuNDE0J11bdmlld0JveD0nMCAwIDIwMCAzMDAnXVt4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnXVwiK2IuZmlsbChcIndoaXRlXCIpLncoXCIxMDAlXCIpLnRyYW5zaXRpb24oXCJhbGwgMC41cyBlYXNlLWluXCIpLmgoXCIxMDAlXCIpLiRob3ZlcihiLmZpbGwoXCIjOGYyNDI2XCIpKSwgXG5cdFx0XHRtKFwicGF0aFtkPSdNNjQuNzc1IDMwMEgyMi42MjZsNDcuODAxLTEzMC44NDgtNC44ODYtNTUuMjVMMCAxNzUuNDd2LTQxLjFsNjUuNTQxLTU5LjMwM2gxMi40MzhjLTEyLjYxNy02LjgzMi0yMS4xNjQtMTkuOTY1LTIxLjE2NC0zNS4wMzFDNTYuODE1IDE3LjkzOSA3NS4yMDMgMCA5Ny44NSAwYy41NTcgMCAxLjEyNC4wMTEgMS42ODEuMDMzaC4wMDFBNDIuOTMzIDQyLjkzMyAwIDAgMSAxMDEuMjE0IDBjMjIuNjQ3IDAgNDEuMDM1IDE3LjkzOSA0MS4wMzUgNDAuMDM2IDAgMTUuMDY2LTguNTQ4IDI4LjE5OS0yMS4xNjQgMzUuMDMxaDEyLjQzN0wyMDAgMTM0LjM3djQxLjFsLTY2LjQ3OC02MS41NjgtNC44ODUgNTUuMjVMMTc2LjQzOCAzMDBoLTQyLjE0OWwtMzQuNzU3LTc1LjkyNnYuMDAxbC0uMDAxLS4wMDFMNjQuNzc1IDMwMHonXVwiKVxuXHQgIClcblx0fVxufVxuXG52YXIgS2lkU2hhZG93U1ZHID0ge1xuXHR2aWV3OiBmdW5jdGlvbih2bm9kZSkge1xuXHRcdHJldHVybiBtKFwic3ZnW2NsaXAtcnVsZT0nZXZlbm9kZCddW2ZpbGwtcnVsZT0nZXZlbm9kZCddW3N0cm9rZS1saW5lam9pbj0ncm91bmQnXVtzdHJva2UtbWl0ZXJsaW1pdD0nMS40MTQnXVt2aWV3Qm94PScwIDAgMjAwIDMwMCddW3htbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyddXCIrYi5maWxsKFwid2hpdGVcIikudyhcIjEwMCVcIikudHJhbnNpdGlvbihcImFsbCAwLjVzIGVhc2UtaW5cIikuaChcIjEwMCVcIikuJGhvdmVyKGIuZmlsbChcIiM4ZjI0MjZcIikpLCBcblx0XHRcdG0oXCJwYXRoW2Q9J002NC43NzUgMzAwSDIyLjYyNmw0Ny44MDEtMTMwLjg0OC00Ljg4Ni01NS4yNUwwIDE3NS40N3YtNDEuMWw2NS41NDEtNTkuMzAzaDEyLjQzOGMtMTIuNjE3LTYuODMyLTIxLjE2NC0xOS45NjUtMjEuMTY0LTM1LjAzMUM1Ni44MTUgMTcuOTM5IDc1LjIwMyAwIDk3Ljg1IDBjLjU1NyAwIDEuMTI0LjAxMSAxLjY4MS4wMzNoLjAwMUE0Mi45MzMgNDIuOTMzIDAgMCAxIDEwMS4yMTQgMGMyMi42NDcgMCA0MS4wMzUgMTcuOTM5IDQxLjAzNSA0MC4wMzYgMCAxNS4wNjYtOC41NDggMjguMTk5LTIxLjE2NCAzNS4wMzFoMTIuNDM3TDIwMCAxMzQuMzd2NDEuMWwtNjYuNDc4LTYxLjU2OC00Ljg4NSA1NS4yNUwxNzYuNDM4IDMwMGgtNDIuMTQ5bC0zNC43NTctNzUuOTI2di4wMDFsLS4wMDEtLjAwMUw2NC43NzUgMzAweiddXCIpXG5cdCAgKVxuXHR9XG59XG5cbi8vIHZhciBLaWRTVkcgPSB7XG4vLyBcdHZpZXc6IGZ1bmN0aW9uKHZub2RlKSB7XG4vLyAgICAgICAgIHJldHVybiBtKFwic3ZnW2NsaXAtcnVsZT0nZXZlbm9kZCddW2ZpbGwtcnVsZT0nZXZlbm9kZCddW3N0cm9rZS1saW5lam9pbj0ncm91bmQnXVtzdHJva2UtbWl0ZXJsaW1pdD0nMS40MTQnXVt2aWV3Qm94PScwIDAgMTAwMCAzMDAnXVt4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnXVwiLFxuLy8gICAgICAgICAgICAgW1xuLy8gICAgICAgICAgICAgbShcInBhdGhbZD0nTTg2NC4xOTkgMzAwaC00Mi4xMjFsNDcuNzY5LTEzMC44NDgtNC44ODItNTUuMjUtNjUuNDk4IDYxLjU2OHYtNDEuMWw2NS40OTgtNTkuMzAzaDEyLjQyOWMtMTIuNjA4LTYuODMyLTIxLjE1LTE5Ljk2NS0yMS4xNS0zNS4wMzFDODU2LjI0NCAxNy45MzkgODc0LjYyIDAgODk3LjI1MiAwYy41NTYgMCAxLjEyMy4wMTEgMS42OC4wMzNoLjAwMUE0Mi44NDMgNDIuODQzIDAgMCAxIDkwMC42MTQgMGMyMi42MzEgMCA0MS4wMDcgMTcuOTM5IDQxLjAwNyA0MC4wMzYgMCAxNS4wNjYtOC41NDIgMjguMTk5LTIxLjE1IDM1LjAzMUg5MzIuOWw2Ni40MzQgNTkuMzAzdjQxLjFMOTMyLjkgMTEzLjkwMmwtNC44ODIgNTUuMjVMOTc1Ljc4NyAzMDBoLTQyLjEyMWwtMzQuNzMzLTc1LjkyNnYuMDAxbC0uMDAxLS4wMDFMODY0LjE5OSAzMDB6TTY2NC4zMzIgMzAwaC00Mi4xMjFsNDcuNzY5LTEzMC44NDgtNC44ODItNTUuMjVMNTk5LjYgMTc1LjQ3di00MS4xbDY1LjQ5OC01OS4zMDNoMTIuNDI5Yy0xMi42MDgtNi44MzItMjEuMTUtMTkuOTY1LTIxLjE1LTM1LjAzMUM2NTYuMzc3IDE3LjkzOSA2NzQuNzUzIDAgNjk3LjM4NSAwYy41NTcgMCAxLjEyMy4wMTEgMS42OC4wMzNoLjAwMUE0Mi44NDMgNDIuODQzIDAgMCAxIDcwMC43NDcgMGMyMi42MzEgMCA0MS4wMDcgMTcuOTM5IDQxLjAwNyA0MC4wMzYgMCAxNS4wNjYtOC41NDEgMjguMTk5LTIxLjE1IDM1LjAzMWgxMi40M2w2Ni40MzMgNTkuMzAzdjQxLjFsLTY2LjQzMy02MS41NjgtNC44ODMgNTUuMjVMNzc1LjkyMSAzMDBoLTQyLjEyMmwtMzQuNzMzLTc1LjkyNnYuMDAxbC0uMDAxLS4wMDFMNjY0LjMzMiAzMDB6TTQ2NC40NjUgMzAwaC00Mi4xMjFsNDcuNzY5LTEzMC44NDgtNC44ODItNTUuMjUtNjUuNDk3IDYxLjU2OHYtNDEuMWw2NS40OTctNTkuMzAzaDEyLjQzYy0xMi42MDktNi44MzItMjEuMTUtMTkuOTY1LTIxLjE1LTM1LjAzMUM0NTYuNTExIDE3LjkzOSA0NzQuODg2IDAgNDk3LjUxOCAwYy41NTcgMCAxLjEyNC4wMTEgMS42ODEuMDMzaC4wMDFBNDIuNzU0IDQyLjc1NCAwIDAgMSA1MDAuODggMGMyMi42MzIgMCA0MS4wMDcgMTcuOTM5IDQxLjAwNyA0MC4wMzYgMCAxNS4wNjYtOC41NDEgMjguMTk5LTIxLjE1IDM1LjAzMWgxMi40M0w1OTkuNiAxMzQuMzd2NDEuMWwtNjYuNDMzLTYxLjU2OC00Ljg4MiA1NS4yNUw1NzYuMDU0IDMwMGgtNDIuMTIxTDQ5OS4yIDIyNC4wNzRsLS4wMDEuMDAxdi0uMDAxTDQ2NC40NjUgMzAweiddW2ZpbGw9JyNmZmYnXVwiKSxcbi8vICAgICAgICAgICAgIG0oXCJwYXRoW2Q9J00yNjQuNTk5IDMwMGgtNDIuMTIxbDQ3Ljc2OS0xMzAuODQ4LTQuODgzLTU1LjI1LTY1LjQ5NyA2MS41Njh2LTQxLjFsNjUuNDk3LTU5LjMwM2gxMi40M2MtMTIuNjA5LTYuODMyLTIxLjE1LTE5Ljk2NS0yMS4xNS0zNS4wMzFDMjU2LjY0NCAxNy45MzkgMjc1LjAyIDAgMjk3LjY1MSAwYy41NTcgMCAxLjEyNC4wMTEgMS42ODEuMDMzaC4wMDFhNDIuNzkzIDQyLjc5MyAwIDAgMSAxLjY4LS4wMzNjMjIuNjMyIDAgNDEuMDA4IDE3LjkzOSA0MS4wMDggNDAuMDM2IDAgMTUuMDY2LTguNTQyIDI4LjE5OS0yMS4xNSAzNS4wMzFIMzMzLjNsNjYuNDM0IDU5LjMwM3Y0MS4xTDMzMy4zIDExMy45MDJsLTQuODgyIDU1LjI1TDM3Ni4xODcgMzAwaC00Mi4xMjFsLTM0LjczMy03NS45MjYtLjAwMS4wMDF2LS4wMDFMMjY0LjU5OSAzMDB6J11bZmlsbD0nI2ZmZiddXCIpLFxuLy8gICAgICAgICAgICAgbShcInBhdGhbZD0nTTY0LjczMiAzMDBIMjIuNjExTDcwLjM4IDE2OS4xNTJsLTQuODgyLTU1LjI1TDAgMTc1LjQ3di00MS4xbDY1LjQ5OC01OS4zMDNoMTIuNDI5Yy0xMi42MDgtNi44MzItMjEuMTUtMTkuOTY1LTIxLjE1LTM1LjAzMUM1Ni43NzcgMTcuOTM5IDc1LjE1MyAwIDk3Ljc4NSAwYy41NTYgMCAxLjEyMy4wMTEgMS42OC4wMzNoLjAwMWE0Mi44MyA0Mi44MyAwIDAgMSAxLjY4LS4wMzNjMjIuNjMyIDAgNDEuMDA4IDE3LjkzOSA0MS4wMDggNDAuMDM2IDAgMTUuMDY2LTguNTQyIDI4LjE5OS0yMS4xNSAzNS4wMzFoMTIuNDI5bDY2LjQzNCA1OS4zMDN2NDEuMWwtNjYuNDM0LTYxLjU2OC00Ljg4MiA1NS4yNUwxNzYuMzIgMzAwaC00Mi4xMjFsLTM0LjczMy03NS45MjZ2LjAwMWwtLjAwMS0uMDAxTDY0LjczMiAzMDB6J11bZmlsbD0nI2ZmZiddXCIpXG4vLyAgICAgICAgICAgICBdXG4vLyAgICAgICAgIClcbi8vICAgICB9XG4vLyB9XG5cbmNvbnN0IE5hdmlnYXRpb25NZW51ID0geyAgXG4gICAgdmlldygpIHtcbiAgICAgICAgcmV0dXJuIG0oJy50ZXN0JywgW1xuICAgICAgICAgICAgTmF2aWdhdGlvbi5hbGwoKS5tYXAoIE5hdmlnYXRpb25WaWV3IClcbiAgICAgICAgXSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIE5hdmlnYXRpb25WaWV3IChOYXZpZ2F0aW9uKSB7ICBcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKE5hdmlnYXRpb24uZW50ZXJlZEF0KVxuICAgIFxuICAgIHJldHVybiBtKCcudGVzdDInLCBbXG4gICAgICAgIC8vIG0oJ2xhYmVsJywgXCJFbnRlcmVkIGF0OiBcIiwgZGF0ZS50b1N0cmluZygpKSxcbiAgICAgICAgbSgndWwnK2IuZGlzcGxheShcImZsZXhcIikuamMoXCJzcGFjZS1hcm91bmRcIilcbiAgICAgICAgICAgIC5saXN0U3R5bGUoXCJub25lXCIpXG4gICAgICAgICAgICAsIE5hdmlnYXRpb24uYnV0dG9ucy5tYXAoIG5hdmlnYXRpb25WaWV3ICkpXG4gICAgXSlcbn1cblxuZnVuY3Rpb24gbmF2aWdhdGlvblZpZXcgKGJ1dHRvbnMpIHsgIFxuICAgIHJldHVybiBtKCdsaS5idG4nK2IuZmxleCgpLnRleHRBbGlnbignY2VudGVyJykudHQoJ3VwcGVyY2FzZScpLmZzKCcyLjNyZW0nKS5mb250V2VpZ2h0KDkwMCksIFtcbiAgICAgICAgbShLaWRTVkcpLFxuICAgICAgICAvLyBtKCdhW2hyZWY9JyArIGJ1dHRvbnMubGluayArICddJytiLncoXCIxMDAlXCIpLnBvc2l0aW9uKCdhYnNvbHV0ZScpLnpJbmRleCgnMScpLmxlZnQoJzAnKS5ib3R0b20oJy00MHB4JykudGV4dERlY29yYXRpb24oJ25vbmUnKS5jb2xvcihcIiMxMTFcIiksIGJ1dHRvbnMubmFtZSksXG4gICAgICAgIC8vIG0oJ2xhYmVsJywgXCIoXCIgKyB2b2x1bnRlZXIuZW1haWwgKyBcIilcIilcbiAgICBdKVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IE5hdmlnYXRpb25NZW51Iiwid2luZG93LlZpZGVvTGlicmFyeSA9IHt9XG5cbnZhciBzdG9yZSA9IFtdXG52YXIgaWRDb3VudGVyID0gMVxuXG5WaWRlb0xpYnJhcnkuYWxsID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gc3RvcmVcbn1cblxuVmlkZW9MaWJyYXJ5LmNyZWF0ZSA9IGZ1bmN0aW9uIChhdHRycykge1xuICBhdHRycy5pZCA9IChpZENvdW50ZXIgKz0gMSlcbiAgc3RvcmUucHVzaChhdHRycylcbiAgcmV0dXJuIGF0dHJzXG59XG5cblZpZGVvTGlicmFyeS52bSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICAvLyBlbnRlcmVkQXQ6IG51bGwsXG4gICAgdmlkZW9zOiBbIFZpZGVvTGlicmFyeS52aWRlb1ZNKCkgXVxuICB9XG59XG5cblZpZGVvTGlicmFyeS52aWRlb1ZNID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIGxhYmVsOiAnW1NvbWUgbGFiZWxdJyxcbiAgICBsaW5rOiAnW1NvbWUgbGlua10nXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVmlkZW9MaWJyYXJ5XG4iLCIvLyBzcmMvY29tcG9uZW50cy9WaWRlb0NvbXAuanNcbmltcG9ydCBWaWRlb0xpYnJhcnkgZnJvbSBcIi4uL21vZGVscy9WaWRlb0xpYnJhcnlcIlxuaW1wb3J0IGIgZnJvbSBcImJzc1wiXG5cbi8vIHNlZWQgc29tZSBkYXRhXG5WaWRlb0xpYnJhcnkuY3JlYXRlKHtcblx0XCJ2aWRlb3NcIjogW1xuXHRcdHsgbGluazogXCJodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC9iYzlpMFRfOVBMNFwiLCBsYWJlbDogXCJTdmV0IEV2cm9wZTogS2lrbyBpbiByb2thLlwiIH0sXG5cdFx0eyBsaW5rOiBcImh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkL2Z4Yl84Sk1XSmtrXCIsIGxhYmVsOiBcIlN2ZXQgRXZyb3BlOiBQb3ZlaiBuZWtvbXUsIGtpIG11IHphdXBhxaEuXCJ9LFxuXHRcdHsgbGluazogXCJodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC9KMTlsUkxiLXd3WVwiLCBsYWJlbDogXCJNaXRpIG8gc3BvbG5pIHpsb3JhYmksIHYga2F0ZXJlIHZlcmphbWVtbywgMS5cIiB9LFxuXHRcdHsgbGluazogXCJodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC9UMnBTa0ozN0tQWVwiLCBsYWJlbDogXCJNaXRpIG8gc3BvbG5pIHpsb3JhYmksIHYga2F0ZXJlIHZlcmphbWVtbywgMi5cIiB9LFxuXHRcdHsgbGluazogXCJodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC9DV2ZKVVNITnN2VVwiLCBsYWJlbDogXCJPdHJva2Ega3JlcGkgaW5mb3JtYWNpamFcIn0sXG5cdFx0eyBsaW5rOiBcImh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkL0UtNVNUbE9rSExvXCIsIGxhYmVsOiBcIlNwbGV0bm8gb2tvOlBvc25ldGtpIHNwb2xuaWggemxvcmFiIG90cm9rIC0gemEgdmVkbm8gcHJpa2F6YW5hIHNwb2xuYSB6bG9yYWJhXCJ9LFxuXHRcdHsgbGluazogXCJodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC9nQlVYQmphOThLVVwiLCBsYWJlbDogXCJOZcW+YSBNaWtsacSNOiBrYW1wYW5qYSBcXFwiUmVjaSBuZSBuYXNpbGp1XFxcIlwifSxcblx0XHR7IGxpbms6IFwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvTTlHbzItRHh4eDBcIiwgbGFiZWw6IFwiSW5mb2Ryb206IFNwbGV0bmUgemxvcmFiZVwifSxcblx0XHR7IGxpbms6IFwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvOW5mYVFiUllTTmdcIiwgbGFiZWw6IFwiUm9ib3ZhIGluIFN1ZWluYSB6Z29kYmE6IFBvc25ldGtpIHNwb2xuZSB6bG9yYWJlIHNvIHBvIDE1IGxldGloIMWhZSB2ZWRubyBuYSBzcGxldHUuXCJ9LFxuXHRcdHsgbGluazogXCJodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC9pQTRYZzk1U2R5RVwiLCBsYWJlbDogXCJOb3ZvIGplLCBkYSBzZW0gYmlsYSB6bG9yYWJsamVuYSAtIEluY2VzdCBUcmF1bWEgQ2VudGFyLCBCZW9ncmFkXCJ9LFxuXHRcdHsgbGluazogXCJodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC9mSWdVLWNwZ2hfNFwiLCBsYWJlbDogXCJJbmNlc3QgVHJhdW1hIENlbnRhciAtIEJlb2dyYWQsIEhhamRlIGRhIHByacSNYW1vIG8gc2Vrc3VhbG5vbSBuYXNpbGp1XCJ9LFxuXHRcdHsgbGluazogXCJodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8wSTJnVmRCbUEtc1wiLCBsYWJlbDogXCJDb21taXR0ZWUgZm9yIENoaWxkcmVuOiBIb3cgdG8gVGFsayB3aXRoIEtpZHMgQWJvdXQgU2V4dWFsIEFidXNlLlwifSxcblx0XHR7IGxpbms6IFwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvU0JNdmV2ZDlCclVcIiwgbGFiZWw6IFwiRUNQQVQ6IFN0b3Agc2V4dWFsIGV4cGxvaXRhdGlvbiBvZiBhIGNoaWxkLlwiIH0sXG5cdFx0Ly8geyBsaW5rOiBcIlwiLCBsYWJlbDogXCJcIn0sXG5cdF1cbn0pXG5cbi8vIGNvbXBvbmVudHNcbnZhciBWaWRlbyA9IHtcblx0dmlldygpIHtcblx0XHRyZXR1cm4gbSgnLnZpZGVvLWxpYnJhcnknLCBbXG5cdFx0XHRWaWRlb0xpYnJhcnkuYWxsKCkubWFwKCB2aWRlb0xpYnJhcnlWaWV3IClcblx0XHRdKVxuXHR9XG59XG5cbmZ1bmN0aW9uIHZpZGVvTGlicmFyeVZpZXcgKHZpZGVvKSB7XG5cdHJldHVybiBtKCdzZWN0aW9uLnZpZGVvJyxbXG5cdFx0Ly8gbSgnaDEudGl0bGUuaXMtMicsICdWaWRlbyB2c2ViaW5hIDxzZWN0aW9uPicpLFxuXHRcdG0oJy52aWRlby1ncmlkJyBcblx0XHRcdCsgYi5vdmVyZmxvdygnaGlkZGVuJylcblx0XHRcdC5kaXNwbGF5KCdncmlkJykuZ3JpZFRlbXBsYXRlQ29sdW1ucygnMWZyJykuZ3JpZFRlbXBsYXRlUm93cygnYXV0bycpXG5cdFx0XHQuJG1lZGlhKCcobWluLXdpZHRoOjgwMXB4KScsIGIuZ3JpZFRlbXBsYXRlQ29sdW1ucygnMWZyIDFmciAxZnInKS5ncmlkVGVtcGxhdGVSb3dzKCdhdXRvJykuZ3JpZEdhcCgnMWVtJykpXG5cdFx0XHQsdmlkZW8udmlkZW9zLm1hcCggdmlkZW9WaWV3IClcblx0XHQpLFxuXHRdKVxufVxuXG5mdW5jdGlvbiB2aWRlb1ZpZXcgKGVudHJ5KSB7XG5cdHJldHVybiBtKCcudmlkZW8taXRlbS52aWRlby13cmFwJyArIGIucG9zaXRpb24oJ3JlbGF0aXZlJykudygnMTAwJScpLmgoMCkucGFkZGluZ0JvdHRvbSgnNTYuMjcxOTglJyksIFtcblx0XHRtKCdpZnJhbWUnICsgYi5wb3NpdGlvbignYWJzb2x1dGUnKS50b3AoMCkubGVmdCgwKS53KCcxMDAlJykuaCgnMTAwJScpLCBcblx0XHR7IFxuXHRcdFx0XCJzcmNcIjplbnRyeS5saW5rLFxuXHRcdFx0XCJmcmFtZWJvcmRlclwiOlwiMFwiLFxuXHRcdFx0XCJhbGxvd1wiOlwiYWNjZWxlcm9tZXRlcjsgYXV0b3BsYXk7IGVuY3J5cHRlZC1tZWRpYTsgZ3lyb3Njb3BlOyBwaWN0dXJlLWluLXBpY3R1cmVcIixcblx0XHRcdFwiYWxsb3dmdWxsc2NyZWVuXCI6XCJhbGxvd2Z1bGxzY3JlZW5cIiBcblx0XHR9KSxcblx0XHRtKFwicFwiLCBlbnRyeS5sYWJlbClcblx0XSlcbn1cblxuLy8gZnVuY3Rpb24gdmlkZW9WaWV3IChlbnRyeSkge1xuLy8gXHRyZXR1cm4gbSgnZGl2LmVudHJ5JywgW1xuLy8gXHRcdG0oJy55dCcsIGVudHJ5LmxpbmspLFxuLy8gXHRcdG0oJ2xhYmVsJywgZW50cnkubmFtZSlcdFxuLy8gXHRdKVxuLy8gfVxuXG5leHBvcnQgZGVmYXVsdCBWaWRlbyIsInZhciBBYm91dCA9IHt9XG5cbnZhciBzdG9yZSA9IFtdXG52YXIgaWRDb3VudGVyID0gMVxuXG5BYm91dC5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBzdG9yZVxufVxuXG5BYm91dC5jcmVhdGUgPSBmdW5jdGlvbiAoYXR0cnMpIHtcbiAgYXR0cnMuaWQgPSAoaWRDb3VudGVyICs9IDEpXG4gIHN0b3JlLnB1c2goYXR0cnMpXG4gIHJldHVybiBhdHRyc1xufVxuXG5BYm91dC52bSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICAvLyBlbnRlcmVkQXQ6IG51bGwsXG4gICAgZWxlbWVudHM6IFsgQWJvdXQuZWxlbWVudFZNKCkgXVxuICB9XG59XG5cbkFib3V0LmVsZW1lbnRWTSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICBsYWJlbDogJ1tTb21lIGxhYmVsXScsXG4gICAgbGluazogJ1tTb21lIGxpbmtdJ1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEFib3V0XG4iLCIvLyBzcmMvY29tcG9uZW50cy9FbnRyeUxpc3QuanNcbmltcG9ydCBBYm91dCBmcm9tIFwiLi4vbW9kZWxzL0Fib3V0XCJcblxuLy8gc2VlZCBzb21lIGRhdGFcbkFib3V0LmNyZWF0ZSh7XG5cdFwiZWxlbWVudHNcIjogW1xuXHRcdHsgbGluazogXCJodHRwczovL3d3dy5ldmVudGltLnNpL3NpXCIsIGxhYmVsOiBcImV2ZW50aW0uc2lcIn0sXG5cdFx0eyBsaW5rOiBcIlwiLCBsYWJlbDogXCJEZWxvIFJldmlqZVwifSxcblx0XHR7IGxpbms6IFwiaHR0cHM6Ly9yYWRpb3N0dWRlbnQuc2kvXCIsIGxhYmVsOiBcIlJhZGlvIMWgdHVkZW50XCJ9LFxuXHRcdHsgbGluazogXCJodHRwOi8vbWVkaWFidXMuc2lcIiwgbGFiZWw6IFwiTWVkaWEgQnVzXCJ9LFxuXHRcdHsgbGluazogXCJodHRwOi8vdGFtLXRhbS5zaVwiLCBsYWJlbDogXCJUQU0tVEFNXCJ9LFxuXHRcdHsgbGluazogXCJodHRwczovL3d3dy5ldXJvcGxha2F0LnNpXCIsIGxhYmVsOiBcIkV1cm9wbGFrYXRcIn0sXG5cdFx0Ly8geyBsaW5rOiBcIlwiLCBsYWJlbDogXCJcIn1cblx0XVxufSlcblxuXG4vLyBjb21wb25lbnRzXG52YXIgQWJvdXRDb21wID0ge1xuXHR2aWV3KCkge1xuXHRcdHJldHVybiBtKCcuYWJvdXQnLCBbXG5cdFx0XHRBYm91dC5hbGwoKS5tYXAoIEFib3V0VmlldyApXG5cdFx0XSlcblx0fVxufVxuXG5mdW5jdGlvbiBBYm91dFZpZXcgKGRhdGEpIHtcblx0cmV0dXJuIG0oJ3NlY3Rpb24nLFtcblx0XHRtKCdoMS50aXRsZS5pcy0yJywgJ01lZGlqc2thIHBvZHBvcmEgPHNlY3Rpb24+JyksXG5cdFx0bSgndWwnLCBkYXRhLmVsZW1lbnRzLm1hcCggc2VjdGlvblZpZXcgKSlcblx0XSlcbn1cblxuZnVuY3Rpb24gc2VjdGlvblZpZXcgKGVsKSB7XG5cdHJldHVybiBtKCdsaS5lbCcsIFtcblx0XHRtKCdhJywge1wiaHJlZlwiOiBlbC5saW5rfSwgZWwubGFiZWwpLFxuXHRdKVxufVxuXG5mdW5jdGlvbiBzZWN0aW9uVGlsZSAoKSB7XG5cdHJldHVybiBtKClcbn1cblxuZXhwb3J0IGRlZmF1bHQgQWJvdXRDb21wIiwiaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuXG4vKipcblRoaXMgT3ZlcmxheSBjb21wb25lbnQgcHJvdmlkZXMgYSBmdWxsLXNjcmVlbiBjb3ZlciBlbGVtZW50LlxuSXQgaXMgbW91bnRlZCB0byBhIHNlcGFyYXRlIFYvRE9NIHRyZWUgYXBwZW5kZWQgdG8gdGhlIGJvZHkuXG5DaGlsZHJlbiBzdXBwbGllZCB0byBPdmVybGF5IGFyZSByZW5kZXJlZCBpbnRvIHRoaXMgdHJlZS5cblRoZSBPdmVybGF5IGNvbXBvbmVudCBjYW4gYmUgbmVzdGVkIGFueXdoZXJlIHdpdGhpbiB5b3VyIGFwcCdzXG52aWV3IGJ1dCB3aWxsIGJlIHJlbmRlcmVkIHRvIGRpc3BsYXkgb3ZlcnRvcCBldmVyeXRoaW5nIGVsc2UuXG4qL1xuXG5jb25zdCBPdmVybGF5ID0gZnVuY3Rpb24oKSB7XG5cdGxldCBkb21cblx0bGV0IGNoaWxkcmVuXG5cblx0Y29uc3QgT3ZlcmxheUNvbnRhaW5lciA9IHtcblx0XHR2aWV3OiAoKSA9PiBjaGlsZHJlblxuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRvbmNyZWF0ZSh2KSB7XG5cdFx0XHRjaGlsZHJlbiA9IHYuY2hpbGRyZW5cblx0XHRcdC8vIEFwcGVuZCBhIGNvbnRhaW5lciB0byB0aGUgZW5kIG9mIGJvZHlcblx0XHRcdGRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cdFx0XHRkb20uY2xhc3NOYW1lID0gJ292ZXJsYXknXG5cdFx0XHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRvbSlcbiAgICAgIC8vIE1vdW50IGEgc2VwYXJhdGUgVkRPTSB0cmVlIGhlcmVcblx0XHRcdG0ubW91bnQoZG9tLCBPdmVybGF5Q29udGFpbmVyKVxuXHRcdH0sXG5cdFx0b25iZWZvcmV1cGRhdGUodikge1xuXHRcdFx0Y2hpbGRyZW4gPSB2LmNoaWxkcmVuXG5cdFx0fSxcblx0XHRvbmJlZm9yZXJlbW92ZSgpIHtcblx0XHRcdC8vIEFkZCBhIGNsYXNzIHdpdGggZmFkZS1vdXQgZXhpdCBhbmltYXRpb25cblx0XHRcdGRvbS5jbGFzc0xpc3QuYWRkKCdoaWRlJylcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZShyID0+IHtcblx0XHRcdFx0ZG9tLmFkZEV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbmVuZCcsIHIpXG5cdFx0XHR9KVxuXHRcdH0sXG5cdFx0b25yZW1vdmUoKSB7XG5cdFx0XHQvLyBEZXN0cm95IHRoZSBvdmVybGF5IGRvbSB0cmVlLiBVc2luZyBtLm1vdW50IHdpdGhcblx0XHRcdC8vIG51bGwgdHJpZ2dlcnMgYW55IG1vZGFsIGNoaWxkcmVuIHJlbW92YWwgaG9va3MuXG5cdFx0XHRtLm1vdW50KGRvbSwgbnVsbClcblx0XHRcdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZG9tKVxuXHRcdH0sXG5cdFx0dmlldygpIHt9XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgT3ZlcmxheSIsImltcG9ydCBiIGZyb20gXCJic3NcIlxuaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuXG5jb25zdCBMYXp5TG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGxldCBzaG93TW9kYWwgPSBmYWxzZVxuICBcbiAgICByZXR1cm4ge1xuICAgICAgICBvbmluaXQ6ICh2bm9kZSkgPT4ge1xuICAgICAgICAgICAgaW5pdGlhbERhdGEgPSB2bm9kZS5hdHRycy5kYXRhXG4gICAgICAgIH0sXG4gICAgICAgIHZpZXc6ICh2bm9kZSkgPT4gbSgnLnlvdXR1YmUnLCB7XCJkYXRhLWVtYmVkXCI6IFwiQXFjamRrUE1QSkFcIn0sXG4gICAgICAgICAgICBtKCdkaXYucGxheS1idXR0b24nKSxcbiAgICAgICAgKVxuICAgIH1cbiAgfVxuICBcbmV4cG9ydCBkZWZhdWx0IExhenlMb2FkXG5cblxuLy8gbShcImRpdlwiLCB7XCJjbGFzc1wiOlwieW91dHViZVwiLFwiZGF0YS1lbWJlZFwiOlwiQXFjamRrUE1QSkFcIn0sIFxuLy8gbShcImRpdlwiLCB7XCJjbGFzc1wiOlwicGxheS1idXR0b25cIn0pXG4vLyApLFxuXG4vLyBmdW5jdGlvbiBDb21wb25lbnRXaXRoU3RhdGUoKSB7XG4vLyAgICAgdmFyIGluaXRpYWxEYXRhXG4vLyAgICAgcmV0dXJuIHtcbi8vICAgICAgICAgb25pbml0OiBmdW5jdGlvbih2bm9kZSkge1xuLy8gICAgICAgICAgICAgaW5pdGlhbERhdGEgPSB2bm9kZS5hdHRycy5kYXRhXG4vLyAgICAgICAgIH0sXG4vLyAgICAgICAgIHZpZXc6IGZ1bmN0aW9uKHZub2RlKSB7XG4vLyAgICAgICAgICAgICByZXR1cm4gW1xuLy8gICAgICAgICAgICAgICAgIC8vIGRpc3BsYXlzIGRhdGEgZnJvbSBpbml0aWFsaXphdGlvbiB0aW1lOlxuLy8gICAgICAgICAgICAgICAgIG0oXCJkaXZcIiwgXCJJbml0aWFsOiBcIiArIGluaXRpYWxEYXRhKSxcbi8vICAgICAgICAgICAgICAgICAvLyBkaXNwbGF5cyBjdXJyZW50IGRhdGE6XG4vLyAgICAgICAgICAgICAgICAgbShcImRpdlwiLCBcIkN1cnJlbnQ6IFwiICsgdm5vZGUuYXR0cnMuZGF0YSlcbi8vICAgICAgICAgICAgIF1cbi8vICAgICAgICAgfVxuLy8gICAgIH1cbi8vIH0iLCJcbmltcG9ydCBtIGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCBPdmVybGF5IGZyb20gXCIuL092ZXJsYXlcIlxuaW1wb3J0IExhenlMb2FkICBmcm9tIFwiLi9MYXp5TG9hZFwiXG5cbi8qKlxuVGhpcyBNb2RhbCBjb21wb25lbnQgdXNlcyB0aGUgT3ZlcmxheSBjb21wb25lbnQgdG8gcHJvdmlkZSBhXG5mdWxsIHNjcmVlbiBjb3ZlciBhbmQgcmVuZGVycyBhIGRpYWxvZy1saWtlIHdpZGdldCB3aXRoaW4gdGhhdFxud2FpdHMgZm9yIHRoZSB1c2VyIHRvIGNsaWNrIGEgYnV0dG9uLiBBIE1vZGFsIGluc3RhbmNlIGNhblxuYmUgbmVzdGVkIGFueXdoZXJlIHdpdGhpbiB5b3VyIGFwcCdzIHZpZXcgYW5kIHdpbGwgYmUgcmVuZGVyZWRcbm9uIHRvcCBvZiBldmVyeXRoaW5nIGVsc2UuXG5cbkV4cGVjdGVkIGF0dHJzIGFyZSBhcyBmb2xsb3dzOlxuXG5pbnRlcmZhY2UgQXR0cnMge1xuICB0aXRsZTogbS5DaGlsZHJlblxuICBjb250ZW50OiBtLkNoaWxkcmVuXG4gIGJ1dHRvbnM6IHtpZDogc3RyaW5nLCB0ZXh0OiBzdHJpbmd9W11cbiAgb25DbG9zZShpZDogc3RyaW5nKTogdm9pZFxufVxuXG5BdCBsZWFzdCBvbmUgYnV0dG9uIHNob3VsZCBiZSBwcm92aWRlZCBvdGhlcndpc2UgdGhlcmVcbndpbGwgYmUgbm8gd2F5IHRvIGNsb3NlIHRoZSBtb2RhbC5cbiovXG5cbmNvbnN0IE1vZGFsID0gZnVuY3Rpb24odikge1xuICAgIGxldCBjbGlja2VkSWRcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgdmlldyh7YXR0cnM6IHt0aXRsZSwgY29udGVudCwgYnV0dG9ucywgb25DbG9zZX19KSB7XG4gICAgICAgIGlmIChjbGlja2VkSWQgIT0gbnVsbCkge1xuICAgICAgICAgIC8vIFdlIG5lZWQgdG8gYWxsb3cgdGhlIE92ZXJsYXkgY29tcG9uZW50IGV4ZWN1dGUgaXRzXG4gICAgICAgICAgLy8gZXhpdCBhbmltYXRpb24uIEJlY2F1c2UgaXQgaXMgYSBjaGlsZCBvZiB0aGlzIGNvbXBvbmVudCxcbiAgICAgICAgICAvLyBpdCB3aWxsIG5vdCBmaXJlIHdoZW4gdGhpcyBjb21wb25lbnQgaXMgcmVtb3ZlZC5cbiAgICAgICAgICAvLyBJbnN0ZWFkLCB3ZSBuZWVkIHRvIHJlbW92ZSBpdCBmaXJzdCBiZWZvcmUgdGhpcyBjb21wb25lbnRcbiAgICAgICAgICAvLyBnb2VzIGF3YXkuXG4gICAgICAgICAgICAgICAgICAvLyBXaGVuIGEgYnV0dG9uIGlzIGNsaWNrZWQsIHdlIG9taXQgdGhlIE92ZXJsYXkgY29tcG9uZW50XG4gICAgICAgICAgLy8gZnJvbSB0aGlzIE1vZGFsIGNvbXBvbmVudCdzIG5leHQgdmlldyByZW5kZXIsIHdoaWNoIHdpbGxcbiAgICAgICAgICAvLyB0cmlnZ2VyIE92ZXJsYXkncyBvbmJlZm9yZXJlbW92ZSBob29rLlxuICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG0oT3ZlcmxheSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBvbnJlbW92ZSgpIHtcbiAgICAgICAgICAgICAgLy8gV2FpdCBmb3IgdGhlIG92ZXJsYXkncyByZW1vdmFsIGFuaW1hdGlvbiB0byBjb21wbGV0ZS5cbiAgICAgICAgICAgICAgLy8gVGhlbiB3ZSBmaXJlIG91ciBwYXJlbnQncyBjYWxsYmFjaywgd2hpY2ggd2lsbFxuICAgICAgICAgICAgICAvLyBwcmVzdW1hYmx5IHJlbW92ZSB0aGlzIE1vZGFsIGNvbXBvbmVudC5cbiAgICAgICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgb25DbG9zZShjbGlja2VkSWQpXG4gICAgICAgICAgICAgICAgbS5yZWRyYXcoKVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgbSgnLlhtb2RhbCcsXG4gICAgICAgICAgICBtKCdoMycsIHRpdGxlKSxcbiAgICAgICAgICAgIG0oJy5YbW9kYWwtY29udGVudCcsIGNvbnRlbnQpLFxuXG4gICAgICAgICAgICBtKExhenlMb2FkKSxcblxuICAgICAgICAgICAgbSgnLm1vZGFsLWJ1dHRvbnMnLFxuICAgICAgICAgICAgICBidXR0b25zLm1hcChiID0+XG4gICAgICAgICAgICAgICAgbSgnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2J1dHRvbicsXG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkOiBjbGlja2VkSWQgIT0gbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgb25jbGljaygpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjbGlja2VkSWQgPSBiLmlkXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBiLnRleHRcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgICkgICAgICBcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIGV4cG9ydCBkZWZhdWx0IE1vZGFsIiwiaW1wb3J0IGIgZnJvbSBcImJzc1wiXG5pbXBvcnQgbSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgTW9kYWwgZnJvbSBcIi4vTW9kYWxcIlxuXG5jb25zdCBNb2RhbERlbW8gPSBmdW5jdGlvbigpIHtcbiAgICBsZXQgc2hvd01vZGFsID0gZmFsc2VcbiAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHZpZXc6ICgpID0+IG0oJy5hcHAnLFxuICAgICAgICBtKCdoMScsICdNb2RhbCBEZW1vJyksXG4gICAgICAgIG0oJ3AnLCAnQ2xpY2sgYmVsb3cgdG8gb3BlbiBhIG1vZGFsJyksXG4gICAgICAgIG0oJ3AnLFxuICAgICAgICAgIG0oJ2J1dHRvbicsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxuICAgICAgICAgICAgICBvbmNsaWNrKCkge1xuICAgICAgICAgICAgICAgIHNob3dNb2RhbCA9IHRydWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICdPcGVuIE1vZGFsJ1xuICAgICAgICAgICksXG4gICAgICAgICAgLy8gRXZlbiB0aG91Z2ggdGhpcyBtb2RhbCBpcyBuZXN0ZWQgd2l0aGluIG91ciBBcHAgdmRvbSxcbiAgICAgICAgICAvLyBpdCB3aWxsIGFwcGVhciBvbiB0b3Agb2YgZXZlcnl0aGluZyBlbHNlLCBhcHBlbmRlZCBcbiAgICAgICAgICAvLyB0byB0aGUgZW5kIG9mIGRvY3VtZW50IGJvZHkuXG4gICAgICAgICAgc2hvd01vZGFsICYmIG0oTW9kYWwsIHtcbiAgICAgICAgICAgIHRpdGxlOiAnSGVsbG8gTW9kYWwhJyxcbiAgICAgICAgICAgIGNvbnRlbnQ6ICdDbGljayB0aGUgYnV0dG9uIGJlbG93IHRvIGNsb3NlLicsXG4gICAgICAgICAgICBidXR0b25zOiBbe2lkOiAnY2xvc2UnLCB0ZXh0OiAnQ2xvc2UnfV0sXG4gICAgICAgICAgICBvbkNsb3NlKGlkKSB7XG4gICAgICAgICAgICAgIHNob3dNb2RhbCA9IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgIH1cbiAgfVxuICBcbmV4cG9ydCBkZWZhdWx0IE1vZGFsRGVtb1xuICAiLCJ2YXIgSGVscENvbnRhY3QgPSB7fVxuXG52YXIgc3RvcmUgPSBbXVxudmFyIGlkQ291bnRlciA9IDFcblxuSGVscENvbnRhY3QuYWxsID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gc3RvcmVcbn1cblxuSGVscENvbnRhY3QuY3JlYXRlID0gZnVuY3Rpb24gKGF0dHJzKSB7XG4gIGF0dHJzLmlkID0gKGlkQ291bnRlciArPSAxKVxuICBzdG9yZS5wdXNoKGF0dHJzKVxuICByZXR1cm4gYXR0cnNcbn1cblxuSGVscENvbnRhY3Qudm0gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB7XG4gICAgLy8gZW50ZXJlZEF0OiBudWxsLFxuICAgIGVsZW1lbnRzOiBbIEhlbHBDb250YWN0LmVsZW1lbnRWTSgpIF1cbiAgfVxufVxuXG5IZWxwQ29udGFjdC5lbGVtZW50Vk0gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB7XG4gICAgbGFiZWw6ICdbU29tZSBsYWJlbF0nLFxuICAgIGxpbms6ICdbU29tZSBsaW5rXSdcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBIZWxwQ29udGFjdFxuIiwiLy8gc3JjL2NvbXBvbmVudHMvSGVscENvbnRhY3RDb21wLmpzXG5pbXBvcnQgSGVscENvbnRhY3QgZnJvbSBcIi4uL21vZGVscy9IZWxwQ29udGFjdFwiXG5pbXBvcnQgYiBmcm9tIFwiYnNzXCJcblxuLy8gc2VlZCBzb21lIGRhdGFcbkhlbHBDb250YWN0LmNyZWF0ZSh7XG5cdFwiY29udGFjdHNcIjogW1xuXHRcdHsgaWQ6IFwiMVwiLCBsaW5rOiBcImh0dHA6Ly93d3cuZHJ1c3R2by1zb3Muc2lcIiwgbGFiZWw6IFwiU09TIHRlbGVmb24gKDA4MCAxMTU1KVwiIH0sXG5cdFx0eyBpZDogXCIyXCIsIGxpbms6IFwiaHR0cDovL3d3dy5lLXRvbS5zaVwiLCBsYWJlbDogXCJUT00gdGVsZWZvbiAoMTE2IDExMSlcIn0sXG5cdFx0eyBpZDogXCIzXCIsIGxpbms6IFwiaHR0cHM6Ly93d3cuZHJ1c3R2by1kbmsuc2lcIiwgbGFiZWw6IFwiRHJ1xaF0dm8gemEgbmVuYXNpbG5vIGtvbXVuaWthY2lqbyAoMDEgNDM0NDgyMiB2IExqdWJsamFuaSBhbGkgMDUgNjM5MzE3MCBpbiAwMzEgNTQ2MDk4IHYgS29wcnUpXCIgfSxcblx0XHR7IGlkOiBcIjRcIixsaW5rOiBcImh0dHA6Ly93d3cuZHJ1c3R2by16ZW5za2Etc3ZldG92YWxuaWNhLnNpXCIsIGxhYmVsOiBcIsW9ZW5za2Egc3ZldG92YWxuaWNhICgwMzEgMjMzMjExKVwiIH0sXG5cdFx0eyBpZDogXCI1XCIsbGluazogXCJodHRwczovL2ZkaW5zdGl0dXQuc2lcIiwgbGFiZWw6IFwiRnJhbsSNacWha2Fuc2tpIGRydcW+aW5za2kgaW7FoXRpdHV0ICgwMSAyMDA2NzYwIGFsaSAwNDAgODYzOTg2KVwifSxcblx0XHR7IGlkOiBcIjZcIixsaW5rOiBcImh0dHA6Ly93d3cubHVuaW5hdmlsYS5zaVwiLCBsYWJlbDogXCJMdW5pbmEgdmlsYVwifSxcblx0XHR7IGlkOiBcIjdcIixsaW5rOiBcImh0dHA6Ly93d3cuYmVsaW9icm9jLnNpXCIsIGxhYmVsOiBcIkJlbGkgb2Jyb8SNIFNsb3ZlbmlqZVwifSxcblx0XHR7IGlkOiBcIjhcIixsaW5rOiBcImh0dHA6Ly9zcG9sbmEtemxvcmFiYS5zaS9pbmRleC5waHAvZGVqYXZub3N0aS0yL2JyZXBsYWNuaS10ZWxlZm9uXCIsIGxhYmVsOiBcIlpkcnXFvmVuamUgcHJvdGkgc3BvbG5lbXUgemxvcmFibGphbmp1ICgwODAgMjg4MClcIn0sXG5cdFx0eyBpZDogXCI5XCIsbGluazogXCJodHRwOi8vd3d3LnNwbGV0bm8tb2tvLnNpXCIsIGxhYmVsOiBcIkthbSBwcmlqYXZpdGkgbmV6YWtvbml0ZSB2c2ViaW5lXCJ9LFxuXHRcdHsgaWQ6IFwiMTBcIixsaW5rOiBcImh0dHA6Ly93d3cuc2FmZS5zaVwiLCBsYWJlbDogXCJDZW50ZXIgemEgdmFybmVqxaFpIGludGVybmV0XCJ9LFxuXHRcdC8vIHsgaWQ6IFwiXCIsbGluazogXCJcIiwgbGFiZWw6IFwiXCJ9LFxuXHRdXG59KVxuXG4vLyBjb21wb25lbnRzXG52YXIgSGVscENvbnRhY3RDb21wID0ge1xuXHR2aWV3KCkge1xuXHRcdHJldHVybiBtKCcuaGVscC1jb250YWN0JyArIGIuYmMoXCIjZmZmZmZmICAgIFwiKSwgW1xuXHRcdFx0SGVscENvbnRhY3QuYWxsKCkubWFwKCBIZWxwQ29udGFjdFZpZXcgKVxuXHRcdF0pXG5cdH1cbn1cblxuZnVuY3Rpb24gSGVscENvbnRhY3RWaWV3IChjb250YWN0KSB7XG5cdHJldHVybiBtKCdzZWN0aW9uLmhlbHAtY29udGFjdCcsW1xuXHRcdG0oJ2gyLnN1YnRpdGxlLmlzLTMnLCAnTmEga29nYSBzZSBvYnJuaXRpJyksIC8vIFRPRE8gbW92ZSB0byBtb2RlbFxuICAgICAgICBtKCd1bCcrYi5saXN0U3R5bGUoXCJub25lXCIpLm1hcmdpbkxlZnQoXCIxZW1cIiksIFtcbiAgICAgICAgICAgIG0oJ2xpJywgbSgnLnRpdGxlLmlzLXNpemUtNScsIFsnUG9saWNpamEgJywgbSgnc3BhbicrYi5jb2xvcihcIiM5OTAwMDBcIiksJzExMycpLCAnIGFsaSAwODAgMTIwMCddKSksIC8vIFRPRE9cbiAgICAgICAgICAgIG0oJy5oZWxwLWNvbnRhY3QtZ3JpZCcsIGNvbnRhY3QuY29udGFjdHMubWFwKCBoZWxwQ29udGFjdFZpZXcgKSlcbiAgICAgICAgXSksXG5cdF0pXG59XG5cbmZ1bmN0aW9uIGhlbHBDb250YWN0VmlldyAoZW50cnkpIHtcblx0cmV0dXJuIG0oJy5jb250YWN0LWl0ZW0uaGVscC1jb250YWN0LXdyYXAnICsgYi53KCksIFtcbiAgICAgICAgbSgnbGknLCBsaW5rdG90YWIoZW50cnkubGluayAsZW50cnkubGFiZWwpKSxcblx0XSlcbn1cblxuZnVuY3Rpb24gbGlua3RvdGFiKGxpbmssIHRleHQpIHtcblx0cmV0dXJuIG0oJ2EuYmxvYicsIHtcInRhcmdldFwiOlwiX2JsYW5rXCIsXCJyZWxcIjpcIm5vb3BlbmVyIG5vcmVmZXJyZXJcIixcImhyZWZcIjpsaW5rfSwgdGV4dCkgLy8gVE9ET1xufVxuXG5cbmV4cG9ydCBkZWZhdWx0IEhlbHBDb250YWN0Q29tcCIsIlxuaW1wb3J0IG0gZnJvbSAnbWl0aHJpbCdcbmltcG9ydCBiIGZyb20gJ2JzcydcblxuLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNjkxMDA0OS9vbi1hLWNzcy1ob3Zlci1ldmVudC1jYW4taS1jaGFuZ2UtYW5vdGhlci1kaXZzLXN0eWxpbmdcblxudmFyIEhlYWRlciA9IHtcbiAgICB2aWV3OiBmdW5jdGlvbih2bm9kZSkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgbShUaXRsZVZpZXcpLFxuICAgICAgICAgICAgbSgnLmJveHgnICsgYi5kaXNwbGF5KCdmbGV4JykucG9zaXRpb24oJ3JlbGF0aXZlJyksIFtcbiAgICAgICAgICAgICAgICBbLi4uQXJyYXkoNSkua2V5cygpXS5tYXAoa2lkVmlldyksXG4gICAgICAgICAgICAgICAgbShTdWJ0aXRsZVZpZXcpXG4gICAgICAgICAgICBdKVxuICAgICAgICBdXG4gICAgfVxufVxuXG52YXIgU3VidGl0bGVWaWV3ID0ge1xuICAgIHZpZXc6ICgpID0+XG4gICAgICAgIG0oJ3NwYW4jdGl0bGUnICsgYi5wb3NpdGlvbignYWJzb2x1dGUnKS5mcygnMS41ZW0nKS50b3AoJzg1JScpLmxlZnQoJzUwJScpXG4gICAgICAgICAgICAudHJhbnNmb3JtKCd0cmFuc2xhdGUoLTUwJSwgLTUwJSknKS53KCcxMDAlJylcbiAgICAgICAgICAgIC5mb250V2VpZ2h0KDkwMClcbiAgICAgICAgICAgIC50ZXh0VHJhbnNmb3JtKCd1cHBlcmNhc2UnKS50ZXh0QWxpZ24oJ2NlbnRlcicpXG4gICAgICAgICAgICAub3BhY2l0eSgwKS50cmFuc2l0aW9uKCdvcGVjaXR5IC4xcyBsaW5lYXInKVxuICAgICAgICAgICAgLy8gLiRob3ZlcihiLm9wYWNpdHkoMSkudHJhbnNpdGlvbignb3BhY2l0eSAuNHMgbGluZWFyJykpXG4gICAgICAgICAgICAuJG1lZGlhKCcobWluLXdpZHRoOiA4MDFweCknLCBiLmZzKFwiMy42ZW1cIikpXG4gICAgICAgICAgICAsICdKZSDFvnJ0ZXYgc3BvbG5lIHpsb3JhYmUnKVxuXG59XG5cbnZhciBUaXRsZVZpZXcgPSB7XG4gICAgdmlldzogKCkgPT5cbiAgICAgICAgbShcIi50aXRsZVwiICsgYi5mb250V2VpZ2h0KDkwMCkuZm9udFNpemUoJzNlbScpXG4gICAgICAgICAgICAuY29sb3IoJyMwMDAwMDAnKS50ZXh0VHJhbnNmb3JtKCd1cHBlcmNhc2UnKVxuICAgICAgICAgICAgLncoJzEwMCUnKS50ZXh0QWxpZ24oJ2NlbnRlcicpXG4gICAgICAgICAgICAuJG1lZGlhKCcobWluLXdpZHRoOiA4MDFweCknLCBiLmZzKFwiNWVtXCIpKVxuICAgICAgICAgICAgLCBbXCJWc2FrIFwiLCBtKFwic3BhblwiK2IuYyhcIiM4ZjI0MjZcIiksIFwiNS4gXCIpLCBcIm90cm9rXCJdKVxufVxuXG5mdW5jdGlvbiBraWRWaWV3KCkge1xuICAgIHJldHVybiBtKFwic3ZnW2NsYXNzPXNob3ddW2NsaXAtcnVsZT0nZXZlbm9kZCddW2ZpbGwtcnVsZT0nZXZlbm9kZCddW3N0cm9rZS1saW5lam9pbj0ncm91bmQnXVtzdHJva2UtbWl0ZXJsaW1pdD0nMS40MTQnXVt2aWV3Qm94PScwIDAgMjAwIDMwMCddW3htbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyddXCIsXG4gICAgICAgIG0oXCJwYXRoW2Q9J002NC43NzUgMzAwSDIyLjYyNmw0Ny44MDEtMTMwLjg0OC00Ljg4Ni01NS4yNUwwIDE3NS40N3YtNDEuMWw2NS41NDEtNTkuMzAzaDEyLjQzOGMtMTIuNjE3LTYuODMyLTIxLjE2NC0xOS45NjUtMjEuMTY0LTM1LjAzMUM1Ni44MTUgMTcuOTM5IDc1LjIwMyAwIDk3Ljg1IDBjLjU1NyAwIDEuMTI0LjAxMSAxLjY4MS4wMzNoLjAwMUE0Mi45MzMgNDIuOTMzIDAgMCAxIDEwMS4yMTQgMGMyMi42NDcgMCA0MS4wMzUgMTcuOTM5IDQxLjAzNSA0MC4wMzYgMCAxNS4wNjYtOC41NDggMjguMTk5LTIxLjE2NCAzNS4wMzFoMTIuNDM3TDIwMCAxMzQuMzd2NDEuMWwtNjYuNDc4LTYxLjU2OC00Ljg4NSA1NS4yNUwxNzYuNDM4IDMwMGgtNDIuMTQ5bC0zNC43NTctNzUuOTI2di4wMDFsLS4wMDEtLjAwMUw2NC43NzUgMzAweiddXCIpXG4gICAgKVxufVxuXG5leHBvcnQgZGVmYXVsdCBIZWFkZXIiLCJcbmltcG9ydCBtIGZyb20gJ21pdGhyaWwnXG5pbXBvcnQgYiBmcm9tICdic3MnXG4vLyBpbXBvcnQgKiBhcyBmZWF0aGVyIGZyb20gJ2ZlYXRoZXItaWNvbnMnO1xuXG5jb25zdCBGb290ZXIgPSB7XG4gICAgdmlldzogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgbSgnZm9vdGVyLmZvb3RlcicgKyBiLmJjKCcjZWRlZGVkJyksIFtcbiAgICAgICAgICAgICAgICBtKCcuZm9vdGVyLWNvbnRlbnQnXG4gICAgICAgICAgICAgICAgKyBiLmRpc3BsYXkoJ2Jsb2NrJykuZm9udFNpemUoJy45cmVtJylcbiAgICAgICAgICAgICAgICAuJG1lZGlhKCcobWluLXdpZHRoOjgwMXB4KScsIGIuZGlzcGxheSgnZmxleCcpLmpjKCdzcGFjZS1hcm91bmQnKSlcbiAgICAgICAgICAgICAgICAuJG1lZGlhKCcobWF4LXdpZHRoOiA4MDBweCknLCBiLiRuZXN0KCc+ICogKyAqJywgYi5wYWRkaW5nVG9wKCcyZW0nKSkpXG4gICAgICAgICAgICAgICAgLnAoJzFlbSAwJykuYm9yZGVyQm90dG9tKFwiMXB4IHNvbGlkICM0YTRhNGFcIilcbiAgICAgICAgICAgICAgICAsIFtcbiAgICAgICAgICAgICAgICAgICAgbShPcmdhbml6YXRpb25WaWV3KSxcbiAgICAgICAgICAgICAgICAgICAgbShQYXJ0aWNpcGFudFZpZXcpLFxuICAgICAgICAgICAgICAgICAgICBtKFN1cHBvcnRlclZpZXcpLFxuICAgICAgICAgICAgICAgICAgICBtKE1lZGlhU3VwcG9ydFZpZXcpXG4gICAgICAgICAgICAgICAgXSksXG4gICAgICAgICAgICAgICAgLy8gbShTb2NpYWxOZXR3b3JrVmlldylcbiAgICAgICAgICAgIF0pXG4gICAgICAgIF1cbiAgICB9XG59XG5cbmNvbnN0IE9yZ2FuaXphdGlvblZpZXcgPSB7XG4gICAgdmlldzogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbSgnc2VjdGlvbi5vcmdhbml6YXRpb24nICsgYi5oKCcxMDAlJyksICBbXG4gICAgICAgICAgICBtKCcuc3VidGl0bGUuaXMtNScsICdPcmdhbml6YXRvcmppJyksXG4gICAgICAgICAgICBtKCd1bCcsIFtcbiAgICAgICAgICAgICAgICAvLyBtKFwibGlcIiwgbGlua3RvdGFiKFwiXCIsIFwiRHJ1xaF0dm8gUHVQXCIpKSxcbiAgICAgICAgICAgICAgICBtKFwibGlcIiwgXCJEcnXFoXR2byBQdVBcIiksXG4gICAgICAgICAgICAgICAgbShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vd3d3Lm1kai5zaVwiLCBcIk1sYWRpbnNraSBkb20gSmFyxaFlXCIpKVxuICAgICAgICAgICAgXSlcbiAgICAgICAgXSlcbiAgICB9XG59XG5cbmNvbnN0IFBhcnRpY2lwYW50VmlldyA9IHtcbiAgICB2aWV3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBtKCdzZWN0aW9uLnBhcnRpY2lwYW50cycgKyBiLmgoJzEwMCUnKSwgIFtcbiAgICAgICAgICAgIG0oJy5zdWJ0aXRsZS5pcy01JywgJ1NvZGVsdWpvxI1pJyksXG4gICAgICAgICAgICBtKCd1bCcsIFtcbiAgICAgICAgICAgICAgICBtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL3pkcnV6ZW5qZS1zZXphbS5zaS9zZXphbVwiLCBcIlpkcnXFvmVuamUgU0VaQU1cIikpLFxuICAgICAgICAgICAgICAgIG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vd3d3LmRydXN0dm8temVuc2thLXN2ZXRvdmFsbmljYS5zaVwiLCBcIsW9ZW5za2Egc3ZldG92YWxuaWNhXCIpKSxcbiAgICAgICAgICAgICAgICBtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly93d3cuc2l0aXRlYXRlci5zaVwiLCBcIlNpVGkgVGVhdGVyIEJUQ1wiKSksXG4gICAgICAgICAgICAgICAgbShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vd3d3Lm5pa2Euc2lcIiwgXCJOSUtBIFJlY29yZHNcIikpLFxuICAgICAgICAgICAgICAgIG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwczovL3d3dy5ldXNhLmV1L3Byb2plY3RzL3ZvaWNlXCIsIFwiVm9pY2VcIikpXG4gICAgICAgICAgICBdKVxuICAgICAgICBdKVxuICAgIH1cbn1cblxuY29uc3QgU3VwcG9ydGVyVmlldyA9IHtcbiAgICB2aWV3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBtKCdzZWN0aW9uLnN1cHBvcnRlcnMnICsgYi5oKCcxMDAlJyksIFtcbiAgICAgICAgICAgIG0oJy5zdWJ0aXRsZS5pcy01JywgJ1BvZHBvcm5pa2knKSxcbiAgICAgICAgICAgIG0oJ3VsJywgW1xuICAgICAgICAgICAgICAgIG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vd3d3LmZpbmlvZ2xhc2kuY29tXCIsIFwiRklOSSBvZ2xhc2lcIikpLFxuICAgICAgICAgICAgICAgIG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwczovL3d3dy5ha3Rvbi5uZXQvLnNpL1wiLCBcIkFrdG9uIGQuby5vLlwiKSksXG4gICAgICAgICAgICAgICAgbShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9MZXBhWm9nYVwiLCBcIkxlcGEgxb1vZ2FcIikpLFxuICAgICAgICAgICAgICAgIG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vd3d3LnNsb3ZlbmlhLWV4cGxvcmVyLmNvbVwiLCBcIlNsb3ZlbmlhIEV4cGxvcmVyXCIpKSxcbiAgICAgICAgICAgICAgICBtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly93d3cuc3BvcnRuYS1sb3RlcmlqYS5zaVwiLCBcIsWgcG9ydG5hIGxvdGVyaWphXCIpKSxcbiAgICAgICAgICAgICAgICBtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL3d3dy5zbmFnYS5zaVwiLCBcIlNuYWdhIExqdWJsamFuYVwiKSlcbiAgICAgICAgICAgIF0pXG4gICAgICAgIF0pXG4gICAgfVxufVxuXG5jb25zdCBNZWRpYVN1cHBvcnRWaWV3ID0ge1xuICAgIHZpZXc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG0oJ3NlY3Rpb24ubWVkaWEtc3VwcG9ydCcgKyBiLmgoJzEwMCUnKSwgW1xuICAgICAgICAgICAgbSgnLnN1YnRpdGxlLmlzLTUnLCAnTWVkaWpza2EgcG9kcG9yYScpLFxuICAgICAgICAgICAgbSgndWwnLCBbXG4gICAgICAgICAgICAgICAgbShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vd3d3LmV2ZW50aW0uc2kvc2lcIiwgXCJFdmVudGltLnNpXCIpKSxcbiAgICAgICAgICAgICAgICBtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly9pbmZvLmRlbG8uc2kvXCIsIFwiRGVsbyBSZXZpamVcIikpLFxuICAgICAgICAgICAgICAgIG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwczovL3JhZGlvc3R1ZGVudC5zaS9cIiwgXCJSYWRpbyDFoHR1ZGVudFwiKSksXG4gICAgICAgICAgICAgICAgbShcImxpXCIsIGxpbmt0b3RhYihcImh0dHA6Ly9tZWRpYWJ1cy5zaVwiLCBcIk1lZGlhIEJ1c1wiKSksXG4gICAgICAgICAgICAgICAgbShcImxpXCIsIGxpbmt0b3RhYihcImh0dHA6Ly96YXNsb24uc2kvXCIsIFwiWmFzbG9uLnNpXCIpKSxcbiAgICAgICAgICAgICAgICBtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL3RhbS10YW0uc2lcIiwgXCJUQU0tVEFNXCIpKSxcbiAgICAgICAgICAgICAgICBtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly93d3cuZXVyb3BsYWthdC5zaVwiLCBcIkV1cm9wbGFrYXRcIikpXG4gICAgICAgICAgICBdKVxuICAgICAgICBdKVxuICAgIH1cbn1cblxuY29uc3QgU29jaWFsTmV0d29ya1ZpZXcgPSB7XG5cbiAgICB2aWV3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIG0oJ3NwYW4nICsgYi5ib3JkZXJCb3R0b20oXCIxcHggc29saWQgIzRhNGE0YVwiKS53KCcxMDAlJykuaCgnMXB4JyksICcnKSxcbiAgICAgICAgbShcIi5jb250ZW50Lmhhcy10ZXh0LWNlbnRlcmVkXCIgKyBiLnAoJzFlbSAwJyksXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgbSgnYVtocmVmPVwiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL1ZTQUstNWxpdmUtMjE3ODc2NzE2MjM3ODIzOS9cIl0uaWNvbidcbiAgICAgICAgICAgICAgICAgICAgKyBiLiRob3ZlcihiLmZpbGwoJyNmZmYnKSksIG0udHJ1c3Qoc3ZnKCdmYWNlYm9vaycsIHsgd2lkdGg6IDQ4LCBoZWlnaHQ6IDQ4LCBmaWxsOiAnIzRhNGE0YScsIHN0cm9rZTogJ25vbmUnfSkpKSxcblxuICAgICAgICAgICAgICAgIG0oJ2FbaHJlZj1cInZzYWsucGV0aUBnbWFpbC5jb21dLmljb24nLCBtLnRydXN0KHN2ZygnbWFpbCcsIHsgd2lkdGg6IDQ4LCBoZWlnaHQ6IDQ4LCBzdHJva2U6ICcjNGE0YTRhJyB9ICkpKSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAvLyBtKCdzbWFsbC5oYXMtdGV4dC1jZW50ZXJlZCcsICcyMDE5IEAgdnNhazUubGl2ZScpXG4gICAgICAgIClcbiAgICAgICAgLy8gbSgnc21hbGwnLCAnWkFIVkFMRTonKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbGlua3RvdGFiKGxpbmssIHRleHQpIHtcblx0cmV0dXJuIG0oJ2EuYmxvYicsIHtcInRhcmdldFwiOlwiX2JsYW5rXCIsXCJyZWxcIjpcIm5vb3BlbmVyIG5vcmVmZXJyZXJcIixcImhyZWZcIjpsaW5rfSwgdGV4dClcbn1cblxuLy8gZnVuY3Rpb24gc3ZnKGljb24sIGF0dHJzKSB7XG4vLyAgICAgaWYgKCFpY29uKVxuLy8gICAgICAgICByZXR1cm4gJyc7XG4vLyAgICAgcmV0dXJuIGZlYXRoZXIuaWNvbnNbaWNvbl0udG9TdmcoYXR0cnMpXG4vLyB9XG5cbmV4cG9ydCBkZWZhdWx0IEZvb3RlciIsImltcG9ydCBtIGZyb20gJ21pdGhyaWwnXG5cbi8vIGxldCBtb2RlbCA9IFtcbi8vICAgICBbMSwgJ0JydcWhdXJlJ10sXG4vLyAgICAgWzIsICdUaXRsZTInXSxcbi8vICAgICBbMywgJ1RpdGxlMyddXG4vLyBdXG5cbmNvbnN0IFRhYnMgPSB7XG4gICAgdmlldzogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbSgnLicsIFwiVGFic1wiKVxuICAgICAgICAvLyByZXR1cm4gbSgnZGl2LnRhYnMnLFxuICAgICAgICAvLyAgICAgbSgnbGknLCBtKCdhJywgbW9kZWwubWFwKHg9PngpKVxuICAgICAgICAvLyApXG4gICAgfVxufVxuXG5jb25zdCBMaXN0ID0ge1xuICAgIHZpZXc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG0oJ2Rpdi5saXN0LmlzLWhvdmVyYWJsZScsIFxuICAgICAgICAgICAgbGlzdEl0ZW0oXCIuL2Fzc2V0cy9kb2MvMDEtVGV4dF9Ccm9zdXJhX1RqYcWhYV9Ib3J2YXRfRE5LXzIwMTlfMDJfMTAucGRmXCIsIFwiVGphxaFhIEhyb3ZhdCBETks6IFZzZWJpbmEgWmxvxb5lbmtlIFZTQUs1LlwiKSwgLy8gVE9ETyBQcmVpbWVudWogYnJ1c3VybyBIcm92YXRcbiAgICAgICAgICAgIGxpc3RJdGVtKFwiLi9hc3NldHMvZG9jLzA2LTIwMDdfTU5aX1BvbGljaWphX1NQT0xOT19OQVNJTEpFLnBkZlwiLCBcIk1OWiBQb2xpY2lqYTogU3BvbG5vIE5hc2lsamVcIiksXG5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICBsaXN0SXRlbShcImh0dHBzOi8vd3d3LnBvcnRhbHBsdXMuc2kvMTYwMy9qZXNlbmlza2EtZGVrbGljYVwiLCBcIkthdGphIEtuZXogU3RlaW5idWNoOiAnRW5hIHBvIHJpdGknIGplIHphIFNsb3ZlbmNlIG5la2FqIHNwcmVqZW1saml2ZWdhLCBub3JtYWxuZWdhIGluIHZ6Z29qbmVnYS4gUG9ydGFsIFBsdXMsIDUuIDcuIDIwMTYuXCIpLFxuICAgICAgICAgICAgbGlzdEl0ZW0oXCJodHRwczovL3d3dy5ydHZzbG8uc2kvc2xvdmVuaWphL3BlZG9maWxpamEta2RvLXNpLXphdGlza2Etb2NpLzI1NTcxMVwiLCBcIkEuIE11LjogUGVkb2ZpbGlqYToga2RvIHNpIHphdGlza2Egb8SNaT8gTU1DIFJUViBTTE8sIDE5LiA0LiAyMDExLlwiKSxcbiAgICAgICAgICAgIGxpc3RJdGVtKFwiaHR0cDovL25vdmljZS5zdmV0MjQuc2kvY2xhbmVrL25vdmljZS9zbG92ZW5pamEvNTZjNWZmNGE4NmI5Yi9yYXpnYWxqYW5qZS1pbnRpbWUtcHJlZC1yYXpuaW1pLW5lem5hbmNpXCIsIFwiVGluYSBSZWNlazogTWFtYSBzcG9sbm8gemxvcmFibGplbmVnYSBvdHJva2E6IE90cm9rIHNlIGplIHRyZXNlbCwgcG90aWwsIHNlIG1lIG9rbGVwYWwuIE1lZGlhIDI0LCAxOS4gMi4gMjAxNi5cIiksXG4gICAgICAgICAgICBsaXN0SXRlbShcImh0dHA6Ly93d3cuMjR1ci5jb20vbm92aWNlL3Nsb3ZlbmlqYS9wby10YWtzbmktaXpndWJpLW5pLWNsb3Zlay1uaWtvbGktdmVjLWlzdGktZ3JkaS1uZXpuYW5lYy12LXRlbW5pLXVsaWNpLWplLWltZWwtem5hbi1vYnJhei5odG1sXCIsIFwiTmF0YWxpamEgxaB2YWI6IFBvIHRha8WhbmkgaXpndWJpIG5pIMSNbG92ZWsgbmlrb2xpIHZlxI0gaXN0aTogR3JkaSBuZXpuYW5lYyB2IHRlbW5pIHVsaWNpIGplIGltZWwgem5hbiBvYnJhei4gMjR1ciwgMjYuIDkuIDIwMTQuXCIpLFxuICAgICAgICAgICAgbGlzdEl0ZW0oXCJodHRwczovL3d3dy5kbmV2bmlrLnNpLzEwNDI3MjU4NTIvbGp1ZGplL25lemEtbWlrbGljLWRvbGdvbGV0bmEtcHJlaXNrb3ZhbGthLXNwb2xuaWgtemxvcmFiLW90cm9rLXBlZG9maWxpLWl6a29yaXNjYWpvLXRhYnVqZVwiLCBcIlBldGVyIExvdsWhaW46IE5lxb5hIE1pa2xpxI0sIGRvbGdvbGV0bmEgcHJlaXNrb3ZhbGthIHNwb2xuaWggemxvcmFiIG90cm9rOiBQZWRvZmlsaSBpemtvcmnFocSNYWpvIHRhYnVqZS4gRG5ldm5paywgMi4gMTIuIDIwMTUuXCIpLFxuICAgICAgICAgICAgbGlzdEl0ZW0oXCJodHRwOi8vamF6c2VtdnJlZHUuc2kvZm9ydW0vbmFzZS1vdHJvc3R2by9rYW0tbmFzLXByaXBlbGplam8temxvcmFiZS12LW90cm9zdHZ1LXQ2NC5odG1sXCIsIFwiS2FtIG5hcyBwcmlwZWxqZWpvIHpsb3JhYmUgdiBvdHJvxaF0dnUuIEZvcnVtIGphenNlbXZyZWR1LCAyNi4gNi4gMjAxMC5cIiksXG4gICAgICAgICAgICBsaXN0SXRlbShcImh0dHA6Ly93d3cuZGVsby5zaS9ub3ZpY2Uva3JvbmlrYS92c2FrYS1wZXRhLW90cm9za2EtenJ0ZXYtc3BvbG5lLXpsb3JhYmUtc3RhcmEtbWFuai1rb3Qtc2VkZW0tbGV0Lmh0bWxcIiwgXCJNaWhhZWwgS29yc2lrYTogVnNha2EgcGV0YSBvdHJvxaFrYSDFvnJ0ZXYgc3BvbG5lIHpsb3JhYmUgbmEgaW50ZXJuZXR1IHN0YXJhIG1hbmoga290IHNlZGVtIGxldC4gRGVsbywgMjkuIDkuIDIwMTYuXCIpLFxuICAgICAgICAgICAgbGlzdEl0ZW0oXCJodHRwOi8vd3d3Lm1pbGVuYW1hdGtvLmNvbS9zcG9sbmUtemxvcmFiZVwiLCBcIk1pbGVuYSBNYXRrbzogU3BvbG5lIHpsb3JhYmUuIFBvdCBzcmNhLCAyMC4gMi4gMjAxNy5cIiksXG4gICAgICAgICAgICBsaXN0SXRlbShcImh0dHBzOi8vZ292b3JpLnNlL2RvZ29ka2kvc3BvbG5vLXpsb3JhYmxqYW5qZS1vdHJvay1uZS1zbWUtb3N0YXRpLXRhYnUvXCIsIFwiVGFuamEgxaBrZXQ6IFNwb2xubyB6bG9yYWJsamFuamUgb3Ryb2sgbmUgc21lIG9zdGF0aSB0YWJ1ISBHb3Zvcmkuc2UsIDE2LiAxMS4gMjAxNS5cIiksXG4gICAgICAgICAgICBsaXN0SXRlbShcImh0dHBzOi8vd3d3LnBvcnRhbHBsdXMuc2kvMjg1NS9vLWthdG9saXNraS1jZXJrdmktaW4tcGVkb2ZpbGlqaVwiLCBcIkRlamFuIFN0ZWluYnVjaDogS2F0b2xpxaFrYSBjZXJrZXYgbmEgU2xvdmVuc2tlbSBpbiB2cHJhxaFhbmplIHBlZG9maWxpamUgbWVkIGR1aG92xaHEjWluby4gUG9ydGFsIFBsdXMsIDE5LiA4LiAyMDE4LlwiKSxcbiAgICAgICAgICAgIGxpc3RJdGVtKFwiaHR0cHM6Ly93d3cub25hcGx1cy5zaS9wZWRvZmlsc2tlLW1yZXplLXNjaXRpam8tbmFqdnBsaXZuZWpzaS1wb2xpdGlraVwiLCBcIkthdGphIENhaDogUGVkb2ZpbHNrZSBtcmXFvmUgxaHEjWl0aWpvIG5hanZwbGl2bmVqxaFpIHBvbGl0aWtpLiBPbmFQbHVzLCAzMC4gOC4gMjAxNy5cIiksXG4gICAgICAgICAgICBsaXN0SXRlbShcImh0dHA6Ly93d3cuYmVnYW4uc2kvMjAxOC8wMi8xNi9wZWRvZmlsc2tpLW9icm9jLW9rb2xpLXBhcGV6YS1mcmFuY2lza2Etc2UtemF0ZWd1amVcIiwgXCJWbGFkbyBCZWdhbjogUGVkb2ZpbHNraSBvYnJvxI0gb2tvbGkgcGFwZcW+YSBGcmFuxI1pxaFrYSBzZSB6YXRlZ3VqZS4gQ2Vya3Zlbm8ga3JpdGnEjW5lIGtuamlnZSwgMTYuIDIuIDIwMTguXCIpLFxuICAgICAgICAgICAgbGlzdEl0ZW0oXCJodHRwczovL3d3dy5zcGxldG5vLW9rby5zaS9ub3ZpY2UvbW9qLW1pa3JvLW8tcGVkb2ZpbGlqaVwiLCBcIk1vaiBNaWtybyBvIHBlZG9maWxpamkuIFNwbGV0bm8gb2tvLCA0LiAxLiAyMDEwLlwiKSxcbiAgICAgICAgICAgIGxpc3RJdGVtKFwiaHR0cHM6Ly9zbG8tdGVjaC5jb20vbm92aWNlL3Q1ODY2NTRcIiwgXCJNYXRlaiBIdcWhOiBOaXpvemVtc2tpIHJhemlza292YWxjaSB6IHZpcnR1YWxubyBkZWtsaWNvIG9ka3JpbGkgdmXEjSB0aXNvxI0gc3BsZXRuaWggcGVkb2ZpbG92LiBTbG9UZWNoLCA2LiAxMS4gMjAxMy5cIiksXG4gICAgICAgICAgICBsaXN0SXRlbShcImh0dHBzOi8vY2Fzb3Jpcy5zaS9rYWtvLWdvdm9yaXRpLW8tbmVwcmltZXJuaWgtZG90aWtpaFwiLCBcIlNvbmphOiBLYWtvIGdvdm9yaXRpIG8gbmVwcmltZXJuaWggZG90aWtpaC4gxIxhc29yaXMsIDEyLiA2LiAyMDE2LlwiKSxcbiAgICAgICAgICAgIGxpc3RJdGVtKFwiaHR0cHM6Ly93d3cuYjkyLm5ldC96ZHJhdmxqZS92ZXN0aS5waHA/eXl5eT0yMDE4Jm1tPTEwJmRkPTA0Jm5hdl9pZD0xNDUxNzc3XCIsIFwiWmxvc3RhdmxqYW5qZSBkZcSNYWthIG9zdGF2bGphIG/FvmlsamtlIHUgbmppaG92b20gRE5LLCBwb2themFsYSBzdHVkaWphLiBCOTIsIDQuIDEwLiAyMDE4LlwiKSxcbiAgICAgICAgICAgIGxpc3RJdGVtKFwiaHR0cHM6Ly93d3cuZGVsby5zaS9ub3ZpY2Uvc2xvdmVuaWphL3Nwb2xuYS16bG9yYWJhLW5pLWxlLXpsby1qZS16bG9jaW4uaHRtbD9pc2thbG5paz1LYXRhcmluYSUyME1hdGtvJlBIUFNFU1NJRD0xZjhhMjAxMmM0MDgwZjUwMDlmYjFlODUyOWJiMGZmMVwiLCBcIk1hamEgRmFiamFuOiBTcG9sbmEgemxvcmFiYSBuaSBsZSB6bG8sIGplIHpsb8SNaW4uIERlbG8gMTcuIDExLiAyMDE1LlwiKSxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGlzdEl0ZW0oXCIuL2Fzc2V0cy9kb2MvMDMtMjAxNy1wcmVwcmVjZXZhbmplaW5wcmVwb3puYXZhbmplc3BvbG5paHpsb3JhYm90cm9rLnBkZlwiLCBcIkROSzogUHJlcHJlxI1ldmFuamUgaW4gcHJlcG96bmF2YW5qZSBzcG9sbmloIHpsb3JhYiBvdHJvay4gTmFqcG9nb3N0ZWrFoWEgdnByYcWhYW5qYSBpbiBvZGdvdm9yaSBuYW5qZS4sIFB1Ymxpa2FjaWphLCAyMDE2LlwiKSxcbiAgICAgICAgICAgIGxpc3RJdGVtKFwiLi9hc3NldHMvZG9jLzA0LTIwMTUtc3ZldG92YWxuaWNhemF6cnR2ZXNwb2xuZWdhbmFzaWxqYS5wZGZcIiwgXCJETks6IE9nbGFzIHphIHN2ZXRvdmFsbmljbywgMjAxOC5cIiksXG4gICAgICAgICAgICBsaXN0SXRlbShcIi4vYXNzZXRzL2RvYy8wNS1VTklfT3Nvam5pa19WZXNuYV8yMDExc3BvbG5lIHpsb3JhYmUucGRmXCIsIFwiVmVzbmEgT3Nvam5pazogU3BvbG5hIHpsb3JhYmEgb3Ryb2suIERpcGxvbXNrbyBkZWxvLCAyMDExLlwiKVxuICAgICAgICApIFxuICAgIH1cbn0gXG5cbmZ1bmN0aW9uIGxpc3RJdGVtKGxpbmssIHRleHQpIHtcblx0cmV0dXJuIG0oJ2EubGlzdC1pdGVtJywge1widGFyZ2V0XCI6XCJfYmxhbmtcIixcInJlbFwiOlwibm9vcGVuZXIgbm9yZWZlcnJlclwiLFwiaHJlZlwiOmxpbmt9LCB0ZXh0KVxufVxuZXhwb3J0IHtMaXN0LCBUYWJzfSIsImltcG9ydCBtIGZyb20gJ21pdGhyaWwnXG5pbXBvcnQgc3RyZWFtIGZyb20gJ21pdGhyaWwvc3RyZWFtJ1xuaW1wb3J0IGIgZnJvbSAnYnNzJ1xuaW1wb3J0ICogYXMgZmVhdGhlciBmcm9tICdmZWF0aGVyLWljb25zJztcbmltcG9ydCBNb2RhbCwge29wZW5Nb2RhbCwgbW9kYWxJc09wZW59IGZyb20gJy4vbW9kYWwuanMnXG5pbXBvcnQgRW50cnlMaXN0IGZyb20gXCIuL2NvbXBvbmVudHMvRW50cnlMaXN0XCJcbmltcG9ydCBOYXZpZ2F0aW9uTWVudSBmcm9tIFwiLi9jb21wb25lbnRzL05hdmlnYXRpb25NZW51XCJcbmltcG9ydCBWaWRlbyBmcm9tICcuL2NvbXBvbmVudHMvVmlkZW9Db21wJ1xuaW1wb3J0IEFib3V0Q29tcCBmcm9tICcuL2NvbXBvbmVudHMvQWJvdXRDb21wJ1xuaW1wb3J0IE1vZGFsRGVtbyBmcm9tICcuL2NvbXBvbmVudHMvTW9kYWxEZW1vJ1xuaW1wb3J0IEhlbHBDb250YWN0Q29tcCBmcm9tICcuL2NvbXBvbmVudHMvSGVscENvbnRhY3RDb21wJ1xuLy9cbmltcG9ydCBIZWFkZXIgZnJvbSAnLi9jb21wb25lbnRzL2hlYWRlcidcbmltcG9ydCBGb290ZXIgZnJvbSAnLi9jb21wb25lbnRzL2Zvb3RlcidcbmltcG9ydCB7TGlzdCwgVGFic30gZnJvbSAnLi9jb21wb25lbnRzL2xpc3QnXG5cblxud2luZG93Lm0gPSBtXG5iLnNldERlYnVnKHRydWUpXG5cbnZhciBEZXZQYWdlID0ge1xuXHR2aWV3OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gbShNYWluLCBtKFwiLmNvbnRhaW5lclwiLCBbXG5cdFx0XHRtKFRhYnMpLFxuXHRcdFx0bShMaXN0KSxcblx0XHRcdG0oRm9vdGVyKSxcblx0XHRcdG0oSGVhZGVyKSxcblx0XHRcdG0oSGVscENvbnRhY3RDb21wKSxcblx0XHRcdG0oVmlkZW8pLFxuXHRcdFx0bShBYm91dENvbXApLFxuXHRcdFx0bShNb2RhbERlbW8pXG5cdFx0XSkpXG5cdH1cbn1cblxuLypcbiogICBTb21lIGhhbmR5IHV0aWxpdGllcyBmb3IgdXNlIGluIHZpZXcoKXNcbiovXG5cbi8vIFZJREVPXG5cbi8vIC8vIHNlZWQgc29tZSBkYXRhXG4vLyBWaWRlby5jcmVhdGUoe1xuLy8gXHRcInZpZGVvc1wiOiBbXG4vLyBcdFx0eyBsaW5rOiBcImh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkL0oxOWxSTGItd3dZXCIsIGxhYmVsOiBcIk1pdGkgbyBzcG9sbmkgemxvcmFiaSwgdiBrYXRlcmUgdmVyamFtZW1vLCAxLlwifSxcbi8vIFx0XHR7IGxpbms6IFwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvVDJwU2tKMzdLUFlcIiwgbGFiZWw6IFwiTWl0aSBvIHNwb2xuaSB6bG9yYWJpLCB2IGthdGVyZSB2ZXJqYW1lbW8sIDIuXCJ9LFxuLy8gXHRcdHsgbGluazogXCJodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC9DV2ZKVVNITnN2VVwiLCBsYWJlbDogXCJPdHJva2Ega3JlcGkgaW5mb3JtYWNpamFcIn0sXG4vLyBcdFx0Ly8geyBsaW5rOiBcIlwiLCBsYWJlbDogXCJcIn0sXG4vLyBcdFx0Ly8geyBsaW5rOiBcIlwiLCBsYWJlbDogXCJcIn0sXG4vLyBcdFx0Ly8geyBsaW5rOiBcIlwiLCBsYWJlbDogXCJcIn0sXG4vLyBcdFx0Ly8geyBsaW5rOiBcIlwiLCBsYWJlbDogXCJcIn1cbi8vIFx0XVxuLy8gfSlcblxuLy8gLy8gY29tcG9uZW50c1xuLy8gdmFyIFZpZGVvTGlzdCA9IHtcbi8vIFx0dmlldygpIHtcbi8vIFx0XHRyZXR1cm4gbSgnLnZpZGVvLWxpc3QnLCBbXG4vLyBcdFx0XHRWaWRlby5hbGwoKS5tYXAoIHZpZGVvVmlldyApXG4vLyBcdFx0XSlcbi8vIFx0fVxuLy8gfVxuXG4vLyBmdW5jdGlvbiB2aWRlb1ZpZXcgKGVudHJ5KSB7XG4vLyBcdHJldHVybiBtKCcudmlkZW8nLFtcbi8vIFx0XHRtKCdkaXYnLCB2aWRlby5lbnRyeS5tYXAoIGVudHJ5VmlldyApKVxuLy8gXHRdKVxuLy8gfVxuXG4vLyBmdW5jdGlvbiBlbnRyeVZpZXcgKGVudHJ5KSB7XG4vLyBcdHJldHVybiBtKCdkaXYuZW50cnknLCBbXG4vLyBcdFx0bSgnLnl0JywgZW50cnkubGluayksXG4vLyBcdFx0bSgnbGFiZWwnLCBlbnRyeS5uYW1lKVx0XG4vLyBcdF0pXG4vLyB9XG5cbmZ1bmN0aW9uIHl0KGxpbmssIHRleHQpIHtcblx0cmV0dXJuIG0oXCJkaXZcIiwge1wiY2xhc3NcIjpcImNvbHVtbnNcIn0sIFtcblx0XHRtKFwiZGl2XCIsIHtcImNsYXNzXCI6IFwiY29sdW1uXCJ9LFtcblx0XHRcdG0oXCJpZnJhbWVcIiwge1wic3JjXCI6bGluayxcImZyYW1lYm9yZGVyXCI6XCIwXCIsXCJhbGxvd1wiOlwiYWNjZWxlcm9tZXRlcjsgYXV0b3BsYXk7IGVuY3J5cHRlZC1tZWRpYTsgZ3lyb3Njb3BlOyBwaWN0dXJlLWluLXBpY3R1cmVcIixcImFsbG93ZnVsbHNjcmVlblwiOlwiYWxsb3dmdWxsc2NyZWVuXCJ9KSxcblx0XHRcdG0oXCIuY29udGVudFwiLCB0ZXh0KSxcblx0XHRdKSxcblx0XSlcbn1cblxuXG5cbi8vIFNBTU9cbmZ1bmN0aW9uIGxpbmt0byhocmVmKXtcblx0cmV0dXJuIHtocmVmOiBocmVmLCBvbmNyZWF0ZTogbS5yb3V0ZS5saW5rfTtcbn1cblxuZnVuY3Rpb24gYmluZFByb3Aob2JqLCBwcm9wTmFtZSl7XG5cdHJldHVybiB7XG5cdFx0b25pbnB1dDogbS53aXRoQXR0cihcInZhbHVlXCIsIGZ1bmN0aW9uKHYpe1xuXHRcdFx0b2JqW3Byb3BOYW1lXSA9IHY7XG5cdFx0fSksXG5cdFx0dmFsdWU6IG9ialtwcm9wTmFtZV0sXG5cdH07XG59XG5cbmZ1bmN0aW9uIGxpbmt0b3RhYihsaW5rLCB0ZXh0KSB7XG5cdHJldHVybiBtKCdhLmJsb2InLCB7XCJ0YXJnZXRcIjpcIl9ibGFua1wiLFwicmVsXCI6XCJub29wZW5lciBub3JlZmVycmVyXCIsXCJocmVmXCI6bGlua30sIHRleHQpXG59XG5cblxuZnVuY3Rpb24gaWNvbigpIHtcblx0cmV0dXJuIG0oJy5pY29uJywgc3ZnKCdtZW51JykpXG59XG5cbmZ1bmN0aW9uIGRhdGEoKSB7XG5cdHJldHVybiB7XG5cdFx0aWNvbjogbnVsbCxcblx0XHRhdHRyczogdW5kZWZpbmVkXG5cdH1cbn1cblxuYi5oZWxwZXIoJ21lYXN1cmUnLCBiLm1heFdpZHRoKFwiMzBlbVwiKSlcbi8vIGIuaGVscGVyKCdtZWFzdXJlV2lkZScsIGIubWF4V2lkdGgoXCIzNGVtXCIpKVxuYi5oZWxwZXIoJ21lYXN1cmVXaWRlJywgYi5taW5XaWR0aChcIjM0ZW1cIikpXG5iLmhlbHBlcignbWVhc3VyZU5hcnJvdycsIGIubWF4V2lkdGgoXCIyMGVtXCIpKVxuYi5oZWxwZXIoJ3Y1R3JpZCcsIGIuZGlzcGxheShcImdyaWRcIikuZ3JpZFRlbXBsYXRlUm93cyhcIjQ1cHggMzUwcHggYXV0byBhdXRvIGF1dG9cIikpXG5cbmNvbnN0IGZhZGVJbiA9IGIuJGtleWZyYW1lcyh7XG5cdGZyb206IGIuZmlsbChcIiNmZmZcIikuc3R5bGUsXG5cdHRvOiBiLmZpbGwoXCIjOGYyNDI2XCIpLnN0eWxlXG59KVxuXG52YXIgTWFpbkNvbXAgPSBmdW5jdGlvbigpIHtcblx0ZnVuY3Rpb24gb25pbml0KCkge1xuXG5cdH1cblxuXHRmdW5jdGlvbiBzdmcoaWNvbiwgYXR0cnMpIHtcblx0XHRpZiAoIWljb24pXG5cdFx0XHRyZXR1cm4gJyc7XG5cdFx0cmV0dXJuIGZlYXRoZXIuaWNvbnNbaWNvbl0udG9TdmcoYXR0cnMpXG5cdH1cblxuXHRmdW5jdGlvbiB2aWV3KHZub2RlKSB7XG5cdFx0cmV0dXJuIG0oXCJpcy1mdWxsaGVpZ2h0XCIsIFtcblxuXHRcdFx0Ly8gSEVBREVSXG5cdFx0XHRtKEhlYWRlciksXG5cdFx0XHQvLyBtKFwic2VjdGlvbi5oZXJvXCIsXG5cdFx0XHQvLyBcdG0oXCIuaGVyby1ib2R5XCIsXG5cdFx0XHQvLyBcdFx0bShcIi5jb250YWluZXJcIiArIGIuZGlzcGxheShcImZsZXhcIikuamMoXCJjZW50ZXJcIikuYWkoXCJjZW50ZXJcIiksXG5cdFx0XHQvLyBcdFx0XHRtKFwiaDEudGl0bGUuaXMtdXBwZXJjYXNlLmlzLTFcIiArIGIuZm9udFdlaWdodCg5MDApLCBbXCJWc2FrIFwiLCBtKFwic3BhblwiK2IuYyhcIiM4ZjI0MjZcIiksIFwiNS4gXCIpLCBcIm90cm9rXCJdKVxuXHRcdFx0Ly8gXHRcdClcblx0XHRcdC8vIFx0KVxuXHRcdFx0Ly8gKSxcblxuXHRcdFx0Ly8gTUFHNVxuXHRcdFx0Ly8gbShOYXZpZ2F0aW9uTWVudSksXG5cblx0XHRcdFxuXHRcdFx0Ly8gTkFWQkFSXG5cdFx0XHRtKFwibmF2Lm5hdmJhclwiLFxuXHRcdFx0XHRtKFwiLm5hdmJhci1tZW51LmlzLWFjdGl2ZVwiLFxuXHRcdFx0XHRcdG0oXCJhLm5hdmJhci1pdGVtLmlzLXVwcGVyY2FzZVwiLCBsaW5rdG8oXCIvYWJvdXRcIiksIFwiUG9zbGFuc3R2b1wiKSxcblx0XHRcdFx0XHRtKFwiYS5uYXZiYXItaXRlbS5pcy11cHBlcmNhc2VcIiwgbGlua3RvKFwiL2hlbHBcIiksIFwiUG9tb8SNXCIpLFxuXHRcdFx0XHRcdG0oXCJhLm5hdmJhci1pdGVtLmlzLXVwcGVyY2FzZVwiLCBsaW5rdG8oXCIvbGVhcm5cIiksIFwiSXpvYnJhxb5ldmFuamVcIiksXG5cdFx0XHRcdClcblx0XHRcdCksXG5cblx0XHRcdC8vIFNFQ1RJT05cblx0XHRcdG0oXCJzZWN0aW9uLnNlY3Rpb25cIiwgdm5vZGUuY2hpbGRyZW4pLFxuXHRcdFx0Ly8gRk9PVEVSXG5cdFx0XHRtKEZvb3RlcilcblxuXHRcdFx0Ly8gRk9PVEVSICogKyAqXG5cdFx0XHQvLyBtKFwiZm9vdGVyLmZvb3RlclwiICsgYi5iYygnI2VkZWRlZCcpLCBbXG5cdFx0XHQvLyBcdG0oJy5mb290ZXItY29udGVudCdcblx0XHRcdC8vIFx0XHQrIGIuZGlzcGxheSgnYmxvY2snKS5mb250U2l6ZSgnLjlyZW0nKVxuXHRcdFx0Ly8gXHRcdC4kbWVkaWEoJyhtaW4td2lkdGg6ODAxcHgpJywgYi5kaXNwbGF5KCdmbGV4JykuamMoJ3NwYWNlLWFyb3VuZCcpKVxuXHRcdFx0Ly8gXHRcdC4kbWVkaWEoJyhtYXgtd2lkdGg6IDgwMHB4KScsIGIuJG5lc3QoJz4gKiArIConLCBiLnBhZGRpbmdUb3AoJzJlbScpKSlcblx0XHRcdC8vIFx0XHQucCgnMWVtIDAnKS5ib3JkZXJCb3R0b20oXCIxcHggc29saWQgIzRhNGE0YVwiKVxuXHRcdFx0XHRcdFxuXHRcdFx0Ly8gXHRcdCwgW1xuXHRcdFx0Ly8gXHRcdG0oJ3NlY3Rpb24ub3JnYW5pemF0aW9uJyArIGIuaCgnMTAwJScpLCAgW1xuXHRcdFx0Ly8gXHRcdFx0bSgnLnN1YnRpdGxlLmlzLTUnLCAnT3JnYW5pemF0b3JqaScpLFxuXHRcdFx0Ly8gXHRcdFx0bSgndWwnLCBbXG5cdFx0XHQvLyBcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJcIiwgXCJEcnXFoXR2byBQdVBcIikpLFxuXHRcdFx0Ly8gXHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly93d3cubWRqLnNpXCIsIFwiTWxhZGluc2tpIGRvbSBKYXLFoWVcIikpXG5cdFx0XHQvLyBcdFx0XHRdKVxuXHRcdFx0Ly8gXHRcdF0pLFxuXHRcdFx0Ly8gXHRcdG0oJ3NlY3Rpb24ucGFydGljaXBhbnRzJyArIGIuaCgnMTAwJScpLCAgW1xuXHRcdFx0Ly8gXHRcdFx0bSgnLnN1YnRpdGxlLmlzLTUnLCAnU29kZWx1am/EjWknKSxcblx0XHRcdC8vIFx0XHRcdG0oJ3VsJywgW1xuXHRcdFx0Ly8gXHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL3pkcnV6ZW5qZS1zZXphbS5zaS9zZXphbVwiLCBcIlpkcnXFvmVuamUgU0VaQU1cIikpLFxuXHRcdFx0Ly8gXHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL3d3dy5kcnVzdHZvLXplbnNrYS1zdmV0b3ZhbG5pY2Euc2lcIiwgXCLFvWVuc2thIHN2ZXRvdmFsbmljYVwiKSksXG5cdFx0XHQvLyBcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwczovL3d3dy5zaXRpdGVhdGVyLnNpXCIsIFwiU2lUaSBUZWF0ZXIgQlRDXCIpKSxcblx0XHRcdC8vIFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vd3d3Lm5pa2Euc2lcIiwgXCJOSUtBIFJlY29yZHNcIikpLFxuXHRcdFx0Ly8gXHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly93d3cuZXVzYS5ldS9wcm9qZWN0cy92b2ljZVwiLCBcIlZvaWNlXCIpKVxuXHRcdFx0Ly8gXHRcdFx0XSlcblx0XHRcdC8vIFx0XHRdKSxcblx0XHRcdC8vIFx0XHRtKCdzZWN0aW9uLnN1cHBvcnRlcnMnICsgYi5oKCcxMDAlJyksIFtcblx0XHRcdC8vIFx0XHRcdG0oJy5zdWJ0aXRsZS5pcy01JywgJ1BvZHBvcm5pa2knKSxcblx0XHRcdC8vIFx0XHRcdG0oJ3VsJywgW1xuXHRcdFx0Ly8gXHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL3d3dy5maW5pb2dsYXNpLmNvbVwiLCBcIkZJTkkgb2dsYXNpXCIpKSxcblx0XHRcdC8vIFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vd3d3LmFrdG9uLm5ldC8uc2kvXCIsIFwiQWt0b24gZC5vLm8uXCIpKSxcblx0XHRcdC8vIFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9MZXBhWm9nYVwiLCBcIkxlcGEgxb1vZ2FcIikpLFxuXHRcdFx0Ly8gXHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL3d3dy5zbG92ZW5pYS1leHBsb3Jlci5jb21cIiwgXCJTbG92ZW5pYSBFeHBsb3JlclwiKSksXG5cdFx0XHQvLyBcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwczovL3d3dy5zcG9ydG5hLWxvdGVyaWphLnNpXCIsIFwixaBwb3J0bmEgbG90ZXJpamFcIikpLFxuXHRcdFx0Ly8gXHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL3d3dy5zbmFnYS5zaVwiLCBcIlNuYWdhIExqdWJsamFuYVwiKSlcblx0XHRcdC8vIFx0XHRcdF0pXG5cdFx0XHQvLyBcdFx0XSksXG5cdFx0XHQvLyBcdFx0bSgnc2VjdGlvbi5tZWRpYS1zdXBwb3J0JyArIGIuaCgnMTAwJScpLCBbXG5cdFx0XHQvLyBcdFx0XHRtKCcuc3VidGl0bGUuaXMtNScsICdNZWRpanNrYSBwb2Rwb3JhJyksXG5cdFx0XHQvLyBcdFx0XHRtKCd1bCcsIFtcblx0XHRcdC8vIFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vd3d3LmV2ZW50aW0uc2kvc2lcIiwgXCJFdmVudGltLnNpXCIpKSxcblx0XHRcdC8vIFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vaW5mby5kZWxvLnNpL1wiLCBcIkRlbG8gUmV2aWplXCIpKSxcblx0XHRcdC8vIFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vcmFkaW9zdHVkZW50LnNpL1wiLCBcIlJhZGlvIMWgdHVkZW50XCIpKSxcblx0XHRcdC8vIFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHA6Ly9tZWRpYWJ1cy5zaVwiLCBcIk1lZGlhIEJ1c1wiKSksXG5cdFx0XHQvLyBcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vemFzbG9uLnNpL1wiLCBcIlphc2xvbi5zaVwiKSksXG5cdFx0XHQvLyBcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vdGFtLXRhbS5zaVwiLCBcIlRBTS1UQU1cIikpLFxuXHRcdFx0Ly8gXHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly93d3cuZXVyb3BsYWthdC5zaVwiLCBcIkV1cm9wbGFrYXRcIikpXG5cdFx0XHQvLyBcdFx0XHRdKVxuXHRcdFx0Ly8gXHRcdF0pLFxuXHRcdFx0Ly8gXHRdKSxcblx0XHRcdC8vIFx0Ly8gbSgnc3BhbicgKyBiLmJvcmRlckJvdHRvbShcIjFweCBzb2xpZCAjNGE0YTRhXCIpLncoJzEwMCUnKS5oKCcxcHgnKSwgJycpLFxuXHRcdFx0Ly8gXHRtKFwiLmNvbnRlbnQuaGFzLXRleHQtY2VudGVyZWRcIiArIGIucCgnMWVtIDAnKSxcblx0XHRcdC8vIFx0XHRbXG5cdFx0XHQvLyBcdFx0XHRtKCdhW2hyZWY9XCJodHRwczovL3d3dy5mYWNlYm9vay5jb20vVlNBSy01bGl2ZS0yMTc4NzY3MTYyMzc4MjM5L1wiXS5pY29uJytiLiRob3ZlcihiLmZpbGwoJyNmZmYnKSksIG0udHJ1c3Qoc3ZnKCdmYWNlYm9vaycsIHsgd2lkdGg6IDQ4LCBoZWlnaHQ6IDQ4LCBmaWxsOiAnIzRhNGE0YScsIHN0cm9rZTogJ25vbmUnfSkpKSxcblxuXHRcdFx0Ly8gXHRcdFx0bSgnYVtocmVmPVwidnNhay5wZXRpQGdtYWlsLmNvbV0uaWNvbicsIG0udHJ1c3Qoc3ZnKCdtYWlsJywgeyB3aWR0aDogNDgsIGhlaWdodDogNDgsIHN0cm9rZTogJyM0YTRhNGEnIH0gKSkpLFxuXHRcdFx0Ly8gXHRcdFx0Ly8geW91dHViZSBUT0RPXG5cdFx0XHQvLyBcdFx0XSxcblx0XHRcdC8vIFx0XHQvLyBtKCdzbWFsbC5oYXMtdGV4dC1jZW50ZXJlZCcsICcyMDE5IEAgdnNhazUubGl2ZScpXG5cdFx0XHQvLyBcdCksXG5cdFx0XHQvLyBcdC8vIG0oJ3NtYWxsJywgJ1pBSFZBTEU6Jylcblx0XHRcdC8vIF0pXG5cblxuXG5cdFx0XSlcblx0fVxuXHRyZXR1cm4ge29uaW5pdDpvbmluaXQsIHZpZXc6dmlld31cbn1cbnZhciBNYWluID0gTWFpbkNvbXAoKVxuXG5cbnZhciBBYm91dCA9IHtcblx0dmlldzogZnVuY3Rpb24odm5vZGUpIHtcblx0XHRyZXR1cm4gbShNYWluLCBtKCcuY29udGFpbmVyJyArIGIuYmMoXCIjZmZmZmZmXCIpLnBhZGRpbmdCb3R0b20oJzNlbScpLFxuXHRcdFx0bShcImNvbHVtbnNcIiwgXG5cdFx0XHRcdG0oXCJjb2x1bW5cIiwgW1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdG0oXCIudGlsZS5pcy1wYXJlbnQuaGFzLXRleHQtY2VudGVyZWRcIiArIGIucChcIjEuNWVtXCIpLFxuXHRcdFx0XHRcdFx0bSgnaDEudGl0bGUuaXMtMi5pcy11cHBlcmNhc2UudGlsZS5pcy1jaGlsZC5pcy0xMicsIFwiTyBQcm9qZWt0dVwiKSxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdG0oXCIudGlsZS5pcy1wYXJlbnRcIiArIGIucCgwKSwgbShcIi50aWxlLmlzLWNoaWxkXCIgKyBiLnAoXCIwIDEuNWVtXCIpLFxuXHRcdFx0XHRcdFx0bSgnaDIuc3VidGl0bGUuaXMtMycsIFwiUG9zbGFuc3R2b1wiKSxcblx0XHRcdFx0XHRcdG0oJ3AnICsgYi5tYXJnaW5MZWZ0KFwibm9uZVwiKSxcblx0XHRcdFx0XHRcdFx0bSgnc3Bhbi5jb250ZW50JywnU3ZldG92bmEgemRyYXZzdHZlbmEgb3JnYW5pemFjaWphIG9wb3phcmphLCBkYSBzbyBzcG9sbmUgemxvcmFiZSBvdHJvayB6ZWxvIHBlcmXEjWEgdGVtYSwgc2FqIHJhemlza2F2ZSBrYcW+ZWpvLCBkYSBqZSB2c2FrYSDEjWV0cnRhIGRla2xpY2EgaW4gdnNhayDFoWVzdGkgZGXEjWVrIMW+cnRldiBzcG9sbmUgemxvcmFiZSB2IG90cm/FoXR2dS4gUG8gc3ZldHUgaW4gdiBTbG92ZW5pamkgwrt2c2FrIHBldGnCqyBvdHJvayBwcmF2IHpkYWosIGtvIG8gdGVtIGdvdm9yaW1vLCBkb8W+aXZsamEgc3BvbG5vIHpsb3JhYm8gcyBzdHJhbmkgbGp1ZGksIG9iIGthdGVyaWggxb5pdmkgYWxpIGppaCBkbmV2bm8gc3JlxI11amUuIFRvIHNvIMWhb2thbnRuaSwgYSDFvmFsIMWhZSBrYWtvIHJlc25pxI1uaSBwb2RhdGtpIGluIHRlxb5rbyBzaSBqZSBwcmVkc3RhdmxqYXRpLCBkYSBzZSB2IHRha28gcmF6dml0aSBkcnXFvmJpLCB2IG5hIHZpZGV6IG9iacSNYWpuaWggZHJ1xb5pbmFoLCBkb2dhamFqbyB6bG/EjWluaSBzcG9sbmVnYSBpemtvcmnFocSNYW5qYSBpbiBzcG9sbmVnYSB6bG9yYWJsamFuamEsIGtpIGppaCBuZSBiaSBzbWVsIHRycGV0aSBub2JlbiBvdHJvayBuYSB0ZW0gc3ZldHUuJyksXG5cdFx0XHRcdFx0XHRcdG0oXCJzcGFuLmNvbnRlbnQuaGFzLXRleHQtd2VpZ2h0LWJvbGRcIiwgXCIgWmF0byBzbW8gZGFuZXMgdHVrYWosIGRhIHNwcmVnb3ZvcmltbyBpbiBzaSBuZWhhbW8gemF0aXNrYXRpIG/EjWkgcHJlZCB0YWtvIG1ub8W+acSNbmltIHBvamF2b20sIGtvdCBqZSBzcG9sbm8gaXprb3JpxaHEjWFuamUgb3Ryb2suIEtvdCBkcnXFvmJhIHNtbyBvZGdvdm9ybmkgemEgbmHFoWUgb3Ryb2tlLiBUbyBqZSBuZWRvcHVzdG5vIGluIHNlIG1vcmEga29uxI1hdGkuXCIpLFxuXHRcdFx0XHRcdFx0XHRtKFwic3Bhbi5jb250ZW50XCIrYi5jb2xvcihcIlwiKS5kaXNwbGF5KFwiaW5saW5lLWJsb2NrXCIpLm1hcmdpbkxlZnQoMTApLCBtKFwic3BhblwiK2IuZm9udFNpemUoXCIuNzVyZW1cIikuY29sb3IoXCIjNjY2NjY2XCIpLCBcIihUYW5qYSDFoGtldClcIikpXG5cdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0bShcIi5cIitiLm1hcmdpblRvcChcIjFlbVwiKSxcblx0XHRcdFx0XHRcdFx0bShcInAuY29udGVudFwiLCBcIkthbXBhbmphIMK7VlNBSzUuwqsgKHZzYWsgcGV0aSBvdHJvayBqZSDFvnJ0ZXYgc3BvbG5lIHpsb3JhYmUpLCBpbWEgbmFtZW4gb3N2ZXN0aXRpIG5hasWhaXLFoW8gamF2bm9zdCBvIG5lZG9wdXN0bmVtIGluIG5lb2Rnb3Zvcm5lbSByYXZuYW5qdSBkcnXFvmJlLCBrYWRhciBqZSBzb2/EjWVuYSBzIHNwb2xuaW0gaXprb3JpxaHEjWFuamVtIGluIHNwb2xubyB6bG9yYWJvIG90cm9rLiBTIGthbXBhbmpvIG5hc2xhdmxqYW1vIHZyZWRub3RlIG5hxaFlIGRydcW+YmUsIGtpIMWhZSB2ZWRubyBkb3ZvbGp1amUsIGRhIHNwb2xubyBuYXNpbGplIHphc3RhcmEsIGthciDFvnJ0dmFtIG9uZW1vZ2/EjWEgcmVoYWJpbGl0YWNpam8gaW4gZW5ha292cmVkbm8gdmtsanXEjWV2YW5qZSB2IGRydcW+Ym8uXCIpLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0Ly8gbSgnaHInK2IuYm9yZGVyKDApLmgoMSkuYmMoJ3JnYmEoMjU1LDE1NCw1OSwxKScpKSxcblx0XHRcdFx0XHQpKSxcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyAvLyAvLyBPUkdBTklaQVRPUkpJXG5cdFx0XHRcdFx0Ly8gbShcIi50aWxlLmlzLXBhcmVudFwiICsgYi5wKDApLCBtKFwiLnRpbGUuaXMtY2hpbGRcIiArIGIucChcIjAgMS41ZW1cIiksXG5cdFx0XHRcdFx0Ly8gXHRtKCdoMi5zdWJ0aXRsZS5pcy0zJywgJ09yZ2FuaXphdG9yamknKSxcblx0XHRcdFx0XHQvLyBcdG0oJ3AnLCBtKCd1bCcrYi5saXN0U3R5bGUoXCJub25lXCIpLCBbXG5cdFx0XHRcdFx0Ly8gXHRcdG0oJ2xpJywgbSgncCcsICdEcnXFoXR2byBQdVAnKSksXG5cdFx0XHRcdFx0Ly8gXHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwczovL3d3dy5tZGouc2lcIiwgXCJNbGFkaW5za2kgZG9tIEphcsWhZVwiKSksXG5cdFx0XHRcdFx0Ly8gXHRdKSksXG5cblx0XHRcdFx0XHQvLyBcdG0oJ2hyJytiLmJvcmRlcigwKS5oKDEpLmJjKCdyZ2JhKDI1NSwxNTQsNTksMSknKSksXG5cdFx0XHRcdFx0Ly8gKSksXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly8gLy8gU09ERUxVSk9DSVxuXHRcdFx0XHRcdC8vIG0oXCIudGlsZS5pcy1wYXJlbnRcIiArIGIucCgwKSwgbShcIi50aWxlLmlzLWNoaWxkXCIgKyBiLnAoXCIwIDEuNWVtXCIpLFxuXHRcdFx0XHRcdC8vIFx0bSgnaDIuc3VidGl0bGUuaXMtMycsICdTb2RlbHVqb8SNaScpLFxuXHRcdFx0XHRcdC8vIFx0bSgncCcsIG0oJ3VsJywgW1xuXHRcdFx0XHRcdC8vIFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL3pkcnV6ZW5qZS1zZXphbS5zaS9zZXphbVwiLCBcIlpkcnXFvmVuamUgU0VaQU1cIikpLFxuXHRcdFx0XHRcdC8vIFx0XHQvLyBtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly93d3cuZHJ1c3R2by1kbmsuc2lcIiwgXCJETktcIikpLFxuXHRcdFx0XHRcdC8vIFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL3d3dy5kcnVzdHZvLXplbnNrYS1zdmV0b3ZhbG5pY2Euc2lcIiwgXCLFvWVuc2thIHN2ZXRvdmFsbmljYVwiKSksXG5cdFx0XHRcdFx0Ly8gXHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwczovL3d3dy5zaXRpdGVhdGVyLnNpXCIsIFwiU2lUaSBUZWF0ZXIgQlRDIFwiKSksXG5cdFx0XHRcdFx0Ly8gXHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwczovL3d3dy5uaWthLnNpXCIsIFwiTklLQSBSZWNvcmRzXCIpKSxcblx0XHRcdFx0XHQvLyBcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vd3d3LmV1c2EuZXUvcHJvamVjdHMvdm9pY2VcIiwgXCJWb2ljZVwiKSksXG5cblxuXHRcdFx0XHRcdC8vIFx0XHQvLyBtKCdsaScsIG0oJ2FbaHJlZj1cImh0dHA6Ly96ZHJ1emVuamUtc2V6YW0uc2kvc2V6YW0vXCJdJywgJ1pkcnXFvmVuamUgU0VaQU0nKSksXG5cdFx0XHRcdFx0Ly8gXHRcdC8vIG0oJ2xpJywgbSgnYVtocmVmPVwiaHR0cHM6Ly93d3cuZHJ1c3R2by1kbmsuc2kvXCJdJywgJ0ROSycpKSxcblx0XHRcdFx0XHQvLyBcdFx0Ly8gbSgnbGknLCBtKCdhW2hyZWY9XCJodHRwOi8vd3d3LmRydXN0dm8temVuc2thLXN2ZXRvdmFsbmljYS5zaVwiXScsICfFvWVuc2thIHN2ZXRvdmFsbmljYScpKSxcblx0XHRcdFx0XHQvLyBcdFx0Ly8gbSgnbGknLCBtKCdhW2hyZWY9XCJodHRwczovL3d3dy5zaXRpdGVhdGVyLnNpL1wiXScsICdTaVRpIHRlYXRlcicpKSxcblx0XHRcdFx0XHQvLyBcdFx0Ly8gbSgnbGknLCBtKCdhW2hyZWY9XCJodHRwczovL3d3dy5uaWthLnNpL1wiXScsICdOSUtBIFJlY29yZHMnKSksXG5cdFx0XHRcdFx0Ly8gXHRcdC8vIG0oJ2xpJywgbSgnYVtocmVmPVwiaHR0cHM6Ly93d3cuZXVzYS5ldS9wcm9qZWN0cy92b2ljZVwiXScsICdWb2ljZScpKSxcblx0XHRcdFx0XHQvLyBcdF0pKSxcblxuXHRcdFx0XHRcdC8vIFx0bSgnaHInK2IuYm9yZGVyKDApLmgoMSkuYmMoJ3JnYmEoMjU1LDE1NCw1OSwxKScpKSxcblx0XHRcdFx0XHQvLyApKSxcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyAvLyAvLyBQT0RQT1JOSUtJXG5cdFx0XHRcdFx0Ly8gbShcIi50aWxlLmlzLXBhcmVudFwiICsgYi5wKDApLCBtKFwiLnRpbGUuaXMtY2hpbGRcIiArIGIucChcIjAgMS41ZW1cIiksXG5cdFx0XHRcdFx0Ly8gXHRtKCdoMi5zdWJ0aXRsZS5pcy0zJywgJ1BvZHBvcm5pa2knKSxcblx0XHRcdFx0XHQvLyBcdG0oJ3AnLCBtKCd1bCcrYi5saXN0U3R5bGUoXCJub25lXCIpLCBbXG5cdFx0XHRcdFx0Ly8gXHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vd3d3LmZpbmlvZ2xhc2kuY29tXCIsIFwiRklOSSBvZ2xhc2lcIikpLFxuXHRcdFx0XHRcdC8vIFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly93d3cuYWt0b24ubmV0Ly5zaS9cIiwgXCJBa3RvbiBkLm8uby5cIikpLFxuXHRcdFx0XHRcdC8vIFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL0xlcGFab2dhXCIsIFwiTGVwYSDFvW9nYVwiKSksXG5cdFx0XHRcdFx0Ly8gXHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vd3d3LnNsb3ZlbmlhLWV4cGxvcmVyLmNvbVwiLCBcIlNsb3ZlbmlhIEV4cGxvcmVyXCIpKSxcblx0XHRcdFx0XHQvLyBcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vd3d3LnNwb3J0bmEtbG90ZXJpamEuc2lcIiwgXCLFoHBvcnRuYSBsb3RlcmlqYVwiKSksXG5cdFx0XHRcdFx0Ly8gXHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vd3d3LnNuYWdhLnNpXCIsIFwiU25hZ2EgTGp1YmxqYW5hXCIpKSxcblxuXG5cdFx0XHRcdFx0Ly8gXHRcdC8vIG0oJ2xpJywgbSgnYVtocmVmPVwiaHR0cDovL3d3dy5maW5pb2dsYXNpLmNvbS9cIl0nLCAnRklOSSBvZ2xhc2knKSksXG5cdFx0XHRcdFx0Ly8gXHRcdC8vIG0oJ2xpJywgbSgnYVtocmVmPVwiaHR0cHM6Ly93d3cuYWt0b24ubmV0Ly5zaS9cIl0nLCAnQWt0b24gZC5vLm8uJykpLFxuXHRcdFx0XHRcdC8vIFx0XHQvLyBtKCdsaScsIG0oJ2FbaHJlZj1cImh0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9MZXBhWm9nYS9cIl0nLCAnTGVwYSDFvW9nYScpKSxcblx0XHRcdFx0XHQvLyBcdFx0Ly8gbSgnbGknLCBtKCdhW2hyZWY9XCJodHRwOi8vd3d3LnNsb3ZlbmlhLWV4cGxvcmVyLmNvbS9cIl0nLCAnU2xvdmVuaWFuIEV4cGxvcmVyJykpLFxuXHRcdFx0XHRcdC8vIFx0XHQvLyBtKCdsaScsIG0oJ2FbaHJlZj1cImh0dHBzOi8vd3d3LnNwb3J0bmEtbG90ZXJpamEuc2kvXCJdJywgJ8WgcG9ydG5hIGxvdGVyaWphIFNsb3ZlbmlqZScpKSxcblx0XHRcdFx0XHQvLyBcdFx0Ly8gbSgnbGknLCBtKCdhW2hyZWY9XCJodHRwOi8vd3d3LnNuYWdhLnNpL1wiXScsICdTbmFnYSBManVibGphbmEnKSksXG5cdFx0XHRcdFx0Ly8gXHRdKSksXG5cdFx0XHRcdFx0Ly8gXHRtKCdocicrYi5ib3JkZXIoMCkuaCgxKS5iYygncmdiYSgyNTUsMTU0LDU5LDEpJykpLFxuXHRcdFx0XHRcdC8vICkpLFxuXG5cdFx0XHRcdFx0Ly8gLy8gTUVESUpTS0EgUE9EUE9SQVxuXHRcdFx0XHRcdC8vIG0oXCIudGlsZS5pcy1wYXJlbnRcIiArIGIucCgwKS5wYWRkaW5nQm90dG9tKFwiMWVtXCIpLCBtKFwiLnRpbGUuaXMtY2hpbGRcIiArIGIucChcIjAgMS41ZW1cIiksXG5cdFx0XHRcdFx0Ly8gXHRtKCdoMi5zdWJ0aXRsZS5pcy0zJywgJ01lZGlqc2thIHBvZHBvcmEnKSxcblx0XHRcdFx0XHQvLyBcdG0oJy4nLCBtKCd1bCcsIFtcblxuXHRcdFx0XHRcdC8vIFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly93d3cuZXZlbnRpbS5zaS9zaVwiLCBcImV2ZW50aW0uc2lcIikpLFxuXHRcdFx0XHRcdC8vIFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly9pbmZvLmRlbG8uc2kvXCIsIFwiRGVsbyBSZXZpamVcIikpLFxuXHRcdFx0XHRcdC8vIFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly9yYWRpb3N0dWRlbnQuc2kvXCIsIFwiUmFkaW8gxaB0dWRlbnRcIikpLFxuXHRcdFx0XHRcdC8vIFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL21lZGlhYnVzLnNpXCIsIFwiTWVkaWEgQnVzXCIpKSxcblx0XHRcdFx0XHQvLyBcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHA6Ly96YXNsb24uc2kvXCIsIFwiWmFzbG9uLnNpXCIpKSxcblx0XHRcdFx0XHQvLyBcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHA6Ly90YW0tdGFtLnNpXCIsIFwiVEFNLVRBTVwiKSksXG5cdFx0XHRcdFx0Ly8gXHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwczovL3d3dy5ldXJvcGxha2F0LnNpXCIsIFwiRXVyb3BsYWthdFwiKSksXG5cblx0XHRcdFx0XHQvLyBcdFx0Ly8gbSgnbGknLCBtKCdhW2hyZWY9XCJodHRwczovL3d3dy5ldmVudGltLnNpL3NpL1wiXScsICdFdmVudGltJykpLFxuXHRcdFx0XHRcdC8vIFx0XHQvLyBtKCdsaScsIG0oJ2FbaHJlZj1cIiNcIl0nLCAnRGVsbyBSZXZpamUnKSksXG5cdFx0XHRcdFx0Ly8gXHRcdC8vIG0oJ2xpJywgbSgnYVtocmVmPVwiaHR0cHM6Ly9yYWRpb3N0dWRlbnQuc2kvXCJdJywgJ1JhZGlvIMWgdHVkZW50JykpLFxuXHRcdFx0XHRcdC8vIFx0XHQvLyBtKCdsaScsIG0oJ2FbaHJlZj1cImh0dHA6Ly9tZWRpYWJ1cy5zaS9cIl0nLCAnTWVkaWEgQnVzJykpLFxuXHRcdFx0XHRcdC8vIFx0XHQvLyBtKCdsaScsIG0oJ2FbaHJlZj1cImh0dHA6Ly90YW0tdGFtLnNpL1wiXScsICdUQU0tVEFNJykpLFxuXHRcdFx0XHRcdC8vIFx0XHQvLyBtKCdsaScsIG0oJ2FbaHJlZj1cImh0dHBzOi8vd3d3LmV1cm9wbGFrYXQuc2kvXCJdJywgJ0V1cm9wbGFrYXQnKSlcblxuXHRcdFx0XHRcdC8vIFx0XSkpLFxuXHRcdFx0XHRcdC8vIFx0Ly8gbSgnaHInK2IuYm9yZGVyKDApLmgoMSkuYmMoJ3JnYmEoMjU1LDE1NCw1OSwxKScpLm1hcmdpbkJvdHRvbShcIjFlbVwiKSlcblx0XHRcdFx0XHQvLyApKSxcblxuXHRcdFx0XHRcdC8vIG0oJ2hyJytiLmJvcmRlcigwKS5oKDEpLmJjKCdyZ2JhKDI1NSwxNTQsNTksMSknKSksXG5cblx0XHRcdFx0XSlcblx0XHRcdClcblx0XHQpKVxuXHR9XG59XG5cbnZhciBUYWJDb21wID0gZnVuY3Rpb24oKSB7XG5cdHZhciBhY3RpdmVUYWIgPSBzdHJlYW0oMCk7XG5cblx0dmFyIGxpc3QgPSBbXG5cdFx0eyBpZDogJ0Jyb8WhdXJlJywgY29udGVudDogJ0ZpcnN0IHRhYicgfSxcblx0XHR7IGlkOiAnxIxsYW5raScsIGNvbnRlbnQ6ICdTZWNvbmQgdGFiJyB9LFxuXHRcdHsgaWQ6ICdMaXRlcmF0dXJhJywgY29udGVudDogJ1RoaXJkIHRhYicgfSxcblx0XHR7IGlkOiAnVmlkZW8gdnNlYmluZScsIGNvbnRlbnQ6ICdUaGlyZCB0YWInIH1cblx0XTtcblxuXHRmdW5jdGlvbiBvbmluaXQoKSB7XG5cdFx0cmV0dXJuIGxpc3QgPSBsZWFybi5kYXRhO1xuXHR9XG5cblx0ZnVuY3Rpb24gdmlld1RhYih1KXtcblx0XHR2YXIgdHh0ID0gdS5pZFxuXHRcdHZhciBjb250ZW50ID0gdS5jb250ZW50XG5cdFx0bShcImRpdi50YWJcIixbXG5cdFx0XHRtKFwiaWZyYW1lXCIsIHtcInNyY1wiOmxpbmssXCJmcmFtZWJvcmRlclwiOlwiMFwiLFwiYWxsb3dcIjpcImFjY2VsZXJvbWV0ZXI7IGF1dG9wbGF5OyBlbmNyeXB0ZWQtbWVkaWE7IGd5cm9zY29wZTsgcGljdHVyZS1pbi1waWN0dXJlXCIsXCJhbGxvd2Z1bGxzY3JlZW5cIjpcImFsbG93ZnVsbHNjcmVlblwifSksXG5cdFx0XHRtKFwiLmNvbnRlbnRcIiwgdHh0KSxcblx0XHRdKVxuXHR9XG5cblx0ZnVuY3Rpb24gdmlldygpIHtcblx0XHRyZXR1cm4gbShcImRpdlwiLCB7XCJjbGFzc1wiOiBcImNvbHVtbnNcIn0sIG0oXCIudGFic1wiLCBsaXN0Lm1hcCh2aWV3VGFiKSkpO1xuXHR9XG5cblx0cmV0dXJuIHtvbmluaXQ6b25pbml0LCB2aWV3OnZpZXd9O1xufSBcbnZhciBMZWFybjIgPSBUYWJDb21wKClcblxuLy8gVEFCXG52YXIgdGFiQ29udGVudCA9IFtcblx0eyBpZDogJ0Jyb8WhdXJlJywgY29udGVudDogJ0ZpcnN0IHRhYicgfSxcblx0eyBpZDogJ8SMbGFua2knLCBjb250ZW50OiAnU2Vjb25kIHRhYicgfSxcblx0eyBpZDogJ0xpdGVyYXR1cmEnLCBjb250ZW50OiAnVGhpcmQgdGFiJyB9LFxuXHR7IGlkOiAnVmlkZW8gdnNlYmluZScsIGNvbnRlbnQ6ICdUaGlyZCB0YWInIH1cbl07XG5cbi8vIGZ1bmN0aW9uIFRhYnMoKSB7XG4vLyB2YXIgYWN0aXZlVGFiID0gc3RyZWFtKDApO1xuLy8gcmV0dXJuIHtcbi8vIFx0dmlldzogZnVuY3Rpb24odm5vZGUpIHtcbi8vIFx0cmV0dXJuIChcbi8vIFx0XHRtKCcuVGFicycsXG4vLyBcdFx0bSgnLlRhYkJhcicsXG4vLyBcdFx0XHRhdHRycy50YWJzLm1hcChmdW5jdGlvbih0YWIsIGkpIHtcbi8vIFx0XHRcdHJldHVybiBtKCcuVGFiJywge1xuLy8gXHRcdFx0XHRrZXk6IHRhYi5pZCxcbi8vIFx0XHRcdFx0Y2xhc3NOYW1lOiBhY3RpdmVUYWIoKSA9PT0gaSA/ICdhY3RpdmUnIDogJycsXG4vLyBcdFx0XHRcdG9uY2xpY2s6IGZ1bmN0aW9uKCkgeyBhY3RpdmVUYWIoaSk7IH1cbi8vIFx0XHRcdH0sIHRhYi5pZClcbi8vIFx0XHRcdH0pXG4vLyBcdFx0KSxcbi8vIFx0XHRtKCcuVGFiQ29udGVudCcsIGF0dHJzLnRhYnNbYWN0aXZlVGFiKCldLmNvbnRlbnQpXG4vLyBcdFx0KVxuLy8gXHQpO1xuLy8gXHR9XG4vLyB9O1xuLy8gfVxuXG52YXIgTGVhcm4gPSB7XG5cdHZpZXc6IGZ1bmN0aW9uKHZub2RlKSB7XG5cdFx0cmV0dXJuIG0oTWFpbiwgbSgnLmNvbnRhaW5lcicgKyBiLmJjKFwiI2ZmZmZmZlwiKSxcblx0XHRcdG0oXCJjb2x1bW5zXCIsIFxuXHRcdFx0XHRtKFwiY29sdW1uXCIsIFtcblxuXHRcdFx0XHRcdG0oXCIudGlsZS5pcy1wYXJlbnQuaGFzLXRleHQtY2VudGVyZWRcIixcblx0XHRcdFx0XHRcdG0oJ2gxLnRpdGxlLmlzLTIuaXMtdXBwZXJjYXNlLnRpbGUuaXMtY2hpbGQuaXMtMTInLCBcIkl6b2JyYcW+ZXZhbmplXCIpLFxuXHRcdFx0XHRcdCksXG5cblx0XHRcdFx0XHRtKFwiLnRpbGUuaXMtcGFyZW50XCIsIG0oXCIudGlsZS5pcy1jaGlsZFwiICsgYi5wKFwiMCAxLjVlbVwiKSxcblxuXHRcdFx0XHRcdFx0Ly8gbSgnLicgKyBiLmRpc3BsYXkoJ2ZsZXgnKS5qYygnc3BhY2UtYXJvdW5kJykudHQoJ3VwcGVyY2FzZScpLCBbXG5cdFx0XHRcdFx0XHQvLyBcdG0oJ2EuYnV0dG9uJyArIGIuZmxleCgxKSwgJ0Jyb8WhdXJlJyksXG5cdFx0XHRcdFx0XHQvLyBcdG0oJ2EuYnV0dG9uJyArIGIuZmxleCgxKSwgJ8SMbGFua2knKSxcblx0XHRcdFx0XHRcdC8vIFx0bSgnYS5idXR0b24nICsgYi5mbGV4KDEpLCAnTGl0ZXJhdHVyYScpLFxuXHRcdFx0XHRcdFx0Ly8gXHRtKCdhLmJ1dHRvbicgKyBiLmZsZXgoMSksICdWaWRlbyB2c2ViaW5lJylcblx0XHRcdFx0XHRcdC8vIF0pLFxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHQvLyBUT0RPIEFERCBUQUIgIFxuXHRcdFx0XHRcdFx0Ly8gbShUYWJzLCB7IHRhYnM6IHRhYkNvbnRlbnQgfSksXG5cblxuXHRcdFx0XHRcdFx0bSgnaDIuc3VidGl0bGUuaXMtMycsIFwixIxsYW5raSBpbiBzcGxldG5lIHN0cmFuaVwiKSxcblx0XHRcdFx0XHRcdG0oXCJ1bFwiICsgYi5saXN0U3R5bGUoXCJkaXNjIG91dHNpZGVcIikubWFyZ2luTGVmdChcIjJlbVwiKSxcblxuXHRcdFx0XHRcdFx0XHQvLyBCUk/FoFVSRVxuXHRcdFx0XHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiLi9hc3NldHMvZG9jLzAxLVRleHRfQnJvc3VyYV9UamHFoWFfSG9ydmF0X0ROS18yMDE5XzAyXzEwLnBkZlwiLCBcIlRqYcWhYSBIcm92YXQgRE5LOiBWc2ViaW5hIFpsb8W+ZW5rZSBWU0FLNS5cIikpLCAvLyBUT0RPIFByZWltZW51aiBicnVzdXJvIEhyb3ZhdFxuXHRcdFx0XHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiLi9hc3NldHMvZG9jLzA2LTIwMDdfTU5aX1BvbGljaWphX1NQT0xOT19OQVNJTEpFLnBkZlwiLCBcIk1OWiBQb2xpY2lqYTogU3BvbG5vIE5hc2lsamVcIikpLFxuXG5cdFx0XHRcdFx0XHRcdC8vXG5cdFx0XHRcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwczovL3d3dy5wb3J0YWxwbHVzLnNpLzE2MDMvamVzZW5pc2thLWRla2xpY2FcIiwgXCJLYXRqYSBLbmV6IFN0ZWluYnVjaDogJ0VuYSBwbyByaXRpJyBqZSB6YSBTbG92ZW5jZSBuZWthaiBzcHJlamVtbGppdmVnYSwgbm9ybWFsbmVnYSBpbiB2emdvam5lZ2EuIFBvcnRhbCBQbHVzLCA1LiA3LiAyMDE2LlwiKSksXG5cdFx0XHRcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwczovL3d3dy5ydHZzbG8uc2kvc2xvdmVuaWphL3BlZG9maWxpamEta2RvLXNpLXphdGlza2Etb2NpLzI1NTcxMVwiLCBcIkEuIE11LjogUGVkb2ZpbGlqYToga2RvIHNpIHphdGlza2Egb8SNaT8gTU1DIFJUViBTTE8sIDE5LiA0LiAyMDExLlwiKSksXG5cdFx0XHRcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vbm92aWNlLnN2ZXQyNC5zaS9jbGFuZWsvbm92aWNlL3Nsb3ZlbmlqYS81NmM1ZmY0YTg2YjliL3JhemdhbGphbmplLWludGltZS1wcmVkLXJhem5pbWktbmV6bmFuY2lcIiwgXCJUaW5hIFJlY2VrOiBNYW1hIHNwb2xubyB6bG9yYWJsamVuZWdhIG90cm9rYTogT3Ryb2sgc2UgamUgdHJlc2VsLCBwb3RpbCwgc2UgbWUgb2tsZXBhbC4gTWVkaWEgMjQsIDE5LiAyLiAyMDE2LlwiKSksXG5cdFx0XHRcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vd3d3LjI0dXIuY29tL25vdmljZS9zbG92ZW5pamEvcG8tdGFrc25pLWl6Z3ViaS1uaS1jbG92ZWstbmlrb2xpLXZlYy1pc3RpLWdyZGktbmV6bmFuZWMtdi10ZW1uaS11bGljaS1qZS1pbWVsLXpuYW4tb2JyYXouaHRtbFwiLCBcIk5hdGFsaWphIMWgdmFiOiBQbyB0YWvFoW5pIGl6Z3ViaSBuaSDEjWxvdmVrIG5pa29saSB2ZcSNIGlzdGk6IEdyZGkgbmV6bmFuZWMgdiB0ZW1uaSB1bGljaSBqZSBpbWVsIHpuYW4gb2JyYXouIDI0dXIsIDI2LiA5LiAyMDE0LlwiKSksXG5cdFx0XHRcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwczovL3d3dy5kbmV2bmlrLnNpLzEwNDI3MjU4NTIvbGp1ZGplL25lemEtbWlrbGljLWRvbGdvbGV0bmEtcHJlaXNrb3ZhbGthLXNwb2xuaWgtemxvcmFiLW90cm9rLXBlZG9maWxpLWl6a29yaXNjYWpvLXRhYnVqZVwiLCBcIlBldGVyIExvdsWhaW46IE5lxb5hIE1pa2xpxI0sIGRvbGdvbGV0bmEgcHJlaXNrb3ZhbGthIHNwb2xuaWggemxvcmFiIG90cm9rOiBQZWRvZmlsaSBpemtvcmnFocSNYWpvIHRhYnVqZS4gRG5ldm5paywgMi4gMTIuIDIwMTUuXCIpKSxcblx0XHRcdFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHA6Ly9qYXpzZW12cmVkdS5zaS9mb3J1bS9uYXNlLW90cm9zdHZvL2thbS1uYXMtcHJpcGVsamVqby16bG9yYWJlLXYtb3Ryb3N0dnUtdDY0Lmh0bWxcIiwgXCJLYW0gbmFzIHByaXBlbGplam8gemxvcmFiZSB2IG90cm/FoXR2dS4gRm9ydW0gamF6c2VtdnJlZHUsIDI2LiA2LiAyMDEwLlwiKSksXG5cdFx0XHRcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vd3d3LmRlbG8uc2kvbm92aWNlL2tyb25pa2EvdnNha2EtcGV0YS1vdHJvc2thLXpydGV2LXNwb2xuZS16bG9yYWJlLXN0YXJhLW1hbmota290LXNlZGVtLWxldC5odG1sXCIsIFwiTWloYWVsIEtvcnNpa2E6IFZzYWthIHBldGEgb3Ryb8Wha2Egxb5ydGV2IHNwb2xuZSB6bG9yYWJlIG5hIGludGVybmV0dSBzdGFyYSBtYW5qIGtvdCBzZWRlbSBsZXQuIERlbG8sIDI5LiA5LiAyMDE2LlwiKSksXG5cdFx0XHRcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vd3d3Lm1pbGVuYW1hdGtvLmNvbS9zcG9sbmUtemxvcmFiZVwiLCBcIk1pbGVuYSBNYXRrbzogU3BvbG5lIHpsb3JhYmUuIFBvdCBzcmNhLCAyMC4gMi4gMjAxNy5cIikpLFxuXHRcdFx0XHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly9nb3Zvcmkuc2UvZG9nb2RraS9zcG9sbm8temxvcmFibGphbmplLW90cm9rLW5lLXNtZS1vc3RhdGktdGFidS9cIiwgXCJUYW5qYSDFoGtldDogU3BvbG5vIHpsb3JhYmxqYW5qZSBvdHJvayBuZSBzbWUgb3N0YXRpIHRhYnUhIEdvdm9yaS5zZSwgMTYuIDExLiAyMDE1LlwiKSksXG5cdFx0XHRcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwczovL3d3dy5wb3J0YWxwbHVzLnNpLzI4NTUvby1rYXRvbGlza2ktY2Vya3ZpLWluLXBlZG9maWxpamlcIiwgXCJEZWphbiBTdGVpbmJ1Y2g6IEthdG9sacWha2EgY2Vya2V2IG5hIFNsb3ZlbnNrZW0gaW4gdnByYcWhYW5qZSBwZWRvZmlsaWplIG1lZCBkdWhvdsWhxI1pbm8uIFBvcnRhbCBQbHVzLCAxOS4gOC4gMjAxOC5cIikpLFxuXHRcdFx0XHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly93d3cub25hcGx1cy5zaS9wZWRvZmlsc2tlLW1yZXplLXNjaXRpam8tbmFqdnBsaXZuZWpzaS1wb2xpdGlraVwiLCBcIkthdGphIENhaDogUGVkb2ZpbHNrZSBtcmXFvmUgxaHEjWl0aWpvIG5hanZwbGl2bmVqxaFpIHBvbGl0aWtpLiBPbmFQbHVzLCAzMC4gOC4gMjAxNy5cIikpLFxuXHRcdFx0XHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL3d3dy5iZWdhbi5zaS8yMDE4LzAyLzE2L3BlZG9maWxza2ktb2Jyb2Mtb2tvbGktcGFwZXphLWZyYW5jaXNrYS1zZS16YXRlZ3VqZVwiLCBcIlZsYWRvIEJlZ2FuOiBQZWRvZmlsc2tpIG9icm/EjSBva29saSBwYXBlxb5hIEZyYW7EjWnFoWthIHNlIHphdGVndWplLiBDZXJrdmVubyBrcml0acSNbmUga25qaWdlLCAxNi4gMi4gMjAxOC5cIikpLFxuXHRcdFx0XHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly93d3cuc3BsZXRuby1va28uc2kvbm92aWNlL21vai1taWtyby1vLXBlZG9maWxpamlcIiwgXCJNb2ogTWlrcm8gbyBwZWRvZmlsaWppLiBTcGxldG5vIG9rbywgNC4gMS4gMjAxMC5cIikpLFxuXHRcdFx0XHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly9zbG8tdGVjaC5jb20vbm92aWNlL3Q1ODY2NTRcIiwgXCJNYXRlaiBIdcWhOiBOaXpvemVtc2tpIHJhemlza292YWxjaSB6IHZpcnR1YWxubyBkZWtsaWNvIG9ka3JpbGkgdmXEjSB0aXNvxI0gc3BsZXRuaWggcGVkb2ZpbG92LiBTbG9UZWNoLCA2LiAxMS4gMjAxMy5cIikpLFxuXHRcdFx0XHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly9jYXNvcmlzLnNpL2tha28tZ292b3JpdGktby1uZXByaW1lcm5paC1kb3Rpa2loXCIsIFwiU29uamE6IEtha28gZ292b3JpdGkgbyBuZXByaW1lcm5paCBkb3Rpa2loLiDEjGFzb3JpcywgMTIuIDYuIDIwMTYuXCIpKSxcblx0XHRcdFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vd3d3LmI5Mi5uZXQvemRyYXZsamUvdmVzdGkucGhwP3l5eXk9MjAxOCZtbT0xMCZkZD0wNCZuYXZfaWQ9MTQ1MTc3N1wiLCBcIlpsb3N0YXZsamFuamUgZGXEjWFrYSBvc3RhdmxqYSBvxb5pbGprZSB1IG5qaWhvdm9tIEROSywgcG9rYXphbGEgc3R1ZGlqYS4gQjkyLCA0LiAxMC4gMjAxOC5cIikpLFxuXHRcdFx0XHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly93d3cuZGVsby5zaS9ub3ZpY2Uvc2xvdmVuaWphL3Nwb2xuYS16bG9yYWJhLW5pLWxlLXpsby1qZS16bG9jaW4uaHRtbD9pc2thbG5paz1LYXRhcmluYSUyME1hdGtvJlBIUFNFU1NJRD0xZjhhMjAxMmM0MDgwZjUwMDlmYjFlODUyOWJiMGZmMVwiLCBcIk1hamEgRmFiamFuOiBTcG9sbmEgemxvcmFiYSBuaSBsZSB6bG8sIGplIHpsb8SNaW4uIERlbG8gMTcuIDExLiAyMDE1LlwiKSksXG5cdFx0XHRcdFx0XHRcdFxuXG5cdFx0XHRcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCIuL2Fzc2V0cy9kb2MvMDMtMjAxNy1wcmVwcmVjZXZhbmplaW5wcmVwb3puYXZhbmplc3BvbG5paHpsb3JhYm90cm9rLnBkZlwiLCBcIkROSzogUHJlcHJlxI1ldmFuamUgaW4gcHJlcG96bmF2YW5qZSBzcG9sbmloIHpsb3JhYiBvdHJvay4gTmFqcG9nb3N0ZWrFoWEgdnByYcWhYW5qYSBpbiBvZGdvdm9yaSBuYW5qZS4sIFB1Ymxpa2FjaWphLCAyMDE2LlwiKSksXG5cdFx0XHRcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCIuL2Fzc2V0cy9kb2MvMDQtMjAxNS1zdmV0b3ZhbG5pY2F6YXpydHZlc3BvbG5lZ2FuYXNpbGphLnBkZlwiLCBcIkROSzogT2dsYXMgemEgc3ZldG92YWxuaWNvLCAyMDE4LlwiKSksXG5cdFx0XHRcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCIuL2Fzc2V0cy9kb2MvMDUtVU5JX09zb2puaWtfVmVzbmFfMjAxMXNwb2xuZSB6bG9yYWJlLnBkZlwiLCBcIlZlc25hIE9zb2puaWs6IFNwb2xuYSB6bG9yYWJhIG90cm9rLiBEaXBsb21za28gZGVsbywgMjAxMS5cIikpLFxuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHQpKSxcblxuXHRcdFx0XHRcdG0oXCJcIiArIGIucCgwKS5wYWRkaW5nQm90dG9tKFwiMWVtXCIpLCBtKFwiXCIgKyBiLnAoXCIwIDEuNWVtXCIpLFxuXHRcdFx0XHRcdFx0bSgnaDIuc3VidGl0bGUuaXMtMycsICdWaWRlbyB2c2ViaW5lJyksXG5cdFx0XHRcdFx0XHQvLyBtKFwiaWZyYW1lW2FsbG93PSdhY2NlbGVyb21ldGVyOyBhdXRvcGxheTsgZW5jcnlwdGVkLW1lZGlhOyBneXJvc2NvcGU7IHBpY3R1cmUtaW4tcGljdHVyZSddW2FsbG93ZnVsbHNjcmVlbj0nJ11bZnJhbWVib3JkZXI9JzAnXVtoZWlnaHQ9JzMxNSddW3NyYz0naHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvY25pQ2trd0Q2OW8nXVt3aWR0aD0nNTYwJ11cIiksXG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdG0oVmlkZW8pLFxuXG5cdFx0XHRcdFx0XHRtKFwidWxcIiArIGIubGlzdFN0eWxlKFwiZGlzYyBvdXRzaWRlXCIpLm1hcmdpbkxlZnQoXCIyZW1cIiksIFtcblx0XHRcdFx0XHRcdFx0Ly8gbSgnbGknLCBtKCdhW2hyZWY9XCJodHRwOi8vNGQucnR2c2xvLnNpL2FyaGl2L29kbWV2aS8xMzQ4MjAxNDJcIl0nLCAnUlRWIFNsbyBPZG1ldmknKSksXG5cdFx0XHRcdFx0XHRcdC8vIG0oJ2xpJywgbSgnYVtocmVmPVwiaHR0cHM6Ly80ZC5ydHZzbG8uc2kvYXJoaXYvZG9zamUvMTM0ODE5MDc4XCJdJywgJ05pa29tdXIgbmUgc21lxaEgcG92ZWRhdGknKSksXG5cdFx0XHRcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vNGQucnR2c2xvLnNpL2FyaGl2L29kbWV2aS8xMzQ4MjAxNDJcIiwgXCJTcG9sbmUgemxvcmFiZSBvdHJvayBzZSBkb2dhamFqbyB2ZcSNa3JhdCwga290IHNpIG1pc2xpbW8uIFJUViA0RCwgMjQuIDQuIDIwMTIuXCIpKSxcblx0XHRcdFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vNGQucnR2c2xvLnNpL2FyaGl2L2Rvc2plLzEzNDgxOTA3OFwiLCBcIkplbGVuYSBBxaHEjWnEhzogTmlrb211ciBuZSBzbWXFoSBwb3ZlZGF0aS4gUlRWIDRELCAyNC4gNC4gMjAxMi5cIikpLFxuXHRcdFx0XHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cHM6Ly80ZC5ydHZzbG8uc2kvYXJoaXYvZG9icm8tanV0cm8vMTc0NTkxOTExXCIsIFwiU3BvbG5lIHpsb3JhYmUgb3Ryb2sgUlRWIDREIDI5LiAxLiAyMDE5XCIpKVxuXHRcdFx0XHRcdFx0XSlcblx0XHRcdFx0XHQpKVxuXHRcdFx0XHRdXG5cdFx0XHQpXG5cdFx0KSkpXG5cdH1cbn1cblxudmFyIEhlbHAgPSB7XG5cdHZpZXc6IGZ1bmN0aW9uKHZub2RlKSB7XG5cdFx0cmV0dXJuIG0oTWFpbiwgbSgnLmNvbnRhaW5lcicgKyBiLmJjKFwiI2ZmZmZmZlwiKSxcblx0XHRcdG0oXCJjb2x1bW5zXCIsIFxuXHRcdFx0XHRtKFwiY29sdW1uXCIsIFtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRtKFwiLnRpbGUuaXMtcGFyZW50Lmhhcy10ZXh0LWNlbnRlcmVkXCIsXG5cdFx0XHRcdFx0XHRtKCdoMS50aXRsZS5pcy1zaXplLTIuaXMtdXBwZXJjYXNlLnRpbGUuaXMtY2hpbGQuaXMtMTInLCBcIktha28gdWtyZXBhdGlcIiksXG5cdFx0XHRcdFx0KSxcblxuXHRcdFx0XHRcdG0oXCIudGlsZS5pcy1wYXJlbnRcIiwgbShcIi50aWxlLmlzLWNoaWxkXCIgKyBiLnAoXCIwIDEuNWVtXCIpLFxuXHRcdFx0XHRcdFx0bSgnaDIuc3VidGl0bGUuaXMtMycsIFwiS2FrbyB1a3JlcGF0aSB2IHByaW1lcnUgc3VtYSB6bG9yYWJlP1wiKSxcblx0XHRcdFx0XHRcdG0oJ3AnLCBtKCd1bCcgKyBiLmxpc3RTdHlsZShcImRpc2Mgb3V0c2lkZVwiKS5tYXJnaW5MZWZ0KFwiMmVtXCIpLFtcblx0XHRcdFx0XHRcdFx0bSgnbGknLCdOZSBqZXppdGUgc2UgbmEgb3Ryb2thLicpXG5cdFx0XHRcdFx0XHRcdCxtKCdsaScsJ05lIGRhanRlIG11IHZ0aXNhLCBkYSBqZSBzdG9yaWwga2FqIG5hcm9iZS4nKVxuXHRcdFx0XHRcdFx0XHQsbSgnbGknLCdOZSB6YXNsacWhdWp0ZSBnYS4nKVxuXHRcdFx0XHRcdFx0XHQsbSgnbGknLCdWcHJhxaFhanRlLCBrYWogc2UgamUgemdvZGlsbywga2plIGluIHMga29tLCBuZSBwYSB0dWRpIHpha2FqLicpXG5cdFx0XHRcdFx0XHRcdCxtKCdsaScsJ1ByZWQgbmppbSBzZSBuZSB2em5lbWlyamFqdGUuIE90cm9jaSBzZSBoaXRybyBwb8SNdXRpam8ga3JpdmUsIHphcmFkaSDEjWVzYXIgdGXFvmtvIHNwcmVnb3Zvcmlqby4nKVxuXHRcdFx0XHRcdFx0XHQsbSgnbGknLCdOZSBza2xlcGFqdGUgcHJlaGl0cm8sIMWhZSBwb3NlYmVqIMSNZSBzbyBpbmZvcm1hY2lqZSBza29wZSBhbGkgbmVqYXNuZS4nKVxuXHRcdFx0XHRcdFx0XHQsbSgnbGknLCdPdHJva3UgemFnb3Rvdml0ZSwgZGEgYm9zdGUgdWtyZXBhbGkuIE9icm5pdGUgc2UgbmEgb3NlYm8sIGtpIGxhaGtvIHBvbWFnYSwgbmEgcHJpbWVyIG5hIHBzaWhvbG9nYSwgemRyYXZuaWthLCBzb2NpYWxuZWdhIGRlbGF2Y2EgYWxpIHBvbGljaWpvLicpXG5cdFx0XHRcdFx0XHRdKSksXG5cdFx0XHRcdFx0XHRtKCdocicrYi5ib3JkZXIoMCkuaCgxKS5iYygncmdiYSgyNTUsMTU0LDU5LDEpJykpLFxuXHRcdFx0XHRcdCkpLFxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdG0oXCIudGlsZS5pcy1wYXJlbnRcIiArIGIucCgwKS5wYWRkaW5nQm90dG9tKFwiMWVtXCIpLCBtKFwiLnRpbGUuaXMtY2hpbGRcIiArIGIucChcIjAgMS41ZW1cIiksXG5cdFx0XHRcdFx0XHRtKCdoMi5zdWJ0aXRsZS5pcy0zJywgJ05hIGtvZ2Egc2Ugb2Jybml0aScpLFxuXHRcdFx0XHRcdFx0bSgndWwnK2IubGlzdFN0eWxlKFwibm9uZVwiKS5tYXJnaW5MZWZ0KFwiMWVtXCIpLCBbXG5cdFx0XHRcdFx0XHRcdG0oJ2xpJywgbSgnLnRpdGxlLmlzLXNpemUtNScsIFsnUG9saWNpamEgJywgbSgnc3BhbicrYi5jb2xvcihcIiM5OTAwMDBcIiksJzExMycpLCAnIGFsaSAwODAgMTIwMCddKSksXG5cdFx0XHRcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vd3d3LmRydXN0dm8tc29zLnNpXCIsIFwiU09TIHRlbGVmb24gKDA4MCAxMTU1KVwiKSksXG5cdFx0XHRcdFx0XHRcdG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vd3d3LmUtdG9tLnNpXCIsIFwiVE9NIHRlbGVmb24gKDExNiAxMTEpXCIpKSxcblx0XHRcdFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vd3d3LmRydXN0dm8tZG5rLnNpXCIsIFwiRHJ1xaF0dm8gemEgbmVuYXNpbG5vIGtvbXVuaWthY2lqbyAoMDEgNDM0NDgyMiB2IExqdWJsamFuaSBhbGkgMDUgNjM5MzE3MCBpbiAwMzEgNTQ2MDk4IHYgS29wcnUpXCIpKSxcblx0XHRcdFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHA6Ly93d3cuZHJ1c3R2by16ZW5za2Etc3ZldG92YWxuaWNhLnNpXCIsIFwixb1lbnNrYSBzdmV0b3ZhbG5pY2EgKDAzMSAyMzMyMTEpXCIpKSxcblx0XHRcdFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHBzOi8vZmRpbnN0aXR1dC5zaVwiLCBcIkZyYW7EjWnFoWthbnNraSBkcnXFvmluc2tpIGluxaF0aXR1dCAoMDEgMjAwNjc2MCBhbGkgMDQwIDg2Mzk4NilcIikpLFxuXHRcdFx0XHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL3d3dy5sdW5pbmF2aWxhLnNpXCIsIFwiTHVuaW5hIHZpbGFcIikpLFxuXHRcdFx0XHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL3d3dy5iZWxpb2Jyb2Muc2lcIiwgXCJCZWxpIG9icm/EjSBTbG92ZW5pamVcIikpLFxuXHRcdFx0XHRcdFx0XHRtKFwibGlcIiwgbGlua3RvdGFiKFwiaHR0cDovL3Nwb2xuYS16bG9yYWJhLnNpL2luZGV4LnBocC9kZWphdm5vc3RpLTIvYnJlcGxhY25pLXRlbGVmb25cIiwgXCJaZHJ1xb5lbmplIHByb3RpIHNwb2xuZW11IHpsb3JhYmxqYW5qdSAoMDgwIDI4ODApXCIpKSxcblx0XHRcdFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHA6Ly93d3cuc3BsZXRuby1va28uc2lcIiwgXCJLYW0gcHJpamF2aXRpIG5lemFrb25pdGUgdnNlYmluZVwiKSksXG5cdFx0XHRcdFx0XHRcdC8vIG0oXCJsaVwiLCBsaW5rdG90YWIoXCJodHRwOi8vd3d3Lm5hc3ZldHphbmV0LnNpXCIsIFwiVGVsZWZvbiB6YSBvdHJva2UgaW4gbWxhZG9zdG5pa2UsIGtpIHNlIHpuYWpkZWpvIHYgdGXFvmF2YWggbmEgc3BsZXR1XCIpKSxcblx0XHRcdFx0XHRcdFx0bShcImxpXCIsIGxpbmt0b3RhYihcImh0dHA6Ly93d3cuc2FmZS5zaVwiLCBcIkNlbnRlciB6YSB2YXJuZWrFoWkgaW50ZXJuZXRcIikpLFxuXG5cdFx0XHRcdFx0XHRcdC8vIG0oJ2xpJywgbSgnYScsIHtcInRhcmdldFwiOlwiX2JsYW5rXCIsXCJyZWxcIjpcIm5vb3BlbmVyIG5vcmVmZXJyZXJcIixcImhyZWZcIjpcImh0dHA6Ly93d3cuZS10b20uc2kvXCJ9LCAnVE9NIHRlbGVmb24gKDExNiAxMTEpJykpLFxuXHRcdFx0XHRcdFx0XHQvLyBtKCdsaScsIG0oJ2FbaHJlZj1cImh0dHBzOi8vd3d3LmRydXN0dm8tZG5rLnNpL1wiXScsICdEcnXFoXR2byB6YSBuZW5hc2lsbm8ga29tdW5pa2FjaWpvICgwMSA0MzQ0IDgyMiB2IExqdWJsamFuaSBhbGkgMDUgNjM5MyAxNzAgaW4gMDMxIDU0NiAwOTggdiBLb3BydSknKSksXG5cdFx0XHRcdFx0XHRcdC8vIG0oJ2xpJywgbSgnYScsIHtcInRhcmdldFwiOlwiX2JsYW5rXCIsXCJyZWxcIjpcIm5vb3BlbmVyIG5vcmVmZXJyZXJcIixcImhyZWZcIjpcImh0dHA6Ly93d3cuZHJ1c3R2by16ZW5za2Etc3ZldG92YWxuaWNhLnNpXCJ9LCAnxb1lbnNrYSBzdmV0b3ZhbG5pY2EgKDAzMSAyMzMgMjExKScpKSxcblx0XHRcdFx0XHRcdFx0Ly8gbSgnbGknLCBtKCdhW2hyZWY9XCJodHRwczovL2ZkaW5zdGl0dXQuc2kvXCJdJywgJ0ZyYW7EjWnFoWthbnNraSBkcnXFvmluc2tpIGluxaF0aXR1dCAoMDEgMjAwIDY3IDYwIGFsaSAwNDAgODYzIDk4NiknKSksXG5cdFx0XHRcdFx0XHRcdC8vIG0oJ2xpJywgbSgnYVtocmVmPVwiaHR0cDovL3d3dy5sdW5pbmF2aWxhLnNpL1wiXScsICdMdW5pbmEgdmlsYScpKSxcblx0XHRcdFx0XHRcdFx0Ly8gbSgnbGknLCBtKCdhW2hyZWY9XCJodHRwOi8vd3d3LmJlbGlvYnJvYy5zaVwiXScsICdCZWxpIG9icm/EjSBTbG92ZW5pamUnKSksXG5cdFx0XHRcdFx0XHRcdC8vIG0oJ2xpJywgbSgnYVtocmVmPVwiaHR0cDovL3Nwb2xuYS16bG9yYWJhLnNpL2luZGV4LnBocC9kZWphdm5vc3RpLTIvYnJlcGxhY25pLXRlbGVmb24vXCJdJywgJ1pkcnXFvmVuamUgcHJvdGkgc3BvbG5lbXUgemxvcmFibGphbmp1ICgwODAgMjg4MCknKSksXG5cdFx0XHRcdFx0XHRcdC8vIG0oJ2xpJywgbSgnYVtocmVmPVwiaHR0cDovL3d3dy5zcGxldG5vLW9rby5zaS9cIl0nLCAnS2FtIHByaWphdml0aSBuZXpha29uaXRlIHZzZWJpbmUnKSksXG5cdFx0XHRcdFx0XHRcdC8vIG0oJ2xpJywgbSgnYVtocmVmPVwid3d3Lm5hc3ZldHphbmV0LnNpXCJdJywgJ1RlbGVmb24gemEgb3Ryb2tlIGluIG1sYWRvc3RuaWtlLCBraSBzZSB6bmFqZGVqbyB2IHRlxb5hdmFoIG5hIHNwbGV0dScpKSxcblx0XHRcdFx0XHRcdFx0Ly8gbSgnbGknLCBtKCdhW2hyZWY9XCJodHRwOi8vd3d3LnNhZmUuc2kvXCJdJywgJ0NlbnRlciB6YSB2YXJuZWrFoWkgaW50ZXJuZXQnKSksXG5cdFx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHRcdC8vIG0oJ2hyJytiLmJvcmRlcigwKS5oKDEpLmJjKCdyZ2JhKDI1NSwxNTQsNTksMSknKSksXG5cdFx0XHRcdFx0KSksXG5cblx0XHRcdFx0XSlcblx0XHRcdClcblx0XHQpKVxuXHR9XG59XG5cbnZhciBUZXh0RnJvbnQgPSB7XG5cdHZpZXc6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBtKCdibG9ja3F1b3RlJytiLm1lYXN1cmUuY29sb3IoXCIjZmZmXCIpLmZzKFwiMS4yZW1cIikuZm9udEZhbWlseShcInNlcmlmXCIpLCAnU3ZldG92bmEgemRyYXZzdHZlbmEgb3JnYW5pemFjaWphIG9wb3phcmphLCBkYSBzbyBzcG9sbmUgemxvcmFiZSBvdHJvayB6ZWxvIHBlcmXEjWEgdGVtYSwgc2FqIHJhemlza2F2ZSBrYcW+ZWpvLCBkYSBqZSB2c2FrYSDEjWV0cnRhIGRla2xpY2EgaW4gdnNhayDFoWVzdGkgZGXEjWVrIMW+cnRldiBzcG9sbmUgemxvcmFiZSB2IG90cm/FoXR2dS4gUG8gc3ZldHUgaW4gdiBTbG92ZW5pamkgdnNhayBwZXRpIG90cm9rLCBwcmF2IHpkYWoga28gbyB0ZW0gZ292b3JpbW8sIGRvxb5pdmxqYSBzcG9sbm8gemxvcmFibyBzIHN0cmFuaSBsanVkaSwgb2Iga2F0ZXJpaCDFvml2aSBhbGkgamloIGRuZXZubyBzcmXEjXVqZS4gVG8gc28gxaFva2FudG5pLCBhIMW+YWwsIMWhZSBrYWtvIHJlc25pxI1uaSBwb2RhdGtpIGluIHRlxb5rbyBzaSBqZSBwcmVkc3RhdmxqYXRpLCBkYSBzZSB2IHRha28gcmF6dml0aSBkcnXFvmJpLCB2IG5hIHZpZGV6IG9iacSNYWpuaWggZHJ1xb5pbmFoIGRvZ2FqYWpvIHpsb8SNaW5pIHNwb2xuZWdhIGl6a29yacWhxI1hbmphIGluIHNwb2xuZWdhIHpsb3JhYmxqYW5qYSwga2kgamloIG5lIGJpIHNtZWwgdHJwZXRpIG5vYmVuIG90cm9rIG5hIHRlbSBzdmV0dS4gWmF0byBzbW8gZGFuZXMgdHVrYWosIGRhIHNwcmVnb3ZvcmltbyBpbiBzaSBuZWhhbW8gemF0aXNrYXRpIG/EjWksIHByZWQgdGFrbyBtbm/FvmnEjW5pbSBwb2phdm9tLCBrb3QgamUgc3BvbG5vIGl6a29yacWhxI1hbmplIG90cm9rLiBLb3QgZHJ1xb5iYSBzbW8gb2Rnb3Zvcm5pIHphIG5hxaFlIG90cm9rZS4gVG8gamUgbmVkb3B1c3RubyBpbiBzZSBtb3JhIGtvbsSNYXRpLicpXG5cdH1cbn1cblxuY29uc3QgQXBwID0ge1xuXHR2aWV3OiAoKSA9PiBbXG5cdFx0bSgnLmFwcCcsXG5cdFx0bSgnaDEnLCAnTW9kYWwgRGVtbycpLFxuXHRcdG0oJ3AnLCAnQ2xpY2sgYmVsb3cgdG8gb3BlbiBhIG1vZGFsJyksXG5cdFx0bSgncCcsXG5cdFx0bSgnYnV0dG9uJyxcblx0XHR7XG5cdFx0XHR0eXBlOiAnYnV0dG9uJyxcblx0XHRcdG9uY2xpY2soKSB7XG5cdFx0XHRcdC8vIE9wZW4gYSBtb2RhbCB3aXRoIHRoaXMgY29udGVudC4uLlxuXHRcdFx0XHRvcGVuTW9kYWwoe1xuXHRcdFx0XHRcdHRpdGxlOiAnSGVsbG8gTW9kYWwhJyxcblx0XHRcdFx0XHRjb250ZW50OiAnVGhpcyBpcyBhbiBpbXBlcmF0aXZlIG1vZGFsIGV4YW1wbGUuJyxcblx0XHRcdFx0XHRidXR0b25zOiBbXG5cdFx0XHRcdFx0XHR7aWQ6ICdvaycsIHRleHQ6ICdPayd9LFxuXHRcdFx0XHRcdFx0e2lkOiAnY2FuY2VsJywgdGV4dDogJ0NhbmNlbCd9XG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRvbmNsaWNrKGlkKSB7XG5cdFx0XHRcdFx0XHQvLyBUaGUgbW9kYWwgY2xvc2VzIGF1dG9tYXRpY2FsbHkgd2hlbiBhIGJ1dHRvbiBpcyBjbGlja2VkXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnQ2xpY2tlZCBtb2RhbCBidXR0b24gaWQ6ICcgKyBpZClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0fSxcblx0XHQnT3BlbiBNb2RhbCdcblx0XHQpLFxuXHRcdClcblx0XHQpLFxuXHRcdC8vIFdlIHdhbnQgdG8gcHV0IHRoaXMgbW9kYWwgYXQgdGhlIHRvcCBsZXZlbCBvZiB0aGUgRE9NLCBhZnRlclxuXHRcdC8vIGFsbCBvdGhlciByb290LWxldmVsIG5vZGVzIHNvIGl0IHJlbmRlcnMgb3ZlciBldmVyeXRoaW5nIGVsc2UuXG5cdFx0Ly8gVGhlIGBvcGVuTW9kYWxgIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIGFueXdoZXJlIGluIHRoZSBhcHAsIGJ1dFxuXHRcdC8vIHRoZSBtb2RhbCB3aWxsIGFsd2F5cyBiZSBkcmF3biBoZXJlIHdoZW4gb3Blbi5cblx0XHRtb2RhbElzT3BlbigpICYmIG0oTW9kYWwpXG5cdF1cbn1cblxuLy8gbS5tb3VudChkb2N1bWVudC5ib2R5LCBBcHApXG5tLnJvdXRlKGRvY3VtZW50LmJvZHksICcvYWJvdXQnLCB7XG5cdCcvJzogTWFpbkNvbXAsXG5cdCcvaGVscCc6IEhlbHAsXG5cdC8vICcvZGV2JzogRW50cnlMaXN0LFxuXHQnL21lbnUnOiBOYXZpZ2F0aW9uTWVudSxcblx0Jy9hYm91dCc6IEFib3V0LFxuXHQnL2xlYXJuJzogTGVhcm4sXG5cdCcvZGV2JzogRGV2UGFnZVxufSk7XG5cblxuIl0sIm5hbWVzIjpbImdsb2JhbCIsInJlcXVpcmUkJDAiLCJFbnRyeSIsInN0b3JlIiwiaWRDb3VudGVyIiwiYWxsIiwiY3JlYXRlIiwiYXR0cnMiLCJpZCIsInB1c2giLCJ2bSIsImVudGVyZWRBdCIsInZvbHVudGVlcnMiLCJ2b2x1bnRlZXJWTSIsIm5hbWUiLCJlbWFpbCIsIk5hdmlnYXRpb24iLCJidXR0b25zIiwiYnV0dG9uVk0iLCJsaW5rIiwiS2lkU1ZHIiwidmlldyIsInZub2RlIiwibSIsImIiLCJmaWxsIiwidyIsInRyYW5zaXRpb24iLCJoIiwiJGhvdmVyIiwiTmF2aWdhdGlvbk1lbnUiLCJtYXAiLCJOYXZpZ2F0aW9uVmlldyIsImRhdGUiLCJEYXRlIiwiZGlzcGxheSIsImpjIiwibGlzdFN0eWxlIiwibmF2aWdhdGlvblZpZXciLCJmbGV4IiwidGV4dEFsaWduIiwidHQiLCJmcyIsImZvbnRXZWlnaHQiLCJ3aW5kb3ciLCJWaWRlb0xpYnJhcnkiLCJ2aWRlb3MiLCJ2aWRlb1ZNIiwibGFiZWwiLCJWaWRlbyIsInZpZGVvTGlicmFyeVZpZXciLCJ2aWRlbyIsIm92ZXJmbG93IiwiZ3JpZFRlbXBsYXRlQ29sdW1ucyIsImdyaWRUZW1wbGF0ZVJvd3MiLCIkbWVkaWEiLCJncmlkR2FwIiwidmlkZW9WaWV3IiwiZW50cnkiLCJwb3NpdGlvbiIsInBhZGRpbmdCb3R0b20iLCJ0b3AiLCJsZWZ0IiwiQWJvdXQiLCJlbGVtZW50cyIsImVsZW1lbnRWTSIsIkFib3V0Q29tcCIsIkFib3V0VmlldyIsImRhdGEiLCJzZWN0aW9uVmlldyIsImVsIiwiT3ZlcmxheSIsImRvbSIsImNoaWxkcmVuIiwiT3ZlcmxheUNvbnRhaW5lciIsIm9uY3JlYXRlIiwidiIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNsYXNzTmFtZSIsImJvZHkiLCJhcHBlbmRDaGlsZCIsIm1vdW50Iiwib25iZWZvcmV1cGRhdGUiLCJvbmJlZm9yZXJlbW92ZSIsImNsYXNzTGlzdCIsImFkZCIsIlByb21pc2UiLCJyIiwiYWRkRXZlbnRMaXN0ZW5lciIsIm9ucmVtb3ZlIiwicmVtb3ZlQ2hpbGQiLCJMYXp5TG9hZCIsIm9uaW5pdCIsImluaXRpYWxEYXRhIiwiTW9kYWwiLCJjbGlja2VkSWQiLCJ0aXRsZSIsImNvbnRlbnQiLCJvbkNsb3NlIiwicmVzb2x2ZSIsInRoZW4iLCJyZWRyYXciLCJ0eXBlIiwiZGlzYWJsZWQiLCJvbmNsaWNrIiwidGV4dCIsIk1vZGFsRGVtbyIsInNob3dNb2RhbCIsIkhlbHBDb250YWN0IiwiSGVscENvbnRhY3RDb21wIiwiYmMiLCJIZWxwQ29udGFjdFZpZXciLCJjb250YWN0IiwibWFyZ2luTGVmdCIsImNvbG9yIiwiY29udGFjdHMiLCJoZWxwQ29udGFjdFZpZXciLCJsaW5rdG90YWIiLCJIZWFkZXIiLCJUaXRsZVZpZXciLCJBcnJheSIsImtleXMiLCJraWRWaWV3IiwiU3VidGl0bGVWaWV3IiwidHJhbnNmb3JtIiwidGV4dFRyYW5zZm9ybSIsIm9wYWNpdHkiLCJmb250U2l6ZSIsImMiLCJGb290ZXIiLCIkbmVzdCIsInBhZGRpbmdUb3AiLCJwIiwiYm9yZGVyQm90dG9tIiwiT3JnYW5pemF0aW9uVmlldyIsIlBhcnRpY2lwYW50VmlldyIsIlN1cHBvcnRlclZpZXciLCJNZWRpYVN1cHBvcnRWaWV3IiwiVGFicyIsIkxpc3QiLCJsaXN0SXRlbSIsInNldERlYnVnIiwiRGV2UGFnZSIsIk1haW4iLCJsaW5rdG8iLCJocmVmIiwicm91dGUiLCJoZWxwZXIiLCJtYXhXaWR0aCIsIm1pbldpZHRoIiwiZmFkZUluIiwiJGtleWZyYW1lcyIsImZyb20iLCJzdHlsZSIsInRvIiwiTWFpbkNvbXAiLCJtYXJnaW5Ub3AiLCJUYWJDb21wIiwiYWN0aXZlVGFiIiwic3RyZWFtIiwibGlzdCIsImxlYXJuIiwidmlld1RhYiIsInUiLCJ0eHQiLCJMZWFybjIiLCJMZWFybiIsIkhlbHAiLCJib3JkZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxDQUFDLENBQUMsV0FBVztBQUNiLENBQ0EsU0FBUyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUU7RUFDckQsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDO0VBQ2xNO0NBQ0QsS0FBSyxDQUFDLFNBQVMsR0FBRyxTQUFTLElBQUksRUFBRTtFQUNoQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxLQUFLLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUM7RUFDckgsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxPQUFPLEtBQUssQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLEtBQUssS0FBSyxHQUFHLEVBQUUsR0FBRyxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQztFQUN2SSxPQUFPLElBQUk7R0FDWDtDQUNELEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLGlCQUFpQixDQUFDLFFBQVEsRUFBRTtF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LEVBQUM7R0FDckQ7RUFDRDtDQUNELFNBQVMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFO0VBQ2pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7R0FDdEQsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFDO0dBQ3JDLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUM7R0FDM0M7RUFDRCxLQUFLLElBQUksRUFBRSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO0dBQ2xDLElBQUksU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBQztHQUN0QyxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFDO0dBQ3BELElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFDO0dBQ3pEO0VBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsRUFBQztFQUN2QixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxHQUFFO0VBQ3ZCOztDQUVELFNBQVMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLE9BQU8sT0FBTyxDQUFDLFNBQVMsTUFBTSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztDQUNqRixTQUFTLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFD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
