
var BLISS = (function(BLISS, DOM){

    // Initializing the 'config' variable

    BLISS.config = BLISS.config || {};

    // Exported methods

    BLISS.add_blissvg = add_blissvg;
    BLISS.add_blissword = add_blissword;
    BLISS.add_blisstext = add_blisstext;
    BLISS.add_blisswords_to_class = add_blisswords_to_class;

    // Default config values

    var default_margin = 8; // ...to make room for a stroke width of 8
    var default_radius = 4;

    // Private constants

    var BLISSQUARE = 128;
    var BLISSHEIGHT = BLISSQUARE * 5/2;
    var BLISSQSPACE = BLISSQUARE / 4;
    var GRIDSIZE = BLISSQUARE / 2;

    // SVG information

    var SVG_START = ('<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="true" ' + 
                     'class="bliss-svg" viewBox="{x} {y} {w} {h}"><g>');
    var SVG_END = '</g></svg>';

    var SVG_ELEMS = {
        'dot':    '<circle class="bliss-dot" cx="{x}" cy="{y}" r="{r}"/>',
        'disc':   '<circle class="bliss-disc" cx="{x}" cy="{y}" r="{r}"/>',
        'circle': '<circle class="bliss-line" cx="{x}" cy="{y}" r="{r}"/>',
        'text':   '<text class="bliss-text" text-anchor="middle" x="{x}" y="{y}" style="font-size:{fontsize}">{text}</text>',
        'line':   '<line class="bliss-line" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>',
        'arc':    '<path class="bliss-line" d="M {x1},{y1} A {r},{r} 0 0,0 {x2},{y2}"/>',
        'bigarc': '<path class="bliss-line" d="M {x1},{y1} A {r},{r} 0 1,0 {x2},{y2}"/>',
        'grid':   '<line class="bliss-grid-{grid}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>',
    }

    // TODO: These should be added to blissdata.js instead of being hard-coded here:

    var MODIFIERS = {
        'a,an,any': true,
        'ago,then_(past)': true,
        'belongs_to,of_(possessive)': true,
        'bliss-name': true,
        'comparative_more': true,
        'dot': true,
        'generalization': true,
        'group_of,much_of,many_of,quantity_of': true,
        'indicator_(combine)': true,
        'intensity': true,
        'line,stripe': true,
        'metaphor': true,
        'minus,no,without': true,
        'more': true,
        'most,maximum': true,
        'now': true,
        'opposite_meaning,opposite_of,opposite': true,
        'part,bit,piece,portion,part_of': true,
        'superlative_most': true,
        'then,so,later': true,
    };

    var PUNCTUATIONS = {
        'comma': true,
        'period,point,full_stop,decimal_point': true,
        'question_mark': true,
        'exclamation_mark': true,
    };

    // Private predicates

    function is_modifier(mod) {
        return MODIFIERS[mod];
    }

    function is_digit(dig) {
        return dig.slice(-7) == '(digit)';
    }

    function is_letter(letter) {
        var suffix = letter.slice(-11);
        return suffix == '(uppercase)' || suffix == '(lowercase)';
    }

    function is_punctuation(punct) {
        return PUNCTUATIONS[punct];
    }

    function is_indicator(ind) {
        return ind.slice(0, 10) == 'indicator_' && !MODIFIERS[ind];
    }

    // Private methods

    function get_data(id) {
        var data = BLISS.data.SHAPES[id];
        if (data) return data;
        data = BLISS.data.CHARS[id];
        if (data) return data;
        return BLISS.data.WORDS[id];
    }

    function format(str, args) {
        return str.replace(/\{(\w+)\}/g, function(m, p){
            return p in args ? args[p] : m;
        });
    }

    function to_svg_grid(dim, grid) {
        var svg = "";
        var margin = BLISS.config.margin || default_margin;

        var left = dim.left - margin, right = dim.right + margin;
        var top = dim.top - margin, bottom = dim.bottom + margin;
        var istart = Math.floor(grid * left / GRIDSIZE);
        var istop = Math.ceil(grid * Math.max(right, bottom) / GRIDSIZE);
        for (var i = istart; i <= istop; i++) {
            var xy = GRIDSIZE * i / grid;
            var gridtype = (i % grid) ? 'minor' : 'major';
            if (xy <= right) {
                svg += format(SVG_ELEMS['grid'], {grid:gridtype, x1:xy, x2:xy, y1:top, y2:bottom});
            }
            if (xy <= bottom) {
                svg += format(SVG_ELEMS['grid'], {grid:gridtype, x1:left, x2:right, y1:xy, y2:xy});
            }
        }
        return svg;
    }

    function to_svg_obj(x, y, obj) {
        if (typeof obj == "string") {
            return to_svg_obj(x, y, get_data(obj));

        } else if (obj instanceof Array) {
            var svg = "";
            for (var i=0; i<obj.length; i++) {
                svg += to_svg_obj(x, y, obj[i]);
            }
            return svg;

        } else if ('d' in obj) {
            if (obj.x) x += obj.x;
            if (obj.y) y += obj.y;
            return to_svg_obj(x, y, obj.d);

        } else {
            var clone = {};
            for (var k in obj) {
                if (obj.hasOwnProperty(k)) {
                    if (k[0] == 'x') {
                        clone[k] = obj[k] + x;
                    } else if (k[0] == 'y') {
                        clone[k] = obj[k] + y;
                    } else {
                        clone[k] = obj[k];
                    }
                }
            }
            if (clone.form == 'text') {
                clone.x += clone.w / 2; // center align text
                clone.y += clone.h     // SVG text has inverted coordinate system...
            } else if (clone.form == 'dot') {
                clone.r = BLISS.config.radius || default_radius;
            }
            return format(SVG_ELEMS[clone.form], clone);
        }
    }


    function expand_word(word) {
        if (typeof(word) == 'string') {
            word = [word];
        }
        var groups_inds = expand_list(word, []);
        var groups = groups_inds.groups, inds = groups_inds.inds;
        if (inds.length) {
            console.error("Inds left:", word, "-->", groups, "/", inds);
        }
        // console.log(word, JSON.stringify(groups));

        var chars = [];
        var x = 0, left = 0, right = 0, prev = null;
        for (var g=0; g<groups.length; g++) {
            var ch = groups[g].ch;
            var inds = groups[g].inds;
            var w = BLISS.data.CHARS[ch].w;
            x += calculate_spacing(prev, ch);
            chars.push({x:x, y:0, d:ch});
            // console.log(x, ch, JSON.stringify(chars));

            if (inds.length) {
                var iw = (inds.length - 1) * BLISSQSPACE / 2;
                for (var i=0; i<inds.length; i++) {
                    var ind = inds[i];
                    iw += BLISS.data.CHARS[ind].w;
                    if (ind in BLISS.data.CENTER) {
                        iw += 2 * BLISS.data.CENTER[ind];
                    }
                }
                var ix = x + (w - iw) / 2;
                if (ch in BLISS.data.CENTER) {
                    ix += BLISS.data.CENTER[ch];
                }
                left = Math.min(left, ix);
                var iy = Math.min(0, -32 * (BLISS.data.CHARS[ch].h - 3));
                for (var i=0; i<inds.length; i++) {
                    var ind = inds[i];
                    if (i > 0) ix += BLISSQSPACE / 2;
                    chars.push({x:ix, y:iy, d:ind});
                    ix += BLISS.data.CHARS[ind].w;
                }
                right = Math.max(right, ix);
            }
            x += w;
            prev = ch;
        }
        right = Math.max(right, x);
        return {top:0, bottom:BLISSHEIGHT, left:left, right:right, chars:chars};
    }

    function expand_list(words, inds) {
        var chars = [];
        for (var n=0; n<words.length; n++) {
            var w = words[n];
            if (is_indicator(w) && chars.length) {
                var prev_inds = chars[chars.length-1].inds;
                prev_inds.push.apply(prev_inds, inds);
                prev_inds.push(w);
                inds = [];
            } else if (is_modifier(w) || is_punctuation(w) || (n == 0 && is_digit(w))) {
                chars.push({ch:w, inds:[]});
            } else {
                chars.push({ch:w, inds:inds});
                inds = [];
            }
        }
        var groups = [];
        var new_inds = [];
        for (var n=0; n<chars.length; n++) {
            var ch = chars[n].ch, cinds = chars[n].inds;
            if (ch in BLISS.data.WORDS) {
                var new_groups_inds = expand_list(BLISS.data.WORDS[ch], new_inds.concat(cinds));
                groups.push.apply(groups, new_groups_inds.groups);
                new_inds = new_groups_inds.inds;
            } else {
                if (! (ch in BLISS.data.CHARS)) {
                    console.error("Unknown character:", ch);
                    ch = 'question_mark';
                }
                groups.push({ch:ch, inds:new_inds.concat(cinds)});
                new_inds = [];
            }
        }
        return {groups:groups, inds:new_inds.concat(inds)};
    }

    function calculate_spacing(prev, current) {
        if (!prev) {
            return 0;
        } else if (kerning_possible(prev, current)) {
            return 0;
        } else if (is_digit(prev) && is_digit(current)) {
            return BLISSQSPACE / 2;
        } else if (is_letter(prev) && is_letter(current)) {
            return BLISSQSPACE / 2;
        } else if (current == 'comma') {
            return BLISSQSPACE * 3/4;
        } else {
            return BLISSQSPACE;
        }
    }

    var DEFAULT_KERNING = {1:2, 2:6, 3:14, 4:14, 5:14, 6:12};
    // ... == 1 << Math.min(4, 1 + height) - 2;
    // ... == sum(2**h for h in range(1, min(4, 1 + height)))
    // ... == {1: 2**1 == 2**2-2 == 2, 2: 2**1+2**2 == 2**3-2 == 6, 3..5: 2**1+2**2+2**3 == 2**4-2 == 14}
    // exception: 6 == indicator == 1100

    function kerning_possible(prev, current) {
        if (BLISS.data.CHARS[prev].w <= 24 || BLISS.data.CHARS[current].w <= 24) {
            return false;
        }
        var right = BLISS.data['KERNING-RIGHT'][prev];
        if (!right) {
            right = DEFAULT_KERNING[BLISS.data.CHARS[prev].h];
        }
        var left = BLISS.data['KERNING-LEFT'][current];
        if (!left) {
            left = DEFAULT_KERNING[BLISS.data.CHARS[current].h];
        }
        // console.log(prev, current, right, left, right & left, (right & left) == 0);
        return (right & left) == 0;
    }


    function add_blissvg(parent, blissword, grid) {
        var exp = expand_word(blissword);
        // console.log(blissword, JSON.stringify(exp));
        var margin = BLISS.config.margin || default_margin;

        var svg = format(SVG_START, {x: exp.left - margin, 
                                     y: exp.top - margin, 
                                     w: exp.right - exp.left + 2*margin, 
                                     h: exp.bottom - exp.top + 2*margin});
        if (grid) {
            svg += to_svg_grid(exp, grid);
        }
        svg += to_svg_obj(0, 0, exp.chars);
        svg += SVG_END;
        parent.innerHTML += svg;
    }

    function add_blissword(parent, blissword, textword, grid) {
        var bliss_elem = DOM.createElement('span');
        bliss_elem.className = 'bliss-symbol';
        parent.appendChild(bliss_elem);

        if (textword !== undefined) {
            var text_elem = DOM.createElement('span');
            text_elem.className = 'bliss-caption';
            if (textword && /\S/.test(textword)) {
                text_elem.textContent = textword;
            } else {
                text_elem.innerHTML = '&nbsp;';
            }
            parent.appendChild(text_elem);
        }

        if (blissword && blissword.length) {
            var first = first instanceof Array ? blissword[0] : blissword;
            if (is_punctuation(first)) {
                parent.className += ' bliss-punctuation';
            }
            add_blissvg(bliss_elem, blissword, grid);
        }
    }

    function add_blisstext(parent, blisswords, textwords, grid) {
        for (var i = 0; i < blisswords.length; i++) {
            var textwd = textwords && (textwords[i] || '');
            add_blissword(parent, blisswords[i], textwd, grid);
        }
    }

    var BLISSWORD_IS_ADDED = " ___BLISSWORD_IS_ALREADY_ADDED___";
    function add_blisswords_to_class(cls, grid) {
        var elements = DOM.getElementsByClassName(cls);
        for (var i=0; i<elements.length; i++) {
            var elem = elements[i];
            if (elem.className.indexOf(BLISSWORD_IS_ADDED) < 0) {
                var title = elem.title.trim().split(/\s+/);
                var text = elem.textContent;
                elem.textContent = "";
                add_blissword(elem, title, text, grid);
                elem.className += BLISSWORD_IS_ADDED;
            }
        }
    }

    return BLISS;
}(BLISS || {}, document));
