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
	context.subscriptions.push(hovering);

	let disposable = vscode.commands.registerCommand('kv-utils.allign_whatever', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
        const text = get_allignment_string()
 
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('kv-utils.delete_spaces_right', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
        const text = delete_spaces_after()
 
	});
	context.subscriptions.push(disposable);

}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
