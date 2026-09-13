/**
 * Aider CLI Interactive Guide & Studio Application Logic
 */

// 1. Data Store: In-Chat Commands & CLI Startup Flags
const IN_CHAT_COMMANDS = [
  {
    id: "add",
    name: "/add",
    category: "files",
    aliases: ["/a"],
    syntax: "/add <file1> [file2] ...",
    description: "Add one or more files to the chat session so Aider and the LLM can edit them.",
    tags: ["Core", "Context", "Editing"],
    examples: [
      { code: "/add index.html style.css", desc: "Add multiple files to chat" },
      { code: "/add src/**/*.ts", desc: "Add files matching glob patterns" }
    ]
  },
  {
    id: "read-only",
    name: "/read",
    category: "files",
    aliases: ["/r", "/readonly"],
    syntax: "/read <file1> [file2] ...",
    description: "Add files to chat in read-only mode so the AI can reference them without modifying them.",
    tags: ["Context", "Tokens", "Reference"],
    examples: [
      { code: "/read docs/api.md schema.sql", desc: "Provide architectural context without risking edits" }
    ]
  },
  {
    id: "drop",
    name: "/drop",
    category: "files",
    aliases: ["/d", "/remove"],
    syntax: "/drop [file1] [file2] ...",
    description: "Remove files from the active chat context to reduce token usage. If run without args, drops all files.",
    tags: ["Context", "Tokens"],
    examples: [
      { code: "/drop style.css", desc: "Remove a single file from chat" },
      { code: "/drop", desc: "Drop all files from context" }
    ]
  },
  {
    id: "model",
    name: "/model",
    category: "model",
    aliases: ["/m"],
    syntax: "/model <model-name>",
    description: "Switch to a different LLM mid-session (e.g. Sonnet 3.7, GPT-4o, DeepSeek V3/R1).",
    tags: ["LLM", "Model", "Switch"],
    examples: [
      { code: "/model claude-3-7-sonnet", desc: "Switch to Claude 3.7 Sonnet" },
      { code: "/model r1", desc: "Switch to DeepSeek Reasoner R1" },
      { code: "/model deepseek/deepseek-chat", desc: "Switch to DeepSeek V3" }
    ]
  },
  {
    id: "architect",
    name: "/architect",
    category: "model",
    aliases: ["/arch"],
    syntax: "/architect [prompt]",
    description: "Enter or execute Architect mode: reasoning model writes an implementation plan, editor model executes code.",
    tags: ["Workflow", "Reasoning", "Advanced"],
    examples: [
      { code: "/architect Refactor authentication to use JWT middleware", desc: "Plan then execute complex feature" }
    ]
  },
  {
    id: "ask",
    name: "/ask",
    category: "model",
    aliases: ["/question"],
    syntax: "/ask <question>",
    description: "Ask a question about the codebase without allowing Aider to edit files or make git commits.",
    tags: ["Q&A", "Explain", "Read-Only"],
    examples: [
      { code: "/ask Where is user session validation handled?", desc: "Query repo without file changes" }
    ]
  },
  {
    id: "code",
    name: "/code",
    category: "model",
    aliases: [],
    syntax: "/code <instruction>",
    description: "Request code changes directly (standard editing prompt mode).",
    tags: ["Editing", "Default"],
    examples: [
      { code: "/code Add dark mode toggle to the navbar", desc: "Instruct model to write code" }
    ]
  },
  {
    id: "undo",
    name: "/undo",
    category: "git",
    aliases: ["/u"],
    syntax: "/undo",
    description: "Revert the last AI-generated git commit and roll back the conversational context state.",
    tags: ["Git", "Rollback", "Safety"],
    examples: [
      { code: "/undo", desc: "Discard the previous change completely" }
    ]
  },
  {
    id: "diff",
    name: "/diff",
    category: "git",
    aliases: [],
    syntax: "/diff",
    description: "Display git diff between current working directory and initial session state or last commit.",
    tags: ["Git", "Inspection"],
    examples: [
      { code: "/diff", desc: "Inspect pending or recent changes" }
    ]
  },
  {
    id: "commit",
    name: "/commit",
    category: "git",
    aliases: ["/c"],
    syntax: "/commit [commit-message]",
    description: "Commit any unstaged changes to git with an optional custom message or AI-generated message.",
    tags: ["Git", "Save"],
    examples: [
      { code: "/commit", desc: "Let AI generate commit message for unstaged files" },
      { code: "/commit feat: implement navigation bar", desc: "Commit with custom message" }
    ]
  },
  {
    id: "test",
    name: "/test",
    category: "session",
    aliases: [],
    syntax: "/test <command>",
    description: "Run test suite. If tests fail, automatically send the error trace to the LLM to fix the code.",
    tags: ["Testing", "TDD", "Auto-Fix"],
    examples: [
      { code: "/test npm test", desc: "Run Jest/Vitest test suite" },
      { code: "/test pytest tests/", desc: "Run Python tests and feed output to LLM" }
    ]
  },
  {
    id: "lint",
    name: "/lint",
    category: "session",
    aliases: [],
    syntax: "/lint [command]",
    description: "Run a linter and feed output to the LLM to automatically fix any formatting or syntax errors.",
    tags: ["Linting", "Formatting", "Auto-Fix"],
    examples: [
      { code: "/lint eslint . --fix", desc: "Run ESLint and resolve lingering errors" }
    ]
  },
  {
    id: "web",
    name: "/web",
    category: "files",
    aliases: [],
    syntax: "/web <url>",
    description: "Scrape the content of a web page and inject its markdown into the chat as reference context.",
    tags: ["Web", "Docs", "Context"],
    examples: [
      { code: "/web https://docs.github.com/rest", desc: "Fetch live API documentation for reference" }
    ]
  },
  {
    id: "tokens",
    name: "/tokens",
    category: "session",
    aliases: ["/context"],
    syntax: "/tokens",
    description: "Show token usage breakdown including chat history, repo map, system prompts, and remaining budget.",
    tags: ["Tokens", "Cost", "Budget"],
    examples: [
      { code: "/tokens", desc: "View detailed token consumption table" }
    ]
  },
  {
    id: "map",
    name: "/map",
    category: "session",
    aliases: [],
    syntax: "/map",
    description: "Print the current Tree-Sitter repository map representation that is sent to the LLM.",
    tags: ["Repo-Map", "Tree-Sitter"],
    examples: [
      { code: "/map", desc: "Inspect symbols identified in the repo" }
    ]
  },
  {
    id: "clear",
    name: "/clear",
    category: "session",
    aliases: ["/reset"],
    syntax: "/clear",
    description: "Clear the conversation history while keeping added files in context.",
    tags: ["Session", "History"],
    examples: [
      { code: "/clear", desc: "Free up token context for a brand new topic" }
    ]
  },
  {
    id: "voice",
    name: "/voice",
    category: "session",
    aliases: [],
    syntax: "/voice",
    description: "Record audio from your microphone, transcribe it with Whisper, and submit as prompt.",
    tags: ["Audio", "Whisper", "Voice"],
    examples: [
      { code: "/voice", desc: "Speak your prompt hands-free" }
    ]
  },
  {
    id: "help",
    name: "/help",
    category: "session",
    aliases: ["/h", "/?"],
    syntax: "/help [command]",
    description: "Show general help or detailed documentation for a specific in-chat command.",
    tags: ["Docs", "Help"],
    examples: [
      { code: "/help", desc: "Show all available in-chat commands" },
      { code: "/help model", desc: "Get help on the /model command" }
    ]
  }
];

