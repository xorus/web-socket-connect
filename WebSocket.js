'use strict';
/**
 * Websocket service
 * Created by Xorus on 11/05/15.
 *
 * Helps connecting to a websocket and automatically reconnect to it if the
 * connection gets interrupted.
 *
 * TODO: separate timer update from onSocketDisconnected() call
 *
 * The listener instance must expose :
 * - onSocketConnecting()
 * - onSocketMessage(message)
 * - onSocketDisconnected(statusMessage)
 */

function XorusWebSocket(listenerInstance, hostname, retryDelay, debug) {
    this.hostname = hostname;
    this.listenerInstance = listenerInstance;
    this.retryDelay = typeof retryDelay !== 'undefined' ? retryDelay : 5000;
    this.debug = typeof debug !== 'undefined' ? debug : false;
}

XorusWebSocket.prototype.connect = function () {
    var instance = this;

    this.listenerInstance.onSocketConnecting();
    this.webSocket = new WebSocket(this.hostname);
    this.webSocket.onopen = function () {
        instance.onOpen()
    };
    this.webSocket.onclose = function () {
        instance.onClose()
    };
    this.webSocket.onmessage = function (msg) {
        instance.onMessage(msg)
    };
};

XorusWebSocket.prototype.onOpen = function () {
    if (this.debug) {
        console.info("Websocket connected");
    }
    this.listenerInstance.onSocketConnected();
};

XorusWebSocket.prototype.onClose = function () {
    var instance = this;

    if (this.debug) {
        console.info("Websocket disconnected");
    }
    this.listenerInstance.onSocketDisconnected("Connection retry in " + (this.retryDelay / 1000) + " seconds...");

    setTimeout(function () {
        instance.connect();
    }, this.retryDelay);

    var delay = this.retryDelay - 1000;
    var timerUpdate = function () {
        instance.listenerInstance.onSocketDisconnected("Connection retry in " + (delay / 1000) + " seconds...");
        if (delay > 1000) {
            delay -= 1000;
            setTimeout(timerUpdate, 1000);
        }
    };
    setTimeout(timerUpdate, 1000);
};

XorusWebSocket.prototype.onMessage = function (message) {
    this.listenerInstance.onSocketMessage(message);
};

XorusWebSocket.prototype.send = function (message) {
    if (this.debug) {
        console.debug("sending : " + message);
    }
    this.webSocket.send(message);
};
