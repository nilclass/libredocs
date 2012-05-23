var lp = {"locales":[{"id":"en","name":"english"},{"id":"fr","name":"french"}]};

lp = $.extend(lp, {

	/**
	 * Actual user locale
	 */
	locale: 'en',

	/**
	 * Translation dictionaries
	 */
	dictionaries: {},

	setLocale: function(locale) {
		if (!locale) {
			locale = localStorage.getItem('locale');
		}
		if (!locale) {
			locale = window.navigator.language ? window.navigator.language : window.navigator.userLanguage;
		}

		if (locale != lp.locale) {
			localStorage.setItem('locale', locale);
			lp.locale = locale;

			$.each(lp.locales, function(lidx, availableLocale) {
				if (locale.indexOf(availableLocale.id) != -1 || !locale.indexOf(availableLocale.name != -1)) {
					$('#locale a').removeClass('selected');
					$('#lang-' + availableLocale.id).addClass('selected');
					lp.translateTo(availableLocale.id);
				}
			} );
		}
	},

	getDictionary: function(locale) {
		$.getJSON('js/locales/' + locale + '.json', function(dictionary) {
			lp.dictionaries[locale] = dictionary;
			lp.translateTo(locale);
		} );
	},

	translateTo: function(locale, $from) {
		if (!locale) {
			return;
		}

		if (typeof lp.dictionaries[locale] == 'undefined') {
			lp.getDictionary(locale);
			return;
		}

		var $toTranslate = $from ? $from.find('.translatable') : $('.translatable');
		$toTranslate.each(function(idxe, element) {
			var $element = $(element);
			var translation = '';
      var key = $element.data('translatable');
      
      if(! key) {
          // element was (probably) dynamically loaded, hence original text
          // hasn't been cached yet.
          key = lp.determineTranslationKey($element);
          if(! key) {
              // still no translation key (i.e. element is empty).
              // giving up.
              return;
          }
			}

			if (typeof lp.dictionaries[locale][key] == 'string') {
				translation = lp.dictionaries[locale][key];
			} else {
  		  translation = key;
			}
			if ($element.html()) {
				$element.html(translation);
			}
			// need i18n
//			if ($element.data('text')) {
//				$element.data('text', translation);
//			}
		} );
	},

	determineTranslationKey: function($element) {
    var value = $element.html().replace(/"/g, '\'');
		$element.data('translatable', value);
    return value;
	},

	initTranslation: function($from) {
		var $toInit = $from ? $from.find('.translatable') : $('.translatable');
		$toInit.each(function(idxe, element) {
			var $element = $(element);
	    lp.determineTranslationKey($element);
		} );
	},
	
} );

$(document).ready(function() {

	// Create translations availables
	var $locale = $('#locale');
	$.each(lp.locales, function(lidx, locale) {
		var $li = $('<li />');
		var $a = $('<a href="#" id="lang-' + locale.id + '" />')
			 .html('<img src="images/countries/' + locale.id + '.png" alt="' + locale.name + ' flag" />')
			 .click(function() {
				 lp.setLocale(locale.id);
				 return false;
			 } )
			 .appendTo($li);
		$li.appendTo($locale);
	} );


	lp.initTranslation();
	lp.setLocale();

} );