const CLI_FLAGS = [
  {
    id: "flag-model",
    name: "--model <model-name>",
    category: "model",
    description: "Specify the main LLM to use for editing and conversation (e.g. claude-3-7-sonnet, gpt-4o, deepseek/deepseek-chat).",
    tags: ["Model", "Essential"],
    examples: [
      { code: "aider --model claude-3-7-sonnet", desc: "Launch with Anthropic Claude 3.7 Sonnet" },
      { code: "aider --model ollama/qwen2.5-coder:32b", desc: "Launch with local Ollama model" }
    ]
  },
  {
    id: "flag-editor-model",
    name: "--editor-model <model-name>",
    category: "model",
    description: "Specify a secondary model used specifically for applying code edits in Architect mode.",
    tags: ["Model", "Architect"],
    examples: [
      { code: "aider --model o3-mini --editor-model claude-3-7-sonnet", desc: "High reasoning architect with fast editor" }
    ]
  },
  {
    id: "flag-edit-format",
    name: "--edit-format <format>",
    category: "model",
    description: "Select the edit protocol: diff (search/replace), whole (full files), udiff (unified diff), or architect.",
    tags: ["Format", "Diff"],
    examples: [
      { code: "aider --edit-format diff", desc: "Use SEARCH/REPLACE blocks" },
      { code: "aider --edit-format architect", desc: "Enable dual-phase reasoning & editing" }
    ]
  },
  {
    id: "flag-read",
    name: "--read <file>",
    category: "files",
    description: "Specify files to load in read-only mode upon startup.",
    tags: ["Files", "Reference"],
    examples: [
      { code: "aider --read docs/API.md src/index.ts", desc: "Start with docs loaded read-only" }
    ]
  },
  {
    id: "flag-auto-commits",
    name: "--auto-commits / --no-auto-commits",
    category: "git",
    description: "Enable or disable automatic git commits after every successful AI code alteration.",
    tags: ["Git", "Safety"],
    examples: [
      { code: "aider --no-auto-commits", desc: "Manually review and commit changes yourself" }
    ]
  },
  {
    id: "flag-commit-prompt",
    name: "--commit-prompt <prompt>",
    category: "git",
    description: "Customize the instructions provided to the LLM when generating commit messages.",
    tags: ["Git", "Custom"],
    examples: [
      { code: 'aider --commit-prompt "Use Conventional Commits format with jira ticket ABC-100"', desc: "Enforce commit guidelines" }
    ]
  },
  {
    id: "flag-map-tokens",
    name: "--map-tokens <int>",
    category: "advanced",
    description: "Set max tokens allocated to the tree-sitter repo map (default: 1024, 0 disables map).",
    tags: ["Repo-Map", "Tokens"],
    examples: [
      { code: "aider --map-tokens 2048", desc: "Double the repository map size for large codebases" },
      { code: "aider --map-tokens 0", desc: "Disable map to save tokens on tiny scripts" }
    ]
  },
  {
    id: "flag-test-cmd",
    name: "--test-cmd <cmd>",
    category: "advanced",
    description: "Specify the default test command executed by /test or auto-test loops.",
    tags: ["Test", "Automation"],
    examples: [
      { code: 'aider --test-cmd "npm test -- --bail"', desc: "Set fast fail test command" }
    ]
  },
  {
    id: "flag-auto-test",
    name: "--auto-test / --no-auto-test",
    category: "advanced",
    description: "Automatically run test suite after each change and prompt LLM to fix test failures.",
    tags: ["Test", "Loop"],
    examples: [
      { code: "aider --auto-test --test-cmd pytest", desc: "Run pytest automatically after every code edit" }
    ]
  },
  {
    id: "flag-browser",
    name: "--browser",
    category: "appearance",
    description: "Launch Aider's interactive browser-based web GUI instead of the terminal CLI.",
    tags: ["Web", "GUI"],
    examples: [
      { code: "aider --browser", desc: "Open Aider web interface at localhost:8501" }
    ]
  },
  {
    id: "flag-watch-prompts",
    name: "--watch-prompts",
    category: "advanced",
    description: "Watch `.aider.prompt.md` file for edits and auto-submit the contents as prompts on save.",
    tags: ["Workflow", "Editor"],
    examples: [
      { code: "aider --watch-prompts", desc: "Write prompts directly in your VS Code / Vim buffer" }
    ]
  },
  {
    id: "flag-dark-mode",
    name: "--dark-mode / --light-mode",
    category: "appearance",
    description: "Set syntax highlighting and color theme optimized for dark or light terminal backgrounds.",
    tags: ["Theme", "UI"],
    examples: [
      { code: "aider --dark-mode", desc: "Optimize colors for dark background" }
    ]
  },
  {
    id: "flag-stream",
    name: "--stream / --no-stream",
    category: "appearance",
    description: "Enable or disable live streaming of LLM response tokens.",
    tags: ["Streaming", "UI"],
    examples: [
      { code: "aider --stream", desc: "Stream response as it generates" }
    ]
  },
  {
    id: "flag-voice",
    name: "--voice",
    category: "advanced",
    description: "Enable voice recording mode via local microphone transcription.",
    tags: ["Voice", "Whisper"],
    examples: [
      { code: "aider --voice", desc: "Enable microphone prompts" }
    ]
  }
];

