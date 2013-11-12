
TYPES = {word: 'Word', char: 'Character', ind: 'Indicator', mod: 'Modifier', punct: 'Punctuation'};

$(function(){
    $('#symboltypes').empty();
    $('#radiotypes').empty();
    for (var typ in TYPES) {
        $('<option>').val(typ).appendTo($('#symboltypes'));
        $('<input class="type" name="type" type="radio">').val(typ).appendTo($('#radiotypes'))
        $('<span>').text(TYPES[typ] + ' ').appendTo($('#radiotypes'));
    }

    $('.select-symbol').change(select_symbol);
    $('.type').click(update_info);
    $('#edit-symbol').click(edit_symbol);
    $('#cancel-symbol').click(cancel_symbol);
    $('#save-symbol').click(save_symbol);
    $('#add-char').click(add_character);
    $('#add-kern').click(add_kern);
    $('#export').click(export_blissdata);

    $('#edit-table select').prop('disabled', true);
    $('#load-table input').prop('disabled', true);
    setTimeout(populate_blissdata, 100);
    load_symbol();
});

function populate_blissdata() {
    var keys = sorted_symbols();
    console.log("Populating " + keys.length + " symbols");
    $('#symbolnames').empty();
    $('.select-symbol').empty().append($('<option>'));
    for (var i=0; i < keys.length; i++) {
        var id = keys[i];
        $('<option>').val(id).appendTo($('#symbolnames'));
        var select = (!BLISSDATA[id].modified ? '#unmodified-symbols' :
                      !BLISSDATA[id].verified ? '#unverified-symbols' :
                      '#verified-symbols');
        $('<option>').val(id).text(id).appendTo($(select));
    }
    toggle_editor(false);
}

function add_character() {
    $('<input class="definition" type="text" list="symbolnames" size="30">')
        .change(update_info)
        .appendTo('#definition-container');
}

function add_kern() {
    $('<input class="kern" type="text" list="symbolnames" size="30">')
        .change(update_info)
        .appendTo('#kern-container');
    $('<br>').appendTo('#kern-container');
}

function update_info() {
    var typ = $('input[name=type]:checked').val();
    $('#definition-row').toggle(typ == 'word');
    $('#kern-row').toggle(typ == 'char' || typ == 'mod');
    var id = $('#id').text();
    show_images(id);
}

function toggle_editor(enabled) {
    $('#edit-table input').prop('disabled', !enabled);
    $('#load-table select').prop('disabled', enabled);
    var id = $('#id').text();
    $('#edit-symbol').prop('disabled', enabled || !BLISSDATA[id]);
}

function select_symbol() {
    load_symbol($(this).val());
}

function imgpath(id) {
    return id ? 'svg/' + id + '.svg' : '';
}

function show_images(id) {
    $('#images').empty();
    var data = BLISSDATA[id];
    if (!data) return;
    $('<object type="image/svg+xml" height="100">')
        .attr('data', imgpath(id))
        .appendTo($('#images'));
    if ($('#definition-row').is(':visible')) {
        var defs = $('.definition');
        for (var i = 0; i < defs.length; i++) {
            var val = defs[i].value;
            if (val) {
                $('<span>')
                    .html(i==0 ? " &nbsp; = &nbsp; " : " &nbsp; + &nbsp; ")
                    .appendTo($('#images'));
                $('<object type="image/svg+xml" height="100">')
                    .attr('data', imgpath(val))
                    .appendTo($('#images'));
            }
        }
    }
}

function load_symbol(id) {
    var data = BLISSDATA[id] || {};
    $('#id').text(id);
    $('.select-symbol').val(id);

    $('#name').val(id);
    $('#high').val(data.height == 'high');
    $('#width').val(data.width);
    $('#center').val(data.center);
    $('#modified').val(data.modified);
    $('#verified').val(data.verified);

    $('#kern-container').empty();
    var kern = data.kern;
    if (kern) {
        for (var i=0; i < kern.length; i++) {
            $('<input class="kern" type="text" list="symbolnames" size="30">')
                .val(kern[i])
                .change(update_info)
                .appendTo('#kern-container');
            $('<br>').appendTo('#kern-container');
        }
    }

    $('#definition-container').empty();
    var def = data.definition;
    if (def) {
        for (var i=0; i < def.length; i++) {
            $('<input class="definition" type="text" list="symbolnames" size="30">')
                .val(def[i])
                .change(update_info)
                .appendTo('#definition-container');
        }
    }

    var typ = data.type;
    $('.type').each(function(){
        $(this).prop('checked', $(this).val() == typ);
    });
    $('#definition-row').toggle(typ == 'word');
    $('#kern-row').toggle(typ == 'char' || typ == 'mod');

    update_info();
    toggle_editor(false);
}

