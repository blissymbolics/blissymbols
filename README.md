Blissymbols
===========

A database of all official Blissymbols, and their definitions. Plus some additional utilities. Contents:

- `blissdata.js`: this is the most important file, the database itself
- `blissviewer.js`: a generic Javascript module for attaching Blissymbols to text
- `blissviewer.css`: example CSS style sheet for displaying the Blissymbols
- `blissviewer-demo.html`: a simple webpage that shows how `blissviewer.js` can be used

The Javascript files that are supposed to be used as library files (currently `blissdata.js` and `blissviewer.js`) all follow the [Javascript Module Pattern] [JMP] to not pollute the global namespace. To be more exact, we are using "loose augmentation" and "global import" so that the files can be loaded in any order (se the linked article for more information).

[JMP]: http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html

The namespace we are using is `BLISS`. This means that all our Javascript library files have the following structure:

    var BLISS = (function (BLISS, ...possible-global-modules) {
        // exported variables and methods
        BLISS.exported_variable = ...;
        BLISS.exported_method = exported_method;

	    // private variables and methods
        var private_variable = ...;
        function private_method(...) {...}
        function exported_method(...) {...}

	    return BLISS;
    }(BLISS || {}, ...possible-global-modules));

Below are some more detailed information about [blissdata.js](#blissdatajs) and [blissviewer.js](#blissviewerjs). 


blissdata.js
------------

This is a Javascript file that encodes all metadata about all official Blissymbols. It is auto-generated, compressed and quite unreadable.

The database is added as a Javascript object `BLISS.data`, with the following structure:

    BLISS.data = {
        "WORDS": {
            "Tarzan": ["make-believe_man", "tropical_rain_forest,jungle"],
            ...,
        },
        "CHARS": {
            "make-believe_man": {h:5, w:128, d:[{d:"@0049",x:0,y:64}]},
            ...,
        },
        "CENTER": {
            "development": -64,
            "tool,instrument": 16,
            ...,
        },
        "KERNING-LEFT": {
            "make-believe_man": 26,
            "tool,instrument": 4,
            ...,
        },
        "KERNING-RIGHT": {
            "development": 4,
            "make-believe_man": 26,
            ...,
        },
        "SHAPES": {
            "@0049": ["+0048"],
            "+0048": [{x:0,y:64,d:"#L+0:128"}, {x:32,y:0,d:"#CIRCLE:64"}, ...],
            "#CIRCLE:64": {form:"circle", x:32, y:32, r:32, w:64, h:64},


blissviewer.js
--------------

This Javascript file exports the following functions:

    BLISS.add_blissvg = function(parent, blissword, ?grid)
    BLISS.add_blissword = function(parent, ?blissword, ?textword, ?grid)
    BLISS.add_blisstext = function(parent, blisswords, ?textwords, ?grid)
    BLISS.add_blisswords_to_class = function(cls, ?grid)

The arguments are as follows:

- `parent` should be a reference to a HTML container (such as `<span>`, `<div>` or `<p>`).
- `blissword`(s) is a (list of) Blissword(s), where each word is either a Blissymbol id (which is a string), or a list of ids.
- `textword`(s) is an optional (list of) text word(s), where each word is a string.

The function appends the (sequence of) `blissword`(s) to the `parent` container. The `textword`(s) is added below each Blissword, if present. See `blissviewer-demo.html` for an example of how it can be used.

The function can be configured by setting the following variable:

- `BLISS.config.margin`: The extra margin to add around each Blissword. Default value: 8 pixels (to account for a stroke width of 8 pixels).

