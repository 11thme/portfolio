/**
 * Created by camellia on 28.04.14.
 */
var Camellia = (Camellia || {});

Camellia.Portfolio = {
    initialize: function () {
        var headerElem = document.querySelector("header");
        var headroom1 = new Headroom(headerElem);
        headroom1.init();

        $('.carousel').carousel({
            interval: 5000
        });

    }
}
// to destroy
$(document).ready(function(){
    Camellia.Portfolio.initialize();
})