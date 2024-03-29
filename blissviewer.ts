///<reference path="blissdata.d.ts"/>

class BlissViewer {

    constructor(
        public chardata : BlissCharData,
        public worddata : BlissWordData,
        public config : {
            margin : number;
            radius : number;
        } = {
            // Default config values
            margin : 8, // ...to make room for a stroke width of 8
            radius : 4,
        }
    ) {}

    // Private constants

    private BLISSQUARE = 128;
    private BLISSHEIGHT = this.BLISSQUARE * 5/2;
    private BLISSQSPACE = this.BLISSQUARE / 4;
    private GRIDSIZE = this.BLISSQUARE / 2;

    // SVG information

    private SVG_START = ('<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMid" ' + 
                         'class="bliss-svg" viewBox="{x} {y} {w} {h}"><g>');
    private SVG_END = '</g></svg>';

    private SVG_ELEMS = {
        dot:    '<circle class="bliss-dot" cx="{x}" cy="{y}" r="{r}"/>',
        disc:   '<circle class="bliss-disc" cx="{x}" cy="{y}" r="{r}"/>',
        circle: '<circle class="bliss-line" cx="{x}" cy="{y}" r="{r}"/>',
        text:   '<text class="bliss-text" text-anchor="middle" '
            + 'x="{x}" y="{y}" style="font-size:{fontsize}">{text}</text>',
        line:   '<line class="bliss-line" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>',
        arc:    '<path class="bliss-line" d="M {x1},{y1} A {rx},{ry} 0 0,0 {x2},{y2}"/>',
        bigarc: '<path class="bliss-line" d="M {x1},{y1} A {rx},{ry} 0 1,0 {x2},{y2}"/>',
        quadratic: '<path class="bliss-line" d="M {x1},{y1} Q {qx},{qy} {x2},{y2}"/>',
        grid:   '<line class="bliss-grid-{grid}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>',
    }

    // TODO: These should be added to blissdata.js instead of being hard-coded here:

