function getRequest(url) {
    // Return a new promise.
    return new Promise(function(resolve, reject) {
        // Do the usual XHR stuff
        var req = new XMLHttpRequest();
        req.open('GET', url); 
        req.onload = function() {
            // This is called even on 404 etc
            // so check the status
            if (req.status == 200) {
                // Resolve the promise with the response
                resolve(req.response);
            } else {
                // Otherwise reject with the status text
                // which will be a meaningful error
                reject(Error(req.statusText));
            }
        };
        // Handle network errors
        req.onerror = function() {
            reject(Error("Network Error"));
        };
        // Make the request
        req.send();
    });
}

function putRequest(url) {
    // Return a new promise.
    return new Promise(function(resolve, reject) {
        // Do the usual XHR stuff
        var req = new XMLHttpRequest();
        req.open('PUT', url);
        req.onload = function() {
            // This is called even on 404 etc
            // so check the status
            if (req.status == 204) {
                // Resolve the promise with the response
                resolve(req.response);
            } else {
                // Otherwise reject with the status text
                // which will be a meaningful error
                reject(Error(req.statusText));
            }
        };
        // Handle network errors
        req.onerror = function() {
            reject(Error("Network Error"));
        };
        // Make the request
        req.send();
    });
}

function deleteRequest(url) {
    // Return a new promise.
    return new Promise(function(resolve, reject) {
        // Do the usual XHR stuff
        var req = new XMLHttpRequest();
        req.open('DELETE', url);
        req.onload = function() {
            // This is called even on 404 etc
            // so check the status
            if (req.status == 204) {
                // Resolve the promise with the response
                resolve(req.response);
            } else {
                // Otherwise reject with the status text
                // which will be a meaningful error
                reject(Error(req.statusText));
            }
        };
        // Handle network errors
        req.onerror = function() {
            reject(Error("Network Error"));
        };
        // Make the request
        req.send();
    });
}

function postRequest(url, jsonToSend) {
    // Return a new promise.
    return new Promise(function(resolve, reject) {
        // Do the usual XHR stuff
        var req = new XMLHttpRequest();
        req.open('POST', url);
        req.onload = function() {
            // This is called even on 404 etc
            // so check the status
            if (req.status == 201) {
                // Resolve the promise with the response
                resolve(req.response);
            } else {
                // Otherwise reject with the status text
                // which will be a meaningful error
                reject(Error(req.statusText));
            }
        };
        // Handle network errors
        req.onerror = function() {
            reject(Error("Network Error"));
        };
        // Make the request
        req.setRequestHeader("Content-Type", "application/json");
        req.send(JSON.stringify(jsonToSend));
    });
}
