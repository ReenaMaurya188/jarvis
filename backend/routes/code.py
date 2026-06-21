from fastapi import APIRouter
from pydantic import BaseModel
import sys
import io
import traceback
import concurrent.futures

router = APIRouter()

class CodeRequest(BaseModel):
    code: str

def execute_code_sandboxed(code: str):
    # Restricted builtins
    safe_builtins = {
        'print': print,
        'range': range,
        'len': len,
        'int': int,
        'float': float,
        'str': str,
        'list': list,
        'dict': dict,
        'set': set,
        'tuple': tuple,
        'bool': bool,
        'sum': sum,
        'min': min,
        'max': max,
        'abs': abs,
        'round': round,
        'Exception': Exception
    }

    # Redirect stdout
    old_stdout = sys.stdout
    redirected_output = sys.stdout = io.StringIO()

    try:
        # Provide restricted globals
        exec(code, {"__builtins__": safe_builtins}, {})
    except Exception:
        traceback.print_exc(file=sys.stdout)
    finally:
        sys.stdout = old_stdout

    return redirected_output.getvalue()

def run_python_code(code: str, timeout: int = 5):
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(execute_code_sandboxed, code)
        try:
            output = future.result(timeout=timeout)
            return output
        except concurrent.futures.TimeoutError:
            return "Error: Code execution timed out after 5 seconds."
        except Exception as e:
            return f"Error executing code: {e}"

@router.post("/")
def code_endpoint(request: CodeRequest):
    return {"output": run_python_code(request.code)}