function edit_symbol() {
    if ($('#id').text() in BLISSDATA) {
        toggle_editor(true);
    }
}

function cancel_symbol() {
    var ok = confirm("Are you sure you want to discard all changes?");
    if (!ok) return;
    load_symbol($('#id').text());
}

function save_symbol() {
    var id = $('#id').text();
    var newid = $('#name').val();
    var typ = $('input[name=type]:checked').val();
    if (typ == 'word') {
        var defs = $('.definition');
        for (var i = 0; i < defs.length; i++) {
            var val = defs[i].value;
            if (val && !BLISSDATA[val]) {
                alert('"' + val + '" does not exist!');
                return;
            }
            // TODO: check for recursion
        }
    }

    if (!$('#modified').val()) {
        alert('You need to write you signature at "Modified"');
        return;
    }

    var ok = confirm("Are you sure about these changes?");
    if (!ok) return;
    var repopulate = false;

    if (newid != id) {
        for (var other in BLISSDATA) {
            if (other == newid) {
                alert('There is already a symbol with the name "' + newid + '"');
                return;
            }
        }
        var ok = confirm('Do you want to rename "' + id + '" to "' + newid + '"?');
        if (!ok) return;
        repopulate = true;
        for (var other in BLISSDATA) {
            var def = BLISSDATA[other].definition;
            if (def) {
                for (var i in def) {
                    if (def[i] == id) {
                        def[i] = newid;
                    }
                }
            }
            var kern = BLISSDATA[other].kern;
            if (kern) {
                for (var i in kern) {
                    if (kern[i] == id) {
                        kern[i] = newid;
                    }
                }
            }
        }
        BLISSDATA[newid] = BLISSDATA[id];
        delete BLISSDATA[id];
        $('#id').text(newid);
        console.log("RENAME " + id + " -> " + newid, BLISSDATA[newid]);
        id = newid;
    }

    BLISSDATA[id].center = $('#center').val();
    BLISSDATA[id].width = $('#width').val();
    BLISSDATA[id].height = $('#high').prop('checked') ? 'high' : null;

    if (Boolean(BLISSDATA[id].modified) != Boolean($('#modified').val())) {
        BLISSDATA[id].modified = $('#modified').val();
        repopulate = true;
    }
    if (Boolean(BLISSDATA[id].verified) != Boolean($('#verified').val())) {
        BLISSDATA[id].verified = $('#verified').val();
        repopulate = true;
    }

    if (typ == 'word') {
        BLISSDATA[id].definition = [];
        var defs = $('.definition');
        for (var i = 0; i < defs.length; i++) {
            var val = defs[i].value;
            if (val) {
                BLISSDATA[id].definition.push(val);
            }
        }
    } else {
        delete BLISSDATA[id].definition;
    }

    BLISSDATA[id].kern = [];
    var kern = $('.kern');
    for (var i = 0; i < kern.length; i++) {
        var val = kern[i].value;
        if (val) {
            BLISSDATA[id].kern.push(val);
        }
    }

    console.log(id + " := " + JSON.stringify(BLISSDATA[id]));

    show_images(id);
    toggle_editor(false);
    if (repopulate) {
        $('#load-table select').prop('disabled', true);
        setTimeout(populate_blissdata, 100);
    }
}


function export_blissdata() {
    var out = stringify_blissdata();
    var blob = new Blob([out], {type: "text/javascript;charset=utf-8"});
    saveAs(blob, "blissdata.js");
}


// we print the database in sorted order, so that changes are easier to follow
function stringify_blissdata() {

    function stringify_row(key, value) { 
        if (value === undefined) value = null;
        var str = '\t' + JSON.stringify(key) + ': ' + JSON.stringify(value, null, '\t\t') + ',';
        return str.replace(']', '\t]');
    }

    var lines = ['BLISSDATA = {', ''];
    var keys = sorted_symbols();
    for (var i=0; i < keys.length; i++) {
        var id = keys[i];
        var data = BLISSDATA[id];
        lines.push(JSON.stringify(id) + ': {');
        lines.push(stringify_row('type', data.type));
        lines.push(stringify_row('definition', data.definition));
        lines.push(stringify_row('height', data.height));
        lines.push(stringify_row('width', data.width));
        lines.push(stringify_row('center', data.center));
        lines.push(stringify_row('kern', data.kern));
        lines.push(stringify_row('modified', data.modified));
        lines.push(stringify_row('verified', data.verified));
        lines.push(i < keys.length-1 ? '},' : '}')
        lines.push('');
    }
    lines.push('};');
    var str = lines.join('\n');
    str = str.replace(/,(\s*[\[\}])/g, '$1');
    return str;
}

function sorted_symbols() {
    return Object.keys(BLISSDATA)
        .sort(function(a,b){return a.localeCompare(b)});
}
