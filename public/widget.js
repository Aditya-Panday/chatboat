(function () {
  "use strict";

  var HOST_SOURCE = "coversall-chat-host";
  var WIDGET_SOURCE = "coversall-chat";
  var STORAGE_KEY = "coversall_visitor_id";
  var IFRAME_ID = "coversall-chat-iframe";

  var LAUNCHER_SIZE = 64;
  var PANEL_WIDTH = 450;
  var PANEL_HEIGHT = 650;
  var EDGE_GAP = 16;
  var MOBILE_BREAKPOINT = 640;

  var script = document.currentScript;
  if (!script || !script.src) {
    return;
  }

  if (document.getElementById(IFRAME_ID)) {
    return;
  }

  var widgetOrigin = new URL(script.src).origin;
  var website = script.getAttribute("data-website") || "coversandall";
  var customerId = script.getAttribute("data-customer-id") || "";
  var customerName = script.getAttribute("data-customer-name") || "";
  var customerEmail = script.getAttribute("data-customer-email") || "";

  if (
    !customerId &&
    window.__COVERSALL_CHAT_CUSTOMER__ &&
    window.__COVERSALL_CHAT_CUSTOMER__.id
  ) {
    customerId = window.__COVERSALL_CHAT_CUSTOMER__.id;
    customerName =
      customerName || window.__COVERSALL_CHAT_CUSTOMER__.name || "";
    customerEmail =
      customerEmail || window.__COVERSALL_CHAT_CUSTOMER__.email || "";
  }

  function trim(text, max) {
    if (!text) return "";
    var value = String(text).replace(/\s+/g, " ").trim();
    return value.length > max ? value.slice(0, max) + "…" : value;
  }

  function textOf(selector) {
    var node = document.querySelector(selector);
    return node ? trim(node.textContent, 300) : "";
  }

  function attr(selector, name) {
    var node = document.querySelector(selector);
    return node ? trim(node.getAttribute(name), 300) : "";
  }

  function getVisitorId() {
    try {
      var existing = window.localStorage.getItem(STORAGE_KEY);
      if (existing) return existing;
      var id = crypto.randomUUID();
      window.localStorage.setItem(STORAGE_KEY, id);
      return id;
    } catch {
      return crypto.randomUUID();
    }
  }

  function inferPageType(url) {
    try {
      var path = new URL(url).pathname.toLowerCase();
      if (path === "/" || path === "") return "HOME";
      if (path.indexOf("/cart") !== -1) return "CART";
      if (path.indexOf("/checkout") !== -1) return "CHECKOUT";
      if (path.indexOf("/account") !== -1 || path.indexOf("/orders") !== -1) {
        return "ACCOUNT";
      }
      if (path.indexOf("/faq") !== -1 || path.indexOf("/help") !== -1) {
        return "FAQ";
      }
      if (
        path.indexOf("/product") !== -1 ||
        path.indexOf("/p/") !== -1 ||
        path.indexOf("/pd/") !== -1 ||
        path.indexOf("/covers/") !== -1
      ) {
        return "PDP";
      }
      if (
        path.indexOf("/collection") !== -1 ||
        path.indexOf("/category") !== -1 ||
        path.indexOf("/shop") !== -1 ||
        path.indexOf("/custom") !== -1
      ) {
        return "COLLECTION";
      }
      return "OTHER";
    } catch {
      return "OTHER";
    }
  }

  function readJsonLdProduct() {
    var result = {
      productId: undefined,
      productName: undefined,
      price: undefined,
      description: undefined,
    };
    var nodes = document.querySelectorAll('script[type="application/ld+json"]');

    for (var i = 0; i < nodes.length; i += 1) {
      try {
        var parsed = JSON.parse(nodes[i].textContent || "{}");
        var items = Array.isArray(parsed) ? parsed : [parsed];
        for (var j = 0; j < items.length; j += 1) {
          var item = items[j];
          if (!item) continue;
          var type = item["@type"];
          var types = Array.isArray(type) ? type : [type];
          if (types.indexOf("Product") === -1) continue;

          result.productName = result.productName || item.name;
          result.productId =
            result.productId || item.sku || item.productID || item.gtin13;
          result.description = result.description || item.description;

          if (item.offers) {
            var offers = Array.isArray(item.offers)
              ? item.offers[0]
              : item.offers;
            if (offers && offers.price) {
              var currency = offers.priceCurrency
                ? offers.priceCurrency + " "
                : "";
              result.price = result.price || currency + offers.price;
            }
          }
        }
      } catch {
        // Ignore malformed JSON-LD.
      }
    }

    return result;
  }

  function readPrice() {
    var selectors = [
      '[itemprop="price"]',
      "[data-product-price]",
      ".price",
      ".product-price",
      ".product__price",
      ".price-item--regular",
    ];
    for (var i = 0; i < selectors.length; i += 1) {
      var value = textOf(selectors[i]) || attr(selectors[i], "content");
      if (value) return value;
    }
    return "";
  }

  function readBreadcrumbs() {
    var crumbs = document.querySelectorAll(
      '[aria-label="breadcrumb"] a, .breadcrumb a, nav.breadcrumbs a, [itemtype*="BreadcrumbList"] [itemprop="name"]',
    );
    if (!crumbs.length) return "";
    var parts = [];
    for (var i = 0; i < crumbs.length && parts.length < 6; i += 1) {
      var label = trim(crumbs[i].textContent, 80);
      if (label) parts.push(label);
    }
    return parts.join(" > ");
  }

  function readCartItems() {
    var selectors = [
      ".cart-item",
      "[data-cart-item]",
      ".cart__item",
      ".mini-cart__item",
      "table.cart tbody tr",
    ];
    for (var i = 0; i < selectors.length; i += 1) {
      var count = document.querySelectorAll(selectors[i]).length;
      if (count > 0) return String(count);
    }
    var badge = textOf("[data-cart-count], .cart-count, .cart-counter");
    return badge || "";
  }

  function buildPageSummary(pageType, signals, product) {
    var parts = ["Visitor is on a " + pageType + " page."];

    if (signals.heading) parts.push("Main heading: " + signals.heading + ".");
    if (product.productName)
      parts.push("Product: " + product.productName + ".");
    if (product.productId)
      parts.push("Product ID/SKU: " + product.productId + ".");
    if (signals.price || product.price) {
      parts.push("Visible price: " + (signals.price || product.price) + ".");
    }
    if (signals.description || product.description) {
      parts.push(
        "Description: " +
          trim(signals.description || product.description, 220) +
          ".",
      );
    }
    if (signals.breadcrumbs)
      parts.push("Breadcrumbs: " + signals.breadcrumbs + ".");
    if (signals.cartItems)
      parts.push("Cart items visible: " + signals.cartItems + ".");

    return parts.join(" ");
  }

  function collectContext() {
    var jsonLd = readJsonLdProduct();
    var productNode = document.querySelector("[data-product-id]");
    var nameNode = document.querySelector("[data-product-name]");
    var ogTitle = document.querySelector('meta[property="og:title"]');
    var pageType = inferPageType(window.location.href);

    var productId =
      (productNode && productNode.getAttribute("data-product-id")) ||
      jsonLd.productId ||
      undefined;
    var productName =
      (nameNode && nameNode.getAttribute("data-product-name")) ||
      jsonLd.productName ||
      (ogTitle && ogTitle.getAttribute("content")) ||
      undefined;

    if (pageType !== "PDP") {
      productId = undefined;
      productName = undefined;
    }

    var signals = {
      heading: textOf("main h1, h1, [data-product-title], .product-title"),
      description:
        attr('meta[name="description"]', "content") ||
        attr('meta[property="og:description"]', "content") ||
        trim(jsonLd.description, 300),
      price: readPrice() || jsonLd.price,
      breadcrumbs: readBreadcrumbs(),
      cartItems: pageType === "CART" ? readCartItems() : "",
      canonicalUrl: attr('link[rel="canonical"]', "href"),
      ogType: attr('meta[property="og:type"]', "content"),
    };

    var pageSummary = buildPageSummary(pageType, signals, {
      productId: productId,
      productName: productName,
      price: jsonLd.price,
      description: jsonLd.description,
    });

    return {
      pageType: pageType,
      url: window.location.href,
      title: document.title,
      productId: productId,
      productName: productName,
      website: website,
      pageSummary: pageSummary,
      pageSignals: signals,
      actions: [],
    };
  }

  function getViewport() {
    var width =
      window.innerWidth || document.documentElement.clientWidth || 1024;
    var height =
      (window.visualViewport && window.visualViewport.height) ||
      window.innerHeight ||
      document.documentElement.clientHeight ||
      800;

    return {
      width: Math.round(width),
      height: Math.round(height),
      isMobile: width <= MOBILE_BREAKPOINT,
    };
  }

  function computeIframeSize(open, viewport) {
    if (!open) {
      return {
        width: LAUNCHER_SIZE + EDGE_GAP * 2,
        height: LAUNCHER_SIZE + EDGE_GAP * 2,
      };
    }

    if (viewport.isMobile) {
      return {
        width: viewport.width,
        height: Math.max(320, Math.round(viewport.height - EDGE_GAP)),
      };
    }

    return {
      width: PANEL_WIDTH + EDGE_GAP * 2,
      height: PANEL_HEIGHT + EDGE_GAP * 2,
    };
  }

  var visitorId = getVisitorId();
  var context = collectContext();
  var iframeReady = false;
  var widgetOpen = false;
  var widgetHidden = false;
  var messageQueue = [];
  var commandQueue = [];
  var eventListeners = Object.create(null);

  var iframe = document.createElement("iframe");
  iframe.id = IFRAME_ID;
  iframe.title = "Covers&All customer support chat";
  iframe.setAttribute("aria-label", "Covers&All chat widget");
  iframe.allow = "clipboard-write";
  iframe.src = widgetOrigin + "/widget?website=" + encodeURIComponent(website);
  iframe.setAttribute(
    "style",
    [
      "position:fixed",
      "right:0",
      "bottom:0",
      "border:0",
      "background:transparent",
      "color-scheme:light",
      "z-index:2147483647",
      "overflow:hidden",
      "pointer-events:auto",
    ].join(";"),
  );

  function sendToIframe(message) {
    if (!iframeReady || !iframe.contentWindow) {
      messageQueue.push(message);
      return;
    }
    iframe.contentWindow.postMessage(message, widgetOrigin);
  }

  function flushMessageQueue() {
    while (messageQueue.length && iframe.contentWindow) {
      iframe.contentWindow.postMessage(messageQueue.shift(), widgetOrigin);
    }
  }

  function post(type, payload) {
    sendToIframe({ source: HOST_SOURCE, type: type, payload: payload });
  }

  function sendCommand(type) {
    var command = { source: HOST_SOURCE, type: type };
    if (!iframeReady) {
      commandQueue.push(command);
      return;
    }
    sendToIframe(command);
  }

  function flushCommandQueue() {
    while (commandQueue.length) {
      sendToIframe(commandQueue.shift());
    }
  }

  function getListenerSet(eventName) {
    if (!eventListeners[eventName]) {
      eventListeners[eventName] = new Set();
    }
    return eventListeners[eventName];
  }

  function emitEvent(eventName, data) {
    var listeners = eventListeners[eventName];
    if (!listeners || !listeners.size) return;
    listeners.forEach(function (callback) {
      try {
        callback(data);
      } catch (error) {
        console.error("[widget] event listener error:", error);
      }
    });
  }

  function applyIframeSize(open) {
    if (widgetHidden) {
      iframe.style.visibility = "hidden";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.pointerEvents = "none";
      return;
    }

    iframe.style.visibility = "visible";
    iframe.style.pointerEvents = "auto";

    var viewport = getViewport();
    var size = computeIframeSize(open, viewport);
    iframe.style.width = size.width + "px";
    iframe.style.height = size.height + "px";
    post("viewport", viewport);
  }

  function syncContext(partial) {
    var fresh = collectContext();
    context = Object.assign({}, fresh, partial || {}, {
      actions: context.actions || [],
    });
    post("setContext", context);
  }

  function applyContext(partial) {
    if (!partial || typeof partial !== "object") return;
    context = Object.assign({}, context, partial, {
      actions: context.actions || [],
    });
    post("setContext", partial);
  }

  window.addEventListener("message", function (event) {
    if (event.origin !== widgetOrigin) return;
    if (event.source !== iframe.contentWindow) return;

    var data = event.data;
    if (!data || data.source !== WIDGET_SOURCE) return;

    if (data.type === "ready") {
      iframeReady = true;
      var viewport = getViewport();
      applyIframeSize(false);
      post("init", {
        visitorId: visitorId,
        context: context,
        website: website,
        viewport: viewport,
        parentOrigin: window.location.origin,
        customer: customerId
          ? {
              id: customerId,
              name: customerName || "Customer",
              email: customerEmail || undefined,
            }
          : undefined,
      });
      flushMessageQueue();
      flushCommandQueue();
      emitEvent("widget_ready", { visitorId: visitorId });
      return;
    }

    if (data.type === "state" && data.payload) {
      widgetOpen = Boolean(data.payload.open);
      applyIframeSize(widgetOpen);
      return;
    }

    if (data.type === "requestContext") {
      syncContext();
      return;
    }

    if (data.type === "event" && data.payload && data.payload.name) {
      emitEvent(data.payload.name, data.payload.data || {});
    }
  });

  var widgetApi = {
    initiateChat: function () {
      widgetHidden = false;
      widgetOpen = true;
      sendCommand("WIDGET_INITIATE_CHAT");
      applyIframeSize(true);
    },

    closeChat: function () {
      widgetHidden = false;
      widgetOpen = false;
      sendCommand("WIDGET_CLOSE_CHAT");
      applyIframeSize(false);
    },

    hideChat: function () {
      widgetHidden = true;
      sendCommand("WIDGET_HIDE_CHAT");
      applyIframeSize(widgetOpen);
    },

    showChat: function () {
      widgetHidden = false;
      sendCommand("WIDGET_SHOW_CHAT");
      applyIframeSize(widgetOpen);
    },

    endChat: function () {
      widgetHidden = false;
      sendCommand("WIDGET_END_CHAT");
    },

    isOpen: function () {
      return widgetOpen && !widgetHidden;
    },

    on: function (eventName, callback) {
      if (typeof callback !== "function") return widgetApi;
      getListenerSet(eventName).add(callback);
      return widgetApi;
    },

    off: function (eventName, callback) {
      var listeners = eventListeners[eventName];
      if (!listeners) return widgetApi;
      listeners.delete(callback);
      return widgetApi;
    },

    setContext: function (partial) {
      applyContext(partial);
      return widgetApi;
    },

    track: function (event) {
      if (!event || !event.event) return widgetApi;
      post("track", {
        event: event.event,
        data: event.data || {},
      });
      return widgetApi;
    },
  };

  if (!window.widget) {
    window.widget = widgetApi;
  }

  window.CoversAllChat = {
    open: function () {
      widgetApi.initiateChat();
    },
    close: function () {
      widgetApi.closeChat();
    },
    setContext: function (partial) {
      widgetApi.setContext(partial);
    },
    track: function (event) {
      widgetApi.track(event);
    },
  };

  function onNavigation() {
    syncContext();
  }

  window.addEventListener("popstate", onNavigation);
  window.addEventListener("hashchange", onNavigation);

  (function patchHistory() {
    var pushState = history.pushState;
    var replaceState = history.replaceState;
    history.pushState = function () {
      var result = pushState.apply(this, arguments);
      onNavigation();
      return result;
    };
    history.replaceState = function () {
      var result = replaceState.apply(this, arguments);
      onNavigation();
      return result;
    };
  })();

  function onViewportChange() {
    applyIframeSize(widgetOpen);
  }

  window.addEventListener("resize", onViewportChange);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onViewportChange);
  }

  function mount() {
    applyIframeSize(false);
    document.body.appendChild(iframe);
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener("DOMContentLoaded", mount);
  }
})();