    private MODIFIERS = {
        'a,an,any': true,
        'ago,then_(past)': true,
        'belongs_to,of_(possessive)': true,
        'bliss-name': true,
        'comparative_more': true,
        'dot': true,
        'generalization': true,
        'group_of,much_of,many_of,quantity_of': true,
        'combine_marker': true,
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

    private PUNCTUATIONS = {
        'comma': true,
        'period,point,full_stop,decimal_point': true,
        'question_mark': true,
        'exclamation_mark': true,
    };

    // Private predicates

    private is_modifier(mod) {
        return this.MODIFIERS[mod];
    }

    private is_digit(dig) {
        return dig.includes('(digit)');
    }

    private is_letter(letter) {
        return letter.includes('(uppercase)') || letter.includes('(lowercase)');
    }

    private is_punctuation(punct) {
        return this.PUNCTUATIONS[punct];
    }

    private is_indicator(ind) {
        return ind.slice(0, 10) == 'indicator_' && !this.MODIFIERS[ind];
    }

    // Private methods

    private get_data(id) : any {
        var data : any = this.chardata.paths[id];
        if (data) return data;
        data = this.chardata.shapes[id];
        if (data) return data;
        data = this.chardata.chars[id];
        if (data) return data;
        return this.worddata.words[id];
    }

    private format(str, args) {
        return str.replace(/\{(\w+)\}/g, (m, p) => {
            return p in args ? args[p] : m;
        });
    }

    private to_svg_grid(dim, grid) {
        var svg = "";
        var margin = this.config.margin;

        var left = dim.left - margin, right = dim.right + margin;
        var top = dim.top - margin, bottom = dim.bottom + margin;
        var istart = Math.floor(grid * left / this.GRIDSIZE);
        var istop = Math.ceil(grid * Math.max(right, bottom) / this.GRIDSIZE);
        for (var i = istart; i <= istop; i++) {
            var xy = this.GRIDSIZE * i / grid;
            var gridtype = (i % grid) ? 'minor' : 'major';
            if (xy <= right) {
                svg += this.format(this.SVG_ELEMS['grid'], {grid:gridtype, x1:xy, x2:xy, y1:top, y2:bottom});
            }
            if (xy <= bottom) {
                svg += this.format(this.SVG_ELEMS['grid'], {grid:gridtype, x1:left, x2:right, y1:xy, y2:xy});
            }
        }
        return svg;
    }

    private to_svg_obj(x, y, obj) {
        if (typeof obj == "string") {
            return this.to_svg_obj(x, y, this.get_data(obj));

        } else if (obj instanceof Array) {
            var svg = "";
            for (var i=0; i<obj.length; i++) {
                svg += this.to_svg_obj(x, y, obj[i]);
            }
            return svg;

        } else if ('d' in obj) {
            if (obj.x) x += obj.x;
            if (obj.y) y += obj.y;
            return this.to_svg_obj(x, y, obj.d);

        } else {
            var clone : any = {};
            for (var k in obj) {
                if (obj.hasOwnProperty(k)) {
                    if (k[0] == 'x') {
                        clone[k] = obj[k] + x;
                    } else if (k[0] == 'y') {
                        clone[k] = this.BLISSHEIGHT - obj[k] - y;
                    } else if (k == 'qx') {
                        clone[k] = obj[k] + x;
                    } else if (k == 'qy') {
                        clone[k] = this.BLISSHEIGHT - obj[k] - y;
                    } else {
                        clone[k] = obj[k];
                    }
                }
            }
            if (clone.form == 'text') {
                clone.x += clone.w / 2; // center align text
                clone.y += clone.h     // SVG text has inverted coordinate system...
            } else if (clone.form == 'dot') {
                clone.r = this.config.radius;
            }
            return this.format(this.SVG_ELEMS[clone.form], clone);
        }
    }


    private expand_word(word) {
        if (typeof(word) == 'string') {
            word = [word];
        }
        var groups_inds = this.expand_list(word, []);
        var groups = groups_inds.groups, grinds = groups_inds.inds;
        if (grinds.length) {
            console.error("Inds left:", word, "-->", groups, "/", grinds);
        }

        var chars = [];
        var x = 0, left = 0, right = 0, prev = null;
        for (var g=0; g<groups.length; g++) {
            var ch = groups[g].ch;
            var inds = groups[g].inds;
            var w = this.chardata.chars[ch].w;
            x += this.calculate_spacing(prev, ch);
            chars.push({x:x, y:0, d:ch});

            if (inds.length) {
                var iw = (inds.length - 1) * this.BLISSQSPACE / 2;
                for (var i=0; i<inds.length; i++) {
                    var ind = inds[i];
                    iw += this.chardata.chars[ind].w;
                    if (ind in this.chardata.center) {
                        iw += 2 * this.chardata.center[ind];
                    }
                }
                var ix = x + (w - iw) / 2;
                if (ch in this.chardata.center) {
                    ix += this.chardata.center[ch];
                }
                left = Math.min(left, ix);
                var iy = Math.max(0, this.chardata.chars[ch].h - 192);
                for (var i=0; i<inds.length; i++) {
                    var ind = inds[i];
                    if (i > 0) ix += this.BLISSQSPACE / 2;
                    chars.push({x:ix, y:iy, d:ind});
                    ix += this.chardata.chars[ind].w;
                }
                right = Math.max(right, ix);
            }
            x += w;
            prev = ch;
        }
        right = Math.max(right, x);
        return {top:0, bottom:this.BLISSHEIGHT, left:left, right:right, chars:chars};
    }

    private expand_list(words, inds) {
        var chars = [];
        for (var n=0; n<words.length; n++) {
            var w = words[n];
            if (this.is_indicator(w) && chars.length) {
                var prev_inds = chars[chars.length-1].inds;
                prev_inds.push.apply(prev_inds, inds);
                prev_inds.push(w);
                inds = [];
            } else if (this.is_modifier(w) || this.is_punctuation(w) || (n == 0 && this.is_digit(w))) {
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
            if (ch in this.worddata.words) {
                var new_groups_inds = this.expand_list(this.worddata.words[ch], new_inds.concat(cinds));
                groups.push.apply(groups, new_groups_inds.groups);
                new_inds = new_groups_inds.inds;
            } else {
                if (! (ch in this.chardata.chars)) {
                    console.error("Unknown character:", ch);
                    ch = 'question_mark';
                }
                groups.push({ch:ch, inds:new_inds.concat(cinds)});
                new_inds = [];
            }
        }
        return {groups:groups, inds:new_inds.concat(inds)};
    }

    private calculate_spacing(prev, current) {
        if (!prev) {
            return 0;
        } else if (this.kerning_possible(prev, current)) {
            return 0;
        } else if (this.is_digit(prev) && this.is_digit(current)) {
            return this.BLISSQSPACE / 2;
        } else if (this.is_letter(prev) && this.is_letter(current)) {
            return this.BLISSQSPACE / 2;
        } else if (current == 'comma') {
            return this.BLISSQSPACE * 3/4;
        } else {
            return this.BLISSQSPACE;
        }
    }


    private default_kerning(h) {
        if (!h) return 12; // indicator = 0b1100
        if (h <= 80) return 2; // lowest = 0b0010
        if (h <= 144) return 6; // low = 0b0110
        return 14; // normal, high, highest = 0b1110
    }


    private kerning_possible(prev, current) {
        if (this.chardata.chars[prev].w <= 24 || this.chardata.chars[current].w <= 24) {
            return false;
        }
        var right = this.chardata.kerning_right[prev];
        if (!right) {
            right = this.default_kerning(this.chardata.chars[prev].h);
        }
        var left = this.chardata.kerning_left[current];
        if (!left) {
            left = this.default_kerning(this.chardata.chars[current].h);
        }
        return (right & left) == 0;
    }


    public add_blissvg(parent, blissword, grid?) {
        var exp = this.expand_word(blissword);
        var margin = this.config.margin;

        var svg = this.format(this.SVG_START, {
            x: exp.left - margin, 
            y: exp.top - margin, 
            w: exp.right - exp.left + 2*margin, 
            h: exp.bottom - exp.top + 2*margin
        });
        if (grid) {
            svg += this.to_svg_grid(exp, grid);
        }
        svg += this.to_svg_obj(0, 0, exp.chars);
        svg += this.SVG_END;
        parent.innerHTML += svg;
    }

    public add_blissword(parent, blissword?, textword?, grid?) {
        var bliss_elem = document.createElement('span');
        bliss_elem.className = 'bliss-symbol';
        parent.appendChild(bliss_elem);

        if (textword !== undefined) {
            var text_elem = document.createElement('span');
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
            if (this.is_punctuation(first)) {
                parent.className += ' bliss-punctuation';
            }
            this.add_blissvg(bliss_elem, blissword, grid);
        }
    }

    public add_blisstext(parent, blisswords, textwords?, grid?) {
        for (var i = 0; i < blisswords.length; i++) {
            var textwd = textwords && (textwords[i] || '');
            this.add_blissword(parent, blisswords[i], textwd, grid);
        }
    }

    private BLISSWORD_IS_ADDED = " ___BLISSWORD_IS_ALREADY_ADDED___";
    public add_blisswords_to_class(cls, grid?) {
        var elements = document.getElementsByClassName(cls);
        for (var i=0; i<elements.length; i++) {
            var elem : HTMLElement = <HTMLElement>elements[i];
            if (elem.className.indexOf(this.BLISSWORD_IS_ADDED) < 0) {
                var title = elem.title.trim().split(/\s+/);
                var text = elem.textContent;
                elem.textContent = "";
                this.add_blissword(elem, title, text, grid);
                elem.className += this.BLISSWORD_IS_ADDED;
            }
        }
    }

}
