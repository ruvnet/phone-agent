# 📁 Modular SPARC Configuration

This directory contains the modular configuration for the SPARC methodology and its specialized modes. The structure is designed to be maintainable, extensible, and easy to understand.

## 📋 Directory Structure

```
.roomodes.d/
├── index.json           # Main configuration file that includes all modes
├── README.md            # This documentation file
└── modes/               # Directory containing individual mode definitions
    ├── sparc.json       # SPARC Orchestrator mode
    ├── spec-pseudocode.json # Specification Writer mode
    ├── architect.json   # Architect mode
    ├── code.json        # Auto-Coder mode
    ├── tdd.json         # TDD Tester mode
    ├── debug.json       # Debugger mode
    ├── security-review.json # Security Reviewer mode
    ├── docs-writer.json # Documentation Writer mode
    ├── integration.json # System Integrator mode
    ├── post-deployment-monitoring.json # Deployment Monitor mode
    ├── refinement-optimization.json # Optimizer mode
    ├── ask.json         # Ask mode
    ├── devops.json      # DevOps mode
    └── tutorial.json    # SPARC Tutorial mode
```

## 🔄 How It Works

1. The main `.roomodes` file in the project root includes the `index.json` file from this directory.
2. The `index.json` file includes all individual mode definitions from the `modes/` directory.
3. Each mode is defined in its own JSON file with a consistent structure.

## 🛠️ Mode Structure

Each mode file follows this structure:

```json
{
  "slug": "mode-slug",
  "name": "🔍 Mode Name",
  "roleDefinition": "Brief description of the mode's purpose",
  "customInstructions": "Detailed instructions for the mode...",
  "groups": ["read", "edit", "browser", "mcp", "command"],
  "source": "project"
}
```

## ✏️ Modifying Modes

To modify an existing mode:
1. Edit the corresponding JSON file in the `modes/` directory
2. Update the relevant fields as needed
3. Save the file

## ➕ Adding New Modes

To add a new mode:
1. Create a new JSON file in the `modes/` directory
2. Follow the mode structure format
3. Add an includes entry in `index.json`

## 🔍 Benefits of Modular Structure

- **Maintainability**: Each mode is defined in a separate file, making it easier to update
- **Readability**: Smaller files are easier to understand and navigate
- **Collaboration**: Multiple team members can work on different modes simultaneously
- **Version Control**: Changes to individual modes are clearly tracked
- **Extensibility**: New modes can be added without modifying existing ones

## ⚠️ Important Notes

- The main `.roomodes` file must be kept in the project root
- All paths in the includes statements are relative to the project root
- Mode slugs must be unique across all modes
- Changes to mode definitions take effect immediately after saving