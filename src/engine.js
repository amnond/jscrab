//---------------------------------------------------------------------------
// Assumptions
// 1. g_bui exists and has the interface for interacting wih the board UI
//    (redips-drag based UI creates g_bui in ui.js)
// 2. g_letters exists and contains the letter distribution and points
//    (defined in xx_letters.js, where xx is the language code)
// 3. g_vowels - a map of the vowels for the language used (temporarily? used
//    for enabling the computer to make the first move). Defined in
//    xx_letters.js
// 4. g_letrange - the regular expression for the alphabet range of the
//    given language. Defined in xx-letters.js
// 5. t() defined in translate_xx.js and returns the translated text
//    of a string.
//---------------------------------------------------------------------------

var g_board;                // letters on board
var g_boardpoints;          // points on board
var g_boardmults;           // board bonus multipliers (DL, TL, DW, TW)
var g_letpool       = [];   // letter pool
var g_letscore      = {};   // score for each letter
var g_racksize      = 7;    // max number of letters on racks
var g_matches_cache = {};   // to speed up regex matches
var g_pscore        = 0;    // player score
var g_oscore        = 0;    // opponent (computer) score
var g_board_empty   = true; // first move flag
var g_passes        = 0;    // number of consecutive passes
var g_maxpasses     = 2;    // maximum number of consecutive passes
var g_lmults = [1,2,3,1,1]; // letter multipliers by index
var g_wmults = [1,1,1,2,3]; // word multipliers by index

var g_opponent_has_joker;   // Optimization flag if computer has joker tile

var gCloneFunc = typeof(Object.create)=="function" ? Object.create :
                 function(obj) {
                    var cl={};
                    for (var i in obj) cl[i]=obj[i];
                    return cl;
                 };

var g_allLettersBonus = 50;
var g_playlevel;                       // computer play level
var g_maxwpoints = [15,30,45,50,450];  // maximum word score for each level

//---------------------------------------------------------------------------

/*
var timers = {};
timers.create = function()
{
    var self = {};
    var t1,total;

    self.begin = function(id) {
        t1[id] = +new Date();
        if (!(id in total))
            total[id] = 0;
    };

    self.pause = function(id) {
        if (id in t1) {
            var t2 = +new Date();
            total[id] += t2-t1[id];
            t1[id] = t2;
        }
    };

    self.show = function() {
        logit( "Total times:");
        for (var id in total)
            logit( id+": "+total[id]+" ms." );
    };

    self.reset = function() {
        t1    = {};
        total = {};
    };

    self.reset();
    return self;
};

var g_timers = timers.create();

*/

//---------------------------------------------------------------------------
function shuffle_pool()
{
    var total = g_letpool.length;
    for (var i=0; i<total; i++) {
        var rnd = Math.floor((Math.random()*total));
        var c = g_letpool[i];
        g_letpool[i] = g_letpool[rnd];
        g_letpool[rnd] = c;
    }
}

//---------------------------------------------------------------------------
function init( iddiv )
{
    // Put all the letters in the pool
    var numalpha = g_letters.length;
    for (var i=0; i<numalpha; i++) {
        var letinfo = g_letters[i];
        var whichlt = letinfo[0];
        var lpoints = letinfo[1];
        var numlets = letinfo[2];
        g_letscore[whichlt] = lpoints;
        for (var j=0; j<numlets; j++)
            g_letpool.push( whichlt );
    }

    shuffle_pool();

    var my_letters   = "";
    var comp_letters = "";

    my_letters   = takeLetters( my_letters );
    comp_letters = takeLetters( comp_letters );

    g_bui.create( iddiv, 15, 15, g_letscore, g_racksize );

    g_bui.setPlayerRack( my_letters );
    g_bui.setOpponentRack( comp_letters );
    g_bui.setTilesLeft( g_letpool.length );
}

//---------------------------------------------------------------------------
function takeLetters( existing )
{
    var poolsize = g_letpool.length;
    if (poolsize === 0)
        return existing;

    var needed = g_racksize - existing.length;
    if (needed > poolsize)
        needed = poolsize;
    var letters = g_letpool.slice(0, needed).join("");
    g_letpool.splice(0, needed);
    return letters+existing;
}

