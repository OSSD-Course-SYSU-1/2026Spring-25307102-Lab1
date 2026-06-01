# Fix the corrupted line in server.py
path = r"D:\HUAWEI\lab4\server\server.py"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Line 124 (1-indexed) is corrupted - fix it
for i, line in enumerate(lines):
    if "not found" not in line and "send_json" in line and "error" in line and "message" in line:
        # This is the corrupted line, replace it
        indent = line[:len(line) - len(line.lstrip())]
        lines[i] = indent + 'await ws.send_json({"type":"error","message":"Room not found"})\n'
        print(f"Fixed line {i+1}: {lines[i].strip()}")
        break

with open(path, "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
