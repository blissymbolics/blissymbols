
$(function(){
    var blisstypes = {word: 'Word', char: 'Character', ind: 'Indicator', mod: 'Modifier', punct: 'Punctuation'};

    $('#symboltypes').empty();
    $('#radiotypes').empty();
    for (var typ in blisstypes) {
        $('<option>').val(typ).appendTo($('#symboltypes'));
        $('<input class="type" name="type" type="radio">').val(typ).appendTo($('#radiotypes'))
        $('<span>').text(blisstypes[typ] + ' ').appendTo($('#radiotypes'));
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

    function populate_blissdata() {
        var keys = sorted_symbols();
        console.log("Populating " + keys.length + " symbols");
        $('#symbolnames').empty();
        $('.select-symbol').empty().append($('<option>'));
        for (var i=0; i < keys.length; i++) {
            var id = keys[i];
            $('<option>').val(id).appendTo($('#symbolnames'));
            var select = (!BLISS.data[id].modified ? '#unmodified-symbols' :
                          !BLISS.data[id].verified ? '#unverified-symbols' :
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
        $('#edit-symbol').prop('disabled', enabled || !BLISS.data[id]);
    }

    function select_symbol() {
        load_symbol($(this).val());
    }

    function imgpath(id) {
        return id ? 'svg/' + id + '.svg' : '';
    }

    function show_images(id) {
        $('#images').empty();
        var data = BLISS.data[id];
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
        var data = BLISS.data[id] || {};
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
        if ($('#id').text() in BLISS.data) {
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
                if (val && !BLISS.data[val]) {
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
            for (var other in BLISS.data) {
                if (other == newid) {
                    alert('There is already a symbol with the name "' + newid + '"');
                    return;
                }
            }
            var ok = confirm('Do you want to rename "' + id + '" to "' + newid + '"?');
            if (!ok) return;
            repopulate = true;
            for (var other in BLISS.data) {
                var def = BLISS.data[other].definition;
                if (def) {
                    for (var i in def) {
                        if (def[i] == id) {
                            def[i] = newid;
                        }
                    }
                }
                var kern = BLISS.data[other].kern;
                if (kern) {
                    for (var i in kern) {
                        if (kern[i] == id) {
                            kern[i] = newid;
                        }
                    }
                }
            }
            BLISS.data[newid] = BLISS.data[id];
            delete BLISS.data[id];
            $('#id').text(newid);
            console.log("RENAME " + id + " -> " + newid, BLISS.data[newid]);
            id = newid;
        }

        BLISS.data[id].center = $('#center').val();
        BLISS.data[id].width = $('#width').val();
        BLISS.data[id].height = $('#high').prop('checked') ? 'high' : null;

        if (Boolean(BLISS.data[id].modified) != Boolean($('#modified').val())) {
            BLISS.data[id].modified = $('#modified').val();
            repopulate = true;
        }
        if (Boolean(BLISS.data[id].verified) != Boolean($('#verified').val())) {
            BLISS.data[id].verified = $('#verified').val();
            repopulate = true;
        }

        if (typ == 'word') {
            BLISS.data[id].definition = [];
            var defs = $('.definition');
            for (var i = 0; i < defs.length; i++) {
                var val = defs[i].value;
                if (val) {
                    BLISS.data[id].definition.push(val);
                }
            }
        } else {
            delete BLISS.data[id].definition;
        }

        BLISS.data[id].kern = [];
        var kern = $('.kern');
        for (var i = 0; i < kern.length; i++) {
            var val = kern[i].value;
            if (val) {
                BLISS.data[id].kern.push(val);
            }
        }

        console.log(id + " := " + JSON.stringify(BLISS.data[id]));

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
            var str = '\t\t\t' + JSON.stringify(key) + ': ' + JSON.stringify(value, null, '\t\t\t\t') + ',';
            return str.replace('\n]', '\n\t\t\t]');
        }

        var lines = ['// Auto-generated by blisseditor.js',
                     'var BLISS = (function(BLISS){',
                     '\tBLISS.data = {',
                     ''];
        var keys = sorted_symbols();
        for (var i=0; i < keys.length; i++) {
            var id = keys[i];
            var data = BLISS.data[id];
            lines.push('\t\t' + JSON.stringify(id) + ': {',
                       stringify_row('type', data.type),
                       stringify_row('definition', data.definition),
                       stringify_row('height', data.height),
                       stringify_row('width', data.width),
                       stringify_row('center', data.center),
                       stringify_row('kern', data.kern),
                       stringify_row('modified', data.modified),
                       stringify_row('verified', data.verified),
                       '\t\t},',
                       '');
        }
        lines.push('\t};',
                   '\treturn BLISS;',
                   '}(BLISS || {}));');

        var str = lines.join('\n') + '\n';
        // remove "," before "]" or "}":
        str = str.replace(/,(\s*[\]\}])/g, '$1');
        return str;
    }

    function sorted_symbols() {
        return Object.keys(BLISS.data)
            .sort(function(a,b){return a.localeCompare(b)});
    }

});