//---------------------------------------------------------------------------
function checkValidPlacement( placement )
{
    if (placement.length === 0)
        return { played:"", msg:t("no letters were placed.") };

    var isplacement = {};
    var worderrs = "";

    var lplayed = "";
    var minx = placement[0].x;
    var miny = placement[0].y;
    var maxx = minx;
    var maxy = miny;
    var dx = 0;
    var dy = 0;

    // In case of first placecement
    var sp = g_bui.getStartXY();
    var onStar = false;

    var x,y,xy;

    for (var i=0; i<placement.length; i++) {
        var pl = placement[i];
        if (pl.lsc === 0)
            lplayed += "*";
        else
            lplayed += pl.ltr;
        x = pl.x;
        y = pl.y;

        if (x==sp.x && y==sp.y)
            onStar = true;

        xy = x+"_"+y;
        isplacement[xy] = pl;

        if (minx > x)
            minx = x;

        if (maxx < x)
            maxx = x;

        if (miny > y)
            miny = y;

        if (maxy<y)
            maxy = y;
    }

    if (miny < maxy)
        dy = 1;

    if (minx < maxx)
        dx = 1;

    if (dx==1 && dy==1)
        return {played:"", msg:t("word must be horizontal or vertical.") };

    if (g_board_empty && !onStar)
        return {played:"", msg:t("first word must be on the star.") };

    var mbx = g_board.length;
    var mby = mbx;

    if (dx===0 && dy===0) {
        // only one letter was placed
        if (minx>0 && g_board[minx-1][miny]!=="" ||
            minx<mbx-1 && g_board[minx+1][miny]!=="" )
            dx = 1;
        else
        if (miny>0 && g_board[minx][miny-1]!=="" ||
            miny<mby-1 && g_board[minx][miny+1]!=="" )
            dy = 1;
        else {
            lplayed = lplayed.toUpperCase();
            var msg = lplayed + t(" is not connected to a word.");
            return {played:"", msg:msg };
        }
    }

    var numl = (dx==1) ? maxx-minx+1 : maxy-miny+1;
    var px = minx-dx;
    var py = miny-dy;
    var word = "";

    var wordmult = 1;
    var wscore = 0; // word score
    var oscore = 0; // score from orthogonal created words
    var ltr;
    var words = []; // array of word and orthogonal words created

    for (i=0; i<numl; i++) {
        x = px+dx;
        y = py+dy;

        ltr = g_board[x][y];
        if (ltr === "") {
            // spaces in the middle of the word
            return { played:"", msg:t("spaces in word.") };
        }

        xy = x+"_"+y;
        if (xy in isplacement) {
            // check if orthogonal word created
            var pinfo = isplacement[xy];
            var bonus = g_boardmults[x][y];
            var lscr  = pinfo.lsc;

            var orthinfo = getOrthWordScore( ltr, lscr, x, y, dx, dy );

            // Add score of newly placed tile
            lscr *= g_lmults[bonus];
            wscore += lscr;
            wordmult *= g_wmults[bonus];

            if ( orthinfo.score == -1 ) {
                if (worderrs !== "")
                    worderrs += ", ";
                worderrs += orthinfo.word.toUpperCase();
            }

            if (orthinfo.score > 0) {
                oscore += orthinfo.score;
                words.push(orthinfo.word);
            }
            //logit( "orthword:"+orthinfo.word+", score:"+orthinfo.score );

        }
        else
            // Add score of existing tile on board
            wscore += g_boardpoints[x][y];

        word += ltr;
        px += dx;
        py += dy;
    }

    // Add letters from board before placement
    var xpre = minx-dx;
    var ypre = miny-dy;
    while (xpre>=0 && ypre>=0 && g_board[xpre][ypre] !== "") {
        ltr = g_board[xpre][ypre];
        wscore += g_boardpoints[xpre][ypre];
        word = ltr + word;
        xpre -= dx;
        ypre -= dy;
    }

    var xpst = maxx+dx;
    var ypst = maxy+dy;
    while (xpst<mbx && ypst<mby && g_board[xpst][ypst] !== "") {
        ltr = g_board[xpst][ypst];
        wscore += g_boardpoints[xpst][ypst];
        word += ltr;
        xpst += dx;
        ypst += dy;
    }

    if (!(word in g_wordmap)) {
        if (worderrs !== "")
            worderrs += ", ";
        worderrs += word.toUpperCase();
    }

    if (worderrs !== "") {
        worderrs += t(" not found in dictionary.");
        return { played:"", msg:worderrs };
    }

    if (!g_board_empty && oscore == 0 && word.length == placement.length) {
        // No orthogonal words created and no extension to existing
        // word created - this means that the new word isn't connected
        // to anything. 
        return { played:"", msg:t("word not connected.") };
    }

    //logit( "created word is:"+ word);
    words.push( word );

    var score = wscore*wordmult + oscore;

    return { played:lplayed, score:score, words:words };
}

//---------------------------------------------------------------------------
function onPlayerClear()
{
    g_bui.cancelPlayerPlacement();
}

