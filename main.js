/*
* Copyright (c) 2012 Travis Almand. All rights reserved.
*
* Permission is hereby granted, free of charge, to any person obtaining a
* copy of this software and associated documentation files (the "Software"),
* to deal in the Software without restriction, including without limitation
* the rights to use, copy, modify, merge, publish, distribute, sublicense,
* and/or sell copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*/

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, document, body, Image, getImage, showSize, insertSize */

define(function (require, exports, module) {
    
    'use strict';
    
    var ProjectManager = brackets.getModule("project/ProjectManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        HTMLUtils = brackets.getModule("language/HTMLUtils"),
        KeyEvent = brackets.getModule("utils/KeyEvent");
    
    $(document).on("keypress", function (e) {
        
        var Editor = EditorManager.getCurrentFullEditor();
        var Document = DocumentManager.getCurrentDocument();
        var cursor = Editor.getCursorPos();
        var cursorPos = Editor._codeMirror.cursorCoords();
        var tagInfo = HTMLUtils.getTagInfo(Editor, cursor);
        var tagInfoName = tagInfo.tagName;
        var tagInfoAttr = tagInfo.attr.name;
        var imgSrc, image, typeQuote, finalPos;
        
        // first we check to make sure we're working on an html file
        if (Editor.getModeForSelection() === "html") {
            
            // check for " or '
            // make sure that current tag attribute has no value
            // we do this to prevent our box from showing when it's likely not needed
            if ((e.charCode === 34 || e.charCode === 39) && tagInfo.attr.value === "") {
                
                // we check to make sure the tag attribute is of the width or height variety
                // double check we're talking about an img element as well
                if ((tagInfoAttr === "width" || tagInfoAttr === "height") && tagInfoName === "img") {
                    
                    // set current position to return to later
                    finalPos = cursor.ch;
                    
                    // capture the type of quote, " or ', to be able to insert closing one later
                    typeQuote = String.fromCharCode(e.charCode);
                    
                    // capture the current line
                    var line = Document.getLine(cursor.line);
                    
                    // some basic info for our while loops
                    var token, tokenPos = cursor, lineLength = line.length;
                    
                    // this while loop walks backwards through the line looking for start of img
                    // we do this to walk forward through attributes looking for src
                    // this way the width or height attributes can be before or after src
                    while (tokenPos.ch > 0) {
                        
                        // capture current token each time
                        token = Editor._codeMirror.getTokenAt(tokenPos);
                        
                        // check if it's img
                        if (token.string === "img") {
                            // if it is stop our loop
                            break;
                        }
                        
                        // go to start of current token and then one more step back
                        // this way we can see the previous token in line as loop restarts
                        tokenPos.ch = token.start - 1;
                    }
                    // this loop moves forward from wherever img happens to be
                    while (tokenPos.ch < lineLength) {
                        
                        // capture current token each time
                        token = Editor._codeMirror.getTokenAt(tokenPos);
                        
                        // check if it's src
                        if (token.string === "src") {
                            
                            // move cursor so that's in the next token
                            // we assume there's an = so we skip that with +2
                            tokenPos.ch = token.end + 2;
                            
                            // capture that token which should be our path
                            token = Editor._codeMirror.getTokenAt(tokenPos);
                            
                            // send path on its way, removing extra " or '
                            getImage(token.string.replace(/"/g, "").replace(/'/g, ""));
                            
                            // stop our loop
                            break;
                            
                        }
                        
                        // go to end of current token and then one more step forward
                        // puts us at the next token in line
                        tokenPos.ch = token.end + 1;
                        
                    }
                }
            }
        }
        
        function getImage(imgSrc) {
            
            var path = "";
            
            // we look for an absolute src path
            // if there's no http then we assume the image is local to the project folder
            // if things don't work this is a likely culprit as I haven't tested for
            // various ways img src can be filled
            if (!imgSrc.match(/(http|https):/)) {
                path = ProjectManager.getProjectRoot().fullPath;
            }
            
            // load the image so we can grab the different sizes
            var imgSize;
            image = new Image();
            image.src = path + imgSrc;
            
            // if there's any delay in this loading of the image
            // then there will be a delay of the appearance of the suggestion box
            // nothing to be done about it I suppose
            image.onload = function () {
                
                // determine width or height and send info on its way
                if (tagInfoAttr === "width") {
                    imgSize = image.width.toString();
                    showSize(imgSize);
                } else if (tagInfoAttr === "height") {
                    imgSize = image.height.toString();
                    showSize(imgSize);
                }
            };
        }
        
        function showSize(size) {
            
            // capture document width so we can shift box to the left
            // if on right edge of document window
            // you know, so you can see it and stuff
            var docWidth = $(document).width();
            var cursorPosX = cursorPos.x;
            if (cursorPos.x > docWidth - 100) {
                cursorPosX -= 100;
            }
            
            // css for the suggestion box
            // I made it look different than the code hints
            // reason being the behavior is slightly different
            // for example, I use space bar instead of ENTER to insert (I mention why below, you are reading these right?)
            // if I get ENTER to work as I want then I may switch the color scheme
            var css = {
                left: cursorPosX,
                top: cursorPos.y + 20,
                position: "absolute",
                padding: "4px",
                background: "#363a3b",
                width: "100px",
                color: "white",
                cursor: "pointer"
            };
            
            // build our box and insert it so it can be seen
            var sizeBox = $('<div id="ta-imageSize">' + size + '</div>');
            $("body").append(sizeBox);
            
            // handle clicking on the box to insert the value
            // removes box, returns focus to editor (it's lost for some reason), insert value
            $("#ta-imageSize").css(css).on("click", function (e) {
                $(this).remove();
                Editor.focus();
                Document.replaceRange(size + typeQuote, {line: cursor.line, ch: finalPos + 1});
            });
            
            // handle using space bar to insert value
            // I really wanted ENTER for this but I'm unable to prevent the new line from being created
            // if I figure it out I may change it but the space bar has grown on me
            $(document).on("keydown", insertSize);
            function insertSize(e) {
                
                // look for space bar and that our suggestion box exists
                if (e.keyCode === 32 && $("#ta-imageSize").length > 0) {
                    
                    // prevent the space from being inserted
                    // could leave it in and the space is inserted after closing quote
                    // I liked it better this way
                    e.preventDefault();
                    
                    // remove the suggestion box
                    $("#ta-imageSize").remove();
                    
                    // restore editor focus
                    Editor.focus();
                    
                    // insert value with closing quote
                    Document.replaceRange(size + typeQuote, {line: cursor.line, ch: finalPos + 1});
                } else {
                    
                    // if anything else is typed then assume user doesn't want value and remove box
                    // at one time I had the value just inserted immediately
                    // but I found that annoying as sometimes you don't want the accurate image size
                    // which is why I went the suggestion box route
                    $("#ta-imageSize").remove();
                    Editor.focus();
                }
                
                // remove this binding so space bar works as expected again
                $(document).off("keydown", insertSize);
            }
            
        }
        
    });
    
});