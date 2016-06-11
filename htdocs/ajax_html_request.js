function ajax_init() 
{
    var httpRequest;

    if (window.XMLHttpRequest) { // Mozilla, Safari, ...
        httpRequest = new XMLHttpRequest();

        if (httpRequest.overrideMimeType) {
            httpRequest.overrideMimeType('text/xml');
        }
    } else if (window.ActiveXObject) { // IE
        try {
            httpRequest = new ActiveXObject("Msxml2.XMLHTTP");
        } catch(e) {
            try {
                httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
            } catch(e) {
                alert('ERROR' + e.description);
            }
        }
    }
    return httpRequest;
}

function ajax_set_instance(httpRequest, func)
{
    httpRequest.onreadystatechange = func;
}

function ajax_get(httpRequest, url)
{
    httpRequest.open('GET', url, true);
    httpRequest.send(null);
}

function ajax_post(httpRequest, url, query)
{
    httpRequest.open('POST', url, true);
    httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    httpRequest.send(query);
}