//---------------------------------------------------------------------------
function onPlayerSwap()
{
    // If there were any tiles from the player's rack on the board
    // put them back on the rack
    var tilesLeft = g_letpool.length;
    if (tilesLeft === 0) {
        g_bui.prompt( t("Sorry - no tiles left to swap") );
        return;
    }
    g_bui.cancelPlayerPlacement();
    g_bui.showSwapModal( tilesLeft );
}

//---------------------------------------------------------------------------
function onPlayerSwapped( keep, swap )
{
    if (swap.length === 0) {
        g_bui.setPlayerRack( keep );
        // initialize redisp again
        g_bui.makeTilesFixed();
        return;
    }

    for (var i=0; i<swap.length; i++)
        g_letpool.push( swap.charAt(i) );

    shuffle_pool();

    var newLetters = takeLetters( keep );
    g_bui.setPlayerRack( newLetters );

    onPlayerMoved( true );
}

//---------------------------------------------------------------------------
function onPlayerMoved( passed )
{
    if (passed)
        g_bui.cancelPlayerPlacement();

    self.passed = passed;
    g_bui.showBusy();
    setTimeout( onPlayerMove, 100 );
}

//---------------------------------------------------------------------------
function find_first_move( opponent_rack, fx, fy )
{
    // Not going to bother finding the best possible
    // word for the 1st move - just take some letter,
    // put it on the board and see what can be built
    // around it.
    var letters = opponent_rack.split("").sort();
    var foundv = false;
    var anchor = 0;
    for (var i=0; i<letters.length; i++) {
        if (letters[i] in g_vowels) {
            foundv = true;
            anchor = i;
            break;
        }
    }
    var alet = letters[anchor];
    var aletscr = g_letscore[alet];

    // The new rack is what is left after we remove the candidate
    // letter from the starting rack and place it on the board.

    letters.splice( anchor, 1 );

    // Simulate a first letter already existing on the board
    g_board[fx][fy] = alet;
    g_boardpoints[fx][fy] = aletscr;

    // Now fund best move assuming board has candidate letter on it
    var selword = { score:-1 };

    if (fx > 0)
        selword = findBestWord( opponent_rack, letters, fx-1, fy );

    if (selword.score == -1 && fx>=0 && fx<g_board.length-1 )
        selword = findBestWord( opponent_rack, letters, fx+1, fy );

    if (selword.score == -1) {
        // no word found - remove traces from board
        g_board[fx][fy] = "";
        g_boardpoints[fx][fy] = 0;
        return null;
    }

    //----------------------------------------------------------------
    // Patch the letter sequence points and the letter sequence
    // so that the first letter we simulated as being on the
    // board will also be included
    var pos = Math.abs(fx - selword.ax);
    if (selword.ax < fx)
        // sequence begins before simulated first letter on board -
        // insert first letter score to its propper place
        selword.lscrs.splice(pos, 0, aletscr);
    else
        // sequence begins after simulated first letter on board.
        // It must be also first letter in word.
        selword.lscrs.splice(0, 0, aletscr);

    // In the case of the first move, the sequence of played letters
    // and the word played are identical
    selword.seq = selword.word;
    //----------------------------------------------------------------

    // remove traces of simulating first letter on the board
    g_board[fx][fy] = "";
    g_boardpoints[fx][fy] = 0;

    // Update the word score with the score of the anchor letter we
    // placed to build the word on.
    selword.score += aletscr;
    //g_bui.opponentPlay(fx, fy, alet, aletscr);
    return selword;
}

//---------------------------------------------------------------------------
function find_best_move( opponent_rack )
{
    var num = opponent_rack.length;
    letters = [];
    for (var i=0; i<num; i++)
        letters[i] = opponent_rack.charAt(i);

    var board_best_score = -1;
    var board_best_word = null;

    for ( var ax=0; ax<g_board.length; ax++) {
        for ( var ay=0; ay<g_board[ax].length; ay++) {
            if (g_board[ax][ay] !== "")
                continue;

            //logit( "scanning:"+ax+","+ay );
            // find the best possible word for board
            // placement at coordinates ax,ay given
            // the current set of letters
            var word = findBestWord( opponent_rack, letters, ax, ay );
            if (word.score > -1)
                logit( "found word:"+word.word+" ("+letters+")" );

            if (board_best_score < word.score) {
                // If this is better than all the board placements
                // so far, update the best word information
                board_best_score = word.score;
                board_best_word = word;
            }
        }
    }

    //logit( board_best_word.word );
    return board_best_word;
}

