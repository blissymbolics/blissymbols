blissymbols
===========

A database of all official Blissymbols, and their definitions

Contents:
- blissdata.js: this is the most important file, the database itself
- blisseditor.html: this is a very simplistic helper form for updating the database
- check_consistency.py: a Python script that checks blissdata.js for obvious inconsistencies
- blisseditor.js, lib/: utility files for blisseditor.html
- svg/: more than 5000 SVG files

blisseditor.html
-------------------

When you use the blisseditor, all changes are done locally inside the browser. 
The original database file ***is not*** updated automatically, even if you "save".

To get the changes on your own computer, you have to press "Download database" and 
then replace your database file with the downloaded file. 
Be sure to check that the file is consistent before replacing.

Finally, to get your changes into the official list, you have to fork this repository 
and issue a pull request whenever you have made your changes.

