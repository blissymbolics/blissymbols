"""
This script reads the up-to-date blissword definitions from Sprakbanken's XML,
and converts them to the Javascript database file (also readable as a Python file).
"""

# Tweaks to make the script work with both python 2 and 3:
from __future__ import print_function
try: 
    import urllib.request as urllib2
except ImportError:
    import urllib2

import xml.sax
import json

INPUT_URL = "https://svn.spraakdata.gu.se/sb-arkiv/pub/lmf/bliss/blissword.xml"
OUTPUT_FILE = "blissdata_words.js"


class BlissWordHandler(xml.sax.ContentHandler):
    """
    The structure of a lexical entry in the Karp XML file:

    <LexicalEntry>
      <ListOfComponents>
        <Component entry="...first token in definition..." />
        <Component entry="...second token..." />
        ...
      </ListOfComponents>
      <Lemma>
        <FormRepresentation>
          <feat att="blissID" val="...word..." />
          ...
        </FormRepresentation>
      </Lemma>
      ...
    </LexicalEntry>

    This is parsed into a list of lists:

    [..., ["...word...", "...first token...", "...second token...", ...], ...]
    """

    def __init__(self):
        xml.sax.ContentHandler.__init__(self)
        self.definitions = []

    def startElement(self, name, attrs):
        if name == "LexicalEntry":
            self.definitions.append([])
        elif name == "Component":
            self.definitions[-1].append(attrs.get("entry"))
        elif name == "feat" and attrs.get("att") == "blissID":
            self.definitions[-1].insert(0, attrs.get("val"))


def main():
    # Read the XML file into a sorted list of definitions:
    handler = BlissWordHandler()
    xml.sax.parse(urllib2.urlopen(INPUT_URL), handler)
    handler.definitions.sort(key=lambda entry:entry[0].lower())

    # Print the list of definitions in Javascript format:
    with open(OUTPUT_FILE, "w") as output:
        print("BLISS_WORD_DATA = {", file=output)
        print('\t"words": {', file=output)
        for entry in handler.definitions:
            print("\t\t%s: %s," % (
                json.dumps(entry[0]),
                json.dumps(entry[1:], separators=(',',':'))
            ), file=output)
        print('\t},\n};', file=output)


if __name__ == '__main__':
    main()
 