//---------------------------------------------------------------------------
function announceWinner()
{
    var oleft = g_bui.getOpponentRack();
    var pleft = g_bui.getPlayerRack();

    var odeduct = 0;
    for (var i=0; i<oleft.length; i++)
        odeduct += g_letscore[oleft.charAt(i)];

    pdeduct = 0;
    for (i=0; i<pleft.length; i++)
        pdeduct += g_letscore[pleft.charAt(i)];

    g_oscore -= odeduct;
    g_pscore -= pdeduct;

    html = t("After deducting points of unplaced tiles, score is:");
    html += "<br>";
    html += t("You:")+g_pscore+t("  Computer:")+g_oscore+"<br>";
    var msg = t("It's a draw !");
    if (g_oscore > g_pscore)
        msg = t("Computer wins.");
    else
    if (g_oscore < g_pscore)
        msg = t("You win !");
    html += "<font size='+2'>" + msg + "</font>";
    g_bui.prompt( html, "" );
}

//---------------------------------------------------------------------------
function onPlayerMove()
{
    var passed = self.passed;
    if (passed) {
        g_passes++; // increase consecutive opponent passes
        if (g_passes>=g_maxpasses) {
            announceWinner();
            return;
        }
    }

    //g_timers.reset();

    var boardinfo = g_bui.getBoard();
    g_board = boardinfo.board;
    g_boardpoints = boardinfo.boardp;
    g_boardmults  = boardinfo.boardm;

    if (!passed) {
        var placement = g_bui.getPlayerPlacement();
        var pinfo = checkValidPlacement( placement );
        var pstr = pinfo.played;
        if ( pstr === "" ) {
            g_bui.prompt( t("Sorry, ") + pinfo.msg );
            return;
        }

        //logit( "player placement chars:" + pstr );
        g_bui.acceptPlayerPlacement();
        g_board_empty = false; // placement made
        g_passes = 0; // reset consecutive passes

        if (pstr.length == g_racksize)
            g_pscore += g_allLettersBonus;

        g_pscore += pinfo.score;
        g_bui.setPlayerScore( pinfo.score, g_pscore );

        g_bui.addToHistory(pinfo.words, 1);
        //logit( "removing player chars:" + pstr );
        g_bui.removefromPlayerRack( pstr );
        var pletters = g_bui.getPlayerRack();
        //logit( "left on player rack:" + pletters );
        pletters = takeLetters(pletters);
        if (pletters === "") {
            // All tiles were played and nothing left
            // in the tile pool
            announceWinner();
            return;
        }
        //logit( "setting player rack to:" + pletters );
        g_bui.setPlayerRack( pletters );
        g_bui.setTilesLeft( g_letpool.length );
    }
    else {
        // put back whatever was placed on the board
        g_bui.cancelPlayerPlacement();
        //logit( "after cancel, left on player rack:" + g_bui.getPlayerRack() );
    }

    var ostr = g_bui.getOpponentRack();
    g_opponent_has_joker = ostr.search("\\*") != -1;
    g_playlevel = g_bui.getPlayLevel();

    logit( "opponent rack has:" + ostr );

    var play_word;
    if ( g_board_empty ) {
        var start = g_bui.getStartXY();
        play_word = find_first_move( ostr, start.x, start.y );
    }
    else
        play_word = find_best_move( ostr );

    //logit( "opponent word is:" + play_word.word );

    var animCallback = function()
    {
        g_bui.makeTilesFixed();
        //g_bui.hideBusy();
        // create the array of word and created orthogonal
        // words created by opponent move.
        var words = play_word.owords;
        words.push( play_word.word );

        // and send it to the played history window
        g_bui.addToHistory(words, 2);

        var score = play_word.score;
        g_oscore += score;
        if (play_word.seq.length == g_racksize)
                g_oscore += g_allLettersBonus;
        g_bui.setOpponentScore( score, g_oscore );

        var played = play_word.seq;

        var letters_used = "";
        for (i=0; i<played.length; i++) {
            var pltr = played.charAt(i);
            if (ostr.search(pltr) > -1)
                    letters_used += pltr;
                else
                    letters_used += "*";
        }
        g_bui.removefromOpponenentRack( letters_used );

        // get letters from pool as number of missing letters
        var letters_left = g_bui.getOpponentRack();
        logit( "opponent rack left with:" + letters_left);
        var newLetters = takeLetters(letters_left);
        if (newLetters === "") {
            // All tiles taken, nothing left in tile pool
            announceWinner();
            return;
        }
        logit( "after taking letters, opponent rack is:" + newLetters);
        g_bui.setOpponentRack( newLetters );
        g_bui.setTilesLeft( g_letpool.length );
    };


    if (play_word !== null) {
        placeOnBoard( play_word, animCallback );
        g_passes = 0; // reset consecutive opponeny passes
    }
    else {
        g_bui.hideBusy();
        g_passes++; // increase consecutive opponent passes
        if (g_passes >= g_maxpasses)
            announceWinner();
        else {
            g_bui.prompt( t("I pass, your turn.") );
            g_bui.makeTilesFixed();
        }
        return;
    }

}

