# Snippet Generator for VS code

## How to use
```bash
	# This installs the tool globally
	npm install -g snip
	# Copy the text you want to create a snippet of
	# This command writes your scripts
	snip -l <language-name>
	# or
	snip --language <language-name>
```
- The tool fetches from your clipboard and creates a snippet.
- You will need to specify what should be the trigger, still adding the flag for setting trigger 😅

## Idea?
- In VS code one of the most popular features are it's **Emmet Abbreviations**.
- However, you may not know this that you can create your own snippets which are basically commands that can write more code for you.
- Some common ones that I often use for JavaScript are:
```json
	{
		"console.log": {
			"prefix": "cl",
			"description": "console.log()",
			"body": [
				"console.log(${1:\"write here\"});"
			]
		},

		"Copy and comment": {
			"prefix": "/c",
			"body": [
				"/*$CLIPBOARD",
				"*/"
			],
			"description": "Copy and comment"
		},
	}
```
- This increases my speed and my experience

# Issue
- Having to write these snippets manually take time and there is no simple way of porting them.
- When I switched from JavaScript to TypeScript, I still required all my JavaScript snippets however, they weren't available and I needed the same for .jsx and .tsx as well.
- Hence I created this CLI