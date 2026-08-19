import * as vscode from 'vscode';
import OpenAI from 'openai';

// NOTE: Hardcoding an API key is for local testing ONLY. 
// In Phase 4, we will move this to a secure user setting.
const openai = new OpenAI({
    apiKey: 'YOUR_OPENAI_API_KEY_HERE' 
});

export function activate(context: vscode.ExtensionContext) {
    
    // Register the command that the user will trigger
    let disposable = vscode.commands.registerCommand('threejs-math-copilot.generateMath', async () => {
        
        // 1. Ensure the user has an active text editor open
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("Open a file to generate Three.js code.");
            return;
        }

        // 2. Open an Input Box to capture the developer's intent
        const prompt = await vscode.window.showInputBox({
            placeHolder: "e.g., Rotate mesh to face camera on Y axis only",
            prompt: "What Three.js logic do you need?"
        });

        if (!prompt) {
            return; // User canceled the input box
        }

        // Show a loading indicator in the status bar
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating Three.js Code...",
            cancellable: false
        }, async () => {
            
            try {
                const fileContext = editor.document.getText();
                
                // 3. Query the LLM with strict System Prompts
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o", // Or gpt-4o-mini for faster/cheaper results
                    messages: [
                        {
                            role: "system",
                            content: `You are a Three.js r160+ math expert. Output ONLY valid TypeScript/JavaScript code. Do not use Markdown formatting (no \`\`\` fences). Do not explain the code. Return only the raw code block required to perform the spatial operation.\n\nHere is the current file context for reference (use existing variable names):\n${fileContext}`
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                });

                const generatedCode = completion.choices[0]?.message?.content || "// Failed to generate code";

                // 4. Inject the generated code at the cursor's current position
                editor.edit(editBuilder => {
                    editBuilder.insert(editor.selection.active, generatedCode);
                });

            } catch (error) {
                vscode.window.showErrorMessage(`Copilot Error: ${error}`);
            }
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
