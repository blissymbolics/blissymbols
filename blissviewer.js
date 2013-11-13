
var BLISS = (function(BLISS, DOM){
    BLISS.config = BLISS.config || {};
    BLISS.show_text = show_text;

    function get_height(percent) {
        if (percent === undefined) percent = 100;
        var imgheight = BLISS.config.imgheight || 100;
        return Math.round(percent * imgheight / 100);
    }

    function show_image(parent, blisschar) {
        var path = BLISS.config.imgpath + '/' + blisschar;
        if (BLISS.config.imgtype == 'svg') {
            var img = DOM.createElement('object');
            img.type = 'image/svg+xml';
            img.data = path + '.svg';
        } else {
            var img = DOM.createElement('img');
            img.src = path + '.png';
        }
        img.height = get_height();
        img.title = blisschar;
        parent.appendChild(img);
    }

    function show_chars(parent, blisschars) {
        var main_chr_ind, prev, chr;
        var agenda = blisschars.slice();
        while (chr = agenda.shift()) {
            var data = BLISS.data[chr];
            if (!data) {
                continue;
            }
            if (data.type == 'word') {
                Array.prototype.unshift.apply(agenda, data.definition);
            } else if (data.type == 'ind' && main_chr_ind) {
                show_image(main_chr_ind, chr);
            } else {
                var cg = DOM.createElement('span');
                cg.style.display = 'inline-block';
                cg.style.margin = '0 ' + get_height(5) + 'px';
                cg.style.verticalAlign = 'bottom';
                parent.appendChild(cg);

                if (!main_chr_ind && data.type == 'char') {
                    main_chr_ind = DOM.createElement('span');
                    main_chr_ind.style.position = 'relative';
                    main_chr_ind.style.height = 0;
                    main_chr_ind.style.left = 0;
                    main_chr_ind.style.top = 0;
                    main_chr_ind.style.display = 'block'
                    main_chr_ind.style.textAlign = 'center';
                    cg.appendChild(main_chr_ind);

                    if (data.height == 'high') {
                        main_chr_ind.style.top = get_height(-20);
                    }
                    if (data.center) {
                        main_chr_ind.style.left = get_height(data.center) + 'px';
                    }
                }

                var bc = DOM.createElement('span');
                bc.style.display = 'block';
                bc.style.textAlign = 'center';
                cg.appendChild(bc);

                show_image(bc, chr);
                var kern = BLISS.data[prev] && BLISS.data[prev].kern;
                if (kern && kern[chr] || kern && kern.indexOf && kern.indexOf(chr) >= 0) {
                    cg.style.marginLeft = get_height(-10) + 'px';
                    // kerning for digits: -5px
                }
                prev = chr;
            }
        }
    }

    function show_word(parent, blissword, textword) {
        var wg = DOM.createElement('span');
        wg.style.display = 'inline-block';
        parent.appendChild(wg);

        var bw = DOM.createElement('span');
        bw.className = 'blissword';
        bw.style.display = 'block';
        bw.style.textAlign = 'center';
        bw.style.margin = '0 ' + get_height(15) + 'px';
        wg.appendChild(bw);

        if (textword !== undefined) {
            var tw = DOM.createElement('span');
            tw.className = 'textword';
            tw.style.display = 'block';
            tw.style.textAlign = 'center';
            if (textword && /\S/.test(textword)) {
                tw.textContent = textword;
            } else {
                tw.innerHTML = '&nbsp;';
            }
            wg.appendChild(tw);
        }

        if (blissword && blissword.length) {
            var data = BLISS.data[blissword[0]];
            if (data && data.type == 'punct') {
                wg.style.marginLeft = get_height(-20) + 'px';
            }
            show_chars(bw, blissword);
        }
    }

    function show_text(parent, blisswords, textwords) {
        for (var i = 0; i < blisswords.length; i++) {
            var textwd = textwords && (textwords[i] || '');
            show_word(parent, blisswords[i], textwd);
        }
    }

    return BLISS;
}(BLISS || {}, document));
