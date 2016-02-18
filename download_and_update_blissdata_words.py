"""
This script reads the up-to-date blissword definitions from Sprakbanken's XML,
and prints them in Javascript format (also readable as a Python file).
"""

import urllib.request
import xml.sax
import json

INPUT_URL = "https://svn.spraakdata.gu.se/sb-arkiv/pub/lmf/bliss/blissword.xml"
OUTPUT_FILE = "blissdata_words.js"


class BlissWordHandler(xml.sax.ContentHandler):
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
    handler = BlissWordHandler()
    with urllib.request.urlopen(INPUT_URL) as input:
        xml.sax.parse(input, handler)
    handler.definitions.sort(key=lambda entry:entry[0].lower())

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
 
