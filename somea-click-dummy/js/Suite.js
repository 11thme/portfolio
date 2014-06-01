var Somea = (Somea || {});

Somea.Suite = {
  
  initialize: function(){
    this.initGlobalHandlers();
    this.settingsActiveMenu();
    this.loginPageEvents();
    this.selectReplacement();    
    this.ajaxSetup();
    this.oldBrowsersFix();
  },
  onLoad: function(){
    this.applyTransitionHeaderFix();
  },
  initGlobalHandlers: function(){
    $(document).on('click', 'a[rel="external"]', function(event){event.preventDefault();window.open(this.href)})
    
    // initialize handling of HTTP methods throught links
    $(document).on('click', 'a[data-method]', function(event){
      var link = $(this), 
          method = link.data('method'), 
          data = link.data('params'),
          href = link.prop('href'),
          target = link.attr('target'),
          csrf_token = $('meta[name=csrfToken]').attr('content');
          
      // creat form
      form = $('<form method="POST" action="' + href + '"></form>'),
      metadata_inputs = '<input name="__method" value="' + method + '" type="hidden" />';
      metadata_inputs += '<input name="__csrfToken" value="' + csrf_token + '" type="hidden" />';
      if (target) { form.attr('target', target); }
      form.hide().append(metadata_inputs).appendTo('body');
      form.submit();
      $(document).click()
      return false;
    });
    
  },
  ajaxSetup: function(){
    $(document).ajaxComplete(function(e,xhr,opts){
      response = xhr.responseText
      if(response && response.match(/login-form/)){
        window.location.reload();
      }
      
    });
  },
  settingsActiveMenu: function(){
    if (window.location.href.indexOf('account/profile/socialplugins')>0) {
			$(".nav-plugins-link a").addClass("active");
                        $('.nav-plugins').addClass('active')
		} else if(window.location.href.indexOf('account/profile')>0) {
			$(".nav-info-link a").addClass("active");
			$('.nav-settings').addClass('active')
		} else if (window.location.href.indexOf('account/agent')>0) {
			$(".nav-settings-link a").addClass("active");
		  $('.nav-settings').addClass('active')
		} else if (window.location.href.indexOf('channels') > 0) {
			$(".nav-social-link a").addClass("active");
			$('.nav-settings').addClass('active')
		} else if(window.location.href.indexOf('mydesign/mydesign')>0) {
			$(".nav-design-link a").addClass("active");
			$('.nav-settings').addClass('active')
		}
  },
  loginPageEvents: function(){    
    $('.forgot-password').on('click', function(e){
      e.preventDefault();
      $('.login-form').hide();
      $('.password-form').fadeIn();
    });
    
    $('.cancel-forgot-password').on('click', function(e){
      e.preventDefault();
      $('.password-form').hide();
      $('.login-form').fadeIn();
    });
    
    $('.login-form input, .password-form input').on('keydown', function(e){        
      if(e.which == 13){
        e.preventDefault();
        $(this).parents('form').submit();
      }
    })
  },
  selectReplacement: function(){
    $('.select2').select2({
      minimumResultsForSearch: 20,
    	width: "100%"
    });
  },
  goToElement: function(selector){
    $('html, body').animate({
        scrollTop: $(selector).offset().top - 140
    }, 350);
  },
  oldBrowsersFix: function(){    
    // force last child	class		
		if ($('html').hasClass('no-opacity')) {
      $('ul:last-child').addClass('last-child');
      $('.somea-list li:last-child').addClass('last-child');
    }		
  },
  applyTransitionHeaderFix: function(){
    $("#scroll-transition").fadeIn();
    $(window).trigger('scroll');
  },
  getToken: function(){
    var token;
    token = $('meta[name=csrfTokenParam]').attr('content') + "=" + $('meta[name=csrfToken]').attr('content');
    return token;
  }
  
}

Somea.FlashMessages = {
  initialize: function(){
    $(document).on("Somea:Flash", this.show);
    $(document).on('click', '.meow a.external-url', this.openExternalUrl);
    $(document).on('click', '.meow a:not(.external-url)', this.hide);
  },
  
  show: function(event, params){
    
    var options, msg_type, content, externalUrl;
    
    msg_type = params.type.toLowerCase();
    
    options = {};
    options.duration = Infinity;

    if(msg_type === "warning" || msg_type === "error"){
      if(msg_type === "warning"){
        content = '<div class="inline-notification inline-warning"><p><a href="#">';
      } else{
        content = '<div class="inline-notification inline-feedback"><p><a href="#">';
      }
      content += '<span class="icon-round icon-redDark"><i class="icon-circle-attention icon-white"></i></span>';
    } else {
      content = '<div class="inline-notification inline-feedback"><p><a href="#">';      
      content += '<span class="icon-round icon-green"><i class="icon-circle-checkmark icon-white"></i></span>';
    }
    if(msg_type == 'ok') {
        options.duration = 5000;
    }
    
    if(params.link != null) {
        content += '</a><a class="external-url" href="' + params.link + '" target="_blank">';
    }
    
      content += params.message;
      content += '</a></p></div>';
    
    options.message = content;  
    
    $.meow(options)
  },
  
  hide: function(event){
    event.preventDefault();
    el = $(this)
    if(!el.is('.meow')){
      el = el.parents('.meow').first();
    }    
    el.fadeOut(function(){
      $(this).remove();
    })
  },
  
  openExternalUrl: function(event){
      var el = $(this);
      var meow = el.parents('.meow').first();
      meow.fadeOut(function(){
        meow.remove();
      })
  }
}

Somea.i18n = {
  translations: {},
  set: function(key, value){
    this.translations[key] = value;
    return value;
  },
  
  get: function(key){
    var value = this.translations[key]
    if(typeof(value) === "undefined"){
      value = "";
    }
    return value;
  }
}

jQuery.fn.fadeOutAndRemove = function(speed){
  $(this).fadeOut(speed,function(){
    $(this).remove();
  })
}

jQuery.fn.spin = function(opts) {
  this.each(function() {
    var $this = $(this),
        data = $this.data();

    if (data.spinner) {
      data.spinner.stop();
      delete data.spinner;
    }
    if (opts !== false) {
      data.spinner = new Spinner($.extend({color: $this.css('color')}, opts)).spin(this);
    }
  });
  return this;
};



$(document).ready(function(){
  Somea.Suite.initialize();  
  Somea.FlashMessages.initialize();
});

$(window).load(function(){
  Somea.Suite.onLoad();
})