//---------------------------------------------------------------------------
function findBestWord( rack, letters, ax, ay )
{
    //var t1 = +new Date();

    var numlets = letters.length;

    var bestscore = -1;
    var bestword = {score:-1};
    var dirs = ["x","y"];
    for (var dir in dirs) {
        var xy = dirs[dir];
        //logit( "direction:" + xy );
        //g_timers.begin( "getRegex" );
        var regex = getRegex( xy, ax, ay, rack );
        //g_timers.pause( "getRegex" );
        //logit( regex );
        if (regex !== null) {
            //g_timers.begin( "getBestScore" );
            var word = getBestScore( regex, letters, ax, ay );
            //g_timers.pause( "getBestScore" );
            if (bestscore < word.score) {
                bestscore = word.score;
                bestword = word;
                //logit( "new best:" );
                //logit( bestword );
            }
        }
    }

    // var t2 = +new Date();
    // logit( "Time for findBestWord:"+(t2-t1) );

    return bestword;
}

//---------------------------------------------------------------------------
function getBestScore( regex, letters, ax, ay )
{
    var rletmap = {};
    var numjokers = 0;
    for (var i=0; i<letters.length; i++) {
        var ltr = letters[i];
        if (ltr == "*") // joker
            numjokers++;
        else
        if (!(ltr in rletmap))
            rletmap[ltr]=1;
        else
            rletmap[ltr]++;
    }

    var bestscore = -1;
    var bestword = { score:-1 };

    if (regex.max - 1 >= g_wstr.length)
        return bestword;

    var regexp = new RegExp(regex.rgx, "g");
    var match, matches;
    var req_seq, word;

    for (var wlc=regex.min-2; wlc<regex.max-1; wlc++) {
        var id = regex.rgx + wlc;
        if (id in g_matches_cache)
            matches = g_matches_cache[id];
        else {
            matches = [];
            while ((match=regexp.exec(g_wstr[wlc]))!==null) {
                // go over all matching regex groups for this word
                // (g_wstr[wlc]), and save the required letters
                req_seq = "";
                //g_timers.begin( "req_seq using loop" );
                for (i=1; i<match.length; i++) {
                    if (match[i]) // ignore the groups with 'undefined'
                        req_seq += match[i];
                }
                //g_timers.pause( "req_seq using loop" );
                // save the word and the missing letters
                var mseq = match[0];
                // remove the marker symbols for the regex match
                word = mseq.substr(1,mseq.length-2);
                matches.push({word:word, reqs:req_seq});
            }

            // cache the regexp word match and required letters
            g_matches_cache[id] = matches;
        }

        for (var j=0; j<matches.length; j++) {

            // we have a word that matches the required regular expression
            // check if we have matching letters for the sequence of missing
            // letters found in the regular expression for this word

            // create a count of the letters available to play

            var seq_lscrs = [];

            req_seq = matches[j].reqs;
            word = matches[j].word;

            //g_timers.begin( "letmap init" );
            var letmap = gCloneFunc( rletmap );
            //g_timers.pause( "letmap init" );

            // Check if the letters we have can create the word
            var ok = true;
            var jokers = numjokers;

            for (i=0; i<req_seq.length; i++) {
                var rlet = req_seq.charAt(i);
                //if (rlet in letmap && letmap[rlet]>0 ) {
                // the above is not necessary due to regex optmizations
                if ( letmap[rlet]>0 ) {
                    letmap[rlet]--;
                    seq_lscrs.push(g_letscore[rlet]);
                }
                else {
                    // we don't have a letter required for this word
                    // or we don't have enough of this type of letter
                    if (jokers === 0) {
                        // and no jokers either - can't create
                        // this word.
                        ok = false;
                        break;
                    }
                    // a joker is required
                    jokers--;
                    seq_lscrs.push(0); // no points for joker
                }
            }

            if (!ok)
                // Can't create this word, continue to the next one
                continue;


            // We have all the letters required to create this word
            var wordinfo   = { word:word, ax:ax, ay:ay };
            wordinfo.seq   = req_seq;     // sequence to put on board
            wordinfo.lscrs = seq_lscrs;   // sequence letter scores
            wordinfo.ps    = regex.ps;    // index of word start
            wordinfo.xy    = regex.xy;    // direction of scan
            wordinfo.prec  = regex.prec;  // letters before anchor

            //g_timers.begin( "getWordScore" );
            // getWordScore will return the total score of all the orthogonal
            // created words from placing this word. It will also populate
            // wordinfo with a new field words, which will contain the array
            // of the valid created orthogonal words (if score>0)
            var score = getWordScore( wordinfo );
            //g_timers.pause( "getWordScore" );

            var more = Math.ceil(Math.random()*5);
            var maxwpoints = g_maxwpoints[g_playlevel] + more;
            if (score < maxwpoints && bestscore < score) {
                bestscore = score;
                bestword = wordinfo;
                bestword.score = score;
            }
        }
    }
    return bestword;
}

