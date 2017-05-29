/**
 * Slide navigation setup.
 * Dependencies:
 *  - Requires jQuery 2.1.4
 *
 * Expects:
 *  - UL
 */

var $ = jQuery;

function Slidenavigation (navigation) {

    if (navigation instanceof jQuery === false) {
        throw new Error('Slidenavigation expects a jquery object.');
    }

    var windowWidth         = $(window).width(),
        list                = navigation.find('li'),
        totalWidth          = calculateWidth(list),
        scrollDifference    = totalWidth - windowWidth;

    $('.strokes').css({'overflow-x' : 'hidden'});

    if (list.length >= 4) {

        navigation.on('mousemove', function(e) {

            var offSetLeft = - Math.round(scrollDifference * (e.clientX / windowWidth));
            $(navigation).offset({ left : offSetLeft });
        });
    } else {

        var percentage = Math.round(100 / list.length);

        list.each(function(index, item) {
            $(item).css({'width' : percentage + 'vw'});
        });
    }
}

function calculateWidth (list) {

    var totalWidth = 0;

    list.each(function() {
        totalWidth += $(this).width();
    });

    return totalWidth;
}