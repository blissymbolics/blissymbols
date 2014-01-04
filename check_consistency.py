
import sys
import re
import os.path
import glob
import json

SVGDIR = "svg"


def error(sym, err, *args):
    print >>sys.stderr, "Error in symbol {0:.<40} {1}".format(sym, err % args)


def is_cyclic(data, sym, visited):
    if sym in visited:
        return True
    definition = data.get(sym, {}).get('definition')
    if not definition: 
        definition = ()
    visited = visited | set([sym])
    return any(is_cyclic(data, sub, visited) for sub in definition)
        

def check_consistency(blissfile):
    with open(blissfile) as F:
        code = F.read()
    _, _, code = code.partition('BLISS.data =')
    code, _, _ = code.rpartition('return BLISS')
    code = code.strip().rstrip(';')
    data = json.loads(code)
    for sym, info in sorted(data.items()):
        typ, definition, kern, height, width, center, modified, verified = (
            map(info.get, 'type definition kern height width center modified verified'.split()))
        if typ not in ('word', 'char', 'ind', 'mod', 'punct'):
            error(sym, "Unrecognized type: %r", typ)
        if typ != 'word' and definition:
            error(sym, "Only words can have definitions")
        if typ not in ('char', 'mod') and kern:
            error(sym, "Only characters and modifiers can have kerning")
        if definition:
            for sub in definition:
                if sub not in data:
                    error(sym, "Unknown symbol id in definition: %r", sub)
            if is_cyclic(data, sym, set()):
                error(sym, "Symbol definition is cyclic")
        if kern:
            for sub in kern:
                if sub not in data:
                    error(sym, "Unknown symbol id in kerning: %r", sub)
        if height:
            if height not in ('high', 'normal'):
                error(sym, "The only recognized heights are 'high' and 'normal', not: %r", height)
        if width:
            if not (isinstance(width, int) and width > 0):
                error(sym, "Width must be a positive integer, not: %r", width)
        if center:
            if not isinstance(center, int):
                error(sym, "Center must be an integer, not: %r", width)
        if verified and not modified:
            error(sym, "The symbol is not modified, but verified by: %r", verified)
        svgfile = os.path.join(SVGDIR, sym + '.svg')
        if not os.path.isfile(svgfile):
            error(sym, "The SVG file does not exist: %s", svgfile)

    for svgfile in glob.glob(os.path.join(SVGDIR, '*.svg')):
        sym = os.path.split(svgfile)[-1]
        sym = sym[:-4] # remove '.svg' at the end
        if sym not in data:
            error(svgfile, "The SVG file has no corresponding symbol: %r", sym)


if __name__ == '__main__':
    if len(sys.argv) == 2:
        check_consistency(sys.argv[1])
    else:
        print >>sys.stderr, "Usage: python %s blissdata-file" % (sys.argv[0],)

