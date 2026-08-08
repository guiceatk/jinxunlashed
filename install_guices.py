#!/usr/bin/env python3
"""
Guices.ai (JINXUNLASHED) Automated Setup & Fallback Installer
--------------------------------------------------------------
This script automates environment checking, repository setup, monorepo dependency
installation, Playwright browser setup, workspace compilation, and generates a detailed
diagnostic report with fallback recovery logic upon any failures.
"""

import sys
import os
import shutil
import subprocess
import platform
import json
from pathlib import Path
from datetime import datetime

# Set encoding for Windows standard output
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

REPO_URL = "https://github.com/guiceatk/jinxunlashed.git"
PROJECT_DIR = Path(__file__).parent.resolve()

class Colors:
    GREEN = "\033[92m" if sys.platform != "win32" else ""
    YELLOW = "\033[93m" if sys.platform != "win32" else ""
    RED = "\033[91m" if sys.platform != "win32" else ""
    BLUE = "\033[94m" if sys.platform != "win32" else ""
    BOLD = "\033[1m" if sys.platform != "win32" else ""
    END = "\033[0m" if sys.platform != "win32" else ""

def log_step(step_name):
    print(f"\n{Colors.BOLD}{Colors.BLUE}[+] STEP: {step_name}{Colors.END}")

def log_success(msg):
    print(f"{Colors.GREEN}[OK] SUCCESS: {msg}{Colors.END}")

def log_warn(msg):
    print(f"{Colors.YELLOW}[WARN] WARNING: {msg}{Colors.END}")

def log_error(msg):
    print(f"{Colors.RED}[FAIL] ERROR: {msg}{Colors.END}")

