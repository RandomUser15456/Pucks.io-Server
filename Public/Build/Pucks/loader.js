function createUnityInstance(e, t, r) {
    function n(e) {
        var t = "unhandledrejection" == e.type && "object" == typeof e.reason ? e.reason : "object" == typeof e.error ? e.error : null
          , r = t ? t.toString() : "string" == typeof e.message ? e.message : "string" == typeof e.reason ? e.reason : "";
        if (t && "string" == typeof t.stack && (r += "\n" + t.stack.substring(t.stack.lastIndexOf(r, 0) ? 0 : r.length).replace(/(^\n*|\n*$)/g, "")),
        r && l.stackTraceRegExp && l.stackTraceRegExp.test(r)) {
            var n = e instanceof ErrorEvent ? e.filename : t && "string" == typeof t.fileName ? t.fileName : t && "string" == typeof t.sourceURL ? t.sourceURL : ""
              , o = e instanceof ErrorEvent ? e.lineno : t && "number" == typeof t.lineNumber ? t.lineNumber : t && "number" == typeof t.line ? t.line : 0;
            a(r, n, o)
        }
    }
    function o(e) {
        e.preventDefault()
    }
    function a(e, t, r) {
        if (l.startupErrorHandler)
            return void l.startupErrorHandler(e, t, r);
        if (!(l.errorHandler && l.errorHandler(e, t, r) || (console.log("Invoking error handler due to\n" + e),
        "function" == typeof dump && dump("Invoking error handler due to\n" + e),
        e.indexOf("UnknownError") != -1 || e.indexOf("Program terminated with exit(0)") != -1 || a.didShowErrorMessage))) {
            var e = "An error occurred running the Unity content on this page. See your browser JavaScript console for more info. The error was:\n" + e;
            e.indexOf("DISABLE_EXCEPTION_CATCHING") != -1 ? e = "An exception has occurred, but exception handling has been disabled in this build. If you are the developer of this content, enable exceptions in your project WebGL player settings to be able to catch the exception or see the stack trace." : e.indexOf("Cannot enlarge memory arrays") != -1 ? e = "Out of memory. If you are the developer of this content, try allocating more memory to your WebGL build in the WebGL player settings." : e.indexOf("Invalid array buffer length") == -1 && e.indexOf("Invalid typed array length") == -1 && e.indexOf("out of memory") == -1 && e.indexOf("could not allocate memory") == -1 || (e = "The browser could not allocate enough memory for the WebGL content. If you are the developer of this content, try allocating less memory to your WebGL build in the WebGL player settings."),
            alert(e),
            a.didShowErrorMessage = !0
        }
    }
    function s(e, t) {
        if ("symbolsUrl" != e) {
            var n = l.downloadProgress[e];
            n || (n = l.downloadProgress[e] = {
                started: !1,
                finished: !1,
                lengthComputable: !1,
                total: 0,
                loaded: 0
            }),
            "object" != typeof t || "progress" != t.type && "load" != t.type || (n.started || (n.started = !0,
            n.lengthComputable = t.lengthComputable,
            n.total = t.total),
            n.loaded = t.loaded,
            "load" == t.type && (n.finished = !0));
            var o = 0
              , a = 0
              , s = 0
              , i = 0
              , d = 0;
            for (var e in l.downloadProgress) {
                var n = l.downloadProgress[e];
                if (!n.started)
                    return 0;
                s++,
                n.lengthComputable ? (o += n.loaded,
                a += n.total,
                i++) : n.finished || d++
            }
            var u = s ? (s - d - (a ? i * (a - o) / a : 0)) / s : 0;
            r(.9 * u)
        }
    }
    function i(e) {
        return new Promise(function(t, r) {
            s(e);
            var n = l.companyName && l.productName ? new l.XMLHttpRequest({
                companyName: l.companyName,
                productName: l.productName,
                cacheControl: l.cacheControl(l[e])
            }) : new XMLHttpRequest;
            n.open("GET", l[e]),
            n.responseType = "arraybuffer",
            n.addEventListener("progress", function(t) {
                s(e, t)
            }),
            n.addEventListener("load", function(r) {
                s(e, r),
                t(new Uint8Array(n.response))
            }),
            n.send()
        }
        )
    }
    function d() {
        return new Promise(function(e, t) {
            var r = document.createElement("script");
            r.src = l.frameworkUrl,
            r.onload = function() {
                var t = unityFramework;
                unityFramework = null,
                r.onload = null,
                e(t)
            }
            ,
            document.body.appendChild(r),
            l.deinitializers.push(function() {
                document.body.removeChild(r)
            })
        }
        )
    }
    function u() {
        d().then(function(e) {
            e(l)
        });
        var e = i("dataUrl");
        l.preRun.push(function() {
            l.addRunDependency("dataUrl"),
            e.then(function(e) {
                var t = new DataView(e.buffer,e.byteOffset,e.byteLength)
                  , r = 0
                  , n = "UnityWebData1.0\0";
                if (!String.fromCharCode.apply(null, e.subarray(r, r + n.length)) == n)
                    throw "unknown data format";
                r += n.length;
                var o = t.getUint32(r, !0);
                for (r += 4; r < o; ) {
                    var a = t.getUint32(r, !0);
                    r += 4;
                    var s = t.getUint32(r, !0);
                    r += 4;
                    var i = t.getUint32(r, !0);
                    r += 4;
                    var d = String.fromCharCode.apply(null, e.subarray(r, r + i));
                    r += i;
                    for (var u = 0, c = d.indexOf("/", u) + 1; c > 0; u = c,
                    c = d.indexOf("/", u) + 1)
                        l.FS_createPath(d.substring(0, u), d.substring(u, c - 1), !0, !0);
                    l.FS_createDataFile(d, null, e.subarray(a, a + s), !0, !0, !0)
                }
                l.removeRunDependency("dataUrl")
            })
        })
    }
    r = r || function() {}
    ;
    var l = {
        canvas: e,
        webglContextAttributes: {
            preserveDrawingBuffer: !1
        },
        cacheControl: function(e) {
            return e == l.dataUrl ? "must-revalidate" : "no-store"
        },
        streamingAssetsUrl: "StreamingAssets",
        downloadProgress: {},
        deinitializers: [],
        intervals: {},
        setInterval: function(e, t) {
            var r = window.setInterval(e, t);
            return this.intervals[r] = !0,
            r
        },
        clearInterval: function(e) {
            delete this.intervals[e],
            window.clearInterval(e)
        },
        preRun: [],
        postRun: [],
        print: function(e) {
            console.log(e)
        },
        printErr: function(e) {
            console.error(e)
        },
        locateFile: function(e) {
            return "build.wasm" == e ? this.codeUrl : e
        },
        disabledCanvasEvents: ["contextmenu", "dragstart"]
    };
    for (var c in t)
        l[c] = t[c];
    l.streamingAssetsUrl = new URL(l.streamingAssetsUrl,document.URL).href;
    var f = l.disabledCanvasEvents.slice();
    f.forEach(function(t) {
        e.addEventListener(t, o)
    }),
    window.addEventListener("error", n),
    window.addEventListener("unhandledrejection", n);
    var p = {
        Module: l,
        SetFullscreen: function() {
            return l.SetFullscreen ? l.SetFullscreen.apply(l, arguments) : void l.print("Failed to set Fullscreen mode: Player not loaded yet.")
        },
        SendMessage: function() {
            return l.SendMessage ? l.SendMessage.apply(l, arguments) : void l.print("Failed to execute SendMessage: Player not loaded yet.")
        },
        Quit: function() {
            return new Promise(function(t, r) {
                l.shouldQuit = !0,
                l.onQuit = t,
                f.forEach(function(t) {
                    e.removeEventListener(t, o)
                }),
                window.removeEventListener("error", n),
                window.removeEventListener("unhandledrejection", n)
            }
            )
        }
    };
    return l.SystemInfo = function() {
        function e(e, t, r) {
            return e = RegExp(e, "i").exec(t),
            e && e[r]
        }
        for (var t, r, n, o, a, s, i = navigator.userAgent + " ", d = [["Firefox", "Firefox"], ["OPR", "Opera"], ["Edg", "Edge"], ["SamsungBrowser", "Samsung Browser"], ["Trident", "Internet Explorer"], ["MSIE", "Internet Explorer"], ["Chrome", "Chrome"], ["CriOS", "Chrome on iOS Safari"], ["FxiOS", "Firefox on iOS Safari"], ["Safari", "Safari"]], u = 0; u < d.length; ++u)
            if (r = e(d[u][0] + "[/ ](.*?)[ \\)]", i, 1)) {
                t = d[u][1];
                break
            }
        "Safari" == t && (r = e("Version/(.*?) ", i, 1)),
        "Internet Explorer" == t && (r = e("rv:(.*?)\\)? ", i, 1) || r);
        for (var l = [["Windows (.*?)[;)]", "Windows"], ["Android ([0-9_.]+)", "Android"], ["iPhone OS ([0-9_.]+)", "iPhoneOS"], ["iPad.*? OS ([0-9_.]+)", "iPadOS"], ["FreeBSD( )", "FreeBSD"], ["OpenBSD( )", "OpenBSD"], ["Linux|X11()", "Linux"], ["Mac OS X ([0-9_.]+)", "macOS"], ["bot|google|baidu|bing|msn|teoma|slurp|yandex", "Search Bot"]], c = 0; c < l.length; ++c)
            if (o = e(l[c][0], i, 1)) {
                n = l[c][1],
                o = o.replace(/_/g, ".");
                break
            }
        var f = {
            "NT 5.0": "2000",
            "NT 5.1": "XP",
            "NT 5.2": "Server 2003",
            "NT 6.0": "Vista",
            "NT 6.1": "7",
            "NT 6.2": "8",
            "NT 6.3": "8.1",
            "NT 10.0": "10"
        };
        o = f[o] || o,
        a = document.createElement("canvas"),
        a && (gl = a.getContext("webgl2"),
        glVersion = gl ? 2 : 0,
        gl || (gl = a && a.getContext("webgl")) && (glVersion = 1),
        gl && (s = gl.getExtension("WEBGL_debug_renderer_info") && gl.getParameter(37446) || gl.getParameter(7937)));
        var p = "undefined" != typeof SharedArrayBuffer
          , h = "object" == typeof WebAssembly && "function" == typeof WebAssembly.compile;
        return {
            width: screen.width,
            height: screen.height,
            userAgent: i.trim(),
            browser: t || "Unknown browser",
            browserVersion: r || "Unknown version",
            mobile: /Mobile|Android|iP(ad|hone)/.test(navigator.appVersion),
            os: n || "Unknown OS",
            osVersion: o || "Unknown OS Version",
            gpu: s || "Unknown GPU",
            language: navigator.userLanguage || navigator.language,
            hasWebGL: glVersion,
            hasCursorLock: !!document.body.requestPointerLock,
            hasFullscreen: !!document.body.requestFullscreen,
            hasThreads: p,
            hasWasm: h,
            hasWasmThreads: !1
        }
    }(),
    l.abortHandler = function(e) {
        return a(e, "", 0),
        !0
    }
    ,
    Error.stackTraceLimit = Math.max(Error.stackTraceLimit || 0, 50),
    l.XMLHttpRequest = function() {
        function e(e) {
            console.log("[UnityCache] " + e)
        }
        function t(e) {
            return t.link = t.link || document.createElement("a"),
            t.link.href = e,
            t.link.href
        }
        function r(e) {
            var t = window.location.href.match(/^[a-z]+:\/\/[^\/]+/);
            return !t || e.lastIndexOf(t[0], 0)
        }
        function n() {
            function t(t) {
                if ("undefined" == typeof n.database)
                    for (n.database = t,
                    n.database || e("indexedDB database could not be opened"); n.queue.length; ) {
                        var r = n.queue.shift();
                        n.database ? n.execute.apply(n, r.arguments) : "function" == typeof r.onerror && r.onerror(new Error("operation cancelled"))
                    }
            }
            function r() {
                var e = o.open(s.name, s.version);
                e.onupgradeneeded = function(e) {
                    var t = e.target.result;
                    t.objectStoreNames.contains(d.name) || t.createObjectStore(d.name)
                }
                ,
                e.onsuccess = function(e) {
                    t(e.target.result)
                }
                ,
                e.onerror = function() {
                    t(null)
                }
            }
            var n = this;
            n.queue = [];
            try {
                var o = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
                  , a = o.open(s.name);
                a.onupgradeneeded = function(e) {
                    var t = e.target.result.createObjectStore(i.name, {
                        keyPath: "url"
                    });
                    ["version", "company", "product", "updated", "revalidated", "accessed"].forEach(function(e) {
                        t.createIndex(e, e)
                    })
                }
                ,
                a.onsuccess = function(e) {
                    var n = e.target.result;
                    n.version < s.version ? (n.close(),
                    r()) : t(n)
                }
                ,
                a.onerror = function() {
                    t(null)
                }
            } catch (e) {
                t(null)
            }
        }
        function o(e, t, r, n, o) {
            var a = {
                url: e,
                version: i.version,
                company: t,
                product: r,
                updated: n,
                revalidated: n,
                accessed: n,
                responseHeaders: {},
                xhr: {}
            };
            return o && (["Last-Modified", "ETag"].forEach(function(e) {
                a.responseHeaders[e] = o.getResponseHeader(e)
            }),
            ["responseURL", "status", "statusText", "response"].forEach(function(e) {
                a.xhr[e] = o[e]
            })),
            a
        }
        function a(t) {
            this.cache = {
                enabled: !1
            },
            t && (this.cache.control = t.cacheControl,
            this.cache.company = t.companyName,
            this.cache.product = t.productName),
            this.xhr = new XMLHttpRequest(t),
            this.xhr.addEventListener("load", function() {
                var t = this.xhr
                  , r = this.cache;
                r.enabled && !r.revalidated && (304 == t.status ? (r.result.revalidated = r.result.accessed,
                r.revalidated = !0,
                u.execute(i.name, "put", [r.result]),
                e("'" + r.result.url + "' successfully revalidated and served from the indexedDB cache")) : 200 == t.status ? (r.result = o(r.result.url, r.company, r.product, r.result.accessed, t),
                r.revalidated = !0,
                u.execute(i.name, "put", [r.result], function(t) {
                    e("'" + r.result.url + "' successfully downloaded and stored in the indexedDB cache")
                }, function(t) {
                    e("'" + r.result.url + "' successfully downloaded but not stored in the indexedDB cache due to the error: " + t)
                })) : e("'" + r.result.url + "' request failed with status: " + t.status + " " + t.statusText))
            }
            .bind(this))
        }
        var s = {
            name: "UnityCache",
            version: 2
        }
          , i = {
            name: "XMLHttpRequest",
            version: 1
        }
          , d = {
            name: "WebAssembly",
            version: 1
        };
        n.prototype.execute = function(e, t, r, n, o) {
            if (this.database)
                try {
                    var a = this.database.transaction([e], ["put", "delete", "clear"].indexOf(t) != -1 ? "readwrite" : "readonly").objectStore(e);
                    "openKeyCursor" == t && (a = a.index(r[0]),
                    r = r.slice(1));
                    var s = a[t].apply(a, r);
                    "function" == typeof n && (s.onsuccess = function(e) {
                        n(e.target.result)
                    }
                    ),
                    s.onerror = o
                } catch (e) {
                    "function" == typeof o && o(e)
                }
            else
                "undefined" == typeof this.database ? this.queue.push({
                    arguments: arguments,
                    onerror: o
                }) : "function" == typeof o && o(new Error("indexedDB access denied"))
        }
        ;
        var u = new n;
        a.prototype.send = function(t) {
            var n = this.xhr
              , o = this.cache
              , a = arguments;
            return o.enabled = o.enabled && "arraybuffer" == n.responseType && !t,
            o.enabled ? void u.execute(i.name, "get", [o.result.url], function(t) {
                if (!t || t.version != i.version)
                    return void n.send.apply(n, a);
                if (o.result = t,
                o.result.accessed = Date.now(),
                "immutable" == o.control)
                    o.revalidated = !0,
                    u.execute(i.name, "put", [o.result]),
                    n.dispatchEvent(new Event("load")),
                    e("'" + o.result.url + "' served from the indexedDB cache without revalidation");
                else if (r(o.result.url) && (o.result.responseHeaders["Last-Modified"] || o.result.responseHeaders.ETag)) {
                    var s = new XMLHttpRequest;
                    s.open("HEAD", o.result.url),
                    s.onload = function() {
                        o.revalidated = ["Last-Modified", "ETag"].every(function(e) {
                            return !o.result.responseHeaders[e] || o.result.responseHeaders[e] == s.getResponseHeader(e)
                        }),
                        o.revalidated ? (o.result.revalidated = o.result.accessed,
                        u.execute(i.name, "put", [o.result]),
                        n.dispatchEvent(new Event("load")),
                        e("'" + o.result.url + "' successfully revalidated and served from the indexedDB cache")) : n.send.apply(n, a)
                    }
                    ,
                    s.send()
                } else
                    o.result.responseHeaders["Last-Modified"] ? (n.setRequestHeader("If-Modified-Since", o.result.responseHeaders["Last-Modified"]),
                    n.setRequestHeader("Cache-Control", "no-cache")) : o.result.responseHeaders.ETag && (n.setRequestHeader("If-None-Match", o.result.responseHeaders.ETag),
                    n.setRequestHeader("Cache-Control", "no-cache")),
                    n.send.apply(n, a)
            }, function(e) {
                n.send.apply(n, a)
            }) : n.send.apply(n, a)
        }
        ,
        a.prototype.open = function(e, r, n, a, s) {
            return this.cache.result = o(t(r), this.cache.company, this.cache.product, Date.now()),
            this.cache.enabled = ["must-revalidate", "immutable"].indexOf(this.cache.control) != -1 && "GET" == e && this.cache.result.url.match("^https?://") && ("undefined" == typeof n || n) && "undefined" == typeof a && "undefined" == typeof s,
            this.cache.revalidated = !1,
            this.xhr.open.apply(this.xhr, arguments)
        }
        ,
        a.prototype.setRequestHeader = function(e, t) {
            return this.cache.enabled = !1,
            this.xhr.setRequestHeader.apply(this.xhr, arguments)
        }
        ;
        var l = new XMLHttpRequest;
        for (var c in l)
            a.prototype.hasOwnProperty(c) || !function(e) {
                Object.defineProperty(a.prototype, e, "function" == typeof l[e] ? {
                    value: function() {
                        return this.xhr[e].apply(this.xhr, arguments)
                    }
                } : {
                    get: function() {
                        return this.cache.revalidated && this.cache.result.xhr.hasOwnProperty(e) ? this.cache.result.xhr[e] : this.xhr[e]
                    },
                    set: function(t) {
                        this.xhr[e] = t
                    }
                })
            }(c);
        return a
    }(),
    new Promise(function(e, t) {
        l.SystemInfo.hasWebGL ? l.SystemInfo.hasWasm ? (1 == l.SystemInfo.hasWebGL && l.print('Warning: Your browser does not support "WebGL 2.0" Graphics API, switching to "WebGL 1.0"'),
        l.startupErrorHandler = t,
        r(0),
        l.postRun.push(function() {
            r(1),
            delete l.startupErrorHandler,
            e(p)
        }),
        u()) : t("Your browser does not support WebAssembly.") : t("Your browser does not support WebGL.")
    }
    )
}
