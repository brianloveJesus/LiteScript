//The Lexer
//=========

//The Lexer translates code (an array of lines) into an array of tokenized lines to be parsed.

//The Lexer class acts as
//* Lexer/Tokenizer
//* Token Stream (input)

//All the parts of the lexer work with "arrays" of lines.
//(instead of a buffer or a large string)

//The first lexer pass analyzes entire lines.
//Each line of the array is classified with a 'Line Type':

   var LineTypes = {CODE: 0, COMMENT: 1, BLANK: 2};

//then each CODE line is *Tokenized*, getting a `tokens[]` array

//-------------------------
//### Utility

//Helper methods
//String shims (startsWith, endsWith)

   var util = require('./util');

//Token Recognition Regex Patterns
//--------------------------------

//Comments can be on a code line, starting with a `#` or `//`, and ending at the end of a line.
//Example: `x = 1 //comment`

//Comments can also be multiline, starting with starting with ` // ` and ending with ``

   var tokenPatterns = [['COMMENT', /^#(.*)$|^\/\/(.*)$/], ['NUMBER', /^0x[a-f0-9]+/i], ['NUMBER', /^[0-9]+(\.[0-9]+)?(e[+-]?[0-9]+)?/i], ['REGEX', /^(\/(?![\s=])[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/)([imgy]{0,4})(?!\w)/], ['STRING', /^'(?:[^'\\]|\\.)*'/], ['STRING', /^"(?:[^"\\]|\\.)*"/], ['WHITESPACE', /^[\f\r\t\v\u00A0\u2028\u2029 ]+/], ['ASSIGN', /^=/], ['ASSIGN', /^[\+\-\*\/]=/], ['LITERAL', /^(\+\+|--)/], ['LITERAL', /^[\(\)\[\]\;\,\.\{\}]/], ['OPER', /^(no|is|isnt|not|and|but|or|in|instance|instanceof|has)\b/], ['OPER', /^(\*|\/|\%|\+|-|<>|>=|<=|>>|<<|>|<|!==|\~|\&|\||\^)/], ['OPER', /^[\?\:]/], ['IDENTIFIER', /^[$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*/]];


//----------------------

//The Token Class
//===============

//Each Token has:
//* a type ('IDENTIFIER', 'STRING', 'OPER', 'NUMBER', etc),
//* a `value` (parsed text)
//* and the column in the source line in which the token appears

   //class Token, constructor:
   function Token(type, tokenText, column){

           this.type = type;
           this.value = tokenText || ' ';//# no text is represened by ' ', since '' is 'falsey'
           this.column = column;
       };
   
   // declared properties & methods
        //properties
          //type:string
          //value:string
          //column

       //method toString()
       Token.prototype.toString = function(){
           //return "'#{me.value}'(#{me.type})"
           return "'" + (this.value) + "'(" + (this.type) + ")";
       };
   
   //end class Token

//InfoLine Class
//--------------

//The lexer turns each input line into a **infoLine**
//A **infoLine** is a clean, tipified, indent computed, trimmed line
//it has a source line number reference, and a tokens[] array if it's a CODE line

//Each "infoLine" has:
//* a line "type" of: `BLANK`, `COMMENT` or `CODE` (LineTypes),
//* a tokens[] array if it's `CODE`
//* sourceLineNum: the original source line number (for SourceMap)
//* indent: the line indent
//* text: the line text (clean, trimmed)

   //class InfoLine, constructor:
   function InfoLine(lexer, type, indent, text, sourceLineNum){
       this.type = type;
       this.indent = indent;
       this.text = text;
       this.sourceLineNum = sourceLineNum;
     };
   
   // declared properties & methods

      //properties
          //type
          //indent,sourceLineNum
          //text:String
          //tokens: Token array

        //#me.dump() #debug info

      //#end InfoLine constructor


     //method dump() # out debug info
     InfoLine.prototype.dump = function(){//# out debug info

       //if me.type is LineTypes.BLANK
       if (this.type === LineTypes.BLANK) {
         //debug me.sourceLineNum,"(BLANK)"
         debug(this.sourceLineNum, "(BLANK)");
         //return
         return;
       };

       var type = "";
       //if me.type is LineTypes.COMMENT
       if (this.type === LineTypes.COMMENT) {
         type = "COMMENT";
       }
       else if (this.type === LineTypes.CODE) {
         type = "CODE";
       };

       //debug me.sourceLineNum, "#{me.indent}(#{type})", me.text
       debug(this.sourceLineNum, "" + (this.indent) + "(" + (type) + ")", this.text);
       //if me.tokens
       if (this.tokens) {
           //debug('   ',me.tokens.join(' '))
           debug('   ', this.tokens.join(' '));
           //debug()
           debug();
       };
     };


//The Tokenize method
//-------------------

//The Infoline.tokenize() method, creates the 'tokens' array by parsing the .text
//It also replaces *Embdeded Expressions* #{} in string constants, storing the expression tokens

     //method tokenize(lexer)
     InfoLine.prototype.tokenize = function(lexer){

        //declare on lexer
            //initSource
            //filename
            //stringInterpolationChar:string
            //throwErr
            //nextSourceLine


       var code = this.text;

       //try
       try{

           var words = [];
           var result = [];
           var colInx = 0;

            //#debug
           var msg = "";

           //while colInx < code.length
           while(colInx < code.length){
           

             var chunk = code.slice(colInx);

//This for loop will try each regular expression in `tokenPatterns`
//against the current head of the code line until one matches.

             var match = '';
             var tokenType = '';
             //for typeRegExpPair in tokenPatterns
             for ( var typeRegExpPair__inx=0; typeRegExpPair__inx<tokenPatterns.length; typeRegExpPair__inx++) {
               var typeRegExpPair=tokenPatterns[typeRegExpPair__inx];
               var regex = typeRegExpPair[1];
               var matches = regex.exec(chunk);
               //if matches and matches[0]
               if (matches && matches[0]) {
                   match = matches[0];
                   tokenType = typeRegExpPair[0];
                   //break
                   break;
               };
             }; // end for each in tokenPatterns

              //#end for checking patterns

//If there was no match, this is a bad token and we will abort compilation here.

             //if no match
             if (!match) {

               msg = "(" + (lexer.filename) + ":" + (this.sourceLineNum) + ":" + (colInx + 1) + ") Tokenize patterns: invalid token: " + (chunk);
               //log.error msg
               log.error(msg);
               //log.error code
               log.error(code);


               var errPosString = '';
               //while errPosString.length<colInx
               while(errPosString.length < colInx){
               
                   errPosString += ' ';
               
               };//end loop
               ;

               //log.error errPosString+'^'
               log.error(errPosString + '^');

               var err = new Error(msg);
               err.controled = true;
               //raise err
               throw err;
             };

              //#end if

//If its 'WHITESPACE' we ignore it.

             //if tokenType is 'WHITESPACE'
             if (tokenType === 'WHITESPACE') {
                 //do nothing #ignore it
                 null;//#ignore it
             }
             else {

//create token

                 var token = new Token(tokenType, match, this.indent + colInx + 1);

                 //words.push(match)
                 words.push(match);

//If its a string constant, and it has (not escaped) `#|$`, process the **Interpolated Expressions**.

                 //if tokenType is 'STRING' and match.length>3 and match.search(RegExp("[^\\\\]\\"+lexer.stringInterpolationChar))>=0
                 if (tokenType === 'STRING' && match.length > 3 && match.search(RegExp("[^\\\\]\\" + lexer.stringInterpolationChar)) >= 0) {

                    //declare parsed:Array

                    //#parse the string, splitting at $ and ${...}, return array
                   var parsed = String.splitExpressions(match, lexer.stringInterpolationChar);

                    //#if the first expression starts with "(", we add `"" + ` so the parentheses
                    //# can't be mis-parsed as a "function call"
                   //if parsed.length and parsed[0].startsWith("(")
                   if (parsed.length && parsed[0].startsWith("(")) {
                     //parsed.unshift('""')
                     parsed.unshift('""');
                   };

                    //#join expressions using +, so we have a valid composed expression, evaluating to a string.
                   var composed = new InfoLine(lexer, LineTypes.CODE, token.column, parsed.join(' + '), this.sourceLineNum);

                    //#Now we 'tokenize' the new composed expression
                   //composed.tokenize(lexer)
                   composed.tokenize(lexer);

                    //#And we append the new tokens instead of the original string constant
                   result = result.concat(composed.tokens);
                 }
                 else {

//Else it's a single token. Add the token to result array

                    //#debug
                   msg += token.toString();

                   //result.push(token)
                   result.push(token);
                 
                 };
             
             };

                  //#end if

              //#end if WITHESPACE

//Advance col index into code line

             colInx += match.length;
           
           };//end loop
           ;

            //#end while text in the line

            //#debug
            //#debug msg

//Store tokenize result in tokens

           this.tokens = result;

//Special lexer options: string interpolation char
//`lexer options string interpolation char [is] (IDENTIFIER|LITERAL|STRING)`

           //if words[0] is 'lexer'
           if (words[0] === 'lexer') {
             //if words.slice(0,5).join(" ") is "lexer options string interpolation char"
             if (words.slice(0, 5).join(" ") === "lexer options string interpolation char") {
               this.type = LineTypes.COMMENT;//# not a CODE line
               lexer.stringInterpolationChar = words[5];//#get it
               //if lexer.stringInterpolationChar is 'is' #optional 'is'
               if (lexer.stringInterpolationChar === 'is') {//#optional 'is'
                 lexer.stringInterpolationChar = words[6];
               };
               //if lexer.stringInterpolationChar[0] in ['"',"'"] #optionally quoted
               if (['"', "'"].indexOf(lexer.stringInterpolationChar[0])>=0) {//#optionally quoted
                 lexer.stringInterpolationChar = lexer.stringInterpolationChar.slice(1, -1);
               };
               //if not lexer.stringInterpolationChar #check
               if (!(lexer.stringInterpolationChar)) {//#check
                 //lexer.throwErr "missing string interpolation char"
                 lexer.throwErr("missing string interpolation char");
               };
             };
           };
       
       }catch(e){
           //log.error "#{lexer.filename}:#{me.sourceLineNum}:#{colInx+1}",e.message
           log.error("" + (lexer.filename) + ":" + (this.sourceLineNum) + ":" + (colInx + 1), e.message);
           //log.error msg
           log.error(msg);
           //throw e
           throw e;
       };
     };
   
   //end class InfoLine


//--------------------------

   //class LexerPos, constructor:
   function LexerPos(){};
   
   // declared properties & methods

      //properties
          //lineInx,sourceLineNum
          //index,token,last

     //method dummy()
     LexerPos.prototype.dummy = function(){
       //null
       null;
     };
   
   //end class LexerPos


//----------------------------------------------------------------------------------------------

//The Lexer Class
//===============

//The Lexer class turns the input lines into an array of "infoLines"


   //class Lexer, constructor:
   function Lexer(){

//Err counter, and important inner-error

         this.errCount = 0;//#incremented each time the compiler emits a "ERROR" (not WARN - see sayErr)

         this.hardError = null;//# stores most significative (deepest) error, when parsing fails

//we start with an empty Token

         this.token = new Token();
    };
   
   // declared properties & methods
     //     properties
        //filename:string
        //lines:string array
        //infoLines: InfoLine array
        //sourceLineNum
        //lineInx
        //line:String
        //infoLine, token, last:LexerPos
        //indent, index

        //stringInterpolationChar = "#" // can be changed later with `compiler` directive
        //errCount, hardError
        //inNode
       Lexer.prototype.stringInterpolationChar="#";

      //#end constructor


    //     method initSource(filename, source:String)
    Lexer.prototype.initSource = function(filename, source){
//Load filename and source code in the lexer.
//First, remember filename (for error reporting)

         this.filename = filename;

//create source lines array

         //if source instanceof Array
         if (source instanceof Array) {
           this.lines = source;
         }
         else {

//If code is passed as a buffer, convert it to string
//then to lines array

           //if typeof source isnt 'string'
           if (typeof source !== 'string') {
             source = source.toString();
           };

           this.lines = source.split('\n');
         
         };
    };



    //     method process()
    Lexer.prototype.process = function(){
//*Create infoLines[] array
//*Tokenize CODE lines

//prepare processed lines result array

       this.infoLines = [];

//Regexp to match class/method markdown titles, they're considered CODE

       var titleKeyRegexp = /^(#)+ *(?:(?:public|helper|namespace)\s*)*(class|append to|function|method|constructor|properties)\b/i;

//Loop processing source code lines

       var lastLineWasBlank = true, inCodeBlock = false;

       this.sourceLineNum = 0;
       //while me.nextSourceLine()
       while(this.nextSourceLine()){
       

//get line indent, count whitespace: (index of first non-whitespace: \S )
//then trim() the line

           var line = this.line;
           var indent = line.search(/\S/);
           line = line.trim();

//LiteScript files (.lite.md) are "literate" markdown and code files.

//To be considered "code", a block of lines must be indented at least four spaces.
//(see: Github Flavored MarkDown syntax)

//The exception are: MARKDOWN TITLES (###) introducing classes, methods and functions.

//Exceptions:

//* MarkDown level 3 title plus a space '### ' is considered CODE indented 4 spaces if:
  //* the line starts with: `[public|helper|namespace] [class|function|append to]`

//* MarkDown level 4 title plus one space '#### ' is considered CODE indented 5 spaces if:
  //* the line starts with: `[constructor|method|properties`]

//Anything else starting on col 1, 2 or 3 is a literate comment, MD syntax.

//Now, process the lines with this rules

           var type = undefined;

//a blank line is always a blank line

           //if no line
           if (!line) {
               type = LineTypes.BLANK;
           }
           else {
               //if indent >= 4
               if (indent >= 4) {
                   //if lastLineWasBlank,inCodeBlock = true
                   if (lastLineWasBlank) {
                       inCodeBlock = true};
               }
               else {
                   inCodeBlock = false;

                   //if indent is 0 # ...starts on column 1
                   if (indent === 0) {//# ...starts on column 1

//check for title-keywords: e.g.: `### Class MyClass`, `### Public Function compile(sourceLines:string array)`

                     var foundTitleKey = titleKeyRegexp.exec(line);

//if found, rewrite the line, replacing MarkDown title MD hashs (###) by spaces
//and making keywords lowercase

                     //if foundTitleKey
                     if (foundTitleKey) {
                         line = foundTitleKey[0].replace(/#/g, " ").toLowerCase() + line.slice(foundTitleKey[0].length);

//re-check indent, inform now if indent is less than 4

                         indent = line.search(/\S/);
                         //if indent<4, me.throwErr "MarkDown Title-keyword, expected at least indent 4 ('\#\#\# ')"
                         if (indent < 4) {
                             this.throwErr("MarkDown Title-keyword, expected at least indent 4 ('\#\#\# ')")};
                         inCodeBlock = true;
                     };
                   };
               
               };

                    //#end if - special kws

                //#end if - line, check indent

//After applying rules: if we're in a Code Block, is CODE, else is a COMMENT

               //if inCodeBlock
               if (inCodeBlock) {

                   //if line.startsWith("#") or line.startsWith("//") # CODE by indent, but all commented
                   if (line.startsWith("#") || line.startsWith("//")) {//# CODE by indent, but all commented
                     type = LineTypes.COMMENT;
                   }
                   else {
                     type = LineTypes.CODE;
                   
                   };
               }
               else {
                   type = LineTypes.COMMENT;
               
               };
           
           };
                //#end if

            //#end if line wasnt blank

//parse multi-line string (triple quotes) and convert to one logical line:
//Example: var a = 'first line\nsecond line\nThat\'s all\n'

           //if type is LineTypes.CODE
           if (type === LineTypes.CODE) {
             line = this.parseTripleQuotes(line);
           };

//check for multi-line comment, C and js style // .... 

           //if me.checkMultilineComment(type, indent, line )
           if (this.checkMultilineComment(type, indent, line)) {
               //continue #found and pushed multiline comment, continue with next line
               continue;//#found and pushed multiline comment, continue with next line
           };

//Create infoLine, with computed indent, text, and source code line num reference

           var infoLine = new InfoLine(this, type, indent, line, this.sourceLineNum);
           //infoLine.dump() # debug
           infoLine.dump();//# debug

           //me.infoLines.push( infoLine )
           this.infoLines.push(infoLine);

           lastLineWasBlank = type === LineTypes.BLANK;
       
       };//end loop
       ;



        //#end loop, process next source line


//Now, after processing all lines, we tokenize each CODE line

       //debug "---- TOKENIZE"
       debug("---- TOKENIZE");

       //for item in me.infoLines
       for ( var item__inx=0; item__inx<this.infoLines.length; item__inx++) {
           var item=this.infoLines[item__inx];

           //item.dump() # debug
           item.dump();//# debug

           //if item.type is LineTypes.CODE
           if (item.type === LineTypes.CODE) {
               //item.tokenize(me)
               item.tokenize(this);
           };
       }; // end for each in this.infoLines
            //#end if

        //#end loop code lines

//now we have a infoLine array, tokenized, ready to be parsed
//clear source lines from memory

       this.lines = undefined;

//reset Lexer position, to allow the parser to start reading tokens

       this.lineInx = -1;//#line index
       this.infoLine = null;//#current infoLine
       this.index = -1;//#token index

       this.last = this.getPos();//#last position

//read first token

       //me.nextToken()
       this.nextToken();
    };

    //#end Lexer process


//Next Source Line
//----------------

    //     method nextSourceLine()
    Lexer.prototype.nextSourceLine = function(){

       //if me.sourceLineNum >= me.lines.length
       if (this.sourceLineNum >= this.lines.length) {
         //return false
         return false;
       };

//get source line, replace TAB with 4 spaces, remove trailing withespace and remove CR

       this.line = this.lines[this.sourceLineNum].replace(/\t/g, '    ').replace(/\s+$/, '').replace(/\r/, '');
       this.sourceLineNum += 1;//# 1-based

       //return true
       return true;
    };


//Multiline strings
//-----------------

//----------------------------
//This is the generic method to get a section of text between start and end codes

    //     method getMultilineSection(line:string, startCode:string, endCode:string)
    Lexer.prototype.getMultilineSection = function(line, startCode, endCode){

//check startCode for multiline, if not found, exit

       var startCol = line.indexOf(startCode);
       //if startCol<0
       if (startCol < 0) {
            //#no start code found
           //return null
           return null;
       };

//get rid of quoted strings. Still there?

       //if String.replaceQuoted(line,"").indexOf(startCode)<0
       if (String.replaceQuoted(line, "").indexOf(startCode) < 0) {
           //return null #no
           return null;//#no
       };

//found startCode, initialize

       //debug "**** START MULTILINE ",startCode
       debug("**** START MULTILINE ", startCode);

       var section = [];
       var startSourceLine = this.sourceLineNum;

//Get and save text previous to startCode

       var pre = line.slice(0, startCol).trim();

//Get text after startCode

       line = line.slice(startCol + startCode.length).trim();

//read lines looking for endCode

       //while true
       while(true){
       

           var endCol = line.indexOf(endCode);
           //if endCol>=0 #found end of section
           if (endCol >= 0) {//#found end of section
               //break
               break;
           };

            //# still inside the section
           //section.push line
           section.push(line);

           //if no me.nextSourceLine()
           if (!this.nextSourceLine()) {
               //me.sayErr "EOF while processing multiline #{startCode} (started on #{me.filename}:#{startSourceLine}:#{startCol})"
               this.sayErr("EOF while processing multiline " + (startCode) + " (started on " + (this.filename) + ":" + (startSourceLine) + ":" + (startCol) + ")");
               //return
               return;
           };

           line = this.line;
       
       };//end loop
       ;

        //#loop until end of section

//get text after endCode (post)

       var post = line.slice(endCol + endCode.length);

//text before endCode, goes into multiline section

       line = line.slice(0, endCol);
       //if line
       if (line) {
         //section.push line
         section.push(line);
       };

       //return {pre:pre, section:section, post:post, postIndent:endCol+endCode.length}
       return {pre: pre, section: section, post: post, postIndent: endCol + endCode.length};
    };

//----------------------------------------

//This method handles `"""` triple quotes multiline strings
//Mulitple coded-enclosed source lines are converted to one logical infoLine

//Example:

// var c = """
//   first line
//   second line
//   That's all
//   """.length

//gets converted to:
//<pre>
//  var c = 'first line\nsecond line\nThat\'s all\n'.length
//  ^^^^^^^   ^^^^^^^                               ^^^^^
//    pre     section                                post
//</pre>


    //     method parseTripleQuotes(line:string)
    Lexer.prototype.parseTripleQuotes = function(line){

       var result = this.getMultilineSection(line, '"""', '"""');

        //declare on result
          //pre:string, section:string array, post:string

       //if result
       if (result) {
          //#discard first and last, if empty
         //if not (result.section[0].trim())
         if (!((result.section[0].trim()))) {
           //result.section.shift()
           result.section.shift();
         };
         //if not (result.section[result.section.length-1].trim())
         if (!((result.section[result.section.length - 1].trim()))) {
           //result.section.pop()
           result.section.pop();
         };
          //#trim lines
         //for inx,sectionLine in result.section
         for ( var inx=0; inx<result.section.length; inx++) {
           var sectionLine=result.section[inx];
           result.section[inx] = sectionLine.trim();
         }; // end for each in result.section

         line = result.section.join("\\n");//#join with (encoded) newline char
         line = line.replace(/'/g, "\\'");//#escape quotes
         line = result.pre + " " + line.quoted("'") + result.post;//#add pre & post
       };

       //return line
       return line;
    };

      //#end parse triple quotes

//----------------------------
//This method handles multiline comments: ` // ` ``

    //     method checkMultilineComment(lineType, startLineIndent, line)
    Lexer.prototype.checkMultilineComment = function(lineType, startLineIndent, line){

       var startSourceLine = this.sourceLineNum;

       var result = this.getMultilineSection(line, '/*', '*/');

        //declare on result
          //pre:string, section:string array, post:string
          //postIndent

       //if no result
       if (!result) {
         //return false
         return false;
       };

       //if result.section.length is 1 # just one line
       if (result.section.length === 1) {//# just one line
         line = result.pre + " // " + result.section[0] + result.post;
         //me.infoLines.push(new InfoLine(me, lineType, startLineIndent, line, startSourceLine))
         this.infoLines.push(new InfoLine(this, lineType, startLineIndent, line, startSourceLine));
       }
       else {
         //if result.pre
         if (result.pre) {
           //me.infoLines.push(new InfoLine(me, lineType, startLineIndent, result.pre, startSourceLine))
           this.infoLines.push(new InfoLine(this, lineType, startLineIndent, result.pre, startSourceLine));
         };

         //for sectionLine at inx in result.section
         for ( var inx=0; inx<result.section.length; inx++) {
           var sectionLine=result.section[inx];
           //me.infoLines.push(new InfoLine(me, LineTypes.COMMENT, 0, sectionLine, startSourceLine+inx))
           this.infoLines.push(new InfoLine(this, LineTypes.COMMENT, 0, sectionLine, startSourceLine + inx));
         }; // end for each in result.section

         //if result.post.trim()
         if (result.post.trim()) {
           //log.warning "#{me.filename}:#{me.sourceLineNum}:1. Do not add text on the same line after `*/`. Indent is not clear"
           log.warning("" + (this.filename) + ":" + (this.sourceLineNum) + ":1. Do not add text on the same line after `*/`. Indent is not clear");
           //me.infoLines.push(new InfoLine(me, LineTypes.CODE, result.postIndent, result.post, me.sourceLineNum))
           this.infoLines.push(new InfoLine(this, LineTypes.CODE, result.postIndent, result.post, this.sourceLineNum));
         };
       
       };

       //return true #OK, lines processed
       return true;//#OK, lines processed
    };



//----------------------------
//Methods getPos() and setPos() are used to save and restore a specific lexer position in code
//When a AST node parse() fails, the lexer position is rewound to try another AST class

    //     method getPos()
    Lexer.prototype.getPos = function(){
       //return {lineInx:me.lineInx, index:me.index, sourceLineNum:me.sourceLineNum, token:me.token, last:me.last}
       return {lineInx: this.lineInx, index: this.index, sourceLineNum: this.sourceLineNum, token: this.token, last: this.last};
    };

//----------------------------

    //     method setPos(pos:LexerPos)
    Lexer.prototype.setPos = function(pos){

       this.lineInx = pos.lineInx;

       //if me.lineInx>=0 and me.lineInx<me.infoLines.length
       if (this.lineInx >= 0 && this.lineInx < this.infoLines.length) {
           this.infoLine = this.infoLines[this.lineInx];
           this.indent = this.infoLine.indent;
       }
       else {
           this.infoLine = null;
           this.indent = 0;
       
       };

       this.index = pos.index;
       this.sourceLineNum = pos.sourceLineNum;
       this.token = pos.token;
       this.last = pos.last;
    };


    //     helper method posToString()
    Lexer.prototype.posToString = function(){
//Create a full string with last position. Useful to inform errors

       //if no me.last
       if (!this.last) {
           //return
           return;
       };

       //if no me.last.token
       if (!this.last.token) {
           this.last.token = {column: 0};
       };

       var col = (this.last.token.column || this.infoLine.indent || 0);

       //return "#{me.filename}:#{me.last.sourceLineNum}:#{col+1}"
       return "" + (this.filename) + ":" + (this.last.sourceLineNum) + ":" + (col + 1);
    };

//----------------------------
//getPrevIndent() method returns the indent of the previous code line
//is used in 'Parser.lite' when processing an indented block of code,
//to validate the line indents and give meaningful compiler error messages

    //     method getPrevIndent()
    Lexer.prototype.getPrevIndent = function(){
       var inx = this.lineInx - 1;
       //while inx >=0
       while(inx >= 0){
       
           //if me.infoLines[inx].type is LineTypes.CODE
           if (this.infoLines[inx].type === LineTypes.CODE) {
               //return me.infoLines[inx].indent
               return this.infoLines[inx].indent;
           };
           inx -= 1;
       
       };//end loop
       ;

       //return 0
       return 0;
    };

//----------------------------------------------------
//This functions allows the parser to navigate lines and tokens
//of the lexer. It returns the next token, advancing the position variables.
//This method returns CODE tokens, "NEWLINE" tokens (on each new line) or the "EOF" token.
//All other tokens (COMMENT and WHITESPACE) are discarded.


    //     method consumeToken()
    Lexer.prototype.consumeToken = function(){

//loop until a CODE token is found

       //while true
       while(true){
       

//loop until a valid CODE infoLine is selected

           this.token = null;
           //while true
           while(true){
           

//if no line selected

               //if not me.infoLine
               if (!(this.infoLine)) {

                   this.index = -1;

//get next CODE line

                   //if not me.nextCODELine()
                   if (!(this.nextCODELine())) {

//if no more CODE lines -> EOF

                       this.infoLine = new InfoLine(this, LineTypes.CODE, -1, '', this.lineInx);
                       this.token = new Token('EOF');
                       this.infoLine.tokens = [this.token];
                       this.indent = -1;
                       //return
                       return;
                   };

//since we moved to the next line, return "NEWLINE" token

                   this.sourceLineNum = this.infoLine.sourceLineNum;
                   this.indent = this.infoLine.indent;
                   this.token = new Token('NEWLINE');
                   //return
                   return;
               };

//get next token in the line

               //if no me.infoLine.tokens
               if (!this.infoLine.tokens) {
                 //debugger
                 debugger;
               };


               this.index += 1;
               //if me.index < me.infoLine.tokens.length
               if (this.index < this.infoLine.tokens.length) {
                   //break #ok, a line with tokens
                   break;//#ok, a line with tokens
               };

//if there was no more tokens, set infoLine to null,
//and continue (get the next line)

               this.infoLine = null;
           
           };//end loop
           ;

            //#end while

//Here we have a infoLine, where type is CODE
//Get the token

           this.token = this.infoLine.tokens[this.index];

//if the token is a COMMENT, discard it,
//by continuing the loop (get the next token)

           //if me.token.type is 'COMMENT'
           if (this.token.type === 'COMMENT') {
               //continue #discard COMMENT
               continue;//#discard COMMENT
           }
           else {
               //break #the loop, CODE token is in lexer.token
               break;//#the loop, CODE token is in lexer.token
           
           };
       
       };//end loop
       ;
    };

        //#loop #try to get another

      //#end method consumeToken

//---------------------------------------------------------

    //     method nextToken()
    Lexer.prototype.nextToken = function(){

//Save current pos, and get next token

       this.last = this.getPos();

       //me.consumeToken()
       this.consumeToken();

        //#debug
       //debug ">>>ADVANCE", "#{me.sourceLineNum}:#{me.token.column or 0} [#{me.index}]", me.token.toString()
       debug(">>>ADVANCE", "" + (this.sourceLineNum) + ":" + (this.token.column || 0) + " [" + (this.index) + "]", this.token.toString());

       //return true
       return true;
    };


//-----------------------------------------------------

    //     method returnToken()
    Lexer.prototype.returnToken = function(){
        //#restore last saved pos (rewind)

       //me.setPos me.last
       this.setPos(this.last);
       //debug '<< Returned:',me.token.toString(),'line',me.sourceLineNum
       debug('<< Returned:', this.token.toString(), 'line', this.sourceLineNum);
    };

//-----------------------------------------------------
//This method gets the next line CODE from infoLines
//BLANK and COMMENT lines are skipped.
//return true if a CODE Line is found, false otherwise

    //     method nextCODELine()
    Lexer.prototype.nextCODELine = function(){

       //if me.lineInx >= me.infoLines.length
       if (this.lineInx >= this.infoLines.length) {
           //return false # no more lines
           return false;//# no more lines
       };

//loop until a CODE line is found

       //while true
       while(true){
       

           this.lineInx += 1;
           //if me.lineInx >= me.infoLines.length
           if (this.lineInx >= this.infoLines.length) {
               //return false # no more lines
               return false;//# no more lines
           };
//Get line

           this.infoLine = this.infoLines[this.lineInx];

//if it is a CODE line, store in lexer.sourceLineNum, and return true (ok)

           //if me.infoLine.type is LineTypes.CODE
           if (this.infoLine.type === LineTypes.CODE) {

               this.sourceLineNum = this.infoLine.sourceLineNum;
               this.indent = this.infoLine.indent;
               this.index = -1;

               //return true #ok nextCODEline found
               return true;//#ok nextCODEline found
           };
       
       };//end loop
       ;
    };

        //#end while

      //#end method


//-----------------------------------------------------------------------
//**say** emit error (but continue compiling)

    //     method say()
    Lexer.prototype.say = function(){

       this.errCount += 1;
       //log.error.apply(this,arguments)
       log.error.apply(this, arguments);
    };

      //#end


//-----------------------------------------------------------------------
//**throwErr** add lexer position and emit error (abort compilation)

    //     method throwErr(msg)
    Lexer.prototype.throwErr = function(msg){

       var err = new Error("" + (this.posToString()) + " " + msg);
       err.controled = true;
       //throw err
       throw err;
    };

      //#end

//-----------------------------------------------------------------------
//**sayErr** add lexer position and emit error (but continue compiling)

    //     method sayErr(msg)
    Lexer.prototype.sayErr = function(msg){

       this.errCount += 1;
       //log.error(me.posToString(), msg)
       log.error(this.posToString(), msg);
    };

      //#end

//**warn** add lexer position and emit warning (continue compiling)

    //     method warn(msg)
    Lexer.prototype.warn = function(msg){

       //log.warning(me.posToString(), msg)
       log.warning(this.posToString(), msg);
    };
   
   //end class Lexer

      //#end


//------------------------
//Exports
//=======


    //#make LineTypes const available as me.lexer.LineTypes
   Lexer.prototype.LineTypes = LineTypes;

   module.exports = Lexer;