JScrab - Scrabble Game in JavaScript
====================================

This is an implementation of a JavaScript game played against the computer (browser) with a very fast engine.

The code is composed  an engine (engine.js) that does the game logic, and a user interface (ui.js) that implements a user interface to the game engine. This design enables to easily create alternative user interfaces. The code is also designed to be easily localized to other languages and currently supports English, Russian and Spanish. Corrections and comments are welcome. The fast game play is made possible by leveraging the regular expression engine of JavaScript to conduct the searches.

The current UI makes use of the excellent Redips (http://www.redips.net/) drag and drop library.


