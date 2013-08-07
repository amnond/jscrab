function BonusesLayout()
{
    var self = this;
    self.boardm = [];
    self.init = function(bx, by)
    {
        self.bx = bx;
        self.by = by;

        var i,j;
        for (i=0; i<bx; i++) {
            self.boardm[i] = [];
            for (j=0; j<by; j++)
                self.boardm[i][j] = 0;
        }

        var midx = Math.floor(bx/2);
        var midy = Math.floor(by/2);
        for (i=0; i<midx; i++)
            for (j=0; j<midy; j++) {
                var dist = bx*by-i-j;
                if (dist%8===0)
                    self.setquad(i, j, 1); // DL
                else
                if (dist%11===0)
                    self.setquad(i, j, 2); // TL
                else
                if (dist%7===0)
                    self.setquad(i, j, 3); // DW
            }

        self.setquad( midx, 0, 3 );
        self.setquad( 0, midy, 3 );
        self.setquad( 4, 0, 4 );
        self.setquad( 0, 1, 4 );
        self.setquad( 4, 4, 0 );
        self.setquad( 1, 2, 0 );
        self.setquad( 2, 1, 0 );
        self.setquad( 1, 1, 3 );
        self.setquad( 4, 1, 0 );
        self.setquad( 6, 5, 2 );
        self.setquad( 8, 2, 0 );
        self.setquad( 2, 6, 0 );
        self.setquad( 4, 7, 3 );

        return self.boardm;
    };

    self.setquad = function(x, y, s)
    {
        var x1 = x;
        var y1 = y;
        var x2 = self.bx - x - 1;
        var y2 = self.by - y - 1;
        //logit([x1,y1,x2,y2]);
        self.boardm[x1][y1] = s;
        self.boardm[x1][y2] = s;
        self.boardm[x2][y1] = s;
        self.boardm[x2][y2] = s;
    };
}

var g_boardm = new BonusesLayout();