def run_command(cmd, cwd=None, env=None):
    """Run shell command and return (returncode, stdout, stderr)"""
    try:
        res = subprocess.run(
            cmd,
            cwd=cwd or PROJECT_DIR,
            env=env or os.environ.copy(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=True
        )
        return res.returncode, res.stdout.strip(), res.stderr.strip()
    except Exception as e:
        return 1, "", str(e)

def check_prerequisites():
    log_step("Checking System Prerequisites (Node.js, npm, Git)")
    report = {}

    # Check Git
    code, out, err = run_command("git --version")
    if code == 0:
        log_success(f"Git detected: {out}")
        report['git'] = {'status': 'OK', 'version': out}
    else:
        log_error("Git is NOT installed or not on PATH.")
        report['git'] = {'status': 'FAILED', 'error': err}

    # Check Node.js
    code, out, err = run_command("node --version")
    if code == 0:
        log_success(f"Node.js detected: {out}")
        report['node'] = {'status': 'OK', 'version': out}
    else:
        log_error("Node.js is NOT installed. Please install Node.js v20+ from https://nodejs.org/")
        report['node'] = {'status': 'FAILED', 'error': err}

    # Check npm
    code, out, err = run_command("npm --version")
    if code == 0:
        log_success(f"npm detected: {out}")
        report['npm'] = {'status': 'OK', 'version': out}
    else:
        log_error("npm is NOT installed.")
        report['npm'] = {'status': 'FAILED', 'error': err}

    return report

def setup_repository():
    log_step("Verifying Repository Directory")
    package_json = PROJECT_DIR / "package.json"

    if package_json.exists():
        log_success(f"Verified valid jinxunlashed project directory at {PROJECT_DIR}")
        return True, "Existing local repository verified."
    
    log_warn("Project root not detected locally. Attempting fallback git clone...")
    code, out, err = run_command(f"git clone {REPO_URL} jinxunlashed")
    if code == 0:
        log_success(f"Cloned repository to {PROJECT_DIR / 'jinxunlashed'}")
        return True, "Repository cloned successfully."
    else:
        log_error(f"Git clone failed: {err}")
        return False, f"Git clone failed: {err}"

def install_dependencies():
    log_step("Installing Monorepo Dependencies (npm install)")
    code, out, err = run_command("npm install")

    if code == 0:
        log_success("npm install completed cleanly.")
        return True, "Dependencies installed standard."
    
    log_warn(f"Standard 'npm install' failed. Activating Fallback 1: '--legacy-peer-deps'...")
    code_fb, out_fb, err_fb = run_command("npm install --legacy-peer-deps")

    if code_fb == 0:
        log_success("Fallback 1 ('npm install --legacy-peer-deps') succeeded.")
        return True, "Dependencies installed with fallback --legacy-peer-deps."

    log_warn(f"Fallback 1 failed. Activating Fallback 2: Step-by-step workspace package linking...")
    packages = ["packages/schema", "packages/protocol", "packages/workflow-engine", "packages/browser-engine", "apps/extension", "apps/server", "apps/web"]
    failed_pkgs = []
    
    for pkg in packages:
        pkg_path = PROJECT_DIR / pkg
        if pkg_path.exists():
            c, o, e = run_command("npm install", cwd=pkg_path)
            if c != 0:
                failed_pkgs.append((pkg, e))

    if not failed_pkgs:
        log_success("Fallback 2 step-by-step workspace package linking succeeded.")
        return True, "Dependencies installed via step-by-step fallback."
    else:
        log_error(f"Fallback 2 failed for packages: {failed_pkgs}")
        return False, f"Dependency installation failed: {err_fb}"

def install_playwright():
    log_step("Installing Playwright Chromium Browser Binaries")
    code, out, err = run_command("npx playwright install chromium")

    if code == 0:
        log_success("Playwright Chromium browser installed successfully.")
        return True, "Playwright Chromium installed."

    log_warn(f"Standard Playwright install failed: {err}. Attempting fallback with system dependencies...")
    code_fb, out_fb, err_fb = run_command("npx playwright install chromium --with-deps")

    if code_fb == 0:
        log_success("Fallback Playwright install (--with-deps) succeeded.")
        return True, "Playwright Chromium installed via fallback --with-deps."
    else:
        log_warn(f"Playwright browser download warning: {err_fb}. Playwright will attempt on-demand download during runtime.")
        return True, "Playwright install skipped with fallback warning."

def build_workspaces():
    log_step("Compiling Monorepo Workspaces (npm run build --workspaces)")
    code, out, err = run_command("npm run build --workspaces")

    if code == 0:
        log_success("All workspace packages built successfully.")
        return True, "Monorepo build completed."

    log_warn(f"Monorepo workspace build failed: {err}. Activating Fallback: Sequential build order...")
    build_sequence = [
        "packages/schema",
        "packages/protocol",
        "packages/workflow-engine",
        "packages/browser-engine",
        "apps/extension",
        "apps/server",
        "apps/web"
    ]

    failed_builds = []
    for pkg in build_sequence:
        pkg_path = PROJECT_DIR / pkg
        if pkg_path.exists():
            c, o, e = run_command("npm run build", cwd=pkg_path)
            if c == 0:
                log_success(f"Sequentially built {pkg}")
            else:
                log_error(f"Sequential build failed for {pkg}: {e}")
                failed_builds.append((pkg, e))

    if not failed_builds:
        log_success("Sequential fallback build completed successfully.")
        return True, "Sequential fallback build completed."
    else:
        return False, f"Workspace build failed for: {failed_builds}"

def generate_report(prereqs, repo_res, deps_res, pw_res, build_res):
    log_step("Guices.ai Installation & Diagnostic Health Report")
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    overall_success = all([
        prereqs.get('git', {}).get('status') == 'OK',
        prereqs.get('node', {}).get('status') == 'OK',
        prereqs.get('npm', {}).get('status') == 'OK',
        repo_res[0],
        deps_res[0],
        build_res[0]
    ])

    report_lines = [
        "=" * 65,
        "          GUICES.AI (JINXUNLASHED) SETUP DIAGNOSTIC REPORT",
        "=" * 65,
        f"Timestamp: {timestamp}",
        f"OS Platform: {platform.system()} {platform.release()} ({platform.machine()})",
        f"Overall Status: {'HEALTHY - READY TO RUN' if overall_success else 'UNHEALTHY - ATTENTION REQUIRED'}",
        "-" * 65,
        "[PREREQUISITES]",
        f"  - Git:   {prereqs.get('git', {}).get('status')} ({prereqs.get('git', {}).get('version', 'N/A')})",
        f"  - Node:  {prereqs.get('node', {}).get('status')} ({prereqs.get('node', {}).get('version', 'N/A')})",
        f"  - npm:   {prereqs.get('npm', {}).get('status')} ({prereqs.get('npm', {}).get('version', 'N/A')})",
        "-" * 65,
        "[SETUP STEPS]",
        f"  - Repository Verification: {'SUCCESS' if repo_res[0] else 'FAILED'} - {repo_res[1]}",
        f"  - Dependency Installation: {'SUCCESS' if deps_res[0] else 'FAILED'} - {deps_res[1]}",
        f"  - Playwright Chromium:     {'SUCCESS' if pw_res[0] else 'FAILED'} - {pw_res[1]}",
        f"  - Monorepo Compilation:    {'SUCCESS' if build_res[0] else 'FAILED'} - {build_res[1]}",
        "=" * 65
    ]

    report_str = "\n".join(report_lines)
    print(f"\n{Colors.BOLD}{report_str}{Colors.END}\n")

    # Write report to file
    report_file = PROJECT_DIR / "installation_report.log"
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(report_str)

    log_success(f"Diagnostic report written to: {report_file}")

    if overall_success:
        print(f"\n{Colors.BOLD}{Colors.GREEN}NEXT STEPS TO RUN GUICES.AI:{Colors.END}")
        print(f"  1. Start Gateway Server: {Colors.BOLD}npm run dev:server{Colors.END} (Runs on http://localhost:4000)")
        print(f"  2. Start Web Workspace:  {Colors.BOLD}npm run dev:web{Colors.END}    (Runs on http://localhost:3000)")
        print(f"  3. Extension Setup:      Load unpacked '{PROJECT_DIR / 'apps' / 'extension'}' in chrome://extensions/\n")
    else:
        print(f"\n{Colors.BOLD}{Colors.RED}ATTENTION REQUIRED: Check error logs in {report_file}{Colors.END}\n")

def main():
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("=" * 65)
    print("        GUICES.AI AUTOMATED SETUP & FALLBACK INSTALLER")
    print("=" * 65)
    print(f"{Colors.END}")

    prereqs = check_prerequisites()
    
    if prereqs.get('node', {}).get('status') != 'OK':
        log_error("Node.js is missing. Installation cannot proceed until Node.js is installed.")
        sys.exit(1)

    repo_res = setup_repository()
    deps_res = install_dependencies() if repo_res[0] else (False, "Skipped due to repo error.")
    pw_res = install_playwright() if deps_res[0] else (False, "Skipped due to dependency error.")
    build_res = build_workspaces() if deps_res[0] else (False, "Skipped due to dependency error.")

    generate_report(prereqs, repo_res, deps_res, pw_res, build_res)

if __name__ == "__main__":
    main()