//---------------------------------------------------------------------------
function getWordScore( wordinfo )
{
    var xdir = (wordinfo.xy == "x");
    var ax   = wordinfo.ax;
    var ay   = wordinfo.ay;
    var ap   = xdir ? ax : ay;
    var max  = xdir ? g_board.length : g_board[ax].length;

    var dx   = xdir ? 1 : 0;
    var dy   = 1 - dx;
    var ps   = wordinfo.ps;
    var seq  = wordinfo.seq;
    var seqc = 0;
    var x;
    var y;

    //logit( "Checking orthogonals for:"+wordinfo.word+" dir:"+wordinfo.xy );
    //logit( wordinfo );

    if (xdir) {
        x = ps;
        y = ay;
    }
    else {
        x = ax;
        y = ps;
    }

    var owords = []; // list of valid orthogonal words created with this move
    var wscore = 0;  // word score
    var oscore = 0;  // orthogonal created words score

    var lscores = wordinfo.lscrs;
    var locs = "x"+x+"y"+y+"d"+wordinfo.xy;

    var wordmult  = 1;

    while (ps < max) {
        if (g_board[x][y] === "") {
            var lscr = lscores[seqc]; // score of letter in sequence
            var lseq = seq.charAt(seqc++);   // the letter itself.

            // Add score of newly placed tile
            var bonus = g_boardmults[x][y];

            // calculate the ortagonal word score
            var ows = getOrthWordScore( lseq, lscr, x, y, dx, dy );

            if (ows.score == -1)
                // an invalid orthogonal word was created.
                return -1;

            if (ows.score > 0)
                owords.push( ows.word );

            wordmult *= g_wmults[bonus];
            lscr     *= g_lmults[bonus];
            wscore   += lscr;

            oscore += ows.score;
            x += dx;
            y += dy;
            ps++;
            if (seqc == seq.length)
                // all letters and possibly created words
                // have been checked
                break;
        }
        else
            // Add score of existing tile on board
            wscore += g_boardpoints[x][y];

        while (ps<max && g_board[x][y] !== "") {
            x += dx;
            y += dy;
            ps++;
        }
    }

    //logit( "word:" + wordinfo.word + ", mult:" + wordmult );
    wscore *= wordmult;

    if (seq.length == g_racksize)
        wscore += g_allLettersBonus;

    wordinfo.owords = owords;
    return wscore+oscore;
}

//---------------------------------------------------------------------------
function getOrthWordScore( lseq, lscr, x, y, dx, dy )
{
    var wordmult = 1;

    var score = 0;
    var wx = x;
    var wy = y;

    var xmax = g_board.length;
    var ymax = g_board[x].length;

    // If not already there, pretend weve placed the orhagonal anchor on
    // the board so we can include it when scanning the ortagonal word
    var lsave = g_board[wx][wy];
    var ssave = g_boardpoints[wx][wy];

    var bonus = g_boardmults[wx][wy];
    wordmult *= g_wmults[bonus];
    lscr *= g_lmults[bonus];

    g_board[wx][wy] = lseq;
    g_boardpoints[wx][wy] = lscr;


    //logit("checking orth:"+[lseq,x,y]);
    while (x>=0 && y>=0 && g_board[x][y]!=="") {
        x -= dy;
        y -= dx;
    }
    if (x<0 || y<0 || g_board[x][y]==="") {
        x += dy;
        y += dx;
    }
    var orthword = "";
    while (x<xmax && y<ymax && g_board[x][y]!=="") {
        var letter = g_board[x][y];
        score += g_boardpoints[x][y];
        orthword += letter;
        x += dy;
        y += dx;
    }

    // Orthogonal word built - we can now go back to the previous
    // value on the board in the position of the orthogonal anchor
    g_board[wx][wy] = lsave;
    g_boardpoints[wx][wy] = ssave;

    if (orthword.length == 1)
        // the letter does not form an orthogonal word.
        return {score:0, word:orthword };

    if (!(orthword in g_wordmap))
        return {score:-1, word:orthword };

    score *= wordmult;

    //logit( "orth word:"+ orthword + " score:" + score );
    return { score:score, word:orthword };
}

