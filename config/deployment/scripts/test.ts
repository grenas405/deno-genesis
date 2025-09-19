#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net
/**
 * Universal LazyVim + Deno Setup Script
 * 
 * Philosophy: One executable, clear configuration, runs anywhere
 * 
 * This script embodies Unix Philosophy principles:
 * 1. Do One Thing Well: Set up LazyVim for Deno development
 * 2. Make Everything a Filter: Accept system state, transform to target state
 * 3. Avoid Captive UI: Return structured data, work programmatically
 * 4. Store Data in Flat Text: Human-readable configs, version controllable
 * 5. Leverage Software: Compose with existing tools (git, curl, package managers)
 * 
 * Usage:
 *   deno run -A setup-lazyvim-deno.ts
 *   deno run -A setup-lazyvim-deno.ts --check    # Dry run
 *   deno run -A setup-lazyvim-deno.ts --verbose  # Detailed output
 */

// ========================================================
// TYPES & INTERFACES - Following Unix Philosophy
// ========================================================

interface SystemInfo {
  os: 'linux' | 'darwin' | 'windows';
  arch: 'x86_64' | 'aarch64';
  distro?: LinuxDistro;
  shell: string;
  homeDir: string;
  configDir: string;
}

interface LinuxDistro {
  id: string;
  name: string;
  packageManager: 'apt' | 'yum' | 'dnf' | 'pacman' | 'zypper' | 'apk' | 'snap' | 'flatpak';
  version?: string;
}

interface InstallationStep {
  name: string;
  description: string;
  required: boolean;
  check: () => Promise<boolean>;
  install: () => Promise<void>;
  postInstall?: () => Promise<void>;
}

interface SetupResult {
  success: boolean;
  steps: { [key: string]: boolean };
  errors: string[];
  warnings: string[];
  nextSteps: string[];
  systemInfo: SystemInfo;
  timestamp: string;
}

// ========================================================
// SYSTEM DETECTION - Unix Philosophy: Make Everything a Filter
// ========================================================

async function detectSystem(): Promise<SystemInfo> {
  const os = Deno.build.os;
  const arch = Deno.build.arch;
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "/tmp";
  
  let configDir: string;
  if (os === "windows") {
    configDir = Deno.env.get("LOCALAPPDATA") || `${homeDir}\\AppData\\Local`;
  } else {
    configDir = `${homeDir}/.config`;
  }

  const shell = Deno.env.get("SHELL") || "/bin/bash";
  
  const systemInfo: SystemInfo = {
    os: os as 'linux' | 'darwin' | 'windows',
    arch: arch as 'x86_64' | 'aarch64',
    shell,
    homeDir,
    configDir,
  };

  // Detect Linux distribution
  if (os === "linux") {
    systemInfo.distro = await detectLinuxDistro();
  }

  return systemInfo;
}

async function detectLinuxDistro(): Promise<LinuxDistro> {
  // Try multiple methods to detect distribution
  const methods = [
    () => readOSRelease(),
    () => readLsbRelease(),
    () => detectByPackageManager(),
  ];

  for (const method of methods) {
    try {
      const distro = await method();
      if (distro) return distro;
    } catch {
      // Continue to next method
    }
  }

  // Fallback
  return {
    id: 'unknown',
    name: 'Unknown Linux',
    packageManager: 'apt', // Default fallback
  };
}

