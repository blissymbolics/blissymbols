
var BLISS;

$(function(){
    BLISS = new BlissViewer(BLISS_CHAR_DATA, BLISS_WORD_DATA, {
        margin : 16,
        radius : 4,
    });
    BLISS.add_blisswords_to_class('bliss');
    redraw();
});


function redraw() {
    var output = $('#textoutput').empty();
    var paras = $('#textinput').val().split(/\s*\n\s*\n\s*/);
    paras.forEach(function(parastr){
        var para = $('<p>').appendTo(output);;
        var words = parastr.trim().split(/\n/);
        words.forEach(function(wordstr){
            var blissword = wordstr.split('::')[1].trim().split(/\s+/);
            var textword = wordstr.split('::')[0].trim();
            var bliss_elem = $('<span class="bliss">').appendTo(para);
            BLISS.add_blissword(bliss_elem[0], blissword, textword, 4);
        });
    });
    change_appearance();
}


function change_appearance() {

    var radius = $('#radius').val();

    $('#textoutput .bliss-dot').attr('r', radius);

    var thickness = $('#thickness').val();

    $('#textoutput .bliss-line').css('stroke-width', thickness);
    $('#textoutput .bliss-disc').css('stroke-width', thickness);
    $('#textoutput .bliss-dot').css('stroke-width', thickness);

    var symsize = $('#symbolsize').val();
    var margin = symsize / 5;
    var punctmargin = -symsize / 10;

    $('#textoutput .bliss').css('margin-left', margin+'ex').css('margin-right', margin+'ex');
    $('#textoutput .bliss-punctuation').css('margin-left', punctmargin+'ex');
    $('#textoutput .bliss-svg').height(symsize+'ex');

    var fontsize = $('#fontsize').val();

    $('#textoutput .bliss-caption').css('font-size', fontsize+'px');

    var nogrid = $('#no-grid').prop('checked');
    var dense = $('#dense-grid').prop('checked');

    $('#textoutput .bliss-grid-major').toggle(!nogrid);
    $('#textoutput .bliss-grid-minor').toggle(dense);
}
