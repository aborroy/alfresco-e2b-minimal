import os, json

inp = os.environ.get("INPUT_PATH", "/work/input.bin")
outp = os.environ.get("OUTPUT_PATH", "/work/out.json")

# naive: treat as text if possible, else just size
try:
    text = open(inp, "rb").read().decode("utf-8", errors="ignore")
    words = len(text.split())
    data = {"kind":"text", "bytes": len(text.encode()), "words": words, "lines": text.count("\n")+1}
except Exception:
    import os
    data = {"kind":"binary", "bytes": os.path.getsize(inp)}

with open(outp, "w") as f:
    json.dump(data, f)
print("done")
