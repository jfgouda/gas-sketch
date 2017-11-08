var jsModules = {
    bindUiElement: function () {
        // Bind the custom image remove icon
        $('#customImagesList').on('click', '.img-wrap .close', function () {
            $(this).closest('.img-wrap').remove();
        });

        $('.category-title [data-action=collapse]').unbind('click');
        $('.category-title [data-action=collapse]').click(function (e) {
            e.preventDefault();
            var $categoryCollapse = $(this).parent().parent().parent().nextAll();
            $(this).parents('.category-title').toggleClass('category-collapsed');
            $(this).toggleClass('rotate-180');

            // adjust page height
            jsModules.containerHeight();

            $categoryCollapse.slideToggle(150);
        });

        // Free drawing switch
        $("#freeDrawingToggle").bootstrapSwitch();
        $("#freeDrawingToggle").bootstrapSwitch('onColor', 'success');
        $("#freeDrawingToggle").bootstrapSwitch('offColor', 'danger');
        $("#freeDrawingToggle").bootstrapSwitch('onText', 'On');
        $("#freeDrawingToggle").bootstrapSwitch('offText', 'Off');
        $("#freeDrawingToggle").bootstrapSwitch('size', 'mini');
        $("#freeDrawingToggle").bootstrapSwitch('inverse', true);

        $(window).on('resize', function () {
            setTimeout(function () {
                jsModules.containerHeight();
                if ($(window).width() <= 768) {
                    $('.sidebar-detached').insertBefore('.content-wrapper');
                } else {
                    if ($('body').hasClass('has-detached-right'))
                        $('.sidebar-detached').insertAfter('.container-detached');
                }
            }, 100);
        }).resize();
    },

    containerHeight: function () {
        var availableHeight = $(window).height() - $('.page-container').offset().top - $('.navbar-fixed-bottom').outerHeight();
        $('.page-container').attr('style', 'min-height:' + availableHeight + 'px');
    }
}

module.exports = exports = jsModules;