// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const { worker } = require('cluster');
const vscode = require('vscode');

function delete_spaces_after(){
	let max = 0
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		const document = editor.document;
		const selections = editor.selections;
		let org_text = document.getText().split("\n")
		let new_text = org_text
		for (const s of selections){
			const start = s.start.line  //.line and .char
			let pos = s.start.character
			while ((org_text[start][pos] === "\t") || (org_text[start][pos] === " ")){
				pos += 1
			}
			new_text[start] = org_text[start].substring(0,s.start.character) + org_text[start].substring(pos)
		}
		const result = new_text.join("\n")
        editor.edit(builder => {
            const currentText = editor.document.getText();
            const definiteLastCharacter = currentText.length;
            const range = new vscode.Range(0, 0, editor.document.lineCount, definiteLastCharacter);
            builder.replace(range, result);
        });
	}
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function allign_whatever(pattern, text){
	let max = 0
	let pos = 0
	if (pattern.startsWith('/')&&pattern.endsWith('/')){
		if (pattern.substring(1, pattern.length-1).indexOf("\\n")>0){
			vscode.window.showErrorMessage("new line characters not supported in regular expressions to align")
			return
		}
		if (pattern.substring(1, pattern.length-1).indexOf("\\n")===-1){
			pattern = new RegExp(pattern.substring(1, pattern.length-1))
		}
		else{
			pattern =pattern.substring(1, pattern.length-1)
		}
	}
	if (pattern === '\\n'){
		for (const l of text.split("\n")){
			pos = l.length
			if (max < pos) max = pos
			pattern = '\r'
		}	
	}else{
		pattern = pattern.replace("(", "\\(")
		pattern = pattern.replace(")", "\\)")
		pattern = pattern.replace(".", "\\.")
		pattern = pattern.replace("[", "\\[")
		pattern = pattern.replace("]", "\\]")
		pattern = pattern.replace("?", "\\?")
		pattern = pattern.replace("{", "\\{")
		pattern = pattern.replace("}", "\\}")
		pattern = pattern.replace("^", "\\^")
		pattern = pattern.replace("$", "\\$")
		pattern = pattern.replace("+", "\\+")
		pattern = pattern.replace("*", "\\*")
		pattern = pattern.replace("|", "\\|")
		for (const l of text.split("\n")){
			pos = l.search(pattern)
			if (max < pos) max = pos
		}	
	}
	let nt = ""
	for (const l of text.split("\n")){
		let start = l.search(pattern)
		if (start > 0){
			nt += (l.substring(0, start)+" ".repeat(max-start)+l.substring(start)+"\n")
		}
		else if (start === 0){
			nt += (" ".repeat(max-l.length)+l.substring(start)+"\n")
		}else{
			nt+=(l+"\n")
		}
	}
	return nt
}

function line_contains(pattern, line, invert){
	let max = 0
	let pos = 0
	if (pattern.startsWith('/')&&pattern.endsWith('/')){
			pattern =pattern.substring(1, pattern.length-1)
	}else{
		pattern = pattern.replace("(", "\\(")
		pattern = pattern.replace(")", "\\)")
		pattern = pattern.replace(".", "\\.")
		pattern = pattern.replace("[", "\\[")
		pattern = pattern.replace("]", "\\]")
		pattern = pattern.replace("?", "\\?")
		pattern = pattern.replace("{", "\\{")
		pattern = pattern.replace("}", "\\}")
		pattern = pattern.replace("^", "\\^")
		pattern = pattern.replace("$", "\\$")
		pattern = pattern.replace("+", "\\+")
		pattern = pattern.replace("*", "\\*")
		pattern = pattern.replace("|", "\\|")
	}
	if (invert)	return (line.search(pattern)===-1)
	else return (line.search(pattern)>-1)
}

function insert_separators(string, separator, size){
	let hhex
	let bbin
	if (string.length > size){
		const start = string.length %size
		let i = 0
		hhex = string.substring(0, start)
		while(i <= string.length/size){
			hhex += (separator + string.substring(i*size+start, (i+1)*size+start))
			i+=1
		}
		hhex = hhex[hhex.length-1]===separator? hhex.substring(0, hhex.length-1) : hhex
	}
	else hhex = string
	return hhex
}

async function get_allignment_string() {
    let type = await vscode.window.showInputBox({
        value: '=>',
        prompt: 'Give alignment string',
        placeHolder: 'can be also a reg ex',
    });
    if (!type) {
        return;
    }
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		const document = editor.document;
		const selection = editor.selection;

		// Get the word within the selection
		let max = 0
		const word = document.getText(selection);
		const newtext = allign_whatever(type, word)
		editor.edit(editBuilder => {
			editBuilder.replace(selection, newtext)
		});
	}

}

