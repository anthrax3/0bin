;

/* Start random number generator seeding ASAP *%
sjcl.random.startCollectors();
/* Ensure jquery use cache for ajax requests */
$.ajaxSetup({ cache: true });

zerobin = {
  encrypt: function(key, content) {
    return sjcl.encrypt(key, lzw.compress(content));
  },
  decrypt: function(key, content) {
    return lzw.decompress(sjcl.decrypt(key, content));
  },
  make_key: function() {
    return sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0);
  },
  get_date: function(){
    var date = new Date();
    return date.getDate()+"-"+(date.getMonth()+1)+"-"+date.getFullYear();
  },
  get_time: function(){
    var date = new Date();
    var h=date.getHours();
    var m=date.getMinutes();
    var s=date.getSeconds();
    if (h<10) {h = "0" + h}
    if (m<10) {m = "0" + m}
    if (s<10) {s = "0" + s}
    return h+":"+m+":"+s;
  },
  support_localstorage: function(){
    if (localStorage){
      return true;  
    }else{  
      return false;  
    }
  },
  store_paste: function(url){
    if (zerobin.support_localstorage){
      var date = new Date();
      var paste = zerobin.get_date()+" "+zerobin.get_time()+";"+url;
      if (localStorage.length > 19)
        void removeItem(0);
      localStorage.setItem(localStorage.length, paste);
    }
  },
  get_pastes: function(){
    if (zerobin.support_localstorage){ 
      var pastes = ''; 

      for (i=localStorage.length-1; i>=0; i--)  
      { 
        if (localStorage.getItem(i).split(';')[0].split(' ')[0] == zerobin.get_date()){
          var display_date = localStorage.getItem(i).split(';')[0].split(' ')[1];
        }else{
          var display_date = zerobin.get_date();
        }
        pastes = pastes + '<li><a class="items" href="' + localStorage.getItem(i).split(';')[1] + '">' + display_date + '</a></li>';
      }
      if (!pastes){
        return '<i class="grey">Your previous pastes will be saved in your browser <a href="http://www.w3.org/TR/webstorage/">localStorage</a>.</i>';
      }
      return pastes;
    }else{
      return 'Sorry your browser does not support LocalStorage, We cannot display your previous pastes.';
    }
  }
};


$(function(){

/**
  On the create paste page:
  On click on the send button, compress and encrypt data before
   posting it using ajax. Then redirect to the address of the
   newly created paste, adding the key in the hash.
*/
$('button[type=submit]').live("click", function(e){

  e.preventDefault();
  var paste = $('textarea').val();

  if (paste.trim()) {
    var expiration = $('#expiration').val();
    var key = zerobin.make_key();
    var data = {content: zerobin.encrypt(key, paste), expiration: expiration}

    $.post('/paste/create', data)
     .error(function(error) {
        alert('Paste could not be saved. Please try again later.');
     })
     .success(function(data) {
        var paste_url = '/paste/' + data['paste'] + '#' + key;
        window.location = (paste_url);
        zerobin.store_paste(paste_url);
     });
  }

});

/** On the display paste page.
    Decrypt and decompress the paste content, add syntax coloration
    then insert the flash code to download the paste.
*/
var content = $('#paste-content').text().trim();
var key = window.location.hash.substring(1);
if (content && key) {
    try {
        $('#paste-content').text(zerobin.decrypt(key, content));
    } catch(err) {
        alert('Could not decrypt data (Wrong key ?)');
    }
    prettyPrint();

    /** Load dynamically the flash code (it's pretty heavy so doing it
       now will make the page appear to load faster)
       And create the download button.
    */
    $.getScript("/static/js/swfobject.js", function(script, textStatus) {
      $.getScript("/static/js/downloadify.min.js", function(){
        Downloadify.create('downloadify',{
          filename: function(){
            return 'test.txt';
          },
          data: function(){
            return $('#paste-content').text();
          },
          onError: function(){ alert("Sorry, the file couldn't be downloaded. :("); },
          swf: '/static/js/downloadify.swf',
          downloadImage: '/static/img/download.png',
          width: 96,
          height: 28,
          transparent: true,
          append: false
        });
      });
    });
}

/* Synchronize expiration select boxes value */
$('.paste-option select').live('change', function(){
  var value = $(this).val();
  $('.paste-option select').val(value);
});


/* Resize Textarea according to content */
$('#content').elastic();


/* Display bottom paste option buttons when needed */
$('#content').live('keyup change', function(){
   if($('#content').height() < 400 ){
      $('.paste-option.down').remove();
   }
   else {
    if ($('.paste-option').length == 1) {
      $('.paste-option').clone().addClass('down').appendTo('form.well');
    }
   }
});

});