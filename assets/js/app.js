/**
 * Modify only if you know what you're doing.
 *
 * Dependencies:
 *  - jQuery
 *  - Modernizr
 *  - Page.js
 *
 *  Author: Vagebond
 */

(function ($) {

    $('document').ready(function() {

        /* use strict */
        'use strict';

        /* init the app */
        App.init();

        /* Throttle resizehandler (better performance) */
        var throttle;

        $(window).on('resize', function() {

            clearTimeout(throttle);
            throttle = setTimeout(function() {
                App.resizeHandler();
            }, 100);

        });
    });

    var App = {

        transition: null,
        touch: false,
        video: null,
        slideShowImages: [],
        slideShowIndex: 0,
        slideShow: null,
        modal: null,

        init: function() {

            /* Strict mode */
            'use strict';

            /* History fallback for < ie10 */
            if (! App.detectCssFeature('transition')) {
                var location = window.history.location || window.location;
            }

            /* Get video url */
            var video = $('body').data('video');

            if (typeof video != 'undefined') {
                App.video = video.toString();
            }

            /* Setup the router */
            page('*', this.displayPage);
            page();

            /* Check for touch support */
            App.touch = 'ontouchstart' in window || navigator.msMaxTouchPoints;

            /* Initialize the background player */
            App.background();

            /* Only show splash if supported */
            if (App.detectCssFeature('transition')) {
                App.splash();
            } else {
                $('#splash').addClass('hidden');
            }
        },

        splash: function() {
            /* Handles the splash animation */
            var splash  = $('#splash'),
                line    = $('.line', '#splash'),
                logo    = $('.splash-logo', '#splash'),
                main    = $('main', '#wrapper');
            
            logo.addClass('visible');
            main.addClass('splash-transition');

            line.one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function() {
                splash.addClass('slide-from-top-in');
                main.addClass('splash-transition-out');

                main.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() {
                    main
                        .removeClass('splash-transition-out splash-transition')
                        .unbind();
                });

                line.unbind();
            });

        },

        displayPage: function(ctx, next) {
            $.ajax({
                type: 'GET',
                url: ctx.path,
                cache: true,

                success:function(result){
                    var body                = $(result),
                        previous            = $('main', '#wrapper'),
                        main                = body.find('main'),
                        previousTransition  = previous.data('transition'),
                        supportsTransition  = App.detectCssFeature('transition'),
                        wrapper             = $('#wrapper');

                    if (ctx.init) {
                        /* Activates the javascript for the current page */
                        App.activatePage();
                        next();

                    } else {
                        /* Transition handler */
                        if (supportsTransition) {

                            if (typeof previousTransition != 'undefined') {
                                previous.removeClass(previousTransition + ' ' + previousTransition + '-in ' + previousTransition + '-out');
                            }

                            main.addClass(App.transition + ' ' + App.transition + '-in');

                            if (! App.touch) {
                                // hide scrollbar on desktop
                                main.css({
                                    'overflow' : 'hidden'
                                });

                                // Hide nav scrollbars on desktop
                                var strokes = main.find('.strokes');

                                if (strokes.length > 0) {
                                    strokes.css({
                                       'overflow' : 'hidden'
                                    });
                                }
                            }

                            wrapper.prepend(main);

                            setTimeout(function() {
                                previous.addClass(App.transition + ' ' + App.transition + '-out');

                                if (! App.touch) {
                                    previous.css({
                                        'overflow' : 'hidden'
                                    });
                                }

                                main.removeClass(App.transition + '-in');
                            }, 100);

                            main.data('transition', App.transition);

                            var transitionCompleted = false;

                            main.one('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function(){
                                transitionCompleted = true;
                                transitionComplete();
                            });

                            setTimeout(function() {
                                // fallback if transitionEnd
                                if (transitionCompleted == false) {
                                    transitionComplete();
                                }
                            }, 1000);

                        } else {
                            wrapper.prepend(main);
                            previous.remove();
                            main.unbind();
                            App.activatePage();
                        }

                        function transitionComplete(){
                            previous.remove();
                            App.activatePage();
                            main
                                .css({'overflow-y' : 'scroll'})
                                .unbind();
                            next();
                        }
                    }
                }
            });
        },

        activatePage: function() {

            /* Activates js on page after load */
            if (! App.touch) {
                if ($('#navigation').length > 0) {
                    new Slidenavigation($('#navigation'));
                }
            }

            /* Transition action */
            $('a', '#wrapper').on('click', function(e) {
                /* Check if gallery-item */
                if ($(this).hasClass('gallery-item')) {

                    e.preventDefault();
                    App.initPhotoswipe($(this));
                    return;
                }

                /* Check if modal */
                if ($(this).hasClass('activate-modal')) {
                    e.preventDefault();
                    App.initModal($(this));
                    return;
                }

                /* If IE catch click and call page.js */
                if (! App.detectCssFeature('transition')) {
                    var link = $(this).attr('href');
                    e.preventDefault();
                    page.show(link);
                }

                var t = $(this).data('transition');

                if (typeof t != 'undefined') {
                    App.transition = t;
                } else {
                    App.transition = 'transition';
                }
            });

            if ($('form', '#wrapper').length > 0) {
                // Only initialize forms when present
                App.initForms();
            }
        },

        initForms : function()
        {
            $('form', '#wrapper').submit(function(e){
                e.preventDefault();

                var $form   = $(this);
                var data    = $form.serialize();
                var method  = $form.attr('method');
                var action  = $form.attr('action');

                $.ajax({
                    'url':      action,
                    'method':   method,
                    'data':     data,
                    'cache':    false,
                    'dataType': 'json',
                    'success':  function(e){

                        $form.find('.message').html(e.message);
                        if (e.success == true) {
                            $form.find('input[type=text], input[type=email], textarea').val('');
                            App.initModal();
                        }
                    }
                });
            });
        },

        initModal : function()
        {
            /* Disable hashtracking for the modals */
            App.modal = $('[data-remodal-id=modal]').remodal({
                'hashTracking' : false
            });

            App.modal.open();
        },

        initPhotoswipe: function($el)
        {
            var galleryItems = [];
            var itemIndex = 0;

            $('.gallery-item').each(function(index){
                var $item = $(this);
                var url = $item.attr('href');

                if (url.length) {
                    var w = parseInt($(this).find('img').get(0).naturalWidth, 10);
                    var h = parseInt($(this).find('img').get(0).naturalHeight, 10);

                    if (1 > 0) {
                        galleryItems.push({
                            'src' : url,
                            'w' : w,
                            'h' : h
                        });

                        if ($item.is($el)) {
                            itemIndex = index;
                        }
                    }
                }
            });

            if (galleryItems.length > 0) {
                var options = {
                    index : itemIndex,
                    bgOpacity: 1,
                    history: false
                };

                var pswpElement = $('.pswp').get(0);
                var gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, galleryItems, options);
                gallery.init();
            }
        },

        background: function() {
            /* Background handler, checks if a touch device and plays video / slideShow. */
            if (App.touch) {
                App.slideShow();
            } else {
                if (App.video) {
                    /* If body has data-video attribute load video
                    * This can be a youtube or vimeo videoId
                    * */
                    $('main', '#wrapper').backgroundvideo({
                        'videoId' : App.video
                    });

                } else {
                    /* Else load slideShow */
                    App.slideShow();
                }

            }
        },

        slideShow: function() {
            /* fullscreen background slideShow */
            this.slideShow         = $('#slideshow');
            this.slideShowIndex    = 0;

            var _this               = this,
                slidesShowLength    = this.slideShow.length;

            if (slidesShowLength > 0) {

                var items = _this.slideShow.find('li');

                for (var i = 0; i < items.length; i++) {

                    /* Extract images from list items */
                    var item    = $(items[i]),
                        image   = item
                            .find('img')
                            .attr('src');

                    /* Create image array */
                    _this.slideShowImages.push(image);

                    /* Add image to item */
                    item.css({
                        'background-image' : 'url(' + image + ')',
                        'display' : 'none'
                    })
                }

                if (this.slideShowImages.length > 1) {
                    this.showSlide();
                } else {
                    var next = _this.slideShow.find('li:eq(0)');

                    if (next != null) {
                        next.css({
                            'display' : 'block',
                            'opacity' : 1
                        });
                    }
                }
            }
        },

        showSlide: function() {

            /* Show the images */
            var _this               = App,
                next                = _this.slideShow.find('li:eq(' + _this.slideShowIndex + ')'),
                supportsAnimation   = _this.detectCssFeature('animation');

            _this.slideShow
                .children()
                .css('z-index', 0);

            next.css({'z-index' : 1, 'display' : 'block'});

             if (supportsAnimation) {
                next.one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function (e) {
                    next.unbind();
                    next.removeClass('visible');
                });

                next.addClass('visible');
                setTimeout(_this.showSlide, 7000);

             } else {

                 next.fadeTo(1000, 1);
                 setTimeout(_this.showSlide, 6000);
                 setTimeout(function(){
                     next.css('opacity', 0)
                 }, 7000);
             }

            if (_this.slideShowIndex == _this.slideShowImages.length -1) {
                _this.slideShowIndex = 0;
            } else {
                _this.slideShowIndex ++;
            }
        },

        detectCssFeature: function(featurename) {

            /* Mixin to detect css features of browser */
            var feature = false,
                domPrefixes = 'Webkit Moz ms O'.split(' '),
                elm = document.createElement('div'),
                featurenameCapital = null;

            featurename = featurename.toLowerCase();
            if( elm.style[featurename] !== undefined ) { feature = true; }

            if( feature === false ) {
                featurenameCapital = featurename.charAt(0).toUpperCase() + featurename.substr(1);
                for( var i = 0; i < domPrefixes.length; i++ ) {
                    if( elm.style[domPrefixes[i] + featurenameCapital ] !== undefined ) {
                        feature = true;
                        break;
                    }
                }
            }
            return feature;
        },

        resizeHandler: function() {

            var $window = $(window),
                navigation = $('#navigation');

            /* On resizing reset or set the navigation */
            if (navigation.length > 0 && $window.width() < 768) {

                navigation.css({'left' : '0'});
                navigation.unbind('mousemove');

            } else {
                new Slidenavigation(navigation);
            }

            /* Fix resize issue browserbar with position fixed for touch devices (ios) */
            if (App.touch) {
                var timeout,
                    activeBackground = $('#slideShow > .visible');

                $window.on('resize', function() {
                    /* Ios background scroll fix */
                    if (timeout) {
                        clearTimeout(timeout);
                    }

                    timeout = setTimeout(function() {
                        activeBackground.height($window.height() + 60);
                    }, 100);
                });
            }
        }
    }
}(jQuery));