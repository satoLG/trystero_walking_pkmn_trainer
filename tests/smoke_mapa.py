import glob
import os
import socket
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, "..", "entregas", "screenshot_mapa.png")
ARQUIVOS = ["mapa.js", "camera.js", "cenario.js", "minimapa.js", "personagem.js",
            "main.js", "cena.js", "ui.js"]
REDE = ["nostr", "torrent", "websocket", "relay", "trystero", "net::"]


def porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def navegador(p):
    try:
        return p.chromium.launch(headless=True)
    except Exception:
        pass
    base = os.path.expanduser("~/.cache/ms-playwright")
    for pad in ("chromium-*/chrome-linux*/chrome",
                "chromium_headless_shell-*/chrome-headless-shell-linux*/chrome-headless-shell"):
        for exe in sorted(glob.glob(os.path.join(base, pad)), reverse=True):
            try:
                return p.chromium.launch(headless=True, executable_path=exe)
            except Exception:
                continue
    raise RuntimeError("nenhum Chromium utilizavel")


def main():
    porta = porta_livre()
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(porta), "--bind", "127.0.0.1"],
                           cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    erros = []
    ok = False
    try:
        time.sleep(1)
        os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
        with sync_playwright() as p:
            b = navegador(p)
            page = b.new_page(viewport={"width": 1280, "height": 720})
            page.on("pageerror", lambda e: erros.append(("pageerror", str(e) + " " + (e.stack or ""))))
            page.on("console", lambda m: m.type == "error" and erros.append(("console", m.text)))
            page.goto(f"http://127.0.0.1:{porta}/index.html")
            try:
                page.wait_for_function("window.cameraOffset !== undefined", timeout=15000)
                ok = True
            except Exception:
                pass
            page.wait_for_timeout(1000)
            for tecla in ("KeyD", "KeyS"):
                page.keyboard.down(tecla)
                page.wait_for_timeout(800)
                page.keyboard.up(tecla)
            page.screenshot(path=SAIDA)
            b.close()
    finally:
        srv.terminate()
    falhas = [m for t, m in erros if t == "pageerror"
              and any(a in m for a in ARQUIVOS)
              and not any(r in m.lower() for r in REDE)]
    for t, m in erros:
        print(t, m[:200])
    if not ok:
        print("FALHA: cameraOffset nunca apareceu")
    if falhas:
        print("FALHA: pageerror em modulos do jogo")
    return 0 if ok and not falhas else 1


if __name__ == "__main__":
    sys.exit(main())
