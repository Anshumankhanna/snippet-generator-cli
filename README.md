# Snippet Generator for VS code

## How to use
```bash
	# This installs the tool globally
	npm install -g snip
	
	# Commands to print help and understand how to use the CLI
	snip
	snip --help
	snip -h
```
- The tool fetches from your clipboard and creates a snippet.
- You will need to specify what should be the trigger, still adding the flag for setting trigger 😅

## Idea?
- In VS code one of the most popular features are it's **Emmet Abbreviations**.
- However, you may not know this that you can create your own snippets which are basically commands that can write more code for you.
- This increases your speed and developer experience.
- To know more about it you can run the command `npx snip` / `npx snip --help` / `npx snip -h` (or type anything after `npx snip` that isn't a valid command because every error is handled by displaying help message).

# Issue
- Having to write these snippets manually take time and there is no simple way of porting them.
- When I switched from JavaScript to TypeScript, I still required all my JavaScript snippets however, they weren't available and I needed the same for .jsx and .tsx as well.
- Hence I created this CLI

#Links
- [npm-registry](https://www.npmjs.com/package/snippet-generator)
- [github](https://github.com/Anshumankhanna/snippet-generator-cli)