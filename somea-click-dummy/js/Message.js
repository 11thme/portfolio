var Somea = (Somea || {});

Somea.Messages = {
	List: {
		initialize: function(){

			this.currentPage = 1;

			// initialize tooltips
			$(document).tooltip({
				selector: '[data-toggle="tooltip"]',
				placement: 'top'
			});

			// handle favorites
			$(document).on('click.messages_flag', '.btn-flag-message', this.flagMessage);
			$(document).on('click.messages_flag', '.btn-flag-conversation', this.flagConversation);

			// reply
			$(document).on('click.messages_reply', '.btn-reply-message, .btn-reply-parent-message', this.reply);

			// quick reply form actions
			$(document).on('submit.messages_submit_quick_reply', '.quick-reply-form', this.submitQuickReply)
			$(document).on('click.messages_cancel_quick_reply', '.btn-cancel-quick-reply', this.cancelQuickReply)

			// loading conversation and switch between channels
			$(document).on('click.messages_get_conversation', '.get-conversation', this.openConversation)

			// close conversations
			$(document).on('click.close_conversation', '.close-conversation', this.closeConversation)

			// toggle
			$(document).on('click.toggle_parent', '.message-toggle', this.toggleOriginal);

			// mark as active
			$(document).on('click.activate_message','.somea-message', this.activateMessage);

			// mark as read
			$(document).on('click.messages_mark_as_read', '.message-unread', this.markAsRead)

			// show truncated message
			$(document).on('click.expand_message', '.show-truncated-message', this.showTruncated);

			$(document).on('click.unlock_conversation', '.btn-unlock', this.unlockConversation)

			//show emoji box
			$(document).on('click.emoji_button', '.emoji-button', this.openEmoji);
			$(document).on('click.emoticonFB', '.emoticonFB', this.selectEmoji);
			//$('.emoticonFB:first').click();

			this.initPopovers();
			this.fixEmptyDropdowns();

		},


		initPopovers: function(event){
			$('.feedback-summary').not('.initialized').popover({
				html : true,
				trigger: 'manual',
				content: function() {
					var popover_html = $(this).parent().find('.popover_content_wrapper').html();
					return '<div class="feedback-popover">' + popover_html + '</div>';
				}
			}).addClass('initialized');

			$('.channel-stats-values').not('.initialized').each(function(index, item){
				if($(item).find('> span').length > 1){
					$(item).wrapInner('<span class="label-group" />');
				}
			}).addClass('initialized');

			// bind events only once to items
			if(typeof(event) === "undefined"){
				$(document).on('click', '.feedback-summary', function(e){
					$(this).popover('toggle');

					return false;

				});
				$(document).on('shown', '.feedback-summary', function(e){
					// bind hiding
					$(window).one('scroll', function(){
						$('.feedback-summary').popover('hide')
					});
					$(document).one('click', function(){
						$('.feedback-summary').popover('hide')
					});
				});
				$("#message-stream").on('stream_update', Somea.Messages.List.initPopovers);
			}

		},
		showTruncated: function(e){
			e.preventDefault();
			$(this).parent().find('.truncated').remove();
			$(this).parent().find('.full-content').slideDown();
			$(this).remove();

		},
		markAsRead: function(e){
			e.preventDefault();
			if($(this).parents('.message-item').length == 0){ // if is original
				var el = $(this).parents('.original-message').first().find('.mark-as-read-message a')
			} else{ // thread (child message)
				var el = $(this).parents('.message-item').first().find('.mark-as-read-message a')
			}
			el.trigger('click')
		},
		decreaseCounters: function(msgDomId){

			// update global counter
			var v = parseInt($('.badge-MessagesCenter-Index').first().text())
			if(v > 0){
				$('.badge-MessagesCenter-Index').html(v-1);
			}

			// update counter on message
			el = $("#" + msgDomId)


		},
		increaseCounters: function(msgDomId){

			// update global counter
			var v = parseInt($('.badge-MessagesCenter-Index').first().text())
			$('.badge-MessagesCenter-Index').html(v+1);

		// update counter on message



		},
		toggleOriginal: function(e){
			e.preventDefault();

			$(this).find("i").toggleClass('icon-arrow-collapsed').toggleClass('icon-arrow-open')

			var p = $(this).parents('.original-message')

			if($(this).is('.expanded')){
				p.find('.original-cropped').fadeIn();
				p.find('.original-full').hide();
			} else{
				p.find('.original-cropped').hide();
				p.find('.original-full').fadeIn();
			}

			$(this).toggleClass('expanded')

		},
		activateMessage: function(e){
			$('.somea-message.active').removeClass('active');
			$(this).addClass('active');
		},
		flagMessage: function(e){
			e.preventDefault();

			var $this = $(this);
			var $flagConversation = $this.closest('.somea-message').find('.btn-flag-conversation');

			if($this.hasClass('active')) {
				$flagConversation.addClass('active');
			}

			var flag_uri = $(this).data('action') + "&" + Somea.Suite.getToken()
			var flag_value = $(this).hasClass('active') ? 1 : 0;

			$.ajax({
				type: 'POST',
				dataType: 'json',
				params: {
					deep: flag_value
				},
				url: flag_uri
			}).done(function(data){
				if (data.favoriteConversation == 1) {
					$flagConversation.addClass('active');
				} else {
					$flagConversation.removeClass('active');
				}
			})

		},
		flagConversation: function(e){
			e.preventDefault();

			var $this = $(this);
			var $flagMessage = $this.closest('.somea-message').find('.btn-flag-message');
			var $flagConversation = $this.closest('.somea-message').find('.btn-flag-conversation');

			if($this.hasClass('active')) {
				$flagConversation.not($this).addClass('active');
			} else {
				$flagMessage.removeClass('active');
				$flagConversation.not($this).removeClass('active');
			}

			var flag_uri = $(this).data('action') + "&" + Somea.Suite.getToken()

			$.ajax({
				type: 'POST',
				dataType: 'json',
				url: flag_uri
			}).done(function(data){
				if (data.favoriteConversation == 0) {
					$flagMessage.removeClass('active');
					$flagConversation.removeClass('active');
				} else {
					$flagConversation.addClass('active');
				}
			})

		},
		cancelQuickReply: function(e){
			e.preventDefault();
			$(this).parents('.quick-reply-form').parent().fadeOut(function(){
				$(this).remove();
			});
		},
		submitQuickReply: function(e){

			var replyForm = $(this)
			e.preventDefault();

			// return if loading
			if(replyForm.hasClass('loading')) return;

			// mark button as loading
			replyForm.addClass('loading');
			$('.btn-primary', replyForm).button('loading')

			// do ajax post
			$.ajax({
				type: "POST",
				data: replyForm.serialize(),
				dataType: 'html',
				url: replyForm.attr('action'),
			}).done(function(data){
				if(replyForm.parent().parent().find('.no-responses').length > 0){
					replyForm.parent().parent().find('.no-responses').remove();
				}
				$(replyForm.parent()).replaceWith(data);

			});


		},
		reply: function(e){
			e.preventDefault();

			var that = $(this)
			var container = $(this).parents('.somea-message');
			var button = $(this);
			var message_uri = $(this).data('action') + "&" + Somea.Suite.getToken()

			if(container.is('.open-conversation')){

				button.button('loading')

				$.ajax({
					type: 'POST',
					dataType: 'html',
					url: message_uri
				}).done(function(data){
					if(button.is('.btn-reply-parent-message')){
						to_reply = button.data('channel');

						// show channel to reply if its not visible
						var channel_to_show = container.find('.channel-' + to_reply)
						channel_to_show.find('.message-item').last().after(data)
						if(!channel_to_show.is(':visible')){
							container.find('.comment-list').hide();
							container.find('.channel-' + to_reply).slideDown();
						}


					} else{
						button.parents('.message-item').first().after(data)
					}

					button.button('reset');

					var reply_container = $(container).find('.quick-reply-container');

					//init emoji button
					Somea.Messages.List.initEmoji(reply_container);

					if(reply_container.length > 0){
						Somea.Suite.goToElement(reply_container);
						reply_container.find('textarea').focus()
					}

				})



			} else{

				// container.find('.message-actions').spin()
				Somea.Messages.List.loadConversation({
					conversation_uri: container.data('conversation-uri'),
					message_id: button.data('message'),
					channel: button.data('channel'),
					container: container,
					button: button
				});

			}

		},

		initEmoji: function(reply_container){

			var textarea=$(reply_container).find('.reply-message-emoji-enable');

			$.each(textarea, function(){
				if($(this).attr('data-channel')=='FacebookPageChannel'){
					var emoji_button=$(this).siblings('.emoji-button');
					//var emoji_button_top=$(this).height()+7;
					var emoji_button_right=$(this).width()-16;
					//var emoji_button_top_css='-' + emoji_button_top.toString()+'px';
					var emoji_button_right_css='-' + emoji_button_right.toString()+'px';
					$(emoji_button).css('top', '-35px');
					$(emoji_button).css('right', emoji_button_right_css);
					$(this).siblings('.emoji-button').css('display','block');
				}
			});

		},

		openEmoji: function(e){
			var emoji_box=$(this).parents().siblings('.emoji-icon-box');
			var emoji_button=$(this);
			var emoji_button_right=parseInt($(emoji_button).css('right'), 10);
			if ($(emoji_box).css('display')=="none") {
				emoji_button_right=emoji_button_right - 4;
				var emoji_button_right_css=emoji_button_right.toString()+'px';
				$(emoji_button).css('right', emoji_button_right_css);
				$(emoji_button).css('background-color', '#FFFFFF');
				$(emoji_button).css('box-shadow', '0 0 0 #FFFFFF');
				$(emoji_box).show();
			}
			else {
				$(emoji_box).hide();
				var emoji_button_right=emoji_button_right+4;
				var emoji_button_right_css=emoji_button_right.toString()+'px';
				$(emoji_button).css('right', emoji_button_right_css);
				$(emoji_button).css('background-color', '#EBEBEB');
			}
		},

		selectEmoji: function(e){
			e.preventDefault();
			$(this).parents().siblings('.reply-message').children('.reply-message-emoji-enable').append(' ' + $(this).attr('alt') + ' ');
			 $('.emoticonFB').parents().siblings('.reply-message').children('textarea.reply-message-emoji-enable').val(function(i, v) { return v + 'new content'; });
		},

		openConversation: function(e){
			e.preventDefault();

			var container = $(this).parents('.somea-message');
			var button = $(this);
			var channel = button.data('channel')
			var channel_to_show = ".channel-" + channel
			var placeholder = container.find('.message-thread')

			if(container.is('.open-conversation')){

				// show selected tab and toggle original
				Somea.Messages.List.showConversationTab(placeholder, channel_to_show)


			} else{

				Somea.Messages.List.loadConversation({
					conversation_uri: container.data('conversation-uri'),
					channel: channel,
					container: container
				});

			}

		},
		loadConversation: function(options){

			var conversation_uri = options.conversation_uri + "&" + Somea.Suite.getToken();
			var container = options.container;
			var placeholder = container.find('.message-thread')
			var button = options.button || null
			var channel_to_show = ".channel-" + options.channel

			if(typeof(options.message_id) != "undefined"){
				conversation_uri = conversation_uri + "&message%5B__identity%5D=" + options.message_id
			}

			if(button){
				button.button('loading');
			}

			$.ajax({
				type: 'POST',
				dataType: 'html',
				url: conversation_uri
			}).done(function(data){

				if(button)
					button.button('reset')

				// if there is no placeholder, append it
				if(placeholder.length == 0){
					container.append('<div class="message-thread"></div>')
					placeholder = container.find('.message-thread');
					container.find('.arrow').show();
				}

				// remember old data
				var original_data = placeholder.html()
				placeholder.data('original_data', original_data)

				// update new
				placeholder.html(data);
				placeholder.addClass('cached').removeClass('hide');

				// show selected tab and toggle original
				Somea.Messages.List.showConversationTab(placeholder, channel_to_show);

				// mark as open
				container.addClass('open-conversation');

				// clear empty lists
				Somea.Messages.List.fixEmptyDropdowns()

			});
		},

		showConversationTab: function(placeholder, channel_to_show){
			placeholder.find('.comment-list').hide();
			var to_show = placeholder.find(channel_to_show);
			to_show.slideDown();

			//init emoji button
			var reply_container = $(placeholder).find('.quick-reply-container');
			Somea.Messages.List.initEmoji(reply_container);

			// replace the current visible parent message
			var channel_original_message = to_show.find('.original-parent');
			var original_message = placeholder.parents('.somea-message').find('.original-message')

			if(original_message.find('.original-full').is(':visible')){
				// replace the full
				original_message.find('.original-full').html(channel_original_message.find('.original-full').html())
			} else{
				// replace the truncated
				original_message.find('.original-cropped').html(channel_original_message.find('.original-cropped').html())
			}

		},
		closeConversation: function(e){
			e.preventDefault();


			var that = this;
			var placeholder = $(this).parents('.message-thread');
			var container = $(this).parents('.somea-message');
			container.find('.get-conversation.active').removeClass('active');

			// get old data
			var original_data = placeholder.data('original_data')
			if(original_data == ''){
				placeholder.remove()
				container.find('.arrow').hide();
			} else{
				placeholder.removeClass('cached').html(original_data)
			}

			// mark as closed
			container.removeClass('open-conversation');



		},
		unlockConversation: function(e){
			var actionUri = $(this).data('unlock-action') + "&" + Somea.Suite.getToken();
			$.ajax({
				url: actionUri,
				type: "POST"
			});
		},
		fixEmptyDropdowns: function(){
			var empty_lists = $(".message-quick-actions").filter(function() {
				return $(this).children().length == 0
			})

			empty_lists.each(function(index, item){
				//$(item).parent().removeClass('btn-group')
				$(item).prev().remove();
				$(item).remove();
			})
		}
	},



	InfiniteScroll: {
		initialize: function(){

			// dont initialize if there is less than 9
			if($('.somea-message').length < 9) return;

			$('#message-stream').waypoint(this.nextPage, {
				offset: 'bottom-in-view',
				onlyOnScroll: true,
				triggerOnce: true
			});
		},
		nextPage: function(){
			Somea.Messages.List.currentPage += 1;
			$("#message-stream").append('<p class="infinite-loading"></p>');
			$("p.infinite-loading").spin();
			$.ajax({
				url: window.location.href,
				type: "GET",
				data: {
					page: Somea.Messages.List.currentPage
				},
			}).done(function(data){
				$("p.infinite-loading").remove()
				if($(data).find('.no-messages').length > 0){
				} else {
					var messages = $(data).find("#message-stream");
					$("#message-stream").append(messages);
					// trigger event
					$("#message-stream").trigger('stream_update')
					Somea.Messages.InfiniteScroll.initialize()
				}

			})

		}
	},



	QuickActions: {
		initialize: function(){
			$(document).on('click', '.message-quick-actions a[data-action="markAsReadMessage"]', this.markAsRead)
			$(document).on('click', '.message-quick-actions a[data-action="markAsUnreadMessage"]', this.markAsUnread)

			//$(document).on('click.messages_mark_all_as_read', '.message-all-as-read', this.markAllAsRead)
			$(document).on('click', '.message-quick-actions a[data-action="markAllAsReadMessage"]', this.markAllAsRead)

			$(document).on('click', '.message-quick-actions a[data-action="likeMessage"]', this.likeMessage)
			$(document).on('click', '.message-quick-actions a[data-action="unlikeMessage"]', this.unlikeMessage)

			$(document).on('click', '.message-quick-actions a[data-action="likeYouTubeMessage"]', this.likeYouTubeMessage)
			$(document).on('click', '.message-quick-actions a[data-action="disLikeYouTubeMessage"]', this.disLikeYouTubeMessage)

			$(document).on('click', '.message-quick-actions a[data-action="editMessage"]', this.editMessage);
			$(document).on('click', '.message-quick-actions a[data-action="discardDraft"]', this.discardDraft);
			$(document).on('click', '.message-quick-actions a[data-action="cancelScheduledMessage"]', this.cancelScheduledMessage);

		},
		markAsRead: function(e){
			e.preventDefault();
			var actionUri = $(this).attr('href') + "&" + Somea.Suite.getToken();
			$.ajax({
				url: actionUri,
				type: "POST"
			});
			$(this).parent().toggleClass('hide')
			$(this).parents('.dropdown-menu').find('.mark-as-unread-message').toggleClass('hide')

			if($(this).parents('.message-item').length == 0){ // if is original
				$(this).parents('.original-message').find('.icon-envelope-orange').first().fadeOutAndRemove()
				$(this).parents('.original-message').find('.msg-private').first().attr('class', 'label label-info msg-private');
			//todo: wait for the private message icon:$(this).parents('.original-message').find('.icon-private-message-orange').first().attr('class', 'icon-private-message icon-semi icon-big');
			} else{ // thread (child message)

				var channel_data=$(this).parents('.message-item').first().find('.channel-info').attr('data-channel');
				if (typeof channel_data === "undefined"){
					channel_data=$(this).parents('.comment-list').first().find('.channel-info').attr('data-channel');
				}
				//remove the evelope-icon
				$(this).parents('.message-item').first().find('.icon-envelope-orange').fadeOutAndRemove();
				//todo: wait for the private message icon:$(this).parents('.message-item').first().find('.icon-private-message-orange').attr('class', 'icon-private-message icon-semi icon-big');
				//get the original message status bar
				var conversation_level1=$(this).parents('.somea-message').find('.get-conversation');
				var total_unread_message_level1=null;
				var unread_status_bar_level1=null;
				$(conversation_level1).each(function(index){
					if($(this).attr('data-channel')==channel_data){
						total_unread_message_level1=$(this).find('.orange');
						unread_status_bar_level1=total_unread_message_level1.parent();
					}
				});
				//get the comment status bar
				var total_unread_message_level2=$(this).parents('.message-history-wrapper').first().find('.orange');
				var unread_status_bar_level2=total_unread_message_level2.parent();
				var total_unread_message_num=parseInt(total_unread_message_level1.text());
				var total_message_num=parseInt(total_unread_message_level1.siblings('.total-message').text());
				var no_unread_message_template ='<i class="icon-envelope icon-semi"></i><span class="total-message">&nbsp;'+total_message_num+'</span>';
				//update the status
				if(total_unread_message_num==1  ){//only one unread
					unread_status_bar_level2.empty();
					unread_status_bar_level2.append(no_unread_message_template);
					unread_status_bar_level1.empty();
					unread_status_bar_level1.append(no_unread_message_template);
				}else{//more than one unread
					total_unread_message_level2.text(total_unread_message_num-1);
					total_unread_message_level1.text(total_unread_message_num-1);
				}
			}
			Somea.Messages.List.decreaseCounters($(this).parents('somea-message').prop('id'));
			$(document).click();

		},
		markAsUnread: function(e){
			e.preventDefault();
			var actionUri = $(this).attr('href') + "&" + Somea.Suite.getToken();
			$.ajax({
				url: actionUri,
				type: "POST"
			});
			$(this).parent().toggleClass('hide')
			$(this).parents('.message-quick-actions').find('.mark-as-read-message').toggleClass('hide')

			var unread_template = ' <a class="message-unread"><i class="icon-envelope-orange"></i></a> ';

			if($(this).parents('.message-item').length == 0){ // if is original
				$(this).parents('.original-message').first().find('.message-author').before(unread_template);
				$(this).parents('.original-message').first().find('.message-unread').hide().fadeIn();
			} else{ // thread (child message)

				var channel_data=$(this).parents('.message-item').first().find('.channel-info').attr('data-channel');
				if (typeof channel_data === "undefined"){
					channel_data=$(this).parents('.comment-list').first().find('.channel-info').attr('data-channel');
				}
				//get the original message status bar level-1
				var conversation_level1=$(this).parents('.somea-message').find('.get-conversation');
				var total_unread_message_level1=null;
				var unread_status_bar_level1=null;
				$(conversation_level1).each(function(index){
					if($(this).attr('data-channel')==channel_data){
						total_unread_message_level1=$(this).find('.orange');
						unread_status_bar_level1=$(this).find('.total-message').parent();
					}
				});
				//get the comment status bar for level-2
				var total_unread_message_level2=$(this).parents('.message-history-wrapper').first().find('.orange');
				var unread_status_bar_level2=$(this).parents('.message-history-wrapper').first().find('.total-message').parent();
				//get the total number
				var total_unread_message_num=parseInt(total_unread_message_level1.text());
				var total_message_num=parseInt(unread_status_bar_level1.children('.total-message').text());
				var unread_template_channel_status='<i class="icon-envelope-orange"></i>&nbsp;<span class="orange">1</span>&nbsp;of&nbsp;<span class="total-message">'+total_message_num+'</span>';
				//mark level-3 as unread
				$(this).parents('.message-item').first().find('.message-author').before(unread_template);
				$(this).parents('.message-item').first().find('.message-unread').hide().fadeIn();

				if(total_unread_message_num>0){//has other unread messages
					total_unread_message_level2.text(total_unread_message_num+1);
					total_unread_message_level1.text(total_unread_message_num+1);
				}else{//has no unread messages
					unread_status_bar_level2.empty();
					unread_status_bar_level2.append(unread_template_channel_status);
					unread_status_bar_level1.empty();
					unread_status_bar_level1.append(unread_template_channel_status);
				}

			}


			Somea.Messages.List.increaseCounters($(this).parents('somea-message').prop('id'));
			$(document).click();
		},
		markAllAsRead: function(e){
			e.preventDefault();
			var actionUri = $(this).attr('href') + "&" + Somea.Suite.getToken();
			$.ajax({
				url: actionUri,
				type: "POST"
			});
			var total_message_num= $(this).parents('.message-history-wrapper').find('.total-message').text();
			$(this).parents('.message-thread').siblings('.original-message').find('.total-message').parent().each(function(){
				$(this).empty().append('<i class="icon-envelope icon-semi"></i><span class="total-message">&nbsp;'+total_message_num+'</span>')
			})
			$(this).parents('.message-history-wrapper').find('.total-message').parent().empty().append('<i class="icon-envelope icon-semi"></i><span class="total-message">&nbsp;'+total_message_num+'</span>')
			$(this).parents('.message-history-wrapper').find('.message-unread').hide();

		},
		likeMessage: function(e){
			e.preventDefault();
			var actionUri = $(this).attr('href') + "&" + Somea.Suite.getToken();
			$.ajax({
				url: actionUri,
				type: "POST"
			});
			$(this).parent().toggleClass('hide')
			$(this).parents('.message-quick-actions').find('.facebook-unlike-message').toggleClass('hide')
			$(document).click();
		},
		unlikeMessage: function(e){
			e.preventDefault();
			var actionUri = $(this).attr('href') + "&" + Somea.Suite.getToken()
			$.ajax({
				url: actionUri,
				type: "POST"
			});
			$(this).parent().toggleClass('hide')
			$(this).parents('.message-quick-actions').find('.facebook-like-message').toggleClass('hide')
			$(document).click();
		},
		likeYouTubeMessage: function(e){
			e.preventDefault();
			var actionUri = $(this).attr('href') + "&" + Somea.Suite.getToken();
			$.ajax({
				url: actionUri,
				type: "POST"
			});
			$(this).parent().toggleClass('hide')
			$(this).parents('.message-quick-actions').find('.youtube-dislike-message').toggleClass('hide')
			$(this).parents('.message-item').find('.icon-envelope-orange').fadeOut()
			$(document).click();
		},
		disLikeYouTubeMessage: function(e){
			e.preventDefault();
			var actionUri = $(this).attr('href') + "&" + Somea.Suite.getToken();
			$.ajax({
				url: actionUri,
				type: "POST"
			});
			$(this).toggleClass('hide')
			$(this).parents('.message-quick-actions').find('.youtube-like-message').toggleClass('hide')
			$(document).click();
		},
		editMessage: function(e){
			e.preventDefault();

			var that = this;
			var load_dialog_uri = $(this).attr('href');

			$.ajax({
				type: 'GET',
				dataType: 'html',
				url: load_dialog_uri
			}).done(function(data){
				$("#createMessage").remove();
				$('body').append(data)
				$('#createMessage').modal({
					show: true,
					backdrop: 'static'
				});

				if($("#MessageScheduleDateTime").val() !== ''){
					$(".btn-send-message").text($(".btn-send-message").data('schedule-text'))
				}



			});


			$(document).click();
		},
		discardDraft: function(e){
			e.preventDefault();
			var actionUri = $(this).attr('href') + "&" + Somea.Suite.getToken();
			if(confirm(Somea.i18n.get('remove_draft_confirmation'))){
				$.ajax({
					url: actionUri,
					type: "POST"
				});
				$(this).parents('.draft-message').fadeOutAndRemove();
			};
			$(document).click();
		},
		cancelScheduledMessage: function(e){
			e.preventDefault();
			var actionUri = $(this).attr('href') + "&" + Somea.Suite.getToken();
			if(confirm(Somea.i18n.get('remove_scheduled_confirmation'))){
				$.ajax({
					url: actionUri,
					type: "POST"
				});
				$(this).parents('.scheduled-message').fadeOutAndRemove();
			};
			$(document).click();
		}
	},

	Updater: {
		REFRESH_TIMEOUT: 30000,
		initialize: function(){
			window.setTimeout(this.check, this.REFRESH_TIMEOUT);

			$(document).on('click', '#refresh-stream a', this.refreshStream)

		},
		check: function(){

			var updates_uri = $('#message-stream').data('updates-url') + "?" + Somea.Suite.getToken()

			$.ajax({
				type: 'POST',
				dataType: 'html',
				url: updates_uri
			}).done(function(data){
				if(data.length > 0){
					$('#refresh-stream').remove()
					$("#message-stream").before(data)
					$('#refresh-stream').hide().fadeIn();
				}
				// TODO: Use "this" keyword here
				window.setTimeout(Somea.Messages.Updater.check, Somea.Messages.Updater.REFRESH_TIMEOUT)
			})

		},
		refreshStream: function(e){
			// e.preventDefault();
			$(this).html('<i class="icon-refresh icon-white"></i>Loading...');
		// Somea.Messages.Filters.submit(e);
		}
	},

	Modal: {
		initialize: function(){
			$('#create-message').on('click.messages_modal', this.open)

			// datepicker actions
			$(document).on('click.messages_modal', '.btn-cancel-datetimepicker', this.cancelDatepicker)
			$(document).on('click.messages_modal', '.btn-accept-datetimepicker', this.acceptDatepicker)
			$(document).on('click.messages_modal', '.btn-remove-schedule-field', this.removeScheduleDate)

			// url fields
			$(document).on('click.messages_modal', '.show-url-field', this.showUrlFields)
			$(document).on('click.messages_modal', '.btn-remove-url-field', this.hideUrlFields)
			$(document).on('click.messages_modal', '.btn-shorten-url', this.shortenUrl)
			$(document).on('blur.messages_modal', ' .message-attached-link', this.attachmentLinkOnBlur);
			$(document).on('kaydown.messages_modal', '.message-attached-link', this.attachmentLinkOnChange);

			// DAM
			$(document).on('click.messages_modal', '.show-dam-window', this.showDamWindow);
			$(document).on('click.messages_modal', '.hide-dam-window', this.hideDamWindow);
			$(document).on('click.messages_modal', '.btn-remove-dam-field', this.removeDamField);

			// Template management
			$(document).on('click.messages_modal', '.btn-load-template', this.loadTemplate);
			$(document).on('click.messages_modal', '.btn-use-template', this.useTemplate);
			$(document).on('click.messages_modal', '.btn-manage-templates', this.manageTemplates);
			$(document).on('click.messages_modal', '.btn-show-template-form', this.showTemplateForm);
			$(document).on('click.messages_modal', '#hideTemplateForm', this.hideTemplateForm);
			$(document).on('click.messages_modal', '#submitTemplateForm', this.submitTemplateForm);
			$(document).on('click.messages_modal', '.btn-close-templates-window', this.hideTemplateWindow)
			$(document).on('click.messages_modal', '.btn-delete-template', this.deleteTemplate)

			// prevent accidential submits
			$(document).on('keydown.messages_modal', "#newConversation input, #newAdvancedConversation input", this.preventEnter);
			$(document).on('submit.messages_modal', "#newConversation, #newAdvancedConversation", false);

			// init dialog actions
			$(document).on('click.messages_modal', '.btn-send-message', this.sendMessage);
			$(document).on('click.messages_modal', '.btn-save-draft', this.saveDraft);
			$(document).on('click.messages_modal', '.btn-send-later', this.scheduleMessage);

			// observe key length
			$(document).on('keyup.messages_modal', '#new-message-content, #MessageAttachmentLink', this.countMessageChars);
			// observe channel change
			$(document).on('change.messages_modal', "#newConversation .message-channels input", this.countMessageChars);

			$.receiveMessage(this.onDamWindowMessage, Somea.Messages.Modal.checkOrigin);

		},
		open: function(e){
			e.preventDefault();

			if($(this).hasClass('disabled')) return;
			$(this).button('loading');

			var new_dialog_uri = $(this).data('action');

			$.ajax({
				type: 'GET',
				dataType: 'html',
				url: new_dialog_uri
			}).done(function(data){
				Somea.Messages.Modal.onLoad(data);
			}).fail(function(data){
				$(document).trigger("Somea:Flash",{
					type:'Error',
					message: Somea.i18n.get('error_problem_with_application')
				});
			});

		},
		onLoad: function(data){
			$("#createMessage").remove();
			$('#create-message').button('reset');
			$('body').append(data)
			$('#createMessage').modal({
				show: true,
				backdrop: 'static'
			});
		},
		validateMessage: function(options){
			var isValid = true;
			var options = (options || {});

			// clear old errors
			$("#createMessage .message-error").remove()

			// validate channels (unless its a draft)
			if(!options.draft){
				if($('.message-channels input:checked').length == 0){
					isValid = false;
					$(".message-channels").append('<label class="message-error error"><span><span>' + Somea.i18n.get('error_choose_at_least_one_channel') + '</span></span></label>');
				}
			}

			// validate length of messageor attached file
			if($("#new-message-content").val().length == 0 && $("#MessageAttachmentLink").val().length == 0 && $("#MessageAttachmentFiles").val().length == 0){
				isValid = false;
				$("#new-message-content").after('<label class="message-error error"><span><span>' + Somea.i18n.get('error_message_cant_be_empty') + '</span></span></label>');
			}

			// validate maximum length
			twitter_channels = $(".message-channels input:checked").filter(function(el){
				return $(this).data('channel') == "TwitterChannel";
			}).length;
			if(twitter_channels > 0){
				var msg_length = $("#new-message-content").val().length

				// simplified urls detection in message body with counter adjustment
				var urls = $("#new-message-content").val().match(/(\b(?:(https?|ftp):\/\/)?((?:www\d{0,3}\.)?([a-z0-9.-]+\.(?:[a-z]{2,4})(?:\/[^\/\s]+)*))\b)/gi);
				var url_length_diff = 0;
				if(urls != null){
					for (var i=0; i<urls.length; i++) {
						url_length_diff += 23 - urls[i].length;
					}
				}
				msg_length += url_length_diff;
				// end of urls detection

				if($("#MessageAttachmentLink").val().length > 0){
					msg_length = msg_length + 1 + 23; //$("#MessageAttachmentLink").val().length;
				}

				if($("#MessageAttachmentFiles").val().length > 0){
					obj = $("#MessageAttachmentFiles").val();
					if(obj.length > 0){
						obj = obj[0];
					}

					msg_length = msg_length + 1 + 23; //obj.link.length;

				}

				if(msg_length > 140){
					isValid = false;
					$("#new-message-content").after('<label class="message-error twitter-error error"><span><span>' + Somea.i18n.get('error_message_too_long_for_twitter') + '</span></span></label>');
					this.countMessageChars();
				}
			}

			return isValid;
		},
		countMessageChars: function(e){
			var msg = $('#new-message-content')
			var msg_length = msg.val().length
			// apply only if Twitter is selected

			// simplified urls detection in message body with counter adjustment
			var urls = msg.val().match(/(\b(?:(https?|ftp):\/\/)?((?:www\d{0,3}\.)?([a-z0-9.-]+\.(?:[a-z]{2,4})(?:\/[^\/\s]+)*))\b)/gi);
			var url_length_diff = 0;
			if(urls != null){
				for (var i=0; i<urls.length; i++) {
					url_length_diff += 23 - urls[i].length;
				}
			}
			msg_length += url_length_diff;
			// end of urls detection


			if($("#MessageAttachmentLink").val().length > 0){
				msg_length = msg_length + 1 + 23; //$("#MessageAttachmentLink").val().length;
			}

			if($("#MessageAttachmentFiles").val().length > 0){
				obj = $("#MessageAttachmentFiles").val();
				if(obj.length > 0){
					obj = obj[0];
				}

				msg_length = msg_length + 1 + 23; //obj.link.length;

			}

			twitter_channels = $(".message-channels input:checked").filter(function(el){
				return $(this).data('channel') == "TwitterChannel";
			}).length;

			if(twitter_channels > 0){
				$("#msg-counter span").text(msg_length)
				$("#msg-counter:hidden").show();
				if(msg_length > 140){
					$("#msg-counter").addClass('error');
				} else{
					$("#msg-counter").removeClass('error');
					$(".twitter-error").remove()

				}
			}
			else{
				$("#msg-counter:visible").hide();
			}

		},
		sendMessage: function(e){
			e.preventDefault();
			var that = this;

			$(this).button('loading');

			if($(this).is('.disabled')) return;

			var form = $('#newConversation');
			var isScheduled = false;
			var validMessage = Somea.Messages.Modal.validateMessage();
			if($("#MessageScheduleDateTime").val() !== ''){
				isScheduled = true;
			}

			if(false == validMessage){
				$(this).button('reset');
				return;
			}

			$.ajax({
				type: 'POST',
				data: form.serialize(),
				url: form.attr('action'),
				dataType: 'html'
			}).done(function(data){
				// if ajax successfull
				if($(data).find('#newConversation').length == 0){
					$('#createMessage').modal('hide');
					var appended = false;
					var data_id = $(data).prop('id');

					if(isScheduled){
						$(document).trigger("Somea:Flash",{
							type:'OK',
							message: Somea.i18n.get('message_successfully_scheduled_content')
						});

						// if you are on scheduled view
						if(window.location.href.match(/scheduled/)){
							if($("#" + data_id).length > 0){
								$("#" + data_id).replaceWith(data);
							} else{
								$("#message-stream").prepend(data);
								appended = true;
							}
						} else {
							if($("#" + data_id).length > 0){
								$("#" + data_id).remove();
							}
						}

					} else{

						$(document).trigger("Somea:Flash",{
							type:'OK',
							message: Somea.i18n.get('message_successfully_sent_content')
						});
						// dont append when not on message center lists
						if( window.location.href.match(/messagescenter/) ) {
							$("#message-stream").prepend(data);
							appended = true;
						} else{
							if($("#" + data_id).length > 0){
								$("#" + data_id).remove();
							}
						}
					}

					if(appended){
						if($('#message-stream .no-messages').length > 0){
							$('#message-stream .no-messages').remove();
						}

						if($('.highlight-message').length > 0){
							$('.highlight-message').hide().fadeIn(function(){
								$(this).removeClass('highlight-message')
							})
						}
					}

				} else{
					$('#createMessage').modal('hide');
					$('#createMessage').replaceWith(data)
					$('#createMessage').modal('show');
				}


			});


		},
		saveDraft: function(e){
			e.preventDefault();
			var that = this;

			if($(this).is('.disabled')) return;
			$(this).button('loading');

			$('#messageIsDraft').val(1);
			var form = $('#newConversation')

			var validMessage = Somea.Messages.Modal.validateMessage({
				draft: true
			});

			if(false == validMessage){
				$(this).button('reset');
				return;
			}

			$.ajax({
				type: 'POST',
				data: form.serialize(),
				url: form.attr('action'),
				dataType: 'html',
			}).done(function(data){
				if($(data).find('#newConversation').length == 0){
					$('#createMessage').modal('hide')
					$(document).trigger("Somea:Flash",{
						type:'OK',
						message: Somea.i18n.get('draft_successfully_saved_content')
					});

					// dont append when not on drafts lists
					if(window.location.href.match(/drafts/) == null){

						// but if it was scheduled message then remove it
						var data_id = $(data).prop('id');
						if($("#" + data_id).length > 0){
							$("#" + data_id).fadeOut();
						}

						return;
					}

					if($('message-stream .no-messages').length > 0){
						$('message-stream .no-messages').remove();
					}

					// add  item on top or replace existing
					var data_id = $(data).prop('id');
					if($("#" + data_id).length > 0){
						$("#" + data_id).replaceWith(data)
					} else{
						$("#message-stream").prepend(data);
					}
					$('.highlight-message').hide().fadeIn(function(){
						$(this).removeClass('highlight-message')
					})


				} else{
					$('#createMessage').replaceWith(data);
				}
			});

		},
		scheduleMessage: function(e){
			e.preventDefault();

			var dp = $('#datetimepicker').datetimepicker({
				format: 'dd-mm-yyyy hh:ii',
				language: $('html').prop('lang'),
				startDate: new Date()
			})

			$(".btn-accept-datetimepicker").hide();

			dp.on('changeDate', function(ev){

				var dpglobal = $.fn.datetimepicker.DPGlobal
				var selected_date = dpglobal.formatDate(ev.date, dpglobal.parseFormat("dd-mm-yyyy hh:ii", 'standard'), 'en', 'standard');
				var selected_date_array = selected_date.split(" ");
				$("#MessageScheduleDateTime").val(selected_date)
				$("#MessageScheduleDate").val(selected_date_array[0])
				$("#MessageScheduleHour").val(selected_date_array[1])
				$(".btn-accept-datetimepicker").show();

			});

			$("#datepicker-popover").show()

		},
		cancelDatepicker: function(e){
			e.preventDefault();
			$('#datetimepicker').datetimepicker('remove');
			$("#datepicker-popover").hide();
		},
		acceptDatepicker: function(e){
			e.preventDefault();
			$('#datetimepicker').datetimepicker('remove');
			$("#datepicker-popover").hide();
			$(".schedule-date-display").text($("#MessageScheduleDateTime").val());
			$(".schedule-row").fadeIn();
			// replace button text
			$(".btn-send-message").text($(".btn-send-message").data('schedule-text'))
		},
		removeScheduleDate: function(e){
			$(".schedule-row").fadeOut();
			$("#MessageScheduleDateTime").val('');
			$("#MessageScheduleDate").val('');
			$("#MessageScheduleHour").val('');
			$(".btn-send-message").text($(".btn-send-message").data('send-now-text'));
		},
		showUrlFields: function(e){
			var context = $(this).parents('.network-container').first();
			if(context.length == 0){
				context = $(this).parents('.quick-reply-container');
			}
			e.preventDefault();

			$(this).hide();
			$('.message-attachments', context).fadeIn()
		},
		hideUrlFields: function(e){
			var context = $(this).parents('.network-container').first();
			if(context.length == 0){
				context = $(this).parents('.quick-reply-container');
			}
			e.preventDefault();
			$('.message-attachments', context).hide();
			;
			$('.show-url-field', context).fadeIn();
			$(".message-attached-link", context).val('');
			$('.thumbnail-selector', context).remove();
			$('.message-attached-thumb', context).val('');
			$('.auto-thumbnail', context).prop('checked', true);
		},
		shortenUrl: function(e){
			var button = $(this).button('loading');
			var input = $("#MessageAttachmentLink")
			var attached_url = input.val();
			var shorten_action = $(button).data('action');
			var context = $(this).parents('.network-container').first();

			$.ajax({
				url: shorten_action,
				type: 'GET',
				data: {
					url: attached_url
				}
			}).done(function(data){
				button.button('reset')
				if(data != false){
					input.val(data)
					$(".btn-shorten-url", context).fadeOut();
				}
			}).fail(function(data){
				button.button('reset')
				$(document).trigger("Somea:Flash",{
					type:'Error',
					message: Somea.i18n.get('url_could_not_be_shortened_at_this_moment')
				});
			});

		},
		attachmentLinkOnBlur: function(e){
			var context = $(this).parents('.network-container').first();
			var value = $(".message-attached-link", context).val();

			if(value != "" && value.match(/http/) == null){
				value = 'http://' + value;
				$(".message-attached-link", context).val(value);
			}

			//			$('.auto-thumbnail', context).prop('checked', true);
			$('.thumbnail-selector', context).remove();
			$('.message-attached-thumb', context).val('');

		},
		attachmentLinkOnChange: function(e){
			var context = $(this).parents('.network-container').first();

			//			$('.auto-thumbnail', context).prop('checked', true);
			$('.thumbnail-selector', context).remove();
			$('.message-attached-thumb', context).val('');
			$('.btn-shorten-url:hidden', context).fadeIn();
		},
		preventEnter: function(e){
			if(e.which == 13){
				e.preventDefault();
			}
		},
		showDamWindow: function(e){
			var template, dam_url;
			e.preventDefault();

			var dam_url = Somea.Messages.Modal.damUrl;

			template  = '<div id="damWindow" class="somea-box modal modal-medium fade" tabindex="-1" role="dam-dialog">';
			template += '<header><h1>' + Somea.i18n.get('dam_window_title') + '</h1></header>';
			template += '<iframe border="0" frameborder="0" src="' + dam_url + '"></iframe>';
			template += '<footer><button class="btn hide-dam-window">' + Somea.i18n.get('cancel_button') + '</button></footer>';
			template += '</div>';

			$("#damWindow").remove();
			$('body').append(template);

			$("#createMessage").modal('hide');

			$('#damWindow').modal({
				show: true,
				backdrop: 'static'
			});

			$("#damWindow").on('hidden', function(){
				$("#createMessage").modal('show');
			});
		},
		hideDamWindow: function(e){
			e.preventDefault();
			$("#damWindow").modal('hide');
		},
		removeDamField: function(e){
			var context = $(this).parents('.network-container').first();

			e.preventDefault();
			$('.message-attached-file', context).val('');
			$('.message-attachments-files', context).hide();
		},
		onDamWindowMessage: function(message){
			var assets = message.data;
			var context = null;

			$("#damWindow").modal('hide');

			if(assets && assets != ''){
				// trim apostrophes from beginning / end
				if (assets.charAt(0) == "\'"){
					assets = assets.slice(1, assets.length-1)
				}
				assets_object = eval(assets)
				$('.message-attached-file').val(assets);
				$('.attached-file-link').attr('href',assets_object[0].link);
				$('.message-attachments-files:hidden').slideDown();
			}

		},
		checkOrigin: function(eventOrigin){
			var sender = Somea.Messages.Modal.phoenixHost;
			if((sender.replace( /([^:]+:\/\/[^\/]+).*/, '$1' )) === eventOrigin) {
				return true;
			} else {
				return false;
			}
		},
		showTemplateForm: function(e){
			e.preventDefault();
			$("#createMessage .template-select-row").hide()
			$("#createMessage .template-save-row").fadeIn()
		},
		submitTemplateForm: function(e){
			e.preventDefault();

			var templateName = $("#templateName").val()
			var button = $(this);
			var form = $('#newConversation');

			// return if template name is empty
			if(templateName == '') return;

			button.button('loading')

			$.ajax({
				type: 'POST',
				data: form.serialize(),
				url: button.data('action'),
				dataType: 'html'
			}).done(function(data){

				$('.template-select-row .dropdown-menu .divider').before(data);
				button.button('reset');
				$(document).trigger("Somea:Flash",{
					type:'OK',
					message: Somea.i18n.get('message_template_successfully_saved')
				});
				$("#hideTemplateForm").trigger('click');

			}).fail(function(data){
				button.button('reset');
				$(document).trigger("Somea:Flash",{
					type:'Error',
					message: Somea.i18n.get('message_template_error_processing_form')
				});
			});

		},
		hideTemplateForm: function(e){
			$("#manageTemplates").val('')
			$("#createMessage .template-save-row").hide()
			$("#createMessage .template-select-row").fadeIn()
		},
		loadTemplate: function(e){
			e.preventDefault();

			$('.template-dropdown').button('loading')
			var template_uri = $(this).prop('href');

			$.ajax({
				method: 'GET',
				dataType: 'json',
				url: template_uri
			}).done(function(data){
				$("#new-message-content").val(data.content);
				$("#templateName").val(data.name)

				if(data.attachedLink != ""){
					$('.show-url-field').click()
					$("#MessageAttachmentLink").val(data.attachedLink)
				}

				/*
        if(data.attachedFile != ""){
          $('.show-url-field').click()
          $("#MessageAttachmentFiles").val(data.attachedFile)
        } */

				$('.template-dropdown').button('reset')
			}).fail(function(data){
				$(document).trigger("Somea:Flash",{
					type:'Error',
					message: Somea.i18n.get('error_problem_with_application')
				});
			});


		},
		useTemplate: function(e){
			e.preventDefault();
			var button = $(this);
			button.button('loading')
			var template_uri = button.prop('href');

			$.ajax({
				method: 'GET',
				dataType: 'json',
				url: template_uri
			}).done(function(data){
				$("#new-message-content").val(data.content);
				$("#templateName").val(data.name)

				if(data.attachedLink != ""){
					$('.show-url-field').click()
					$("#MessageAttachmentLink").val(data.attachedLink)
				}

				/*
        if(data.attachedFile != ""){
          $('.show-url-field').click()
          $("#MessageAttachmentFiles").val(data.attachedFile)
        } */
				$("#templatesForm").modal('hide');


			}).fail(function(data){
				$(document).trigger("Somea:Flash",{
					type:'Error',
					message: Somea.i18n.get('error_problem_with_application')
				});
			});
		},
		hideTemplateWindow: function(e){
			e.preventDefault();
			$("#templatesForm").modal('hide');
		},
		manageTemplates: function(e){
			e.preventDefault();

			var templates_uri = $(this).prop('href');

			$.ajax({
				method: 'GET',
				dataType: 'html',
				url: templates_uri
			}).done(function(data){
				$("#templatesForm").remove();
				$('body').append(data);

				$("#createMessage").modal('hide');

				$('#templatesForm').modal({
					show: true,
					backdrop: 'static'
				});
				$("#templatesForm").on('hidden', function(){
					$("#createMessage").modal('show');
				});

			}).fail(function(data){
				$(document).trigger("Somea:Flash",{
					type:'Error',
					message: Somea.i18n.get('error_problem_with_application')
				});
			});


		},
		deleteTemplate: function(e){
			e.preventDefault();

			var url = $(this).prop('href') + "&" + Somea.Suite.getToken()
			var templateId = $(this).data('template')

			$.ajax({
				url: url,
				type: 'POST',
				data: {}
			});

			$('#' +templateId).remove();
			$(this).parents('li').first().fadeOut(function(){
				$(this).remove();
				if($(".template-item").length == 0){
					$(".no-templates").removeClass('hide');
				}
			});


			return false;

		}

	},

	AdvancedModal: {
		initialize: function(){
			$(document).on('click.messages_modal', '#newAdvancedConversation .btn-send-advanced-message', this.sendMessage);
			$(document).on('click.messages_modal', '.customize-for-channels', this.open);

			// thumbnails
			$(document).on('change.messages_modal', "#newAdvancedConversation input[name='messageMore[thumbnail]']", this.thumbnailSelector);
			$(document).on('click.messages_modal', "#newAdvancedConversation .thumb-prev, #newAdvancedConversation .thumb-next", this.switchThumbnail);

			// toggle DAM
			$(document).on('click.messages_modal', '.toggle-direct-upload', this.toggleDirectUpload);

			// observe channel change
			$(document).on('change.messages_modal', "#newAdvancedConversation .message-channels input", this.updateChannelsCounters);

			// observe characters change on twitter
			$(document).on('keyup.messages_modal', "#twitter-message-content", this.countMessageChars);
			$(document).on('change.messages_modal', "#tab-twitter .message-attached-link", this.countMessageChars);

		},
		updateChannelsCounters: function(e){
			var fb_channels = $("#tab-facebook .message-channels input:checked").length
			var twitter_channels = $("#tab-twitter .message-channels input:checked").length
			var linkedin_channels = $("#tab-linkedin .message-channels input:checked").length
			$('.nav-tab-facebook .badge-selected').text(fb_channels);
			$('.nav-tab-twitter .badge-selected').text(twitter_channels)
			$('.nav-tab-linkedin .badge-selected').text(linkedin_channels)
		},
		open: function(e){
			e.preventDefault();

			if($(this).hasClass('disabled')) return;
			$(this).button('loading');

			var advanced_dialog_uri = $(this).data('action');

			$.ajax({
				type: 'GET',
				dataType: 'html',
				url: advanced_dialog_uri
			}).done(function(data){
				Somea.Messages.AdvancedModal.onLoad(data);
			}).fail(function(data){
				$(document).trigger("Somea:Flash",{
					type:'Error',
					message: Somea.i18n.get('error_problem_with_application')
				});
			});
		},
		onLoad: function(data){
			$("#createMessage").modal('hide');

			// copy current dialog content
			var txt = $("#new-message-content").val();
			var selected_channels = [];
			var attached_link=$('#MessageAttachmentLink').val();
			var attached_file=$('#MessageAttachmentFiles').val();
			var attached_file_link=$('.attached-file-link').attr('href');


			$(".message-channels input:checkbox").each(function(index,item){
				selected_channels.push({
					id: $(item).prop('id'),
					checked: $(item).prop('checked')
				})
			});


			$("#createMessage").remove();


			$('body').append(data);
			$('#createMessage').modal({
				show: true,
				backdrop: 'static'
			});

			// populate content
			$('.network-container textarea').val(txt);
			// populate channels
			$.each(selected_channels, function(index, item){
				$('#'+item.id).prop('checked', item.checked);
			});

			// initialize counters on channels tabs
			var fb_channels = $("#tab-facebook .message-channels input:checkbox").length
			var fb_channels_checked = $("#tab-facebook .message-channels input:checked").length

			if(fb_channels == 0){
				//$("#tab-facebook").remove();
				$('.nav-tab-facebook').remove();
			//$("#facebook-channel-form").remove();
			} else{
				$('.nav-tab-facebook .badge-selected').text(fb_channels_checked);
				$('.nav-tab-facebook .badge-all').text(fb_channels)
				if(attached_link != ""){
					$('#tab-facebook .show-url-field').click();
					$('#MessageAttachmentLinkFacebook').val(attached_link);
				}

				if(attached_file_link != "" && attached_file != ""){
					$('#tab-facebook .message-attachments-files').show();
					$('#MessageAttachmentFilesFacebook').val(attached_file);
					$('#tab-facebook .attached-file-link').attr('href', attached_file_link);
				}
			}

			// initialize counters on channels tabs
			var twitter_channels = $("#tab-twitter .message-channels input:checkbox").length
			var twitter_channels_checked = $("#tab-twitter .message-channels input:checked").length

			if(twitter_channels == 0){
				//$("#tab-twitter").remove();
				$('.nav-tab-twitter').remove();
			//$("#twitter-channel-form").remove();
			} else{
				$('.nav-tab-twitter .badge-selected').text(twitter_channels_checked)
				$('.nav-tab-twitter .badge-all').text(twitter_channels)

				if(attached_link != ""){
					$('#tab-twitter .show-url-field').click();
					$('#MessageAttachmentLinkTwitter').val(attached_link);
				}

				if(attached_file_link != "" && attached_file != ""){
					$('#tab-twitter .message-attachments-files').show();
					$('#MessageAttachmentFilesTwitter').val(attached_file);
					$('#tab-twitter .attached-file-link').attr('href', attached_file_link);
				}
			}

			// initialize linkedin on channels tabs
			var linkedin_channels = $("#tab-linkedin .message-channels input:checkbox").length
			var linkedin_channels_checked = $("#tab-linkedin .message-channels input:checked").length

			if(linkedin_channels == 0){
				//$("#tab-linkedin").remove();
				$('.nav-tab-linkedin').remove();
			//$("#linkedin-channel-form").remove();
			} else{
				$('.nav-tab-linkedin .badge-selected').text(linkedin_channels_checked)
				$('.nav-tab-linkedin .badge-all').text(linkedin_channels)
				if(attached_link != ""){
					$('#tab-linkedin .show-url-field').click();
					$('#MessageAttachmentLinkLinkedin').val(attached_link);
				}

				if(attached_file_link != "" && attached_file != ""){
					$('#tab-linkedin .message-attachments-files').show();
					$('#MessageAttachmentFilesLinkedin').val(attached_file);
					$('#tab-linkedin .attached-file-link').attr('href', attached_file_link);
				}
			}



		},
		validateMessage: function(options){
			var isValid = true;
			var options = (options || {});

			// clear old errors
			$("#createMessage .message-error").remove()

			// validate channels (unless its a draft)
			if($('.message-channels input:checked').length == 0){
				isValid = false;
				$(".message-channels").first().append('<label class="message-error error"><span><span>' + Somea.i18n.get('error_choose_at_least_one_channel') + '</span></span></label>');
			}

			// validate for facebook
			if($("#tab-facebook .message-channels input:checked").length > 0){
				if($("#facebook-message-content").val().length == 0 && $("#tab-facebook .message-attached-link").val().length == 0 && $("#tab-facebook .message-attached-file").val().length == 0){
					isValid = false;
					$("#facebook-message-content").after('<label class="message-error error"><span><span>' + Somea.i18n.get('error_message_cant_be_empty') + '</span></span></label>');
				}
			}

			// validate for twitter
			if($("#tab-twitter .message-channels input:checked").length > 0){
				if($("#twitter-message-content").val().length == 0 && $("#tab-twitter .message-attached-link").val().length == 0 && $("#tab-twitter .message-attached-file").val().length == 0){
					isValid = false;
					$("#twitter-message-content").after('<label class="message-error error"><span><span>' + Somea.i18n.get('error_message_cant_be_empty') + '</span></span></label>');
				}


				// validate maximum length
				var msg_length = $("#twitter-message-content").val().length;

				// simplified urls detection in message body with counter adjustment
				var urls = $("#twitter-message-content").val().match(/(\b(?:(https?|ftp):\/\/)?((?:www\d{0,3}\.)?([a-z0-9.-]+\.(?:[a-z]{2,4})(?:\/[^\/\s]+)*))\b)/gi);
				var url_length_diff = 0;
				if(urls != null){
					for (var i=0; i<urls.length; i++) {
						url_length_diff += 23 - urls[i].length;
					}
				}
				msg_length += url_length_diff;
				// end of urls detection

				if($("#tab-twitter .message-attached-link").val().length > 0){
					msg_length = msg_length + 1 + 23; //+ $("#tab-twitter .message-attached-link").val().length;
				}

				if($("#tab-twitter .message-attached-file").val().length > 0){
					obj = $("#tab-twitter .message-attached-file").val();
					if(obj.length > 0){
						obj = obj[0];
					}

					msg_length = msg_length + 1 + 23; //+ obj.link.length;

				}

				if(msg_length > 140){
					isValid = false;

					$("#twitter-message-content").after('<label class="message-error twitter-error error"><span><span>' + Somea.i18n.get('error_message_too_long_for_twitter') + '</span></span></label>');
				}
			}

			// validate for linkedin
			if($("#tab-linkedin .message-channels input:checked").length > 0){
				if($("#linkedin-message-content").val().length == 0 && $("#tab-linkedin .message-attached-link").val().length == 0 && $("#tab-facebook .message-attached-file").val().length == 0){
					isValid = false;
					$("#linkedin-message-content").after('<label class="message-error error"><span><span>' + Somea.i18n.get('error_message_cant_be_empty') + '</span></span></label>');
				}
			}

			return isValid;
		},
		countMessageChars: function(e){

			var context = $(this).parents('.network-container').first();

			var msg = $('#twitter-message-content')
			var msg_length = msg.val().length
			// apply only if Twitter is selected

			// simplified urls detection in message body with counter adjustment
			var urls = msg.val().match(/(\b(?:(https?|ftp):\/\/)?((?:www\d{0,3}\.)?([a-z0-9.-]+\.(?:[a-z]{2,4})(?:\/[^\/\s]+)*))\b)/gi);
			var url_length_diff = 0;
			if(urls != null){
				for (var i=0; i<urls.length; i++) {
					url_length_diff += 23 - urls[i].length;
				}
			}
			msg_length += url_length_diff;
			// end of urls detection

			if($(".message-attached-link", context).val().length > 0){
				msg_length = msg_length + 1 + 23; //$(".message-attached-link", context).val().length;
			}

			if($(".message-attached-file", context).val().length > 0){
				obj = $(".message-attached-file", context).val();
				if(obj.length > 0){
					obj = obj[0];
				}

				msg_length = msg_length + 1 + 23; //obj.link.length;

			}

			$("#msg-counter span").text(msg_length)

			if(msg_length > 140){
				$("#msg-counter").addClass('error');
			} else{
				$("#msg-counter").removeClass('error');
				$(".twitter-error").remove();
			}

		},


		sendMessage: function(e){
			e.preventDefault();

			$(this).button('loading');

			if($(this).is('.disabled')) return;

			var form = $('#newAdvancedConversation');
			var validMessage = Somea.Messages.AdvancedModal.validateMessage();

			if(false == validMessage){
				$(this).button('reset');
				return;
			}

			$.ajax({
				type: 'POST',
				data: form.serialize(),
				url: form.attr('action'),
				dataType: 'html'
			}).done(function(data){
				// if ajax successfull
				if($(data).find('#newAdvancedConversation').length == 0){
					$('#createMessage').modal('hide');
					var appended = false;
					var data_id = $(data).prop('id');


					$(document).trigger("Somea:Flash",{
						type:'OK',
						message: Somea.i18n.get('message_successfully_sent_content')
					});
					// dont append when not on message center lists
					if( window.location.href.match(/messagescenter/) ) {
						$("#message-stream").prepend(data);
						appended = true;
					} else{
						if($("#" + data_id).length > 0){
							$("#" + data_id).remove();
						}
					}

					// if message was appended to stream
					if(appended){
						if($('#message-stream .no-messages').length > 0){
							$('#message-stream .no-messages').remove();
						}

						if($('.highlight-message').length > 0){
							$('.highlight-message').hide().fadeIn(function(){
								$(this).removeClass('highlight-message')
							})
						}
					}

				} else{
					$('#createMessage').modal('hide');
					$('#createMessage').replaceWith(data)
					$('#createMessage').modal('show');
				}
			});
		},
		thumbnailSelector: function(e){

			var context = $(this).parents('.network-container').first();

			if($(this).val() !== 'custom'){
				$('.thumbnail-selector').remove();
				$('#MessageAttachmentLinkThumb').val('')
				return;
			}

			var attached_url = $(".message-attached-link", context).val()


			var template  = '<div class="thumbnail-selector loading"></div>'
			$('.thumbnail-selector').remove();
			$('.url-options').after(template);
			var loader = $('.thumbnail-selector').spin();

			$.ajax({
				url: Somea.Messages.Modal.ImageProxyUrl,
				type: 'GET',
				data: {
					url: attached_url,
					size: 80
				}
			}).done(function(data){
				var images = data;
				loader.stop();

				if(images.length == 0){
					var template = 'Thumbnail: <div class="empty-preview">The url was invalid, or no thumbnail was found for this url.</div>';
					$('.thumbnail-selector').removeClass('loading').html(template);
					$('.no-thumbnail').prop('checked', true);
					return;
				}

				var template = 'Thumbnail: <div class="preview"></div>'
				template += '<div class="controls">'
				template += '<a href="#" class="thumb-prev">«</a>'
				template += '<a href="#" class="thumb-next">»</a>'
				template += '<span class="counter"></a>';
				template += '</div>'

				$('.thumbnail-selector').removeClass('loading').html(template);

				$('.thumbnail-selector').data('images', images)
				$('.thumbnail-selector').data('current', 1)

				var image_tag = Somea.Messages.Modal.ImageProxyUrl + "?image=" + images[0];
				$('.thumbnail-selector .preview').html('<img src="' + image_tag + '" alt=""/>')
				$('.thumbnail-selector .counter').html(1 + " / " + images.length);

				$('#MessageAttachmentLinkThumb').val(images[0])

			});
		},
		switchThumbnail: function(e){
			e.preventDefault();

			var current = $('.thumbnail-selector').data('current')
			var images = $('.thumbnail-selector').data('images')

			if($(this).is('.thumb-prev')){
				if(current == 1){
					current = images.length
				} else{
					current = current - 1;
				}
			} else{
				if(current == images.length){
					current = 1;
				} else{
					current = current + 1;
				}
			}

			var image_tag = Somea.Messages.Modal.ImageProxyUrl + "?image=" + images[current-1];
			$('.thumbnail-selector .preview').html('<img src="' + image_tag + '" alt=""/>')
			$('.thumbnail-selector .counter').html(current + " / " + images.length);

			$('.thumbnail-selector').data('current', current)

			$('#MessageAttachmentLinkThumb').val(images[current-1])

		},
		toggleDirectUpload: function(e){
			e.preventDefault();
			$("#post-mode").slideToggle()
		}
	},

	Filters: {
		initialize: function(){
			$(document).on('click.message_filters', '.filter-switch', this.toggle);
			$(document).on('click.message_filters', '.select-all-channels', this.selectAll);
			$(document).on('click.message_filters', '.toggle-readonly-channels', this.toggleReadOnly);
			$(document).on('click.message_filters', '.submit-filters-action', this.submit);
			$(document).on('click.message_filters', '.reset-filters-action', this.reset);
			$(document).on('click.message_filters', '.filter-info .label', this.toggle);

			this.markActive();
			this.toggleHiddenChannels();

		},
		markActive: function(){
			var button = $('.filter-toggle')
			var filters = $('#filter-dialog')

			if(filters.is('.filter-enabled')){
				button.addClass('btn-primary');
				this.showFilterInfo();
			}

		},
		showFilterInfo: function(){
			$('.filter-info').remove();
			var filter_info = '<p class="filter-info"><span class="label label-info">' + $('#filter-dialog').data('filtered-view-text') + '</span>';
			filter_info += ' <span class="label-group"></span>';
			filter_info += '</p>';

			$('.stream-headline h1').after(filter_info);

			// append channels
			var channels = $('#filter-dialog .filter-by-channels input:checkbox');
			if(channels.length > channels.filter(':checked').length && channels.filter(':checked').length > 0){
				$('.filter-info .label-group').append('<span class="label label-bordered">' + $('#filter-dialog').data('channels-filtered-text') + '</span>');
			}

			// append time
			var by_time = $("#filter-dialog .filter-by-time input:radio:checked")
			value = $(by_time).val();
			var label = $(by_time).next().text();
			if(value == 1000){
				label = $("#filter-dialog .filter-by-time h5").text() + ": " + label;
			}
			$('.filter-info .label-group').append('<span class="label label-bordered">' + label + '</span>');

			// append status
			var filters = $("#filter-dialog .filter-by-status input:checkbox:checked")
			filters.each(function(i,item){
				var label = $(item).next().text();
				$('.filter-info .label-group').append('<span class="label label-bordered">' + label + '</span>');
			});

		},
		toggleHiddenChannels: function(){
			var readonly_channels = $('.readonly-channels input:checked')
			if(readonly_channels > 0){
				$('.readonly-channels').removeClass('hide');
			}
		},
		toggle: function(e){
			e.preventDefault();
			$("#filter-dialog").slideToggle()
		},
		selectAll: function(e){
			e.preventDefault();
			$('#filter-dialog .active-channels input[type=checkbox]').prop('checked', 'checked')
		},
		toggleReadOnly: function(e){
			e.preventDefault();
			$(this).find('i').toggleClass('icon-arrow-collapsed').toggleClass('icon-arrow-open')
			$(this).parent().find('.readonly-channels').toggleClass('hide')
		},
		submit: function(e){
			e.preventDefault();
			if($(this).is('.disabled')) return;
			var that = this;
			$(this).button('loading')

			var filterForm = $("#filterSetup")

			$.ajax({
				url: filterForm.attr('action'),
				type: 'POST',
				data: filterForm.serialize(),
			}).done(function(data){
				$(that).button('reset')
				var newData = $(data).find("#message-stream").html();
				$("#message-stream").html(newData).hide().fadeIn();

				// mark class on filter to mark it as active
				$('#filter-dialog').addClass('filter-enabled');
				$('.filter-toggle').addClass('btn-primary').click();

				Somea.Messages.Filters.showFilterInfo()


			});
		},
		reset: function(e){
			e.preventDefault();
			if($(this).is('.disabled')) return;
			var that = this;
			$(this).button('loading');
			$('#resetFilter').val(1);
			$("#filterSetup").submit();
		}
	},

	initialize: function(){

		var body_class = $('body').attr('class')

		if(body_class.match(/messagescenter|drafts|scheduled|notification/) == null) return

		this.List.initialize();
		this.InfiniteScroll.initialize();
		this.QuickActions.initialize();
		if(body_class.match(/messagescenter/)){
			this.Updater.initialize();
		}
		this.Modal.initialize();
		this.AdvancedModal.initialize();
		this.Filters.initialize();
	}
}

$(document).ready(function(){
	Somea.Messages.initialize();
})
