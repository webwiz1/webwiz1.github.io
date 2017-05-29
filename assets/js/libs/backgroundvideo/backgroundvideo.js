/**
 * Background video plugin
 * Created by gianluca on 25-12-15.
 */

;(function ($, window) {

    'use strict';

    var defaults = {
        ratio           : 16/9,
        videoId         : '116244713', // youtube or vimeo // 116244713 // HfrvPOmXFOE
        mute            : true,
        repeat          : true,
        width           : $(window).width(),
        start           : 0,
        end             : false,
        videoQuality    : 'hd1080',
        relatedVideos   : 0,
        wrapperZindex   : 99
    };

    var backgroundvideo = function(node, options) {

        // extend defaults and accept options
        var options = $.extend({}, defaults, options),
            body    = $('body'),
            node    = $('node');

        // build container
        var backgroundContainer = '' +
            '<div id="background-container"style="overflow: hidden; position: fixed; z-index: 1; width: 100%; height: 100%">' +
                '<div id="background-player" style="position: absolute"></div>' +
            '</div>';

        // setup base css
        $('html, body').css({'width' : '100%', 'height' : '100%'});

        // prepend video container
        body.prepend(backgroundContainer);
        node.css({position: 'relative', 'z-index': options.wrapperZindex});

        // Determine provider
        determineProvider();

        function determineProvider () {

            var a = document.createElement ('a');
            a.href = options.videoId;

            if (/youtube.com/.test(options.videoId)) {
                setupYoutube();
            }
            else if (/vimeo.com/.test(options.videoId)) {
                setupVimeo();
            }
            else if (/[-A-Za-z0-9_]+/.test(options.videoId)) {

                var id = new String(options.videoId.match(/[-A-Za-z0-9_]+/));

                if ( id.length == 11 ) {
                    setupYoutube();
                }

                else {
                    setupVimeo();
                }
            }
            else {
                throw 'backgroundVideo: Invalid video source';
            }
        }

        function setupYoutube () {

            // Setup youtube iframe
            window.onYouTubeIframeAPIReady = function() {
                window.player = new YT.Player('background-player', {
                    width: options.width,
                    height: Math.ceil(options.width / options.ratio),
                    videoId: options.videoId,
                    playerVars: {
                        controls: 0,
                        showinfo: 0,
                        modestbranding: 1,
                        iv_load_policy: 3,
                        wmode: 'transparent',
                        vq: options.videoQuality,
                        rel: options.relatedVideos,
                        end: options.end
                    },
                    events: {
                        'onReady' : onPlayerReady,
                        'onStateChange' : onPlayerStateChange
                    }
                });
            };

            // events
            window.onPlayerReady = function(e) {
                resize();
                if (options.mute) e.target.mute();
                e.target.seekTo(options.start);
                e.target.playVideo();
            };

            window.onPlayerStateChange = function(state) {
                if (state.data === 0 && options.repeat) { // video ended and repeat option is set true
                    player.seekTo(options.start); // restart
                }
            };

            // load youtube iframe js api
            addScript('https://www.youtube.com/iframe_api');
        }

        function setupVimeo () {

            $('#background-player')
                .replaceWith(function () {
                    return '<iframe src="//player.vimeo.com/video/' + options.videoId + '?api=1&title=0&byline=0&portrait=0&playbar=0&loop='+ options.repeat +'&autoplay=1&player_id=background-player" frameborder="0" id="background-player"></iframe>';
                });

            resize();

            $('#background-player').on('load', function() {
                // load froogaloop
                addScript('//origin-assets.vimeo.com/js/froogaloop2.min.js', vimeoReady);

            });
        }

        function vimeoReady () {

            // Vimeo Api is ready
            var iframe = $('#background-player')[0],
                player = $f(iframe);

            player.api('setVolume', 0);
        }

        function addScript(source, callback) {

            var tag = document.createElement('script');

            if (callback){
                if (tag.readyState){  //IE
                    tag.onreadystatechange = function(){
                        if (tag.readyState === "loaded" ||
                            tag.readyState === "complete"){
                            tag.onreadystatechange = null;
                            callback();
                        }
                    };
                } else {
                    tag.onload = function() {
                        callback();
                    };
                }
            }

            tag.src = source;
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        function resize () {

            // Handles the resizing. Positions video
            var width = $(window).width(),
                height = $(window).height(),
                playerWidth,
                playerHeight,
                player = $('#background-player');

            if (width / options.ratio < height) {

                playerWidth = Math.ceil( height * options.ratio );
                player.width(playerWidth)
                    .height(height)

                    .css({
                        'left' : (width - playerWidth) / 2,
                        'top' : 0
                    });

            } else {

                playerHeight = Math.ceil( width / options.ratio);
                player.width(width)
                    .height(playerHeight)

                    .css({
                        'left': 0,
                        'top' : (height - playerHeight) / 2
                    });

            }
        }

        $(window).on('resize.backgroundvideo', resize);
    };

    $.fn.backgroundvideo = function (options) {

        return this.each(function () {

            // only run once
            if (!$.data(this, 'backgroundvideo_instantiated')) {
                $.data(this, 'backgroundvideo_instantiated',
                    backgroundvideo(this, options));
            }
        });
    }

})(jQuery, window);