"""
deploy-gui.py - Gaurosa.it Deploy Tool
Doppio click per deployare il sito su gaurosa.it

Requisiti: pip install paramiko
"""

import tkinter as tk
from tkinter import scrolledtext, messagebox
import threading
import subprocess
import paramiko
import os
import sys

# ── Configurazione ────────────────────────────────────────────────────────────
SITE_DIR    = os.path.dirname(os.path.abspath(__file__))
SSH_HOST    = '82.25.102.134'
SSH_PORT    = 65002
SSH_USER    = 'u341208956'
SSH_PASS    = 'cxC~+4Re69'
REMOTE_PATH = '/home/u341208956/domains/gaurosa.it/public_html'
# ─────────────────────────────────────────────────────────────────────────────


class DeployApp:
    def __init__(self, root):
        self.root = root
        self.root.title("🌸 Gaurosa Deploy Tool")
        self.root.geometry("600x500")
        self.root.resizable(False, False)
        self.root.configure(bg="#f9c3d5")

        # Titolo
        tk.Label(
            root, text="🌸 Gaurosa.it - Deploy Tool",
            font=("Helvetica", 18, "bold"),
            bg="#f9c3d5", fg="#8b1538"
        ).pack(pady=(20, 5))

        tk.Label(
            root, text="Pubblica le modifiche su gaurosa.it",
            font=("Helvetica", 11),
            bg="#f9c3d5", fg="#555"
        ).pack(pady=(0, 15))

        # Campo messaggio commit
        tk.Label(
            root, text="Descrizione delle modifiche:",
            font=("Helvetica", 10, "bold"),
            bg="#f9c3d5", fg="#333"
        ).pack(anchor="w", padx=30)

        self.msg_var = tk.StringVar(value="Aggiornamento sito")
        self.msg_entry = tk.Entry(
            root, textvariable=self.msg_var,
            font=("Helvetica", 11),
            width=50, relief="flat",
            bg="white", fg="#333",
            highlightthickness=1, highlightbackground="#ddd"
        )
        self.msg_entry.pack(padx=30, pady=(5, 15), ipady=6)

        # Bottone deploy
        self.btn = tk.Button(
            root,
            text="🚀  PUBBLICA IL SITO",
            font=("Helvetica", 14, "bold"),
            bg="#8b1538", fg="white",
            activebackground="#6d1030", activeforeground="white",
            relief="flat", cursor="hand2",
            padx=30, pady=12,
            command=self.start_deploy
        )
        self.btn.pack(pady=(0, 15))

        # Log
        tk.Label(
            root, text="Log:",
            font=("Helvetica", 10, "bold"),
            bg="#f9c3d5", fg="#333"
        ).pack(anchor="w", padx=30)

        self.log = scrolledtext.ScrolledText(
            root, height=12, width=68,
            font=("Courier", 9),
            bg="#1e1e1e", fg="#d4d4d4",
            relief="flat", state="disabled"
        )
        self.log.pack(padx=30, pady=(5, 20))

        # Status bar
        self.status_var = tk.StringVar(value="Pronto.")
        tk.Label(
            root, textvariable=self.status_var,
            font=("Helvetica", 9),
            bg="#f9c3d5", fg="#666"
        ).pack()

    def log_write(self, text, color=None):
        """Scrive una riga nel log (thread-safe)."""
        def _write():
            self.log.configure(state="normal")
            tag = color or "white"
            self.log.tag_configure("green",  foreground="#4ec9b0")
            self.log.tag_configure("red",    foreground="#f44747")
            self.log.tag_configure("yellow", foreground="#dcdcaa")
            self.log.tag_configure("white",  foreground="#d4d4d4")
            self.log.insert("end", text + "\n", tag)
            self.log.see("end")
            self.log.configure(state="disabled")
        self.root.after(0, _write)

    def set_status(self, text):
        self.root.after(0, lambda: self.status_var.set(text))

    def set_btn(self, enabled):
        state = "normal" if enabled else "disabled"
        self.root.after(0, lambda: self.btn.configure(state=state))

    def start_deploy(self):
        msg = self.msg_var.get().strip()
        if not msg:
            messagebox.showwarning("Attenzione", "Inserisci una descrizione delle modifiche.")
            return

        # Pulisci log
        self.log.configure(state="normal")
        self.log.delete("1.0", "end")
        self.log.configure(state="disabled")

        self.set_btn(False)
        threading.Thread(target=self.run_deploy, args=(msg,), daemon=True).start()

    def run_deploy(self, commit_msg):
        try:
            self.set_status("Deploy in corso...")

            # ── STEP 1: Build ────────────────────────────────────────
            self.log_write("━━━ STEP 1/4: Build produzione ━━━", "yellow")
            self.set_status("Build in corso (1-2 minuti)...")

            result = subprocess.run(
                ["npm", "run", "build"],
                cwd=SITE_DIR,
                capture_output=True, text=True, shell=True
            )
            if result.returncode != 0:
                self.log_write(result.stderr[-1000:], "red")
                raise Exception("Build fallita!")
            self.log_write("✓ Build completata", "green")

            # ── STEP 2: Git add + commit ─────────────────────────────
            self.log_write("\n━━━ STEP 2/4: Git commit ━━━", "yellow")
            self.set_status("Salvataggio modifiche...")

            subprocess.run(["git", "add", "-A"], cwd=SITE_DIR, shell=True, check=True)

            # Controlla se ci sono modifiche da committare
            status = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=SITE_DIR, capture_output=True, text=True, shell=True
            )
            if status.stdout.strip():
                subprocess.run(
                    ["git", "commit", "-m", commit_msg],
                    cwd=SITE_DIR, shell=True, check=True
                )
                self.log_write(f"✓ Commit: \"{commit_msg}\"", "green")
            else:
                self.log_write("ℹ Nessuna modifica da committare", "white")

            # ── STEP 3: Git push ─────────────────────────────────────
            self.log_write("\n━━━ STEP 3/4: Git push ━━━", "yellow")
            self.set_status("Invio a GitHub...")

            result = subprocess.run(
                ["git", "push", "origin", "main"],
                cwd=SITE_DIR, capture_output=True, text=True, shell=True
            )
            if result.returncode != 0:
                self.log_write(result.stderr, "red")
                raise Exception("Git push fallito!")
            self.log_write("✓ Push su GitHub completato", "green")

            # ── STEP 4: Deploy Hostinger via SSH ─────────────────────
            self.log_write("\n━━━ STEP 4/4: Deploy su Hostinger ━━━", "yellow")
            self.set_status("Deploy su gaurosa.it...")

            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            client.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS, timeout=30)

            cmd = f"cd {REMOTE_PATH} && git pull origin main 2>&1"
            stdin, stdout, stderr = client.exec_command(cmd)
            output = stdout.read().decode("utf-8")
            self.log_write(output.strip(), "white")

            if "error" in output.lower() or "fatal" in output.lower():
                raise Exception("Git pull fallito su Hostinger!")

            client.close()
            self.log_write("✓ Deploy su gaurosa.it completato!", "green")

            # ── SUCCESSO ─────────────────────────────────────────────
            self.log_write("\n🎉 SITO PUBBLICATO CON SUCCESSO!", "green")
            self.log_write("   → https://gaurosa.it", "green")
            self.set_status("✓ Deploy completato!")
            self.root.after(0, lambda: messagebox.showinfo(
                "Pubblicato!", "✅ Il sito è stato aggiornato!\n\nhttps://gaurosa.it"
            ))

        except Exception as e:
            self.log_write(f"\n❌ ERRORE: {e}", "red")
            self.set_status(f"Errore: {e}")
            self.root.after(0, lambda: messagebox.showerror(
                "Errore Deploy", f"Si è verificato un errore:\n\n{e}"
            ))
        finally:
            self.set_btn(True)


if __name__ == "__main__":
    root = tk.Tk()
    app = DeployApp(root)
    root.mainloop()
