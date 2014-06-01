var Somea = (Somea || {});

Somea.NotificationCenter = {


    initialize: function () {
        $(document).tooltip({
            selector: '[data-toggle="tooltip"]',
            placement: 'top'
        })
        $(document).on('click', ".btn-read-more", this.readMore);
        $(document).on('click', '.fa-envelope', this.markAsRead);
        $(document).on('click', '.fa-envelope-o', this.markAsUnRead);
        $(document).on('click', '.fa-bell-o', this.enableAlertSetting);
        $(document).on('click', '.fa-bell', this.disableAlertSetting);
        $(document).on('click', '.fa-ban.de-active', this.enableMuteSetting);
        $(document).on('click', '.fa-ban.active', this.disableMuteSetting);
        $(document).on("click", ".fa-trash-o", this.deleteMessage);
        $(document).on("click", ".filter-switch", this.filterSwitch);

    },


    markAsRead: function () {
        //mark as Read
        if (!$(this).parent("a").hasClass("disabled")) {
            $(this).removeClass('fa-envelope active').addClass('fa-envelope-o').attr('title', "make as unread");
        }
        else {
            //@developer, please show a flash message
            console.log('functions are disabled because this message is muted')
        }

    },

//mark as unRead
    markAsUnRead: function () {
        if (!$(this).parent("a").hasClass("disabled")) {
            console.log('normal');
            $(this).removeClass('fa-envelope-o').addClass('fa-envelope active').attr('title', "make as read");
        } else {
            //@developer, please show a flash message
            console.log('functions are disabled because this message is muted')
        }

    },

    //turn on alert
    enableAlertSetting: function () {

        if (!$(this).parent("a").hasClass("disabled")) {
            var wrapper = $('#modal-alert-notification').find('.alert-wrapper');
            var btn = $('#modal-alert-notification').find('#btn-alter');
            var alertIcon = $(this);

            Somea.NotificationCenter.toggleHideClass(wrapper, btn);

            $('#modal-alert-notification').modal("show");
            //@developer, please find a way to find out all notifications of same type and apply this setting to all of them
            $('#btn-alter').click(function () {
                alertIcon.removeClass('fa-bell-o').addClass('fa-bell active').attr('title', "click to disable alert")
                $('#modal-alert-notification').modal("hide");
            });


        } else {
            //@developer, please show a flash message
            console.log('functions are disabled because this message is muted')
        }

    },

    //turn off alert
    disableAlertSetting: function () {
        if (!$(this).parent("a").hasClass("disabled")) {
            var wrapper = $('#modal-alert-notification').find('.disable-alert-wrapper');
            var btn = $('#modal-alert-notification').find('#btn-disable-alter');
            var alertIcon = $(this);

            Somea.NotificationCenter.toggleHideClass(wrapper, btn);

            $('#modal-alert-notification').modal("show");
            //@developer, please find a way to find out all notifications of same type and apply this setting to all of them
            $('#btn-disable-alter').click(function () {
                alertIcon.removeClass('fa-bell active').addClass('fa-bell-o').attr('title', "click to enable alert")
                $('#modal-alert-notification').modal("hide");
            });

        } else {
            //@developer, please show a flash message
            console.log('functions are disabled because this message is muted')
        }
    },
    //turn on mute
    enableMuteSetting: function () {
        var wrapper = $('#modal-mute-notification').find('.mute-wrapper');
        var btn = $('#modal-mute-notification').find('#btn-mute');
        var muteIcon = $(this);

        Somea.NotificationCenter.toggleHideClass(wrapper, btn);

        $('#modal-mute-notification').modal("show");
        //@developer, please find a way to find out all notifications of same type and apply this setting to all of them
        $('#btn-mute').click(function () {
            $('#modal-mute-notification').modal("hide");
            muteIcon.removeClass("de-active").addClass('active').attr('title', "click to disable mute");

            //disable other icons
            muteIcon.parent("a").siblings("a").each(function () {
                $(this).addClass('disabled');
            })
        });
    },

    //turn off mute
    disableMuteSetting: function () {
        var wrapper = $('#modal-mute-notification').find('.disable-mute-wrapper');
        var btn = $('#modal-mute-notification').find('#btn-disable-mute');
        var muteIcon = $(this);

        Somea.NotificationCenter.toggleHideClass(wrapper, btn);

        $('#modal-mute-notification').modal("show");
        //@developer, please find a way to find out all notifications of same type and apply this setting to all of them
        $('#btn-disable-mute').click(function () {
            $('#modal-mute-notification').modal("hide");
            muteIcon.removeClass('active').addClass('de-active').attr('title', "click to enable mute");

            //disable other icons
            muteIcon.parent("a").siblings("a").each(function () {
                $(this).removeClass('disabled');
            })
        });
    },

    deleteMessage: function () {
        var wholeMessage = $(this).parents('[class^="severity"]')
        wholeMessage.addClass('fadeOutRight');
        setTimeout(function () {
            wholeMessage.remove();
        }, 1000);
    },

    readMore: function () {
        var message = $(this).siblings('.messageBody')
        if (message.hasClass('messageCollapsed')) {
            message.removeClass('messageCollapsed');
            $(this).find(".fa").removeClass('fa-chevron-down').addClass('fa-chevron-up');
            $(this).parents('li[class^="severity"]').find(".fa-envelope").trigger("click");
        } else {
            message.addClass('messageCollapsed');
            $(this).find(".fa").removeClass('fa-chevron-up').addClass('fa-chevron-down');
        }
    },


    toggleHideClass: function (wrapper, btn) {
        if (wrapper.hasClass('hide')) {
            wrapper.removeClass('hide');
            wrapper.siblings('div').addClass('hide');
        }

        if (btn.hasClass('hide')) {
            btn.removeClass('hide');
            btn.siblings('.btn-primary').addClass('hide');
        }
    },

    filterSwitch: function(){
       $("#filter-notification").toggleClass('hide');
    }

}

$(document).ready(function () {
    Somea.NotificationCenter.initialize();
})
/**
 * Created by camellia on 3/6/14.
 */
