path = r"D:\HUAWEI\lab4\server\server.py"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()
# Fix broken error message - the garbled Chinese is the result of encoding corruption
# The original "房间不存在" string has a broken closing quote
import re
# Find the broken line and fix it
# Pattern: anything with garbled chars and missing quote
c = c.replace(
    'await ws.send_json({"type":"error","message":"鎴块棿涓嶅瓨鍦?})',
    'await ws.send_json({"type":"error","message":"Room not found"})'
)
with open(path, "w", encoding="utf-8") as f:
    f.write(c)
print("Fixed")
