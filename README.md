# text-utils 

Text-utils is a collection of small tools which are handy when working with text based files.

## Features

### Align on whatever

After selecting text, you can enter a pattern (which can be a regular expression between / /) which will be aligned in the selected text

![Demo](https://github.com/kv-be/text_utils/raw/master/resources/align_on.gif)

### Delete spaces after cursor

This will delete all spaces after the cursor (supporting multiple cursors and selections)

![Demo](https://github.com/kv-be/text_utils/raw/master/resources/delete_right.gif)

### Integer, hex and bin conversion on hover

When pointing to any number, a pop-up window will appear showing the number in decimal, hexadecimal and binary representation

![Demo](https://github.com/kv-be/text_utils/raw/master/resources/radix_converrt.gif)

### Copy lines containing

Copies all lines in a file containing a given pattern (supporting regular expressions between / /)

![Demo](https://github.com/kv-be/text_utils/raw/master/resources/containing.gif)

### Copy lines not containing

Copies all lines in a file not containing a given pattern (supporting regular expressions between / /)

![Demo](https://github.com/kv-be/text_utils/raw/master/resources/not_containing.gif)

### Cut lines containing

Cuts all lines in a file containing a given pattern (supporting regular expressions between / /)

![Demo](https://github.com/kv-be/text_utils/raw/master/resources/cut_lines_containing.gif)

### Cut lines not containing

Cuts all lines in a file not containing a given pattern (supporting regular expressions between / /)

![Demo](https://github.com/kv-be/text_utils/raw/master/resources/cut_lines_not_containing.gif)

### Insert increment

Inserts incremental numbers on each line in case of multicursor selection

![Demo](https://github.com/kv-be/text_utils/raw/master/resources/increment.gif)

### Paste column (repeated)
The native vertical paste of vscode is very restrictive. If your selection is not exactly the same size as your clipboard, the behaviour is not very usefull. This command makes things easier:
- if your clipboard contents is bigger than your multicursor selection, only the beginning of the clipboard is pasted.
- if your clipboard is smaller than the multicursor selection, there are 2 options:
  - only copy the entire clipboard once and leave the other lines unaffected (paste column)
  - repeat the clipboard contents until the selection is filled (paste column repeat)

![Demo](https://github.com/kv-be/text_utils/raw/master/resources/paste_column.gif)

## Release Notes

### 1.0.0

Initial release of the text-utils