async function get_contain_string(invert) {
    let type = await vscode.window.showInputBox({
        value: '',
        prompt: 'Give the pattern to search for',
        placeHolder: 'can be also a reg ex',
    });
    if (!type) {
        return;
    }
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		const document = editor.document;
		const selection = editor.selection;

		// Get the word within the selection
		let max = 0
		let lines = []
		const text = document.getText();
		for (const l of text.split('\n')){
			if (line_contains(type, l, invert)) lines.push(l)			
		}
		vscode.env.clipboard.writeText(lines.join('\n'));
        vscode.window.showInformationMessage(`Lines ${lines.length} copied to clipboard`);
	}
}

async function cut_line_contain_string(invert) {
    let type = await vscode.window.showInputBox({
        value: '',
        prompt: 'Give the pattern to search for',
        placeHolder: 'can be also a reg ex',
    });
    if (!type) {
        return;
    }
	const editor = vscode.window.activeTextEditor;

	if (editor) {
		const document = editor.document;
		const selection = editor.selection;

		// Get the word within the selection
		let max = 0
		let lines = []
		let new_lines = []
		const text = document.getText();
		for (const l of text.split('\n')){
			if (!line_contains(type, l, invert)){
				new_lines.push(l)			
			} 
			else lines.push(l)			
		}
		
		const edit = new vscode.WorkspaceEdit();
		let old_text = document.getText()
		let new_text = new_lines.join('\n')
	
		let fullRange = new vscode.Range(
			document.positionAt(0),
			document.positionAt(old_text.length)
		)
		editor.edit(editBuilder => {
			editBuilder.replace(fullRange, new_text);
		})
		vscode.env.clipboard.writeText(lines.join('\n'));
        vscode.window.showInformationMessage(`Lines ${lines.length} copied to clipboard`);
	}
}

async function insert_counter(){
    let type = await vscode.window.showInputBox({
        value: '0 1',
        prompt: 'Enter <start value> <increment>',
        placeHolder: 'can be also a reg ex',
    });

    if (!type) {
        return;
    }
	let max = 0
	const editor = vscode.window.activeTextEditor;

	const start_val = parseInt(type.split(" ")[0])
	const increment = parseInt(type.split(" ")[1])

	if (editor) {
		const document = editor.document;
		const selections = editor.selections;
		let org_text = document.getText().split("\n")
		let new_text = org_text
		let cnt = start_val
		for (const s of selections){
			const start = s.start.line  //.line and .char
			let pos = s.start.character
			if (org_text[start].trim().length > 1){
				new_text[start] = org_text[start].substring(0,s.start.character) + `${cnt}`.padStart(`${selections.length+start_val}`.length, ' ') + org_text[start].substring(pos)
				cnt = cnt + increment
			}
			else{
				new_text[start] = org_text[start]
			}
		}
		const result = new_text.join("\n")
        editor.edit(builder => {
            const currentText = editor.document.getText();
            const definiteLastCharacter = currentText.length;
            const range = new vscode.Range(0, 0, editor.document.lineCount, definiteLastCharacter);
            builder.replace(range, result);
        });
	}

}

async function paste_column(repeating=false){
	let max = 0
	const editor = vscode.window.activeTextEditor;
	let clipboard_content = await vscode.env.clipboard.readText(); 

	if (editor) {
		const document = editor.document;
		const selections = editor.selections;
		let org_text = document.getText().split("\n")
		let new_text = org_text
		let clips = clipboard_content.split("\n")
		if (clips[clips.length-1] === "") clips = clips.slice(0,-1)
		let clipindex = 0;
		for (const s of selections){
			const start = s.start.line  //.line and .char
			let pos = s.start.character
			if ( (org_text[start].trim().length > 1) && 
			     (((clipindex < clips.length) && !repeating)  ||  (repeating)))  {
				if (clipindex >= clips.length) clipindex = 0	 
				new_text[start] = org_text[start].substring(0,s.start.character) + clips[clipindex]+org_text[start].substring(pos)
				clipindex = clipindex+1
			}
			else{
				new_text[start] = org_text[start]
			}
		}
		const result = new_text.join("\n")
        editor.edit(builder => {
            const currentText = editor.document.getText();
            const definiteLastCharacter = currentText.length;
            const range = new vscode.Range(0, 0, editor.document.lineCount, definiteLastCharacter);
            builder.replace(range, result);
        });
	}

}

let myStatusBarItem

