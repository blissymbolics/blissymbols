Blissymbols
===========

A database of all official Blissymbols, and their definitions. Plus some additional utilities. Contents:

- `blissdata_chars.js`, `blissdata_words.js`: this are the most important files, the database itself
- `blissviewer.js`: a generic Javascript module for attaching Blissymbols to text
  - this file is compiled from the corresponding TypeScript file `blissviewer.ts`
- `blissviewer.css`: example CSS style sheet for displaying the Blissymbols
- `blissviewer-demo.html`: a simple webpage that shows how `blissviewer.js` can be used; you can test it out here:
  - <https://blissymbolics.github.io/blissymbols/blissviewer-demo.html>
  - the demo uses a wrapper Javascript file `blissdemo.js`, and the JQuery library

There are only three global names that are introduced by the library:
`BLISS_CHAR_DATA`, `BLISS_WORD_DATA` and `BlissViewer` are defined by `blissdata_chars.js`, `blissdata_words.js`
and `blissviewer.js`, respectively. They are supposed to be used like this:

    var myBlissViewer = new BlissViewer(BLISS_CHAR_DATA, BLISS_WORD_DATA, {...})

(The third argument to the BlissViewer constructor is an optional configuration dictionary).

Below are some more detailed information about [blissdata_(char/word).js](#blissdatacharwordjs) and [blissviewer.js](#blissviewerjs).


blissdata_(char/word).js
------------------------

These are Javascript files that encode all metadata about all official Blissymbols.
The database consists of two Javascript objects `BLISS_CHAR_DATA` and `BLISS_WORD_DATA`,
with the following structures:

    BLISS_WORD_DATA = {
        "words": {
            // a "word" consists of a horizontal sequence of "chars":
            "snowplow,snowplough": ["vehicle,carriage,railway_car", "minus,no,without", "snow"],
            "Tarzan": ["make-believe_man", "tropical_rain_forest,jungle"],
            ...,
        },
    };
    BLISS_CHAR_DATA = {
        "chars": {
            // a "char" consists of a number of positioned "shapes", and a width and height:
            "make-believe_man": {h:5, w:128, d:[{d:"@0049",x:0,y:64}]},
            "meeting,encounter": {h:7, w:288, d:[{d:"@0118",x:0,y:160}, {d:"@0143",x:160,y:160}]},
            ...,
        },
        "center": {
            // for some "chars" the indicator should not be centered:
            "development": -64,
            "tool,instrument": 16,
            ...,
        },
        "kerning_left": {
            // this specifies where the leftmost parts of a "char" are:
            "make-believe_man": 26,  // binary 11010
            "tool,instrument": 4,  // binary 00100
            ...,
        },
        "kerning_right": {
            // this specifies where the rightmost parts of a "char" are:
            "development": 4,  // binary 00100
            "make-believe_man": 26,  // binary 11010
            ...,
        },
        "paths": {
            // a "path" is a basic form:
            "#A90-W:32": {form:"arc", x1:8, y1:0, x2:8, y2:32, h:32, r:22.627, w:8},
            "#CIRCLE:64": {form:"circle", x:32, y:32, r:32, w:64, h:64},
            "#TEXT:n:56": {form:"text", x:0, y:0, w:32, h:56, text:"n", fontsize:77},
            ...,
        },
        "shapes": {
            // a "shape" consists of a number of other "shapes" or "paths":
            "+0043": [{x:0, y:64, d:"#CIRCLE:64"}, {x:64, y:0, d:"#L+90:96"}],
            "@0927": [{x:0, y:0, d:"+0174"}, {x:144, y:32, d:"+0028"}],
            ...,
        },
    };

As it happens, the database file is stored in a format that is readable as a Python file too.

There is a TypeScript description file for the database format: `blissdata.d.ts`.


blissviewer.js
--------------

This Javascript file is compiled from the TypeScript file `blissviewer.ts`. It defines a class `BlissViewer`, which is instantiated like this:

    var myBlissViewer = new BlissViewer(data, config?)

The arguments are as follows:

- `data` is the Blissymbol database (preferrably `BLISSDATA` as defined in `blissdata.js`)
- `config` is an optional dictionary for setting parameters:
  - `margin`: the extra margin to add around each Blissword (default value: 8 pixels, to account for a stroke width of 8 pixels)
  - `radius`: the radius of a dot (default value: 4 pixels)

A BlissViewer has the following public methods:

    myBlissViewer.add_blissvg = function(parent, blissword, ?grid)
    myBlissViewer.add_blissword = function(parent, ?blissword, ?textword, ?grid)
    myBlissViewer.add_blisstext = function(parent, blisswords, ?textwords, ?grid)
    myBlissViewer.add_blisswords_to_class = function(cls, ?grid)

The arguments are as follows:

- `parent` should be a reference to a HTML container (such as `<span>`, `<div>` or `<p>`).
- `blissword(s)` is a (list of) Blissword(s), where each word is either a Blissymbol id (which is a string), or a list of ids.
- `textword(s)` is an optional (list of) text word(s), where each word is a string.

The functions append the (sequence of) `blissword(s)` to the `parent` container. The `textword(s)` is added below each Blissword, if present. See `blissviewer-demo.html` and `blissdemo.js` for an example of how it can be used.


Note about the database
-----------------------

The database is split into two files, one for the characters and one for the words.
This is because all updates of word definitions should be made using the Karp online lexicon,
from Språkbanken:

- http://spraakbanken.gu.se/karp/#?lang=eng&resources=blissword,blisschar

There is a script, `download_and_update_blissdata_words.py`, which is run irregularly to keep
the database in this repository in sync with Karp.
