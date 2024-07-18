const OpenAI = require("openai");
const openai = require('./config/open-ai');
const readlineSync = require('readline-sync');

async function addNumbers(num1, num2) {
    try {
        const sum = num1 + num2;
        return {
            num1: num1,
            num2: num2,
            sum: sum
        };
    } catch (error) {
        console.error(`The addition of ${num1} and ${num2} failed.`);
        throw error;
    }
}

async function subNumbers(num1, num2) {
    try {
        const diff = num1 - num2;
        return {
            num1: num1,
            num2: num2,
            diff: diff
        };
    } catch (error) {
        console.error(`The subtraction of ${num1} and ${num2} failed.`);
        throw error;
    }
}

async function multNumbers(num1, num2) {
    try {
        console.log("multNumbers")
        const crossProd = num1 * num2;
        return {
            num1: num1,
            num2: num2,
            crossProd: crossProd
        };
    } catch (error) {
        console.error(`The multiplication of ${num1} and ${num2} failed.`);
        throw error;
    }
}

async function divNumbers(num1, num2) {
    try {
        const div = num1 / num2;
        return {
            num1: num1,
            num2: num2,
            div: div
        };
    } catch (error) {
        console.error(`The division of ${num1} and ${num2} failed.`);
        throw error;
    }
}

const tools = [
    {
        "type": "function",
        "function": {
            "name": "addNumbers",
            "description": "Get the addition of numbers",
            "parameters": {
                "type": "object",
                "properties": {
                    "num1": {
                        "type": "number",
                    },
                    "num2": {
                        "type": "number",
                    }
                },
                "required": ["num1", "num2"],
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "subNumbers",
            "description": "Get the subtraction of numbers",
            "parameters": {
                "type": "object",
                "properties": {
                    "num1": {
                        "type": "number",
                    },
                    "num2": {
                        "type": "number",
                    }
                },
                "required": ["num1", "num2"],
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "multNumbers",
            "description": "Get the multiplication of numbers",
            "parameters": {
                "type": "object",
                "properties": {
                    "num1": {
                        "type": "number",
                    },
                    "num2": {
                        "type": "number",
                    }
                },
                "required": ["num1", "num2"],
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "divNumbers",
            "description": "Get the division of numbers",
            "parameters": {
                "type": "object",
                "properties": {
                    "num1": {
                        "type": "number",
                    },
                    "num2": {
                        "type": "number",
                    }
                },
                "required": ["num1", "num2"],
            }
        }
    },

];


async function main() {
    const assistant = await openai.beta.assistants.create({
        name: "Math Tutor",
        instructions: "You are a personal math tutor. Write and run code to answer math questions. use BODMAS",
        tools: tools,
        model: "gpt-3.5-turbo"
    });
    // console.log("Assistant created:", assistant);

    const thread = await openai.beta.threads.create();
    // console.log("Thread created:", thread);
    const userInput = readlineSync.question("Enter the query ")
        await openai.beta.threads.messages.create(
            thread.id,
            {
                role: "user",
                content: userInput,
            }
    );
    // console.log("Message created");

    let run = await openai.beta.threads.runs.createAndPoll(
        thread.id,
        { 
            assistant_id: assistant.id,
            instructions: "Please address the user as Jane Doe. The user has a premium account."
        }
    );
    // console.log("Run created and polled:", run);

    if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(run.thread_id);
        for (const message of messages.data.reverse()) {
            console.log(`${message.role} > ${message.content[0].text.value}`);
        }
    } else if (run.status === 'requires_action') {
        console.log("Requires action");

        const requiredActions = run.required_action.submit_tool_outputs.tool_calls;
        console.log("Required actions:", requiredActions);

        let toolsOutput = [];

        for (const action of requiredActions) {
            const funcName = action.function.name;
            const functionArguments = JSON.parse(action.function.arguments);

            if (funcName === "addNumbers") {
                const output = await addNumbers(functionArguments.num1, functionArguments.num2);
                console.log("Function output:", output);
                toolsOutput.push({
                    tool_call_id: action.id,
                    output: JSON.stringify(output)
                });
            }else if(funcName === "subNumbers") {
                const output = await subNumbers(functionArguments.num1, functionArguments.num2);
                console.log("Function output:", output);
                toolsOutput.push({
                    tool_call_id: action.id,
                    output: JSON.stringify(output)
                });
            }else if (funcName === "multNumbers") {
                const output = await multNumbers(functionArguments.num1, functionArguments.num2);
                console.log("Function output:", output);
                toolsOutput.push({
                    tool_call_id: action.id,
                    output: JSON.stringify(output)
                });
            }else if (funcName === "divNumbers") {
                const output = await divNumbers(functionArguments.num1, functionArguments.num2);
                console.log("Function output:", output);
                toolsOutput.push({
                    tool_call_id: action.id,
                    output: JSON.stringify(output)
                });
            }
             else {
                console.log("Function not found");
            }
        }
        console.log("Tools output:", toolsOutput);

        // Submit the tool outputs to Assistant API
        await openai.beta.threads.runs.submitToolOutputs(
            run.thread_id,
            run.id,
            { tool_outputs: toolsOutput }
        );
        // console.log("Tool outputs submitted");
    } else {
        console.log("Run is not completed yet.");
    }
}

main();
