JScrab - Fast Scrabble(TM) type Game in JavaScript
==================================================

This is an implementation in pure JavaScript played against the computer (browser) with a very fast engine. It works well on every browser I've tested (Chrome, Firefox, Safari, IE6+, Opera) and operating systems (Windows, Mac OS/X, Linux)

To start the game, you can go directly to the web page at http://amnond.github.io/jscrab or download the code and open src/index.html in your browser.

The code is composed of an engine (engine.js) that does the game logic, and a user interface (ui.js) that implements a user interface to the game engine. This design enables to easily create alternative user interfaces. The code is also designed to be easily localized to other languages and currently supports English, Russian and Spanish. Corrections and comments are welcome. The fast game play is made possible by leveraging the regular expression engine of JavaScript to conduct the searches.

The current UI engine makes use of the excellent Redips (http://www.redips.net/) drag and drop library.
Other credits go to http://sizzlejs.com and https://code.google.com/p/submodal


