import asyncio, json, uuid, os, io, socket, webbrowser
import qrcode
from aiohttp import web, WSMsgType

ROOMS = {}
HOST = "0.0.0.0"
PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, "public")

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def get_all_ips():
    ips = []
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if ip.startswith("127.") or ip.startswith("169.254."):
                continue
            if ip not in ips:
                ips.append(ip)
    except Exception:
        pass
    if not ips:
        ip = get_local_ip()
        if ip != "127.0.0.1":
            ips.append(ip)
    return ips

class Room:
    def __init__(self, room_id):
        self.id = room_id
        self.devices = {}

    def add_device(self, ws, name):
        self.devices[ws] = {"id": str(uuid.uuid4())[:8], "name": name or "Anonymous"}

    def remove_device(self, ws):
        self.devices.pop(ws, None)

    def get_others(self, ws):
        return [info for w, info in self.devices.items() if w is not ws]

    def send_to(self, ws_sender, target_id, msg):
        for w, info in self.devices.items():
            if info["id"] == target_id and w is not ws_sender:
                try:
                    asyncio.create_task(w.send_json(msg))
                except Exception:
                    pass

    def broadcast(self, ws_sender, msg):
        for w in self.devices:
            if w is not ws_sender:
                try:
                    asyncio.create_task(w.send_json(msg))
                except Exception:
                    pass

def get_room_id():
    return uuid.uuid4().hex[:6].upper()

async def qrcode_handler(request):
    data = request.query.get("data", "")
    if not data:
        return web.Response(status=400)
    img = qrcode.make(data, border=2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return web.Response(body=buf.read(), content_type="image/png")

async def ip_handler(request):
    ips = get_all_ips()
    return web.json_response({
        "ip": get_local_ip(),
        "ips": ips,
        "port": PORT,
        "urls": [f"http://{ip}:{PORT}" for ip in ips]
    })

async def ws_handler(request):
    ws = web.WebSocketResponse(max_msg_size=50 * 1024 * 1024)
    await ws.prepare(request)
    current_room = None
    device_info = None

    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                except json.JSONDecodeError:
                    continue
                cmd = data.get("type")

                if cmd == "create-room":
                    room_id = get_room_id()
                    current_room = Room(room_id)
                    ROOMS[room_id] = current_room
                    current_room.add_device(ws, data.get("name"))
                    device_info = current_room.devices[ws]
                    await ws.send_json({"type":"room-created","roomId":room_id,"deviceId":device_info["id"],"devices":current_room.get_others(ws)})

                elif cmd == "join-room":
                    room_id = data.get("roomId","").upper()
                    room = ROOMS.get(room_id)
                    if room:
                        current_room = room
                        current_room.add_device(ws, data.get("name"))
                        device_info = current_room.devices[ws]
                        await ws.send_json({"type":"room-joined","roomId":room_id,"deviceId":device_info["id"],"devices":current_room.get_others(ws)})
                        current_room.broadcast(ws, {"type":"device-joined","device":device_info,"devices":current_room.get_others(ws)})
                    else:
                        await ws.send_json({"type":"error","message":"Room not found"})

                elif cmd == "get-devices":
                    if current_room:
                        await ws.send_json({"type":"devices-list","devices":current_room.get_others(ws)})

                elif cmd in ("webrtc-offer","webrtc-answer","webrtc-ice-candidate"):
                    if current_room:
                        current_room.send_to(ws, data.get("targetId"), {
                            "type": cmd,
                            "fromId": device_info["id"] if device_info else None,
                            "data": data.get("data")
                        })

                elif cmd == "text-message":
                    if current_room:
                        current_room.broadcast(ws, {
                            "type":"text-message",
                            "fromName":device_info["name"] if device_info else "Unknown",
                            "text":data.get("text","")
                        })

            elif msg.type == WSMsgType.ERROR:
                break

    except Exception as e:
        print(f"WS error: {e}")
    finally:
        if current_room:
            current_room.remove_device(ws)
            if device_info:
                current_room.broadcast(ws, {"type":"device-left","device":device_info})
            if len(current_room.devices) == 0:
                ROOMS.pop(current_room.id, None)
    return ws

def static_file(filename):
    async def handler(request):
        return web.FileResponse(os.path.join(WEB_DIR, filename))
    return handler

async def index_handler(request):
    return web.FileResponse(os.path.join(WEB_DIR, "index.html"))

async def start_server():
    app = web.Application()
    app.router.add_get("/", index_handler)
    app.router.add_get("/ws", ws_handler)
    app.router.add_get("/qrcode", qrcode_handler)
    app.router.add_get("/api/ip", ip_handler)
    app.router.add_get("/style.css", static_file("style.css"))
    app.router.add_get("/app.js", static_file("app.js"))

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, HOST, PORT)
    await site.start()
    ip = get_local_ip()
    print(f"  Local: http://localhost:{PORT}")
    print(f"  LAN:   http://{ip}:{PORT}")
    return runner

def main():
    print("=" * 50, flush=True)
    print("  AirShare - 灞€鍩熺綉鍙屽悜浜掍紶", flush=True)
    print("=" * 50, flush=True)
    print(f"  鎵嬫満娴忚鍣ㄦ墦寮€: http://{get_local_ip()}:{PORT}", flush=True)
    # browser opens after server start
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(start_server())
        try:
            import time, webbrowser
            time.sleep(1)
            webbrowser.open(f"http://localhost:{PORT}")
            print("  Browser opened.", flush=True)
        except Exception:
            print(f"  Open http://localhost:{PORT}", flush=True)
        loop.run_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")

if __name__ == "__main__":
    main()

