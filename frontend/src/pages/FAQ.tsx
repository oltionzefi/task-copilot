import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string | JSX.Element;
  category: string;
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'What is Task Copilot?',
    answer: 'Task Copilot is an orchestration platform for AI coding agents that helps developers plan, review, and safely execute AI-assisted coding tasks. Each task runs in an isolated git worktree, giving you complete control over your codebase whilst leveraging the power of AI assistants.',
  },
  {
    category: 'Getting Started',
    question: 'How do I install Task Copilot?',
    answer: (
      <>
        First, authenticate with your preferred coding agent. Then run:
        <code className="block bg-muted p-2 rounded mt-2 text-sm">
          npx task-copilot
        </code>
        The application will bind to a random free port and automatically open
        in your browser.
      </>
    ),
  },
  {
    category: 'Getting Started',
    question: 'What are the system requirements?',
    answer: 'Task Copilot works on macOS (Intel and Apple Silicon), Linux, and Windows. You need Node.js (latest LTS version recommended) and authentication with at least one supported coding agent.',
  },
  {
    category: 'Getting Started',
    question: 'Which coding agents are supported?',
    answer: 'Task Copilot supports multiple agents including Claude Code, OpenAI Codex, GitHub Copilot CLI, Gemini CLI, Amp, Cursor Agent CLI, OpenCode, Droid CLI, Claude Code Router, and Qwen Code. Each requires separate installation and authentication.',
  },

  // Projects
  {
    category: 'Projects',
    question: 'How do I create a project?',
    answer: 'Click the "Create Project" button and choose to either create from an existing git repository (browse your file system for recently active repos) or create a blank project (generates a new git repository from scratch). Each project represents a git repository.',
  },
  {
    category: 'Projects',
    question: 'What are setup scripts?',
    answer: 'Setup scripts run before the coding agent executes. Use them to install dependencies (like "npm install" or "cargo build"). This saves time as agents won\'t need to figure out these commands. Remember, each agent runs in a git worktree that likely doesn\'t contain your dependencies or configs.',
  },
  {
    category: 'Projects',
    question: 'What are dev server scripts?',
    answer: 'Dev server scripts run when you press the "Start Dev Server" button from the Preview section. They\'re useful for quickly reviewing work after a coding agent has run, such as starting a local development server.',
  },
  {
    category: 'Projects',
    question: 'What files should I copy to worktrees?',
    answer: 'Use the "Copy Files" setting to specify comma-separated files that should be copied from your original project to each worktree (like .env, configuration files, and local settings). These files are copied after worktree creation but before setup scripts run. Make sure these files are gitignored!',
  },

  // Tasks
  {
    category: 'Tasks',
    question: 'How do I create a task?',
    answer: 'Click the plus (+) icon in the top right of your project kanban page, or press "c" on your keyboard. You can either "Create Task" (adds to board without starting) or "Create & Start" (creates and immediately starts with your default agent).',
  },
  {
    category: 'Tasks',
    question: 'What are task tags?',
    answer: 'Task tags are reusable text snippets for common task structures. Type "@" in the task description or follow-up message, then start typing the tag name to filter and select from available tags. Configure task tags in Settings.',
  },
  {
    category: 'Tasks',
    question: 'What are task attempts?',
    answer: 'A task attempt is an execution of a coding agent on a specific task. You can have multiple attempts per task, each running in its own isolated git worktree. This lets you try different approaches or recover from failures without affecting other work.',
  },
  {
    category: 'Tasks',
    question: 'How do I start a coding agent on a task?',
    answer: 'Open a task and click the plus (+) button to create a task attempt. Choose your agent profile, variant (if available), and base branch. The agent will run in an isolated git worktree. Use "Create & Start" when creating a task to skip this step.',
  },

  // Code Review & Execution
  {
    category: 'Code Review',
    question: 'How do I review code changes?',
    answer: 'Task Copilot provides line-by-line diffs of all changes made by the agent. You can add comments, request changes, and send feedback back to the agent. Each task runs in an isolated git worktree, so you can safely review and test changes before merging.',
  },
  {
    category: 'Code Review',
    question: 'What are git worktrees and why use them?',
    answer: 'Git worktrees allow multiple working directories from the same repository. Task Copilot uses them to isolate each task attempt, preventing agents from interfering with each other or your main branch. This provides complete safety while maintaining full git history.',
  },
  {
    category: 'Code Review',
    question: 'How do I test changes made by an agent?',
    answer: 'Use the Preview panel to start your dev server and test the changes. The dev server runs using the dev server script configured in your project settings. You can also open the worktree directly in your editor to run tests or inspect code.',
  },

  // Settings & Configuration
  {
    category: 'Settings',
    question: 'How do I change the default coding agent?',
    answer: 'Go to Settings → General and select your preferred agent and variant under "Default Agent Configuration". This will be pre-selected when creating new task attempts, though you can override it for each attempt.',
  },
  {
    category: 'Settings',
    question: 'How do I configure my editor integration?',
    answer: 'Go to Settings → General → Editor Integration and select your preferred editor (VS Code, Cursor, Windsurf, Neovim, Emacs, Sublime Text, or Custom). For remote servers, configure Remote SSH settings with your hostname and username.',
  },
  {
    category: 'Settings',
    question: 'What is the Remote SSH configuration?',
    answer: 'When running Task Copilot on a remote server (via tunnel, ngrok, or cloud hosting), Remote SSH configuration allows VSCode-based editors to open projects via SSH instead of assuming localhost. Configure your Remote SSH Host and User in Settings → Editor Integration.',
  },
  {
    category: 'Settings',
    question: 'How do I change the theme?',
    answer: 'Go to Settings → General and switch between light, dark, or system themes.',
  },

  // Integrations
  {
    category: 'Integrations',
    question: 'How do I integrate with Jira?',
    answer: 'Go to Settings → Integrations and configure your Jira connection with your instance URL, email, and API token (create at https://id.atlassian.com/manage-profile/security/api-tokens). You can then sync tasks with Jira issues, create tickets, and track workflow transitions.',
  },
  {
    category: 'Integrations',
    question: 'How do I create pull requests?',
    answer: 'Task Copilot uses the GitHub CLI (gh) for creating pull requests. Ensure gh is installed and authenticated on your system. When completing a task, you can create a PR directly from the UI.',
  },
  {
    category: 'Integrations',
    question: 'What is MCP integration?',
    answer: 'Model Context Protocol (MCP) integration allows coding agents and MCP clients (like Claude Desktop or Raycast) to programmatically create and manage tasks. This is useful for bulk task creation, migrating from other systems, or letting agents create new tasks. Configure in Settings → MCP.',
  },

  // Troubleshooting
  {
    category: 'Troubleshooting',
    question: 'My agent isn\'t running. What should I check?',
    answer: 'First, ensure your coding agent is properly installed and authenticated outside of Task Copilot. Check that setup scripts completed successfully. Verify the base branch exists. Check the task logs for error messages. Make sure any required environment files are included in the "Copy Files" setting.',
  },
  {
    category: 'Troubleshooting',
    question: 'How do I handle rebase conflicts?',
    answer: 'When your task branch has conflicts with the base branch, Task Copilot provides tools to resolve them. You can either manually resolve conflicts in your editor or let the agent help resolve them. The UI will guide you through the process.',
  },
  {
    category: 'Troubleshooting',
    question: 'Can I run multiple tasks in parallel?',
    answer: 'Yes! Since each task runs in an isolated git worktree, you can execute multiple coding agents in parallel without them interfering with each other. This is one of the key benefits of the worktree-based architecture.',
  },
  {
    category: 'Troubleshooting',
    question: 'How do I specify a custom port?',
    answer: (
      <>
        Set the PORT environment variable:
        <code className="block bg-muted p-2 rounded mt-2 text-sm">
          PORT=8080 npx task-copilot
        </code>
      </>
    ),
  },

  // Safety & Best Practices
  {
    category: 'Best Practices',
    question: 'Is it safe to run AI agents?',
    answer: 'Task Copilot runs agents in isolated git worktrees, preventing them from interfering with your main branch or each other. However, agents run with autonomous permissions by default (--dangerously-skip-permissions/--yolo flags), so they can perform system-level actions. Always review their work and maintain backups.',
  },
  {
    category: 'Best Practices',
    question: 'What should I include in task descriptions?',
    answer: 'Be specific and clear about what you want the agent to accomplish. Include relevant context, constraints, and expected outcomes. Use task tags for common patterns. The more detailed your description, the better the agent can understand and complete the task.',
  },
  {
    category: 'Best Practices',
    question: 'When should I create a new task attempt?',
    answer: 'Create new task attempts when: the previous attempt failed and you want to retry, you want to try a different coding agent or approach, you need to work from a different base branch, or you want to iterate on the task with additional context.',
  },
];

const categories = Array.from(new Set(faqData.map((item) => item.category)));

export function FAQ() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const filteredData =
    selectedCategory === 'all'
      ? faqData
      : faqData.filter((item) => item.category === selectedCategory);

  return (
    <div className="w-full h-full overflow-auto bg-background">
      <div className="max-w-4xl mx-auto p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground">
            Everything you need to know about using Task Copilot
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {filteredData.map((item) => {
            const globalIndex = faqData.indexOf(item);
            const isOpen = openItems.has(globalIndex);

            return (
              <div
                key={globalIndex}
                className="border rounded-lg bg-card overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(globalIndex)}
                  className="w-full px-5 py-4 text-left flex items-start justify-between hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <div className="text-xs text-muted-foreground mb-1">
                      {item.category}
                    </div>
                    <div className="font-medium">{item.question}</div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 mt-1',
                      isOpen && 'transform rotate-180'
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 pt-0 text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help Footer */}
        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Still have questions?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Visit our documentation for detailed guides, or reach out to the
            community for support.
          </p>
          <div className="flex gap-3">
            <a
              href="https://taskcopilot.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              View Documentation
            </a>
            <a
              href="https://github.com/BloopAI/task-copilot/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              GitHub Discussions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
