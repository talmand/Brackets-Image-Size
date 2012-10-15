Brackets image size finder-outer
===
This extension aids in inserting the correct width and height of an image that is sourced in an img element.

To install this extension:

In Brackets, under "Help" select "Show Extensions Folder". Place extension folder with files inside the "user" folder.
Older versions of Brackets this choice might be under "Debug" or might not exist at all.

Usage
=====
Once installed the extension waits for the appropriate moment to make the size suggestion. This is triggered whenever you type a quote (single or double) after either width or height in the img element. When triggered a small box will appear near the cursor to show the size of that axis of the image. If you click on the box then that size will be inserted with a closing quote. You can also hit the space bar which will insert the size and the closing quote.
This extension works best if you just type along in this pattern left-to-right:

&lt;img src="image.png" width="100" height="100" /&gt;

It doesn't necessarily need to be in this order but the spacing is expected. If the src already exists then the width and height attributes can be inserted before the src.


Known issues
=====
Doesn't work well with the HTML code hints. If you hit enter on the width or height attribute code hint then this extension doesn't work.

Expects a space between the width and height attributes and anything to the right of them. If there's no space between these attributes and whatever then it won't work.


Things to do
=====
Make it work nicely with HTML code hinting.

Solve the no-space separation problem.

Make a preview?