async function readOSRelease(): Promise<LinuxDistro | null> {
  try {
    const content = await Deno.readTextFile('/etc/os-release');
    const lines = content.split('\n');
    let id = '';
    let name = '';
    let version = '';

    for (const line of lines) {
      if (line.startsWith('ID=')) {
        id = line.split('=')[1].replace(/"/g, '');
      } else if (line.startsWith('NAME=')) {
        name = line.split('=')[1].replace(/"/g, '');
      } else if (line.startsWith('VERSION_ID=')) {
        version = line.split('=')[1].replace(/"/g, '');
      }
    }

    return {
      id,
      name,
      version,
      packageManager: getPackageManager(id),
    };
  } catch {
    return null;
  }
}

async function readLsbRelease(): Promise<LinuxDistro | null> {
  try {
    const cmd = new Deno.Command("lsb_release", { args: ["-a"] });
    const output = await cmd.output();
    
    if (output.code !== 0) return null;
    
    const content = new TextDecoder().decode(output.stdout);
    const lines = content.split('\n');
    
    let id = '';
    let name = '';
    let version = '';

    for (const line of lines) {
      if (line.includes('Distributor ID:')) {
        id = line.split(':')[1].trim().toLowerCase();
      } else if (line.includes('Description:')) {
        name = line.split(':')[1].trim();
      } else if (line.includes('Release:')) {
        version = line.split(':')[1].trim();
      }
    }

    return {
      id,
      name,
      version,
      packageManager: getPackageManager(id),
    };
  } catch {
    return null;
  }
}

async function detectByPackageManager(): Promise<LinuxDistro | null> {
  const managers = [
    { cmd: 'apt', distro: 'debian', name: 'Debian-based' },
    { cmd: 'yum', distro: 'rhel', name: 'RHEL-based' },
    { cmd: 'dnf', distro: 'fedora', name: 'Fedora-based' },
    { cmd: 'pacman', distro: 'arch', name: 'Arch-based' },
    { cmd: 'zypper', distro: 'opensuse', name: 'openSUSE' },
    { cmd: 'apk', distro: 'alpine', name: 'Alpine Linux' },
  ];

  for (const manager of managers) {
    try {
      const cmd = new Deno.Command("which", { args: [manager.cmd] });
      const output = await cmd.output();
      
      if (output.code === 0) {
        return {
          id: manager.distro,
          name: manager.name,
          packageManager: manager.cmd as LinuxDistro['packageManager'],
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}

function getPackageManager(distroId: string): LinuxDistro['packageManager'] {
  const packageManagerMap: Record<string, LinuxDistro['packageManager']> = {
    'ubuntu': 'apt',
    'debian': 'apt',
    'mint': 'apt',
    'kali': 'apt',
    'pop': 'apt',
    'elementary': 'apt',
    'rhel': 'yum',
    'centos': 'yum',
    'fedora': 'dnf',
    'opensuse': 'zypper',
    'opensuse-leap': 'zypper',
    'opensuse-tumbleweed': 'zypper',
    'arch': 'pacman',
    'manjaro': 'pacman',
    'alpine': 'apk',
  };

  return packageManagerMap[distroId] || 'apt';
}

// ========================================================
// INSTALLATION STEPS - Unix Philosophy: Do One Thing Well
// ========================================================

async function createInstallationSteps(systemInfo: SystemInfo): Promise<InstallationStep[]> {
  return [
    {
      name: "deno",
      description: "Deno runtime and toolchain",
      required: true,
      check: () => checkCommand("deno"),
      install: () => installDeno(systemInfo),
    },
    {
      name: "git",
      description: "Git version control system",
      required: true,
      check: () => checkCommand("git"),
      install: () => installPackage("git", systemInfo),
    },
    {
      name: "neovim",
      description: "Neovim editor (0.10.0+)",
      required: true,
      check: () => checkNeovim(),
      install: () => installNeovim(systemInfo),
    },
    {
      name: "build-tools",
      description: "Build essential tools and compilers",
      required: true,
      check: () => checkBuildTools(systemInfo),
      install: () => installBuildTools(systemInfo),
    },
    {
      name: "ripgrep",
      description: "Fast text search utility",
      required: true,
      check: () => checkCommand("rg"),
      install: () => installPackage("ripgrep", systemInfo),
    },
    {
      name: "fd",
      description: "Modern alternative to find",
      required: true,
      check: () => checkCommand("fd") || checkCommand("fdfind"),
      install: () => installFd(systemInfo),
    },
    {
      name: "fzf",
      description: "Fuzzy finder for command line",
      required: true,
      check: () => checkCommand("fzf"),
      install: () => installPackage("fzf", systemInfo),
    },
    {
      name: "backup-nvim",
      description: "Backup existing Neovim configuration",
      required: false,
      check: () => checkNvimConfigExists(systemInfo),
      install: () => backupNvimConfig(systemInfo),
    },
    {
      name: "lazyvim",
      description: "Install LazyVim starter configuration",
      required: true,
      check: () => Promise.resolve(false), // Always install LazyVim
      install: () => installLazyVim(systemInfo),
      postInstall: () => configureLazyVimForDeno(systemInfo),
    },
  ];
}

// ========================================================
// UTILITY FUNCTIONS
// ========================================================

async function checkCommand(command: string): Promise<boolean> {
  try {
    const cmd = new Deno.Command("which", { args: [command] });
    const output = await cmd.output();
    return output.code === 0;
  } catch {
    return false;
  }
}

async function checkNeovim(): Promise<boolean> {
  try {
    const cmd = new Deno.Command("nvim", { args: ["--version"] });
    const output = await cmd.output();
    
    if (output.code !== 0) return false;
    
    const version = new TextDecoder().decode(output.stdout);
    const match = version.match(/NVIM v(\d+)\.(\d+)\.(\d+)/);
    
    if (!match) return false;
    
    const [, major, minor] = match;
    const majorNum = parseInt(major);
    const minorNum = parseInt(minor);
    
    // Require Neovim 0.10.0+
    return majorNum > 0 || (majorNum === 0 && minorNum >= 10);
  } catch {
    return false;
  }
}

async function checkBuildTools(systemInfo: SystemInfo): Promise<boolean> {
  if (systemInfo.os === 'windows') {
    // Check for basic Windows build tools
    return await checkCommand("cl") || await checkCommand("gcc");
  }
  
  // Check for common build tools on Unix systems
  const tools = ['gcc', 'make'];
  for (const tool of tools) {
    if (!(await checkCommand(tool))) {
      return false;
    }
  }
  return true;
}

async function checkNvimConfigExists(systemInfo: SystemInfo): Promise<boolean> {
  const nvimConfigPath = `${systemInfo.configDir}/nvim`;
  try {
    const stat = await Deno.stat(nvimConfigPath);
    return stat.isDirectory;
  } catch {
    return false;
  }
}

// ========================================================
// INSTALLATION FUNCTIONS
// ========================================================

async function installDeno(systemInfo: SystemInfo): Promise<void> {
  console.log("📦 Installing Deno...");
  
  if (systemInfo.os === 'windows') {
    const cmd = new Deno.Command("powershell", {
      args: ["-Command", "irm https://deno.land/install.ps1 | iex"],
    });
    await cmd.output();
  } else {
    const cmd = new Deno.Command("curl", {
      args: ["-fsSL", "https://deno.land/install.sh"],
    });
    const curlOutput = await cmd.output();
    
    if (curlOutput.code === 0) {
      const installScript = new TextDecoder().decode(curlOutput.stdout);
      const bashCmd = new Deno.Command("bash", {
        args: ["-c", installScript],
      });
      await bashCmd.output();
    }
  }
  
  // Add Deno to PATH in shell profile
  await addToPath("$HOME/.deno/bin", systemInfo);
}

async function installNeovim(systemInfo: SystemInfo): Promise<void> {
  console.log("📦 Installing Neovim...");
  
  if (systemInfo.os === 'linux' && systemInfo.distro) {
    // Try to get latest version via AppImage or snap first
    if (await checkCommand("snap")) {
      const cmd = new Deno.Command("sudo", {
        args: ["snap", "install", "nvim", "--classic"],
      });
      const result = await cmd.output();
      if (result.code === 0) return;
    }
    
    // Fallback to package manager
    await installPackage("neovim", systemInfo);
    
    // Check if version is sufficient, if not, try to upgrade
    if (!(await checkNeovim())) {
      console.log("⚠️  Package manager version might be outdated, trying AppImage...");
      await installNeovimAppImage(systemInfo);
    }
  } else if (systemInfo.os === 'darwin') {
    if (await checkCommand("brew")) {
      const cmd = new Deno.Command("brew", { args: ["install", "neovim"] });
      await cmd.output();
    } else {
      console.log("⚠️  Please install Homebrew first, then run: brew install neovim");
    }
  } else {
    await installPackage("neovim", systemInfo);
  }
}

async function installNeovimAppImage(systemInfo: SystemInfo): Promise<void> {
  try {
    const nvimPath = "/usr/local/bin/nvim";
    
    // Download AppImage
    const downloadCmd = new Deno.Command("curl", {
      args: [
        "-LO",
        "https://github.com/neovim/neovim/releases/latest/download/nvim.appimage"
      ],
    });
    await downloadCmd.output();
    
    // Make executable and move to system path
    const chmodCmd = new Deno.Command("chmod", { args: ["+x", "nvim.appimage"] });
    await chmodCmd.output();
    
    const mvCmd = new Deno.Command("sudo", {
      args: ["mv", "nvim.appimage", nvimPath],
    });
    await mvCmd.output();
    
    console.log("✅ Neovim AppImage installed successfully");
  } catch (error) {
    console.log("❌ Failed to install Neovim AppImage:", error);
  }
}

async function installBuildTools(systemInfo: SystemInfo): Promise<void> {
  console.log("📦 Installing build tools...");
  
  if (systemInfo.os === 'linux' && systemInfo.distro) {
    switch (systemInfo.distro.packageManager) {
      case 'apt':
        await runCommand("sudo", ["apt", "update"]);
        await runCommand("sudo", ["apt", "install", "-y", "build-essential"]);
        break;
      case 'yum':
        await runCommand("sudo", ["yum", "groupinstall", "-y", "Development Tools"]);
        break;
      case 'dnf':
        await runCommand("sudo", ["dnf", "groupinstall", "-y", "Development Tools"]);
        break;
      case 'pacman':
        await runCommand("sudo", ["pacman", "-S", "--noconfirm", "base-devel"]);
        break;
      case 'zypper':
        await runCommand("sudo", ["zypper", "install", "-y", "gcc", "make"]);
        break;
      case 'apk':
        await runCommand("sudo", ["apk", "add", "gcc", "make", "musl-dev"]);
        break;
    }
  } else if (systemInfo.os === 'darwin') {
    // Xcode command line tools
    const cmd = new Deno.Command("xcode-select", { args: ["--install"] });
    await cmd.output();
  }
}

async function installPackage(packageName: string, systemInfo: SystemInfo): Promise<void> {
  console.log(`📦 Installing ${packageName}...`);
  
  if (systemInfo.os === 'linux' && systemInfo.distro) {
    const packageMap: Record<string, Record<string, string>> = {
      'ripgrep': {
        'apt': 'ripgrep',
        'yum': 'ripgrep',
        'dnf': 'ripgrep',
        'pacman': 'ripgrep',
        'zypper': 'ripgrep',
        'apk': 'ripgrep',
      },
      'fzf': {
        'apt': 'fzf',
        'yum': 'fzf',
        'dnf': 'fzf',
        'pacman': 'fzf',
        'zypper': 'fzf',
        'apk': 'fzf',
      },
      'git': {
        'apt': 'git',
        'yum': 'git',
        'dnf': 'git',
        'pacman': 'git',
        'zypper': 'git',
        'apk': 'git',
      },
      'neovim': {
        'apt': 'neovim',
        'yum': 'neovim',
        'dnf': 'neovim',
        'pacman': 'neovim',
        'zypper': 'neovim',
        'apk': 'neovim',
      },
    };

    const actualPackage = packageMap[packageName]?.[systemInfo.distro.packageManager] || packageName;
    
    switch (systemInfo.distro.packageManager) {
      case 'apt':
        await runCommand("sudo", ["apt", "update"]);
        await runCommand("sudo", ["apt", "install", "-y", actualPackage]);
        break;
      case 'yum':
        await runCommand("sudo", ["yum", "install", "-y", actualPackage]);
        break;
      case 'dnf':
        await runCommand("sudo", ["dnf", "install", "-y", actualPackage]);
        break;
      case 'pacman':
        await runCommand("sudo", ["pacman", "-S", "--noconfirm", actualPackage]);
        break;
      case 'zypper':
        await runCommand("sudo", ["zypper", "install", "-y", actualPackage]);
        break;
      case 'apk':
        await runCommand("sudo", ["apk", "add", actualPackage]);
        break;
    }
  } else if (systemInfo.os === 'darwin') {
    if (await checkCommand("brew")) {
      await runCommand("brew", ["install", packageName]);
    } else {
      console.log("⚠️  Please install Homebrew first");
    }
  }
}

async function installFd(systemInfo: SystemInfo): Promise<void> {
  if (systemInfo.os === 'linux' && systemInfo.distro?.packageManager === 'apt') {
    // On Debian/Ubuntu, the package is named 'fd-find'
    await installPackage('fd-find', systemInfo);
    
    // Create symlink if needed
    if (!(await checkCommand('fd')) && await checkCommand('fdfind')) {
      try {
        const symlinkDir = `${systemInfo.homeDir}/.local/bin`;
        await Deno.mkdir(symlinkDir, { recursive: true });
        
        const cmd = new Deno.Command("ln", {
          args: ["-sf", "/usr/bin/fdfind", `${symlinkDir}/fd`],
        });
        await cmd.output();
        
        // Add to PATH
        await addToPath(`${systemInfo.homeDir}/.local/bin`, systemInfo);
      } catch (error) {
        console.log("⚠️  Could not create fd symlink:", error);
      }
    }
  } else {
    await installPackage('fd', systemInfo);
  }
}

async function backupNvimConfig(systemInfo: SystemInfo): Promise<void> {
  console.log("🔄 Backing up existing Neovim configuration...");
  
  const nvimConfigPath = `${systemInfo.configDir}/nvim`;
  const backupPath = `${nvimConfigPath}.backup.${Date.now()}`;
  
  try {
    await Deno.rename(nvimConfigPath, backupPath);
    console.log(`✅ Backed up existing config to: ${backupPath}`);
  } catch (error) {
    console.log("⚠️  Could not backup config:", error);
  }
  
  // Also backup data directories
  const paths = [
    `${systemInfo.homeDir}/.local/share/nvim`,
    `${systemInfo.homeDir}/.local/state/nvim`,
    `${systemInfo.homeDir}/.cache/nvim`,
  ];
  
  for (const path of paths) {
    try {
      await Deno.rename(path, `${path}.backup.${Date.now()}`);
    } catch {
      // Path might not exist, continue
    }
  }
}

async function installLazyVim(systemInfo: SystemInfo): Promise<void> {
  console.log("🚀 Installing LazyVim starter configuration...");
  
  const nvimConfigPath = `${systemInfo.configDir}/nvim`;
  
  // Ensure config directory exists
  await Deno.mkdir(systemInfo.configDir, { recursive: true });
  
  // Clone LazyVim starter
  const cloneCmd = new Deno.Command("git", {
    args: [
      "clone",
      "https://github.com/LazyVim/starter",
      nvimConfigPath,
    ],
  });
  
  const result = await cloneCmd.output();
  if (result.code !== 0) {
    throw new Error("Failed to clone LazyVim starter");
  }
  
  // Remove .git directory
  try {
    await Deno.remove(`${nvimConfigPath}/.git`, { recursive: true });
  } catch {
    // Directory might not exist
  }
  
  console.log("✅ LazyVim starter installed");
}

async function configureLazyVimForDeno(systemInfo: SystemInfo): Promise<void> {
  console.log("🔧 Configuring LazyVim for Deno development...");
  
  const nvimConfigPath = `${systemInfo.configDir}/nvim`;
  const luaPluginsPath = `${nvimConfigPath}/lua/plugins`;
  
  // Ensure plugins directory exists
  await Deno.mkdir(luaPluginsPath, { recursive: true });
  
  // Create Deno-specific configuration
  const denoConfig = `return {
  -- Configure nvim-lspconfig for Deno
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        -- Enable Deno LSP
        denols = {
          enabled = true,
          -- Only activate for projects with deno.json/deno.jsonc
          root_dir = function(filename)
            return require("lspconfig.util").root_pattern("deno.json", "deno.jsonc")(filename)
          end,
          settings = {
            deno = {
              enable = true,
              lint = true,
              unstable = false,
              codeLens = {
                implementations = true,
                references = true,
                referencesAllFunctions = true,
                test = true,
              },
              suggest = {
                completeFunctionCalls = true,
                names = true,
                paths = true,
                autoImports = true,
                imports = {
                  hosts = {
                    ["https://deno.land"] = true,
                    ["https://cdn.nest.land"] = true,
                    ["https://esm.sh"] = true,
                  },
                },
              },
              inlayHints = {
                parameterNames = { enabled = "all" },
                parameterTypes = { enabled = true },
                variableTypes = { enabled = true },
                propertyDeclarationTypes = { enabled = true },
                functionLikeReturnTypes = { enabled = true },
                enumMemberValues = { enabled = true },
              },
            },
          },
        },
        -- Prevent conflicts: disable TypeScript LSP in Deno projects
        ts_ls = {
          root_dir = function(filename)
            local deno_root = require("lspconfig.util").root_pattern("deno.json", "deno.jsonc")(filename)
            if deno_root then
              return nil
            end
            return require("lspconfig.util").root_pattern("package.json", "tsconfig.json")(filename)
          end,
          single_file_support = false,
        },
      },
    },
  },
  
  -- Configure formatting with Deno's built-in formatter
  {
    "stevearc/conform.nvim",
    opts = {
      formatters_by_ft = {
        javascript = { "deno_fmt" },
        typescript = { "deno_fmt" },
        javascriptreact = { "deno_fmt" },
        typescriptreact = { "deno_fmt" },
        json = { "deno_fmt" },
        jsonc = { "deno_fmt" },
        markdown = { "deno_fmt" },
      },
      formatters = {
        deno_fmt = {
          command = "deno",
          args = { "fmt", "--ext", "ts,tsx,js,jsx,json,jsonc,md", "-" },
          stdin = true,
        },
      },
      format_on_save = {
        timeout_ms = 2000,
        lsp_fallback = true,
      },
    },
  },
  
  -- Configure linting
  {
    "mfussenegger/nvim-lint",
    opts = {
      linters_by_ft = {
        javascript = { "deno_lint" },
        typescript = { "deno_lint" },
        javascriptreact = { "deno_lint" },
        typescriptreact = { "deno_lint" },
      },
    },
  },
}`;

  await Deno.writeTextFile(`${luaPluginsPath}/deno.lua`, denoConfig);
  
  // Create keymaps for Deno
  const keymapsPath = `${nvimConfigPath}/lua/config`;
  await Deno.mkdir(keymapsPath, { recursive: true });
  
  const denoKeymaps = `-- Deno-specific keybindings
local function map(mode, lhs, rhs, opts)
  opts = opts or {}
  opts.silent = opts.silent ~= false
  vim.keymap.set(mode, lhs, rhs, opts)
end

-- Deno commands (only active in Deno projects)
vim.api.nvim_create_autocmd("FileType", {
  pattern = { "typescript", "javascript", "typescriptreact", "javascriptreact" },
  callback = function()
    -- Check if we're in a Deno project
    local root = vim.fn.getcwd()
    if vim.fn.filereadable(root .. "/deno.json") == 1 or vim.fn.filereadable(root .. "/deno.jsonc") == 1 then
      map("n", "<leader>dt", ":!deno test<CR>", { desc = "Run Deno tests" })
      map("n", "<leader>df", ":!deno fmt %<CR>", { desc = "Format with Deno" })
      map("n", "<leader>dl", ":!deno lint %<CR>", { desc = "Lint with Deno" })
      map("n", "<leader>dc", ":!deno cache %<CR>", { desc = "Cache dependencies" })
      map("n", "<leader>di", ":!deno info %<CR>", { desc = "Show Deno info" })
      map("n", "<leader>dr", vim.lsp.codelens.run, { desc = "Run code lens action" })
    end
  end,
})`;

  await Deno.writeTextFile(`${nvimConfigPath}/lua/config/deno-keymaps.lua`, denoKeymaps);
  
  console.log("✅ Deno configuration files created");
}

// ========================================================
// UTILITY FUNCTIONS
// ========================================================

async function runCommand(command: string, args: string[]): Promise<void> {
  const cmd = new Deno.Command(command, { args });
  const result = await cmd.output();
  
  if (result.code !== 0) {
    const stderr = new TextDecoder().decode(result.stderr);
    throw new Error(`Command failed: ${command} ${args.join(' ')}\n${stderr}`);
  }
}

async function addToPath(pathToAdd: string, systemInfo: SystemInfo): Promise<void> {
  const shells = ['.bashrc', '.zshrc', '.profile'];
  const exportLine = `export PATH="$PATH:${pathToAdd}"`;
  
  for (const shell of shells) {
    const shellPath = `${systemInfo.homeDir}/${shell}`;
    try {
      let content = '';
      try {
        content = await Deno.readTextFile(shellPath);
      } catch {
        // File doesn't exist, create it
        content = '';
      }
      
      if (!content.includes(pathToAdd)) {
        content += `\n# Added by LazyVim Deno Setup\n${exportLine}\n`;
        await Deno.writeTextFile(shellPath, content);
        console.log(`✅ Added ${pathToAdd} to PATH in ${shell}`);
      }
    } catch {
      // Skip if we can't write to this shell config
    }
  }
}

// ========================================================
// MAIN EXECUTION - Unix Philosophy: Avoid Captive UI
// ========================================================

async function main(): Promise<void> {
  const args = Deno.args;
  const isCheck = args.includes('--check');
  const isVerbose = args.includes('--verbose');
  
  console.log("🚀 Universal LazyVim + Deno Setup Script");
  console.log("📋 Following Unix Philosophy: One executable, clear configuration, runs anywhere\n");
  
  const result: SetupResult = {
    success: false,
    steps: {},
    errors: [],
    warnings: [],
    nextSteps: [],
    systemInfo: await detectSystem(),
    timestamp: new Date().toISOString(),
  };
  
  if (isVerbose) {
    console.log("🔍 System Information:");
    console.log(`   OS: ${result.systemInfo.os} (${result.systemInfo.arch})`);
    if (result.systemInfo.distro) {
      console.log(`   Distro: ${result.systemInfo.distro.name} (${result.systemInfo.distro.id})`);
      console.log(`   Package Manager: ${result.systemInfo.distro.packageManager}`);
    }
    console.log(`   Home: ${result.systemInfo.homeDir}`);
    console.log(`   Config: ${result.systemInfo.configDir}`);
    console.log(`   Shell: ${result.systemInfo.shell}\n`);
  }
  
  const steps = await createInstallationSteps(result.systemInfo);
  
  if (isCheck) {
    console.log("🔍 DRY RUN - Checking system requirements...\n");
  }
  
  for (const step of steps) {
    const stepName = step.name;
    console.log(`📋 ${step.description}...`);
    
    try {
      const isInstalled = await step.check();
      
      if (isInstalled) {
        console.log(`✅ ${stepName}: Already installed`);
        result.steps[stepName] = true;
      } else {
        if (isCheck) {
          console.log(`❌ ${stepName}: Not installed (would install)`);
          result.steps[stepName] = false;
        } else {
          console.log(`🔄 ${stepName}: Installing...`);
          await step.install();
          
          // Verify installation
          const verifyInstalled = await step.check();
          if (verifyInstalled) {
            console.log(`✅ ${stepName}: Successfully installed`);
            result.steps[stepName] = true;
            
            // Run post-install if available
            if (step.postInstall) {
              await step.postInstall();
            }
          } else {
            throw new Error(`Installation verification failed for ${stepName}`);
          }
        }
      }
    } catch (error) {
      const errorMsg = `${stepName}: ${error.message}`;
      console.log(`❌ ${errorMsg}`);
      
      if (step.required) {
        result.errors.push(errorMsg);
      } else {
        result.warnings.push(errorMsg);
      }
      
      result.steps[stepName] = false;
    }
    
    console.log(); // Empty line for readability
  }
  
  // Generate next steps
  result.nextSteps = generateNextSteps(result);
  
  // Determine overall success
  const requiredSteps = steps.filter(s => s.required);
  const requiredSuccess = requiredSteps.every(s => result.steps[s.name]);
  result.success = requiredSuccess;
  
  // Display final results
  displayResults(result, isCheck);
  
  // Write results to file for programmatic use (Unix Philosophy: Store Data in Flat Text)
  await writeResultsFile(result);
  
  if (!result.success) {
    Deno.exit(1);
  }
}

function generateNextSteps(result: SetupResult): string[] {
  const nextSteps: string[] = [];
  
  if (result.success) {
    nextSteps.push("🎉 Setup completed successfully!");
    nextSteps.push("📂 Create a new Deno project: mkdir my-deno-project && cd my-deno-project");
    nextSteps.push("📄 Create deno.json configuration file");
    nextSteps.push("🚀 Start Neovim: nvim .");
    nextSteps.push("⚡ Let LazyVim install plugins (first launch takes 2-3 minutes)");
    nextSteps.push("🔍 Run :LazyHealth to verify everything is working");
    nextSteps.push("📚 Check out the LazyVim documentation: https://lazyvim.github.io");
  } else {
    nextSteps.push("❌ Setup incomplete - please resolve the errors above");
    if (result.errors.length > 0) {
      nextSteps.push("🔧 Required components failed to install:");
      result.errors.forEach(error => nextSteps.push(`   - ${error}`));
    }
    if (result.warnings.length > 0) {
      nextSteps.push("⚠️  Optional components had issues:");
      result.warnings.forEach(warning => nextSteps.push(`   - ${warning}`));
    }
  }
  
  return nextSteps;
}

function displayResults(result: SetupResult, isCheck: boolean): void {
  console.log("=" * 60);
  console.log(isCheck ? "🔍 DRY RUN RESULTS" : "🎯 SETUP RESULTS");
  console.log("=" * 60);
  
  console.log(`📊 Status: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);
  console.log(`⏰ Timestamp: ${result.timestamp}`);
  console.log(`🖥️  System: ${result.systemInfo.os} ${result.systemInfo.arch}`);
  
  console.log("\n📋 Component Status:");
  for (const [step, status] of Object.entries(result.steps)) {
    const icon = status ? "✅" : "❌";
    console.log(`   ${icon} ${step}`);
  }
  
  if (result.errors.length > 0) {
    console.log("\n❌ Errors:");
    result.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    result.warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log("\n🚀 Next Steps:");
  result.nextSteps.forEach(step => console.log(`   ${step}`));
  
  console.log("\n" + "=" * 60);
}

async function writeResultsFile(result: SetupResult): Promise<void> {
  const resultsPath = `./lazyvim-setup-results.json`;
  
  try {
    await Deno.writeTextFile(
      resultsPath,
      JSON.stringify(result, null, 2)
    );
    console.log(`📄 Results saved to: ${resultsPath}`);
  } catch (error) {
    console.log(`⚠️  Could not write results file: ${error.message}`);
  }
}

// ========================================================
// SAMPLE PROJECT CREATION
// ========================================================

async function createSampleProject(): Promise<void> {
  const projectDir = "./my-deno-app";
  
  console.log(`📁 Creating sample Deno project: ${projectDir}`);
  
  try {
    await Deno.mkdir(projectDir, { recursive: true });
    
    // Create deno.json
    const denoConfig = {
      imports: {
        "@std/assert": "jsr:@std/assert@^1.0.0",
        "@std/http": "jsr:@std/http@^1.0.0"
      },
      tasks: {
        dev: "deno run --watch --allow-net main.ts",
        test: "deno test --allow-all"
      },
      compilerOptions: {
        allowJs: true,
        lib: ["deno.window"],
        strict: true
      },
      fmt: {
        useTabs: false,
        lineWidth: 100,
        indentWidth: 2,
        singleQuote: true
      },
      lint: {
        rules: {
          tags: ["recommended"]
        }
      }
    };
    
    await Deno.writeTextFile(
      `${projectDir}/deno.json`,
      JSON.stringify(denoConfig, null, 2)
    );
    
    // Create main.ts
    const mainTs = `import { serve } from "@std/http";

const handler = (req: Request): Response => {
  const url = new URL(req.url);
  
  if (url.pathname === "/") {
    return new Response("Hello from Deno!", {
      headers: { "content-type": "text/plain" },
    });
  }
  
  return new Response("Not Found", { status: 404 });
};

console.log("Server starting on http://localhost:8000");
serve(handler, { port: 8000 });`;
    
    await Deno.writeTextFile(`${projectDir}/main.ts`, mainTs);
    
    // Create test file
    const testTs = `import { assertEquals } from "@std/assert";

Deno.test("basic test", () => {
  assertEquals(2 + 2, 4);
});

Deno.test("string test", () => {
  assertEquals("hello".toUpperCase(), "HELLO");
});`;
    
    await Deno.writeTextFile(`${projectDir}/main_test.ts`, testTs);
    
    // Create README
    const readme = `# My Deno App

A sample Deno application created by the Universal LazyVim Setup Script.

## Getting Started

\`\`\`bash
# Run the development server
deno task dev

# Run tests
deno task test

# Format code
deno fmt

# Lint code
deno lint
\`\`\`

## Development with Neovim + LazyVim

1. Open the project: \`nvim .\`
2. LazyVim will automatically:
   - Detect this as a Deno project (via deno.json)
   - Start the Deno LSP for intelligent code editing
   - Provide syntax highlighting and autocompletion
   - Enable "Run Test" code lens buttons in test files

## Useful Keybindings (in Deno projects)

- \`<leader>dt\` - Run Deno tests
- \`<leader>df\` - Format with Deno
- \`<leader>dl\` - Lint with Deno  
- \`<leader>dc\` - Cache dependencies
- \`<leader>di\` - Show Deno info
- \`<leader>dr\` - Run code lens action

## Features

- 🚀 Fast development with Deno
- 🎯 Type-safe TypeScript
- 🔧 Built-in formatting and linting
- ✅ Testing with standard library
- 🎨 Modern Neovim IDE experience with LazyVim
`;
    
    await Deno.writeTextFile(`${projectDir}/README.md`, readme);
    
    console.log(`✅ Sample project created in: ${projectDir}`);
    console.log(`🚀 Next: cd ${projectDir} && nvim .`);
    
  } catch (error) {
    console.log(`❌ Failed to create sample project: ${error.message}`);
  }
}

// ========================================================
// CLI ARGUMENT HANDLING
// ========================================================

function printUsage(): void {
  console.log(`
🚀 Universal LazyVim + Deno Setup Script

PHILOSOPHY: One executable, clear configuration, runs anywhere
Following Unix Philosophy principles for maintainable, composable systems.

USAGE:
  deno run -A setup-lazyvim-deno.ts [OPTIONS]

OPTIONS:
  --check         Dry run - check system without installing anything
  --verbose       Show detailed system information and progress
  --create-sample Create a sample Deno project after setup
  --help          Show this help message

EXAMPLES:
  # Full installation
  deno run -A setup-lazyvim-deno.ts

  # Check what would be installed
  deno run -A setup-lazyvim-deno.ts --check

  # Verbose installation with sample project
  deno run -A setup-lazyvim-deno.ts --verbose --create-sample

FEATURES:
  ✅ Universal Linux distribution support (apt, yum, dnf, pacman, etc.)
  ✅ Automatic system detection and package manager selection  
  ✅ Backup existing Neovim configuration
  ✅ Install LazyVim with Deno-optimized configuration
  ✅ LSP integration with denols (Deno Language Server)
  ✅ Code formatting and linting with Deno built-in tools
  ✅ Useful keybindings for Deno development
  ✅ Returns structured data for automation (Unix Philosophy)

SUPPORTED SYSTEMS:
  - Linux: Ubuntu, Debian, Fedora, RHEL, CentOS, Arch, Manjaro, openSUSE, Alpine
  - macOS: With Homebrew
  - Windows: Basic support (experimental)

REQUIREMENTS:
  - Deno runtime (will be installed if missing)
  - Internet connection for downloads
  - sudo access for package installation

RESULTS:
  Script writes detailed results to 'lazyvim-setup-results.json' for 
  programmatic use and automation integration.
`);
}

// ========================================================
// ENTRY POINT
// ========================================================

if (import.meta.main) {
  const args = Deno.args;
  
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    Deno.exit(0);
  }
  
  try {
    await main();
    
    // Create sample project if requested
    if (args.includes('--create-sample')) {
      console.log("\n" + "=" * 60);
      await createSampleProject();
    }
    
  } catch (error) {
    console.error("💥 Fatal error:", error.message);
    if (args.includes('--verbose')) {
      console.error("Stack trace:", error.stack);
    }
    Deno.exit(1);
  }
}

// ========================================================
// EXPORT FOR PROGRAMMATIC USE (Unix Philosophy)
// ========================================================

export {
  detectSystem,
  createInstallationSteps,
  type SystemInfo,
  type SetupResult,
  type InstallationStep,
};