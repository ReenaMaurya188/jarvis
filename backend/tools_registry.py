GROQ_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for information using DuckDuckGo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "run_code",
            "description": "Run Python code in a sandboxed environment to perform calculations or logic. Return the standard output.",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "The Python code to execute. Must use print() to output results."
                    }
                },
                "required": ["code"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "set_reminder",
            "description": "Set a reminder for a specific time in the future.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "The reminder message."
                    },
                    "delay_seconds": {
                        "type": "integer",
                        "description": "Delay in seconds from now until the reminder triggers."
                    }
                },
                "required": ["message", "delay_seconds"]
            }
        }
    }
]