function updateStatusBarItem() {
	const n = getNumberOfSelectedLines(vscode.window.activeTextEditor);
	if (n > 0) {
		myStatusBarItem.text = `$(megaphone) ${n} line(s) selected`;
		myStatusBarItem.show();
	} else {
		myStatusBarItem.hide();
	}
}

function getNumberOfSelectedLines(editor) {
	let lines = 0;
	if (editor) {
		lines = editor.selections.reduce((prev, curr) => prev + (curr.end.line - curr.start.line), 0);
	}
	return lines;
}

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {

	let hovering = vscode.languages.registerHoverProvider({ pattern: '**' }, {
        provideHover(document, position, token) {


			const range = document.getWordRangeAtPosition(position);
            
			let word = ""
			let char = document.getText()[document.offsetAt(position)]
			let index = 0
			while (char.search(/[0-9a-f_x"]+/i)>-1){
				word += char
				index +=1
				char = document.getText()[document.offsetAt(position)+index]
			};
			char = document.getText()[document.offsetAt(position)-1]
			index = -1
			while (char.search(/[0-9a-f_x"]+/i)>-1){
				word = char + word
				index -=1
				char = document.getText()[document.offsetAt(position)+index]

			};
			word =word.replace(/_/g, "")
			let hex = "" 
			let bin = ""
			let dec = 0
			if (word.toLowerCase().startsWith('b"') ||word.toLowerCase().startsWith('"') || word.toLowerCase().startsWith('0b')){
				// assume binary as "011010"
				word = word.replace(/"/g, "")
				word = word.toLowerCase().replace('0b', '')
				word = word.toLowerCase().replace('b', '')
				dec = parseInt(word, 2);
			} 
			else if (word.toLowerCase().startsWith('x"')|| word.toLowerCase().startsWith('0x')){
				// assume hex
				word = word.replace(/"/g, "")
				word = word.toLowerCase().replace('0x','')
				word = word.toLowerCase().replace('x', '')
				dec = parseInt(word, 16);
			} 
			else {// assume integer
				dec = parseInt(word, 10)
				if (isNaN(dec )) return
			}
			hex = dec.toString(16);
			bin = dec.toString(2);
            if ((bin === 'NaN') || (hex === 'NaN')) return
			let hhex = insert_separators(hex, "_", 4)
			let bbin = insert_separators(bin, "_", 4)
			let ddec = insert_separators(`${dec}`, " ", 3)
			let popup = ""

			hhex = hhex.replace(/^_/g, '')
			bbin = bbin.replace(/^_/g, '')
			ddec = ddec.replace(/^ /g, '')

			if ((dec < 128)&&(dec > 39)){
				popup = `dec  : ${ddec}\nhex  : ${hhex}\nbin  : ${bbin}\nchar : `+String.fromCharCode(dec)
			}
			else{
				popup = `dec : ${ddec}\nhex : ${hhex}\nbin : ${bbin}`
			}

                return new vscode.Hover({
                    language: "VHDL",
                    value: popup
                });
        }
    });	


	// register a command that is invoked when the status bar
	// item is selected
	const myCommandId = 'textutils.showSelectionCount';
	context.subscriptions.push(vscode.commands.registerCommand(myCommandId, () => {
		const n = getNumberOfSelectedLines(vscode.window.activeTextEditor);
	}));

	// create a new status bar item that we can now manage
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = myCommandId;
	context.subscriptions.push(myStatusBarItem);

	// register some listener that make sure the status bar 
	// item always up-to-date
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

	// update status bar item once at start
	updateStatusBarItem();


	context.subscriptions.push(hovering);

	let disposable = vscode.commands.registerCommand('text-utils.allign_whatever', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
        const text = get_allignment_string()
 
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('text-utils.copy_lines_containing', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
        const text = get_contain_string(false)
 
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('text-utils.cut_lines_not_containing', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
        const text = cut_line_contain_string(true)
 
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('text-utils.cut_lines_containing', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
        const text = cut_line_contain_string(false)
 
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('text-utils.copy_lines_not_containing', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
        const text = get_contain_string(true)
 
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('text-utils.delete_spaces_right', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
        const text = delete_spaces_after()
 
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('text-utils.insert_counter', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
        const text = insert_counter()
 
	});
	context.subscriptions.push(disposable);
	
	disposable = vscode.commands.registerCommand('text-utils.paste_column', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
        const text = paste_column()
 
	});
	context.subscriptions.push(disposable);
	
	disposable = vscode.commands.registerCommand('text-utils.paste_column_repeat', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
        const text = paste_column(true)
 
	});
	context.subscriptions.push(disposable);
	

}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