// 2. Simulated State for Sandbox
const simState = {
  model: "claude-3-7-sonnet",
  files: ["index.html", "style.css"],
  readOnly: ["README.md"],
  tokens: { used: 1024, max: "200k" },
  history: []
};

// 3. Initialization
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initThemeToggle();
  renderInChatCards(IN_CHAT_COMMANDS);
  renderCliCards(CLI_FLAGS);
  initFilterPills();
  initSearch();
  initBuilder();
  initSimulator();
  initModal();
  initMiniCopyButtons();
});

// Tab Switching
function initTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  const panes = document.querySelectorAll(".tab-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetTab = tab.dataset.tab;

      tabs.forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      panes.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      const activePane = document.getElementById(`tab-${targetTab}`);
      if (activePane) activePane.classList.add("active");
    });
  });
}

// Theme Toggle
function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");
  toggleBtn.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark-theme");
    if (isDark) {
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
    }
  });
}

// Render In-Chat Commands Cards
function renderInChatCards(list) {
  const grid = document.getElementById("in-chat-grid");
  const countEl = document.getElementById("count-chat-all");
  if (countEl) countEl.textContent = IN_CHAT_COMMANDS.length;

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-results">No matching in-chat commands found. Try another search.</div>`;
    return;
  }

  grid.innerHTML = list.map(item => `
    <div class="cmd-card" data-id="${item.id}" data-type="chat">
      <div class="cmd-card-header">
        <span class="cmd-name">${escapeHtml(item.name)}</span>
        <span class="badge">${escapeHtml(item.category)}</span>
      </div>
      <p class="cmd-desc">${escapeHtml(item.description)}</p>
      <div class="cmd-meta">
        ${item.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
      </div>
      <div class="cmd-card-footer">
        <span class="syntax-preview"><code>${escapeHtml(item.syntax)}</code></span>
        <button class="btn-mini-action" data-action="details">Details &rarr;</button>
      </div>
    </div>
  `).join("");

  attachCardEvents(grid, IN_CHAT_COMMANDS, "In-Chat Command");
}