//---------------------------------------------------------------------------
function placeOnBoard( word, animCallback )
{
    var lcount = 0;
    var seqlen = word.seq.length;
    var dx = 1;
    var dy = 0;
    if (word.xy=="y") {
        dx = 0;
        dy = 1;
    }
    var x = word.ax;
    var y = word.ay;
    var placements = [];
    while (lcount < seqlen) {
        if (g_board[x][y] === "") {
            var lscr = word.lscrs[lcount];
            var ltr  = word.seq.charAt(lcount++);
            placements.push({x:x, y:y, ltr:ltr, lscr:lscr});
            //g_bui.opponentPlay(x, y, ltr, lscr);
        }
        x += dx;
        y += dy;
    }

    g_bui.playOpponentMove( placements, animCallback );
    g_bui.hideBusy();
    g_board_empty = false;
}

//---------------------------------------------------------------------------
// Get regular expression that matches all the words that qualify being
// in the set of words that place the first letter on the board at anchor
// position ax,ay in direction dir using at most numlets number of letters.

function getRegex( dir, ax, ay, rack )
{
    // deX........  => /de[a-z]{1,7}/g
    // ..eX.m.....  => /e[a-z]{2}m[a-z]{0,3}/g
    // ...X.m..p..  => /e[a-z]m[a-z]{2}p[a-z]{0,2}/g

    // r = new RegExp("de[a-z]{1,7}", "g")
    // word.match(r); // returns null if nothing found
    var letrange = "["+rack+"]";
    if (g_opponent_has_joker)
        letrange = g_letrange;

    var numlets = rack.length;

    if (g_board[ax][ay] !== "")
        // There already a letter on the board here
        return null;

    var xdir = (dir == "x");

    var ap = xdir ? ax : ay;

    var max = xdir ? g_board.length : g_board[ax].length;

    var dx = xdir ? 1 : 0;
    var dy = 1 - dx;

    //--------------------------------------------------------------------
    // check that there is some letter on the board
    // that we can connect to
    var ok = false;

    var l_x = ax - dx; // board position to left of x
    var a_y = ay - dy; // board position above y

    if (ap>0 && g_board[l_x][a_y] !== "")
        // Either placement to left of x or
        // above y has a letter on board
        ok = true;

    // Start scanning for letters on board from parallel lines
    // staring at position ax+1,ay or ax,ay+1
    var sc = ap;  // sc: short for scan
    var scx = ax+dx;
    var scy = ay+dy;

    // by default, set the minimum location of the first
    // letter found in the parallel line search to be
    // higher than any possible minimum found when building
    // the regex, so that if no minimum is found in the
    // parallel scan, the minimum from the regex creation
    // will be used.
    var sminpos = max;
    var empty;

    if (!ok)
        empty = 0;
        // No board letters to the left or above anchor, check
        // if lines parallel to direction have letters in them.
        while (sc < max-1) {
            if ( g_board[scx][scy] !== "" ) {
                ok = true;
                break;
            }
            else
                empty++;

            if (empty > numlets)
                // we can't get further than this point
                // with the number of letters we have
                break;

            a_y = scy-dx;  // x line above y
            b_y = scy+dx;  // x line below y
            l_x = scx-dy;  // y line left of x
            r_x = scx+dy;  // y line right of x
            if ( l_x>=0 && a_y>=0 && g_board[l_x][a_y] !== "" ||
                 r_x<max && b_y<max && g_board[r_x][b_y] !== "" ) {
                // found a board letter to the left or
                // above the scanned line.
                sminpos = sc + 1;
                ok = true;
                break;
            }

            scx += dx;
            scy += dy;
            sc++;
        }

    if (!ok)
        // No letters that we can connect to from ax,ay
        return null;

    //----------------------------------------------------------------------
    // Find any letters immediately preceeding the first placement location

    var ps = ap - 1;
    var xs = ax - dx;
    var ys = ay - dy;
    while (ps>=0 && g_board[xs][ys]!=="") {
        xs -= dx;
        ys -= dy;
        ps--;
    }

    if (ps < 0) {
        ps = 0;
        if (xs < 0)
            xs = 0;
        else
        if (ys < 0)
            ys = 0;
    }

    var prev = "";
    for (var i=ps; i<ap; i++) {
        prev += g_board[xs][ys];
        xs += dx;
        ys += dy;
    }
    // prev now contains the sequence of letters that immediatly preceede
    // the anchor position (either above it or to it's left, depending on
    // the direction context).

    //--------------------------------------------------------------------
    // Generate the regular expression for the possible words
    // starting at ax,ay using direction dir. Also calculate minimum
    // word size, maximum word size and word starting position.

    var x = ax; // x anchor coordinate
    var y = ay; // y anchor coordinate
    var p = ap; // either ax or ay, depending on the context

    var mws = "_"; // "^"; // marker for word start
    var mwe = "_"; // "$"; // marker for word end
    var regex = mws+prev; // regexp match
    var regex2 = ""; // another possible match
    var letters = 0;
    var blanks  = 0;

    var minl    = 0; // minimum word length that can be created
    var minplay = 1; // no letters were played yet

    var countpost; // flag to include letters in line for minl count

    var prevlen = prev.length;

    var flpos = ap;
    var l;
    // iterate over word letters
    while ( p < max ) {
        // l is the letter at position x,y on the board
        l = g_board[x][y];
        if (l === "") {
            // There is no letter at board position x,y
            if (p==ap && prevlen>0) {
                minl = prevlen + 1;
                // start adding additional board
                // letters to minimum word length
                countpost = true;
            }
            else
                // stop adding additional board
                // letters to minimum word length
                countpost = false;

            blanks++;
            if (letters == numlets)
                break;
            letters++;
        }
        else {
            hadletters = true;
            if (blanks > 0) {
                regex += "(" + letrange;
                if (blanks > 1) {
                    // If there are letters before the anchor position
                    // and two or more free spaces, we can add another
                    // match for a shorter word without the connecting
                    // to additional letters in same line on board.
                    // For example, the following:
                    // ..ad..sing (two blanks after d)
                    // Should make it possible to find ..adD.sing
                    // and also ..adVIsing, so the search should match
                    // _ad([a-z]{1})_  or _ad([a-z]{2})sing_
                    if (prev !== "") {
                        regex2 = "|"+regex;
                        if (blanks > 2)
                            regex2 += "{1,"+(blanks-1)+"}";
                        regex2 += ")"+mwe;
                    }
                    regex += "{" + blanks + "}";
                }
                regex += ")"; // close group capture
                if (minl === 0) {
                    minl = prevlen + blanks;
                    // start adding additional board
                    // letters to minimum word length
                    countpost = true;
                }
                if (countpost && flpos==ap)
                    // save 1st letter position
                    flpos = p;
                blanks = 0;
            }
            regex += l;
            if (countpost)
                minl++;
            minplay = 0; // letters were played
        }
        x += dx;
        y += dy;
        p++;
    }

    if (blanks > 0) {
        // Last place was a blank
        regex += "(" + letrange;
        if (p == max)
            // and it was the end of the board
            regex += "{"+minplay+","+blanks+"}";
        else {
            // used all the letters before
            // reaching the end of the board
            // check the next board space
            if (g_board[x][y] === "")
                regex += "{"+minplay+","+blanks+"}";
            else {
                regex += "{"+blanks+"}";
                for (i=p+1; i<max; i++) {
                    l = g_board[x][y];
                    if (l === "") break;
                    regex += l;
                    x += dx;
                    y += dy;
                }
            }
        }
        regex += ")";  // close group capture
    }

    // flpos - position of first letter that was found
    //         when generating the regex
    // sminpos - first letter found in parallel line scan
    //logit( "flpos="+flpos+", sminpos="+sminpos );
    if (flpos == ap)
        // no first letter was found in the regex scan.

        // Are there any letters before the anchor ?
        if (prev !== "")
            //  yes - then the minimum is one more
            minl = prevlen + 1;
        else
            // No, then set the minimum word length to
            // be the distance to the first letter found
            // in the parallel line scan.
            minl = sminpos - ap + 1;
    else {
        var mindiff = flpos - sminpos;
        if ( mindiff > 1 )
            // If the regex scan first letter position is at a
            // distance of two or more further from the parallel
            // scan first letter position, then the minimum word
            // length is the distance from the anchor to the first
            // letter found in the parallel scan.
            minl -= mindiff;
    }

    var s = ap-prev.length;
    var maxl = p-s;

    // if there was another possible match then add it
    regex += mwe + regex2;

    // eg: {rgx: "^am[a-z]{2}t$", xs: 0, min: 3, max: 5, prf: "am"}
    // will be returned for |am*.t|
    // TODO: optimize by eliminating length 4 in this case
    var res  = { rgx:regex, ps:s, min:minl, max:maxl };
    res.prec = prev;
    res.xy   = dir;
    return res;
}

window["init"] = init;