// Render CLI Startup Flags Cards
function renderCliCards(list) {
  const grid = document.getElementById("cli-flags-grid");
  const countEl = document.getElementById("count-cli-all");
  if (countEl) countEl.textContent = CLI_FLAGS.length;

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-results">No matching CLI flags found. Try another search.</div>`;
    return;
  }

  grid.innerHTML = list.map(item => `
    <div class="cmd-card" data-id="${item.id}" data-type="cli">
      <div class="cmd-card-header">
        <span class="flag-name">${escapeHtml(item.name)}</span>
        <span class="badge badge-warning">${escapeHtml(item.category)}</span>
      </div>
      <p class="cmd-desc">${escapeHtml(item.description)}</p>
      <div class="cmd-meta">
        ${item.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
      </div>
      <div class="cmd-card-footer">
        <span class="syntax-preview">CLI Option</span>
        <button class="btn-mini-action" data-action="details">Details &rarr;</button>
      </div>
    </div>
  `).join("");

  attachCardEvents(grid, CLI_FLAGS, "CLI Flag");
}

function attachCardEvents(grid, dataset, typeLabel) {
  grid.querySelectorAll(".cmd-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      const found = dataset.find(x => x.id === id);
      if (found) openCommandModal(found, typeLabel);
    });
  });
}

// Filter Pills Logic
function initFilterPills() {
  const inChatPills = document.querySelectorAll("#in-chat-filters .pill");
  inChatPills.forEach(pill => {
    pill.addEventListener("click", () => {
      inChatPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const filter = pill.dataset.filter;
      if (filter === "all") {
        renderInChatCards(IN_CHAT_COMMANDS);
      } else {
        const filtered = IN_CHAT_COMMANDS.filter(cmd => cmd.category === filter);
        renderInChatCards(filtered);
      }
    });
  });

  const cliPills = document.querySelectorAll("#cli-filters .pill");
  cliPills.forEach(pill => {
    pill.addEventListener("click", () => {
      cliPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const filter = pill.dataset.filter;
      if (filter === "all") {
        renderCliCards(CLI_FLAGS);
      } else {
        const filtered = CLI_FLAGS.filter